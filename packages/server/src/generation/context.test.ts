/**
 * Tests for generation context builder.
 *
 * Invariants tested:
 * - INV-1: Context includes state, history, publications, firedThresholds
 * - INV-2: Context excludes player DM content (no room.messages data)
 * - INV-3: Context players array has faction/role/name but no socket IDs
 * - INV-4: initializeStoryBible returns a bible with all 4 factions and 5 round arcs
 * - INV-5: summarizeOlderRounds compresses old events correctly
 */

import { describe, it, expect } from "bun:test";
import type { GameRoom, GameMessage, Player, Publication, RoundHistory } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import {
  buildGenerationContext,
  initializeStoryBible,

  summarizeOlderRounds,
  extractPlayerSlackMessages,
} from "./context.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    code: "TEST",
    phase: "resolution",
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
    messages: [],
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "socket-abc",
    name: "Alice",
    faction: "openbrain",
    role: "ob_ceo",
    isLeader: true,
    connected: true,
    ...overrides,
  };
}

function makeHistory(round: number, overrides: Partial<RoundHistory> = {}): RoundHistory {
  return {
    round,
    decisions: {},
    teamDecisions: {},
    stateBefore: { ...INITIAL_STATE },
    stateAfter: { ...INITIAL_STATE },
    ...overrides,
  };
}

function makePublication(overrides: Partial<Publication> = {}): Publication {
  return {
    id: "pub-1",
    type: "article",
    title: "AI Race Heats Up",
    content: "Sources inside OpenBrain say...",
    source: "The Verge",
    publishedBy: "ext_journalist",
    publishedAt: 1000,
    round: 1,
    ...overrides,
  };
}

function dmMessage(from: string, to: string): GameMessage {
  return {
    id: `dm-${from}-${to}`,
    from,
    fromName: "Alice",
    to,
    faction: "openbrain",
    content: "SECRET PLAN: let's leak the memo",
    timestamp: 1000,
    isTeamChat: false,
  };
}

function teamChatMessage(overrides: Partial<GameMessage> = {}): GameMessage {
  return {
    id: "tc-1",
    from: "player-1",
    fromName: "Alice",
    to: null,
    faction: "openbrain",
    content: "Let's check the safety eval results",
    timestamp: 2000,
    isTeamChat: true,
    channel: "#research",
    ...overrides,
  };
}

// ── INV-1: Context includes required fields ────────────────────────────────────

describe("buildGenerationContext — INV-1: includes required fields", () => {
  it("includes currentState from room", () => {
    const room = makeRoom({ state: { ...INITIAL_STATE, obCapability: 99 } });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.currentState.obCapability).toBe(99);
  });

  it("includes history", () => {
    const history = [makeHistory(1)];
    const room = makeRoom({ history });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.history).toHaveLength(1);
    expect(ctx.history[0].round).toBe(1);
  });

  it("includes publications array", () => {
    const pub = makePublication();
    const room = makeRoom({ publications: [pub] });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.publications).toHaveLength(1);
    expect(ctx.publications[0].id).toBe("pub-1");
  });

  it("publications is empty array when room has no publications", () => {
    const room = makeRoom({ publications: [] });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.publications).toEqual([]);
    expect(Array.isArray(ctx.publications)).toBe(true);
  });

  it("includes firedThresholds as array", () => {
    const room = makeRoom({ firedThresholds: new Set(["china_weight_theft", "auto_leak"]) });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.firedThresholds).toContain("china_weight_theft");
    expect(ctx.firedThresholds).toContain("auto_leak");
    expect(Array.isArray(ctx.firedThresholds)).toBe(true);
  });

  it("firedThresholds is empty array when room has none", () => {
    const room = makeRoom();
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.firedThresholds).toEqual([]);
  });

  it("includes targetRound and roundArc", () => {
    const room = makeRoom();
    const ctx = buildGenerationContext(room, 3);
    expect(ctx.targetRound).toBe(3);
    expect(ctx.roundArc.round).toBe(3);
    expect(ctx.roundArc.title).toBe("The Intelligence Explosion");
  });
});

// ── INV-2: Context excludes player DM content ─────────────────────────────────

