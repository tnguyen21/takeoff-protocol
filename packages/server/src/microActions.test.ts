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

import { describe, expect, it } from "bun:test";
import type { Faction, GameRoom, Player, StateVariables } from "@takeoff/shared";
import { INITIAL_STATE, STATE_VARIABLE_RANGES } from "@takeoff/shared";
import { applyMicroAction, getActionCount, resetMicroActionCounts } from "./microActions.js";

// ── Test helpers ──────────────────────────────────────────────────────────────

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
    decisions2: {},
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

// ── Signal DM: INV-1: Same-faction DMs produce no effect ─────────────────────

describe("Signal DM INV-1: same-faction DMs produce no effect", () => {
  it("OB player DMs another OB player: no state change", () => {
    const room = makeRoom();
    const stateBefore = { ...room.state };
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "openbrain",
      senderRole: "ob_ceo",
      recipientRole: "ob_cto",
    });
    expect(room.state).toEqual(stateBefore);
  });

  it("same-faction DM: count is NOT consumed (no DR increment)", () => {
    const room = makeRoom();
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "prometheus",
      recipientFaction: "prometheus",
      senderRole: "prom_ceo",
      recipientRole: "prom_cto",
    });
    expect(getActionCount(room, "p1", "signal_dm")).toBe(0);
  });

  it("same-faction DM: multiplier returned is 0", () => {
    const room = makeRoom();
    const { multiplier } = applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "china",
      recipientFaction: "china",
      senderRole: "cdz_director",
      recipientRole: "cdz_engineer",
    });
    expect(multiplier).toBe(0);
  });
});

// ── Signal DM: INV-2: Cross-faction DMs increase intlCooperation ──────────────

describe("Signal DM INV-2: cross-faction DMs increase intlCooperation", () => {
  it("OB player DMs Prom player: intlCooperation += 0.75 (base 1.5 * 1 * 0.5)", () => {
    const room = makeRoom();
    const before = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "prometheus",
      senderRole: "ob_ceo",
      recipientRole: "prom_ceo",
    });
    expect(getState(room, "intlCooperation") - before).toBeCloseTo(0.75, 5);
  });

  it("External player DMs China player: intlCooperation increases", () => {
    const room = makeRoom();
    const before = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "china",
      senderRole: "ext_diplomat",
      recipientRole: "cdz_director",
    });
    expect(getState(room, "intlCooperation")).toBeGreaterThan(before);
  });
});

// ── Signal DM: INV-3: Journalist involvement adds whistleblowerPressure ────────

describe("Signal DM INV-3: journalist involvement adds whistleblowerPressure", () => {
  it("journalist sends DM cross-faction: intlCooperation +0.75 AND whistleblowerPressure +0.75", () => {
    const room = makeRoom();
    const coopBefore = getState(room, "intlCooperation");
    const whistleBefore = getState(room, "whistleblowerPressure");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "openbrain",
      senderRole: "ext_journalist",
      recipientRole: "ob_ceo",
    });
    expect(getState(room, "intlCooperation") - coopBefore).toBeCloseTo(0.75, 5);
    expect(getState(room, "whistleblowerPressure") - whistleBefore).toBeCloseTo(0.75, 5);
  });

  it("journalist receives DM cross-faction: whistleblowerPressure also increases", () => {
    const room = makeRoom();
    const whistleBefore = getState(room, "whistleblowerPressure");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "external",
      senderRole: "ob_safety",
      recipientRole: "ext_journalist",
    });
    expect(getState(room, "whistleblowerPressure")).toBeGreaterThan(whistleBefore);
  });

  it("non-journalist cross-faction DM: no whistleblowerPressure change", () => {
    const room = makeRoom();
    const whistleBefore = getState(room, "whistleblowerPressure");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "prometheus",
      senderRole: "ob_ceo",
      recipientRole: "prom_ceo",
    });
    expect(getState(room, "whistleblowerPressure")).toBe(whistleBefore);
  });
});

