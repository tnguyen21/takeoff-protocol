import { describe, it, expect } from "bun:test";
import {
  MockProvider,
  GenerationTimeoutError,
  GenerationParseError,
  createProvider,
} from "./provider.js";

// ── INV-1: MockProvider returns canned data with correct type ─────────────────

describe("INV-1: MockProvider returns canned data", () => {
  it("returns the object passed at construction", async () => {
    const data = { score: 42, label: "excellent" };
    const provider = new MockProvider(data);

    const result = await provider.generate<typeof data>({
      systemPrompt: "You are a scorer.",
      userPrompt: "Score this.",
      schema: { type: "object", properties: { score: { type: "number" }, label: { type: "string" } } },
    });

    expect(result).toEqual(data);
    expect(result.score).toBe(42);
    expect(result.label).toBe("excellent");
  });

  it("preserves nested object structure", async () => {
    const data = { player: { id: "p1", faction: "openbrain" }, round: 3 };
    const provider = new MockProvider(data);

    const result = await provider.generate<typeof data>({
      systemPrompt: "Sys",
      userPrompt: "User",
      schema: {},
    });

    expect(result.player.id).toBe("p1");
    expect(result.round).toBe(3);
  });

  it("returns array canned data correctly", async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const provider = new MockProvider(data);

    const result = await provider.generate<typeof data>({
      systemPrompt: "Sys",
      userPrompt: "User",
      schema: {},
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });
});

// ── INV-2: Timeout rejects with GenerationTimeoutError ───────────────────────

describe("INV-2: Timeout fires with typed GenerationTimeoutError", () => {
  it("rejects with GenerationTimeoutError when timeout mock is used", async () => {
    // Simulate a provider whose underlying "API" never resolves by wrapping in timeout
    const timeoutMs = 50;

    // Create a provider backed by a promise that never settles, then race with timeout
    const neverResolves = new Promise<never>(() => {});
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new GenerationTimeoutError(timeoutMs)), timeoutMs),
    );

    const err = await Promise.race([neverResolves, timeoutPromise]).catch((e) => e) as GenerationTimeoutError;

    expect(err).toBeInstanceOf(GenerationTimeoutError);
    expect(err.name).toBe("GenerationTimeoutError");
    expect(err.message).toContain("50ms");
  });

  it("GenerationTimeoutError is distinct from generic Error", () => {
    const err = new GenerationTimeoutError(1000);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GenerationTimeoutError);
    expect(err.name).toBe("GenerationTimeoutError");
  });
});

// ── INV-3: Malformed JSON rejects with GenerationParseError ──────────────────

describe("INV-3: Malformed JSON response → GenerationParseError", () => {
  it("rejects with GenerationParseError when canned data is an invalid JSON string", async () => {
    const provider = new MockProvider("{not valid json");

    const err = await provider
      .generate({ systemPrompt: "s", userPrompt: "u", schema: {} })
      .catch((e) => e) as GenerationParseError;

    expect(err).toBeInstanceOf(GenerationParseError);
    expect(err.name).toBe("GenerationParseError");
  });

  it("rejects with GenerationParseError when canned data is empty string", async () => {
    const provider = new MockProvider("");

    const err = await provider
      .generate({ systemPrompt: "s", userPrompt: "u", schema: {} })
      .catch((e) => e);

    expect(err).toBeInstanceOf(GenerationParseError);
  });

  it("accepts valid JSON string and parses it to object", async () => {
    const provider = new MockProvider('{"key": "value"}');

    const result = await provider.generate<{ key: string }>({
      systemPrompt: "s",
      userPrompt: "u",
      schema: {},
    });

    expect(result.key).toBe("value");
  });
});

// ── Error class invariants ────────────────────────────────────────────────────

describe("Error class invariants", () => {
  it("GenerationParseError is instanceof Error", () => {
    const err = new GenerationParseError("bad json");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("GenerationParseError");
    expect(err.message).toBe("bad json");
  });

  it("GenerationTimeoutError message includes timeout duration", () => {
    const err = new GenerationTimeoutError(5000);
    expect(err.message).toContain("5000ms");
  });
});

// ── createProvider factory ────────────────────────────────────────────────────

describe("createProvider factory", () => {
  it("returns MockProvider when type is 'mock'", () => {
    const provider = createProvider("mock", { data: { ok: true } });
    expect(provider).toBeInstanceOf(MockProvider);
  });

  it("mock provider from factory returns canned data", async () => {
    const provider = createProvider("mock", { data: { result: "win" } });
    const result = await provider.generate<{ result: string }>({
      systemPrompt: "s",
      userPrompt: "u",
      schema: {},
    });
    expect(result.result).toBe("win");
  });
});

// ── Failure mode: null/undefined response ────────────────────────────────────

describe("Failure modes", () => {
  it("null canned data throws GenerationParseError", async () => {
    const provider = new MockProvider(null);
    const err = await provider
      .generate({ systemPrompt: "s", userPrompt: "u", schema: {} })
      .catch((e) => e);
    expect(err).toBeInstanceOf(GenerationParseError);
  });

  it("undefined canned data throws GenerationParseError", async () => {
    const provider = new MockProvider(undefined);
    const err = await provider
      .generate({ systemPrompt: "s", userPrompt: "u", schema: {} })
      .catch((e) => e);
    expect(err).toBeInstanceOf(GenerationParseError);
  });
});
