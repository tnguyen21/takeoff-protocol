// ── Types ─────────────────────────────────────────────────────────────────────

interface GenerationConfig {
  enabled: boolean;           // GEN_ENABLED, default true
  briefingsEnabled: boolean;  // GEN_BRIEFINGS_ENABLED, default true
  npcEnabled: boolean;        // GEN_NPC_ENABLED, default true
  decisionsEnabled: boolean;  // GEN_DECISIONS_ENABLED, default true
  providerType: "anthropic" | "mock"; // GEN_PROVIDER, default "anthropic"
  briefingModel: string;      // GEN_BRIEFING_MODEL, default "claude-sonnet-4-6"
  contentModel: string;       // GEN_CONTENT_MODEL, default "claude-haiku-4-5-20251001" (feed-tier apps)
  signalModel: string;        // GEN_SIGNAL_MODEL, default same as briefingModel (signal-tier apps)
  decisionModel: string;      // GEN_DECISION_MODEL, default same as briefingModel
  timeout: number;            // GEN_TIMEOUT_MS, default 30000
  maxConcurrent: number;      // GEN_MAX_CONCURRENT, default 5
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
    env.GEN_BRIEFING_MODEL ?? "claude-sonnet-4-6";

  const contentModel =
    env.GEN_CONTENT_MODEL ?? "claude-haiku-4-5-20251001";

  const signalModel =
    env.GEN_SIGNAL_MODEL ?? briefingModel;

  const decisionModel =
    env.GEN_DECISION_MODEL ?? briefingModel;

  const rawTimeout = env.GEN_TIMEOUT_MS;
  const timeout =
    rawTimeout !== undefined && rawTimeout !== ""
      ? Number(rawTimeout)
      : 90000;

  const rawMaxConcurrent = env.GEN_MAX_CONCURRENT;
  const maxConcurrent =
    rawMaxConcurrent !== undefined && rawMaxConcurrent !== ""
      ? Number(rawMaxConcurrent)
      : 15;

  return {
    enabled,
    briefingsEnabled,
    npcEnabled,
    decisionsEnabled,
    providerType,
    briefingModel,
    contentModel,
    signalModel,
    decisionModel,
    timeout: Number.isFinite(timeout) ? timeout : 90000,
    maxConcurrent: Number.isFinite(maxConcurrent) && maxConcurrent > 0 ? Math.floor(maxConcurrent) : 15,
  };
}
