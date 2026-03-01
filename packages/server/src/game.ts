import type { Server, Socket } from "socket.io";
import type { AppId, DecisionOption, Faction, GamePhase, GameRoom, IndividualDecision, Player, ResolutionData, Role, StateDelta, StateVariables, TeamDecision } from "@takeoff/shared";
import { FACTIONS, PHASE_DURATIONS, ROUND4_PHASE_DURATIONS, TOTAL_ROUNDS, computeFogView, resolveDecisions, computeEndingArcs } from "@takeoff/shared";
import { getContentForPlayer, loadRound } from "./content/loader.js";
import { ROUND1_DECISIONS } from "./content/decisions/round1.js";
import { ROUND2_DECISIONS } from "./content/decisions/round2.js";
import { ROUND3_DECISIONS } from "./content/decisions/round3.js";
import { ROUND4_DECISIONS } from "./content/decisions/round4.js";
import { ROUND5_DECISIONS } from "./content/decisions/round5.js";

const PHASE_ORDER: GamePhase[] = ["briefing", "intel", "deliberation", "decision", "resolution"];
const phaseTimers = new Map<string, ReturnType<typeof setTimeout>>(); // roomCode → timer

// Round N decisions at index N-1.
const ROUND_DECISIONS = [
  ROUND1_DECISIONS,  // index 0 = round 1
  ROUND2_DECISIONS,  // index 1 = round 2
  ROUND3_DECISIONS,  // index 2 = round 3
  ROUND4_DECISIONS,  // index 3 = round 4
  ROUND5_DECISIONS,  // index 4 = round 5
];

function getPhaseDuration(room: GameRoom, phase: GamePhase): number {
  const durations = room.round === 4 ? ROUND4_PHASE_DURATIONS : PHASE_DURATIONS;
  return (durations[phase] ?? 180) * 1000;
}

function setPhaseTimer(io: Server, room: GameRoom) {
  // Clear any existing timer
  const existing = phaseTimers.get(room.code);
  if (existing) clearTimeout(existing);

  const duration = getPhaseDuration(room, room.phase);
  room.timer = { endsAt: Date.now() + duration };

  const timer = setTimeout(() => {
    advancePhase(io, room);
  }, duration);

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

  setPhaseTimer(io, room);
}

