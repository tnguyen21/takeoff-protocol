/**
 * Tests for the generated-decision simulation subsystem.
 *
 * INV-1: sampleRandomDecision() always produces decisions that pass validateDecisions()
 * INV-2: Simulation with sampled decisions completes 100 trials without error
 * INV-3: All 9 ending arcs produce at least 2 different outcomes across 1000 trials
 */

import { describe, it, expect } from "bun:test";

import { validateDecisions } from "../packages/server/src/generation/validate.js";
import { DECISION_TEMPLATES } from "../packages/server/src/generation/templates/decisions.js";
import { sampleRandomDecision, sampleRoundDecisions, runGeneratedTrial } from "./simulate-generated.js";
import type { IndividualDecision, TeamDecision, RoundDecisions } from "../packages/shared/src/index.js";

// ── INV-1: sampleRandomDecision() always produces valid decisions ─────────────

describe("INV-1: sampleRandomDecision produces valid decisions", () => {
  it("every template produces a decision that passes validateDecisions() hard constraints", () => {
    const failures: string[] = [];

    for (const template of DECISION_TEMPLATES) {
      // Run each template multiple times to catch non-deterministic failures
      for (let attempt = 0; attempt < 10; attempt++) {
        const decision = sampleRandomDecision(template);

        // Wrap in a minimal RoundDecisions for validation
        let roundDecisions: RoundDecisions;
        if (template.role !== undefined) {
          roundDecisions = { round: template.round, individual: [decision as IndividualDecision], team: [] };
        } else {
          roundDecisions = { round: template.round, individual: [], team: [decision as TeamDecision] };
        }

        const result = validateDecisions(roundDecisions);

        if (!result.valid) {
          const templateId = template.role ?? template.faction ?? "unknown";
          failures.push(`template ${templateId} (attempt ${attempt}): ${result.errors.join("; ")}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it("sampled options always have exactly 3 options", () => {
    for (const template of DECISION_TEMPLATES) {
      const decision = sampleRandomDecision(template);
      expect(decision.options).toHaveLength(3);
    }
  });

  it("sampled options each have 5-8 effects with |delta| <= 8", () => {
    const violations: string[] = [];
    for (const template of DECISION_TEMPLATES) {
      const decision = sampleRandomDecision(template);
      for (const opt of decision.options) {
        if (opt.effects.length < 5 || opt.effects.length > 8) {
          violations.push(`${template.theme}/${opt.id}: ${opt.effects.length} effects`);
        }
        for (const eff of opt.effects) {
          if (Math.abs(eff.delta) > 8) {
            violations.push(`${template.theme}/${opt.id}/${eff.variable}: delta=${eff.delta}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("sampled options always satisfy no-free-lunch (>=2 positive, >=2 negative effects)", () => {
    const violations: string[] = [];
    for (const template of DECISION_TEMPLATES) {
      const decision = sampleRandomDecision(template);
      for (const opt of decision.options) {
        const pos = opt.effects.filter((e) => e.delta > 0).length;
        const neg = opt.effects.filter((e) => e.delta < 0).length;
        if (pos < 2 || neg < 2) {
          violations.push(`${template.theme}/${opt.id}: pos=${pos} neg=${neg}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

// ── INV-2: Simulation with sampled decisions completes 100 trials without error ─

describe("INV-2: simulation with sampled decisions completes without error", () => {
  it("100 trials with sampled decisions complete and return 9 ending arcs each", () => {
    const TRIALS = 100;
    for (let i = 0; i < TRIALS; i++) {
      const result = runGeneratedTrial("random");
      expect(result.arcs).toHaveLength(9);
      // All arc results should be valid indices
      for (const arc of result.arcs) {
        expect(arc.result).toBeGreaterThanOrEqual(0);
        expect(arc.result).toBeLessThan(arc.spectrum.length);
      }
    }
  });

  it("sampleRoundDecisions returns the correct round number", () => {
    for (const round of [1, 2, 3, 4, 5]) {
      const rd = sampleRoundDecisions(round);
      expect(rd.round).toBe(round);
    }
  });

  it("sampleRoundDecisions for rounds 1-5 produces decisions matching template counts", () => {
    for (const round of [1, 2, 3, 4, 5]) {
      const templates = DECISION_TEMPLATES.filter((t) => t.round === round);
      const indivTemplates = templates.filter((t) => t.role !== undefined);
      const teamTemplates = templates.filter((t) => t.faction !== undefined && t.role === undefined);

      const rd = sampleRoundDecisions(round);
      expect(rd.individual).toHaveLength(indivTemplates.length);
      expect(rd.team).toHaveLength(teamTemplates.length);
    }
  });
});

// ── INV-3: All 9 ending arcs produce at least 2 different outcomes in 1000 trials ─

describe("INV-3: arc outcome diversity under generated decisions", () => {
  it("every arc produces at least 2 distinct outcomes across 1000 trials", () => {
    const TRIALS = 1000;

    const arcOutcomes = new Map<string, Set<number>>();

    for (let i = 0; i < TRIALS; i++) {
      const result = runGeneratedTrial("random");
      for (const arc of result.arcs) {
        if (!arcOutcomes.has(arc.id)) arcOutcomes.set(arc.id, new Set());
        arcOutcomes.get(arc.id)!.add(arc.result);
      }
    }

    expect(arcOutcomes.size).toBe(9);

    const stuck: string[] = [];
    for (const [arcId, outcomes] of arcOutcomes) {
      if (outcomes.size < 2) {
        stuck.push(`${arcId}: only outcome(s) ${[...outcomes].join(", ")} seen in ${TRIALS} trials`);
      }
    }

    expect(stuck).toEqual([]);
  });
});
