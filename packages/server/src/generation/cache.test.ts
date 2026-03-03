/**
 * Tests for generation cache helpers.
 *
 * Invariants tested:
 * - INV-1: Setting briefing for round 2 does not affect round 3 cache
 * - INV-2: Status transition pending→ready succeeds; ready→failed is rejected (stays ready)
 * - INV-3: Getting from empty cache returns undefined, not null or throws
 */

import { describe, it, expect } from "bun:test";
import type { AppContent, GameRoom } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import {
  getGeneratedBriefing,
  getGeneratedContent,
  getGenerationStatus,
  setGeneratedBriefing,
  setGeneratedContent,
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

// ── INV-3: Empty cache returns undefined ──────────────────────────────────────

describe("getGeneratedBriefing — empty cache (INV-3)", () => {
  it("returns undefined when generatedRounds is undefined", () => {
    const room = makeRoom();
    expect(getGeneratedBriefing(room, 2)).toBeUndefined();
  });

  it("returns undefined when round entry is absent", () => {
    const room = makeRoom({ generatedRounds: {} });
    expect(getGeneratedBriefing(room, 2)).toBeUndefined();
  });
});

describe("getGeneratedContent — empty cache (INV-3)", () => {
  it("returns undefined when generatedRounds is undefined", () => {
    const room = makeRoom();
    expect(getGeneratedContent(room, 2, "openbrain")).toBeUndefined();
  });

  it("returns undefined for a faction with no content set", () => {
    const room = makeRoom({ generatedRounds: { 2: { briefing: BRIEFING_R2 } } });
    expect(getGeneratedContent(room, 2, "openbrain")).toBeUndefined();
  });
});

describe("getGenerationStatus — empty cache (INV-3)", () => {
  it("returns undefined when generationStatus is undefined", () => {
    const room = makeRoom();
    expect(getGenerationStatus(room, 2)).toBeUndefined();
  });

  it("returns undefined when round entry is absent", () => {
    const room = makeRoom({ generationStatus: {} });
    expect(getGenerationStatus(room, 2)).toBeUndefined();
  });
});

// ── Set → Get round-trip ─────────────────────────────────────────────────────

describe("setGeneratedBriefing / getGeneratedBriefing", () => {
  it("set briefing → get returns the same object", () => {
    const room = makeRoom();
    setGeneratedBriefing(room, 2, BRIEFING_R2);
    expect(getGeneratedBriefing(room, 2)).toBe(BRIEFING_R2);
  });

  it("initializes generatedRounds when undefined before writing", () => {
    const room = makeRoom(); // generatedRounds not set
    expect(room.generatedRounds).toBeUndefined();
    setGeneratedBriefing(room, 2, BRIEFING_R2);
    expect(room.generatedRounds).toBeDefined();
    expect(getGeneratedBriefing(room, 2)).toBe(BRIEFING_R2);
  });
});

describe("setGeneratedContent / getGeneratedContent", () => {
  it("set content → get returns same array", () => {
    const room = makeRoom();
    setGeneratedContent(room, 2, "openbrain", CONTENT_OB);
    expect(getGeneratedContent(room, 2, "openbrain")).toBe(CONTENT_OB);
  });

  it("set content for one faction → different faction returns undefined", () => {
    const room = makeRoom();
    setGeneratedContent(room, 2, "openbrain", CONTENT_OB);
    expect(getGeneratedContent(room, 2, "prometheus")).toBeUndefined();
  });

  it("initializes generatedRounds when undefined before writing", () => {
    const room = makeRoom();
    setGeneratedContent(room, 2, "openbrain", CONTENT_OB);
    expect(room.generatedRounds).toBeDefined();
  });
});

// ── INV-1: Round isolation ────────────────────────────────────────────────────

describe("round isolation (INV-1)", () => {
  it("setting briefing for round 2 does not affect round 3", () => {
    const room = makeRoom();
    setGeneratedBriefing(room, 2, BRIEFING_R2);
    expect(getGeneratedBriefing(room, 3)).toBeUndefined();
  });

  it("setting content for round 2 does not affect round 3", () => {
    const room = makeRoom();
    setGeneratedContent(room, 2, "openbrain", CONTENT_OB);
    expect(getGeneratedContent(room, 3, "openbrain")).toBeUndefined();
  });

  it("setting status for round 2 does not affect round 3", () => {
    const room = makeRoom();
    setGenerationStatus(room, 2, "ready");
    expect(getGenerationStatus(room, 3)).toBeUndefined();
  });
});

// ── INV-2: Status transitions ─────────────────────────────────────────────────

describe("setGenerationStatus / getGenerationStatus — transitions (INV-2)", () => {
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

  it("initializes generationStatus when undefined before writing", () => {
    const room = makeRoom();
    expect(room.generationStatus).toBeUndefined();
    setGenerationStatus(room, 2, "pending");
    expect(room.generationStatus).toBeDefined();
    expect(getGenerationStatus(room, 2)).toBe("pending");
  });

  it("second call with same terminal status is a no-op (ready → ready)", () => {
    const room = makeRoom();
    setGenerationStatus(room, 2, "pending");
    setGenerationStatus(room, 2, "ready");
    setGenerationStatus(room, 2, "ready"); // idempotent no-op
    expect(getGenerationStatus(room, 2)).toBe("ready");
  });
});
