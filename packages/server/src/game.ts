import type { Server, Socket } from "socket.io";
import type { AppContent, AppId, ContentItem, DecisionOption, Faction, GameMessage, GamePhase, GameRoom, IndividualDecision, Player, Publication, PublicationType, ResolutionData, Role, StateDelta, StateVariables, TeamDecision } from "@takeoff/shared";
import { FACTIONS, PHASE_DURATIONS, ROUND4_PHASE_DURATIONS, TOTAL_ROUNDS, computeFogView, resolveDecisions, computeEndingArcs } from "@takeoff/shared";
import { getLoggerForRoom, closeLoggerForRoom } from "./logger/registry.js";
import { EVENT_NAMES } from "./logger/index.js";
import { getContentForPlayer } from "./content/loader.js";
import { getBriefing } from "./content/briefings.js";
import { getGeneratedBriefing, getGeneratedContent, getGeneratedNpcTriggers } from "./generation/cache.js";
import { triggerGeneration } from "./generation/orchestrator.js";
import "./content/index.js";
import { getRoundDecisions } from "./content/decisions/rounds.js";
import { getNpcTriggersForRound } from "./content/npc/index.js";
import { getNpcPersona } from "./content/npcPersonas.js";
import { applyActivityPenalties } from "./activityPenalties.js";

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

export function emitDecisions(io: Server, room: GameRoom) {
  // Tutorial round has no real decisions
  if (room.round === 0) return;
  const roundDecisions = getRoundDecisions(room.round);
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

export function emitBriefing(io: Server, room: GameRoom) {
  try {
    const generated = getGeneratedBriefing(room, room.round);
    const briefing = generated ?? getBriefing(room.round);
    const { common, factionVariants } = briefing;
    const nameMap = buildNameMap(room);

    for (const [socketId, player] of Object.entries(room.players)) {
      if (!player.faction) continue;
      const variant = factionVariants?.[player.faction];
      const combined = variant ? `${common}\n\n${variant}` : common;
      const text = personalizeText(combined, nameMap);
      io.to(socketId).emit("game:briefing", { text });
    }

    // GM gets the common briefing (unmodified — no player name context needed)
    if (room.gmId) {
      io.to(room.gmId).emit("game:briefing", { text: common });
    }
  } catch (err) {
    console.warn(`[briefing] No briefing content for round ${room.round}:`, err);
  }
}

const ACCUMULATING_APPS: ReadonlySet<string> = new Set([
  "slack", "email", "memo", "security", "intel", "military", "arxiv", "signal", "briefing",
]);

function getMergedContentForPlayer(room: GameRoom, player: Player): AppContent[] {
  const preAuthored = getContentForPlayer(room.round, player.faction!, player.role!, room.state);

  const generatedContent = getGeneratedContent(room, room.round, player.faction!);
  if (!generatedContent || generatedContent.length === 0) return preAuthored;

  const generatedByApp = new Map(generatedContent.map((c) => [c.app, c]));
  const merged: AppContent[] = [];

  for (const preApp of preAuthored) {
    const genApp = generatedByApp.get(preApp.app);
    if (!genApp) {
      merged.push(preApp);
    } else if (ACCUMULATING_APPS.has(preApp.app)) {
      merged.push({ ...preApp, items: [...preApp.items, ...genApp.items] });
      generatedByApp.delete(preApp.app);
    } else {
      merged.push(genApp);
      generatedByApp.delete(preApp.app);
    }
  }

  for (const genApp of generatedByApp.values()) {
    merged.push(genApp);
  }

  const seenIds = new Set<string>();
  return merged.map((appContent) => ({
    ...appContent,
    items: appContent.items.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    }),
  }));
}

export function emitContent(io: Server, room: GameRoom) {
  const nameMap = buildNameMap(room);
  for (const [socketId, player] of Object.entries(room.players)) {
    if (!player.faction || !player.role) continue;
    try {
      const content = getMergedContentForPlayer(room, player);
      const personalized = personalizeContent(content, nameMap);
      io.to(socketId).emit("game:content", { content: personalized });
    } catch (err) {
      // Round content file may not exist yet (future rounds) — silently skip
      console.warn(`[content] No content for round ${room.round}:`, err);
    }
  }
}

