import type { Server, Socket } from "socket.io";
import type { AppContent, AppId, ContentItem, DecisionOption, Faction, GameMessage, GamePhase, GameRoom, IndividualDecision, Player, Publication, PublicationType, ResolutionData, Role, StateDelta, StateVariables, TeamDecision } from "@takeoff/shared";
import { FACTIONS, PHASE_DURATIONS, ROUND4_PHASE_DURATIONS, TOTAL_ROUNDS, STATE_LABELS, STATE_VARIABLE_RANGES, computeFogView, resolveDecisions, computeEndingArcs, clampState } from "@takeoff/shared";
import { getLoggerForRoom, closeLoggerForRoom } from "./logger/registry.js";
import { EVENT_NAMES } from "./logger/index.js";
import { getGeneratedBriefing, getGeneratedContent, getGeneratedDecisions, getGeneratedNpcTriggers } from "./generation/cache.js";
import { triggerGeneration } from "./generation/orchestrator.js";
import { TUTORIAL_CONTENT } from "./content/tutorial.js";
import { getNpcPersona } from "./content/npcPersonas.js";
import { applyActivityPenalties } from "./activityPenalties.js";
import { updateStoryBible } from "./generation/context.js";
import { cleanupRoom } from "./extendUses.js";

const PHASE_ORDER: GamePhase[] = ["briefing", "intel", "deliberation", "decision", "resolution"];
const phaseTimers = new Map<string, ReturnType<typeof setTimeout>>(); // roomCode → timer

/**
 * Build a map of role_id → first name from all players in the room.
 * Used to resolve {role_id} placeholders in content text.
 */
export function buildNameMap(room: GameRoom): Map<string, string> {
  const map = new Map<string, string>();
  for (const player of Object.values(room.players)) {
    if (player.role && player.name) {
      map.set(player.role, player.name.split(/\s/)[0]); // first name only
    }
  }
  return map;
}

/**
 * Replace {role_id} placeholders in text with actual player names.
 * Unmatched placeholders pass through unchanged.
 */
export function personalizeText(text: string, nameMap: Map<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, role) => nameMap.get(role) ?? match);
}

/**
 * Personalize all content items in an AppContent array.
 * Only body and subject fields are modified — sender fields identify NPC characters and are left intact.
 */
export function personalizeContent(content: AppContent[], nameMap: Map<string, string>): AppContent[] {
  return content.map(appContent => ({
    ...appContent,
    items: appContent.items.map(item => {
      const personalized = { ...item, body: personalizeText(item.body, nameMap) };
      if (item.subject !== undefined) {
        personalized.subject = personalizeText(item.subject, nameMap);
      }
      return personalized;
    }),
  }));
}

function getPhaseDuration(room: GameRoom, phase: GamePhase): number {
  // GM overrides take precedence; fall back to round-specific or default durations
  const override = room.timerOverrides?.[phase];
  if (override !== undefined) return override * 1000;
  const durations = room.round === 4 ? ROUND4_PHASE_DURATIONS : PHASE_DURATIONS;
  return (durations[phase] ?? 180) * 1000;
}

function setPhaseTimer(io: Server, room: GameRoom) {
  const duration = getPhaseDuration(room, room.phase);
  room.timer = { endsAt: Date.now() + duration };

  syncPhaseTimer(io, room);
}

export function clearPhaseTimer(room: GameRoom) {
  const existing = phaseTimers.get(room.code);
  if (existing) {
    clearTimeout(existing);
    phaseTimers.delete(room.code);
  }
}

/**
 * Reconcile the underlying server timeout with the current room.timer values.
 * Use this whenever timer values are adjusted in-place (pause/resume/extend).
 */
export function syncPhaseTimer(io: Server, room: GameRoom) {
  clearPhaseTimer(room);
  if (room.timer.pausedAt) return;
  if (room.phase === "lobby" || room.phase === "ending") return;

  const remaining = Math.max(0, room.timer.endsAt - Date.now());
  const expectedRound = room.round;
  const expectedPhase = room.phase;
  const expectedEndsAt = room.timer.endsAt;
  const timer = setTimeout(() => {
    // Guard against a manual GM advance landing in the same tick as a timeout.
    if (room.round !== expectedRound) return;
    if (room.phase !== expectedPhase) return;
    if (room.timer.endsAt !== expectedEndsAt) return;
    if (room.timer.pausedAt) return;
    advancePhase(io, room);
  }, remaining);

  phaseTimers.set(room.code, timer);
}

