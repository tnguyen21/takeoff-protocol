/**
 * Tests for NPC trigger content files.
 *
 * Invariants:
 * - INV-1: All trigger IDs are globally unique
 * - INV-2: Each trigger has a non-empty id, npcId, content, and a target object
 *          (target may be {} for personal triggers that broadcast to all players)
 * - INV-3: Triggers with a condition reference a valid state variable (checked structurally)
 * - INV-4: getNpcTriggersForRound returns all round + personal triggers and empty array for unknown rounds
 * - INV-5: Round-1 triggers cover chinaWeightTheftProgress, ccpPatience, publicAwareness
 * - INV-6: Round-2 triggers cover whistleblowerPressure, obBoardConfidence, alignmentConfidence, openSourceMomentum
 * - INV-7: CONDITIONAL_NPC_TRIGGERS IDs are unique and non-overlapping with round triggers
 * - INV-8: getNpcTriggersForRound merges conditional triggers filtered by round window
 * - INV-9: Personal triggers have correct structure (schedule XOR rounds+condition, valid roles)
 * - INV-10: getNpcTriggersForRound merges personal scheduled triggers into the right rounds
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

import type { NpcTrigger } from "@takeoff/shared";

function assertTriggerShape(triggers: NpcTrigger[], label: string) {
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

    it("every rounds (if present) is a valid [start, end] pair", () => {
      for (const t of triggers) {
        if (!t.rounds) continue;
        expect(Array.isArray(t.rounds)).toBe(true);
        expect(t.rounds.length).toBe(2);
        expect(t.rounds[0]).toBeGreaterThanOrEqual(1);
        expect(t.rounds[1]).toBeGreaterThanOrEqual(t.rounds[0]);
        expect(t.rounds[1]).toBeLessThanOrEqual(5);
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

  it("merges conditional triggers whose round window includes the current round", () => {
    // npc_security_vendor_patch_gap is active rounds [1,3]
    const r1 = getNpcTriggersForRound(1);
    const r2 = getNpcTriggersForRound(2);
    const r4 = getNpcTriggersForRound(4);

    const secId = "npc_security_vendor_patch_gap";
    expect(r1.some((t) => t.id === secId)).toBe(true);
    expect(r2.some((t) => t.id === secId)).toBe(true);
    expect(r4.some((t) => t.id === secId)).toBe(false);
  });

  it("excludes conditional triggers outside their round window", () => {
    // npc_ccp_loss_of_patience is active rounds [4,5] only
    const r3 = getNpcTriggersForRound(3);
    const r4 = getNpcTriggersForRound(4);
    const r5 = getNpcTriggersForRound(5);

    const ccpId = "npc_ccp_loss_of_patience";
    expect(r3.some((t) => t.id === ccpId)).toBe(false);
    expect(r4.some((t) => t.id === ccpId)).toBe(true);
    expect(r5.some((t) => t.id === ccpId)).toBe(true);
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

// ── INV-7: CONDITIONAL_NPC_TRIGGERS uniqueness ───────────────────────────────

describe("INV-7: conditional trigger ID uniqueness", () => {
  it("all conditional trigger IDs are unique", () => {
    const ids = CONDITIONAL_NPC_TRIGGERS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("conditional trigger IDs do not overlap with round1 or round2 IDs", () => {
    const roundIds = new Set([
      ...ROUND1_NPC_TRIGGERS.map((t) => t.id),
      ...ROUND2_NPC_TRIGGERS.map((t) => t.id),
    ]);
    for (const t of CONDITIONAL_NPC_TRIGGERS) {
      expect(roundIds.has(t.id)).toBe(false);
    }
  });

  it("has 31 triggers covering all factions", () => {
    expect(CONDITIONAL_NPC_TRIGGERS.length).toBe(31);
    const roles = new Set(
      CONDITIONAL_NPC_TRIGGERS.flatMap((t) => (t.target.role ? [t.target.role] : [])),
    );
    // Covers roles from all four factions
    expect(roles.has("ob_safety")).toBe(true);
    expect(roles.has("prom_ceo")).toBe(true);
    expect(roles.has("china_director")).toBe(true);
    expect(roles.has("ext_nsa")).toBe(true);
  });
});

// ── INV-8: rounds field validation ──────────────────────────────────────────

describe("INV-8: conditional trigger rounds field", () => {
  it("every conditional trigger has a valid rounds tuple", () => {
    for (const t of CONDITIONAL_NPC_TRIGGERS) {
      expect(t.rounds).toBeDefined();
      expect(Array.isArray(t.rounds)).toBe(true);
      expect(t.rounds!.length).toBe(2);
      const [min, max] = t.rounds!;
      expect(min).toBeGreaterThanOrEqual(1);
      expect(max).toBeLessThanOrEqual(5);
      expect(min).toBeLessThanOrEqual(max);
    }
  });

  it("every conditional trigger targets a specific role (not faction-wide)", () => {
    for (const t of CONDITIONAL_NPC_TRIGGERS) {
      expect(t.target.role).toBeDefined();
    }
  });
});

// ── INV-9: Personal trigger structure ───────────────────────────────────────

describe("INV-9: personal trigger structure", () => {
  it("all personal triggers use __npc_personal__ npcId", () => {
    for (const t of PERSONAL_NPC_TRIGGERS) {
      expect(t.npcId).toBe("__npc_personal__");
    }
  });

  it("all personal trigger IDs start with npc_personal_", () => {
    for (const t of PERSONAL_NPC_TRIGGERS) {
      expect(t.id).toMatch(/^npc_personal_/);
    }
  });

  it("escalation-aware triggers have condition and rounds, not schedule", () => {
    const escalation = PERSONAL_NPC_TRIGGERS.filter((t) => t.rounds !== undefined);
    for (const t of escalation) {
      expect(t.condition).toBeDefined();
      expect(t.schedule).toBeUndefined();
    }
  });

  it("scheduled personal triggers have schedule and no rounds", () => {
    const scheduled = PERSONAL_NPC_TRIGGERS.filter((t) => t.schedule !== undefined);
    for (const t of scheduled) {
      expect(t.rounds).toBeUndefined();
    }
  });

  it("every trigger has either a schedule or a rounds field", () => {
    for (const t of PERSONAL_NPC_TRIGGERS) {
      expect(t.schedule !== undefined || t.rounds !== undefined).toBe(true);
    }
  });

  it("has a substantial number of triggers", () => {
    expect(PERSONAL_NPC_TRIGGERS.length).toBeGreaterThanOrEqual(40);
  });
});

// ── INV-10: getNpcTriggersForRound merges personal scheduled triggers ─────────

describe("INV-10: personal scheduled triggers appear in correct rounds", () => {
  it("ob_ceo_spouse_r1 appears in round 1 results", () => {
    const r1 = getNpcTriggersForRound(1);
    expect(r1.some((t) => t.id === "npc_personal_ob_ceo_spouse_r1")).toBe(true);
  });

  it("any_package_r1 (global) appears in round 1 results", () => {
    const r1 = getNpcTriggersForRound(1);
    expect(r1.some((t) => t.id === "npc_personal_any_package_r1")).toBe(true);
  });

  it("ob_ceo_spouse_r3 does NOT appear in round 1", () => {
    const r1 = getNpcTriggersForRound(1);
    expect(r1.some((t) => t.id === "npc_personal_ob_ceo_spouse_r3")).toBe(false);
  });

  it("any_mom_worried (escalation) appears in rounds 3-5 but not round 2", () => {
    expect(getNpcTriggersForRound(2).some((t) => t.id === "npc_personal_any_mom_worried")).toBe(false);
    expect(getNpcTriggersForRound(3).some((t) => t.id === "npc_personal_any_mom_worried")).toBe(true);
    expect(getNpcTriggersForRound(4).some((t) => t.id === "npc_personal_any_mom_worried")).toBe(true);
    expect(getNpcTriggersForRound(5).some((t) => t.id === "npc_personal_any_mom_worried")).toBe(true);
  });

  it("any_old_friend_doom (rounds [5,5]) only appears in round 5", () => {
    expect(getNpcTriggersForRound(4).some((t) => t.id === "npc_personal_any_old_friend_doom")).toBe(false);
    expect(getNpcTriggersForRound(5).some((t) => t.id === "npc_personal_any_old_friend_doom")).toBe(true);
  });

  it("ob_safety_sibling_r5 (scheduled) appears in round 5", () => {
    expect(getNpcTriggersForRound(5).some((t) => t.id === "npc_personal_ob_safety_sibling_r5")).toBe(true);
    expect(getNpcTriggersForRound(4).some((t) => t.id === "npc_personal_ob_safety_sibling_r5")).toBe(false);
  });
});
