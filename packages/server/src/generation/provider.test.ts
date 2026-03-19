import { describe, it, expect, afterEach } from "bun:test";
import {
  MockProvider,
  GenerationParseError,
  GenerationTimeoutError,
  GenerationApiError,
  GenerationRateLimitError,
  AnthropicProvider,
  createProvider,
  getThrottleStatus,
  retryWithBackoff,
  isTransientGenerationError,
  notifyRateLimit,
  _resetSemaphoreForTesting,
} from "./provider.js";

// ── INV-1: MockProvider input validation contract ─────────────────────────────

describe("MockProvider rejects invalid input", () => {
  it("throws GenerationParseError for null, undefined, empty string, and invalid JSON", async () => {
    const gen = (data: unknown) =>
      new MockProvider(data).generate({ systemPrompt: "s", userPrompt: "u", schema: {} }).catch((e) => e);

    for (const bad of [null, undefined, "", "{not valid json"]) {
      const err = await gen(bad);
      expect(err).toBeInstanceOf(GenerationParseError);
    }
  });

  it("parses valid JSON string input to object", async () => {
    const provider = new MockProvider('{"key": "value"}');
    const result = await provider.generate<{ key: string }>({ systemPrompt: "s", userPrompt: "u", schema: {} });
    expect(result.key).toBe("value");
  });
});

// ── INV-2: createProvider factory ─────────────────────────────────────────────

describe("createProvider factory", () => {
  it("returns MockProvider for 'mock' and AnthropicProvider for 'anthropic'", () => {
    expect(createProvider("mock", { data: { ok: true } })).toBeInstanceOf(MockProvider);
    expect(createProvider("anthropic")).toBeInstanceOf(AnthropicProvider);
  });
});

// ── Semaphore invariant tests ─────────────────────────────────────────────────
//
// We test the semaphore logic in isolation using a self-contained replica. The
// real module-level semaphore in provider.ts wraps AnthropicProvider.generate(),
// but testing against live Anthropic calls is out of scope. Instead we verify
// the semaphore contract and observe the exported getThrottleStatus().

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** A minimal semaphore replica matching provider.ts implementation, for isolated testing. */
class TestSemaphore {
  private active = 0;
  private readonly queue: (() => void)[] = [];
  constructor(private readonly limit: number) {}
  async acquire(): Promise<void> {
    if (this.active < this.limit) { this.active++; return; }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }
  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) { this.active++; next(); }
  }
  status() { return { active: this.active, queued: this.queue.length, limit: this.limit }; }
}

describe("Semaphore — INV-1: active count never exceeds limit", () => {
  it("peak active stays at or below the configured limit under concurrent load", async () => {
    const limit = 3;
    const sem = new TestSemaphore(limit);
    let peak = 0;

    async function task() {
      await sem.acquire();
      peak = Math.max(peak, sem.status().active);
      await delay(5);
      sem.release();
    }

    await Promise.all(Array.from({ length: 10 }, () => task()));
    expect(peak).toBeLessThanOrEqual(limit);
    expect(sem.status().active).toBe(0);
    expect(sem.status().queued).toBe(0);
  });
});

describe("Semaphore — INV-2: all queued requests eventually resolve (no deadlock)", () => {
  it("6 tasks through a limit-2 semaphore all complete", async () => {
    const limit = 2;
    const sem = new TestSemaphore(limit);
    const results: number[] = [];

    await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        sem.acquire().then(async () => {
          await delay(2);
          results.push(i);
          sem.release();
        }),
      ),
    );

    expect(results.length).toBe(6);
    expect(sem.status().active).toBe(0);
    expect(sem.status().queued).toBe(0);
  });
});

describe("Semaphore — INV-3: error does not block queued tasks", () => {
  it("failing task releases slot so queued tasks proceed", async () => {
    const limit = 1;
    const sem = new TestSemaphore(limit);
    const results: string[] = [];

    async function failingTask() {
      await sem.acquire();
      try { throw new Error("task failed"); }
      finally { sem.release(); }
    }

    async function successTask(label: string) {
      await sem.acquire();
      try { results.push(label); }
      finally { sem.release(); }
    }

    await Promise.all([
      failingTask().catch(() => {/* expected */}),
      successTask("a"),
      successTask("b"),
    ]);

    expect(results).toContain("a");
    expect(results).toContain("b");
    expect(sem.status().active).toBe(0);
  });
});

