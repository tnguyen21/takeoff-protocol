import type { Server, Socket } from "socket.io";
import type { GamePhase, StateVariables } from "@takeoff/shared";
import { STATE_VARIABLE_RANGES } from "@takeoff/shared";
import { advancePhase, checkThresholds, startGame, startTutorial, endTutorial, endGame, emitStateViews, syncPhaseTimer, clearPhaseTimer } from "../game.js";
import { getNpcPersona } from "../content/npcPersonas.js";
import { getLoggerForRoom } from "../logger/registry.js";
import { extendUses } from "../extendUses.js";
import { EVENT_NAMES } from "../logger/index.js";
import type { Faction, GameMessage } from "@takeoff/shared";
import { getGmRoom } from "./helpers.js";

export function registerGmControlEvents(io: Server, socket: Socket) {
  socket.on("game:start", (_, callback) => {
    const room = getGmRoom(socket);
    if (!room) { callback({ ok: false, error: "Only GM can start the game" }); return; }

    startGame(io, room);
    callback({ ok: true });
  });

  socket.on("gm:start-tutorial", (_, callback: (res: { ok: boolean; error?: string }) => void) => {
    const room = getGmRoom(socket);
    if (!room) { callback({ ok: false, error: "Only GM can start the tutorial" }); return; }

    startTutorial(io, room);
    callback({ ok: true });
  });

  socket.on("gm:end-tutorial", () => {
    const room = getGmRoom(socket);
    if (!room) return;
    if (room.round !== 0) return;
    endTutorial(io, room);
  });

  socket.on("gm:advance", () => {
    const room = getGmRoom(socket);
    if (!room) return;
    getLoggerForRoom(room.code).log("phase.gm_advanced", { round: room.round, phase: room.phase }, { actorId: "gm", round: room.round, phase: room.phase });
    clearPhaseTimer(room);
    advancePhase(io, room);
  });

  socket.on("gm:end-game", () => {
    const room = getGmRoom(socket);
    if (!room || room.phase === "ending") return;
    endGame(io, room, "gm");
  });

  socket.on("gm:pause", () => {
    const room = getGmRoom(socket);
    if (!room) return;

    const wasPaused = !!room.timer.pausedAt;
    if (room.timer.pausedAt) {
      // Resume: adjust endsAt by the paused duration
      const pausedDuration = Date.now() - room.timer.pausedAt;
      room.timer.endsAt += pausedDuration;
      room.timer.pausedAt = undefined;
    } else {
      room.timer.pausedAt = Date.now();
    }
    syncPhaseTimer(io, room);
    const remainingMs = room.timer.endsAt - Date.now();
    getLoggerForRoom(room.code).log(wasPaused ? "phase.resumed" : "phase.paused", { round: room.round, phase: room.phase, remainingMs }, { actorId: "gm", round: room.round, phase: room.phase });

    io.to(room.code).emit("game:phase", {
      phase: room.phase,
      round: room.round,
      timer: room.timer,
    });
  });

  socket.on("gm:set-state", ({ variable, value }: { variable: string; value: number }) => {
    if (process.env.NODE_ENV === "production") return;
    const room = getGmRoom(socket);
    if (!room) return;

    if (!(variable in STATE_VARIABLE_RANGES)) return;
    const key = variable as keyof StateVariables;
    const [min, max] = STATE_VARIABLE_RANGES[key];
    const oldVal = room.state[key];
    (room.state as unknown as Record<string, number>)[key] = Math.max(min, Math.min(max, value));

    checkThresholds(io, room);
    emitStateViews(io, room);
    console.log(`[gm:set-state] ${variable} = ${room.state[key]}`);
    getLoggerForRoom(room.code).log("state.gm_override", { variable, oldValue: oldVal, newValue: room.state[key], gmId: socket.id }, { actorId: "gm", round: room.round, phase: room.phase });
  });

  socket.on("gm:set-timers", (overrides: Partial<Record<GamePhase, number>>) => {
    const room = getGmRoom(socket);
    if (!room) return;

    const validPhases: GamePhase[] = ["briefing", "intel", "deliberation", "decision", "resolution"];
    if (!room.timerOverrides) room.timerOverrides = {};

    for (const [phase, seconds] of Object.entries(overrides)) {
      if (validPhases.includes(phase as GamePhase) && typeof seconds === "number" && seconds > 0 && seconds <= 3600) {
        room.timerOverrides[phase as GamePhase] = Math.round(seconds);
      }
    }

    // Acknowledge to GM with current overrides
    socket.emit("gm:timers-updated", { timerOverrides: room.timerOverrides });
    console.log(`[gm:set-timers] updated: ${JSON.stringify(room.timerOverrides)}`);
  });

  socket.on("gm:extend", () => {
    const room = getGmRoom(socket);
    if (!room) return;
    const { code } = room;

    const key = `${code}:${room.round}:${room.phase}`;
    const uses = extendUses.get(key) ?? 0;
    if (uses >= 2) return; // max 2 extends per phase

    extendUses.set(key, uses + 1);
    // Prune stale entries for this room so the map doesn't grow across phases.
    for (const k of extendUses.keys()) {
      if (k.startsWith(`${code}:`) && k !== key) extendUses.delete(k);
    }
    room.timer.endsAt += 60_000;
    syncPhaseTimer(io, room);
    getLoggerForRoom(code).log("phase.extended", { round: room.round, phase: room.phase, extendCount: uses + 1, newDuration: room.timer.endsAt - Date.now() }, { actorId: "gm", round: room.round, phase: room.phase });

    io.to(code).emit("game:phase", {
      phase: room.phase,
      round: room.round,
      timer: room.timer,
    });

    // Notify GM of remaining extend uses
    io.to(socket.id).emit("gm:extend-ack", { usesRemaining: 2 - (uses + 1) });
  });

  socket.on(
    "gm:send-npc-message",
    (
      { npcId, content, targetPlayerId }: { npcId: string; content: string; targetPlayerId: string },
      callback: (res: { ok: boolean; error?: string }) => void,
    ) => {
      const room = getGmRoom(socket);
      if (!room) { callback({ ok: false, error: "Only GM can send NPC messages" }); return; }

      const persona = getNpcPersona(npcId);
      if (!persona) {
        callback({ ok: false, error: `Unknown NPC id: ${npcId}` });
        return;
      }

      if (!room.players[targetPlayerId]) {
        callback({ ok: false, error: `Player not found: ${targetPlayerId}` });
        return;
      }
      if (targetPlayerId.startsWith("__bot_")) {
        callback({ ok: false, error: "Cannot DM bots (no socket connection)" });
        return;
      }

      const targetPlayer = room.players[targetPlayerId];
      const message: GameMessage = {
        id: crypto.randomUUID(),
        from: npcId,
        fromName: persona.name,
        to: targetPlayerId,
        faction: targetPlayer.faction as Faction,
        content,
        timestamp: Date.now(),
        isTeamChat: false,
        isNpc: true,
      };

      room.messages.push(message);
      getLoggerForRoom(room.code).log(EVENT_NAMES.MESSAGE_NPC, { npcId, npcName: persona.name, targetPlayerName: targetPlayer.name, targetFaction: targetPlayer.faction, contentLength: content.length }, { actorId: "gm", round: room.round, phase: room.phase });

      io.to(targetPlayerId).emit("message:receive", message);
      io.to(socket.id).emit("message:receive", { ...message, _gmView: true });

      console.log(`[gm:send-npc-message] ${npcId} → ${targetPlayerId}: "${content.slice(0, 60)}"`);
      callback({ ok: true });
    },
  );
}
