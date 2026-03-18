import type { AppId, Faction, GameRoom } from "@takeoff/shared";
import { getGenerationConfig } from "./config.js";
import {
  logGenerationFailure,
  logGenerationStart,
  logGenerationSuccess,
  logValidationFailure,
} from "./metrics.js";
import { generateBriefingWithRetry } from "./briefing.js";
import { APP_TYPE_MAP, generateContentWithRetry } from "./content.js";
import { generateNpcMessagesWithRetry } from "./npc.js";
import { generateDecisionsWithRetry } from "./decisions.js";
import { getTemplatesForRound } from "./templates/decisions.js";
import { buildGenerationContext } from "./context.js";
import {
  getGenerationStatus,
  setGeneratedBriefing,
  setGeneratedContent,
  setGeneratedDecisions,
  setGeneratedNpcTriggers,
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
  // ── Round bounds (generation only for rounds 2-5) ─────────────────────────
  if (round < 1 || round > 5) {
    return;
  }

  // ── Kill switch (room toggle takes precedence over env) ──────────────────
  const config = getGenerationConfig();
  const roomEnabled = room.generationEnabled;
  if (roomEnabled === false) return;               // GM explicitly disabled
  if (roomEnabled === undefined && !config.enabled) return; // no GM preference, check env

  // When room toggle is on, enable everything; otherwise use env config
  const briefingsEnabled = roomEnabled === true ? true : config.briefingsEnabled;
  const contentApps: AppId[] = Object.keys(APP_TYPE_MAP) as AppId[];
  const npcEnabled = roomEnabled === true ? true : config.npcEnabled;
  const decisionsEnabled = roomEnabled === true ? true : config.decisionsEnabled;

  // ── Idempotency check ─────────────────────────────────────────────────────
  const existingStatus = getGenerationStatus(room, round);
  if (existingStatus !== undefined) {
    return;
  }

  setGenerationStatus(room, round, "pending");

  try {
    // ── Provider ────────────────────────────────────────────────────────────
    const resolvedProvider: GenerationProvider =
      provider ?? new AnthropicProvider();

    const context = buildGenerationContext(room, round);

    let briefingOk = true;
    let contentOk = true;
    let npcOk = true;

    // ── Briefing generation ─────────────────────────────────────────────────
    if (briefingsEnabled) {
      const briefingArtifact = "briefing";
      const startTs = Date.now();
      logGenerationStart(round, briefingArtifact);

      const briefingResult = await generateBriefingWithRetry(resolvedProvider, context);

      const durationMs = Date.now() - startTs;

      if (briefingResult === null) {
        logGenerationFailure(round, briefingArtifact, "generateBriefingWithRetry returned null", durationMs);
        briefingOk = false;
      } else {
        const validation = validateBriefing(briefingResult);
        if (!validation.valid) {
          // Should not happen — generateBriefingWithRetry only returns on valid — but guard anyway
          logValidationFailure(round, briefingArtifact, validation.errors);
          briefingOk = false;
        } else {
          setGeneratedBriefing(room, round, briefingResult);
          logGenerationSuccess(round, briefingArtifact, durationMs);
        }
      }
    }

    // ── Content generation ──────────────────────────────────────────────────
    if (contentApps.length > 0) {
      for (const faction of ALL_FACTIONS) {
        const contentArtifact = `content:${faction}`;
        const startTs = Date.now();
        logGenerationStart(round, contentArtifact);

        const contentResult = await generateContentWithRetry(
          resolvedProvider,
          context,
          faction,
          contentApps,
        );

        const durationMs = Date.now() - startTs;

        if (contentResult === null) {
          logGenerationFailure(round, contentArtifact, "generateContentWithRetry returned null", durationMs);
          contentOk = false;
        } else {
          setGeneratedContent(room, round, faction, contentResult);
          logGenerationSuccess(round, contentArtifact, durationMs);
        }
      }
    }

    // ── NPC generation ───────────────────────────────────────────────────────
    if (npcEnabled) {
      const npcArtifact = "npc";
      const startTs = Date.now();
      logGenerationStart(round, npcArtifact);

      const npcResult = await generateNpcMessagesWithRetry(resolvedProvider, context);

      const durationMs = Date.now() - startTs;

      if (npcResult === null) {
        logGenerationFailure(round, npcArtifact, "generateNpcMessagesWithRetry returned null", durationMs);
        npcOk = false;
      } else {
        setGeneratedNpcTriggers(room, round, npcResult);
        logGenerationSuccess(round, npcArtifact, durationMs);
      }
    }

    // ── Decision generation ───────────────────────────────────────────────────
    let decisionsOk = true;
    if (decisionsEnabled) {
      const templates = getTemplatesForRound(round);
      if (templates.length > 0) {
        const decisionsArtifact = "decisions";
        const startTs = Date.now();
        logGenerationStart(round, decisionsArtifact);

        const decisionsResult = await generateDecisionsWithRetry(resolvedProvider, context, templates, round);

        const durationMs = Date.now() - startTs;

        if (decisionsResult === null) {
          logGenerationFailure(round, decisionsArtifact, "generateDecisionsWithRetry returned null", durationMs);
          decisionsOk = false;
        } else {
          setGeneratedDecisions(room, round, decisionsResult);
          logGenerationSuccess(round, decisionsArtifact, durationMs);
        }
      }
    }

    // ── Final status ──────────────────────────────────────────────────────────
    const allOk = briefingOk && contentOk && npcOk && decisionsOk;
    setGenerationStatus(room, round, allOk ? "ready" : "failed");
  } catch (err) {
    // INV-1: triggerGeneration must never throw — all errors result in fallback
    console.error(`[generation] Unexpected error for round ${round} in room ${room.code}:`, err);
    setGenerationStatus(room, round, "failed");
  }
}
