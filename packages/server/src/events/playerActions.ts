import type { Server, Socket } from "socket.io";
import type { AppContent, ContentItem, Faction, GameMessage, Publication, PublicationAngle, PublicationTarget, PublicationType, StateVariables } from "@takeoff/shared";
import { canWriteSubstack, getPublicationEffects, applyDeltaMap } from "@takeoff/shared";
import type { GameRoom, Role } from "@takeoff/shared";
import { getActiveDecisions } from "../game.js";
import { getLoggerForRoom } from "../logger/registry.js";
import { applyMicroAction } from "../microActions.js";
import { generatePublicationDraft } from "../generation/publicationDraft.js";
import { EVENT_NAMES } from "../logger/index.js";
import { getSocketRoom } from "./helpers.js";

// ── Input length limits ────────────────────────────────────────────────────────
const MAX_CHAT_LENGTH = 2000;
const MAX_PUBLISH_TITLE_LENGTH = 200;
const MAX_PUBLISH_CONTENT_LENGTH = 5000;
const MAX_TWEET_LENGTH = 280;
const VALID_PUBLICATION_ANGLES: PublicationAngle[] = ["safety", "hype", "geopolitics"];
const VALID_PUBLICATION_TARGETS: PublicationTarget[] = ["openbrain", "prometheus", "china", "general"];

function hasPublishedThisRound(room: GameRoom, role: Role, round: number): boolean {
  return room.publications.some((publication) => publication.publishedBy === role && publication.round === round);
}

function getCachedPublicationDraft(room: GameRoom, role: Role) {
  const draft = room.generatedPublicationDrafts?.[role];
  if (!draft || draft.round !== room.round) return null;
  return draft;
}

export function registerPlayerActionEvents(io: Server, socket: Socket) {
  socket.on("decision:submit", ({ individual, individual2, teamVote }: { individual: string; individual2?: string; teamVote?: string }) => {
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

    // Validate and record second individual decision
    const indivAll = roundDecisions.individual.filter((d) => d.role === player.role);
    const indiv2 = indivAll[1];
    const validIndividual2 = individual2 && indiv2?.options.some((o) => o.id === individual2) ? individual2 : null;

    if (validIndividual2) {
      if (!room.decisions2) room.decisions2 = {};
      room.decisions2[socket.id] = validIndividual2;
    }

    // Log decisions
    const timeRemainingMs = room.timer.endsAt - Date.now();
    const logger = getLoggerForRoom(room.code);
    if (validIndividual) logger.log("decision.individual_submitted", { playerName: player.name, role: player.role, optionId: validIndividual, timeRemainingMs }, { actorId: player.name, round: room.round, phase: room.phase });
    if (validIndividual2) logger.log("decision.individual2_submitted", { playerName: player.name, role: player.role, optionId: validIndividual2, timeRemainingMs }, { actorId: player.name, round: room.round, phase: room.phase });
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

  socket.on(
    "publish:draft-generate",
    async (
      { angle, targetFaction }: { angle: PublicationAngle; targetFaction: PublicationTarget },
      callback?: (res: { ok: boolean; title?: string; body?: string; error?: string }) => void,
    ) => {
      const room = getSocketRoom(socket);
      if (!room) {
        callback?.({ ok: false, error: "Not in a room" });
        return;
      }

      const player = room.players[socket.id];
      if (!player || !player.role || !player.faction) {
        callback?.({ ok: false, error: "Player context unavailable" });
        return;
      }

      if (!canWriteSubstack(player.role)) {
        callback?.({ ok: false, error: "This role cannot publish to Substack" });
        return;
      }

      if (!VALID_PUBLICATION_ANGLES.includes(angle) || !VALID_PUBLICATION_TARGETS.includes(targetFaction)) {
        callback?.({ ok: false, error: "Invalid draft parameters" });
        return;
      }

      if (hasPublishedThisRound(room, player.role, room.round)) {
        callback?.({ ok: false, error: "Already published this round" });
        return;
      }

      const cached = getCachedPublicationDraft(room, player.role);
      if (cached) {
        callback?.({ ok: true, title: cached.title, body: cached.body });
        return;
      }

      try {
        const draft = await generatePublicationDraft({
          room,
          role: player.role,
          faction: player.faction,
          angle,
          targetFaction,
        });
        room.generatedPublicationDrafts ??= {};
        room.generatedPublicationDrafts[player.role] = draft;
        getLoggerForRoom(room.code).log(
          "publish.draft_generated",
          { playerName: player.name, role: player.role, angle, targetFaction },
          { actorId: player.name, round: room.round, phase: room.phase },
        );
        callback?.({ ok: true, title: draft.title, body: draft.body });
      } catch (error) {
        console.error(`[publish:draft-generate] failed for ${room.code}/${player.role}:`, error);
        callback?.({ ok: false, error: "Draft generation failed" });
      }
    },
  );

  socket.on(
    "publish:submit",
    ({ type, title, content, source, angle, targetFaction }: { type: PublicationType; title: string; content: string; source: string; angle?: PublicationAngle; targetFaction?: PublicationTarget }) => {
      const room = getSocketRoom(socket);
      if (!room) return;

      const player = room.players[socket.id];
      if (!player || !player.role || !player.faction) return;

      if (!canWriteSubstack(player.role)) return;
      if (hasPublishedThisRound(room, player.role, room.round)) return;

      // Validate angle/target if provided
      if (angle !== undefined && !VALID_PUBLICATION_ANGLES.includes(angle)) return;
      if (targetFaction !== undefined && !VALID_PUBLICATION_TARGETS.includes(targetFaction)) return;

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
      applyDeltaMap(room.state, effects);

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
}
