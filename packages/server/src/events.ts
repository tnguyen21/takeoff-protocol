import type { Server, Socket } from "socket.io";
import type { AppContent, ContentItem, Faction, GameMessage, GamePhase, GameRoom, Player, Publication, PublicationAngle, PublicationTarget, PublicationType, Role, StateVariables } from "@takeoff/shared";
import { canWriteSubstack, getPublicationEffects, isLeaderRole, STATE_VARIABLE_RANGES } from "@takeoff/shared";
import { createRoom, getRoom, joinRoom, rejoinRoom, selectRole, getLobbyState, getPlayerMessages, recordAllDisconnected, clearAllDisconnected, isAtRoomCap, MAX_CONCURRENT_ROOMS } from "./rooms.js";
import { advancePhase, checkThresholds, jumpToPhase, startGame, startTutorial, endTutorial, replayPlayerState, emitStateViews, emitBriefing, emitContent, emitDecisions, getActiveDecisions, syncPhaseTimer, clearPhaseTimer } from "./game.js";
import { getNpcPersona } from "./content/npcPersonas.js";
import { getLoggerForRoom } from "./logger/registry.js";

import { extendUses, cleanupRoom } from "./extendUses.js";
import { EVENT_NAMES } from "./logger/index.js";
import { applyMicroAction } from "./microActions.js";

// ── Input length limits ────────────────────────────────────────────────────────
const MAX_CHAT_LENGTH = 2000;
const MAX_PUBLISH_TITLE_LENGTH = 200;
const MAX_PUBLISH_CONTENT_LENGTH = 5000;
const MAX_TWEET_LENGTH = 280;

// ── Room validation helpers ────────────────────────────────────────────────────
function getSocketRoom(socket: Socket): GameRoom | null {
  const code = socket.data.roomCode;
  if (!code) return null;
  return getRoom(code) ?? null;
}

function getGmRoom(socket: Socket): GameRoom | null {
  const room = getSocketRoom(socket);
  if (!room || room.gmId !== socket.id) return null;
  return room;
}