// ── Signal DM: INV-4: Diminishing returns shared across all DMs ───────────────

describe("Signal DM INV-4: diminishing returns shared across all DMs", () => {
  it("shared counter: 2nd cross-faction DM gives half the first delta", () => {
    const room = makeRoom();

    const start = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "prometheus",
      senderRole: "ob_ceo",
      recipientRole: "prom_ceo",
    });
    const delta1 = getState(room, "intlCooperation") - start;

    const mid = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "china",
      senderRole: "ob_ceo",
      recipientRole: "cdz_director",
    });
    const delta2 = getState(room, "intlCooperation") - mid;

    expect(delta2).toBeCloseTo(delta1 / 2, 5);
  });

  it("4th cross-faction DM: intlCooperation delta ≈ 1.5/4/2 = 0.1875", () => {
    const room = makeRoom();
    for (let i = 0; i < 3; i++) {
      applyMicroAction(room, "p1", "signal_dm", {
        type: "signal_dm",
        senderFaction: "openbrain",
        recipientFaction: "prometheus",
        senderRole: "ob_ceo",
        recipientRole: "prom_ceo",
      });
    }
    const before = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "china",
      senderRole: "ob_ceo",
      recipientRole: "cdz_director",
    });
    const delta = getState(room, "intlCooperation") - before;
    expect(delta).toBeCloseTo(1.5 / 4 / 2, 5);
  });
});

// ── Signal DM: INV-5: All deltas clamped ──────────────────────────────────────

describe("Signal DM INV-5: all deltas clamped", () => {
  it("intlCooperation at max: does not exceed max", () => {
    const room = makeRoom();
    room.state.intlCooperation = STATE_VARIABLE_RANGES.intlCooperation[1];
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "prometheus",
      senderRole: "ob_ceo",
      recipientRole: "prom_ceo",
    });
    expect(getState(room, "intlCooperation")).toBe(STATE_VARIABLE_RANGES.intlCooperation[1]);
  });

  it("whistleblowerPressure at max: does not exceed max after journalist DM", () => {
    const room = makeRoom();
    room.state.whistleblowerPressure = STATE_VARIABLE_RANGES.whistleblowerPressure[1];
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "openbrain",
      senderRole: "ext_journalist",
      recipientRole: "ob_ceo",
    });
    expect(getState(room, "whistleblowerPressure")).toBe(STATE_VARIABLE_RANGES.whistleblowerPressure[1]);
  });
});

// ── Signal DM: INV-6: Role-pair specific effects ──────────────────────────────

