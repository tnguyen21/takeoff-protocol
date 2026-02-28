import type { Server } from "socket.io";
import type { GamePhase, GameRoom, IndividualDecision, TeamDecision } from "@takeoff/shared";
import { PHASE_DURATIONS, ROUND4_PHASE_DURATIONS, TOTAL_ROUNDS, computeFogView } from "@takeoff/shared";
import { getContentForPlayer, loadRound } from "./content/loader.js";
import { ROUND1_DECISIONS } from "./content/decisions/round1.js";

const PHASE_ORDER: GamePhase[] = ["briefing", "intel", "deliberation", "decision", "resolution"];
const phaseTimers = new Map<string, ReturnType<typeof setTimeout>>(); // roomCode → timer

const ROUND_DECISIONS = [ROUND1_DECISIONS];

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
