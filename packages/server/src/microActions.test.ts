/**
 * Tests for the micro-action tracking module.
 *
 * Tweet invariants (INV-1 through INV-5):
 * - INV-1: Action count increments correctly per player per type
 * - INV-2: Diminishing returns follow 1/n formula
 * - INV-3: Different action types have independent counters
 * - INV-4: resetMicroActionCounts clears all counts for the room
 * - INV-5: All state deltas are clamped to STATE_VARIABLE_RANGES
 *
 * Slack invariants:
 * - INV-1: Channel-specific diminishing returns are independent across channels
 * - INV-2: Faction determines which state variable is affected
 * - INV-3: Channels with no mapping for a faction produce no effect
 * - INV-4: All deltas are clamped within STATE_VARIABLE_RANGES
 */

import { describe, expect, it, beforeEach } from "bun:test";
import type { Faction, GameRoom, Player, StateVariables } from "@takeoff/shared";
import { INITIAL_STATE, STATE_VARIABLE_RANGES } from "@takeoff/shared";
import { applyMicroAction, getActionCount, resetMicroActionCounts } from "./microActions.js";

// ── Test helpers ──────────────────────────────────────────────────────────────

function makePlayer(id: string): Player {
  return {
    id,
    name: "Test",
    faction: "openbrain" as never,
    role: "ob_cto" as never,
    isLeader: false,
    connected: true,
  };
}

function makeRoom(players: Player[] = []): GameRoom {
  return {
    code: "ABCD",
    phase: "intel",
    round: 1,
    timer: { endsAt: Date.now() + 300_000 },
    players: Object.fromEntries(players.map((p) => [p.id, p])),
    gmId: null,
    state: { ...INITIAL_STATE, intlCooperation: 30 }, // avoid coalition_fracture threshold
    decisions: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
    microActionCounts: {},
  };
}

function getState(room: GameRoom, key: keyof StateVariables): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (room.state as any)[key] as number;
}

// ── INV-1: Action count increments ───────────────────────────────────────────

describe("getActionCount / INV-1", () => {
  it("returns 0 for a player with no prior actions", () => {
    const room = makeRoom();
    expect(getActionCount(room, "player1", "tweet")).toBe(0);
  });

  it("increments after each applyMicroAction call", () => {
    const room = makeRoom();
    expect(getActionCount(room, "p1", "tweet")).toBe(0);

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "hello" });
    expect(getActionCount(room, "p1", "tweet")).toBe(1);

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "hello again" });
    expect(getActionCount(room, "p1", "tweet")).toBe(2);
  });

  it("counts are per-player — different players have independent counts", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "foo" });
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "bar" });

    expect(getActionCount(room, "p1", "tweet")).toBe(2);
    expect(getActionCount(room, "p2", "tweet")).toBe(0);
  });
});

// ── INV-2: Diminishing returns ────────────────────────────────────────────────

describe("applyMicroAction diminishing returns / INV-2", () => {
  it("1st action returns multiplier 1.0 (full baseDelta)", () => {
    const room = makeRoom();
    const { multiplier } = applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    expect(multiplier).toBeCloseTo(1.0);
  });

  it("2nd action returns multiplier 0.5", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    const { multiplier } = applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    expect(multiplier).toBeCloseTo(0.5);
  });

  it("3rd action returns multiplier ~0.333", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    const { multiplier } = applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    expect(multiplier).toBeCloseTo(1 / 3);
  });

  it("cumulative publicAwareness over 5 tweets ≈ floor(2+1+0.67+0.5+0.4) = 4 or 5 (integer rounding)", () => {
    const room = makeRoom();
    room.state.publicAwareness = 0;
    const initialAwareness = room.state.publicAwareness;

    for (let i = 0; i < 5; i++) {
      applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    }

    const gained = room.state.publicAwareness - initialAwareness;
    expect(gained).toBeGreaterThanOrEqual(4);
    expect(gained).toBeLessThanOrEqual(5);
  });
});

// ── INV-3: Independent counters per action type ───────────────────────────────