describe("Semaphore — N+1 concurrent calls", () => {
  it("first N proceed immediately, (N+1)th queues and completes after a slot opens", async () => {
    const limit = 3;
    const sem = new TestSemaphore(limit);

    // Fill all slots
    for (let i = 0; i < limit; i++) await sem.acquire();
    expect(sem.status().active).toBe(limit);
    expect(sem.status().queued).toBe(0);

    // One more — should queue
    let extraAcquired = false;
    const extra = sem.acquire().then(() => { extraAcquired = true; });

    await delay(0); // yield to event loop
    expect(sem.status().queued).toBe(1);
    expect(extraAcquired).toBe(false);

    // Release one — extra should proceed
    sem.release();
    await extra;
    expect(extraAcquired).toBe(true);
    expect(sem.status().queued).toBe(0);

    // Clean up remaining slots
    for (let i = 0; i < limit; i++) sem.release();
    expect(sem.status().active).toBe(0);
  });
});

describe("Semaphore — rapid sequential calls (no starvation)", () => {
  it("20 tasks through a limit-2 semaphore all complete in order", async () => {
    const limit = 2;
    const sem = new TestSemaphore(limit);
    const completed: number[] = [];

    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        sem.acquire().then(async () => {
          completed.push(i);
          sem.release();
        }),
      ),
    );

    expect(completed.length).toBe(20);
    expect(sem.status().active).toBe(0);
  });
});

describe("Semaphore — INV-4: module-level singleton (getThrottleStatus)", () => {
  it("getThrottleStatus returns consistent shape and limit from the shared singleton", () => {
    const s1 = getThrottleStatus();
    const s2 = getThrottleStatus();
    expect(typeof s1.active).toBe("number");
    expect(typeof s1.queued).toBe("number");
    expect(typeof s1.limit).toBe("number");
    expect(s1.limit).toBeGreaterThan(0);
    // Same singleton — limit is stable
    expect(s1.limit).toBe(s2.limit);
  });

  it("multiple AnthropicProvider instances share the same semaphore limit", () => {
    // Creating multiple instances should not change the limit
    const limitBefore = getThrottleStatus().limit;
    createProvider("anthropic");
    createProvider("anthropic");
    expect(getThrottleStatus().limit).toBe(limitBefore);
  });
});

// ── Error type distinction ────────────────────────────────────────────────────

describe("GenerationRateLimitError — distinct from other error types", () => {
  it("is distinct from GenerationApiError and GenerationParseError", () => {
    const rateLimit = new GenerationRateLimitError(5000);
    const apiError = new GenerationApiError("api failed");
    const parseError = new GenerationParseError("bad json");

    expect(rateLimit).toBeInstanceOf(GenerationRateLimitError);
    expect(rateLimit).not.toBeInstanceOf(GenerationApiError);
    expect(rateLimit).not.toBeInstanceOf(GenerationParseError);

    expect(apiError).toBeInstanceOf(GenerationApiError);
    expect(apiError).not.toBeInstanceOf(GenerationRateLimitError);

    expect(parseError).toBeInstanceOf(GenerationParseError);
    expect(parseError).not.toBeInstanceOf(GenerationRateLimitError);
  });

  it("stores retryAfterMs when provided", () => {
    const err = new GenerationRateLimitError(12000);
    expect(err.retryAfterMs).toBe(12000);
  });

  it("retryAfterMs is undefined when not provided", () => {
    const err = new GenerationRateLimitError();
    expect(err.retryAfterMs).toBeUndefined();
  });
});

describe("isTransientGenerationError", () => {
  it("returns true for GenerationRateLimitError, GenerationTimeoutError, GenerationApiError", () => {
    expect(isTransientGenerationError(new GenerationRateLimitError())).toBe(true);
    expect(isTransientGenerationError(new GenerationTimeoutError(30000))).toBe(true);
    expect(isTransientGenerationError(new GenerationApiError("api fail"))).toBe(true);
  });

  it("returns false for GenerationParseError and plain Error", () => {
    expect(isTransientGenerationError(new GenerationParseError("bad json"))).toBe(false);
    expect(isTransientGenerationError(new Error("generic"))).toBe(false);
    expect(isTransientGenerationError(null)).toBe(false);
    expect(isTransientGenerationError("string error")).toBe(false);
  });
});

// ── retryWithBackoff — retry count invariants ─────────────────────────────────

const noSleep = () => Promise.resolve();

