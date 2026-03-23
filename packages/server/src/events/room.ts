import type { Server, Socket } from "socket.io";
import type { Faction, Role } from "@takeoff/shared";
import { createRoom, joinRoom, rejoinRoom, selectRole, getLobbyState, getPlayerMessages, clearAllDisconnected, isAtRoomCap, MAX_CONCURRENT_ROOMS, getRoom } from "../rooms.js";
import { replayPlayerState } from "../game.js";
import { EVENT_NAMES } from "../logger/index.js";
import { getLoggerForRoom } from "../logger/registry.js";
import { getSocketRoom } from "./helpers.js";

export function registerRoomEvents(io: Server, socket: Socket) {
  socket.on("room:create", ({ gmName }: { gmName: string }, callback) => {
    if (isAtRoomCap()) {
      callback({ ok: false, error: "Server is at capacity (max " + MAX_CONCURRENT_ROOMS + " rooms). Try again later." });
      return;
    }
    const room = createRoom(socket.id);
    room.microActionCounts = {};
    room.playerTweets = [];
    socket.join(room.code);
    socket.data.roomCode = room.code;
    console.log(`[room] created ${room.code} by ${gmName}`);
    getLoggerForRoom(room.code).log("room.created", { code: room.code, gmName }, { actorId: "system" });
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
    getLoggerForRoom(result.room.code).log("player.joined", { playerName: name, code }, { actorId: name });
    callback({ ok: true, player: result.player });
  });

  socket.on("room:rejoin", ({ code, playerId: oldSocketId }: { code: string; playerId: string }, callback?: (res: { ok: boolean; error?: string; player?: { faction: Faction | null; role: Role | null; isLeader: boolean } }) => void) => {
    const room = getRoom(code);
    if (!room) {
      callback?.({ ok: false, error: "Room not found" });
      return;
    }

    // Capture messages and player info BEFORE reassignment
    const oldPlayer = room.players[oldSocketId];
    const isGMRejoin = room.gmId === oldSocketId;

    if (!oldPlayer && !isGMRejoin) {
      callback?.({ ok: false, error: "Player not found in room" });
      return;
    }

    // Get messages for this player (team chats + DMs) before reassigning socket ID
    const messages = oldPlayer?.faction ? getPlayerMessages(room, oldPlayer.faction, oldSocketId) : [];

    // Reassign socket ID
    const result = rejoinRoom(code, socket.id, oldSocketId);
    if (!result) {
      callback?.({ ok: false, error: "Rejoin failed" });
      return;
    }

    socket.join(room.code);
    socket.data.roomCode = room.code;
    clearAllDisconnected(room.code);

    const { player } = result;

    // Broadcast updated room state (marks player as connected again)
    io.to(room.code).emit("room:state", getLobbyState(room));

    // Replay full game state to the reconnected socket
    socket.emit("game:phase", { phase: room.phase, round: room.round, timer: room.timer });

    // Replay per-player game state (fog view, content, decisions, briefing)
    replayPlayerState(socket, room, isGMRejoin ? null : player);

    // Replay message history
    socket.emit("message:history", { messages });

    // Replay player tweets for reconnect
    if (room.playerTweets?.length) {
      for (const tweet of room.playerTweets) {
        socket.emit("tweet:receive", tweet);
      }
    }

    console.log(`[room] ${isGMRejoin ? "GM" : player!.name} rejoined ${room.code} (${oldSocketId} → ${socket.id})`);
    if (player) {
      getLoggerForRoom(room.code).log(EVENT_NAMES.PLAYER_RECONNECTED, { playerName: player.name, oldSocketId, newSocketId: socket.id }, { actorId: player.name, round: room.round, phase: room.phase });
    }

    callback?.({
      ok: true,
      player: player ? { faction: player.faction, role: player.role, isLeader: player.isLeader } : undefined,
    });
  });

  socket.on("room:select-role", ({ faction, role }: { faction: Faction; role: Role }, callback) => {
    const room = getSocketRoom(socket);
    if (!room) { callback({ ok: false, error: "Not in a room" }); return; }

    const success = selectRole(room.code, socket.id, faction, role);
    if (!success) {
      callback({ ok: false, error: "Role already taken" });
      return;
    }

    const player = room.players[socket.id];
    if (player) {
      getLoggerForRoom(room.code).log(EVENT_NAMES.PLAYER_ROLE_SELECTED, { playerName: player.name, faction, role }, { actorId: player.name });
    }
    io.to(room.code).emit("room:state", getLobbyState(room));
    callback({ ok: true });
  });
}
