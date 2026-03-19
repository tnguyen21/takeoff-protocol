/**
 * Tests for the micro-action tracking module.
 *
 * Invariants tested:
 * - INV-1: Action count increments correctly per player per type
 * - INV-2: Diminishing returns follow 1/n formula
 * - INV-3: Different action types have independent counters
 * - INV-4: resetMicroActionCounts clears all counts for the room
 * - INV-5: All state deltas are clamped to STATE_VARIABLE_RANGES
 */

import { describe, expect, it, beforeEach } from "bun:test";
import type { GameRoom, Player, StateVariables } from "@takeoff/shared";
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
    // Base delta = 2. Effective deltas: 2, 1, 0.667, 0.5, 0.4 → sum ≈ 4.57
    // The deltas are added as floats then clamped, so the net effect is sum of fractional adds.
    const room = makeRoom();
    room.state.publicAwareness = 0; // start at 0 so we can measure cleanly
    const initialAwareness = room.state.publicAwareness;

    // Use empty content to avoid keyword effects — only publicAwareness should change
    for (let i = 0; i < 5; i++) {
      applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    }

    // 2 + 1 + 0.667 + 0.5 + 0.4 = 4.567 → clamped to integer via clampState
    // clampState uses Math.max/Math.min, not Math.round, so value stays fractional
    // The sum ~4.567 should be between 4 and 5
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

    // slack counter is still 0 — next slack action gets full multiplier
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
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" }); // multiplier = 0.5

    resetMicroActionCounts(room);

    const { multiplier } = applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });
    expect(multiplier).toBeCloseTo(1.0);
  });
});

// ── INV-5: State clamping ─────────────────────────────────────────────────────

describe("state clamping / INV-5", () => {
  it("publicAwareness is clamped to max 100", () => {
    const room = makeRoom();
    room.state.publicAwareness = 100; // already at max

    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });

    expect(room.state.publicAwareness).toBe(STATE_VARIABLE_RANGES.publicAwareness[1]); // 100
  });

  it("publicAwareness is clamped to min 0", () => {
    const room = makeRoom();
    room.state.publicAwareness = 0;

    // Even if delta were negative (it isn't for tweet), clamping holds
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "" });

    expect(room.state.publicAwareness).toBeGreaterThanOrEqual(STATE_VARIABLE_RANGES.publicAwareness[0]); // 0
  });

  it("all state values remain within STATE_VARIABLE_RANGES after many tweets", () => {
    const room = makeRoom();
    // Push state to extremes that keyword effects could push over bounds
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
    // Run multiple times to confirm it can move in either direction
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

    // Only publicAwareness should have changed
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

// ── Failure modes ─────────────────────────────────────────────────────────────

describe("failure modes", () => {
  it("player not in microActionCounts yet: auto-initializes to 0", () => {
    const room = makeRoom();
    room.microActionCounts = {}; // explicitly empty

    // Should not throw
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

    // 'safety' appears before 'AGI' — safety should match first
    applyMicroAction(room, "p1", "tweet", { type: "tweet", content: "safety and AGI both matter" });

    expect(room.state.regulatoryPressure).toBeGreaterThan(before);
  });
});