export function startGame(io: Server, room: GameRoom) {
  // Validate all players have selected roles
  const allReady = Object.values(room.players).every(p => p.faction && p.role);
  if (!allReady) return;

  room.round = 1;
  room.phase = "briefing";
  room.decisions = {};
  room.teamDecisions = {};
  room.teamVotes = {};
  setPhaseTimer(io, room);
  void triggerGeneration(room, 1, undefined, io);

  // Emit phase change
  io.to(room.code).emit("game:phase", {
    phase: room.phase,
    round: room.round,
    timer: room.timer,
  });

  // Emit fog-of-war views to each player
  emitStateViews(io, room);

  // Emit briefing text (faction-specific)
  emitBriefing(io, room);

  const logger = getLoggerForRoom(room.code);
  logger.log(EVENT_NAMES.GAME_STARTED, {
    code: room.code,
    playerCount: Object.keys(room.players).length,
    roster: Object.values(room.players).map(p => ({ name: p.name, faction: p.faction, role: p.role })),
  }, { round: 1, phase: "briefing" });
}

/**
 * Start the optional tutorial round (round 0).
 * Players land on the desktop with sample content; no state penalties apply.
 * INV: round must be 0 after this call; phase must be 'intel'.
 */
export function startTutorial(io: Server, room: GameRoom) {
  const allReady = Object.values(room.players).every(p => p.faction && p.role);
  if (!allReady) return;

  room.round = 0;
  room.phase = "intel";
  room.decisions = {};
  room.teamDecisions = {};
  room.teamVotes = {};

  setPhaseTimer(io, room);

  io.to(room.code).emit("game:phase", {
    phase: room.phase,
    round: room.round,
    timer: room.timer,
  });

  emitStateViews(io, room);
  emitBriefing(io, room);
  emitContent(io, room);
}

/**
 * End the tutorial round and start the real game at Round 1 Briefing.
 * INV: room.round must be 0 before this call; it will be 1 after.
 */
export function endTutorial(io: Server, room: GameRoom) {
  if (room.round !== 0) return; // guard: only valid from tutorial

  room.round = 1;
  room.phase = "briefing";
  room.decisions = {};
  room.teamDecisions = {};
  room.teamVotes = {};
  // Clear tutorial content so players get real round 1 content
  room.playerActivity = {};

  setPhaseTimer(io, room);
  void triggerGeneration(room, 1, undefined, io);

  io.to(room.code).emit("game:phase", {
    phase: room.phase,
    round: room.round,
    timer: room.timer,
  });

  emitStateViews(io, room);
  emitBriefing(io, room);
}

export function advancePhase(io: Server, room: GameRoom) {
  // If in tutorial round (0), any advance transitions to Round 1 Briefing
  if (room.round === 0) {
    endTutorial(io, room);
    return;
  }

  const prevPhase = room.phase;
  const currentIndex = PHASE_ORDER.indexOf(room.phase as GamePhase);

  if (currentIndex === -1) return; // unknown phase

  if (currentIndex < PHASE_ORDER.length - 1) {
    // Next phase within the round
    room.phase = PHASE_ORDER[currentIndex + 1];

    // Notify players who did not submit when decision phase expires
    if (prevPhase === "decision" && room.phase === "resolution") {
      const now = Date.now();
      const inactionLogger = getLoggerForRoom(room.code);
      for (const [socketId, player] of Object.entries(room.players)) {
        if (!player.faction || !player.role) continue;
        if (!(socketId in room.decisions)) {
          io.to(socketId).emit("game:notification", {
            id: `inaction-${socketId}-r${room.round}`,
            summary: "You did not submit a decision. Inaction was applied.",
            from: "system",
            timestamp: now,
          });
          inactionLogger.log(EVENT_NAMES.DECISION_INACTION, {
            playerId: player.name,
            role: player.role,
            round: room.round,
          }, { round: room.round, phase: "resolution", actorId: player.name });
        }
      }
    }
  } else {
    // End of round
    if (room.phase === "resolution") {
      if (room.round >= TOTAL_ROUNDS) {
        room.phase = "ending";
        clearPhaseTimer(room);
        io.to(room.code).emit("game:phase", {
          phase: room.phase,
          round: room.round,
          timer: { endsAt: 0 },
        });

        // Compute and emit ending data with fog of war lifted
        const arcs = computeEndingArcs(room.state);
        io.to(room.code).emit("game:ending", {
          arcs,
          history: room.history,
          finalState: room.state,
          players: room.players,
        });

        // Log phase change and game ended, then close logger
        const logger = getLoggerForRoom(room.code);
        logger.log(EVENT_NAMES.PHASE_CHANGED, {
          round: room.round,
          phase: room.phase,
          prevPhase,
          duration: 0,
        }, { round: room.round, phase: room.phase, actorId: "system" });
        logger.log(EVENT_NAMES.GAME_ENDED, {
          code: room.code,
          finalState: room.state,
          arcs,
        });
        void closeLoggerForRoom(room.code);
        cleanupRoom(room.code);

        return;
      }

      // Next round
      room.round++;
      room.phase = "briefing";
      room.decisions = {};
      room.teamDecisions = {};
      room.teamVotes = {};
    }
  }

  // Set timer before emitting phase so clients always get fresh endsAt.
  setPhaseTimer(io, room);

  io.to(room.code).emit("game:phase", {
    phase: room.phase,
    round: room.round,
    timer: room.timer,
  });

  const phaseLogger = getLoggerForRoom(room.code);
  phaseLogger.log(EVENT_NAMES.PHASE_CHANGED, {
    round: room.round,
    phase: room.phase,
    prevPhase,
    duration: getPhaseDuration(room, room.phase),
  }, { round: room.round, phase: room.phase, actorId: "system" });

  emitStateViews(io, room);

  if (room.phase === "briefing") {
    emitBriefing(io, room);
  }

  if (room.phase === "intel") {
    emitContent(io, room);
  }

  if (room.phase === "decision") {
    emitDecisions(io, room);
    // Dev bot autoplay — never bundled in production
    if (process.env.NODE_ENV !== "production") {
      void import("./devBots.js").then(({ scheduleBotDecisionSubmissions }) => {
        scheduleBotDecisionSubmissions(io, room, { mode: "all_roles" });
      });
    }
  }

  if (room.phase === "resolution") {
    emitResolution(io, room); // emitResolution already calls checkThresholds internally
  } else {
    // Fire NPC schedule triggers (and any condition triggers met by current state)
    // for every non-resolution phase transition.
    checkThresholds(io, room);
  }

}

