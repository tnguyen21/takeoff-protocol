/**
 * Tests for generation cache helpers.
 *
 * Invariants tested:
 * - INV-1: Round isolation — data set for round N does not bleed to round N+1
 * - INV-2: Status transition logic (pending→ready/failed; terminal states locked)
 * - INV-3: Empty cache and faction isolation return undefined, not null or throws
 */

import { describe, it, expect } from "bun:test";
import type { AppContent, GameRoom, RoundDecisions } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import {
  getGeneratedBriefing,
  getGeneratedContent,
  getGeneratedDecisions,
  getGenerationStatus,
  setGeneratedBriefing,
  setGeneratedContent,
  setGeneratedDecisions,
  setGenerationStatus,
} from "./cache.js";

function makeRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    code: "TEST",
    phase: "briefing",
    round: 2,
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
}

const BRIEFING_R2 = {
  common: "Round 2 briefing text.",
  factionVariants: {
    openbrain: "OB variant",
    prometheus: "Prom variant",
    china: "China variant",
    external: "Ext variant",
  } as Record<import("@takeoff/shared").Faction, string>,
};

const CONTENT_OB: AppContent[] = [
  { faction: "openbrain", app: "slack", items: [{ id: "item-1", type: "message", round: 2, body: "msg", timestamp: "t1" }] },
];

const DECISIONS_R2: RoundDecisions = {
  round: 2,
  individual: [],
  team: [],
};

// ── INV-3: Empty cache returns undefined ──────────────────────────────────────

describe("empty cache (INV-3)", () => {
  it("all accessors return undefined on a fresh room", () => {
    const room = makeRoom();
    expect(getGeneratedBriefing(room, 2)).toBeUndefined();
    expect(getGeneratedContent(room, 2, "openbrain")).toBeUndefined();
    expect(getGeneratedDecisions(room, 2)).toBeUndefined();
    expect(getGenerationStatus(room, 2)).toBeUndefined();

    // round entry exists but decisions key absent
    const roomWithRound = makeRoom({ generatedRounds: { 2: { briefing: BRIEFING_R2 } } });
    expect(getGeneratedDecisions(roomWithRound, 2)).toBeUndefined();
  });
});

// ── INV-3: Faction isolation ──────────────────────────────────────────────────

describe("faction isolation (INV-3)", () => {
  it("content set for one faction does not bleed to another faction", () => {
    const room = makeRoom();
    setGeneratedContent(room, 2, "openbrain", CONTENT_OB);
    expect(getGeneratedContent(room, 2, "prometheus")).toBeUndefined();
  });
});

// ── INV-1: Round isolation ────────────────────────────────────────────────────

describe("round isolation (INV-1)", () => {
  it("data set for round 2 does not affect round 3", () => {
    const room = makeRoom();
    setGeneratedBriefing(room, 2, BRIEFING_R2);
    setGeneratedContent(room, 2, "openbrain", CONTENT_OB);
    setGeneratedDecisions(room, 2, DECISIONS_R2);
    setGenerationStatus(room, 2, "pending");
    setGenerationStatus(room, 2, "ready");
    expect(getGeneratedBriefing(room, 3)).toBeUndefined();
    expect(getGeneratedContent(room, 3, "openbrain")).toBeUndefined();
    expect(getGeneratedDecisions(room, 3)).toBeUndefined();
    expect(getGenerationStatus(room, 3)).toBeUndefined();
  });
});

// ── INV-2: Status transitions ─────────────────────────────────────────────────

describe("setGenerationStatus — transitions (INV-2)", () => {
  it("pending → ready succeeds", () => {
    const room = makeRoom();
    setGenerationStatus(room, 2, "pending");
    setGenerationStatus(room, 2, "ready");
    expect(getGenerationStatus(room, 2)).toBe("ready");
  });

  it("pending → failed succeeds", () => {
    const room = makeRoom();
    setGenerationStatus(room, 2, "pending");
    setGenerationStatus(room, 2, "failed");
    expect(getGenerationStatus(room, 2)).toBe("failed");
  });

  it("ready → failed is rejected (stays ready)", () => {
    const room = makeRoom();
    setGenerationStatus(room, 2, "pending");
    setGenerationStatus(room, 2, "ready");
    setGenerationStatus(room, 2, "failed"); // must be no-op
    expect(getGenerationStatus(room, 2)).toBe("ready");
  });

  it("failed → ready is rejected (stays failed)", () => {
    const room = makeRoom();
    setGenerationStatus(room, 2, "pending");
    setGenerationStatus(room, 2, "failed");
    setGenerationStatus(room, 2, "ready"); // must be no-op
    expect(getGenerationStatus(room, 2)).toBe("failed");
  });
});
