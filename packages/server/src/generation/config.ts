import type { AppId } from "@takeoff/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerationConfig {
  enabled: boolean;           // GEN_ENABLED, default false
  briefingsEnabled: boolean;  // GEN_BRIEFINGS_ENABLED, default false
  contentApps: AppId[];       // GEN_CONTENT_APPS, comma-separated, default []
  npcEnabled: boolean;        // GEN_NPC_ENABLED, default false
  providerType: "anthropic" | "mock"; // GEN_PROVIDER, default "anthropic"
  briefingModel: string;      // GEN_BRIEFING_MODEL, default "claude-sonnet-4-5-20250514"
  contentModel: string;       // GEN_CONTENT_MODEL, default "claude-haiku-4-5-20251001"
  timeout: number;            // GEN_TIMEOUT_MS, default 30000
}

// ── Valid AppId set for GEN_CONTENT_APPS parsing ──────────────────────────────

const VALID_APP_IDS: ReadonlySet<string> = new Set<AppId>([
  "slack", "signal", "wandb", "news", "twitter", "email", "sheets",
  "gamestate", "security", "bloomberg", "briefing", "intel", "military",
  "arxiv", "substack", "memo", "compute",
]);

// ── Config reader ─────────────────────────────────────────────────────────────

/**
 * Read generation configuration from environment variables.
 * Called by the orchestrator before triggering any generation.
 * Env is read at call time — restart the process to pick up changes.
 */
export function getGenerationConfig(): GenerationConfig {
  const env = process.env;

  const enabled = env.GEN_ENABLED === "true" || env.GEN_ENABLED === "1";
  const briefingsEnabled =
    env.GEN_BRIEFINGS_ENABLED === "true" || env.GEN_BRIEFINGS_ENABLED === "1";
  const npcEnabled = env.GEN_NPC_ENABLED === "true" || env.GEN_NPC_ENABLED === "1";

  const rawApps = env.GEN_CONTENT_APPS ?? "";
  const contentApps: AppId[] = rawApps
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && VALID_APP_IDS.has(s)) as AppId[];

  const rawProvider = env.GEN_PROVIDER ?? "anthropic";
  const providerType: "anthropic" | "mock" =
    rawProvider === "mock" ? "mock" : "anthropic";

  const briefingModel =
    env.GEN_BRIEFING_MODEL ?? "claude-sonnet-4-5-20250514";

  const contentModel =
    env.GEN_CONTENT_MODEL ?? "claude-haiku-4-5-20251001";

  const rawTimeout = env.GEN_TIMEOUT_MS;
  const timeout =
    rawTimeout !== undefined && rawTimeout !== ""
      ? Number(rawTimeout)
      : 30000;

  return {
    enabled,
    briefingsEnabled,
    contentApps,
    npcEnabled,
    providerType,
    briefingModel,
    contentModel,
    timeout: Number.isFinite(timeout) ? timeout : 30000,
  };
}