/**
 * Returns the active decisions for the given round — generated if available, pre-authored otherwise.
 * Used by emitDecisions(), emitResolution(), reconnect replay, and event handlers.
 */
export function getActiveDecisions(room: GameRoom, round: number) {
  return getGeneratedDecisions(room, round);
}

export function emitDecisions(io: Server, room: GameRoom) {
  // Tutorial round has no real decisions
  if (room.round === 0) return;
  const roundDecisions = getActiveDecisions(room, room.round);
  if (!roundDecisions) return;

  for (const [socketId, player] of Object.entries(room.players)) {
    if (!player.faction || !player.role) continue;
    const individual: IndividualDecision | undefined = roundDecisions.individual.find((d: IndividualDecision) => d.role === player.role);
    const team: TeamDecision | undefined = roundDecisions.team.find((d: TeamDecision) => d.faction === player.faction);
    io.to(socketId).emit("game:decisions", { individual: individual ?? null, team: team ?? null });
  }
}

export function emitStateViews(io: Server, room: GameRoom) {
  for (const [socketId, player] of Object.entries(room.players)) {
    if (!player.faction || !player.role) continue;
    const view = computeFogView(room.state, player.faction, room.round);
    io.to(socketId).emit("game:state", { view });
  }

  // GM gets full state
  if (room.gmId) {
    io.to(room.gmId).emit("game:state", { view: room.state, isFull: true });
  }
}

/**
 * Resolve the briefing text for a specific player from generated content.
 * Returns a placeholder if generation hasn't completed yet.
 * Applies name personalization.
 */
function getBriefingTextForPlayer(room: GameRoom, player: Player, nameMap: Map<string, string>): string {
  const generated = getGeneratedBriefing(room, room.round);
  if (!generated) return "Content generation in progress...";
  const { common, factionVariants } = generated;
  const variant = factionVariants?.[player.faction!];
  const combined = variant ? `${common}\n\n${variant}` : common;
  return personalizeText(combined, nameMap);
}

export function emitBriefing(io: Server, room: GameRoom) {
  try {
    const nameMap = buildNameMap(room);

    for (const [socketId, player] of Object.entries(room.players)) {
      if (!player.faction) continue;
      const text = getBriefingTextForPlayer(room, player, nameMap);
      io.to(socketId).emit("game:briefing", { text });
    }

    // GM gets the common briefing (unmodified — no player name context needed)
    if (room.gmId) {
      const generated = getGeneratedBriefing(room, room.round);
      const text = generated?.common ?? "Content generation in progress...";
      io.to(room.gmId).emit("game:briefing", { text });
    }
  } catch (err) {
    console.warn(`[briefing] No briefing content for round ${room.round}:`, err);
  }
}

function getContentForPlayer(room: GameRoom, player: Player): AppContent[] {
  if (room.round === 0) {
    return TUTORIAL_CONTENT.filter((c) => c.faction === player.faction!);
  }
  return getGeneratedContent(room, room.round, player.faction!) ?? [];
}

export function emitContent(io: Server, room: GameRoom) {
  const nameMap = buildNameMap(room);
  for (const [socketId, player] of Object.entries(room.players)) {
    if (!player.faction || !player.role) continue;
    const content = getContentForPlayer(room, player);
    const personalized = personalizeContent(content, nameMap);
    io.to(socketId).emit("game:content", { content: personalized });
  }
}

// ── Threshold Events ──

// ── Threshold Registry Types ─────────────────────────────────────────────────

interface ThresholdEffect {
  variable: keyof StateVariables;
  delta: number;
}