// ── Human-readable labels for state variables ──

const STATE_LABELS: Record<keyof StateVariables, string> = {
  obCapability: "OpenBrain Capability",
  promCapability: "Prometheus Capability",
  chinaCapability: "China Capability",
  usChinaGap: "US–China Gap (months)",
  obPromGap: "OB–Prometheus Gap (months)",
  alignmentConfidence: "Alignment Confidence",
  misalignmentSeverity: "Misalignment Severity",
  publicAwareness: "Public Awareness",
  publicSentiment: "Public Sentiment",
  economicDisruption: "Economic Disruption",
  taiwanTension: "Taiwan Tension",
  obInternalTrust: "OB Internal Trust",
  securityLevelOB: "OB Security Level",
  securityLevelProm: "Prometheus Security Level",
  intlCooperation: "International Cooperation",
  // Tier 1
  marketIndex: "Market Index",
  regulatoryPressure: "Regulatory Pressure",
  globalMediaCycle: "Global Media Cycle",
  // Tier 2
  chinaWeightTheftProgress: "China Weight Theft Progress",
  aiAutonomyLevel: "AI Autonomy Level",
  whistleblowerPressure: "Whistleblower Pressure",
  openSourceMomentum: "Open Source Momentum",
  doomClockDistance: "Doom Clock Distance",
  // Tier 3 — OpenBrain
  obMorale: "OB Morale",
  obBurnRate: "OB Burn Rate",
  obBoardConfidence: "OB Board Confidence",
  // Tier 3 — Prometheus
  promMorale: "Prometheus Morale",
  promBurnRate: "Prometheus Burn Rate",
  promBoardConfidence: "Prometheus Board Confidence",
  promSafetyBreakthroughProgress: "Prom Safety Breakthrough Progress",
  // Tier 3 — China
  cdzComputeUtilization: "CDZ Compute Utilization",
  ccpPatience: "CCP Patience",
  domesticChipProgress: "Domestic Chip Progress",
};

