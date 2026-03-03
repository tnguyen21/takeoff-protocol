/**
 * Tests for getPlayerMessages (reconnect replay filter).
 *
 * Invariants tested:
 * - INV-1: NPC messages (isNpc: true, to: playerId) are included in the replay for the target player
 * - INV-2: NPC messages are excluded for players who are not the target
 * - INV-3: Team chats are included for matching faction only
 * - INV-4: DMs are included for both sender and recipient, excluded for third parties
 */

import { describe, it, expect } from "bun:test";
import type { GameMessage, GameRoom } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { createRoom, getPlayerMessages } from "./rooms.js";

function makeRoom(messages: GameMessage[]): GameRoom {
  return {
    code: "TEST",
    phase: "intel",
    round: 1,
    timer: { endsAt: 0 },
    players: {},
    gmId: null,
    state: { ...INITIAL_STATE },
    decisions: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages,
  };
}

function npcMessage(overrides: Partial<GameMessage> = {}): GameMessage {
  return {
    id: "npc-trigger1-player1",
    from: "__npc_anon__",
    fromName: "Anonymous Source",
    to: "player1",
    faction: "openbrain",
    content: "Watch what you're doing.",
    timestamp: 1000,
    isTeamChat: false,
    isNpc: true,
    ...overrides,
  };
}

function teamChatMessage(overrides: Partial<GameMessage> = {}): GameMessage {
  return {
    id: "msg-team-1",
    from: "player1",
    fromName: "Alice",
    to: null,
    faction: "openbrain",
    content: "Let's coordinate.",
    timestamp: 2000,
    isTeamChat: true,
    ...overrides,
  };
}

function dmMessage(overrides: Partial<GameMessage> = {}): GameMessage {
  return {
    id: "msg-dm-1",
    from: "player1",
    fromName: "Alice",
    to: "player2",
    faction: "openbrain",
    content: "Private message.",
    timestamp: 3000,
    isTeamChat: false,
    ...overrides,
  };
}

// ── INV-1: NPC messages reach the target player on reconnect ──────────────────

describe("getPlayerMessages — NPC message replay (INV-1)", () => {
  it("includes NPC DM (isNpc: true) for the target player", () => {
    const msg = npcMessage({ to: "player1" });
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "openbrain", "player1");

    expect(result).toContain(msg);
  });

  it("NPC message passes through regardless of the isNpc flag being absent", () => {
    // Ensure the filter does not require isNpc — regular DMs also pass through
    const { isNpc: _, ...msgWithoutFlag } = npcMessage({ to: "player1" });
    const msg = msgWithoutFlag as GameMessage;
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "openbrain", "player1");

    expect(result).toContain(msg);
  });
});

// ── INV-2: NPC messages are private — excluded for other players ──────────────

describe("getPlayerMessages — NPC message privacy (INV-2)", () => {
  it("excludes NPC DM for a player who is NOT the target", () => {
    const msg = npcMessage({ to: "player1" });
    const room = makeRoom([msg]);

    // player2 is same faction but a different socket ID
    const result = getPlayerMessages(room, "openbrain", "player2");

    expect(result).not.toContain(msg);
  });

  it("excludes NPC DM for a player of a different faction", () => {
    const msg = npcMessage({ to: "player1", faction: "openbrain" });
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "prometheus", "player2");

    expect(result).not.toContain(msg);
  });
});

// ── INV-3: Team chats are faction-scoped ─────────────────────────────────────

describe("getPlayerMessages — team chat scoping (INV-3)", () => {
  it("includes team chat for matching faction", () => {
    const msg = teamChatMessage({ faction: "openbrain" });
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "openbrain", "player1");

    expect(result).toContain(msg);
  });

  it("excludes team chat for a different faction", () => {
    const msg = teamChatMessage({ faction: "openbrain" });
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "prometheus", "player1");

    expect(result).not.toContain(msg);
  });
});

// ── INV-4: DMs are included for sender and recipient only ─────────────────────

describe("getPlayerMessages — DM inclusion (INV-4)", () => {
  it("includes DM for the recipient", () => {
    const msg = dmMessage({ from: "player1", to: "player2" });
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "openbrain", "player2");

    expect(result).toContain(msg);
  });

  it("includes DM for the sender", () => {
    const msg = dmMessage({ from: "player1", to: "player2" });
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "openbrain", "player1");

    expect(result).toContain(msg);
  });

  it("excludes DM for a third-party player", () => {
    const msg = dmMessage({ from: "player1", to: "player2" });
    const room = makeRoom([msg]);

    const result = getPlayerMessages(room, "openbrain", "player3");

    expect(result).not.toContain(msg);
  });
});

// ── Mixed message types ────────────────────────────────────────────────────────

describe("getPlayerMessages — mixed messages", () => {
  it("returns only messages relevant to the player (NPC + team chat, not other DMs)", () => {
    const npcMsg = npcMessage({ to: "player1" });
    const teamMsg = teamChatMessage({ faction: "openbrain" });
    const otherDm = dmMessage({ from: "player2", to: "player3" }); // not for player1

    const room = makeRoom([npcMsg, teamMsg, otherDm]);

    const result = getPlayerMessages(room, "openbrain", "player1");

    expect(result).toContain(npcMsg);
    expect(result).toContain(teamMsg);
    expect(result).not.toContain(otherDm);
  });

  it("returns empty array when no messages exist", () => {
    const room = makeRoom([]);

    const result = getPlayerMessages(room, "openbrain", "player1");

    expect(result).toEqual([]);
  });
});

// ── INV-1: createRoom initializes generation fields to empty defaults ──────────

describe("createRoom — generation field initialization (INV-1)", () => {
  it("initializes generatedRounds to an empty object", () => {
    const room = createRoom("gm-socket-1");

    expect(room.generatedRounds).toEqual({});
  });

  it("initializes generationStatus to an empty object", () => {
    const room = createRoom("gm-socket-2");

    expect(room.generationStatus).toEqual({});
  });

  it("leaves storyBible undefined until generation starts", () => {
    const room = createRoom("gm-socket-3");

    expect(room.storyBible).toBeUndefined();
  });
});