type ThresholdNotify =
  | { target: "faction"; faction: Faction; message: string }
  | { target: "all"; message: string };

interface ThresholdNews {
  headline: string;
  body: string;
  source: string;
  publishedBy: Role;
}

interface ThresholdDef {
  id: string;
  condition: (s: StateVariables) => boolean;
  /** Variable name used for logging the trigger value */
  triggerVariable: keyof StateVariables;
  effects?: ThresholdEffect[];
  /** Room-level boolean flag to set to true on fire */
  roomFlag?: keyof Pick<GameRoom, "uiDegradationActive">;
  news?: ThresholdNews;
  notify?: ThresholdNotify;
  gmMessage: string;
}

// ── Threshold Registry ───────────────────────────────────────────────────────

const THRESHOLD_REGISTRY: ThresholdDef[] = [
  {
    id: "china_weight_theft",
    condition: (s) => s.chinaWeightTheftProgress >= 100,
    triggerVariable: "chinaWeightTheftProgress",
    effects: [
      { variable: "chinaCapability", delta: 25 },
      { variable: "taiwanTension", delta: 15 },
    ],
    notify: {
      target: "faction",
      faction: "openbrain",
      message: "SECURITY CRISIS: Intelligence confirms Chinese operatives have successfully exfiltrated OpenBrain model weights. Emergency lockdown initiated.",
    },
    news: {
      headline: "China's DeepCent AI Surges After Suspected US Lab Breach",
      body: "DeepCent AI has demonstrated a sudden and dramatic capability jump. Intelligence sources point to a successful exfiltration of proprietary OpenBrain model weights. Taiwan Strait activity has increased sharply.",
      source: "Breaking News Network",
      publishedBy: "china_intel",
    },
    gmMessage: "[GM] THRESHOLD FIRED: China Weight Theft — chinaCapability+25, taiwanTension+15",
  },
  {
    id: "whistleblower_autoleak",
    condition: (s) => s.whistleblowerPressure >= 80,
    triggerVariable: "whistleblowerPressure",
    effects: [
      { variable: "publicAwareness", delta: 25 },
      { variable: "publicSentiment", delta: -15 },
      { variable: "obInternalTrust", delta: -20 },
    ],
    notify: {
      target: "faction",
      faction: "openbrain",
      message: "MEMO LEAKED: Whistleblower protections have triggered an automatic leak of safety concerns. The memo is now public.",
    },
    news: {
      headline: "LEAKED: OpenBrain Internal Memo Reveals Suppressed Safety Concerns",
      body: "An internal OpenBrain memo has been leaked, revealing that senior safety staff flagged serious alignment concerns that were overruled by leadership. The leak appears to have been triggered by internal whistleblower protocols.",
      source: "Anonymous Source",
      publishedBy: "ob_safety",
    },
    gmMessage: "[GM] THRESHOLD FIRED: Whistleblower Auto-Leak — publicAwareness+25, publicSentiment-15, obInternalTrust-20",
  },
  {
    id: "ob_board_revolt",
    condition: (s) => s.obBoardConfidence < 30,
    triggerVariable: "obBoardConfidence",
    effects: [{ variable: "obInternalTrust", delta: -10 }],
    notify: {
      target: "faction",
      faction: "openbrain",
      message: "BOARD REVOLT: The OpenBrain board has lost confidence in current leadership. They are demanding a leadership change before the next decision phase.",
    },
    gmMessage: "[GM] THRESHOLD FIRED: OB Board Revolt — obInternalTrust-10, leadership change demanded",
  },
  {
    id: "ccp_military_mandate",
    condition: (s) => s.ccpPatience < 20,
    triggerVariable: "ccpPatience",
    notify: {
      target: "faction",
      faction: "china",
      message: "MILITARY MANDATE: CCP leadership has exhausted patience with civilian caution. Military options are now mandatory — not optional — in the next decision phase.",
    },
    gmMessage: "[GM] THRESHOLD FIRED: CCP Military Mandate — China military options become mandatory",
  },
  {
    id: "prom_alignment_breakthrough",
    condition: (s) => s.promSafetyBreakthroughProgress >= 80,
    triggerVariable: "promSafetyBreakthroughProgress",
    effects: [{ variable: "alignmentConfidence", delta: 15 }],
    notify: {
      target: "faction",
      faction: "prometheus",
      message: "BREAKTHROUGH: Your safety team has achieved a major alignment breakthrough. Interpretability results are unprecedented. This changes everything.",
    },
    news: {
      headline: "Prometheus Reports Major Alignment Breakthrough in Preprint",
      body: "Prometheus AI has published a preprint claiming a significant advance in AI alignment and interpretability. Independent researchers are calling the results 'remarkable' and 'potentially transformative for AI safety.'",
      source: "Prometheus AI Research",
      publishedBy: "prom_scientist",
    },
    gmMessage: "[GM] THRESHOLD FIRED: Prometheus Alignment Breakthrough — alignmentConfidence+15",
  },
  {
    id: "regulatory_emergency_powers",
    condition: (s) => s.regulatoryPressure >= 70,
    triggerVariable: "regulatoryPressure",
    notify: {
      target: "faction",
      faction: "external",
      message: "EMERGENCY POWERS: Regulatory pressure has reached critical levels. You now have expanded authority including DPA invocation and potential lab nationalization options.",
    },
    gmMessage: "[GM] THRESHOLD FIRED: Regulatory Emergency Powers — NSA gets expanded decision options",
  },
  {
    id: "point_of_no_return",
    condition: (s) => s.doomClockDistance <= 1,
    triggerVariable: "doomClockDistance",
    gmMessage: "[GM] THRESHOLD FIRED: Point of No Return — doom clock at critical level. Shift briefing tone to urgent.",
  },
  {
    id: "ui_degradation",
    condition: (s) => s.aiAutonomyLevel >= 60 && s.alignmentConfidence < 40,
    triggerVariable: "aiAutonomyLevel",
    roomFlag: "uiDegradationActive",
    notify: {
      target: "all",
      message: "SYSTEM INSTABILITY: AI systems are exhibiting unexpected autonomous behaviors. You may experience interface anomalies.",
    },
    gmMessage: "[GM] THRESHOLD FIRED: UI Degradation active — aiAutonomyLevel≥60 & alignmentConfidence<40",
  },
];