describe("buildGenerationContext — INV-2: excludes player DM content", () => {
  it("context does not contain a messages field", () => {
    const room = makeRoom({
      messages: [dmMessage("player1", "player2"), dmMessage("player2", "player3")],
    });
    const ctx = buildGenerationContext(room, 2);
    expect((ctx as unknown as Record<string, unknown>).messages).toBeUndefined();
  });

  it("storyBible does not reference DM content", () => {
    const room = makeRoom({
      messages: [dmMessage("player1", "player2")],
    });
    const ctx = buildGenerationContext(room, 2);
    const bibleStr = JSON.stringify(ctx.storyBible);
    expect(bibleStr).not.toContain("SECRET PLAN");
    expect(bibleStr).not.toContain("let's leak the memo");
  });

  it("history entries do not include message content", () => {
    const room = makeRoom({
      history: [makeHistory(1)],
      messages: [dmMessage("player1", "player2")],
    });
    const ctx = buildGenerationContext(room, 2);
    const historyStr = JSON.stringify(ctx.history);
    expect(historyStr).not.toContain("SECRET PLAN");
  });
});

// ── INV-3: Players array strips socket IDs ────────────────────────────────────

describe("buildGenerationContext — INV-3: players have faction/role/name, no socket IDs", () => {
  it("includes faction, role, name for each assigned player", () => {
    const room = makeRoom({
      players: {
        "socket-abc123": makePlayer({ name: "Alice", faction: "openbrain", role: "ob_ceo" }),
        "socket-def456": makePlayer({ name: "Bob", faction: "prometheus", role: "prom_ceo" }),
      },
    });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.players).toHaveLength(2);

    const alice = ctx.players.find((p) => p.name === "Alice");
    expect(alice?.faction).toBe("openbrain");
    expect(alice?.role).toBe("ob_ceo");

    const bob = ctx.players.find((p) => p.name === "Bob");
    expect(bob?.faction).toBe("prometheus");
    expect(bob?.role).toBe("prom_ceo");
  });

  it("does not include socket ID as a field on player objects", () => {
    const room = makeRoom({
      players: {
        "socket-abc123": makePlayer({ name: "Alice" }),
      },
    });
    const ctx = buildGenerationContext(room, 2);
    const player = ctx.players[0];
    expect((player as Record<string, unknown>).id).toBeUndefined();
    expect(JSON.stringify(player)).not.toContain("socket-abc123");
  });

  it("excludes players who have no faction or role assigned", () => {
    const room = makeRoom({
      players: {
        "socket-abc123": makePlayer({ faction: null, role: null }),
        "socket-def456": makePlayer({ faction: "openbrain", role: "ob_ceo" }),
      },
    });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.players).toHaveLength(1);
    expect(ctx.players[0].faction).toBe("openbrain");
  });

  it("returns empty players array when room has no assigned players", () => {
    const room = makeRoom({ players: {} });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.players).toEqual([]);
  });
});

// ── INV-4: initializeStoryBible structure ────────────────────────────────────

describe("initializeStoryBible — INV-4: all 4 factions and 5 round arcs", () => {
  it("returns a bible with all 4 factions", () => {
    const room = makeRoom();
    const bible = initializeStoryBible(room);
    expect(bible.factions).toHaveLength(4);
    const factionIds = bible.factions.map((f) => f.faction);
    expect(factionIds).toContain("openbrain");
    expect(factionIds).toContain("prometheus");
    expect(factionIds).toContain("china");
    expect(factionIds).toContain("external");
  });

  it("each faction entry has identity, tension, and characters", () => {
    const room = makeRoom();
    const bible = initializeStoryBible(room);
    for (const f of bible.factions) {
      expect(typeof f.identity).toBe("string");
      expect(f.identity.length).toBeGreaterThan(0);
      expect(typeof f.tension).toBe("string");
      expect(f.tension.length).toBeGreaterThan(0);
      expect(Array.isArray(f.characters)).toBe(true);
      expect(f.characters.length).toBeGreaterThan(0);
    }
  });

  it("returns a bible with all 5 round arcs", () => {
    const room = makeRoom();
    const bible = initializeStoryBible(room);
    expect(bible.roundArcs).toHaveLength(5);
    const rounds = bible.roundArcs.map((a) => a.round);
    for (let r = 1; r <= 5; r++) {
      expect(rounds).toContain(r);
    }
  });

  it("round arcs have required narrative fields", () => {
    const room = makeRoom();
    const bible = initializeStoryBible(room);
    for (const arc of bible.roundArcs) {
      expect(typeof arc.title).toBe("string");
      expect(arc.title.length).toBeGreaterThan(0);
      expect(typeof arc.narrativeBeat).toBe("string");
      expect(Array.isArray(arc.keyTensions)).toBe(true);
      expect(arc.keyTensions.length).toBeGreaterThan(0);
    }
  });

  it("voice guides include all 4 factions", () => {
    const room = makeRoom();
    const bible = initializeStoryBible(room);
    expect(typeof bible.voiceGuides.openbrain).toBe("string");
    expect(typeof bible.voiceGuides.prometheus).toBe("string");
    expect(typeof bible.voiceGuides.china).toBe("string");
    expect(typeof bible.voiceGuides.external).toBe("string");
  });

  it("starts with empty events, playerActions, activeThreads", () => {
    const room = makeRoom();
    const bible = initializeStoryBible(room);
    expect(bible.events).toEqual([]);
    expect(bible.playerActions).toEqual([]);
    expect(bible.activeThreads).toEqual([]);
  });

  it("starts with toneShift 'tension building'", () => {
    const room = makeRoom();
    const bible = initializeStoryBible(room);
    expect(bible.toneShift).toBe("tension building");
  });
});

