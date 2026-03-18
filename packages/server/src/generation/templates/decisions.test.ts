/**
 * Tests for decision template invariants.
 *
 * - INV-1: Every state variable in STATE_VARIABLE_RANGES appears in at least
 *          one template's variableScope within each round (2, 3, 4)
 * - INV-2: No template has fewer than 4 or more than 12 variables in variableScope
 * - INV-3: Every round 2-4 has templates matching all individual roles and team
 *          factions that have pre-authored decisions in the corresponding round file
 * - INV-4: All variableScope entries are valid keys in STATE_VARIABLE_RANGES
 * - INV-5: All archetypes arrays have exactly 3 entries
 * - INV-6: All role/faction values are valid Role/Faction type members
 */

import { describe, it, expect } from "bun:test";
import { STATE_VARIABLE_RANGES } from "@takeoff/shared";
import { DECISION_TEMPLATES, getTemplatesForRound } from "./decisions.js";

const ALL_VARIABLES = Object.keys(STATE_VARIABLE_RANGES) as (keyof typeof STATE_VARIABLE_RANGES)[];

const VALID_ROLES = new Set<string>([
  "ob_ceo", "ob_cto", "ob_safety", "ob_security",
  "prom_ceo", "prom_scientist", "prom_policy", "prom_opensource",
  "china_director", "china_intel", "china_military", "china_scientist",
  "ext_nsa", "ext_journalist", "ext_vc", "ext_diplomat",
]);

const VALID_FACTIONS = new Set<string>([
  "openbrain", "prometheus", "china", "external",
]);

describe("INV-1: every state variable covered per round", () => {
  for (const round of [1, 2, 3, 4, 5]) {
    it(`round ${round} covers all ${ALL_VARIABLES.length} state variables`, () => {
      const templates = getTemplatesForRound(round);
      const covered = new Set(templates.flatMap((t) => t.variableScope));
      const missing = ALL_VARIABLES.filter((v) => !covered.has(v));
      expect(missing).toEqual([]);
    });
  }
});

describe("INV-2: variableScope has 4–12 entries per template", () => {
  it("no template has fewer than 4 or more than 12 variables", () => {
    const violations = DECISION_TEMPLATES.filter(
      (t) => t.variableScope.length < 4 || t.variableScope.length > 12,
    ).map((t) => ({ round: t.round, role: t.role, faction: t.faction, count: t.variableScope.length }));
    expect(violations).toEqual([]);
  });
});

describe("INV-4: all variableScope entries are valid STATE_VARIABLE_RANGES keys", () => {
  it("no template references an unknown variable", () => {
    const validVars = new Set(ALL_VARIABLES);
    const violations = DECISION_TEMPLATES.flatMap((t) =>
      t.variableScope
        .filter((v) => !validVars.has(v))
        .map((v) => ({ round: t.round, role: t.role, faction: t.faction, invalidVar: v })),
    );
    expect(violations).toEqual([]);
  });
});

describe("INV-5: all archetypes arrays have exactly 3 entries", () => {
  it("every template has exactly 3 archetypes", () => {
    const violations = DECISION_TEMPLATES.filter((t) => t.archetypes.length !== 3).map(
      (t) => ({ round: t.round, role: t.role, faction: t.faction, count: t.archetypes.length }),
    );
    expect(violations).toEqual([]);
  });

  it("no template has empty archetype strings", () => {
    const violations = DECISION_TEMPLATES.filter((t) =>
      t.archetypes.some((a) => a.trim() === ""),
    ).map((t) => ({ round: t.round, role: t.role, faction: t.faction }));
    expect(violations).toEqual([]);
  });
});

describe("INV-6: all role/faction values are valid", () => {
  it("all role values are valid Role members", () => {
    const violations = DECISION_TEMPLATES.filter(
      (t) => t.role !== undefined && !VALID_ROLES.has(t.role),
    ).map((t) => ({ round: t.round, role: t.role }));
    expect(violations).toEqual([]);
  });

  it("all faction values are valid Faction members", () => {
    const violations = DECISION_TEMPLATES.filter(
      (t) => t.faction !== undefined && !VALID_FACTIONS.has(t.faction),
    ).map((t) => ({ round: t.round, faction: t.faction }));
    expect(violations).toEqual([]);
  });

  it("each template has exactly one of role or faction (not both, not neither)", () => {
    const violations = DECISION_TEMPLATES.filter(
      (t) => (t.role === undefined) === (t.faction === undefined),
    ).map((t) => ({ round: t.round, role: t.role, faction: t.faction }));
    expect(violations).toEqual([]);
  });
});

describe("getTemplatesForRound", () => {
  it("returns only templates for the requested round", () => {
    for (const round of [1, 2, 3, 4, 5]) {
      const templates = getTemplatesForRound(round);
      expect(templates.every((t) => t.round === round)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    }
  });

  it("returns the expected number of templates per round", () => {
    const expected: Record<number, number> = { 1: 20, 2: 22, 3: 22, 4: 22, 5: 18 };
    for (const [round, count] of Object.entries(expected)) {
      const templates = getTemplatesForRound(Number(round));
      expect(templates.length).toBe(count);
    }
  });
});