/**
 * Helper: inject a news headline and tweet to all players and GM.
 * Uses the game:publish socket event which clients use to append content.
 */
function injectNewsContent(
  io: Server,
  room: GameRoom,
  id: string,
  title: string,
  body: string,
  source: string,
  publishedBy: Role,
  now: number,
): void {
  const timestamp = new Date(now).toISOString();
  const newsItem: ContentItem = {
    id: `threshold-news-${id}`,
    type: "headline",
    round: room.round,
    sender: source,
    subject: title,
    body,
    timestamp,
    classification: "critical",
  };
  const twitterItem: ContentItem = {
    id: `threshold-twitter-${id}`,
    type: "tweet",
    round: room.round,
    sender: source,
    body: `BREAKING: ${title} — ${body.slice(0, 200)}${body.length > 200 ? "…" : ""}`,
    timestamp,
    classification: "critical",
  };
  const publication: Publication = {
    id,
    type: "leak" as PublicationType,
    title,
    content: body,
    source,
    publishedBy,
    publishedAt: now,
    round: room.round,
  };
  const summary = `BREAKING: ${title}`;

  for (const [playerId, player] of Object.entries(room.players)) {
    if (!player.faction) continue;
    const newsContent: AppContent = { faction: player.faction, role: player.role ?? undefined, app: "news", items: [newsItem] };
    const twitterContent: AppContent = { faction: player.faction, role: player.role ?? undefined, app: "twitter", items: [twitterItem] };
    io.to(playerId).emit("game:publish", { publication, newsContent, twitterContent, summary });
  }
  if (room.gmId) {
    const newsContent: AppContent = { faction: "external" as Faction, app: "news", items: [newsItem] };
    const twitterContent: AppContent = { faction: "external" as Faction, app: "twitter", items: [twitterItem] };
    io.to(room.gmId).emit("game:publish", { publication, newsContent, twitterContent, summary });
  }
}

/**
 * Check all threshold conditions and fire events for any that have been crossed.
 * Thresholds fire at most once per room (tracked in room.firedThresholds).
 * INV: room.state must already reflect all decision and penalty effects before this is called.
 * INV: each threshold ID fires at most once (checked via firedThresholds Set).
 */
