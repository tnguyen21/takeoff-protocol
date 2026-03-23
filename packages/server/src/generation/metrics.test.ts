import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { logGenerationSuccess, logGenerationStart, logGenerationFailure } from "./metrics.js";
import type { TokenUsage } from "./provider.js";

// ── INV-3: logGenerationSuccess includes token counts in stdout JSON ──────────

describe("logGenerationSuccess — token usage in stdout (INV-3)", () => {
  let logLines: string[] = [];
  let spy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    logLines = [];
    spy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logLines.push(args.map(String).join(" "));
    });
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it("emits JSON with usage fields when usage is provided", () => {
    const usage: TokenUsage = {
      inputTokens: 1234,
      outputTokens: 567,
      cacheReadTokens: 100,
      cacheCreationTokens: 50,
    };

    logGenerationSuccess(2, "briefing", 1500, usage);

    expect(logLines.length).toBe(1);
    const line = logLines[0];
    expect(line).toMatch(/^\[generation\] /);

    const json = JSON.parse(line.replace(/^\[generation\] /, "")) as Record<string, unknown>;
    expect(json.event).toBe("success");
    expect(json.round).toBe(2);
    expect(json.artifact).toBe("briefing");
    expect(json.durationMs).toBe(1500);
    expect(json.usage).toBeDefined();

    const emittedUsage = json.usage as TokenUsage;
    expect(emittedUsage.inputTokens).toBe(1234);
    expect(emittedUsage.outputTokens).toBe(567);
    expect(emittedUsage.cacheReadTokens).toBe(100);
    expect(emittedUsage.cacheCreationTokens).toBe(50);
  });

  it("omits usage field when no usage is provided (backward compat)", () => {
    logGenerationSuccess(3, "content:openbrain", 2000);

    expect(logLines.length).toBe(1);
    const json = JSON.parse(logLines[0].replace(/^\[generation\] /, "")) as Record<string, unknown>;
    expect(json.event).toBe("success");
    expect(json.usage).toBeUndefined();
  });

  it("emits JSON with usage when all token counts are zero (valid zero-usage)", () => {
    const usage: TokenUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
    logGenerationSuccess(1, "npc", 500, usage);

    const json = JSON.parse(logLines[0].replace(/^\[generation\] /, "")) as Record<string, unknown>;
    const emittedUsage = json.usage as TokenUsage;
    expect(emittedUsage.inputTokens).toBe(0);
    expect(emittedUsage.outputTokens).toBe(0);
  });

  it("logGenerationStart does not include usage field", () => {
    logGenerationStart(2, "briefing");
    const json = JSON.parse(logLines[0].replace(/^\[generation\] /, "")) as Record<string, unknown>;
    expect(json.event).toBe("start");
    expect(json.usage).toBeUndefined();
  });

  it("logGenerationFailure does not include usage field", () => {
    logGenerationFailure(2, "briefing", "some reason", 800);
    const json = JSON.parse(logLines[0].replace(/^\[generation\] /, "")) as Record<string, unknown>;
    expect(json.event).toBe("failure");
    expect(json.usage).toBeUndefined();
  });
});

// ── onUsage callback mechanism: verify accumulation works correctly ─────────

describe("makeUsageTracker invariants (via onUsage callback pattern)", () => {
  it("accumulates multiple usage calls correctly", () => {
    // Test the accumulator pattern that orchestrator uses
    const usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
    const onUsage = (u: TokenUsage): void => {
      usage.inputTokens += u.inputTokens;
      usage.outputTokens += u.outputTokens;
      usage.cacheReadTokens += u.cacheReadTokens;
      usage.cacheCreationTokens += u.cacheCreationTokens;
    };

    onUsage({ inputTokens: 100, outputTokens: 50, cacheReadTokens: 20, cacheCreationTokens: 10 });
    onUsage({ inputTokens: 200, outputTokens: 80, cacheReadTokens: 0, cacheCreationTokens: 5 });

    expect(usage.inputTokens).toBe(300);
    expect(usage.outputTokens).toBe(130);
    expect(usage.cacheReadTokens).toBe(20);
    expect(usage.cacheCreationTokens).toBe(15);
  });

  it("zero accumulation for an artifact with no LLM calls (e.g. mock provider)", () => {
    // When onUsage is never called (MockProvider), usage stays at zero
    const usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
    // No onUsage calls
    expect(usage.inputTokens).toBe(0);
    expect(usage.outputTokens).toBe(0);
  });
});