describe("Signal DM INV-6: role-pair specific effects", () => {
  // NSA ↔ OB: securityLevelOB
  it("NSA → OB: securityLevelOB += 0.75 AND intlCooperation += 0.75 (first action)", () => {
    const room = makeRoom();
    const secBefore = getState(room, "securityLevelOB");
    const coopBefore = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "openbrain",
      senderRole: "ext_nsa",
      recipientRole: "ob_ceo",
    });
    expect(getState(room, "securityLevelOB") - secBefore).toBeCloseTo(0.75, 5);
    expect(getState(room, "intlCooperation") - coopBefore).toBeCloseTo(0.75, 5);
  });

  it("OB → NSA (symmetric): securityLevelOB increases AND intlCooperation increases", () => {
    const room = makeRoom();
    const secBefore = getState(room, "securityLevelOB");
    const coopBefore = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "external",
      senderRole: "ob_cto",
      recipientRole: "ext_nsa",
    });
    expect(getState(room, "securityLevelOB")).toBeGreaterThan(secBefore);
    expect(getState(room, "intlCooperation")).toBeGreaterThan(coopBefore);
  });

  it("NSA → OB: does NOT affect securityLevelProm", () => {
    const room = makeRoom();
    const promSecBefore = getState(room, "securityLevelProm");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "openbrain",
      senderRole: "ext_nsa",
      recipientRole: "ob_security",
    });
    expect(getState(room, "securityLevelProm")).toBe(promSecBefore);
  });

  // NSA ↔ Prom: securityLevelProm
  it("NSA → Prom: securityLevelProm += 0.75 AND intlCooperation += 0.75 (first action)", () => {
    const room = makeRoom();
    const secBefore = getState(room, "securityLevelProm");
    const coopBefore = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "prometheus",
      senderRole: "ext_nsa",
      recipientRole: "prom_ceo",
    });
    expect(getState(room, "securityLevelProm") - secBefore).toBeCloseTo(0.75, 5);
    expect(getState(room, "intlCooperation") - coopBefore).toBeCloseTo(0.75, 5);
  });

  it("Prom → NSA (symmetric): securityLevelProm increases", () => {
    const room = makeRoom();
    const secBefore = getState(room, "securityLevelProm");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "prometheus",
      recipientFaction: "external",
      senderRole: "prom_scientist",
      recipientRole: "ext_nsa",
    });
    expect(getState(room, "securityLevelProm")).toBeGreaterThan(secBefore);
  });

  it("NSA → Prom: does NOT affect securityLevelOB", () => {
    const room = makeRoom();
    const obSecBefore = getState(room, "securityLevelOB");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "prometheus",
      senderRole: "ext_nsa",
      recipientRole: "prom_policy",
    });
    expect(getState(room, "securityLevelOB")).toBe(obSecBefore);
  });

  // VC ↔ OB: obBoardConfidence
  it("VC → OB: obBoardConfidence += 0.75 AND intlCooperation += 0.75 (first action)", () => {
    const room = makeRoom();
    const confBefore = getState(room, "obBoardConfidence");
    const coopBefore = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "openbrain",
      senderRole: "ext_vc",
      recipientRole: "ob_ceo",
    });
    expect(getState(room, "obBoardConfidence") - confBefore).toBeCloseTo(0.75, 5);
    expect(getState(room, "intlCooperation") - coopBefore).toBeCloseTo(0.75, 5);
  });

  it("OB → VC (symmetric): obBoardConfidence increases", () => {
    const room = makeRoom();
    const confBefore = getState(room, "obBoardConfidence");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "external",
      senderRole: "ob_cto",
      recipientRole: "ext_vc",
    });
    expect(getState(room, "obBoardConfidence")).toBeGreaterThan(confBefore);
  });

  it("VC → OB: does NOT affect promBoardConfidence", () => {
    const room = makeRoom();
    const promConfBefore = getState(room, "promBoardConfidence");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "openbrain",
      senderRole: "ext_vc",
      recipientRole: "ob_safety",
    });
    expect(getState(room, "promBoardConfidence")).toBe(promConfBefore);
  });

  // VC ↔ Prom: promBoardConfidence
  it("VC → Prom: promBoardConfidence += 0.75 AND intlCooperation += 0.75 (first action)", () => {
    const room = makeRoom();
    const confBefore = getState(room, "promBoardConfidence");
    const coopBefore = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "prometheus",
      senderRole: "ext_vc",
      recipientRole: "prom_ceo",
    });
    expect(getState(room, "promBoardConfidence") - confBefore).toBeCloseTo(0.75, 5);
    expect(getState(room, "intlCooperation") - coopBefore).toBeCloseTo(0.75, 5);
  });

  it("Prom → VC (symmetric): promBoardConfidence increases", () => {
    const room = makeRoom();
    const confBefore = getState(room, "promBoardConfidence");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "prometheus",
      recipientFaction: "external",
      senderRole: "prom_scientist",
      recipientRole: "ext_vc",
    });
    expect(getState(room, "promBoardConfidence")).toBeGreaterThan(confBefore);
  });

  // Fallback: NSA → China (no ob_* or prom_*): only intlCooperation
  it("NSA → China: only intlCooperation increases, no security level change", () => {
    const room = makeRoom();
    const obSecBefore = getState(room, "securityLevelOB");
    const promSecBefore = getState(room, "securityLevelProm");
    const coopBefore = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "china",
      senderRole: "ext_nsa",
      recipientRole: "china_director",
    });
    expect(getState(room, "securityLevelOB")).toBe(obSecBefore);
    expect(getState(room, "securityLevelProm")).toBe(promSecBefore);
    expect(getState(room, "intlCooperation")).toBeGreaterThan(coopBefore);
  });

  // Fallback: VC → China (no ob_* or prom_*): only intlCooperation
  it("VC → China: only intlCooperation increases, no board confidence change", () => {
    const room = makeRoom();
    const obConfBefore = getState(room, "obBoardConfidence");
    const promConfBefore = getState(room, "promBoardConfidence");
    const coopBefore = getState(room, "intlCooperation");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "china",
      senderRole: "ext_vc",
      recipientRole: "china_scientist",
    });
    expect(getState(room, "obBoardConfidence")).toBe(obConfBefore);
    expect(getState(room, "promBoardConfidence")).toBe(promConfBefore);
    expect(getState(room, "intlCooperation")).toBeGreaterThan(coopBefore);
  });

  // Role-specific effects don't bleed into unrelated DMs
  it("OB → Prom (no NSA/VC): no securityLevel or board confidence changes", () => {
    const room = makeRoom();
    const obSecBefore = getState(room, "securityLevelOB");
    const promSecBefore = getState(room, "securityLevelProm");
    const obConfBefore = getState(room, "obBoardConfidence");
    const promConfBefore = getState(room, "promBoardConfidence");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "prometheus",
      senderRole: "ob_ceo",
      recipientRole: "prom_ceo",
    });
    expect(getState(room, "securityLevelOB")).toBe(obSecBefore);
    expect(getState(room, "securityLevelProm")).toBe(promSecBefore);
    expect(getState(room, "obBoardConfidence")).toBe(obConfBefore);
    expect(getState(room, "promBoardConfidence")).toBe(promConfBefore);
  });

  // Journalist still takes priority and returns before role-pair dispatch
  it("journalist DM: no securityLevel or board confidence changes even with NSA-like roles", () => {
    const room = makeRoom();
    const obSecBefore = getState(room, "securityLevelOB");
    applyMicroAction(room, "p1", "signal_dm", {
      type: "signal_dm",
      senderFaction: "external",
      recipientFaction: "openbrain",
      senderRole: "ext_journalist",
      recipientRole: "ob_security",
    });
    // journalist path returns early: no security level effect
    expect(getState(room, "securityLevelOB")).toBe(obSecBefore);
    expect(getState(room, "whistleblowerPressure")).toBeGreaterThan(5); // whistleblower fires
  });
});