export function checkThresholds(io: Server, room: GameRoom): void {
  if (!room.firedThresholds) room.firedThresholds = new Set();
  const fired = room.firedThresholds;
  const s = room.state;
  const now = Date.now();
  const threshLogger = getLoggerForRoom(room.code);

  // Helper: get socket IDs for players of a specific faction
  const factionSockets = (faction: Faction): string[] =>
    Object.entries(room.players)
      .filter(([, p]) => p.faction === faction)
      .map(([id]) => id);

  // Helper: notify a list of socket IDs
  const notify = (socketIds: string[], id: string, summary: string): void => {
    for (const socketId of socketIds) {
      io.to(socketId).emit("game:notification", { id, summary, from: "system", timestamp: now });
    }
  };

  // ── Threshold Registry Loop ──────────────────────────────────────────────────
  for (const def of THRESHOLD_REGISTRY) {
    if (fired.has(def.id) || !def.condition(s)) continue;
    fired.add(def.id);

    // Apply state effects with clamping from canonical ranges
    for (const effect of def.effects ?? []) {
      const [min, max] = STATE_VARIABLE_RANGES[effect.variable];
      (s[effect.variable] as number) = Math.min(max, Math.max(min, (s[effect.variable] as number) + effect.delta));
    }

    // Set room flag if specified
    if (def.roomFlag) {
      room[def.roomFlag] = true;
    }

    // Player notification
    if (def.notify) {
      if (def.notify.target === "faction") {
        notify(factionSockets(def.notify.faction), def.id, def.notify.message);
      } else {
        // target === "all"
        for (const socketId of Object.keys(room.players)) {
          io.to(socketId).emit("game:notification", { id: def.id, summary: def.notify.message, from: "system", timestamp: now });
        }
      }
    }

    // News injection
    if (def.news) {
      injectNewsContent(io, room, def.id, def.news.headline, def.news.body, def.news.source, def.news.publishedBy, now);
    }

    // GM notification
    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: `gm_${def.id}`,
        summary: def.gmMessage,
        from: "system",
        timestamp: now,
      });
    }

    console.log(`[threshold] ${def.id} fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: def.id,
      round: room.round,
      phase: room.phase,
      triggerVariable: def.triggerVariable,
      triggerValue: s[def.triggerVariable],
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── NPC Triggers ─────────────────────────────────────────────────────────────
  // Skip tutorial round; NPC triggers only make sense in real rounds.
  if (room.round < 1) return;

  // Helper: return [socketId, Player] pairs matching a trigger's target spec.
  const resolveTargets = (target: { faction?: Faction; role?: Role }): Array<[string, Player]> =>
    Object.entries(room.players).filter(([, p]) => {
      if (!p.faction || !p.role) return false;
      if (target.faction && p.faction !== target.faction) return false;
      if (target.role && p.role !== target.role) return false;
      return true;
    });

  const allTriggers = getGeneratedNpcTriggers(room, room.round) ?? [];

  for (const trigger of allTriggers) {
    if (fired.has(trigger.id)) continue;

    let conditionMet = false;

    if (trigger.condition) {
      const val = s[trigger.condition.variable];
      switch (trigger.condition.operator) {
        case "gte": conditionMet = val >= trigger.condition.value; break;
        case "lte": conditionMet = val <= trigger.condition.value; break;
        case "eq": conditionMet = val === trigger.condition.value; break;
      }
    } else if (trigger.schedule) {
      conditionMet = trigger.schedule.round === room.round && trigger.schedule.phase === room.phase;
    }

    if (!conditionMet) continue;

    const persona = getNpcPersona(trigger.npcId);
    if (!persona) {
      console.warn(`[npc-trigger] Unknown npcId '${trigger.npcId}' for trigger '${trigger.id}'`);
      continue;
    }

    const targets = resolveTargets(trigger.target);
    for (const [playerSocketId, player] of targets) {
      const msg: GameMessage = {
        id: `npc-${trigger.id}-${playerSocketId}`,
        from: trigger.npcId,
        fromName: persona.name,
        to: playerSocketId,
        faction: player.faction as Faction,
        content: trigger.content,
        timestamp: now,
        isTeamChat: false,
        isNpc: true,
      };

      room.messages.push(msg);
      io.to(playerSocketId).emit("message:receive", msg);
      if (room.gmId) {
        io.to(room.gmId).emit("message:receive", { ...msg, _gmView: true });
      }
    }

    fired.add(trigger.id);
    console.log(`[npc-trigger] ${trigger.id} fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.NPC_TRIGGER_FIRED, {
      triggerId: trigger.id,
      npcId: trigger.npcId,
      targetFaction: trigger.target.faction,
      round: room.round,
      phase: room.phase,
      wasCondition: !!trigger.condition,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }
}

export function buildNarrative(
  teamDecisions: Record<string, { optionId: string; label: string }>,
  round: number,
  activeFactions: string[] = [],
): string {
  const factionNames: Record<string, string> = {
    openbrain: "OpenBrain",
    prometheus: "Prometheus",
    china: "China (DeepCent)",
    external: "External Stakeholders",
  };

  const lines: string[] = [`Round ${round} decisions are in. The world shifts.`];

  for (const [faction, decision] of Object.entries(teamDecisions)) {
    const name = factionNames[faction] ?? faction;
    lines.push(`${name} chose to ${decision.label.toLowerCase()}.`);
  }

  for (const faction of activeFactions) {
    if (!(faction in teamDecisions)) {
      const name = factionNames[faction] ?? faction;
      lines.push(`${name} chose inaction — no team decision was submitted.`);
    }
  }

  lines.push("The consequences ripple through the system. See the state changes below.");

  return lines.join("\n\n");
}