describe("action type independence / INV-3", () => {
  it("tweeting 3 times does not affect slack counter", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "foo" });
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "bar" });
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "baz" });

    const slackCount = getActionCount(room, "p1", "slack");
    expect(slackCount).toBe(0);
  });

  it("tweet and slack counters increment independently", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "x" });
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "y" });

    expect(getActionCount(room, "p1", "tweet")).toBe(2);
    expect(getActionCount(room, "p1", "slack")).toBe(0);
  });
});

// ── INV-4: resetMicroActionCounts ────────────────────────────────────────────

describe("resetMicroActionCounts / INV-4", () => {
  it("clears all counts for all players in the room", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "x" });
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "y" });
    applyMicroAction(room, "p2", "tweet", { type: "tweet", content: "z" });

    resetMicroActionCounts(room);

    expect(getActionCount(room, "p1", "tweet")).toBe(0);
    expect(getActionCount(room, "p2", "tweet")).toBe(0);
    expect(room.microActionCounts).toEqual({});
  });

  it("after reset, next action gets full base delta again (multiplier = 1.0)", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });

    resetMicroActionCounts(room);

    const { multiplier } = applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    expect(multiplier).toBeCloseTo(1.0);
  });
});

// ── INV-5: State clamping ─────────────────────────────────────────────────────

describe("state clamping / INV-5", () => {
  it("publicAwareness is clamped to max 100", () => {
    const room = makeRoom();
    room.state.publicAwareness = 100;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });

    expect(room.state.publicAwareness).toBe(STATE_VARIABLE_RANGES.publicAwareness[1]);
  });

  it("publicAwareness is clamped to min 0", () => {
    const room = makeRoom();
    room.state.publicAwareness = 0;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });

    expect(room.state.publicAwareness).toBeGreaterThanOrEqual(STATE_VARIABLE_RANGES.publicAwareness[0]);
  });

  it("all state values remain within STATE_VARIABLE_RANGES after many tweets", () => {
    const room = makeRoom();
    room.state.regulatoryPressure = 99;
    room.state.economicDisruption = 99;
    room.state.marketIndex = 199;
    room.state.publicSentiment = 99;
    room.state.publicAwareness = 99;

    for (let i = 0; i < 10; i++) {
      applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "safety alignment risk AGI funding" });
    }

    for (const key of Object.keys(STATE_VARIABLE_RANGES) as (keyof StateVariables)[]) {
      const [min, max] = STATE_VARIABLE_RANGES[key];
      const val = room.state[key] as number;
      expect(val).toBeGreaterThanOrEqual(min);
      expect(val).toBeLessThanOrEqual(max);
    }
  });
});

// ── Tweet keyword effects ─────────────────────────────────────────────────────

describe("tweet keyword effects", () => {
  it("safety keyword: regulatoryPressure increases", () => {
    const room = makeRoom();
    const before = room.state.regulatoryPressure;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "AI safety is critical" });

    expect(room.state.regulatoryPressure).toBeGreaterThan(before);
  });

  it("safety keyword: publicSentiment moves (either direction)", () => {
    let moved = false;
    for (let i = 0; i < 20; i++) {
      const room = makeRoom();
      const before = room.state.publicSentiment;
      applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "alignment matters" });
      if (room.state.publicSentiment !== before) moved = true;
    }
    expect(moved).toBe(true);
  });

  it("capability keyword: economicDisruption increases", () => {
    const room = makeRoom();
    const before = room.state.economicDisruption;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "AGI breakthrough imminent" });

    expect(room.state.economicDisruption).toBeGreaterThan(before);
  });

  it("economy keyword: economicDisruption increases", () => {
    const room = makeRoom();
    const before = room.state.economicDisruption;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "massive layoffs from AI disruption" });

    expect(room.state.economicDisruption).toBeGreaterThan(before);
  });

  it("economy keyword: marketIndex can move in either direction (coinflip)", () => {
    let wentUp = false;
    let wentDown = false;
    for (let i = 0; i < 40; i++) {
      const room = makeRoom();
      const before = room.state.marketIndex;
      applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "funding valuation billion" });
      const after = room.state.marketIndex;
      if (after > before) wentUp = true;
      if (after < before) wentDown = true;
      if (wentUp && wentDown) break;
    }
    expect(wentUp).toBe(true);
    expect(wentDown).toBe(true);
  });

  it("no keyword match: only publicAwareness changes", () => {
    const room = makeRoom();
    const stateBefore = { ...room.state };

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "just a random tweet about nothing" });

    for (const key of Object.keys(stateBefore) as (keyof StateVariables)[]) {
      if (key === "publicAwareness") {
        expect(room.state[key]).toBeGreaterThan(stateBefore[key] as number);
      } else {
        expect(room.state[key]).toBe(stateBefore[key]);
      }
    }
  });

  it("empty tweet content: still applies publicAwareness effect", () => {
    const room = makeRoom();
    const before = room.state.publicAwareness;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });

    expect(room.state.publicAwareness).toBeGreaterThan(before);
  });

  it("case-insensitive keyword matching", () => {
    const room = makeRoom();
    const before = room.state.regulatoryPressure;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "AI SAFETY concerns" });

    expect(room.state.regulatoryPressure).toBeGreaterThan(before);
  });
});

