import type { Server, Socket } from "socket.io";
import type { AppContent, ContentItem, Faction, GameMessage, GamePhase, Player, Publication, PublicationType, Role, StateVariables } from "@takeoff/shared";
import { isLeaderRole, STATE_VARIABLE_RANGES } from "@takeoff/shared";
import { createRoom, getRoom, joinRoom, rejoinRoom, selectRole, getLobbyState, getPlayerMessages, recordAllDisconnected, clearAllDisconnected } from "./rooms.js";
import { advancePhase, checkThresholds, jumpToPhase, startGame, startTutorial, endTutorial, replayPlayerState, emitStateViews, emitBriefing, emitContent, emitDecisions, syncPhaseTimer, clearPhaseTimer } from "./game.js";
import { getRoundDecisions } from "./content/decisions/rounds.js";
import { getNpcPersona } from "./content/npcPersonas.js";
import { getLoggerForRoom } from "./logger/registry.js";

import { extendUses, cleanupRoom } from "./extendUses.js";


export function registerGameEvents(io: Server, socket: Socket) {
  // ── Room Management ──

  socket.on("room:create", ({ gmName }: { gmName: string }, callback) => {
    const room = createRoom(socket.id);
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

    console.log(`[room] ${isGMRejoin ? "GM" : player!.name} rejoined ${room.code} (${oldSocketId} → ${socket.id})`);
    if (player) {
      getLoggerForRoom(room.code).log("player.reconnected", { playerName: player.name, oldSocketId, newSocketId: socket.id }, { actorId: player.name, round: room.round, phase: room.phase });
    }

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
    const player = room.players[socket.id];
    if (player) {
      getLoggerForRoom(code).log("player.role_selected", { playerName: player.name, faction, role }, { actorId: player.name });
    }
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
    getLoggerForRoom(code).log("phase.gm_advanced", { round: room.round, phase: room.phase }, { actorId: "gm", round: room.round, phase: room.phase });
    clearPhaseTimer(room);
    advancePhase(io, room);
  });

  socket.on("gm:pause", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) return;

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
    getLoggerForRoom(code).log(wasPaused ? "phase.resumed" : "phase.paused", { round: room.round, phase: room.phase, remainingMs }, { actorId: "gm", round: room.round, phase: room.phase });

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

    if (!(variable in STATE_VARIABLE_RANGES)) return;
    const key = variable as keyof StateVariables;
    const [min, max] = STATE_VARIABLE_RANGES[key];
    const oldVal = room.state[key];
    room.state[key] = Math.max(min, Math.min(max, value));

    checkThresholds(io, room);
    emitStateViews(io, room);
    console.log(`[gm:set-state] ${variable} = ${room.state[key]}`);
    getLoggerForRoom(code).log("state.gm_override", { variable, oldValue: oldVal, newValue: room.state[key] }, { actorId: "gm", round: room.round, phase: room.phase });
  });

  socket.on("gm:set-generation", ({ enabled }: { enabled: boolean }, callback?: (res: { ok: boolean; error?: string }) => void) => {
    const code = socket.data.roomCode;
    if (!code) { callback?.({ ok: false, error: "Not in a room" }); return; }
    const room = getRoom(code);
    if (!room || room.gmId !== socket.id) { callback?.({ ok: false, error: "Only GM can toggle generation" }); return; }
    if (room.phase !== "lobby") { callback?.({ ok: false, error: "Can only toggle generation in lobby" }); return; }

    room.generationEnabled = enabled;
    socket.emit("gm:generation-updated", { enabled: room.generationEnabled });
    console.log(`[gm:set-generation] ${enabled ? "enabled" : "disabled"} for room ${code}`);
    callback?.({ ok: true });
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
    // Prune stale entries for this room so the map doesn't grow across phases.
    for (const k of extendUses.keys()) {
      if (k.startsWith(`${code}:`) && k !== key) extendUses.delete(k);
    }
    room.timer.endsAt += 60_000;
    syncPhaseTimer(io, room);
    getLoggerForRoom(code).log("phase.extended", { round: room.round, phase: room.phase, extendCount: uses + 1 }, { actorId: "gm", round: room.round, phase: room.phase });

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
      const code = socket.data.roomCode;
      if (!code) { callback({ ok: false, error: "Not in a room" }); return; }

      const room = getRoom(code);
      if (!room || room.gmId !== socket.id) {
        callback({ ok: false, error: "Only GM can send NPC messages" });
        return;
      }

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
      getLoggerForRoom(code).log("message.npc", { npcId, npcName: persona.name, targetPlayerName: targetPlayer.name, targetFaction: targetPlayer.faction, contentLength: content.length }, { actorId: "gm", round: room.round, phase: room.phase });

      io.to(targetPlayerId).emit("message:receive", message);
      io.to(socket.id).emit("message:receive", { ...message, _gmView: true });

      console.log(`[gm:send-npc-message] ${npcId} → ${targetPlayerId}: "${content.slice(0, 60)}"`);
      callback({ ok: true });
    },
  );

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

    const player = room.players[socket.id];
    if (!player || !player.faction || !player.role) return;
    const roundDecisions = getRoundDecisions(room.round);
    if (!roundDecisions) return;

    const indiv = roundDecisions.individual.find((d) => d.role === player.role);
    const team = roundDecisions.team.find((d) => d.faction === player.faction);

    const validIndividual = individual && indiv?.options.some((o) => o.id === individual) ? individual : null;
    const validTeamVote = teamVote && team?.options.some((o) => o.id === teamVote) ? teamVote : undefined;

    // Record individual decision
    if (validIndividual) {
      room.decisions[socket.id] = validIndividual;
    }

    // Log decisions
    const timeRemainingMs = room.timer.endsAt - Date.now();
    const logger = getLoggerForRoom(code);
    if (validIndividual) logger.log("decision.individual_submitted", { playerName: player.name, role: player.role, optionId: validIndividual, timeRemainingMs }, { actorId: player.name, round: room.round, phase: room.phase });
    if (validTeamVote) logger.log("decision.team_vote", { playerName: player.name, faction: player.faction, optionId: validTeamVote }, { actorId: player.name, round: room.round, phase: room.phase });

    // Record team vote
    if (validTeamVote) {
      if (!room.teamVotes[player.faction]) room.teamVotes[player.faction] = {};
      room.teamVotes[player.faction][socket.id] = validTeamVote;

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
    const roundDecisions = getRoundDecisions(room.round);
    if (!roundDecisions) return;
    const team = roundDecisions.team.find((d) => d.faction === player.faction);
    if (!team?.options.some((o) => o.id === teamDecision)) return;

    room.teamDecisions[player.faction] = teamDecision;
    getLoggerForRoom(code).log("decision.team_locked", { faction: player.faction, optionId: teamDecision, leaderName: player.name }, { actorId: player.name, round: room.round, phase: room.phase });
    io.to(code).emit("decision:team-locked", {
      faction: player.faction,
    });
  });

  // ── Messaging ──

  socket.on("message:send", ({ to, content, channel }: { to: string | null; content: string; channel?: string }) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;

    const sender = room.players[socket.id];
    if (!sender || !sender.faction) return;
    if (to !== null) {
      if (to.startsWith("__bot_")) return;
      if (!room.players[to]) return;
    }

    const targetName = to ? room.players[to]?.name ?? to : null;
    getLoggerForRoom(code).log("message.sent", { from: sender.name, toName: targetName, faction: sender.faction, contentLength: content.length, isTeamChat: to === null }, { actorId: sender.name, round: room.round, phase: room.phase });

    const message = {
      id: crypto.randomUUID(),
      from: sender.id,
      fromName: sender.name,
      to,
      faction: sender.faction,
      content,
      timestamp: Date.now(),
      isTeamChat: to === null,
      // Only set channel for team chat messages; DMs ignore channel
      ...(to === null ? { channel: channel ?? "#general" } : {}),
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

    // GM sees all messages (avoid duplicating if the GM is also a normal recipient)
    if (room.gmId) {
      const gmId = room.gmId;
      const gmPlayer = room.players[gmId];
      const gmAlreadyReceived = gmId === socket.id
        || (to === null ? gmPlayer?.faction === sender.faction : gmId === to);
      if (!gmAlreadyReceived) {
        io.to(gmId).emit("message:receive", { ...message, _gmView: true });
      }
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

      getLoggerForRoom(code).log("publish.submitted", { playerName: player.name, role: player.role, type, title }, { actorId: player.name, round: room.round, phase: room.phase });

      const timestamp = new Date().toISOString();
      const pubId = crypto.randomUUID();

      // Create ContentItems for news and twitter feeds
      const newsItem: ContentItem = {
        id: `pub-news-${pubId}`,
        type: "headline",
        round: room.round,
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
        round: room.round,
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
        round: room.round,
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

  // ── Tweet Broadcasting ──

  socket.on("tweet:send", ({ text }: { text: string }) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 280) return;

    const tweet = {
      id: crypto.randomUUID(),
      playerName: player.name,
      playerRole: player.role,
      playerFaction: player.faction,
      text: trimmed,
      timestamp: Date.now(),
    };

    // Broadcast to ALL players in the room (including sender for confirmation)
    for (const pid of Object.keys(room.players)) {
      io.to(pid).emit("tweet:receive", tweet);
    }
    // GM sees it too
    if (room.gmId) {
      io.to(room.gmId).emit("tweet:receive", tweet);
    }
  });

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
    getLoggerForRoom(code).log("activity.report", { playerName: player.name, appsOpened: opened }, { actorId: player.name, round: room.round, phase: room.phase });

    // Forward to GM for real-time visibility
    if (room.gmId) {
      io.to(room.gmId).emit("gm:activity", { playerId: socket.id, opened });
    }
  });

  // ── Dev Tools (dev/test only) ──

  if (process.env.NODE_ENV !== "production") {
    socket.on("dev:fill-bots", async (callback: (res: { ok: boolean; error?: string }) => void) => {
      const code = socket.data.roomCode;
      if (!code) return callback({ ok: false, error: "Not in a room" });
      const room = getRoom(code);
      if (!room) return callback({ ok: false, error: "Room not found" });
      if (room.gmId !== socket.id) return callback({ ok: false, error: "Only GM can fill bots" });

      const { seedBotsForRoom } = await import("./devBots.js");
      seedBotsForRoom(room, socket.id, { mode: "minimum_table" });

      // Broadcast updated lobby to all clients so player list reflects bots
      io.to(code).emit("room:state", getLobbyState(room));

      callback({ ok: true });
    });
  }

  // ── Dev Bootstrap (dev/test only) ──

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
          const { seedBotsForRoom } = await import("./devBots.js");
          seedBotsForRoom(room, socket.id, { mode: botMode });
        }

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
            const { scheduleBotDecisionSubmissions } = await import("./devBots.js");
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
      getLoggerForRoom(code).log("player.disconnected", { playerName: player.name, faction: player.faction, role: player.role }, { actorId: player.name, round: room.round, phase: room.phase });
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
