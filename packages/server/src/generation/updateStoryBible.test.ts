/**
 * Tests for updateStoryBible().
 *
 * Invariants tested:
 * - INV-1: events.length increases by at least the number of team decisions made
 * - INV-2: Every event has valid round, phase, summary, stateImpact, narrativeWeight
 * - INV-3: Team decisions → 'major'; individual decisions → 'minor'
 * - INV-4: toneShift is updated based on current state values
 */

import { describe, it, expect } from "bun:test";
import type { GameRoom, Player, Publication } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { updateStoryBible, initializeStoryBible } from "./context.js";
import { setGeneratedDecisions } from "./cache.js";
import { ROUND1_DECISIONS } from "../test-fixtures.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  const room: GameRoom = {
    code: "TEST",
    phase: "resolution",
    round: 1,
    timer: { endsAt: 0 },
    players: {},
    gmId: null,
    state: { ...INITIAL_STATE },
    decisions: {},
    decisions2: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
    ...overrides,
  };
  // Seed round 1 decisions so updateStoryBible can resolve option IDs
  setGeneratedDecisions(room, 1, ROUND1_DECISIONS);
  return room;
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

function makePublication(overrides: Partial<Publication> = {}): Publication {
  return {
    id: "pub-1",
    type: "article",
    title: "AI Safety Breakthrough",
    content: "New safety milestone reached...",
    source: "The Verge",
    publishedBy: "ext_journalist",
    publishedAt: 1000,
    round: 1,
    ...overrides,
  };
}

// ── INV-1: events.length grows by at least team decision count ────────────────

describe("updateStoryBible — INV-1: events accumulate", () => {
  it("adds at least one event per team decision", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
    });
    const before = 0;
    updateStoryBible(room);
    expect(room.storyBible!.events.length).toBeGreaterThanOrEqual(before + 1);
  });

  it("adds events for all 4 team decisions in round 1", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: {
        openbrain: "ob_team_allincap",
        prometheus: "prom_team_accelerate",
        china: "china_team_max_cdz",
        external: "ext_team_share",
      },
    });
    updateStoryBible(room);
    expect(room.storyBible!.events.length).toBeGreaterThanOrEqual(4);
  });

  it("calling twice for two rounds accumulates events (does not replace)", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
    });
    updateStoryBible(room);
    const afterRound1 = room.storyBible!.events.length;
    expect(afterRound1).toBeGreaterThan(0);

    // Simulate round 2 decisions
    room.round = 2;
    setGeneratedDecisions(room, 2, { ...ROUND1_DECISIONS, round: 2 });
    room.teamDecisions = { prometheus: "prom_team_accelerate" };
    room.decisions = {};
    updateStoryBible(room);
    // Events should have grown, not been replaced
    expect(room.storyBible!.events.length).toBeGreaterThan(afterRound1);
  });
});

// ── INV-2: Every event has all required fields ────────────────────────────────

describe("updateStoryBible — INV-2: event structure validity", () => {
  it("every event has round, phase, summary, stateImpact, narrativeWeight", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
      players: {
        "socket-alice": makePlayer({ role: "ob_ceo", faction: "openbrain" }),
      },
      decisions: { "socket-alice": "ob_ceo_fundraise" },
    });
    updateStoryBible(room);
    for (const event of room.storyBible!.events) {
      expect(typeof event.round).toBe("number");
      expect(typeof event.phase).toBe("string");
      expect(event.phase.length).toBeGreaterThan(0);
      expect(typeof event.summary).toBe("string");
      expect(event.summary.length).toBeGreaterThan(0);
      expect(typeof event.stateImpact).toBe("string");
      expect(event.narrativeWeight === "major" || event.narrativeWeight === "minor").toBe(true);
    }
  });

  it("team decision events record the correct round number", () => {
    const room = makeRoom({
      round: 3,
      teamDecisions: { openbrain: "ob_r3_team_push" },
    });
    updateStoryBible(room);
    // If no match for round 3 openbrain, we just ensure no crash and round is set
    for (const event of room.storyBible!.events) {
      expect(event.round).toBe(3);
    }
  });
});

// ── INV-3: Team → major, Individual → minor ──────────────────────────────────

describe("updateStoryBible — INV-3: narrative weight by decision type", () => {
  it("team decisions produce major-weight events", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
    });
    updateStoryBible(room);
    const teamEvents = room.storyBible!.events.filter((e) => e.narrativeWeight === "major");
    expect(teamEvents.length).toBeGreaterThanOrEqual(1);
    expect(teamEvents[0]!.summary).toContain("openbrain");
  });

  it("individual decisions produce minor-weight events", () => {
    const room = makeRoom({
      round: 1,
      players: {
        "socket-alice": makePlayer({ role: "ob_ceo", faction: "openbrain" }),
      },
      decisions: { "socket-alice": "ob_ceo_fundraise" },
    });
    updateStoryBible(room);
    const indivEvents = room.storyBible!.events.filter((e) => e.narrativeWeight === "minor");
    expect(indivEvents.length).toBeGreaterThanOrEqual(1);
    expect(indivEvents[0]!.summary).toContain("ob_ceo");
    expect(indivEvents[0]!.summary).toContain("openbrain");
  });

  it("critical path: 4 team + 1 individual decision produces 5 events", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: {
        openbrain: "ob_team_allincap",
        prometheus: "prom_team_accelerate",
        china: "china_team_max_cdz",
        external: "ext_team_share",
      },
      players: {
        "socket-alice": makePlayer({ role: "ob_ceo", faction: "openbrain" }),
      },
      decisions: { "socket-alice": "ob_ceo_fundraise" },
    });
    updateStoryBible(room);
    const events = room.storyBible!.events;
    expect(events.length).toBe(5);
    const majorEvents = events.filter((e) => e.narrativeWeight === "major");
    const minorEvents = events.filter((e) => e.narrativeWeight === "minor");
    expect(majorEvents.length).toBe(4);
    expect(minorEvents.length).toBe(1);
  });
});