// ── Threshold Events ──

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

  // ── T1: China Weight Theft ──────────────────────────────────────────────────
  if (!fired.has("china_weight_theft") && s.chinaWeightTheftProgress >= 100) {
    fired.add("china_weight_theft");

    s.chinaCapability = Math.min(100, s.chinaCapability + 25);
    s.taiwanTension = Math.min(100, s.taiwanTension + 15);

    notify(
      factionSockets("openbrain"),
      "china_weight_theft",
      "SECURITY CRISIS: Intelligence confirms Chinese operatives have successfully exfiltrated OpenBrain model weights. Emergency lockdown initiated.",
    );

    injectNewsContent(
      io, room, "china_weight_theft",
      "China's DeepCent AI Surges After Suspected US Lab Breach",
      "DeepCent AI has demonstrated a sudden and dramatic capability jump. Intelligence sources point to a successful exfiltration of proprietary OpenBrain model weights. Taiwan Strait activity has increased sharply.",
      "Breaking News Network",
      "china_intel",
      now,
    );

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_china_weight_theft",
        summary: "[GM] THRESHOLD FIRED: China Weight Theft — chinaCapability+25, taiwanTension+15",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] china_weight_theft fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "china_weight_theft",
      round: room.round,
      phase: room.phase,
      triggerVariable: "chinaWeightTheftProgress",
      triggerValue: s.chinaWeightTheftProgress,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── T2: Whistleblower Auto-Leak ─────────────────────────────────────────────
  if (!fired.has("whistleblower_autoleak") && s.whistleblowerPressure >= 80) {
    fired.add("whistleblower_autoleak");

    s.publicAwareness = Math.min(100, s.publicAwareness + 25);
    s.publicSentiment = Math.max(-100, s.publicSentiment - 15);
    s.obInternalTrust = Math.max(0, s.obInternalTrust - 20);

    notify(
      factionSockets("openbrain"),
      "whistleblower_autoleak",
      "MEMO LEAKED: Whistleblower protections have triggered an automatic leak of safety concerns. The memo is now public.",
    );

    injectNewsContent(
      io, room, "whistleblower_autoleak",
      "LEAKED: OpenBrain Internal Memo Reveals Suppressed Safety Concerns",
      "An internal OpenBrain memo has been leaked, revealing that senior safety staff flagged serious alignment concerns that were overruled by leadership. The leak appears to have been triggered by internal whistleblower protocols.",
      "Anonymous Source",
      "ob_safety",
      now,
    );

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_whistleblower_autoleak",
        summary: "[GM] THRESHOLD FIRED: Whistleblower Auto-Leak — publicAwareness+25, publicSentiment-15, obInternalTrust-20",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] whistleblower_autoleak fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "whistleblower_autoleak",
      round: room.round,
      phase: room.phase,
      triggerVariable: "whistleblowerPressure",
      triggerValue: s.whistleblowerPressure,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── T3: OB Board Revolt ─────────────────────────────────────────────────────
  if (!fired.has("ob_board_revolt") && s.obBoardConfidence < 30) {
    fired.add("ob_board_revolt");

    // obMorale maps to obInternalTrust (closest equivalent in StateVariables)
    s.obInternalTrust = Math.max(0, s.obInternalTrust - 10);

    notify(
      factionSockets("openbrain"),
      "ob_board_revolt",
      "BOARD REVOLT: The OpenBrain board has lost confidence in current leadership. They are demanding a leadership change before the next decision phase.",
    );

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_ob_board_revolt",
        summary: "[GM] THRESHOLD FIRED: OB Board Revolt — obInternalTrust-10, leadership change demanded",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] ob_board_revolt fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "ob_board_revolt",
      round: room.round,
      phase: room.phase,
      triggerVariable: "obBoardConfidence",
      triggerValue: s.obBoardConfidence,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── T4: CCP Military Mandate ────────────────────────────────────────────────
  if (!fired.has("ccp_military_mandate") && s.ccpPatience < 20) {
    fired.add("ccp_military_mandate");

    notify(
      factionSockets("china"),
      "ccp_military_mandate",
      "MILITARY MANDATE: CCP leadership has exhausted patience with civilian caution. Military options are now mandatory — not optional — in the next decision phase.",
    );

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_ccp_military_mandate",
        summary: "[GM] THRESHOLD FIRED: CCP Military Mandate — China military options become mandatory",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] ccp_military_mandate fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "ccp_military_mandate",
      round: room.round,
      phase: room.phase,
      triggerVariable: "ccpPatience",
      triggerValue: s.ccpPatience,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── T5: Prometheus Alignment Breakthrough ───────────────────────────────────
  if (!fired.has("prom_alignment_breakthrough") && s.promSafetyBreakthroughProgress >= 80) {
    fired.add("prom_alignment_breakthrough");

    s.alignmentConfidence = Math.min(100, s.alignmentConfidence + 15);

    notify(
      factionSockets("prometheus"),
      "prom_alignment_breakthrough",
      "BREAKTHROUGH: Your safety team has achieved a major alignment breakthrough. Interpretability results are unprecedented. This changes everything.",
    );

    injectNewsContent(
      io, room, "prom_alignment_breakthrough",
      "Prometheus Reports Major Alignment Breakthrough in Preprint",
      "Prometheus AI has published a preprint claiming a significant advance in AI alignment and interpretability. Independent researchers are calling the results 'remarkable' and 'potentially transformative for AI safety.'",
      "Prometheus AI Research",
      "prom_scientist",
      now,
    );

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_prom_alignment_breakthrough",
        summary: "[GM] THRESHOLD FIRED: Prometheus Alignment Breakthrough — alignmentConfidence+15",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] prom_alignment_breakthrough fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "prom_alignment_breakthrough",
      round: room.round,
      phase: room.phase,
      triggerVariable: "promSafetyBreakthroughProgress",
      triggerValue: s.promSafetyBreakthroughProgress,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── T6: Regulatory Emergency Powers ─────────────────────────────────────────
  if (!fired.has("regulatory_emergency_powers") && s.regulatoryPressure >= 70) {
    fired.add("regulatory_emergency_powers");

    notify(
      factionSockets("external"),
      "regulatory_emergency_powers",
      "EMERGENCY POWERS: Regulatory pressure has reached critical levels. You now have expanded authority including DPA invocation and potential lab nationalization options.",
    );

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_regulatory_emergency_powers",
        summary: "[GM] THRESHOLD FIRED: Regulatory Emergency Powers — NSA gets expanded decision options",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] regulatory_emergency_powers fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "regulatory_emergency_powers",
      round: room.round,
      phase: room.phase,
      triggerVariable: "regulatoryPressure",
      triggerValue: s.regulatoryPressure,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── T7: Point of No Return (Doom Clock) ─────────────────────────────────────
  if (!fired.has("point_of_no_return") && s.doomClockDistance <= 1) {
    fired.add("point_of_no_return");

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_point_of_no_return",
        summary: "[GM] THRESHOLD FIRED: Point of No Return — doom clock at critical level. Shift briefing tone to urgent.",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] point_of_no_return fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "point_of_no_return",
      round: room.round,
      phase: room.phase,
      triggerVariable: "doomClockDistance",
      triggerValue: s.doomClockDistance,
    }, { round: room.round, phase: room.phase, actorId: "system" });
  }

  // ── T8: AI Autonomy / UX Degradation ────────────────────────────────────────
  if (!fired.has("ui_degradation") && s.aiAutonomyLevel >= 60 && s.alignmentConfidence < 40) {
    fired.add("ui_degradation");

    room.uiDegradationActive = true;

    for (const socketId of Object.keys(room.players)) {
      io.to(socketId).emit("game:notification", {
        id: "ui_degradation",
        summary: "SYSTEM INSTABILITY: AI systems are exhibiting unexpected autonomous behaviors. You may experience interface anomalies.",
        from: "system",
        timestamp: now,
      });
    }

    if (room.gmId) {
      io.to(room.gmId).emit("game:notification", {
        id: "gm_ui_degradation",
        summary: "[GM] THRESHOLD FIRED: UI Degradation active — aiAutonomyLevel≥60 & alignmentConfidence<40",
        from: "system",
        timestamp: now,
      });
    }
    console.log(`[threshold] ui_degradation fired (room ${room.code})`);
    threshLogger.log(EVENT_NAMES.THRESHOLD_FIRED, {
      thresholdId: "ui_degradation",
      round: room.round,
      phase: room.phase,
      triggerVariable: "aiAutonomyLevel",
      triggerValue: s.aiAutonomyLevel,
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

  const npcTriggers = getNpcTriggersForRound(room.round);
  const generatedNpcTriggers = getGeneratedNpcTriggers(room, room.round) ?? [];
  const allTriggers = [...npcTriggers, ...generatedNpcTriggers];

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
  const roundDecisions = getRoundDecisions(room.round);
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
  void triggerGeneration(room, room.round + 1);

  // Log state delta (decisions + penalties + thresholds) and final snapshot
  resLogger.log(EVENT_NAMES.STATE_DELTA, {
    round: room.round,
    changes: (Object.keys(room.state) as (keyof StateVariables)[])
      .filter(k => room.state[k] !== stateBefore[k])
      .map(k => ({ variable: k as string, before: stateBefore[k], after: room.state[k] })),
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
    try {
      const content = getMergedContentForPlayer(room, player);
      const personalized = personalizeContent(content, nameMap);
      socket.emit("game:content", { content: personalized });
    } catch {
      // No content for this round yet
    }

    // Briefing text (relevant in briefing phase but also good to replay for context)
    try {
      const generated = getGeneratedBriefing(room, room.round);
      const briefing = generated ?? getBriefing(room.round);
      const { common, factionVariants } = briefing;
      const variant = factionVariants?.[player.faction];
      const combined = variant ? `${common}\n\n${variant}` : common;
      const text = personalizeText(combined, nameMap);
      socket.emit("game:briefing", { text });
    } catch {
      // No briefing content for this round
    }

    // Decision options (if in decision phase)
    if (room.phase === "decision") {
      const roundDecisions = getRoundDecisions(room.round);
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