export function advancePhase(io: Server, room: GameRoom) {
  const prevPhase = room.phase;
  const currentIndex = PHASE_ORDER.indexOf(room.phase as GamePhase);

  if (currentIndex === -1) return; // unknown phase

  if (currentIndex < PHASE_ORDER.length - 1) {
    // Next phase within the round
    room.phase = PHASE_ORDER[currentIndex + 1];

    // Notify players who did not submit when decision phase expires
    if (prevPhase === "decision" && room.phase === "resolution") {
      const now = Date.now();
      for (const [socketId, player] of Object.entries(room.players)) {
        if (!player.faction || !player.role) continue;
        if (!(socketId in room.decisions)) {
          io.to(socketId).emit("game:notification", {
            id: `inaction-${socketId}-r${room.round}`,
            summary: "You did not submit a decision. Inaction was applied.",
            from: "system",
            timestamp: now,
          });
        }
      }
    }
  } else {
    // End of round
    if (room.phase === "resolution") {
      // Save round history
      room.history.push({
        round: room.round,
        decisions: { ...room.decisions },
        teamDecisions: { ...room.teamDecisions },
        stateBefore: { ...room.state },
        stateAfter: { ...room.state }, // will be updated by resolution
      });

      if (room.round >= TOTAL_ROUNDS) {
        room.phase = "ending";
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

  io.to(room.code).emit("game:phase", {
    phase: room.phase,
    round: room.round,
    timer: room.timer,
  });

  emitStateViews(io, room);

  if (room.phase === "briefing") {
    emitBriefing(io, room);
  }

  if (room.phase === "intel") {
    emitContent(io, room);
  }

  if (room.phase === "decision") {
    emitDecisions(io, room);
  }

  if (room.phase === "resolution") {
    emitResolution(io, room);
  }

  setPhaseTimer(io, room);
}

function emitDecisions(io: Server, room: GameRoom) {
  const roundDecisions = ROUND_DECISIONS[room.round - 1];
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
    const view = computeFogView(room.state, player.faction, player.role, room.round);
    io.to(socketId).emit("game:state", { view });
  }

  // GM gets full state
  if (room.gmId) {
    io.to(room.gmId).emit("game:state", { view: room.state, isFull: true });
  }
}

function emitBriefing(io: Server, room: GameRoom) {
  try {
    const roundContent = loadRound(room.round);
    const { common, factionVariants } = roundContent.briefing;

    for (const [socketId, player] of Object.entries(room.players)) {
      if (!player.faction) continue;
      const variant = factionVariants?.[player.faction];
      const text = variant ? `${common}\n\n${variant}` : common;
      io.to(socketId).emit("game:briefing", { text });
    }

    // GM gets the common briefing
    if (room.gmId) {
      io.to(room.gmId).emit("game:briefing", { text: common });
    }
  } catch (err) {
    console.warn(`[briefing] No briefing content for round ${room.round}:`, err);
  }
}

function emitContent(io: Server, room: GameRoom) {
  for (const [socketId, player] of Object.entries(room.players)) {
    if (!player.faction || !player.role) continue;
    try {
      const content = getContentForPlayer(room.round, player.faction, player.role, room.state);
      io.to(socketId).emit("game:content", { content });
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
};

// ── Activity Penalties ──

interface ActivityPenalty {
  app: AppId;
  variable: keyof StateVariables;
  delta: number;
}

const PRIMARY_APP_PENALTIES: Partial<Record<Role, ActivityPenalty>> = {
  ob_cto:        { app: "wandb",    variable: "obCapability",        delta: -3 },
  ob_safety:     { app: "slack",    variable: "alignmentConfidence",  delta: -3 },
  ob_ceo:        { app: "email",    variable: "obInternalTrust",      delta: -3 },
  prom_scientist:{ app: "wandb",    variable: "promCapability",       delta: -3 },
  china_director:{ app: "compute",  variable: "chinaCapability",      delta: -3 },
  ext_journalist:{ app: "signal",   variable: "publicAwareness",      delta: -3 },
  ext_nsa:       { app: "briefing", variable: "intlCooperation",      delta: -3 },
  ext_vc:        { app: "bloomberg",variable: "economicDisruption",   delta: 2  },
};

function applyActivityPenalties(room: GameRoom): void {
  if (!room.playerActivity) return;
  for (const [playerId, player] of Object.entries(room.players)) {
    if (!player.role) continue;
    const penalty = PRIMARY_APP_PENALTIES[player.role];
    if (!penalty) continue;
    const opened = room.playerActivity[playerId] ?? [];
    if (!opened.includes(penalty.app)) {
      const current = room.state[penalty.variable];
      (room.state[penalty.variable] as number) = current + penalty.delta;
    }
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
  const roundDecisions = ROUND_DECISIONS[room.round - 1];
  const stateBefore = { ...room.state };

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
  applyActivityPenalties(room);
  // Reset activity tracking for next round
  room.playerActivity = {};

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
    const fogView = computeFogView(stateAfter, player.faction, player.role, room.round);

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
 * Replay all in-game state to a single reconnected socket.
 * Pass null for player when replaying for the GM.
 */
export function replayPlayerState(socket: Socket, room: GameRoom, player: Player | null): void {
  if (room.phase === "lobby") return;

  if (player) {
    if (!player.faction || !player.role) return;
    // Fog-of-war state view
    const view = computeFogView(room.state, player.faction, player.role, room.round);
    socket.emit("game:state", { view });

    // Current round content (intel phase onwards — content persists)
    try {
      const content = getContentForPlayer(room.round, player.faction, player.role, room.state);
      socket.emit("game:content", { content });
    } catch {
      // No content for this round yet
    }

    // Briefing text (relevant in briefing phase but also good to replay for context)
    try {
      const roundContent = loadRound(room.round);
      const { common, factionVariants } = roundContent.briefing;
      const variant = factionVariants?.[player.faction];
      const text = variant ? `${common}\n\n${variant}` : common;
      socket.emit("game:briefing", { text });
    } catch {
      // No briefing content for this round
    }

    // Decision options (if in decision phase)
    if (room.phase === "decision") {
      const roundDecisions = ROUND_DECISIONS[room.round - 1];
      if (roundDecisions) {
        const individual = roundDecisions.individual.find((d: IndividualDecision) => d.role === player.role) ?? null;
        const team = roundDecisions.team.find((d: TeamDecision) => d.faction === player.faction) ?? null;
        socket.emit("game:decisions", { individual, team });
      }
    }
  } else {
    // GM gets full unfogged state
    socket.emit("game:state", { view: room.state, isFull: true });
  }
}