function emitResolution(io: Server, room: GameRoom) {
  const roundDecisions = getActiveDecisions(room, room.round);
  const stateBefore = { ...room.state };
  const resLogger = getLoggerForRoom(room.code);
  resLogger.log(EVENT_NAMES.STATE_SNAPSHOT, {
    round: room.round,
    stateBefore,
  }, { round: room.round, phase: room.phase, actorId: "system" });

  // Collect all chosen DecisionOption objects
  const chosenOptions: DecisionOption[] = [];

  // Individual decisions: playerId → optionId
  for (const [playerId, optionId] of Object.entries(room.decisions)) {
    const player = room.players[playerId];
    if (!player || !roundDecisions) continue;

    // Search all individual decisions for this option
    for (const indiv of roundDecisions.individual) {
      const opt = indiv.options.find((o) => o.id === optionId);
      if (opt) {
        chosenOptions.push(opt);
        break;
      }
    }
  }

  // Team decisions: faction → optionId
  const teamDecisionSummary: Record<string, { optionId: string; label: string }> = {};
  for (const [faction, optionId] of Object.entries(room.teamDecisions)) {
    if (!roundDecisions) continue;
    const teamDec = roundDecisions.team.find((t) => t.faction === (faction as Faction));
    if (!teamDec) continue;
    const opt = teamDec.options.find((o) => o.id === optionId);
    if (opt) {
      chosenOptions.push(opt);
      teamDecisionSummary[faction] = { optionId: opt.id, label: opt.label };
    }
  }

  // Apply decisions to state
  const stateAfter = resolveDecisions(stateBefore, chosenOptions);
  room.state = stateAfter;

  // Apply activity penalties (players who skipped their primary app)
  const appliedPenalties = applyActivityPenalties(room);
  clampState(room.state); // ensure penalties respect canonical bounds
  for (const p of appliedPenalties) {
    const player = room.players[p.playerId];
    if (!player) continue;
    resLogger.log(EVENT_NAMES.ACTIVITY_PENALTY, {
      playerId: player.name,
      role: p.role,
      primaryApp: p.primaryApp,
      variable: p.variable,
      delta: p.delta,
    }, { round: room.round, phase: room.phase, actorId: player.name });
  }
  // Reset activity tracking for next round
  room.playerActivity = {};

  // Fire any threshold events that have been crossed
  checkThresholds(io, room);

  // Accumulate narrative events for this round into the story bible
  updateStoryBible(room);

  const historyEntry = {
    round: room.round,
    decisions: { ...room.decisions },
    teamDecisions: { ...room.teamDecisions },
    stateBefore,
    stateAfter: { ...room.state },
  };
  const existingIdx = room.history.findIndex((h) => h.round === room.round);
  if (existingIdx >= 0) {
    room.history[existingIdx] = historyEntry;
  } else {
    room.history.push(historyEntry);
  }

  // Trigger async generation for next round — fire-and-forget, never blocks resolution
  void triggerGeneration(room, room.round + 1, undefined, io);

  // Log state delta (decisions + penalties + thresholds) and final snapshot
  resLogger.log(EVENT_NAMES.STATE_DELTA, {
    round: room.round,
    changes: (Object.keys(room.state) as (keyof StateVariables)[])
      .filter(k => room.state[k] !== stateBefore[k])
      .map(k => ({ variable: k as string, before: stateBefore[k], after: room.state[k], cause: "resolution" })),
  }, { round: room.round, phase: room.phase, actorId: "system" });
  resLogger.log(EVENT_NAMES.STATE_SNAPSHOT, {
    round: room.round,
    stateAfter: { ...room.state },
  }, { round: room.round, phase: room.phase, actorId: "system" });

  // Emit updated state views now that state changed
  emitStateViews(io, room);

  // Build full deltas list (accuracy will be set per-player)
  const changedKeys = (Object.keys(STATE_LABELS) as (keyof StateVariables)[]).filter(
    (key) => stateAfter[key] !== stateBefore[key],
  );

  const activeFactions = [...new Set(
    Object.values(room.players)
      .filter((p) => p.faction)
      .map((p) => p.faction as string),
  )];
  const narrative = buildNarrative(teamDecisionSummary, room.round, activeFactions);

  // Emit fog-filtered resolution to each player
  for (const [socketId, player] of Object.entries(room.players)) {
    if (!player.faction || !player.role) continue;
    const fogView = computeFogView(stateAfter, player.faction, room.round);

    const filteredDeltas: StateDelta[] = changedKeys
      .filter((key) => fogView[key].accuracy !== "hidden")
      .map((key) => ({
        variable: key,
        label: STATE_LABELS[key],
        oldValue: stateBefore[key],
        newValue: stateAfter[key],
        delta: stateAfter[key] - stateBefore[key],
        accuracy: fogView[key].accuracy,
      }));

    const resolutionData: ResolutionData = {
      narrative,
      stateDeltas: filteredDeltas,
      teamDecisions: teamDecisionSummary,
    };

    io.to(socketId).emit("game:resolution", resolutionData);
  }

  // GM gets full resolution with all deltas (unfogged)
  if (room.gmId) {
    const fullDeltas: StateDelta[] = changedKeys.map((key) => ({
      variable: key,
      label: STATE_LABELS[key],
      oldValue: stateBefore[key],
      newValue: stateAfter[key],
      delta: stateAfter[key] - stateBefore[key],
      accuracy: "exact" as const,
    }));
    const gmResolution: ResolutionData = {
      narrative,
      stateDeltas: fullDeltas,
      teamDecisions: teamDecisionSummary,
    };
    io.to(room.gmId).emit("game:resolution", gmResolution);
  }
}

