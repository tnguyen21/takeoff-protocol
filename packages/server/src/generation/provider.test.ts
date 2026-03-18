import { describe, it, expect } from "bun:test";
import {
  MockProvider,
  GenerationParseError,
  AnthropicProvider,
  createProvider,
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
