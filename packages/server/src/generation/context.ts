import type {
  Faction,
  GameMessage,
  GameRoom,
  Publication,
  Role,
  RoundArc,
  RoundHistory,
  StateVariables,
  StoryBible,
  StoryEvent,
} from "@takeoff/shared";
import { ROUND_ARCS } from "./prompts/arcs.js";
import { FACTION_IDENTITIES, FACTION_VOICES } from "./prompts/voices.js";
import { getRoundDecisions } from "../content/decisions/rounds.js";

// ── Types ────────────────────────────────────────────────────────────────────

/** A single player chat message extracted for generation context. */
export interface PlayerSlackMessage {
  from: string;    // display name of the sender
  content: string;
  channel: string; // normalised channel name, e.g. '#general'
}

/**
 * All context the generation functions need to produce reactive content.
 * Built from GameRoom state by buildGenerationContext() before each generation call.
 */
export interface GenerationContext {
  storyBible: StoryBible | undefined;
  currentState: StateVariables;
  history: RoundHistory[];
  players: { faction: Faction | null; role: Role | null; name: string }[];
  firedThresholds: string[];
  publications: Publication[];
  targetRound: number;
  roundArc: RoundArc;
  /**
   * Recent player Slack messages from team chat, grouped by faction then channel.
   * Used to give NPCs awareness of what players discussed last round.
   * Each channel keeps the last ~20 messages (oldest-first within the channel).
   */
  playerSlackMessages: Partial<Record<Faction, Record<string, PlayerSlackMessage[]>>>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find a DecisionOption by ID in the given round's decisions.
 * Searches both individual and team decisions.
 */
function findOptionById(optionId: string, round: number) {
  const roundDec = getRoundDecisions(round);
  if (!roundDec) return undefined;
  for (const dec of [...roundDec.individual, ...roundDec.team]) {
    const opt = dec.options.find((o) => o.id === optionId);
    if (opt) return opt;
  }
  return undefined;
}

function describeThreshold(thresholdId: string): string {
  const descriptions: Record<string, string> = {
    china_weight_theft: "China exfiltrated model weights from a US lab — capability gap narrowed significantly",
    auto_leak: "Internal leak has gone public — publicAwareness spiked, whistleblowerPressure dissipated",
    ob_board_revolt: "OpenBrain board demanded leadership changes — obInternalTrust critically low",
    ccp_military_mandate: "CCP leadership mandated military options — China stance locked into aggression",
    prom_alignment_breakthrough: "Prometheus achieved major alignment breakthrough — alignmentConfidence +15",
    regulatory_emergency_powers: "Emergency regulatory powers invoked — NSA given expanded authority over labs",
    point_of_no_return: "Doom clock reached critical level — point of no return crossed",
    ui_degradation: "AI autonomy high with low alignment confidence — system integrity degrading visibly",
  };
  return descriptions[thresholdId] ?? `Threshold ${thresholdId} fired`;
}

function computeActiveThreads(state: StateVariables): string[] {
  const threads: string[] = [];
  if (state.chinaWeightTheftProgress > 40) {
    threads.push("China's weight theft operation is underway — detection risk rising");
  }
  if (state.alignmentConfidence < 50) {
    threads.push("Alignment confidence critically low — misalignment risk elevated");
  }
  if (state.whistleblowerPressure > 60) {
    threads.push("Whistleblower pressure building — internal leak risk high");
  }
  if (state.doomClockDistance <= 2) {
    threads.push("Doom clock approaching critical threshold — catastrophic risk elevated");
  }
  if (state.publicAwareness > 60) {
    threads.push("Public awareness rising — narrative control eroding");
  }
  if (state.intlCooperation > 50) {
    threads.push("International cooperation improving — arms control window open");
  }
  if (state.taiwanTension > 60) {
    threads.push("Taiwan tension elevated — kinetic conflict risk rising");
  }
  return threads;
}

function computeTone(state: StateVariables, round: number): string {
  if (state.doomClockDistance <= 1) return "existential dread — the point of no return";
  if (state.alignmentConfidence < 30 && round >= 3) return "crisis mode — misalignment confirmed";
  if (round === 5) return "endgame — irreversible choices";
  if (round === 4) return "reckoning — all threads converging";
  if (round === 3) return "peak tension — impossible choices";
  if (state.whistleblowerPressure > 70) return "paranoia and exposure — the secret won't hold";
  if (state.publicAwareness > 70) return "public crisis — narrative lost";
  if (round === 2) return "acceleration — the race intensifies";
  return "tension building";
}

// ── Public API ────────────────────────────────────────────────────────────────

const PLAYER_SLACK_MESSAGES_PER_CHANNEL = 20;

/**
 * Build the shared context object passed to every generation call.
 * Strips private data (player DMs, socket IDs) from the room.
 */
export function buildGenerationContext(room: GameRoom, targetRound: number): GenerationContext {
  const storyBible = room.storyBible ?? initializeStoryBible(room);

  // Players: faction/role/name only — socket IDs (object keys) are excluded
  const players = Object.values(room.players)
    .filter((p) => p.faction !== null && p.role !== null)
    .map((p) => ({
      faction: p.faction as Faction,
      role: p.role as Role,
      name: p.name,
    }));

  // Extract player team chat messages, grouped by faction → channel.
  // Only include non-NPC team chat messages (isTeamChat === true, isNpc !== true).
  const playerSlackMessages = extractPlayerSlackMessages(room.messages ?? []);

  return {
    storyBible,
    currentState: room.state,
    history: room.history,
    players,
    firedThresholds: Array.from(room.firedThresholds ?? []),
    publications: room.publications ?? [],
    targetRound,
    roundArc: ROUND_ARCS[targetRound],
    playerSlackMessages,
  };
}

/**
 * Extract player team-chat messages from a GameMessage array.
 * Groups by faction → channel, capping at PLAYER_SLACK_MESSAGES_PER_CHANNEL per channel.
 * DMs (isTeamChat === false) and NPC messages are excluded.
 */
export function extractPlayerSlackMessages(
  messages: GameMessage[],
): Partial<Record<Faction, Record<string, PlayerSlackMessage[]>>> {
  const result: Partial<Record<Faction, Record<string, PlayerSlackMessage[]>>> = {};

  for (const msg of messages) {
    if (!msg.isTeamChat) continue;
    if (msg.isNpc) continue;

    const faction = msg.faction;
    const channel = msg.channel ?? "#general";

    if (!result[faction]) result[faction] = {};
    const byChannel = result[faction]!;
    if (!byChannel[channel]) byChannel[channel] = [];
    byChannel[channel]!.push({ from: msg.fromName, content: msg.content, channel });
  }

  // Keep only the last N messages per channel (cap the window)
  for (const factionData of Object.values(result)) {
    if (!factionData) continue;
    for (const channel of Object.keys(factionData)) {
      const msgs = factionData[channel]!;
      if (msgs.length > PLAYER_SLACK_MESSAGES_PER_CHANNEL) {
        factionData[channel] = msgs.slice(msgs.length - PLAYER_SLACK_MESSAGES_PER_CHANNEL);
      }
    }
  }

  return result;
}

/**
 * Create the initial story bible from static arc templates and faction data.
 * Call this once when a game room is first initialized or generation is first triggered.
 */
export function initializeStoryBible(room: GameRoom): StoryBible {
  const factions: StoryBible["factions"] = (
    ["openbrain", "prometheus", "china", "external"] as Faction[]
  ).map((faction) => {
    const identity = FACTION_IDENTITIES[faction];
    return {
      faction,
      identity: identity.identity,
      tension: identity.tension,
      characters: identity.characters,
    };
  });

  const voiceGuides: Record<string, string> = {};
  for (const [faction, voice] of Object.entries(FACTION_VOICES)) {
    voiceGuides[faction] = voice;
  }

  return {
    scenario:
      "Late 2026. Two US labs — OpenBrain (capabilities-first) and Prometheus (safety-first) — race toward superintelligence. China's DeepCent closes fast through stolen weights and state resources. External stakeholders control capital, regulation, and narrative. Decisions over 14 months determine whether humanity gets aligned superintelligence, geopolitical crisis, or worse.",
    factions,
    voiceGuides,
    roundArcs: Object.values(ROUND_ARCS),
    events: [],
    playerActions: [],
    activeThreads: [],
    toneShift: "tension building",
  };
}

/**
 * Append story events from the most recent completed round into the bible.
 * Call this after resolution (decisions applied, thresholds checked).
 * Mutates room.storyBible in place.
 */
export function updateStoryBible(room: GameRoom): void {
  if (!room.storyBible) {
    room.storyBible = initializeStoryBible(room);
  }
  const bible = room.storyBible;
  const round = room.round;
  const latestHistory = room.history[room.history.length - 1];

  // Guard: no history entry for this round yet — nothing to record
  if (!latestHistory || latestHistory.round !== round) return;

  // 1. Team decisions → major story events
  for (const [, optionId] of Object.entries(latestHistory.teamDecisions)) {
    const option = findOptionById(optionId, round);
    if (option) {
      const stateImpact = option.effects
        .map((e) => `${e.variable} ${e.delta > 0 ? "+" : ""}${e.delta}`)
        .join(", ");
      bible.events.push({
        round,
        phase: "decision",
        summary: `Team chose: "${option.label}" — ${option.description}`,
        stateImpact,
        narrativeWeight: "major",
      });
    }
  }

  // 2. Individual decisions → minor story events
  for (const [playerId, optionId] of Object.entries(latestHistory.decisions)) {
    const player = room.players[playerId];
    const option = findOptionById(optionId, round);
    if (option && player) {
      const stateImpact = option.effects
        .map((e) => `${e.variable} ${e.delta > 0 ? "+" : ""}${e.delta}`)
        .join(", ");
      bible.events.push({
        round,
        phase: "decision",
        summary: `${player.role} (${player.faction}) chose: "${option.label}"`,
        stateImpact,
        narrativeWeight: "minor",
      });
    }
  }

  // 3. Threshold events — add any that aren't already recorded
  // (firedThresholds accumulates across the whole game, so we diff against bible events)
  const recordedThresholds = new Set(
    bible.events
      .filter((e) => e.phase === "threshold")
      .map((e) => e.summary.replace(/^THRESHOLD:\s+/, ""))
      .filter(Boolean),
  );

  for (const thresholdId of room.firedThresholds ?? []) {
    if (!recordedThresholds.has(thresholdId)) {
      bible.events.push({
        round,
        phase: "threshold",
        summary: `THRESHOLD: ${thresholdId}`,
        stateImpact: describeThreshold(thresholdId),
        narrativeWeight: "major",
      });
    }
  }

  // 4. Active threads — recompute from current state
  bible.activeThreads = computeActiveThreads(room.state);

  // 5. Tone shift — update based on current state and round
  bible.toneShift = computeTone(room.state, round);
}

/**
 * Compress events from rounds older than currentRound-2 into summary strings.
 * Returns a new StoryBible with compressed events — does not mutate.
 * Use when context window budget is a concern.
 */
export function summarizeOlderRounds(bible: StoryBible, currentRound: number): StoryBible {
  const cutoff = currentRound - 2;
  if (cutoff <= 0) return bible; // Nothing old enough to compress

  const recentEvents = bible.events.filter((e) => e.round >= cutoff);
  const olderEvents = bible.events.filter((e) => e.round < cutoff);

  if (olderEvents.length === 0) return bible;

  // Group older events by round
  const roundGroups = new Map<number, StoryEvent[]>();
  for (const event of olderEvents) {
    const group = roundGroups.get(event.round) ?? [];
    group.push(event);
    roundGroups.set(event.round, group);
  }

  // Compress each older round into a single summary event
  const summaryEvents: StoryEvent[] = [];
  for (const [r, events] of [...roundGroups.entries()].sort((a, b) => a[0] - b[0])) {
    const majorEvents = events.filter((e) => e.narrativeWeight === "major");
    const summarySource = majorEvents.length > 0 ? majorEvents : events.slice(0, 3);
    const summary = summarySource.map((e) => e.summary).join("; ");
    const stateImpact =
      majorEvents.length > 0
        ? majorEvents.map((e) => e.stateImpact).join("; ")
        : "various state changes";

    summaryEvents.push({
      round: r,
      phase: "decision",
      summary: `[Round ${r} summary] ${summary}`,
      stateImpact,
      narrativeWeight: "minor",
    });
  }

  return {
    ...bible,
    events: [...summaryEvents, ...recentEvents],
  };
}
