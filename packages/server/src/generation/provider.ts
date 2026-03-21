import Anthropic from "@anthropic-ai/sdk";

// ── Options ───────────────────────────────────────────────────────────────────

export interface GenerationOptions {
  model?: string;
  timeout?: number;   // ms, default 30000
  maxTokens?: number; // default 4096
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class GenerationTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Generation timed out after ${timeoutMs}ms`);
    this.name = "GenerationTimeoutError";
  }
}

export class GenerationParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationParseError";
  }
}

export class GenerationApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "GenerationApiError";
  }
}

/** Thrown when the API returns a 429 rate-limit response (after SDK retries are exhausted). */
export class GenerationRateLimitError extends Error {
  constructor(public readonly retryAfterMs?: number) {
    super(`Generation rate limited${retryAfterMs !== undefined ? `, retry after ${retryAfterMs}ms` : ""}`);
    this.name = "GenerationRateLimitError";
  }
}

// ── Retry with backoff ────────────────────────────────────────────────────────

export interface RetryBackoffOptions {
  /** Maximum total attempts including the first. Default: 5 */
  maxAttempts?: number;
  /** Base delay for exponential backoff, ms. Default: 1000 */
  baseDelayMs?: number;
  /** Maximum delay cap, ms. Default: 30000 */
  maxDelayMs?: number;
}

/** Returns true for errors that warrant a retry (transient API / network issues). */
export function isTransientGenerationError(err: unknown): boolean {
  return (
    err instanceof GenerationRateLimitError ||
    err instanceof GenerationTimeoutError ||
    err instanceof GenerationApiError
  );
}

function backoffDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  err: unknown,
): number {
  // Respect Retry-After header from 429 responses
  if (err instanceof GenerationRateLimitError && err.retryAfterMs !== undefined) {
    return Math.min(err.retryAfterMs, maxDelayMs);
  }
  // Exponential backoff with ±20% jitter
  const exp = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exp, maxDelayMs);
  return Math.floor(capped * (0.8 + Math.random() * 0.4));
}

/**
 * Retry `fn` on transient generation errors (429, timeout, API errors) with
 * exponential backoff. Non-transient errors (parse errors, validation errors)
 * are re-thrown immediately without retrying.
 *
 * INV: After maxAttempts exhausted, re-throws the last error.
 *
 * @param fn        The async function to retry.
 * @param options   Retry tuning (maxAttempts, baseDelayMs, maxDelayMs).
 * @param sleepFn   Injectable sleep for unit tests (default: real setTimeout).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryBackoffOptions,
  sleepFn: (ms: number) => Promise<void> = (ms) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 5;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  const maxDelayMs = options?.maxDelayMs ?? 30000;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Only retry transient errors; surface non-transient errors immediately
      if (!isTransientGenerationError(err) || attempt === maxAttempts - 1) {
        throw err;
      }
      const delay = backoffDelayMs(attempt, baseDelayMs, maxDelayMs, err);
      await sleepFn(delay);
    }
  }
  throw lastError;
}

// ── Provider interface ────────────────────────────────────────────────────────

export interface GenerationProvider {
  generate<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: object;
    options?: GenerationOptions;
  }): Promise<T>;
}

// ── CapturingProvider (wraps any provider, records all prompts) ───────────────

export interface CapturedPrompt {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

/**
 * Transparent wrapper that records every generate() call's prompts.
 * Use in the orchestrator / game runner to capture prompts for audit.
 */
export class CapturingProvider implements GenerationProvider {
  public readonly calls: CapturedPrompt[] = [];

  constructor(private readonly inner: GenerationProvider) {}

  async generate<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: object;
    options?: GenerationOptions;
  }): Promise<T> {
    this.calls.push({
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      model: params.options?.model,
    });
    return this.inner.generate(params);
  }
}

// ── MockProvider ──────────────────────────────────────────────────────────────

export class MockProvider implements GenerationProvider {
  private callCount = 0;
  constructor(private readonly data: unknown) {}

  async generate<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: object;
    options?: GenerationOptions;
  }): Promise<T> {
    const timeout = params.options?.timeout ?? 30000;
    const idx = this.callCount++;

    // Validate that the canned data is parseable JSON (non-empty)
    if (this.data === undefined || this.data === null || this.data === "") {
      throw new GenerationParseError("MockProvider: empty response cannot be parsed");
    }

    // If the data is a string, try to parse it as JSON
    if (typeof this.data === "string") {
      const trimmed = this.data.trim();
      if (trimmed === "") {
        throw new GenerationParseError("MockProvider: empty string response cannot be parsed");
      }
      try {
        const parsed = JSON.parse(trimmed) as T;
        return parsed;
      } catch {
        throw new GenerationParseError(`MockProvider: response is not valid JSON: ${this.data}`);
      }
    }

    // Simulate timeout behaviour: if data is a special sentinel, reject after timeout
    void timeout; // timeout is not enforced by mock — it resolves immediately

    // Deep-clone and vary labels to avoid cross-slot duplicate detection
    const cloned = JSON.parse(JSON.stringify(this.data));
    if (cloned && Array.isArray(cloned.options)) {
      for (const opt of cloned.options) {
        if (typeof opt.label === "string") {
          opt.label = `${opt.label} (v${idx})`;
        }
      }
    }
    return cloned as T;
  }
}

// ── Semaphore ─────────────────────────────────────────────────────────────────

class Semaphore {
  private active = 0;
  private _limit: number;
  private readonly queue: (() => void)[] = [];

  constructor(initialLimit: number) {
    this._limit = initialLimit;
  }

  async acquire(): Promise<void> {
    if (this.active < this._limit) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => this.queue.push(resolve));
  }

  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) {
      this.active++;
      next();
    }
  }

  /**
   * Dynamically change the concurrency limit. If the new limit is higher than
   * the current limit, waiting tasks are immediately promoted up to the new
   * limit. If lower, in-flight tasks are unaffected but new acquires queue.
   */
  setLimit(newLimit: number): void {
    this._limit = Math.max(1, newLimit);
    // Wake up queued tasks if limit was raised
    while (this.active < this._limit && this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.active++;
      next();
    }
  }

  status(): { active: number; queued: number; limit: number } {
    return { active: this.active, queued: this.queue.length, limit: this._limit };
  }
}

const RATE_LIMIT_CONCURRENCY = 2;
const RATE_LIMIT_RESTORE_MS = 60_000;

// Module-level singleton — lazily initialized on first use so runtime env vars take effect
let _semaphore: Semaphore | undefined;
let _defaultMaxConcurrent: number | undefined;

function getSemaphore(): Semaphore {
  if (!_semaphore) {
    const raw = Number(process.env.GEN_MAX_CONCURRENT);
    const limit = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 15;
    _defaultMaxConcurrent = limit;
    _semaphore = new Semaphore(limit);
  }
  return _semaphore;
}

function getDefaultMaxConcurrent(): number {
  getSemaphore(); // ensure _defaultMaxConcurrent is set
  return _defaultMaxConcurrent!;
}

let _rateLimitRestoreTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Reduce the global concurrency limit to RATE_LIMIT_CONCURRENCY for
 * RATE_LIMIT_RESTORE_MS after a rate limit hit. Subsequent 429s reset the
 * restore timer, extending the throttle window.
 */
export function notifyRateLimit(): void {
  getSemaphore().setLimit(RATE_LIMIT_CONCURRENCY);
  if (_rateLimitRestoreTimer) clearTimeout(_rateLimitRestoreTimer);
  _rateLimitRestoreTimer = setTimeout(() => {
    _rateLimitRestoreTimer = undefined;
    getSemaphore().setLimit(getDefaultMaxConcurrent());
  }, RATE_LIMIT_RESTORE_MS);
}

/** Returns current throttle stats for observability. */
export function getThrottleStatus(): { active: number; queued: number; limit: number } {
  return getSemaphore().status();
}

/**
 * Restore the module semaphore to its default limit immediately.
 * For use in tests only — call after tests that invoke notifyRateLimit().
 * @internal
 */
export function _resetSemaphoreForTesting(): void {
  if (_rateLimitRestoreTimer) {
    clearTimeout(_rateLimitRestoreTimer);
    _rateLimitRestoreTimer = undefined;
  }
  getSemaphore().setLimit(getDefaultMaxConcurrent());
}

// ── AnthropicProvider ─────────────────────────────────────────────────────────

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_TOKENS = 16384;

export class AnthropicProvider implements GenerationProvider {
  private readonly client: Anthropic;

  constructor(apiKey?: string) {
    // maxRetries: 5 — SDK handles transient 429/5xx with built-in exponential
    // backoff before throwing. The game retry layer adds further resilience on
    // top of these SDK retries.
    this.client = new Anthropic({ apiKey, maxRetries: 5 });
  }

  async generate<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: object;
    options?: GenerationOptions;
  }): Promise<T> {
    const { systemPrompt, userPrompt, schema, options } = params;
    const model = options?.model ?? DEFAULT_MODEL;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;

    const semStatus = getSemaphore().status();
    console.log(`[provider] acquire semaphore (active=${semStatus.active}, queued=${semStatus.queued}, limit=${semStatus.limit}, model=${model})`);
    await getSemaphore().acquire();
    console.log(`[provider] acquired — calling ${model} (timeout=${timeout}ms, maxTokens=${maxTokens})`);
    const callStart = Date.now();
    try {
      const toolName = "structured_output";
      const toolDef: Anthropic.Tool = {
        name: toolName,
        description: "Return structured JSON matching the provided schema.",
        input_schema: schema as Anthropic.Tool["input_schema"],
      };

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const apiCall = this.client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: [toolDef],
        tool_choice: { type: "tool", name: toolName },
        messages: [{ role: "user", content: userPrompt }],
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new GenerationTimeoutError(timeout));
        }, timeout);
      });

      let response: Anthropic.Message;
      try {
        response = await Promise.race([apiCall, timeoutPromise]);
      } catch (err) {
        const elapsed = Date.now() - callStart;
        console.error(`[provider] API call failed after ${elapsed}ms: ${String(err)}`);
        if (err instanceof GenerationTimeoutError) throw err;
        // Detect rate limit (thrown after SDK's own 5 retries are exhausted)
        if (err instanceof Anthropic.RateLimitError) {
          const retryAfterHeader = (err.headers as unknown as Record<string, string> | undefined)?.[
            "retry-after"
          ];
          const retryAfterMs =
            retryAfterHeader !== undefined
              ? Math.floor(Number(retryAfterHeader) * 1000)
              : undefined;
          notifyRateLimit();
          throw new GenerationRateLimitError(
            retryAfterMs !== undefined && Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
          );
        }
        throw new GenerationApiError(`Anthropic API error: ${String(err)}`, err);
      } finally {
        clearTimeout(timeoutId);
      }

      const elapsed = Date.now() - callStart;
      console.log(`[provider] API response OK after ${elapsed}ms (model=${model}, stop=${response.stop_reason})`);

      // Extract tool_use block
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );

      if (!toolUseBlock) {
        console.error(`[provider] No tool_use block — response blocks: ${response.content.map(b => b.type).join(", ")}`);
        throw new GenerationParseError("No tool_use block in Anthropic response");
      }

      const input = toolUseBlock.input;
      if (input === null || input === undefined) {
        throw new GenerationParseError("tool_use block has null/undefined input");
      }

      return input as T;
    } finally {
      getSemaphore().release();
    }
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createProvider(type: "anthropic", config?: { apiKey?: string }): AnthropicProvider;
export function createProvider(type: "mock", config?: { data: unknown }): MockProvider;
export function createProvider(
  type: "anthropic" | "mock",
  config?: { apiKey?: string; data?: unknown },
): GenerationProvider {
  if (type === "mock") {
    return new MockProvider(config?.data);
  }
  return new AnthropicProvider(config?.apiKey);
}
