import type { Server, Socket } from "socket.io";
import type { AppContent, ContentItem, Faction, GameMessage, Publication, PublicationType, Role, StateVariables } from "@takeoff/shared";
import { createRoom, getRoom, joinRoom, rejoinRoom, selectRole, getLobbyState, getPlayerMessages } from "./rooms.js";
import { advancePhase, startGame, replayPlayerState } from "./game.js";

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
