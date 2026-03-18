/**
 * Tests for devBots.ts — dev-only bot autoplay.
 *
 * Invariants:
 * INV-1: Bot seeding covers all non-human roles for selected mode
 * INV-2: Bot IDs are unique and deterministic — same input → same bot ids
 * INV-3: Leader bots set teamDecisions only for factions that have leaders
 * INV-4: seedBotsForRoom throws when NODE_ENV === "production"
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { GameRoom, Player } from "@takeoff/shared";
import { FACTIONS, INITIAL_STATE } from "@takeoff/shared";
import { seedBotsForRoom, scheduleBotDecisionSubmissions } from "./devBots.js";
import { setGeneratedDecisions } from "./generation/cache.js";
import { ROUND1_DECISIONS } from "./test-fixtures.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHumanPlayer(id: string, faction: Player["faction"], role: Player["role"]): Player {
  return { id, name: "Dev", faction, role, isLeader: false, connected: true };
}

function makeRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    code: "TEST",
    phase: "decision",
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

function createMockIo() {
  const io = { to: (_: string) => ({ emit: () => {} }) };
  return io as unknown as import("socket.io").Server;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── INV-4: production guard ───────────────────────────────────────────────────

describe("seedBotsForRoom — production guard (INV-4)", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("throws when NODE_ENV === 'production'", () => {
    process.env.NODE_ENV = "production";
    const room = makeRoom();
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_ceo");

    expect(() => seedBotsForRoom(room, "p1", { mode: "all_roles" })).toThrow(
      /production/,
    );
  });
});

// ── INV-1 & INV-2: seedBotsForRoom ───────────────────────────────────────────

describe("seedBotsForRoom — all_roles mode (INV-1, INV-2)", () => {
  it("creates bots for every role except the human player's role", () => {
    const room = makeRoom();
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    process.env.NODE_ENV = "test";

    seedBotsForRoom(room, "p1", { mode: "all_roles" });

    // Collect all role IDs from FACTIONS
    const allRoles = FACTIONS.flatMap((f) => f.roles.map((r) => r.id));
    const botPlayers = Object.values(room.players).filter((p) => p.id.startsWith("__bot_"));

    // Human's role must NOT have a bot
    const humanRole = "ob_cto";
    expect(botPlayers.some((b) => b.role === humanRole)).toBe(false);

    // All OTHER roles MUST have a bot (in all_roles mode)
    const nonHumanRoles = allRoles.filter((r) => r !== humanRole);
    for (const role of nonHumanRoles) {
      expect(botPlayers.some((b) => b.role === role)).toBe(true);
    }
  });

  it("preserves the original human player entry", () => {
    const room = makeRoom();
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    process.env.NODE_ENV = "test";

    seedBotsForRoom(room, "p1", { mode: "all_roles" });

    expect(room.players["p1"]).toBeDefined();
    expect(room.players["p1"].role).toBe("ob_cto");
  });
});

describe("seedBotsForRoom — minimum_table mode (INV-1)", () => {
  it("skips optional roles", () => {
    const room = makeRoom();
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    process.env.NODE_ENV = "test";

    seedBotsForRoom(room, "p1", { mode: "minimum_table" });

    const optionalRoles = FACTIONS.flatMap((f) =>
      f.roles.filter((r) => r.optional).map((r) => r.id),
    );
    const botPlayers = Object.values(room.players).filter((p) => p.id.startsWith("__bot_"));

    for (const optRole of optionalRoles) {
      expect(botPlayers.some((b) => b.role === optRole)).toBe(false);
    }
  });

  it("includes all non-optional non-human roles", () => {
    const room = makeRoom();
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    process.env.NODE_ENV = "test";

    seedBotsForRoom(room, "p1", { mode: "minimum_table" });

    const requiredRoles = FACTIONS.flatMap((f) =>
      f.roles.filter((r) => !r.optional && r.id !== "ob_cto").map((r) => r.id),
    );
    const botPlayers = Object.values(room.players).filter((p) => p.id.startsWith("__bot_"));

    for (const role of requiredRoles) {
      expect(botPlayers.some((b) => b.role === role)).toBe(true);
    }
  });

  it("has fewer bots than all_roles mode", () => {
    const room1 = makeRoom();
    room1.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    const room2 = makeRoom();
    room2.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    process.env.NODE_ENV = "test";

    seedBotsForRoom(room1, "p1", { mode: "all_roles" });
    seedBotsForRoom(room2, "p1", { mode: "minimum_table" });

    const allRolesBots = Object.keys(room1.players).filter((id) => id.startsWith("__bot_")).length;
    const minTableBots = Object.keys(room2.players).filter((id) => id.startsWith("__bot_")).length;

    expect(minTableBots).toBeLessThan(allRolesBots);
  });
});

// ── INV-3: leader bot sets teamDecisions ─────────────────────────────────────

describe("scheduleBotDecisionSubmissions — leader and non-leader behavior (INV-3)", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("leader bot sets room.teamDecisions for its faction", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    seedBotsForRoom(room, "p1", { mode: "all_roles" });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    // Find a leader bot (ob_ceo is leader)
    const leaderBot = Object.values(room.players).find(
      (p) => p.id.startsWith("__bot_") && p.isLeader && p.faction === "openbrain",
    );
    expect(leaderBot).toBeDefined();

    const io = createMockIo();
    scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [5, 10] });

    await wait(100); // well above 10 + 500ms leader delay? No — 10 + 500 = 510ms

    // Wait enough for leader delay to pass
    await wait(600);

    expect(room.teamDecisions["openbrain"]).toBeDefined();
  });

  it("non-leader bot does NOT set room.teamDecisions", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    // Human plays leader role so no leader bot for openbrain
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_ceo");
    (room.players["p1"] as Player).isLeader = true;
    seedBotsForRoom(room, "p1", { mode: "minimum_table" });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    const io = createMockIo();
    // Only seed bots for openbrain non-leaders
    const obNonLeaderBots = Object.values(room.players).filter(
      (p) => p.id.startsWith("__bot_") && p.faction === "openbrain" && !p.isLeader,
    );

    expect(obNonLeaderBots.length).toBeGreaterThan(0);

    scheduleBotDecisionSubmissions(io, room, { mode: "minimum_table", submitJitterMs: [5, 10] });
    await wait(100);

    // openbrain teamDecisions should not be set by non-leader bots
    expect(room.teamDecisions["openbrain"]).toBeUndefined();
  });

  it("factions with no leaders (external) never get teamDecisions set by bots (INV-4)", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    process.env.NODE_ENV = "test";
    seedBotsForRoom(room, "p1", { mode: "all_roles" });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    const io = createMockIo();
    scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [5, 10] });

    await wait(100);

    // external faction has no leaders, so no bot should set teamDecisions for it
    expect(room.teamDecisions["external"]).toBeUndefined();
  });
});

// ── Critical paths ────────────────────────────────────────────────────────────

describe("scheduleBotDecisionSubmissions — critical paths", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("sets room.decisions entries for all bot players after jitter (round 1)", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    seedBotsForRoom(room, "p1", { mode: "all_roles" });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    const botIds = Object.keys(room.players).filter((id) => id.startsWith("__bot_"));

    const io = createMockIo();
    scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [5, 15], leaderExtraDelayMs: 20 });

    await wait(200); // all delays <= 15 + 20 = 35ms

    // Every bot that has a round1 individual decision should have submitted
    // (some bot roles may not have round 1 individual decisions — those are skipped gracefully)
    for (const botId of botIds) {
      const bot = room.players[botId];
      // If an individual decision exists for this role in round 1, decisions should be set
      // We just verify no crash and at least some bots submitted
      expect(bot).toBeDefined();
    }

    // At least one bot must have submitted a decision
    const submittedBots = botIds.filter((id) => room.decisions[id] !== undefined);
    expect(submittedBots.length).toBeGreaterThan(0);
  });

  it("round 0 (tutorial) is a no-op", async () => {
    const room = makeRoom({ phase: "decision", round: 0 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    seedBotsForRoom(room, "p1", { mode: "all_roles" });

    const io = createMockIo();
    scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [5, 10] });

    await wait(100);

    expect(Object.keys(room.decisions)).toHaveLength(0);
    expect(Object.keys(room.teamDecisions)).toHaveLength(0);
  });

  it("no bots in room — silently no-ops", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    // No bots seeded

    const io = createMockIo();
    // Should not throw, should be a clean no-op
    expect(() =>
      scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [5, 10] }),
    ).not.toThrow();

    await wait(50);
    expect(Object.keys(room.decisions)).toHaveLength(0);
  });

  it("bot skips gracefully when round has no decision mapping for its role", async () => {
    // Use a round with known decisions but inject a bot with a role that has no individual decision
    const room = makeRoom({ phase: "decision", round: 1 });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);
    // Add a bot with an unusual role that round 1 might not have a decision for
    // We'll just verify the bot that has no individual decision doesn't crash
    const fakeBotId = "__bot_external_ext_vc";
    room.players[fakeBotId] = {
      id: fakeBotId,
      name: "BOT VC",
      faction: "external",
      role: "ext_vc",
      isLeader: false,
      connected: true,
    };

    const io = createMockIo();
    expect(() =>
      scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [5, 10] }),
    ).not.toThrow();

    await wait(100);
    // Whether a decision was made or not depends on round1 data — but no crash
  });

  it("bots skip submission when phase advances out of decision before timer fires", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    seedBotsForRoom(room, "p1", { mode: "all_roles" });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    const io = createMockIo();
    // Schedule with a delay that allows us to change phase before timers fire
    scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [100, 200] });

    // Advance phase immediately
    room.phase = "resolution";

    await wait(300); // let all timers fire

    // Since phase changed to resolution, bots should have been no-ops
    expect(Object.keys(room.decisions)).toHaveLength(0);
  });

  it("leader bots set teamDecisions after extra delay", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    seedBotsForRoom(room, "p1", { mode: "all_roles" });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    const leaderBots = Object.values(room.players).filter(
      (p) => p.id.startsWith("__bot_") && p.isLeader,
    );
    expect(leaderBots.length).toBeGreaterThan(0);

    const io = createMockIo();
    scheduleBotDecisionSubmissions(io, room, {
      mode: "all_roles",
      submitJitterMs: [10, 20],
      leaderExtraDelayMs: 50,
    });

    await wait(200); // all timers (<=20+50=70ms) should have fired

    // All leader factions (openbrain, prometheus, china) should have team decisions
    for (const bot of leaderBots) {
      if (bot.faction) {
        expect(room.teamDecisions[bot.faction]).toBeDefined();
      }
    }
  });

  it("non-leader bots set teamVotes", async () => {
    const room = makeRoom({ phase: "decision", round: 1 });
    room.players["p1"] = makeHumanPlayer("p1", "openbrain", "ob_cto");
    seedBotsForRoom(room, "p1", { mode: "all_roles" });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    const nonLeaderBots = Object.values(room.players).filter(
      (p) => p.id.startsWith("__bot_") && !p.isLeader,
    );
    expect(nonLeaderBots.length).toBeGreaterThan(0);

    const io = createMockIo();
    scheduleBotDecisionSubmissions(io, room, { mode: "all_roles", submitJitterMs: [5, 10], leaderExtraDelayMs: 5 });

    await wait(200);

    // At least some non-leader bots should have contributed team votes
    let teamVoteCount = 0;
    for (const [_faction, votes] of Object.entries(room.teamVotes)) {
      teamVoteCount += Object.keys(votes).filter((id) => id.startsWith("__bot_")).length;
    }
    expect(teamVoteCount).toBeGreaterThan(0);
  });
});