// ── Critical path: build context for round 2 after round 1 ───────────────────

describe("critical path: round 2 context after round 1", () => {
  it("builds a complete context for round 2 with round 1 history", () => {
    const room = makeRoom({
      round: 1,
      players: {
        "socket-alice": makePlayer({ name: "Alice", faction: "openbrain", role: "ob_ceo" }),
        "socket-bob": makePlayer({ name: "Bob", faction: "prometheus", role: "prom_ceo" }),
      },
      history: [
        makeHistory(1, {
          teamDecisions: { openbrain: "ob_r1_team_capabilities" },
          decisions: { "socket-alice": "ob_ceo_fundraise" },
        }),
      ],
      publications: [makePublication()],
      firedThresholds: new Set<string>(),
    });

    const ctx = buildGenerationContext(room, 2);

    expect(ctx.targetRound).toBe(2);
    expect(ctx.roundArc.title).toBe("The Superhuman Coder");
    expect(ctx.history).toHaveLength(1);
    expect(ctx.players).toHaveLength(2);
    expect(ctx.publications).toHaveLength(1);
    expect(ctx.firedThresholds).toEqual([]);
    expect(ctx.storyBible!.factions).toHaveLength(4);
    expect(ctx.storyBible!.roundArcs).toHaveLength(5);
  });
});

// ── summarizeOlderRounds ──────────────────────────────────────────────────────

describe("summarizeOlderRounds", () => {
  it("returns the same bible unchanged when currentRound <= 2", () => {
    const bible = initializeStoryBible(makeRoom());
    bible.events.push({
      round: 1,
      phase: "decision",
      summary: "Round 1 event",
      stateImpact: "none",
      narrativeWeight: "major",
    });

    const result = summarizeOlderRounds(bible, 2);
    expect(result).toBe(bible); // same object, no copy needed
  });

  it("compresses events from rounds before cutoff into summaries", () => {
    const bible = initializeStoryBible(makeRoom());
    // Add events for round 1 and 2 (both older than cutoff for currentRound=4)
    for (let r = 1; r <= 2; r++) {
      bible.events.push({
        round: r,
        phase: "decision",
        summary: `Round ${r} major decision`,
        stateImpact: "obCapability +5",
        narrativeWeight: "major",
      });
    }
    // Add a recent event
    bible.events.push({
      round: 3,
      phase: "decision",
      summary: "Round 3 event — keep full",
      stateImpact: "alignmentConfidence -10",
      narrativeWeight: "major",
    });

    const result = summarizeOlderRounds(bible, 4); // cutoff = 2

    // Round 3 event should be kept in full
    expect(result.events).toContainEqual(
      expect.objectContaining({ summary: "Round 3 event — keep full" }),
    );

    // Round 1 should be summarized
    const r1Summary = result.events.find((e) => e.summary.includes("[Round 1 summary]"));
    expect(r1Summary).toBeDefined();
  });

  it("does not mutate the original bible", () => {
    const bible = initializeStoryBible(makeRoom());
    for (let r = 1; r <= 2; r++) {
      bible.events.push({
        round: r,
        phase: "decision",
        summary: `Round ${r} event`,
        stateImpact: "none",
        narrativeWeight: "major",
      });
    }
    bible.events.push({
      round: 3,
      phase: "decision",
      summary: "Round 3 event",
      stateImpact: "none",
      narrativeWeight: "major",
    });

    const originalEventCount = bible.events.length;
    summarizeOlderRounds(bible, 4);

    // Original bible should be unchanged
    expect(bible.events.length).toBe(originalEventCount);
  });
});

// ── Failure modes ─────────────────────────────────────────────────────────────

