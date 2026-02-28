import type { Server } from "socket.io";
import type { DecisionOption, Faction, GamePhase, GameRoom, IndividualDecision, ResolutionData, StateDelta, StateVariables, TeamDecision } from "@takeoff/shared";
import { PHASE_DURATIONS, ROUND4_PHASE_DURATIONS, TOTAL_ROUNDS, computeFogView, resolveDecisions, computeEndingArcs } from "@takeoff/shared";
import { getContentForPlayer, loadRound } from "./content/loader.js";
import { ROUND1_DECISIONS } from "./content/decisions/round1.js";
import { ROUND2_DECISIONS } from "./content/decisions/round2.js";

const PHASE_ORDER: GamePhase[] = ["briefing", "intel", "deliberation", "decision", "resolution"];
const phaseTimers = new Map<string, ReturnType<typeof setTimeout>>(); // roomCode → timer

const ROUND_DECISIONS = [ROUND1_DECISIONS, ROUND2_DECISIONS];

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
  const currentIndex = PHASE_ORDER.indexOf(room.phase as GamePhase);

  if (currentIndex === -1) return; // unknown phase

  if (currentIndex < PHASE_ORDER.length - 1) {
    // Next phase within the round
    room.phase = PHASE_ORDER[currentIndex + 1];
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [socketId, player] of Object.entries(room.players) as [string, any][]) {
    const individual: IndividualDecision | undefined = roundDecisions.individual.find((d: IndividualDecision) => d.role === player.role);
    const team: TeamDecision | undefined = roundDecisions.team.find((d: TeamDecision) => d.faction === player.faction);
    io.to(socketId).emit("game:decisions", { individual: individual ?? null, team: team ?? null });
  }
}

function emitStateViews(io: Server, room: GameRoom) {
  for (const [socketId, player] of Object.entries(room.players)) {
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

function buildNarrative(
  teamDecisions: Record<string, { optionId: string; label: string }>,
  round: number,
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

  // Emit updated state views now that state changed
  emitStateViews(io, room);

  // Build full deltas list (accuracy will be set per-player)
  const changedKeys = (Object.keys(STATE_LABELS) as (keyof StateVariables)[]).filter(
    (key) => stateAfter[key] !== stateBefore[key],
  );

  const narrative = buildNarrative(teamDecisionSummary, room.round);

  // Emit fog-filtered resolution to each player
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [socketId, player] of Object.entries(room.players) as [string, any][]) {
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
