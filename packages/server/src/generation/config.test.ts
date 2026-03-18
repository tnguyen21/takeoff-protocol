import { describe, it, expect, afterEach } from "bun:test";
import { getGenerationConfig } from "./config.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Set a process.env key; returns a cleanup function. */
function withEnv(vars: Record<string, string | undefined>): () => void {
  const original: Record<string, string | undefined> = {};
  for (const [key, val] of Object.entries(vars)) {
    original[key] = process.env[key];
    if (val === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = val;
    }
  }
  return () => {
    for (const [key, val] of Object.entries(original)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  };
}

// Clean up any env vars set by individual tests
afterEach(() => {
  for (const key of [
    "GEN_ENABLED",
    "GEN_BRIEFINGS_ENABLED",
    "GEN_NPC_ENABLED",
    "GEN_DECISIONS_ENABLED",
    "GEN_PROVIDER",
    "GEN_BRIEFING_MODEL",
    "GEN_CONTENT_MODEL",
    "GEN_DECISION_MODEL",
    "GEN_TIMEOUT_MS",
  ]) {
    delete process.env[key];
  }
});

// ── Boolean flags ─────────────────────────────────────────────────────────────

it("GEN_ENABLED: defaults true, 'false'→false, '0'→false", () => {
  expect(getGenerationConfig().enabled).toBe(true);

  const cleanup = withEnv({ GEN_ENABLED: "false" });
  try { expect(getGenerationConfig().enabled).toBe(false); } finally { cleanup(); }

  const cleanup2 = withEnv({ GEN_ENABLED: "0" });
  try { expect(getGenerationConfig().enabled).toBe(false); } finally { cleanup2(); }
});

it("GEN_BRIEFINGS_ENABLED: defaults true, 'false'→false", () => {
  expect(getGenerationConfig().briefingsEnabled).toBe(true);

  const cleanup = withEnv({ GEN_BRIEFINGS_ENABLED: "false" });
  try { expect(getGenerationConfig().briefingsEnabled).toBe(false); } finally { cleanup(); }
});

it("GEN_DECISIONS_ENABLED: defaults true, 'false'→false", () => {
  expect(getGenerationConfig().decisionsEnabled).toBe(true);

  const cleanup = withEnv({ GEN_DECISIONS_ENABLED: "false" });
  try { expect(getGenerationConfig().decisionsEnabled).toBe(false); } finally { cleanup(); }
});

it("GEN_NPC_ENABLED: defaults true, 'false'→false", () => {
  expect(getGenerationConfig().npcEnabled).toBe(true);

  const cleanup = withEnv({ GEN_NPC_ENABLED: "false" });
  try { expect(getGenerationConfig().npcEnabled).toBe(false); } finally { cleanup(); }
});

// ── Provider ──────────────────────────────────────────────────────────────────

it("GEN_PROVIDER: default 'anthropic', 'mock'→mock, unknown→'anthropic'", () => {
  expect(getGenerationConfig().providerType).toBe("anthropic");

  const cleanup = withEnv({ GEN_PROVIDER: "mock" });
  try { expect(getGenerationConfig().providerType).toBe("mock"); } finally { cleanup(); }

  const cleanup2 = withEnv({ GEN_PROVIDER: "openai" });
  try { expect(getGenerationConfig().providerType).toBe("anthropic"); } finally { cleanup2(); }
});

// ── Models ────────────────────────────────────────────────────────────────────

it("model defaults: briefingModel contains 'sonnet', contentModel contains 'haiku'", () => {
  const config = getGenerationConfig();
  expect(config.briefingModel).toContain("sonnet");
  expect(config.contentModel).toContain("haiku");
});

it("model overrides: GEN_BRIEFING_MODEL, GEN_CONTENT_MODEL, GEN_DECISION_MODEL", () => {
  const cleanup = withEnv({
    GEN_BRIEFING_MODEL: "claude-opus-4-6",
    GEN_CONTENT_MODEL: "claude-sonnet-4-6",
    GEN_DECISION_MODEL: "claude-haiku-4-5-20251001",
  });
  try {
    const config = getGenerationConfig();
    expect(config.briefingModel).toBe("claude-opus-4-6");
    expect(config.contentModel).toBe("claude-sonnet-4-6");
    expect(config.decisionModel).toBe("claude-haiku-4-5-20251001");
  } finally {
    cleanup();
  }
});

it("GEN_DECISION_MODEL fallback: defaults to briefingModel, follows overridden briefingModel", () => {
  expect(getGenerationConfig().decisionModel).toBe(getGenerationConfig().briefingModel);

  const cleanup = withEnv({ GEN_BRIEFING_MODEL: "claude-opus-4-6" });
  try { expect(getGenerationConfig().decisionModel).toBe("claude-opus-4-6"); } finally { cleanup(); }
});

// ── Timeout ───────────────────────────────────────────────────────────────────

it("GEN_TIMEOUT_MS: default 30000, parses numeric, falls back for non-numeric", () => {
  expect(getGenerationConfig().timeout).toBe(30000);

  const cleanup = withEnv({ GEN_TIMEOUT_MS: "60000" });
  try { expect(getGenerationConfig().timeout).toBe(60000); } finally { cleanup(); }

  const cleanup2 = withEnv({ GEN_TIMEOUT_MS: "notanumber" });
  try { expect(getGenerationConfig().timeout).toBe(30000); } finally { cleanup2(); }
});