// ── Signal DM: Failure modes ──────────────────────────────────────────────────

describe("Signal DM failure modes", () => {
  it("room with no microActionCounts: auto-initialises and does not crash", () => {
    const room = makeRoom();
    room.microActionCounts = undefined;
    expect(() => {
      applyMicroAction(room, "p1", "signal_dm", {
        type: "signal_dm",
        senderFaction: "openbrain",
        recipientFaction: "prometheus",
        senderRole: "ob_ceo",
        recipientRole: "prom_ceo",
      });
    }).not.toThrow();
    expect(room.microActionCounts).toBeDefined();
  });

  it("different players have independent DR counters for signal_dm", () => {
    const room = makeRoom();
    for (let i = 0; i < 10; i++) {
      applyMicroAction(room, "p1", "signal_dm", {
        type: "signal_dm",
        senderFaction: "openbrain",
        recipientFaction: "prometheus",
        senderRole: "ob_ceo",
        recipientRole: "prom_ceo",
      });
    }
    const before = getState(room, "intlCooperation");
    applyMicroAction(room, "p2", "signal_dm", {
      type: "signal_dm",
      senderFaction: "openbrain",
      recipientFaction: "prometheus",
      senderRole: "ob_ceo",
      recipientRole: "prom_ceo",
    });
    const delta = getState(room, "intlCooperation") - before;
    expect(delta).toBeCloseTo(0.75, 5); // full first-action delta for p2
  });
});