// ── INV-4: toneShift updated based on state ───────────────────────────────────

describe("updateStoryBible — INV-4: toneShift reflects current state", () => {
  it("sets toneShift to 'crisis' when publicSentiment < -30", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
      state: { ...INITIAL_STATE, publicSentiment: -50 },
    });
    updateStoryBible(room);
    expect(room.storyBible!.toneShift).toBe("crisis");
  });

  it("sets toneShift to 'tense' when taiwanTension > 70 (and publicSentiment ok)", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
      state: { ...INITIAL_STATE, publicSentiment: 0, taiwanTension: 80 },
    });
    updateStoryBible(room);
    expect(room.storyBible!.toneShift).toBe("tense");
  });

  it("sets toneShift to 'cautiously optimistic' when alignmentConfidence > 70", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
      state: { ...INITIAL_STATE, publicSentiment: 0, taiwanTension: 30, alignmentConfidence: 80 },
    });
    updateStoryBible(room);
    expect(room.storyBible!.toneShift).toBe("cautiously optimistic");
  });

  it("sets toneShift to 'uncertain' as the default", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
      state: { ...INITIAL_STATE, publicSentiment: 0, taiwanTension: 30, alignmentConfidence: 50 },
    });
    updateStoryBible(room);
    expect(room.storyBible!.toneShift).toBe("uncertain");
  });

  it("crisis takes priority over tense when both conditions met", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
      state: { ...INITIAL_STATE, publicSentiment: -50, taiwanTension: 80 },
    });
    updateStoryBible(room);
    expect(room.storyBible!.toneShift).toBe("crisis");
  });
});

// ── Publications ──────────────────────────────────────────────────────────────

describe("updateStoryBible — publications", () => {
  it("records publications from the current round as minor events", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "ob_team_allincap" },
      publications: [makePublication({ round: 1 })],
    });
    updateStoryBible(room);
    const pubEvents = room.storyBible!.events.filter((e) => e.phase === "publication");
    expect(pubEvents.length).toBe(1);
    expect(pubEvents[0]!.narrativeWeight).toBe("minor");
    expect(pubEvents[0]!.summary).toContain("AI Safety Breakthrough");
  });

  it("does not record publications from previous rounds", () => {
    const room = makeRoom({
      round: 2,
      teamDecisions: { openbrain: "ob_r2_team_push" },
      publications: [
        makePublication({ round: 1, id: "pub-old" }),
        makePublication({ round: 2, id: "pub-current", title: "Current Round News" }),
      ],
    });
    updateStoryBible(room);
    const pubEvents = room.storyBible!.events.filter((e) => e.phase === "publication");
    // Only round 2 publication should appear
    expect(pubEvents.every((e) => e.round === 2)).toBe(true);
  });
});

// ── Failure modes ─────────────────────────────────────────────────────────────

describe("updateStoryBible — failure modes", () => {
  it("does not crash when room has no decisions (round 0)", () => {
    const room = makeRoom({ round: 0, decisions: {}, teamDecisions: {} });
    expect(() => updateStoryBible(room)).not.toThrow();
    // Should be a no-op — no events added
    expect(room.storyBible!.events.length).toBe(0);
  });

  it("does not crash when room has empty decisions", () => {
    const room = makeRoom({ round: 1, decisions: {}, teamDecisions: {} });
    expect(() => updateStoryBible(room)).not.toThrow();
    expect(room.storyBible!.events.length).toBe(0);
  });

  it("initializes storyBible when it is undefined", () => {
    const room = makeRoom({ round: 1, teamDecisions: { openbrain: "ob_team_allincap" } });
    expect(room.storyBible).toBeUndefined();
    updateStoryBible(room);
    expect(room.storyBible).toBeDefined();
    expect(Array.isArray(room.storyBible!.events)).toBe(true);
  });

  it("works correctly when storyBible already exists (preserves existing events)", () => {
    const room = makeRoom({ round: 1 });
    room.storyBible = initializeStoryBible(room);
    room.storyBible.events.push({
      round: 0,
      phase: "decision",
      summary: "pre-existing event",
      stateImpact: "",
      narrativeWeight: "major",
    });
    room.teamDecisions = { openbrain: "ob_team_allincap" };
    updateStoryBible(room);
    // Pre-existing event preserved
    expect(room.storyBible.events.some((e) => e.summary === "pre-existing event")).toBe(true);
  });

  it("skips team decision when optionId does not match any known option", () => {
    const room = makeRoom({
      round: 1,
      teamDecisions: { openbrain: "nonexistent_option_id" },
    });
    expect(() => updateStoryBible(room)).not.toThrow();
    // No events should be added for the unrecognized option
    expect(room.storyBible!.events.length).toBe(0);
  });

  it("skips individual decision when optionId does not match any known option", () => {
    const room = makeRoom({
      round: 1,
      players: { "socket-alice": makePlayer() },
      decisions: { "socket-alice": "nonexistent_individual_option" },
    });
    expect(() => updateStoryBible(room)).not.toThrow();
    expect(room.storyBible!.events.length).toBe(0);
  });

  it("handles room with undefined publications without crashing", () => {
    const room = makeRoom({ round: 1, teamDecisions: { openbrain: "ob_team_allincap" } });
    (room as unknown as Record<string, unknown>).publications = undefined;
    expect(() => updateStoryBible(room)).not.toThrow();
  });
});
