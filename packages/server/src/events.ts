import type { Server, Socket } from "socket.io";
import type { Faction, Role } from "@takeoff/shared";
import { createRoom, getRoom, joinRoom, selectRole, getLobbyState } from "./rooms.js";
import { advancePhase, startGame } from "./game.js";

// Track timer extend uses per phase: `${code}:${round}:${phase}` → count (max 2)
const extendUses = new Map<string, number>();

export function registerGameEvents(io: Server, socket: Socket) {
  // ── Room Management ──

  socket.on("room:create", ({ gmName }: { gmName: string }, callback) => {
    const room = createRoom(socket.id);
    socket.join(room.code);
    socket.data.roomCode = room.code;
    console.log(`[room] created ${room.code} by ${gmName}`);
    callback({ ok: true, code: room.code });
  });

  socket.on("room:join", ({ code, name }: { code: string; name: string }, callback) => {
    const result = joinRoom(code, socket.id, name);
    if (!result) {
      callback({ ok: false, error: "Room not found or game already started" });
      return;
    }

    socket.join(result.room.code);
    socket.data.roomCode = result.room.code;
    io.to(result.room.code).emit("room:state", getLobbyState(result.room));
    console.log(`[room] ${name} joined ${result.room.code}`);
    callback({ ok: true, player: result.player });
  });

  socket.on("room:select-role", ({ faction, role }: { faction: Faction; role: Role }, callback) => {
    const code = socket.data.roomCode;
    if (!code) { callback({ ok: false, error: "Not in a room" }); return; }

    const success = selectRole(code, socket.id, faction, role);
    if (!success) {
      callback({ ok: false, error: "Role already taken" });
      return;
    }

    const room = getRoom(code)!;
    io.to(code).emit("room:state", getLobbyState(room));
    callback({ ok: true });
  });

  // ── Game Flow ──

  socket.on("game:start", (_, callback) => {
    const code = socket.data.roomCode;
    if (!code) { callback({ ok: false, error: "Not in a room" }); return; }

    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) {
      callback({ ok: false, error: "Only GM can start the game" });
      return;
    }

    startGame(io, room);
    callback({ ok: true });
  });

  // ── GM Controls ──

  socket.on("gm:advance", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) return;
    advancePhase(io, room);
  });

  socket.on("gm:pause", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) return;

    if (room.timer.pausedAt) {
      // Resume: adjust endsAt by the paused duration
      const pausedDuration = Date.now() - room.timer.pausedAt;
      room.timer.endsAt += pausedDuration;
      room.timer.pausedAt = undefined;
    } else {
      room.timer.pausedAt = Date.now();
    }

    io.to(code).emit("game:phase", {
      phase: room.phase,
      round: room.round,
      timer: room.timer,
    });
  });

  socket.on("gm:extend", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) return;

    const key = `${code}:${room.round}:${room.phase}`;
    const uses = extendUses.get(key) ?? 0;
    if (uses >= 2) return; // max 2 extends per phase

    extendUses.set(key, uses + 1);
    room.timer.endsAt += 60_000;

    io.to(code).emit("game:phase", {
      phase: room.phase,
      round: room.round,
      timer: room.timer,
    });

    // Notify GM of remaining extend uses
    io.to(socket.id).emit("gm:extend-ack", { usesRemaining: 2 - (uses + 1) });
  });

  // ── Decisions ──

  socket.on("decision:submit", ({ individual, teamVote }: { individual: string; teamVote?: string }) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.phase !== "decision") return;

    // Record individual decision
    if (individual) {
      room.decisions[socket.id] = individual;
    }

    // Record team vote
    if (teamVote) {
      const player = room.players[socket.id];
      if (player) {
        if (!room.teamVotes[player.faction]) {
          room.teamVotes[player.faction] = {};
        }
        room.teamVotes[player.faction][socket.id] = teamVote;

        // Emit votes to team leader
        for (const [pid, p] of Object.entries(room.players)) {
          if (p.faction === player.faction && p.isLeader) {
            io.to(pid).emit("decision:votes", {
              faction: player.faction,
              votes: room.teamVotes[player.faction],
            });
          }
        }
      }
    }

    // Notify GM of current decision submission status
    if (room.gmId) {
      io.to(room.gmId).emit("gm:decision-status", {
        submitted: Object.keys(room.decisions),
      });
    }
  });

  socket.on("decision:leader-submit", ({ teamDecision }: { teamDecision: string }) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.phase !== "decision") return;

    const player = room.players[socket.id];
    if (!player?.isLeader) return;

    room.teamDecisions[player.faction] = teamDecision;
    io.to(code).emit("decision:team-locked", {
      faction: player.faction,
    });
  });

  // ── Messaging ──

  socket.on("message:send", ({ to, content }: { to: string | null; content: string }) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;

    const sender = room.players[socket.id];
    if (!sender) return;

    const message = {
      id: crypto.randomUUID(),
      from: sender.id,
      fromName: sender.name,
      to,
      faction: sender.faction,
      content,
      timestamp: Date.now(),
      isTeamChat: to === null,
    };

    if (to === null) {
      // Team chat: send to all players in same faction
      for (const [pid, p] of Object.entries(room.players)) {
        if (p.faction === sender.faction) {
          io.to(pid).emit("message:receive", message);
        }
      }
    } else {
      // DM: send to specific player
      io.to(to).emit("message:receive", message);
      io.to(socket.id).emit("message:receive", message); // echo back to sender
    }

    // GM sees all messages
    if (room.gmId) {
      io.to(room.gmId).emit("message:receive", { ...message, _gmView: true });
    }
  });

  // ── Disconnect ──

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;

    const player = room.players[socket.id];
    if (player) {
      player.connected = false;
      io.to(code).emit("room:state", getLobbyState(room));
    }
  });
}
