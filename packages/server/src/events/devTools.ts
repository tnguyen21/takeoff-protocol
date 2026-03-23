import type { Server, Socket } from "socket.io";
import type { Faction, GamePhase, Player, Role } from "@takeoff/shared";
import { isLeaderRole } from "@takeoff/shared";
import { createRoom, getRoom, getLobbyState } from "../rooms.js";
import { jumpToPhase, replayPlayerState, emitStateViews, emitBriefing, emitContent, emitDecisions, checkThresholds } from "../game.js";
import { getGmRoom } from "./helpers.js";

export function registerDevToolEvents(io: Server, socket: Socket) {
  if (process.env.NODE_ENV !== "production") {
    const VALID_JUMP_PHASES: GamePhase[] = ["briefing", "intel", "deliberation", "decision", "resolution"];

    socket.on("gm:jump", ({ round, phase }: { round: number; phase: GamePhase }) => {
      const room = getGmRoom(socket);
      if (!room) return;

      if (!Number.isInteger(round) || round < 1 || round > 5) return;
      if (!VALID_JUMP_PHASES.includes(phase)) return;

      jumpToPhase(io, room, round, phase);
    });
  }

  if (process.env.NODE_ENV !== "production") {
    socket.on("dev:fill-bots", async (callback: (res: { ok: boolean; error?: string }) => void) => {
      const room = getGmRoom(socket);
      if (!room) return callback({ ok: false, error: "Only GM can fill bots" });

      const { seedBotsForRoom } = await import("../devBots.js");
      seedBotsForRoom(room, socket.id, { mode: "minimum_table" });

      // Broadcast updated lobby to all clients so player list reflects bots
      io.to(room.code).emit("room:state", getLobbyState(room));

      callback({ ok: true });
    });
  }

  if (process.env.NODE_ENV !== "production") {
    socket.on(
      "dev:bootstrap",
      async (
        {
          faction,
          role,
          round,
          phase,
          stateOverrides,
          botMode,
          gm,
          code,
        }: {
          faction: Faction;
          role: Role;
          round: number;
          phase: GamePhase;
          stateOverrides?: Record<string, number>;
          botMode?: "all_roles" | "minimum_table";
          gm?: boolean;
          code?: string;
        },
        callback: (res: { ok: boolean; code?: string; error?: string }) => void,
      ) => {
        // Join existing room if code is provided
        if (code) {
          const existing = getRoom(code);
          if (existing) {
            socket.join(existing.code);
            socket.data.roomCode = existing.code;

            const player: Player = {
              id: socket.id,
              name: "Dev",
              faction,
              role,
              isLeader: isLeaderRole(role),
              connected: true,
            };
            existing.players[socket.id] = player;

            socket.emit("room:state", getLobbyState(existing));
            socket.emit("game:phase", { phase: existing.phase, round: existing.round, timer: existing.timer });
            replayPlayerState(socket, existing, player);

            console.log(`[dev:bootstrap] joined existing room=${existing.code} as ${faction}/${role}`);
            return callback({ ok: true, code: existing.code });
          }
          // Room not found — fall through to create a new one
        }

        // Create room — use socket.id as GM if gm flag is set
        const room = createRoom(gm ? socket.id : "dev-gm");
        socket.join(room.code);
        socket.data.roomCode = room.code;

        // Add the player directly (bypass lobby join flow)
        const player: Player = {
          id: socket.id,
          name: "Dev",
          faction,
          role,
          isLeader: isLeaderRole(role),
          connected: true,
        };
        room.players[socket.id] = player;

        // Seed dev bots for unoccupied roles
        if (botMode) {
          const { seedBotsForRoom } = await import("../devBots.js");
          seedBotsForRoom(room, socket.id, { mode: botMode });
        }

        // Jump to the target round and phase
        room.round = round;
        room.phase = phase;
        room.decisions = {};
        room.decisions2 = {};
        room.teamDecisions = {};
        room.teamVotes = {};

        // Apply state overrides
        if (stateOverrides) {
          for (const [key, value] of Object.entries(stateOverrides)) {
            if (key in room.state) {
              (room.state as unknown as Record<string, number>)[key] = value;
            }
          }
        }

        // Emit lobby state so GM dashboard sees all players (including bots)
        socket.emit("room:state", getLobbyState(room));

        // Emit phase
        socket.emit("game:phase", { phase: room.phase, round: room.round, timer: { endsAt: 0 } });

        // Emit fog-filtered state view
        emitStateViews(io, room);

        // Emit phase-appropriate content
        if (phase === "briefing") {
          emitBriefing(io, room);
        }
        if (phase === "intel" || phase === "deliberation") {
          emitContent(io, room);
        }
        if (phase === "decision") {
          emitContent(io, room);
          emitDecisions(io, room);
          if (botMode) {
            const { scheduleBotDecisionSubmissions } = await import("../devBots.js");
            scheduleBotDecisionSubmissions(io, room, { mode: botMode });
          }
        }

        // Fire any NPC triggers matching current state
        checkThresholds(io, room);

        console.log(`[dev:bootstrap] room=${room.code} faction=${faction} role=${role} round=${round} phase=${phase}${botMode ? ` botMode=${botMode}` : ""}`);
        callback({ ok: true, code: room.code });
      },
    );
  }
}
