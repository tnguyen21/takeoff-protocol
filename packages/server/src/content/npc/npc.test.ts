/**
 * Tests for NPC trigger content files.
 *
 * Invariants:
 * - INV-1: All trigger IDs are globally unique
 * - INV-2: Each trigger has a non-empty id, npcId, content, and a target object
 *          (target may be {} for personal triggers that broadcast to all players)
 * - INV-3: Triggers with a condition reference a valid state variable (checked structurally)
 * - INV-4: getNpcTriggersForRound returns the correct set and empty array for unknown rounds
 * - INV-5: Round-1 triggers cover chinaWeightTheftProgress, ccpPatience, publicAwareness
 * - INV-6: Round-2 triggers cover whistleblowerPressure, obBoardConfidence, alignmentConfidence, openSourceMomentum
 */

import { describe, it, expect } from "bun:test";
import { ROUND1_NPC_TRIGGERS } from "./round1.js";
import { ROUND2_NPC_TRIGGERS } from "./round2.js";
import { CONDITIONAL_NPC_TRIGGERS } from "./conditional.js";
import { PERSONAL_NPC_TRIGGERS } from "./personal.js";
import { getNpcTriggersForRound } from "./index.js";

// ── INV-1: Globally unique IDs ──────────────────────────────────────────────

describe("INV-1: trigger ID uniqueness", () => {
  it("all trigger IDs across all arrays are unique", () => {
    const all = [
      ...ROUND1_NPC_TRIGGERS,
      ...ROUND2_NPC_TRIGGERS,
      ...CONDITIONAL_NPC_TRIGGERS,
      ...PERSONAL_NPC_TRIGGERS,
    ];
    const ids = all.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ── INV-2: Required fields ──────────────────────────────────────────────────

function assertTriggerShape(triggers: typeof ROUND1_NPC_TRIGGERS, label: string) {
  describe(`INV-2: required fields — ${label}`, () => {
    it("every trigger has a non-empty id, npcId, content, and a target object", () => {
      for (const t of triggers) {
        expect(t.id.length).toBeGreaterThan(0);
        expect(t.npcId.length).toBeGreaterThan(0);
        expect(t.content.length).toBeGreaterThan(0);
        // target must be an object (may be {} for personal/broadcast triggers)
        expect(typeof t.target).toBe("object");
        expect(t.target).not.toBeNull();
      }
    });

    it("every condition (if present) has variable, operator, value", () => {
      for (const t of triggers) {
        if (!t.condition) continue;
        expect(typeof t.condition.variable).toBe("string");
        expect(["gte", "lte", "eq"]).toContain(t.condition.operator);
        expect(typeof t.condition.value).toBe("number");
      }
    });

    it("every schedule (if present) has round and phase", () => {
      for (const t of triggers) {
        if (!t.schedule) continue;
        expect(typeof t.schedule.round).toBe("number");
        expect(t.schedule.phase.length).toBeGreaterThan(0);
      }
    });

    it("every rounds field (if present) is a two-element tuple with min <= max", () => {
      for (const t of triggers) {
        if (!t.rounds) continue;
        expect(t.rounds).toHaveLength(2);
        expect(t.rounds[0]).toBeLessThanOrEqual(t.rounds[1]);
      }
    });
  });
}

assertTriggerShape(ROUND1_NPC_TRIGGERS, "round1");
assertTriggerShape(ROUND2_NPC_TRIGGERS, "round2");
assertTriggerShape(CONDITIONAL_NPC_TRIGGERS, "conditional");
assertTriggerShape(PERSONAL_NPC_TRIGGERS, "personal");

// ── INV-4: getNpcTriggersForRound ────────────────────────────────────────────

describe("INV-4: getNpcTriggersForRound", () => {
  it("returns round1 triggers for round 1 (includes all ROUND1 entries)", () => {
    const triggers = getNpcTriggersForRound(1);
    expect(triggers.length).toBeGreaterThanOrEqual(ROUND1_NPC_TRIGGERS.length);
    for (const t of ROUND1_NPC_TRIGGERS) {
      expect(triggers).toContainEqual(t);
    }
  });

  it("returns round2 triggers for round 2 (includes all ROUND2 entries)", () => {
    const triggers = getNpcTriggersForRound(2);
    expect(triggers.length).toBeGreaterThanOrEqual(ROUND2_NPC_TRIGGERS.length);
    for (const t of ROUND2_NPC_TRIGGERS) {
      expect(triggers).toContainEqual(t);
    }
  });

  it("returns empty array for unknown rounds (no conditional/personal triggers active)", () => {
    expect(getNpcTriggersForRound(0)).toEqual([]);
    expect(getNpcTriggersForRound(99)).toEqual([]);
  });
});

// ── INV-5: Round-1 variable coverage ────────────────────────────────────────

describe("INV-5: round1 covers required state variables", () => {
  const r1vars = ROUND1_NPC_TRIGGERS.flatMap((t) =>
    t.condition ? [t.condition.variable] : []
  );

  it("covers chinaWeightTheftProgress", () => {
    expect(r1vars).toContain("chinaWeightTheftProgress");
  });

  it("covers ccpPatience", () => {
    expect(r1vars).toContain("ccpPatience");
  });

  it("covers publicAwareness", () => {
    expect(r1vars).toContain("publicAwareness");
  });

  it("has at least 4 triggers", () => {
    expect(ROUND1_NPC_TRIGGERS.length).toBeGreaterThanOrEqual(4);
  });
});

// ── INV-6: Round-2 variable coverage ────────────────────────────────────────

describe("INV-6: round2 covers required state variables", () => {
  const r2vars = ROUND2_NPC_TRIGGERS.flatMap((t) =>
    t.condition ? [t.condition.variable] : []
  );

  it("covers whistleblowerPressure", () => {
    expect(r2vars).toContain("whistleblowerPressure");
  });

  it("covers obBoardConfidence", () => {
    expect(r2vars).toContain("obBoardConfidence");
  });

  it("covers alignmentConfidence", () => {
    expect(r2vars).toContain("alignmentConfidence");
  });

  it("covers openSourceMomentum", () => {
    expect(r2vars).toContain("openSourceMomentum");
  });

  it("has at least 4 triggers", () => {
    expect(ROUND2_NPC_TRIGGERS.length).toBeGreaterThanOrEqual(4);
  });
});