/**
 * Jump directly to any round + phase combination (dev/non-production only).
 * Clears transient per-round state, resets the timer, and re-emits all phase
 * content so players see content appropriate for the target round/phase.
 */
export function jumpToPhase(io: Server, room: GameRoom, round: number, phase: GamePhase): void {
  room.round = round;
  room.phase = phase;
  room.decisions = {};
  room.teamDecisions = {};
  room.teamVotes = {};

  // Set timer first so game:phase carries the correct endsAt
  setPhaseTimer(io, room);

  io.to(room.code).emit("game:phase", {
    phase: room.phase,
    round: room.round,
    timer: room.timer,
  });

  emitStateViews(io, room);

  if (phase === "briefing") emitBriefing(io, room);
  if (phase === "intel") emitContent(io, room);
  if (phase === "decision") emitDecisions(io, room);
  if (phase === "resolution") emitResolution(io, room);

  console.log(`[dev] GM jumped to Round ${round} ${phase}`);
}

/**
 * Replay all in-game state to a single reconnected socket.
 * Pass null for player when replaying for the GM.
 */
export function replayPlayerState(socket: Socket, room: GameRoom, player: Player | null): void {
  if (room.phase === "lobby") return;

  if (player) {
    if (!player.faction || !player.role) return;
    const nameMap = buildNameMap(room);
    // Fog-of-war state view
    const view = computeFogView(room.state, player.faction, room.round);
    socket.emit("game:state", { view });

    // Current round content (intel phase onwards — content persists)
    {
      const content = getContentForPlayer(room, player);
      const personalized = personalizeContent(content, nameMap);
      socket.emit("game:content", { content: personalized });
    }

    // Briefing text (relevant in briefing phase but also good to replay for context)
    try {
      const text = getBriefingTextForPlayer(room, player, nameMap);
      socket.emit("game:briefing", { text });
    } catch {
      // No briefing content for this round
    }

    // Decision options (if in decision phase)
    if (room.phase === "decision") {
      const roundDecisions = getActiveDecisions(room, room.round);
      if (roundDecisions) {
        const individual = roundDecisions.individual.find((d: IndividualDecision) => d.role === player.role) ?? null;
        const team = roundDecisions.team.find((d: TeamDecision) => d.faction === player.faction) ?? null;
        socket.emit("game:decisions", { individual, team });
      }

      // Gap 1: replay team votes to the reconnected leader
      if (player.isLeader && room.teamVotes[player.faction]) {
        socket.emit("decision:votes", {
          faction: player.faction,
          votes: room.teamVotes[player.faction],
        });
      }
    }

    // Gap 2: replay ending data if game has ended
    if (room.phase === "ending") {
      const arcs = computeEndingArcs(room.state);
      socket.emit("game:ending", {
        arcs,
        history: room.history,
        finalState: room.state,
        players: room.players,
      });
    }

    // Gap 3: replay publications
    if (room.publications.length > 0) {
      for (const pub of room.publications) {
        const timestamp = new Date(pub.publishedAt).toISOString();
        const tweetText = pub.type === "leak"
          ? `BREAKING: ${pub.title} — ${pub.content.slice(0, 200)}${pub.content.length > 200 ? "…" : ""}`
          : `${pub.title} — ${pub.content.slice(0, 200)}${pub.content.length > 200 ? "…" : ""}`;
        const classification = pub.type === "leak" ? "critical" : "context";
        const newsContent: AppContent = {
          faction: player.faction,
          role: player.role ?? undefined,
          app: "news",
          items: [{
            id: `pub-news-${pub.id}`,
            type: "headline",
            round: pub.round,
            sender: pub.source,
            subject: pub.title,
            body: pub.content,
            timestamp,
            classification,
          }],
        };
        const twitterContent: AppContent = {
          faction: player.faction,
          role: player.role ?? undefined,
          app: "twitter",
          items: [{
            id: `pub-twitter-${pub.id}`,
            type: "tweet",
            round: pub.round,
            sender: pub.source,
            body: tweetText,
            timestamp,
            classification,
          }],
        };
        const summary = `${pub.type === "leak" ? "🔴 LEAK" : pub.type === "research" ? "📄 RESEARCH" : "📰 PUBLISHED"}: ${pub.title}`;
        socket.emit("game:publish", { publication: pub, newsContent, twitterContent, summary });
      }
    }
  } else {
    // GM gets full unfogged state
    socket.emit("game:state", { view: room.state, isFull: true });
  }
}
