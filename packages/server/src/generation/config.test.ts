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
    "GEN_CONTENT_APPS",
    "GEN_PROVIDER",
    "GEN_BRIEFING_MODEL",
    "GEN_CONTENT_MODEL",
    "GEN_TIMEOUT_MS",
  ]) {
    delete process.env[key];
  }
});

// ── INV-1: GEN_ENABLED false by default ───────────────────────────────────────

describe("INV-1: GEN_ENABLED defaults to false", () => {
  it("returns enabled=false when GEN_ENABLED is unset", () => {
    const cleanup = withEnv({ GEN_ENABLED: undefined });
    try {
      const config = getGenerationConfig();
      expect(config.enabled).toBe(false);
    } finally {
      cleanup();
    }
  });

  it("returns enabled=false when GEN_ENABLED is 'false'", () => {
    const cleanup = withEnv({ GEN_ENABLED: "false" });
    try {
      const config = getGenerationConfig();
      expect(config.enabled).toBe(false);
    } finally {
      cleanup();
    }
  });

  it("returns enabled=false when GEN_ENABLED is empty string", () => {
    const cleanup = withEnv({ GEN_ENABLED: "" });
    try {
      const config = getGenerationConfig();
      expect(config.enabled).toBe(false);
    } finally {
      cleanup();
    }
  });

  it("returns enabled=false when GEN_ENABLED is an unrecognized value", () => {
    const cleanup = withEnv({ GEN_ENABLED: "yes" });
    try {
      const config = getGenerationConfig();
      expect(config.enabled).toBe(false);
    } finally {
      cleanup();
    }
  });
});

// ── INV-2: GEN_ENABLED "true" or "1" → true ───────────────────────────────────

describe("INV-2: GEN_ENABLED 'true' or '1' enables generation", () => {
  it("returns enabled=true when GEN_ENABLED is 'true'", () => {
    const cleanup = withEnv({ GEN_ENABLED: "true" });
    try {
      const config = getGenerationConfig();
      expect(config.enabled).toBe(true);
    } finally {
      cleanup();
    }
  });

  it("returns enabled=true when GEN_ENABLED is '1'", () => {
    const cleanup = withEnv({ GEN_ENABLED: "1" });
    try {
      const config = getGenerationConfig();
      expect(config.enabled).toBe(true);
    } finally {
      cleanup();
    }
  });
});

// ── INV-3: GEN_CONTENT_APPS parsing ───────────────────────────────────────────

describe("INV-3: GEN_CONTENT_APPS parses comma-separated app IDs", () => {
  it("parses 'news,twitter' into ['news', 'twitter']", () => {
    const cleanup = withEnv({ GEN_CONTENT_APPS: "news,twitter" });
    try {
      const config = getGenerationConfig();
      expect(config.contentApps).toEqual(["news", "twitter"]);
    } finally {
      cleanup();
    }
  });

  it("handles whitespace around app names", () => {
    const cleanup = withEnv({ GEN_CONTENT_APPS: " news , twitter " });
    try {
      const config = getGenerationConfig();
      expect(config.contentApps).toEqual(["news", "twitter"]);
    } finally {
      cleanup();
    }
  });

  it("filters out unknown app IDs", () => {
    const cleanup = withEnv({ GEN_CONTENT_APPS: "news,unknownapp,twitter" });
    try {
      const config = getGenerationConfig();
      expect(config.contentApps).toEqual(["news", "twitter"]);
    } finally {
      cleanup();
    }
  });

  it("parses a single app ID", () => {
    const cleanup = withEnv({ GEN_CONTENT_APPS: "news" });
    try {
      const config = getGenerationConfig();
      expect(config.contentApps).toEqual(["news"]);
    } finally {
      cleanup();
    }
  });
});

// ── INV-4: GEN_CONTENT_APPS empty or unset → [] ───────────────────────────────

