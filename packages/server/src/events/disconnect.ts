import type { Server, Socket } from "socket.io";
import { getLobbyState, recordAllDisconnected } from "../rooms.js";
import { clearPhaseTimer } from "../game.js";
import { cleanupRoom } from "../extendUses.js";
import { EVENT_NAMES } from "../logger/index.js";
import { getLoggerForRoom } from "../logger/registry.js";
import { getSocketRoom } from "./helpers.js";

export function registerDisconnectHandler(io: Server, socket: Socket) {
  socket.on("disconnect", () => {
    const room = getSocketRoom(socket);
    if (!room) return;
    const { code } = room;

    const player = room.players[socket.id];
    if (player) {
      player.connected = false;
      io.to(code).emit("room:state", getLobbyState(room));
      getLoggerForRoom(code).log(EVENT_NAMES.PLAYER_DISCONNECTED, { playerName: player.name, faction: player.faction, role: player.role }, { actorId: player.name, round: room.round, phase: room.phase });
    }

    // If all players are now disconnected, clear the phase timer and extend uses
    // to prevent the auto-advance timer from firing on an abandoned room.
    const allDisconnected = Object.values(room.players).every((p) => !p.connected);
    if (allDisconnected) {
      clearPhaseTimer(room);
      cleanupRoom(code);
      recordAllDisconnected(code);
    }
  });
}
