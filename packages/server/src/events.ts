import type { Server, Socket } from "socket.io";
import type { AppContent, ContentItem, Faction, GameMessage, GamePhase, Player, Publication, PublicationType, Role, StateVariables } from "@takeoff/shared";
import { createRoom, getRoom, joinRoom, rejoinRoom, selectRole, getLobbyState, getPlayerMessages } from "./rooms.js";
import { advancePhase, jumpToPhase, startGame, startTutorial, endTutorial, replayPlayerState, emitStateViews, emitBriefing, emitContent, emitDecisions } from "./game.js";

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

    const { player } = result;

    // Broadcast updated room state (marks player as connected again)
    io.to(room.code).emit("room:state", getLobbyState(room));

    // Replay full game state to the reconnected socket
    socket.emit("game:phase", { phase: room.phase, round: room.round, timer: room.timer });

    // Replay per-player game state (fog view, content, decisions, briefing)
    replayPlayerState(socket, room, isGMRejoin ? null : player);

    // Replay message history
    socket.emit("message:history", { messages });

    console.log(`[room] ${isGMRejoin ? "GM" : player!.name} rejoined ${room.code} (${oldSocketId} → ${socket.id})`);

    callback?.({
      ok: true,
      player: player ? { faction: player.faction, role: player.role, isLeader: player.isLeader } : undefined,
    });
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

  socket.on("gm:start-tutorial", (_, callback: (res: { ok: boolean; error?: string }) => void) => {
    const code = socket.data.roomCode;
    if (!code) { callback({ ok: false, error: "Not in a room" }); return; }

    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) {
      callback({ ok: false, error: "Only GM can start the tutorial" });
      return;
    }

    startTutorial(io, room);
    callback({ ok: true });
  });

  socket.on("gm:end-tutorial", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) return;
    if (room.round !== 0) return;
    endTutorial(io, room);
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

  socket.on("gm:set-state", ({ variable, value }: { variable: string; value: number }) => {
    if (process.env.NODE_ENV === "production") return;
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) return;

    const STATE_BOUNDS: Record<string, [number, number]> = {
      // Tier 1
      obCapability: [0, 100],
      promCapability: [0, 100],
      chinaCapability: [0, 100],
      usChinaGap: [-24, 24],
      obPromGap: [-24, 24],
      alignmentConfidence: [0, 100],
      misalignmentSeverity: [0, 100],
      publicAwareness: [0, 100],
      publicSentiment: [-100, 100],
      economicDisruption: [0, 100],
      taiwanTension: [0, 100],
      obInternalTrust: [0, 100],
      securityLevelOB: [1, 5],
      securityLevelProm: [1, 5],
      intlCooperation: [0, 100],
      // Tier 2
      cdzComputeUtilization: [0, 100],
      domesticChipProgress: [0, 100],
      promSafetyBreakthroughProgress: [0, 100],
      aiAutonomyLevel: [0, 100],
      doomClockDistance: [0, 10],
      regulatoryPressure: [0, 100],
      obBoardConfidence: [0, 100],
      promBoardConfidence: [0, 100],
      ccpPatience: [0, 100],
      chinaWeightTheftProgress: [0, 100],
      whistleblowerPressure: [0, 100],
      // Tier 3
      globalMediaCycle: [-100, 100],
      marketIndex: [0, 100],
      obBurnRate: [0, 100],
      promBurnRate: [0, 100],
      promMorale: [0, 100],
      openSourceMomentum: [0, 100],
    };

    if (!(variable in STATE_BOUNDS)) return;
    const key = variable as keyof StateVariables;
    const [min, max] = STATE_BOUNDS[variable];
    room.state[key] = Math.max(min, Math.min(max, value));

    emitStateViews(io, room);
    console.log(`[gm:set-state] ${variable} = ${room.state[key]}`);
  });

  socket.on("gm:set-timers", (overrides: Partial<Record<GamePhase, number>>) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) return;

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

  // ── Dev Tools (non-production only) ──

  if (process.env.NODE_ENV !== "production") {
    const VALID_JUMP_PHASES: GamePhase[] = ["briefing", "intel", "deliberation", "decision", "resolution"];

    socket.on("gm:jump", ({ round, phase }: { round: number; phase: GamePhase }) => {
      const code = socket.data.roomCode;
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.gmId !== socket.id) return;

      if (!Number.isInteger(round) || round < 1 || round > 5) return;
      if (!VALID_JUMP_PHASES.includes(phase)) return;

      jumpToPhase(io, room, round, phase);
    });
  }

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
      if (player && player.faction) {
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
    if (!player?.isLeader || !player.faction) return;

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
    if (!sender || !sender.faction) return;

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

    // Store message in room for reconnect replay and reveal_dm
    room.messages.push(message);

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

  // ── Publishing ──

  socket.on(
    "publish:submit",
    ({ type, title, content, source }: { type: PublicationType; title: string; content: string; source: string }) => {
      const code = socket.data.roomCode;
      if (!code) return;
      const room = getRoom(code);
      if (!room) return;

      const player = room.players[socket.id];
      if (!player || !player.role || !player.faction) return;

      // Validate: only specific roles can publish
      const PUBLISHER_ROLES: Role[] = ["ext_journalist", "prom_opensource", "ob_safety"];
      if (!PUBLISHER_ROLES.includes(player.role)) return;

      // Leak mechanic: ob_safety can only do leaks, not articles
      if (player.role === "ob_safety" && type !== "leak") return;

      const timestamp = new Date().toISOString();
      const pubId = crypto.randomUUID();

      // Create ContentItems for news and twitter feeds
      const newsItem: ContentItem = {
        id: `pub-news-${pubId}`,
        type: "headline",
        sender: source || player.name,
        subject: title,
        body: content,
        timestamp,
        classification: type === "leak" ? "critical" : "context",
      };

      const tweetText = type === "leak"
        ? `BREAKING: ${title} — ${content.slice(0, 200)}${content.length > 200 ? "…" : ""}`
        : `${title} — ${content.slice(0, 200)}${content.length > 200 ? "…" : ""}`;

      const twitterItem: ContentItem = {
        id: `pub-twitter-${pubId}`,
        type: "tweet",
        sender: source || player.name,
        body: tweetText,
        timestamp,
        classification: type === "leak" ? "critical" : "context",
      };

      // Store publication record
      const publication: Publication = {
        id: pubId,
        type,
        title,
        content,
        source: source || player.name,
        publishedBy: player.role,
        publishedAt: Date.now(),
      };
      room.publications.push(publication);

      // Compute state effects
      const STATE_EFFECTS: Record<PublicationType, Partial<StateVariables>> = {
        article: { publicAwareness: 15, publicSentiment: 10 },
        leak:    { publicAwareness: 25, publicSentiment: -10 },
        research: { publicAwareness: 15, publicSentiment: 5 },
      };
      const effects = STATE_EFFECTS[type];
      for (const [key, delta] of Object.entries(effects) as [keyof StateVariables, number][]) {
        const current = room.state[key];
        // publicAwareness: clamp 0-100; publicSentiment: clamp -100 to 100
        if (key === "publicSentiment") {
          room.state[key] = Math.max(-100, Math.min(100, current + delta));
        } else {
          room.state[key] = Math.max(0, Math.min(100, current + delta));
        }
      }

      const summary = `${type === "leak" ? "🔴 LEAK" : type === "research" ? "📄 RESEARCH" : "📰 PUBLISHED"}: ${title}`;

      // Emit to all players in the room
      for (const playerId of Object.keys(room.players)) {
        const recipient = room.players[playerId];
        if (!recipient.faction) continue;
        // Inject content items into player's feeds
        const newsContent: AppContent = {
          faction: recipient.faction,
          role: recipient.role ?? undefined,
          app: "news",
          items: [newsItem],
        };
        const twitterContent: AppContent = {
          faction: recipient.faction,
          role: recipient.role ?? undefined,
          app: "twitter",
          items: [twitterItem],
        };

        io.to(playerId).emit("game:publish", {
          publication,
          newsContent,
          twitterContent,
          summary,
        });

        io.to(playerId).emit("game:notification", {
          id: pubId,
          summary,
          from: source || player.name,
          timestamp: Date.now(),
        });
      }

      // GM sees it too
      if (room.gmId) {
        io.to(room.gmId).emit("game:publish", {
          publication,
          newsContent: { faction: "external" as Faction, app: "news", items: [newsItem] },
          twitterContent: { faction: "external" as Faction, app: "twitter", items: [twitterItem] },
          summary,
        });
        io.to(room.gmId).emit("game:notification", {
          id: pubId,
          summary,
          from: source || player.name,
          timestamp: Date.now(),
        });
      }

      console.log(`[publish] ${player.role} published ${type}: "${title}"`);
    },
  );

  // ── Activity Tracking ──

  socket.on("activity:report", ({ opened }: { opened: string[] }) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    if (!room.playerActivity) room.playerActivity = {};
    room.playerActivity[socket.id] = opened;

    // Forward to GM for real-time visibility
    if (room.gmId) {
      io.to(room.gmId).emit("gm:activity", { playerId: socket.id, opened });
    }
  });

  // ── Dev Bootstrap (dev/test only) ──

  if (process.env.NODE_ENV !== "production") {
    socket.on(
      "dev:bootstrap",
      (
        {
          faction,
          role,
          round,
          phase,
          stateOverrides,
        }: {
          faction: Faction;
          role: Role;
          round: number;
          phase: GamePhase;
          stateOverrides?: Record<string, number>;
        },
        callback: (res: { ok: boolean; code?: string; error?: string }) => void,
      ) => {
        // Create room with a dummy GM id (no real GM for solo dev testing)
        const room = createRoom("dev-gm");
        socket.join(room.code);
        socket.data.roomCode = room.code;

        // Add the player directly (bypass lobby join flow)
        const player: Player = {
          id: socket.id,
          name: "Dev",
          faction,
          role,
          isLeader: ["ob_ceo", "prom_ceo", "china_director"].includes(role),
          connected: true,
        };
        room.players[socket.id] = player;

        // Jump to the target round and phase
        room.round = round;
        room.phase = phase;
        room.decisions = {};
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
        }

        console.log(`[dev:bootstrap] room=${room.code} faction=${faction} role=${role} round=${round} phase=${phase}`);
        callback({ ok: true, code: room.code });
      },
    );
  }

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
