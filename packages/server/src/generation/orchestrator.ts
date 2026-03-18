import type { Server } from "socket.io";
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
import { AnthropicProvider, type GenerationOptions, type GenerationProvider } from "./provider.js";
import { validateBriefing, validateFogSafety } from "./validate.js";
import { getLoggerForRoom } from "../logger/registry.js";
import { EVENT_NAMES } from "../logger/types.js";

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
  io?: Server,
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

  // ── Generation options (model + timeout from config) ──────────────────────
  const briefingOptions: GenerationOptions = { model: config.briefingModel, timeout: config.timeout };
  const contentOptions: GenerationOptions = { model: config.contentModel, timeout: config.timeout };
  const decisionOptions: GenerationOptions = { model: config.decisionModel, timeout: config.timeout };
  const npcOptions: GenerationOptions = { model: config.contentModel, timeout: config.timeout };

  // ── Idempotency check ─────────────────────────────────────────────────────
  const existingStatus = getGenerationStatus(room, round);
  if (existingStatus !== undefined) {
    return;
  }

  setGenerationStatus(room, round, "pending");
  const logger = getLoggerForRoom(room.code);

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
      logger.log(EVENT_NAMES.GENERATION_STARTED, { artifact: briefingArtifact }, { round, actorId: "system" });

      const briefingResult = await generateBriefingWithRetry(resolvedProvider, context, briefingOptions);

      const durationMs = Date.now() - startTs;

      if (briefingResult === null) {
        logGenerationFailure(round, briefingArtifact, "generateBriefingWithRetry returned null", durationMs);
        logger.log(EVENT_NAMES.GENERATION_FAILURE, { artifact: briefingArtifact, reason: "generateBriefingWithRetry returned null", durationMs }, { round, actorId: "system" });
        briefingOk = false;
      } else {
        const validation = validateBriefing(briefingResult);
        if (!validation.valid) {
          // Should not happen — generateBriefingWithRetry only returns on valid — but guard anyway
          logValidationFailure(round, briefingArtifact, validation.errors);
          logger.log(EVENT_NAMES.GENERATION_VALIDATION_FAILURE, { artifact: briefingArtifact, errors: validation.errors }, { round, actorId: "system" });
          briefingOk = false;
        } else {
          setGeneratedBriefing(room, round, briefingResult);
          logGenerationSuccess(round, briefingArtifact, durationMs);
          logger.log(EVENT_NAMES.GENERATION_SUCCESS, { artifact: briefingArtifact, durationMs }, { round, actorId: "system" });
        }
      }
    }

    // ── Content generation ──────────────────────────────────────────────────
    if (contentApps.length > 0) {
      for (const faction of ALL_FACTIONS) {
        const contentArtifact = `content:${faction}`;
        const startTs = Date.now();
        logGenerationStart(round, contentArtifact);
        logger.log(EVENT_NAMES.GENERATION_STARTED, { artifact: contentArtifact }, { round, actorId: "system" });

        const contentResult = await generateContentWithRetry(
          resolvedProvider,
          context,
          faction,
          contentApps,
          contentOptions,
        );

        const durationMs = Date.now() - startTs;

        if (contentResult === null) {
          logGenerationFailure(round, contentArtifact, "generateContentWithRetry returned null", durationMs);
          logger.log(EVENT_NAMES.GENERATION_FAILURE, { artifact: contentArtifact, reason: "generateContentWithRetry returned null", durationMs }, { round, actorId: "system" });
          contentOk = false;
        } else {
          // Log fog-safety warnings (non-blocking — heuristic may have false positives)
          const allItems = contentResult.flatMap(ac => ac.items);
          const fogResult = validateFogSafety(allItems, room.state, faction);
          if (fogResult.warnings.length > 0) {
            logValidationFailure(round, `fog-safety:${faction}`, fogResult.warnings);
          }
          setGeneratedContent(room, round, faction, contentResult);
          logGenerationSuccess(round, contentArtifact, durationMs);
          logger.log(EVENT_NAMES.GENERATION_SUCCESS, { artifact: contentArtifact, durationMs }, { round, actorId: "system" });
        }
      }
    }

    // ── NPC generation ───────────────────────────────────────────────────────
    if (npcEnabled) {
      const npcArtifact = "npc";
      const startTs = Date.now();
      logGenerationStart(round, npcArtifact);
      logger.log(EVENT_NAMES.GENERATION_STARTED, { artifact: npcArtifact }, { round, actorId: "system" });

      const npcResult = await generateNpcMessagesWithRetry(resolvedProvider, context, npcOptions);

      const durationMs = Date.now() - startTs;

      if (npcResult === null) {
        logGenerationFailure(round, npcArtifact, "generateNpcMessagesWithRetry returned null", durationMs);
        logger.log(EVENT_NAMES.GENERATION_FAILURE, { artifact: npcArtifact, reason: "generateNpcMessagesWithRetry returned null", durationMs }, { round, actorId: "system" });
        npcOk = false;
      } else {
        setGeneratedNpcTriggers(room, round, npcResult);
        logGenerationSuccess(round, npcArtifact, durationMs);
        logger.log(EVENT_NAMES.GENERATION_SUCCESS, { artifact: npcArtifact, durationMs }, { round, actorId: "system" });
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
        logger.log(EVENT_NAMES.GENERATION_STARTED, { artifact: decisionsArtifact }, { round, actorId: "system" });

        const decisionsResult = await generateDecisionsWithRetry(resolvedProvider, context, templates, round, decisionOptions);

        const durationMs = Date.now() - startTs;

        if (decisionsResult === null) {
          logGenerationFailure(round, decisionsArtifact, "generateDecisionsWithRetry returned null", durationMs);
          logger.log(EVENT_NAMES.GENERATION_FAILURE, { artifact: decisionsArtifact, reason: "generateDecisionsWithRetry returned null", durationMs }, { round, actorId: "system" });
          decisionsOk = false;
        } else {
          setGeneratedDecisions(room, round, decisionsResult);
          logGenerationSuccess(round, decisionsArtifact, durationMs);
          logger.log(EVENT_NAMES.GENERATION_SUCCESS, { artifact: decisionsArtifact, durationMs }, { round, actorId: "system" });
        }
      }
    }

    // ── Final status ──────────────────────────────────────────────────────────
    const allOk = briefingOk && contentOk && npcOk && decisionsOk;
    setGenerationStatus(room, round, allOk ? "ready" : "failed");
    if (io && !allOk) {
      io.to(room.code).emit("game:generation-status", {
        round,
        status: "degraded",
        message: "Some content may be unavailable due to API issues",
      });
    }
  } catch (err) {
    // INV-1: triggerGeneration must never throw — all errors result in fallback
    console.error(`[generation] Unexpected error for round ${round} in room ${room.code}:`, err);
    setGenerationStatus(room, round, "failed");
    if (io) {
      io.to(room.code).emit("game:generation-status", {
        round,
        status: "degraded",
        message: "Content generation failed — fallback content will be used",
      });
    }
  }
}