describe("failure modes", () => {
  it("room with no history (round 1) does not crash buildGenerationContext", () => {
    const room = makeRoom({ round: 1, history: [] });
    expect(() => buildGenerationContext(room, 1)).not.toThrow();
    const ctx = buildGenerationContext(room, 1);
    expect(ctx.history).toEqual([]);
  });

  it("room with no publications returns empty array not undefined", () => {
    const room = makeRoom({ publications: [] });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.publications).toEqual([]);
    expect(ctx.publications).not.toBeUndefined();
  });

  it("room with undefined publications returns empty array", () => {
    // Simulate a room object without the publications field
    const room = makeRoom() as GameRoom;
    (room as unknown as Record<string, unknown>).publications = undefined;
    const ctx = buildGenerationContext(room, 2);
    expect(Array.isArray(ctx.publications)).toBe(true);
  });

  it("buildGenerationContext with no storyBible initializes one automatically", () => {
    const room = makeRoom();
    expect(room.storyBible).toBeUndefined();
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.storyBible).toBeDefined();
    expect(ctx.storyBible!.factions).toHaveLength(4);
  });
});

// ── extractPlayerSlackMessages ────────────────────────────────────────────────

describe("extractPlayerSlackMessages", () => {
  it("returns empty object when messages array is empty", () => {
    const result = extractPlayerSlackMessages([]);
    expect(result).toEqual({});
  });

  it("excludes DM messages (isTeamChat === false)", () => {
    const result = extractPlayerSlackMessages([dmMessage("p1", "p2")]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("excludes NPC team chat messages (isNpc === true)", () => {
    const npcMsg = teamChatMessage({ isNpc: true });
    const result = extractPlayerSlackMessages([npcMsg]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("includes player team chat messages grouped by faction and channel", () => {
    const msg = teamChatMessage({ faction: "openbrain", channel: "#research" });
    const result = extractPlayerSlackMessages([msg]);
    expect(result.openbrain).toBeDefined();
    expect(result.openbrain!["#research"]).toHaveLength(1);
    expect(result.openbrain!["#research"]![0]!.from).toBe("Alice");
    expect(result.openbrain!["#research"]![0]!.content).toBe("Let's check the safety eval results");
  });

  it("defaults channel to '#general' when channel is missing", () => {
    const msg = teamChatMessage({ channel: undefined });
    const result = extractPlayerSlackMessages([msg]);
    expect(result.openbrain!["#general"]).toHaveLength(1);
  });

  it("groups messages from different channels separately", () => {
    const msgs = [
      teamChatMessage({ id: "tc-1", channel: "#research", content: "research msg" }),
      teamChatMessage({ id: "tc-2", channel: "#general", content: "general msg" }),
    ];
    const result = extractPlayerSlackMessages(msgs);
    expect(result.openbrain!["#research"]).toHaveLength(1);
    expect(result.openbrain!["#general"]).toHaveLength(1);
  });

  it("groups messages from different factions separately", () => {
    const msgs = [
      teamChatMessage({ id: "tc-1", faction: "openbrain", channel: "#general" }),
      teamChatMessage({ id: "tc-2", faction: "prometheus", channel: "#general" }),
    ];
    const result = extractPlayerSlackMessages(msgs);
    expect(result.openbrain!["#general"]).toHaveLength(1);
    expect(result.prometheus!["#general"]).toHaveLength(1);
  });

  it("caps messages per channel at 20 (keeps the last 20)", () => {
    const msgs: GameMessage[] = [];
    for (let i = 0; i < 25; i++) {
      msgs.push(teamChatMessage({ id: `tc-${i}`, content: `message ${i}`, channel: "#general" }));
    }
    const result = extractPlayerSlackMessages(msgs);
    const channelMsgs = result.openbrain!["#general"]!;
    expect(channelMsgs).toHaveLength(20);
    // Should keep the last 20 (messages 5-24)
    expect(channelMsgs[0]!.content).toBe("message 5");
    expect(channelMsgs[19]!.content).toBe("message 24");
  });

  it("buildGenerationContext includes playerSlackMessages in returned context", () => {
    const room = makeRoom({
      messages: [teamChatMessage({ faction: "openbrain", channel: "#research" })],
    });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.playerSlackMessages).toBeDefined();
    expect(ctx.playerSlackMessages.openbrain!["#research"]).toHaveLength(1);
  });

  it("buildGenerationContext returns empty playerSlackMessages when room has no team chat", () => {
    const room = makeRoom({
      messages: [dmMessage("p1", "p2")],
    });
    const ctx = buildGenerationContext(room, 2);
    expect(ctx.playerSlackMessages).toEqual({});
  });
});
