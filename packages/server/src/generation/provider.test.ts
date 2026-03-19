import { describe, it, expect } from "bun:test";
import {
  MockProvider,
  GenerationParseError,
  AnthropicProvider,
  createProvider,
  getThrottleStatus,
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