// ── Tweet failure modes ───────────────────────────────────────────────────────

describe("failure modes", () => {
  it("player not in microActionCounts yet: auto-initializes to 0", () => {
    const room = makeRoom();
    room.microActionCounts = {};

    expect(() => applyMicroAction(room, "brand-new-player", "tweet", { type: "tweet", content: "" })).not.toThrow();
    expect(getActionCount(room, "brand-new-player", "tweet")).toBe(1);
  });

  it("microActionCounts undefined on room: auto-initializes", () => {
    const room = makeRoom();
    room.microActionCounts = undefined;

    expect(() => applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" })).not.toThrow();
    expect(room.microActionCounts).toBeDefined();
    expect(getActionCount(room, "p1", "tweet")).toBe(1);
  });

  it("first keyword in content wins (safety over capability)", () => {
    const room = makeRoom();
    const before = room.state.regulatoryPressure;

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "safety and AGI both matter" });

    expect(room.state.regulatoryPressure).toBeGreaterThan(before);
  });
});

// ── Slack: INV-2: Faction determines which variable is affected ───────────────

describe("Slack INV-2: faction determines affected variable", () => {
  it("OB posting in #general affects obMorale", () => {
    const room = makeRoom();
    const before = getState(room, "obMorale");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    expect(getState(room, "obMorale")).toBeGreaterThan(before);
  });

  it("Prometheus posting in #general affects promMorale, not obMorale", () => {
    const room = makeRoom();
    const obBefore = getState(room, "obMorale");
    const promBefore = getState(room, "promMorale");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "prometheus" });
    expect(getState(room, "promMorale")).toBeGreaterThan(promBefore);
    expect(getState(room, "obMorale")).toBe(obBefore);
  });

  it("China posting in #general affects ccpPatience", () => {
    const room = makeRoom();
    const before = getState(room, "ccpPatience");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "china" });
    expect(getState(room, "ccpPatience")).toBeGreaterThan(before);
  });

  it("External posting in #general affects intlCooperation (at half rate)", () => {
    const room = makeRoom();
    const before = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "external" });
    const after = getState(room, "intlCooperation");
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBeCloseTo(0.5, 5);
  });
});

// ── Slack: INV-1: Channel-specific diminishing returns are independent ─────────

describe("Slack INV-1: channel diminishing returns are independent", () => {
  it("posting in #research does not diminish #alignment effects", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#research", faction: "openbrain" });

    const alignBefore = getState(room, "alignmentConfidence");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#alignment", faction: "openbrain" });
    const alignDelta = getState(room, "alignmentConfidence") - alignBefore;
    expect(alignDelta).toBeCloseTo(0.5, 5);
  });

  it("each channel tracks its own diminishing returns counter", () => {
    const room = makeRoom();
    for (let i = 0; i < 3; i++) {
      applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#research", faction: "openbrain" });
    }
    const generalBefore = getState(room, "obMorale");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    expect(getState(room, "obMorale") - generalBefore).toBeCloseTo(1, 5);
  });
});

// ── Slack: INV-3: No-mapping combinations produce no effect ───────────────────

