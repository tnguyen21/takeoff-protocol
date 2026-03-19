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

class GenerationApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "GenerationApiError";
  }
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

// ── MockProvider ──────────────────────────────────────────────────────────────

export class MockProvider implements GenerationProvider {
  constructor(private readonly data: unknown) {}

  async generate<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: object;
    options?: GenerationOptions;
  }): Promise<T> {
    const timeout = params.options?.timeout ?? 30000;

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
    return this.data as T;
  }
}

// ── Semaphore ─────────────────────────────────────────────────────────────────

class Semaphore {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active++;
      return;
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }

  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) {
      this.active++;
      next();
    }
  }

  status(): { active: number; queued: number; limit: number } {
    return { active: this.active, queued: this.queue.length, limit: this.limit };
  }
}

const DEFAULT_MAX_CONCURRENT = Number(process.env.GEN_MAX_CONCURRENT) || 5;

// Module-level singleton — shared across all AnthropicProvider instances
const _semaphore = new Semaphore(
  Number.isFinite(DEFAULT_MAX_CONCURRENT) && DEFAULT_MAX_CONCURRENT > 0
    ? Math.floor(DEFAULT_MAX_CONCURRENT)
    : 5,
);

/** Returns current throttle stats for observability. */
export function getThrottleStatus(): { active: number; queued: number; limit: number } {
  return _semaphore.status();
}

// ── AnthropicProvider ─────────────────────────────────────────────────────────

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_TOKENS = 4096;

export class AnthropicProvider implements GenerationProvider {
  private readonly client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey });
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

    await _semaphore.acquire();
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
        if (err instanceof GenerationTimeoutError) throw err;
        throw new GenerationApiError(`Anthropic API error: ${String(err)}`, err);
      } finally {
        clearTimeout(timeoutId);
      }

      // Extract tool_use block
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );

      if (!toolUseBlock) {
        throw new GenerationParseError("No tool_use block in Anthropic response");
      }

      const input = toolUseBlock.input;
      if (input === null || input === undefined) {
        throw new GenerationParseError("tool_use block has null/undefined input");
      }

      return input as T;
    } finally {
      _semaphore.release();
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