describe("INV-4: GEN_CONTENT_APPS empty or unset returns []", () => {
  it("returns empty array when GEN_CONTENT_APPS is unset", () => {
    const cleanup = withEnv({ GEN_CONTENT_APPS: undefined });
    try {
      const config = getGenerationConfig();
      expect(config.contentApps).toEqual([]);
    } finally {
      cleanup();
    }
  });

  it("returns empty array when GEN_CONTENT_APPS is empty string", () => {
    const cleanup = withEnv({ GEN_CONTENT_APPS: "" });
    try {
      const config = getGenerationConfig();
      expect(config.contentApps).toEqual([]);
    } finally {
      cleanup();
    }
  });

  it("returns empty array when GEN_CONTENT_APPS is only whitespace", () => {
    const cleanup = withEnv({ GEN_CONTENT_APPS: "   " });
    try {
      const config = getGenerationConfig();
      expect(config.contentApps).toEqual([]);
    } finally {
      cleanup();
    }
  });
});

// ── INV-5: Default model values are sensible Claude model IDs ─────────────────

describe("INV-5: default model values are sensible Claude model IDs", () => {
  it("briefingModel default contains 'claude' and 'sonnet'", () => {
    const config = getGenerationConfig();
    expect(config.briefingModel).toContain("claude");
    expect(config.briefingModel).toContain("sonnet");
  });

  it("contentModel default contains 'claude' and 'haiku'", () => {
    const config = getGenerationConfig();
    expect(config.contentModel).toContain("claude");
    expect(config.contentModel).toContain("haiku");
  });

  it("briefingModel can be overridden via GEN_BRIEFING_MODEL", () => {
    const cleanup = withEnv({ GEN_BRIEFING_MODEL: "claude-opus-4-6" });
    try {
      const config = getGenerationConfig();
      expect(config.briefingModel).toBe("claude-opus-4-6");
    } finally {
      cleanup();
    }
  });

  it("contentModel can be overridden via GEN_CONTENT_MODEL", () => {
    const cleanup = withEnv({ GEN_CONTENT_MODEL: "claude-sonnet-4-6" });
    try {
      const config = getGenerationConfig();
      expect(config.contentModel).toBe("claude-sonnet-4-6");
    } finally {
      cleanup();
    }
  });
});

// ── GEN_BRIEFINGS_ENABLED flag ────────────────────────────────────────────────

describe("GEN_BRIEFINGS_ENABLED flag", () => {
  it("defaults to false when unset", () => {
    const config = getGenerationConfig();
    expect(config.briefingsEnabled).toBe(false);
  });

  it("is true when set to 'true'", () => {
    const cleanup = withEnv({ GEN_BRIEFINGS_ENABLED: "true" });
    try {
      const config = getGenerationConfig();
      expect(config.briefingsEnabled).toBe(true);
    } finally {
      cleanup();
    }
  });

  it("is true when set to '1'", () => {
    const cleanup = withEnv({ GEN_BRIEFINGS_ENABLED: "1" });
    try {
      const config = getGenerationConfig();
      expect(config.briefingsEnabled).toBe(true);
    } finally {
      cleanup();
    }
  });
});

// ── GEN_PROVIDER flag ─────────────────────────────────────────────────────────

describe("GEN_PROVIDER flag", () => {
  it("defaults to 'anthropic' when unset", () => {
    const config = getGenerationConfig();
    expect(config.providerType).toBe("anthropic");
  });

  it("is 'mock' when set to 'mock'", () => {
    const cleanup = withEnv({ GEN_PROVIDER: "mock" });
    try {
      const config = getGenerationConfig();
      expect(config.providerType).toBe("mock");
    } finally {
      cleanup();
    }
  });

  it("falls back to 'anthropic' for unknown value", () => {
    const cleanup = withEnv({ GEN_PROVIDER: "openai" });
    try {
      const config = getGenerationConfig();
      expect(config.providerType).toBe("anthropic");
    } finally {
      cleanup();
    }
  });
});

// ── GEN_TIMEOUT_MS parsing ────────────────────────────────────────────────────

describe("GEN_TIMEOUT_MS parsing", () => {
  it("defaults to 30000 when unset", () => {
    const config = getGenerationConfig();
    expect(config.timeout).toBe(30000);
  });

  it("parses numeric string", () => {
    const cleanup = withEnv({ GEN_TIMEOUT_MS: "60000" });
    try {
      const config = getGenerationConfig();
      expect(config.timeout).toBe(60000);
    } finally {
      cleanup();
    }
  });

  it("falls back to 30000 for non-numeric value", () => {
    const cleanup = withEnv({ GEN_TIMEOUT_MS: "notanumber" });
    try {
      const config = getGenerationConfig();
      expect(config.timeout).toBe(30000);
    } finally {
      cleanup();
    }
  });
});
