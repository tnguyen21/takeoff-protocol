import type { Server } from "socket.io";
import type { AppContent, AppId, ContentItem, Faction, GameRoom } from "@takeoff/shared";
import { FACTIONS } from "@takeoff/shared";
import { getGenerationConfig } from "./config.js";
import {
  logGenerationFailure,
  logGenerationStart,
  logGenerationSuccess,
  logValidationFailure,
} from "./metrics.js";
import { generateBriefingWithRetry } from "./briefing.js";
import { APP_TYPE_MAP, APP_CONTENT_TIER, generateContentWithRetry } from "./content.js";
import { generateNpcMessagesWithRetry } from "./npc.js";
import { generateDecisionsWithRetry } from "./decisions.js";
import { getTemplatesForRound } from "./templates/decisions.js";
import { buildGenerationContext } from "./context.js";
import {
  appendGeneratedPrompts,
  getGenerationStatus,
  setGeneratedBriefing,
  setGeneratedContent,
  setGeneratedDecisions,
  setGeneratedNpcTriggers,
  setGeneratedSharedContent,
  setGenerationStatus,
} from "./cache.js";
import { AnthropicProvider, CapturingProvider, type GenerationOptions, type GenerationProvider } from "./provider.js";
import { validateBriefing, validateFogSafety, scrubFogLeaks } from "./validate.js";
import { getLoggerForRoom } from "../logger/registry.js";
import { EVENT_NAMES } from "../logger/types.js";
import { ROUND_1_BRIEFING } from "../content/round1Briefing.js";

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
  const allContentApps: AppId[] = Object.keys(APP_TYPE_MAP) as AppId[];
  // Build per-faction app list: only generate for apps the faction actually has
  const factionAppMap = new Map<Faction, AppId[]>();
  for (const factionConfig of FACTIONS) {
    const factionId = factionConfig.id as Faction;
    const factionApps = allContentApps.filter(app => factionConfig.apps.includes(app));
    factionAppMap.set(factionId, factionApps);
  }
  const npcEnabled = roomEnabled === true ? true : config.npcEnabled;
  const decisionsEnabled = roomEnabled === true ? true : config.decisionsEnabled;

  // ── Generation options (model + timeout from config) ──────────────────────
  const briefingOptions: GenerationOptions = { model: config.briefingModel, timeout: config.timeout };
  const feedContentOptions: GenerationOptions = { model: config.contentModel, timeout: config.timeout };
  const signalContentOptions: GenerationOptions = { model: config.signalModel, timeout: config.timeout };
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
    // ── Provider (wrap in CapturingProvider to record prompts) ──────────────
    const innerProvider: GenerationProvider =
      provider ?? new AnthropicProvider();
    const capturing = new CapturingProvider(innerProvider);
    const resolvedProvider = capturing;

    const context = buildGenerationContext(room, round);

    let briefingOk = true;
    let contentOk = true;
    let npcOk = true;
    const sharedSubstackItems: ContentItem[] = [];

    // Helper: label and flush captured prompts since lastCallIdx
    let lastCallIdx = 0;
    function flushPrompts(artifact: string): void {
      const newCalls = capturing.calls.slice(lastCallIdx);
      lastCallIdx = capturing.calls.length;
      if (newCalls.length > 0) {
        appendGeneratedPrompts(room, round, newCalls.map(c => ({
          artifact,
          system: c.systemPrompt,
          user: c.userPrompt,
          model: c.model,
        })));
      }
    }

    // ── Briefing generation ─────────────────────────────────────────────────
    // Round 1 uses a pre-authored briefing for tone-setting consistency.
    if (round === 1) {
      setGeneratedBriefing(room, round, ROUND_1_BRIEFING);
      logger.log(EVENT_NAMES.GENERATION_SUCCESS, { artifact: "briefing", durationMs: 0, preAuthored: true }, { round, actorId: "system" });
    } else if (briefingsEnabled) {
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
      flushPrompts("briefing");
    }

    // ── Content generation ──────────────────────────────────────────────────
    // Split apps into feed-tier (Haiku, high volume) and signal-tier (Sonnet, high quality).
    // Both tiers run in parallel across all factions.
    if (allContentApps.length > 0) {
      const factionResults = await Promise.all(
        ALL_FACTIONS.map(async (faction) => {
          const factionApps = factionAppMap.get(faction) ?? allContentApps;
          const feedApps = factionApps.filter(app => (APP_CONTENT_TIER[app] ?? "feed") === "feed");
          const signalApps = factionApps.filter(app => APP_CONTENT_TIER[app] === "signal");
          const contentArtifact = `content:${faction}`;
          const startTs = Date.now();
          logGenerationStart(round, contentArtifact);
          logger.log(EVENT_NAMES.GENERATION_STARTED, { artifact: contentArtifact }, { round, actorId: "system" });

          // Generate feed and signal tiers in parallel with their respective models
          console.log(`[orchestrator:${faction}] feed=[${feedApps.join(",")}] signal=[${signalApps.join(",")}]`);
          const [feedResult, signalResult] = await Promise.all([
            feedApps.length > 0
              ? generateContentWithRetry(resolvedProvider, context, faction, feedApps, feedContentOptions)
              : Promise.resolve([] as AppContent[]),
            signalApps.length > 0
              ? generateContentWithRetry(resolvedProvider, context, faction, signalApps, signalContentOptions)
              : Promise.resolve([] as AppContent[]),
          ]);

          console.log(`[orchestrator:${faction}] feed=${feedResult === null ? "FAILED" : `${feedResult.length} apps`}, signal=${signalResult === null ? "FAILED" : `${signalResult.length} apps`}`);

          // Merge: null from either tier means that tier failed
          const contentResult = feedResult === null || signalResult === null
            ? null
            : [...(feedResult ?? []), ...(signalResult ?? [])];

          const durationMs = Date.now() - startTs;
          return { faction, contentResult, contentArtifact, durationMs };
        }),
      );

      for (const { faction, contentResult, contentArtifact, durationMs } of factionResults) {
        if (contentResult === null) {
          logGenerationFailure(round, contentArtifact, "generateContentWithRetry returned null", durationMs);
          logger.log(EVENT_NAMES.GENERATION_FAILURE, { artifact: contentArtifact, reason: "generateContentWithRetry returned null", durationMs }, { round, actorId: "system" });
          contentOk = false;
        } else {
          // Scrub fog leaks: replace hidden variable values that appear near keywords
          const allItems = contentResult.flatMap(ac => ac.items);
          const { items: scrubbedItems, scrubCount } = scrubFogLeaks(allItems, room.state, faction);
          if (scrubCount > 0) {
            console.log(`[fog-scrub:${faction}] Scrubbed ${scrubCount} fog leak(s) in round ${round}`);
            // Rebuild contentResult with scrubbed items
            const scrubbedMap = new Map(scrubbedItems.map(i => [i.id, i]));
            for (const appContent of contentResult) {
              appContent.items = appContent.items.map((i: ContentItem) => scrubbedMap.get(i.id) ?? i);
            }
          }
          // Log any remaining fog warnings (scrubbing may not catch everything)
          const fogResult = validateFogSafety(scrubbedItems, room.state, faction);
          if (fogResult.warnings.length > 0) {
            logValidationFailure(round, `fog-safety:${faction}`, fogResult.warnings);
          }
          const factionContent = contentResult.filter((appContent) => appContent.app !== "substack");
          const substackContent = contentResult.find((appContent) => appContent.app === "substack");
          if (substackContent) {
            sharedSubstackItems.push(...substackContent.items);
          }
          setGeneratedContent(room, round, faction, factionContent);
          logGenerationSuccess(round, contentArtifact, durationMs);
          logger.log(EVENT_NAMES.GENERATION_SUCCESS, { artifact: contentArtifact, durationMs }, { round, actorId: "system" });
        }
      }
      if (sharedSubstackItems.length > 0) {
        sharedSubstackItems.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setGeneratedSharedContent(room, round, [{
          faction: "external",
          app: "substack",
          items: sharedSubstackItems,
        }]);
      }
      flushPrompts("content");
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
      flushPrompts("npc");
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
      flushPrompts("decisions");
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

// ── retriggerDecisions ──────────────────────────────────────────────────────

/**
 * Standalone retry for decision generation only.
 *
 * Called when the decision phase starts but decisions aren't cached — either
 * the main orchestrator is still running (pending) or it already finished
 * without caching decisions (failed / decisions-specific failure).
 *
 * Skips the idempotency check of triggerGeneration since this targets only
 * the decisions artifact. Never throws.
 */
export async function retriggerDecisions(
  room: GameRoom,
  round: number,
): Promise<boolean> {
  try {
    const config = getGenerationConfig();
    if (!config.decisionsEnabled) return false;

    const provider = new AnthropicProvider();
    const context = buildGenerationContext(room, round);
    const templates = getTemplatesForRound(round);
    if (templates.length === 0) return false;

    const options: GenerationOptions = { model: config.decisionModel, timeout: config.timeout };
    console.log(`[decisions:retry] Retrying decision generation for round ${round}`);
    const result = await generateDecisionsWithRetry(provider, context, templates, round, options);
    if (result) {
      setGeneratedDecisions(room, round, result);
      console.log(`[decisions:retry] Success for round ${round}`);
      return true;
    }
    console.error(`[decisions:retry] Failed for round ${round}`);
    return false;
  } catch (err) {
    console.error(`[decisions:retry] Unexpected error for round ${round}:`, err);
    return false;
  }
}