describe("retryWithBackoff — retry count for transient errors", () => {
  it("retries up to maxAttempts-1 times on GenerationRateLimitError before giving up", async () => {
    let calls = 0;
    const fn = () => {
      calls++;
      throw new GenerationRateLimitError();
    };

    await expect(
      retryWithBackoff(fn, { maxAttempts: 4, baseDelayMs: 0 }, noSleep),
    ).rejects.toBeInstanceOf(GenerationRateLimitError);

    // 4 total attempts = 1 initial + 3 retries
    expect(calls).toBe(4);
  });

  it("retries on GenerationTimeoutError with same count", async () => {
    let calls = 0;
    const fn = () => {
      calls++;
      throw new GenerationTimeoutError(30000);
    };

    await expect(
      retryWithBackoff(fn, { maxAttempts: 3, baseDelayMs: 0 }, noSleep),
    ).rejects.toBeInstanceOf(GenerationTimeoutError);

    expect(calls).toBe(3);
  });

  it("retries on GenerationApiError", async () => {
    let calls = 0;
    const fn = () => {
      calls++;
      throw new GenerationApiError("server error");
    };

    await expect(
      retryWithBackoff(fn, { maxAttempts: 3, baseDelayMs: 0 }, noSleep),
    ).rejects.toBeInstanceOf(GenerationApiError);

    expect(calls).toBe(3);
  });

  it("does NOT retry on GenerationParseError (non-transient)", async () => {
    let calls = 0;
    const fn = () => {
      calls++;
      throw new GenerationParseError("bad JSON");
    };

    await expect(
      retryWithBackoff(fn, { maxAttempts: 5, baseDelayMs: 0 }, noSleep),
    ).rejects.toBeInstanceOf(GenerationParseError);

    // Should fail on the first attempt with no retries
    expect(calls).toBe(1);
  });

  it("does NOT retry on plain Error (non-transient)", async () => {
    let calls = 0;
    const fn = () => {
      calls++;
      throw new Error("generic network error");
    };

    await expect(
      retryWithBackoff(fn, { maxAttempts: 5, baseDelayMs: 0 }, noSleep),
    ).rejects.toBeInstanceOf(Error);

    expect(calls).toBe(1);
  });

  it("succeeds on second attempt after initial transient failure", async () => {
    let calls = 0;
    const fn = () => {
      calls++;
      if (calls === 1) throw new GenerationRateLimitError();
      return Promise.resolve("ok");
    };

    const result = await retryWithBackoff(fn, { maxAttempts: 4, baseDelayMs: 0 }, noSleep);
    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });
});

describe("retryWithBackoff — backoff delay uses retry-after on rate limit", () => {
  it("passes retryAfterMs from GenerationRateLimitError to sleepFn on first retry", async () => {
    const delays: number[] = [];
    const sleepFn = (ms: number) => { delays.push(ms); return Promise.resolve(); };

    let calls = 0;
    const fn = () => {
      calls++;
      if (calls <= 2) throw new GenerationRateLimitError(5000); // retry-after 5s
      return Promise.resolve("done");
    };

    await retryWithBackoff(fn, { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 30000 }, sleepFn);

    // First two failures had retry-after=5000, so delay should be 5000 each
    expect(delays[0]).toBe(5000);
    expect(delays[1]).toBe(5000);
  });

  it("caps retry-after at maxDelayMs", async () => {
    const delays: number[] = [];
    const sleepFn = (ms: number) => { delays.push(ms); return Promise.resolve(); };

    let calls = 0;
    const fn = () => {
      calls++;
      if (calls === 1) throw new GenerationRateLimitError(120000); // retry-after 2min
      return Promise.resolve("done");
    };

    await retryWithBackoff(fn, { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 30000 }, sleepFn);

    // Should be capped at maxDelayMs=30000
    expect(delays[0]).toBe(30000);
  });

  it("sleepFn is NOT called on the last failing attempt", async () => {
    const delays: number[] = [];
    const sleepFn = (ms: number) => { delays.push(ms); return Promise.resolve(); };

    const fn = () => { throw new GenerationRateLimitError(); };

    await expect(
      retryWithBackoff(fn, { maxAttempts: 3, baseDelayMs: 0 }, sleepFn),
    ).rejects.toBeInstanceOf(GenerationRateLimitError);

    // maxAttempts=3: attempt 0 fails→sleep, attempt 1 fails→sleep, attempt 2 fails→no sleep
    expect(delays.length).toBe(2);
  });
});

// ── Adaptive concurrency via notifyRateLimit ──────────────────────────────────

describe("notifyRateLimit — reduces semaphore concurrency on 429", () => {
  afterEach(() => {
    // Restore module semaphore to default after each test to avoid cross-test pollution
    _resetSemaphoreForTesting();
  });

  it("reduces getThrottleStatus().limit to 2 when called", () => {
    notifyRateLimit();
    expect(getThrottleStatus().limit).toBe(2);
  });

  it("calling notifyRateLimit multiple times keeps limit at 2 (idempotent reduction)", () => {
    notifyRateLimit();
    notifyRateLimit();
    expect(getThrottleStatus().limit).toBe(2);
  });

  it("_resetSemaphoreForTesting restores limit to original value", () => {
    const original = getThrottleStatus().limit;
    notifyRateLimit();
    expect(getThrottleStatus().limit).toBe(2);
    _resetSemaphoreForTesting();
    expect(getThrottleStatus().limit).toBe(original);
  });
});
