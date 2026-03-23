import type { Server } from "socket.io";
import type { AppContent, AppId, ContentItem, Faction, GameRoom, NpcTrigger, RoundDecisions } from "@takeoff/shared";
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
import { AnthropicProvider, CapturingProvider, type GenerationOptions, type GenerationProvider, type TokenUsage } from "./provider.js";
import { validateBriefing, validateFogSafety, scrubFogLeaks } from "./validate.js";
import { getLoggerForRoom } from "../logger/registry.js";
import { EVENT_NAMES } from "../logger/types.js";
import { emitBriefing, emitContentBatch } from "../game.js";
import { ROUND_1_BRIEFING } from "../content/round1Briefing.js";
import round1ContentData from "../content/round1Content.json";

// ── Factions for content generation ───────────────────────────────────────────

const ALL_FACTIONS: Faction[] = ["openbrain", "prometheus", "china", "external"];

// ── Usage accumulator ─────────────────────────────────────────────────────────

/** Creates a fresh zero-valued TokenUsage accumulator and an onUsage callback that sums into it. */
function makeUsageTracker(): { usage: TokenUsage; onUsage: (u: TokenUsage) => void } {
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
  const onUsage = (u: TokenUsage): void => {
    usage.inputTokens += u.inputTokens;
    usage.outputTokens += u.outputTokens;
    usage.cacheReadTokens += u.cacheReadTokens;
    usage.cacheCreationTokens += u.cacheCreationTokens;
  };
  return { usage, onUsage };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type GameLogger = ReturnType<typeof getLoggerForRoom>;

/** Check if the game has ended during async generation; if so, mark failed and signal abort. */
function checkAbort(room: GameRoom, round: number): boolean {
  if (room.phase === "ending") {
    console.log(`[orchestrator] Game ended during generation for round ${round}, aborting`);
    setGenerationStatus(room, round, "failed");
    return true;
  }
  return false;
}

function logArtifactStart(round: number, artifact: string, logger: GameLogger): void {
  logGenerationStart(round, artifact);
  logger.log(EVENT_NAMES.GENERATION_STARTED, { artifact }, { round, actorId: "system" });
}

function logArtifactFailure(round: number, artifact: string, reason: string, durationMs: number, logger: GameLogger): void {
  logGenerationFailure(round, artifact, reason, durationMs);
  logger.log(EVENT_NAMES.GENERATION_FAILURE, { artifact, reason, durationMs }, { round, actorId: "system" });
}

function logArtifactSuccess(round: number, artifact: string, durationMs: number, usage: TokenUsage, logger: GameLogger): void {
  logGenerationSuccess(round, artifact, durationMs, usage);
  logger.log(EVENT_NAMES.GENERATION_SUCCESS, { artifact, durationMs, usage }, { round, actorId: "system" });
}

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
  const feedContentBaseOptions: GenerationOptions = { model: config.contentModel, timeout: config.timeout };
  const signalContentBaseOptions: GenerationOptions = { model: config.signalModel, timeout: config.timeout };
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
      const startTs = Date.now();
      logArtifactStart(round, "briefing", logger);
      if (checkAbort(room, round)) return;

      const briefingTracker = makeUsageTracker();
      const briefingResult = await generateBriefingWithRetry(resolvedProvider, context, { ...briefingOptions, onUsage: briefingTracker.onUsage });
      const durationMs = Date.now() - startTs;

      if (briefingResult === null) {
        logArtifactFailure(round, "briefing", "generateBriefingWithRetry returned null", durationMs, logger);
        briefingOk = false;
      } else {
        const validation = validateBriefing(briefingResult);
        if (!validation.valid) {
          logValidationFailure(round, "briefing", validation.errors);
          logger.log(EVENT_NAMES.GENERATION_VALIDATION_FAILURE, { artifact: "briefing", errors: validation.errors }, { round, actorId: "system" });
          briefingOk = false;
        } else {
          setGeneratedBriefing(room, round, briefingResult);
          logArtifactSuccess(round, "briefing", durationMs, briefingTracker.usage, logger);
          if (io && room.round === round) {
            console.log(`[orchestrator] Re-emitting briefing for round ${round} (phase=${room.phase})`);
            emitBriefing(io, room);
          }
        }
      }
      flushPrompts("briefing");
    }

    // ── Launch decision generation early (runs in parallel with content/NPC) ─
    let decisionsPromise: Promise<RoundDecisions | null> | undefined;
    let decisionsStartTs: number | undefined;
    const decisionsTracker = makeUsageTracker();
    if (decisionsEnabled) {
      const templates = getTemplatesForRound(round);
      if (templates.length > 0) {
        decisionsStartTs = Date.now();
        logArtifactStart(round, "decisions", logger);
        decisionsPromise = generateDecisionsWithRetry(resolvedProvider, context, templates, round, { ...decisionOptions, onUsage: decisionsTracker.onUsage });
        console.log(`[orchestrator] Launched decision generation for round ${round} in parallel with content`);
      }
    }

    // ── Content generation ──────────────────────────────────────────────────
    // Round 1 uses pre-seeded content for instant availability.
    if (round === 1 && round1ContentData?.content) {
      const r1 = round1ContentData as {
        content: Record<string, AppContent[]>;
        sharedContent?: AppContent[];
        npcTriggers?: NpcTrigger[];
      };
      for (const faction of ALL_FACTIONS) {
        const factionContent = r1.content[faction];
        if (factionContent) {
          setGeneratedContent(room, round, faction, factionContent);
        }
      }
      if (r1.sharedContent) {
        setGeneratedSharedContent(room, round, r1.sharedContent);
      }
      if (r1.npcTriggers) {
        setGeneratedNpcTriggers(room, round, r1.npcTriggers);
      }
      console.log(`[orchestrator] Seeded pre-authored round 1 content + NPC triggers`);
    } else if (allContentApps.length > 0) {
    // Split apps into feed-tier (Haiku, high volume) and signal-tier (Sonnet, high quality).
    // Both tiers run in parallel across all factions. Each tier emits content
    // incrementally to players as it resolves (via game:content-batch), so
    // feed-tier items (Haiku, faster) appear within seconds.

      /** Scrub fog leaks on a tier result and return the scrubbed content. */
      function scrubTierResult(tierResult: AppContent[], faction: Faction): AppContent[] {
        const allItems = tierResult.flatMap(ac => ac.items);
        const { items: scrubbedItems, scrubCount } = scrubFogLeaks(allItems, room.state, faction);
        if (scrubCount > 0) {
          console.log(`[fog-scrub:${faction}] Scrubbed ${scrubCount} fog leak(s) in round ${round}`);
          const scrubbedMap = new Map(scrubbedItems.map(i => [i.id, i]));
          for (const appContent of tierResult) {
            appContent.items = appContent.items.map((i: ContentItem) => scrubbedMap.get(i.id) ?? i);
          }
        }
        return tierResult;
      }

      if (checkAbort(room, round)) return;

      const factionResults = await Promise.all(
        ALL_FACTIONS.map(async (faction) => {
          const factionApps = factionAppMap.get(faction) ?? allContentApps;
          const feedApps = factionApps.filter(app => (APP_CONTENT_TIER[app] ?? "feed") === "feed");
          const signalApps = factionApps.filter(app => APP_CONTENT_TIER[app] === "signal");
          const contentArtifact = `content:${faction}`;
          const startTs = Date.now();
          logArtifactStart(round, contentArtifact, logger);

          // Per-faction usage tracker accumulates across both feed and signal tiers
          const factionTracker = makeUsageTracker();
          const feedContentOptions: GenerationOptions = { ...feedContentBaseOptions, onUsage: factionTracker.onUsage };
          const signalContentOptions: GenerationOptions = { ...signalContentBaseOptions, onUsage: factionTracker.onUsage };

          // Generate feed and signal tiers in parallel with their respective models.
          // Each tier emits incrementally to players as it resolves.
          console.log(`[orchestrator:${faction}] feed=[${feedApps.join(",")}] signal=[${signalApps.join(",")}]`);
          const [feedResult, signalResult] = await Promise.all([
            feedApps.length > 0
              ? generateContentWithRetry(resolvedProvider, context, faction, feedApps, feedContentOptions)
                  .then(result => {
                    if (result && io) {
                      const scrubbed = scrubTierResult(result, faction);
                      const nonSubstack = scrubbed.filter(ac => ac.app !== "substack");
                      if (nonSubstack.length > 0) emitContentBatch(io, room, faction, nonSubstack);
                      console.log(`[orchestrator:${faction}] feed tier emitted ${nonSubstack.flatMap(ac => ac.items).length} items incrementally`);
                    }
                    return result;
                  })
              : Promise.resolve([] as AppContent[]),
            signalApps.length > 0
              ? generateContentWithRetry(resolvedProvider, context, faction, signalApps, signalContentOptions)
                  .then(result => {
                    if (result && io) {
                      const scrubbed = scrubTierResult(result, faction);
                      emitContentBatch(io, room, faction, scrubbed);
                      console.log(`[orchestrator:${faction}] signal tier emitted ${scrubbed.flatMap(ac => ac.items).length} items incrementally`);
                    }
                    return result;
                  })
              : Promise.resolve([] as AppContent[]),
          ]);

          console.log(`[orchestrator:${faction}] feed=${feedResult === null ? "FAILED" : `${feedResult.length} apps`}, signal=${signalResult === null ? "FAILED" : `${signalResult.length} apps`}`);

          // Merge: null from either tier means that tier failed
          const contentResult = feedResult === null || signalResult === null
            ? null
            : [...(feedResult ?? []), ...(signalResult ?? [])];

          const durationMs = Date.now() - startTs;
          return { faction, contentResult, contentArtifact, durationMs, contentUsage: factionTracker.usage };
        }),
      );

      for (const { faction, contentResult, contentArtifact, durationMs, contentUsage } of factionResults) {
        if (contentResult === null) {
          logArtifactFailure(round, contentArtifact, "generateContentWithRetry returned null", durationMs, logger);
          contentOk = false;
        } else {
          const allItems = contentResult.flatMap(ac => ac.items);
          const fogResult = validateFogSafety(allItems, room.state, faction);
          if (fogResult.warnings.length > 0) {
            logValidationFailure(round, `fog-safety:${faction}`, fogResult.warnings);
          }
          const factionContent = contentResult.filter((appContent) => appContent.app !== "substack");
          const substackContent = contentResult.find((appContent) => appContent.app === "substack");
          if (substackContent) {
            sharedSubstackItems.push(...substackContent.items);
          }
          setGeneratedContent(room, round, faction, factionContent);
          logArtifactSuccess(round, contentArtifact, durationMs, contentUsage, logger);
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
    // Round 1 NPC triggers are seeded above with content.
    if (npcEnabled && round !== 1) {
      const startTs = Date.now();
      logArtifactStart(round, "npc", logger);
      if (checkAbort(room, round)) return;

      const npcTracker = makeUsageTracker();
      const npcResult = await generateNpcMessagesWithRetry(resolvedProvider, context, { ...npcOptions, onUsage: npcTracker.onUsage });
      const durationMs = Date.now() - startTs;

      if (npcResult === null) {
        logArtifactFailure(round, "npc", "generateNpcMessagesWithRetry returned null", durationMs, logger);
        npcOk = false;
      } else {
        setGeneratedNpcTriggers(room, round, npcResult);
        logArtifactSuccess(round, "npc", durationMs, npcTracker.usage, logger);
      }
      flushPrompts("npc");
    }

    // ── Decision generation (await the promise we launched earlier) ──────────
    let decisionsOk = true;
    if (decisionsEnabled) {
      const templates = getTemplatesForRound(round);
      if (templates.length > 0) {
        const startTs = decisionsStartTs ?? Date.now();
        if (!decisionsPromise) {
          logArtifactStart(round, "decisions", logger);
          decisionsPromise = generateDecisionsWithRetry(resolvedProvider, context, templates, round, { ...decisionOptions, onUsage: decisionsTracker.onUsage });
        }

        if (checkAbort(room, round)) return;

        const decisionsResult = await decisionsPromise;
        const durationMs = Date.now() - startTs;

        if (decisionsResult === null) {
          logArtifactFailure(round, "decisions", "generateDecisionsWithRetry returned null", durationMs, logger);
          decisionsOk = false;
        } else {
          setGeneratedDecisions(room, round, decisionsResult);
          logArtifactSuccess(round, "decisions", durationMs, decisionsTracker.usage, logger);
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
    // INV-1: triggerGeneration must never throw — unexpected errors degrade generation for this round
    console.error(`[generation] Unexpected error for round ${round} in room ${room.code}:`, err);
    setGenerationStatus(room, round, "failed");
    if (io) {
      io.to(room.code).emit("game:generation-status", {
        round,
        status: "degraded",
        message: "Content generation failed — some round content may be unavailable",
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
