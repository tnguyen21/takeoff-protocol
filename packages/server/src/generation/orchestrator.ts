import type { Faction, GameRoom } from "@takeoff/shared";
import { getGenerationConfig } from "./config.js";
import {
  logFallback,
  logGenerationFailure,
  logGenerationStart,
  logGenerationSuccess,
  logValidationFailure,
} from "./metrics.js";
import { generateBriefingWithRetry } from "./briefing.js";
import { generateContentWithRetry } from "./content.js";
import { buildGenerationContext } from "./context.js";
import {
  getGenerationStatus,
  setGeneratedBriefing,
  setGeneratedContent,
  setGenerationStatus,
} from "./cache.js";
import { AnthropicProvider, type GenerationProvider } from "./provider.js";
import { validateBriefing } from "./validate.js";

// ── Factions for content generation ───────────────────────────────────────────

const ALL_FACTIONS: Faction[] = ["openbrain", "prometheus", "china", "external"];

// ── triggerGeneration ─────────────────────────────────────────────────────────

/**
 * Trigger LLM generation for the given round.
 *
 * - Idempotent: if generation is already pending/ready/failed, this is a no-op.
 * - Respects config kill switches: if GEN_ENABLED is false, returns immediately.
 * - Briefing is skipped if GEN_BRIEFINGS_ENABLED is false.
 * - Content is skipped if GEN_CONTENT_APPS is empty.
 *
 * @param room    The game room (mutated in-place via cache helpers).
 * @param round   The round number to generate for.
 * @param provider  Optional provider override — use MockProvider in tests.
 */
export async function triggerGeneration(
  room: GameRoom,
  round: number,
  provider?: GenerationProvider,
): Promise<void> {
  // ── Kill switch ───────────────────────────────────────────────────────────
  const config = getGenerationConfig();
  if (!config.enabled) {
    return;
  }

  // ── Idempotency check ─────────────────────────────────────────────────────
  const existingStatus = getGenerationStatus(room, round);
  if (existingStatus !== undefined) {
    return;
  }

  setGenerationStatus(room, round, "pending");

  // ── Provider ──────────────────────────────────────────────────────────────
  const resolvedProvider: GenerationProvider =
    provider ?? new AnthropicProvider();

  const context = buildGenerationContext(room, round);

  let briefingOk = true;
  let contentOk = true;

  // ── Briefing generation ───────────────────────────────────────────────────
  if (config.briefingsEnabled) {
    const briefingArtifact = "briefing";
    const startTs = Date.now();
    logGenerationStart(round, briefingArtifact);

    const briefingResult = await generateBriefingWithRetry(resolvedProvider, context);

    const durationMs = Date.now() - startTs;

    if (briefingResult === null) {
      logGenerationFailure(round, briefingArtifact, "generateBriefingWithRetry returned null", durationMs);
      logFallback(round, briefingArtifact, "falling back to pre-authored briefing");
      briefingOk = false;
    } else {
      const validation = validateBriefing(briefingResult);
      if (!validation.valid) {
        // Should not happen — generateBriefingWithRetry only returns on valid — but guard anyway
        logValidationFailure(round, briefingArtifact, validation.errors);
        logFallback(round, briefingArtifact, "validation failed after retry — falling back");
        briefingOk = false;
      } else {
        setGeneratedBriefing(room, round, briefingResult);
        logGenerationSuccess(round, briefingArtifact, durationMs);
      }
    }
  }

  // ── Content generation ────────────────────────────────────────────────────
  if (config.contentApps.length > 0) {
    for (const faction of ALL_FACTIONS) {
      const contentArtifact = `content:${faction}`;
      const startTs = Date.now();
      logGenerationStart(round, contentArtifact);

      const contentResult = await generateContentWithRetry(
        resolvedProvider,
        context,
        faction,
        config.contentApps,
      );

      const durationMs = Date.now() - startTs;

      if (contentResult === null) {
        logGenerationFailure(round, contentArtifact, "generateContentWithRetry returned null", durationMs);
        logFallback(round, contentArtifact, "falling back to pre-authored content");
        contentOk = false;
      } else {
        setGeneratedContent(room, round, faction, contentResult);
        logGenerationSuccess(round, contentArtifact, durationMs);
      }
    }
  }

  // ── Final status ──────────────────────────────────────────────────────────
  const allOk = briefingOk && contentOk;
  setGenerationStatus(room, round, allOk ? "ready" : "failed");
}