describe("Slack INV-3: channels with no mapping for a faction produce no effect", () => {
  it("External posting in #random: no effect", () => {
    const room = makeRoom();
    const stateBefore = { ...room.state };
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#random", faction: "external" });
    expect(room.state).toEqual(stateBefore);
  });

  it("China posting in #random: no effect", () => {
    const room = makeRoom();
    const stateBefore = { ...room.state };
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#random", faction: "china" });
    expect(room.state).toEqual(stateBefore);
  });

  it("External posting in #ops: no effect", () => {
    const room = makeRoom();
    const stateBefore = { ...room.state };
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#ops", faction: "external" });
    expect(room.state).toEqual(stateBefore);
  });

  it("Unknown channel: no effect, no crash", () => {
    const room = makeRoom();
    const stateBefore = { ...room.state };
    expect(() => {
      applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#nonexistent", faction: "openbrain" });
    }).not.toThrow();
    expect(room.state).toEqual(stateBefore);
  });
});

// ── Slack: INV-4: Deltas are clamped ─────────────────────────────────────────

describe("Slack INV-4: deltas clamped within range", () => {
  it("obMorale cannot exceed 100", () => {
    const room = makeRoom();
    room.state.obMorale = 100;
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    expect(getState(room, "obMorale")).toBe(100);
  });

  it("obBurnRate cannot go below 0", () => {
    const room = makeRoom();
    room.state.obBurnRate = 0;
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#ops", faction: "openbrain" });
    expect(getState(room, "obBurnRate")).toBe(0);
  });
});

// ── Slack: Critical paths ─────────────────────────────────────────────────────

describe("Slack critical paths", () => {
  it("OB posts 3x in #research: cumulative obCapability delta ≈ 0.92", () => {
    const room = makeRoom();
    const before = getState(room, "obCapability");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#research", faction: "openbrain" });
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#research", faction: "openbrain" });
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#research", faction: "openbrain" });
    const delta = getState(room, "obCapability") - before;
    expect(delta).toBeGreaterThan(0.9);
    expect(delta).toBeLessThan(0.95);
  });

  it("Prom posts in #ops: promBurnRate decreases", () => {
    const room = makeRoom();
    const before = getState(room, "promBurnRate");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#ops", faction: "prometheus" });
    expect(getState(room, "promBurnRate")).toBeLessThan(before);
  });

  it("China posts in #ops: cdzComputeUtilization increases", () => {
    const room = makeRoom();
    const before = getState(room, "cdzComputeUtilization");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#ops", faction: "china" });
    expect(getState(room, "cdzComputeUtilization")).toBeGreaterThan(before);
  });

  it("All factions posting in #alignment all boost alignmentConfidence", () => {
    const room = makeRoom();
    const factions: Faction[] = ["openbrain", "prometheus", "china", "external"];
    const before = getState(room, "alignmentConfidence");
    for (const faction of factions) {
      applyMicroAction(room, faction, "slack", { type: "slack", channel: "#alignment", faction });
    }
    expect(getState(room, "alignmentConfidence")).toBeGreaterThan(before);
  });

  it("Diminishing returns: 2nd post gives half the delta of the 1st", () => {
    const room = makeRoom();

    const start = getState(room, "obMorale");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    const delta1 = getState(room, "obMorale") - start;

    const mid = getState(room, "obMorale");
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    const delta2 = getState(room, "obMorale") - mid;

    expect(delta2).toBeCloseTo(delta1 / 2, 5);
  });

  it("Different players have independent DR counters for the same channel", () => {
    const room = makeRoom();
    for (let i = 0; i < 10; i++) {
      applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    }
    const before = getState(room, "obMorale");
    applyMicroAction(room, "p2", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    const delta = getState(room, "obMorale") - before;
    expect(delta).toBeCloseTo(1, 5);
  });
});

// ── Slack: Failure modes ──────────────────────────────────────────────────────

describe("Slack failure modes", () => {
  it("room with no microActionCounts field: initialises and does not crash", () => {
    const room = makeRoom();
    delete (room as never as { microActionCounts: unknown }).microActionCounts;
    expect(() => {
      applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    }).not.toThrow();
    expect(room.microActionCounts).toBeDefined();
  });

  it("re-using the same socketId across channels initialises per-channel counts correctly", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#general", faction: "openbrain" });
    applyMicroAction(room, "p1", "slack", { type: "slack", channel: "#research", faction: "openbrain" });
    expect(room.microActionCounts!["p1"]["slack:#general"]).toBe(1);
    expect(room.microActionCounts!["p1"]["slack:#research"]).toBe(1);
  });
});