export function registerGameEvents(io: Server, socket: Socket) {
  // ── Room Management ──

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

  // ── Game Flow ──

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

  // ── GM Controls ──

  socket.on("gm:advance", () => {
    const room = getGmRoom(socket);
    if (!room) return;
    getLoggerForRoom(room.code).log("phase.gm_advanced", { round: room.round, phase: room.phase }, { actorId: "gm", round: room.round, phase: room.phase });
    clearPhaseTimer(room);
    advancePhase(io, room);
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

  socket.on("gm:set-generation", ({ enabled }: { enabled: boolean }, callback?: (res: { ok: boolean; error?: string }) => void) => {
    const room = getGmRoom(socket);
    if (!room) { callback?.({ ok: false, error: "Only GM can toggle generation" }); return; }
    if (room.phase !== "lobby") { callback?.({ ok: false, error: "Can only toggle generation in lobby" }); return; }

    room.generationEnabled = enabled;
    socket.emit("gm:generation-updated", { enabled: room.generationEnabled });
    console.log(`[gm:set-generation] ${enabled ? "enabled" : "disabled"} for room ${room.code}`);
    callback?.({ ok: true });
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

  // ── Dev Tools (non-production only) ──

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

  // ── Decisions ──

  socket.on("decision:submit", ({ individual, teamVote }: { individual: string; teamVote?: string }) => {
    const room = getSocketRoom(socket);
    if (!room || room.phase !== "decision") return;

    const player = room.players[socket.id];
    if (!player || !player.faction || !player.role) return;
    const roundDecisions = getActiveDecisions(room, room.round);
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
    const logger = getLoggerForRoom(room.code);
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
    const room = getSocketRoom(socket);
    if (!room || room.phase !== "decision") return;

    const player = room.players[socket.id];
    if (!player?.isLeader || !player.faction) return;
    const roundDecisions = getActiveDecisions(room, room.round);
    if (!roundDecisions) return;
    const team = roundDecisions.team.find((d) => d.faction === player.faction);
    if (!team?.options.some((o) => o.id === teamDecision)) return;

    room.teamDecisions[player.faction] = teamDecision;
    getLoggerForRoom(room.code).log(EVENT_NAMES.DECISION_TEAM_LOCKED, { faction: player.faction, optionId: teamDecision, leaderName: player.name }, { actorId: player.name, round: room.round, phase: room.phase });
    io.to(room.code).emit("decision:team-locked", {
      faction: player.faction,
    });
  });

  // ── Messaging ──

  socket.on("message:send", ({ to, content, channel }: { to: string | null; content: string; channel?: string }) => {
    const room = getSocketRoom(socket);
    if (!room) return;

    const sender = room.players[socket.id];
    if (!sender || !sender.faction) return;
    if (to !== null) {
      if (to.startsWith("__bot_")) {
        socket.emit("error", { message: "Cannot send DMs to bot players" });
        return;
      }
      if (!room.players[to]) return;
    }

    content = content.slice(0, MAX_CHAT_LENGTH);

    const targetName = to ? room.players[to]?.name ?? to : null;
    getLoggerForRoom(room.code).log(EVENT_NAMES.MESSAGE_SENT, { from: sender.name, toName: targetName, faction: sender.faction, contentLength: content.length, isTeamChat: to === null }, { actorId: sender.name, round: room.round, phase: room.phase });

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

      // Micro-action: Slack team chat applies a small faction-contextualized state delta
      applyMicroAction(room, socket.id, "slack", {
        type: "slack",
        channel: message.channel ?? "#general",
        faction: sender.faction,
      });
    } else {
      // DM: send to specific player
      io.to(to).emit("message:receive", message);
      io.to(socket.id).emit("message:receive", message); // echo back to sender

      // Micro-action: Signal DM affects game state for cross-faction communication
      const recipient = room.players[to];
      if (recipient && !to.startsWith("__bot_") && sender.faction && recipient.faction) {
        applyMicroAction(room, socket.id, "signal_dm", {
          type: "signal_dm",
          senderFaction: sender.faction,
          recipientFaction: recipient.faction,
          senderRole: sender.role ?? "",
          recipientRole: recipient.role ?? "",
        });
      }
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
    ({ type, title, content, source, angle, targetFaction }: { type: PublicationType; title: string; content: string; source: string; angle?: PublicationAngle; targetFaction?: PublicationTarget }) => {
      const room = getSocketRoom(socket);
      if (!room) return;

      const player = room.players[socket.id];
      if (!player || !player.role || !player.faction) return;

      if (!canWriteSubstack(player.role)) return;

      // Validate angle/target if provided
      const VALID_ANGLES: PublicationAngle[] = ["safety", "hype", "geopolitics"];
      const VALID_TARGETS: PublicationTarget[] = ["openbrain", "prometheus", "china", "general"];
      if (angle !== undefined && !VALID_ANGLES.includes(angle)) return;
      if (targetFaction !== undefined && !VALID_TARGETS.includes(targetFaction)) return;

      title = title.slice(0, MAX_PUBLISH_TITLE_LENGTH);
      content = content.slice(0, MAX_PUBLISH_CONTENT_LENGTH);

      getLoggerForRoom(room.code).log(EVENT_NAMES.PUBLISH_SUBMITTED, { playerName: player.name, role: player.role, type, title }, { actorId: player.name, round: room.round, phase: room.phase });

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
        angle,
        targetFaction,
      };
      room.publications.push(publication);

      // Compute state effects
      let effects: Partial<StateVariables>;
      if (angle !== undefined && targetFaction !== undefined) {
        // New angle×target effect matrix
        effects = getPublicationEffects(angle, targetFaction, player.role);
      } else {
        // Legacy flat effects (backwards compat for publications without angle/target)
        const STATE_EFFECTS: Record<PublicationType, Partial<StateVariables>> = {
          article: { publicAwareness: 15, publicSentiment: 10 },
          leak:    { publicAwareness: 25, publicSentiment: -10 },
          research: { publicAwareness: 15, publicSentiment: 5 },
        };
        effects = STATE_EFFECTS[type];
      }
      const stateRec = room.state as unknown as Record<string, number>;
      for (const [key, delta] of Object.entries(effects) as [keyof StateVariables, number][]) {
        const range = STATE_VARIABLE_RANGES[key];
        if (!range) continue;
        const current = room.state[key];
        stateRec[key] = Math.max(range[0], Math.min(range[1], current + delta));
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
    const room = getSocketRoom(socket);
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    const trimmed = text.trim().slice(0, MAX_TWEET_LENGTH);
    if (!trimmed) return;

    const tweet = {
      id: `tweet_${crypto.randomUUID()}`,
      playerName: player.name,
      playerRole: player.role,
      playerFaction: player.faction,
      text: trimmed,
      timestamp: Date.now(),
    };

    // Persist tweet for reconnect replay
    if (!room.playerTweets) room.playerTweets = [];
    room.playerTweets.push(tweet);

    // Broadcast to ALL players in the room (including sender for confirmation)
    for (const pid of Object.keys(room.players)) {
      io.to(pid).emit("tweet:receive", tweet);
    }
    // GM sees it too
    if (room.gmId) {
      io.to(room.gmId).emit("tweet:receive", tweet);
    }

    // Micro-action: tweet affects game state (silent — no client notification)
    applyMicroAction(room, socket.id, "tweet", { type: "tweet", content: trimmed });
  });

  // ── Activity Tracking ──

  socket.on("activity:report", ({ opened }: { opened: string[] }) => {
    const room = getSocketRoom(socket);
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    if (!room.playerActivity) room.playerActivity = {};
    room.playerActivity[socket.id] = opened;
    getLoggerForRoom(room.code).log("activity.report", { playerName: player.name, appsOpened: opened }, { actorId: player.name, round: room.round, phase: room.phase });

    // Forward to GM for real-time visibility
    if (room.gmId) {
      io.to(room.gmId).emit("gm:activity", { playerId: socket.id, opened });
    }
  });

  // ── Dev Tools (dev/test only) ──

  if (process.env.NODE_ENV !== "production") {
    socket.on("dev:fill-bots", async (callback: (res: { ok: boolean; error?: string }) => void) => {
      const room = getGmRoom(socket);
      if (!room) return callback({ ok: false, error: "Only GM can fill bots" });

      const { seedBotsForRoom } = await import("./devBots.js");
      seedBotsForRoom(room, socket.id, { mode: "minimum_table" });

      // Broadcast updated lobby to all clients so player list reflects bots
      io.to(room.code).emit("room:state", getLobbyState(room));

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
