// ── Types ─────────────────────────────────────────────────────────────────────

interface GenerationConfig {
  enabled: boolean;           // GEN_ENABLED, default true
  briefingsEnabled: boolean;  // GEN_BRIEFINGS_ENABLED, default true
  npcEnabled: boolean;        // GEN_NPC_ENABLED, default true
  decisionsEnabled: boolean;  // GEN_DECISIONS_ENABLED, default true
  providerType: "anthropic" | "mock"; // GEN_PROVIDER, default "anthropic"
  briefingModel: string;      // GEN_BRIEFING_MODEL, default "claude-sonnet-4-5-20250514"
  contentModel: string;       // GEN_CONTENT_MODEL, default "claude-haiku-4-5-20251001"
  decisionModel: string;      // GEN_DECISION_MODEL, default same as briefingModel
  timeout: number;            // GEN_TIMEOUT_MS, default 30000
}

// ── Config reader ─────────────────────────────────────────────────────────────

/**
 * Read generation configuration from environment variables.
 * Called by the orchestrator before triggering any generation.
 * Env is read at call time — restart the process to pick up changes.
 */
export function getGenerationConfig(): GenerationConfig {
  const env = process.env;

  const enabled = env.GEN_ENABLED !== "false" && env.GEN_ENABLED !== "0";
  const briefingsEnabled =
    env.GEN_BRIEFINGS_ENABLED !== "false" && env.GEN_BRIEFINGS_ENABLED !== "0";
  const npcEnabled = env.GEN_NPC_ENABLED !== "false" && env.GEN_NPC_ENABLED !== "0";
  const decisionsEnabled =
    env.GEN_DECISIONS_ENABLED !== "false" && env.GEN_DECISIONS_ENABLED !== "0";

  const rawProvider = env.GEN_PROVIDER ?? "anthropic";
  const providerType: "anthropic" | "mock" =
    rawProvider === "mock" ? "mock" : "anthropic";

  const briefingModel =
    env.GEN_BRIEFING_MODEL ?? "claude-sonnet-4-5-20250514";

  const contentModel =
    env.GEN_CONTENT_MODEL ?? "claude-haiku-4-5-20251001";

  const decisionModel =
    env.GEN_DECISION_MODEL ?? briefingModel;

  const rawTimeout = env.GEN_TIMEOUT_MS;
  const timeout =
    rawTimeout !== undefined && rawTimeout !== ""
      ? Number(rawTimeout)
      : 30000;

  return {
    enabled,
    briefingsEnabled,
    npcEnabled,
    decisionsEnabled,
    providerType,
    briefingModel,
    contentModel,
    decisionModel,
    timeout: Number.isFinite(timeout) ? timeout : 30000,
  };
}
