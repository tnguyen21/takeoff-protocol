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
import { getGeneratedDecisions } from "./cache.js";


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

/**
 * Accumulate narrative events for the just-completed round into the story bible.
 * Mutates room.storyBible in place (initializing it if undefined).
 * Call this after checkThresholds() and before creating the history entry in emitResolution().
 */
export function updateStoryBible(room: GameRoom): void {
  // Ensure bible exists
  if (!room.storyBible) {
    room.storyBible = initializeStoryBible(room);
  }
  const bible = room.storyBible;
  const round = room.round;

  // No-op if no decisions were collected this round
  if (
    Object.keys(room.decisions).length === 0 &&
    Object.keys(room.teamDecisions).length === 0
  ) {
    return;
  }

  const roundDecisions = getGeneratedDecisions(room, round);

  // a) Record team decisions (major weight)
  for (const [faction, optionId] of Object.entries(room.teamDecisions)) {
    if (!roundDecisions) continue;
    const teamDec = roundDecisions.team.find((t) => t.faction === (faction as Faction));
    if (!teamDec) continue;
    const opt = teamDec.options.find((o) => o.id === optionId);
    if (!opt) continue;
    bible.events.push({
      round,
      phase: "decision",
      summary: `${faction} chose: "${opt.label}"`,
      stateImpact: opt.effects
        .map((e) => `${e.variable} ${e.delta > 0 ? "+" : ""}${e.delta}`)
        .join(", "),
      narrativeWeight: "major",
    });
  }

  // b) Record individual decisions (minor weight)
  for (const [playerId, optionId] of Object.entries(room.decisions)) {
    const player = room.players[playerId];
    if (!player || !roundDecisions) continue;
    let opt: { label: string; effects: { variable: string; delta: number }[] } | undefined;
    for (const indiv of roundDecisions.individual) {
      opt = indiv.options.find((o) => o.id === optionId);
      if (opt) break;
    }
    if (!opt) continue;
    bible.events.push({
      round,
      phase: "decision",
      summary: `${player.role} (${player.faction}) chose: "${opt.label}"`,
      stateImpact: opt.effects
        .map((e) => `${e.variable} ${e.delta > 0 ? "+" : ""}${e.delta}`)
        .join(", "),
      narrativeWeight: "minor",
    });
  }

  // c) TODO: Record threshold events that fired this round.
  //    room.firedThresholds is an all-time set of fired IDs; there is no per-round
  //    snapshot available here, so we cannot distinguish which ones fired this round
  //    vs. previous rounds without additional bookkeeping.

  // d) Record publications from this round
  const roundPubs = (room.publications ?? []).filter((p) => p.round === round);
  for (const pub of roundPubs) {
    bible.events.push({
      round,
      phase: "publication",
      summary: `${pub.publishedBy} published: "${pub.title}"`,
      stateImpact: "",
      narrativeWeight: "minor",
    });
  }

  // e) Update tone based on current state
  const { publicSentiment, taiwanTension, alignmentConfidence } = room.state;
  if (publicSentiment < -30) {
    bible.toneShift = "crisis";
  } else if (taiwanTension > 70) {
    bible.toneShift = "tense";
  } else if (alignmentConfidence > 70) {
    bible.toneShift = "cautiously optimistic";
  } else {
    bible.toneShift = "uncertain";
  }
}
