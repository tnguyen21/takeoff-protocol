/**
 * Balance regression tests for the Monte Carlo simulator.
 *
 * Runs 5000 random-heuristic trials and asserts invariants that should always hold.
 * Regressions in decision deltas (e.g. making an outcome unreachable, causing saturation)
 * will cause these tests to fail.
 *
 * Known balance constraints are documented inline and excluded from checks — they represent
 * pre-existing game design decisions, not bugs. If a future balance pass fixes them, remove
 * the exclusion and tighten the threshold.
 */

import { describe, it, expect, beforeAll, setDefaultTimeout } from "bun:test";
import { runTrial, pickOption, sampleAllRounds, type TrialResult } from "./simulate-core.js";
import { INITIAL_STATE } from "../packages/shared/src/index.js";
import type { StateVariables } from "../packages/shared/src/index.js";

// Template-sampled trials are slower than pre-authored; raise default timeout
setDefaultTimeout(30_000);

const TRIAL_COUNT = 5000;

let results: TrialResult[];

beforeAll(() => {
  results = [];
  for (let i = 0; i < TRIAL_COUNT; i++) {
    results.push(runTrial("random"));
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  if (denomX === 0 || denomY === 0) return 0;
  return num / Math.sqrt(denomX * denomY);
}

// ── INV-1: Arc outcome reachability ──────────────────────────────────────────

describe("INV-1: arc outcome reachability", () => {
  /**
   * Outcomes known to be structurally unreachable under random play with
   * template-sampled decisions.
   *
   * These are not bugs — they are design constraints of the current decision space.
   * Each is documented with the reason it cannot be reached under random heuristic.
   *
   * Format: "arcId:resultIndex"
   *
   * Balance owners: removing an entry from this list AND confirming the outcome appears
   * in trials is evidence that a balance pass succeeded.
   */
  const KNOWN_UNREACHABLE = new Set<string>([
    // openSource[0] "Everything leaked": requires chinaWeightTheftProgress >= 100.
    // Template-sampled deltas (|delta| <= 8) cannot drive this from 0 to 100 under random play.
    "openSource:0",
  ]);

  it("every non-constrained outcome is reachable in 5000 random trials", () => {
    // Build arc outcome frequency map
    const arcFreq = new Map<string, number[]>();
    for (const r of results) {
      for (const arc of r.arcs) {
        if (!arcFreq.has(arc.id)) {
          arcFreq.set(arc.id, new Array(arc.spectrum.length).fill(0));
        }
        arcFreq.get(arc.id)![arc.result]++;
      }
    }

    const unreachable: string[] = [];
    for (const [arcId, counts] of arcFreq) {
      for (let i = 0; i < counts.length; i++) {
        const key = `${arcId}:${i}`;
        if (counts[i] === 0 && !KNOWN_UNREACHABLE.has(key)) {
          unreachable.push(`${arcId}[${i}] (0 / ${TRIAL_COUNT} trials)`);
        }
      }
    }

    expect(unreachable).toEqual([]);
  });

  it("has 9 ending arcs", () => {
    const arcIds = new Set(results[0].arcs.map((a) => a.id));
    expect(arcIds.size).toBe(9);
  });
});

// ── INV-2: No variable saturates at ceiling/floor in >80% of trials ──────────

describe("INV-2: no state variable saturation", () => {
  /**
   * Variables known to saturate at their ceiling in >80% of random trials.
   *
   * These are pre-existing balance issues: decision space pushes them upward with no
   * downward pressure. Excluded from the 80% threshold check until rebalanced.
   * The check still applies to ALL other variables.
   *
   * Format: "varName:ceiling|floor" where ceiling/floor is the bound value being hit.
   */
  const KNOWN_SATURATING = new Set<string>([
    // These may need updating for template-sampled decisions.
    // Kept as-is initially — if new saturations appear, add them here with documentation.
  ]);

  // Ceiling and floor for each state variable (mirrors clampState in resolution.ts).
  // If clampState bounds change, update this map.
  const BOUNDS: Record<keyof StateVariables, [number, number]> = {
    obCapability: [0, 100],
    promCapability: [0, 100],
    chinaCapability: [0, 100],
    usChinaGap: [-8, 16],
    obPromGap: [-8, 16],
    alignmentConfidence: [0, 100],
    misalignmentSeverity: [0, 100],
    publicAwareness: [0, 100],
    publicSentiment: [-100, 100],
    economicDisruption: [0, 100],
    taiwanTension: [0, 100],
    obInternalTrust: [0, 100],
    securityLevelOB: [1, 5],
    securityLevelProm: [1, 5],
    intlCooperation: [0, 100],
    marketIndex: [0, 200],
    regulatoryPressure: [0, 100],
    globalMediaCycle: [0, 5],
    chinaWeightTheftProgress: [0, 100],
    aiAutonomyLevel: [0, 100],
    whistleblowerPressure: [0, 100],
    openSourceMomentum: [0, 100],
    doomClockDistance: [0, 5],
    obMorale: [0, 100],
    obBurnRate: [0, 100],
    obBoardConfidence: [0, 100],
    promMorale: [0, 100],
    promBurnRate: [0, 100],
    promBoardConfidence: [0, 100],
    promSafetyBreakthroughProgress: [0, 100],
    cdzComputeUtilization: [0, 100],
    ccpPatience: [0, 100],
    domesticChipProgress: [0, 100],
  };

  const SATURATION_THRESHOLD = 0.80;

  it("no variable saturates at ceiling or floor in >80% of trials (excluding known-constrained)", () => {
    const varKeys = Object.keys(INITIAL_STATE) as (keyof StateVariables)[];
    const saturating: string[] = [];

    for (const key of varKeys) {
      const [floor, ceiling] = BOUNDS[key];
      const finalValues = results.map((r) => r.finalState[key]);

      const atCeiling = finalValues.filter((v) => v === ceiling).length / TRIAL_COUNT;
      const atFloor = finalValues.filter((v) => v === floor).length / TRIAL_COUNT;

      const ceilingKey = `${key}:${ceiling}`;
      const floorKey = `${key}:${floor}`;

      if (atCeiling > SATURATION_THRESHOLD && !KNOWN_SATURATING.has(ceilingKey)) {
        saturating.push(`${key} ceiling=${ceiling}: ${(atCeiling * 100).toFixed(1)}%`);
      }
      if (atFloor > SATURATION_THRESHOLD && !KNOWN_SATURATING.has(floorKey)) {
        saturating.push(`${key} floor=${floor}: ${(atFloor * 100).toFixed(1)}%`);
      }
    }

    expect(saturating).toEqual([]);
  });
});

// ── INV-3: Gap variable drift ──────────────────────────────────────────────

describe("INV-3: gap variable drift", () => {
  it("mean usChinaGap is within [-6, +6] under random play", () => {
    const values = results.map((r) => r.finalState.usChinaGap);
    const mean = values.reduce((a, b) => a + b, 0) / TRIAL_COUNT;
    expect(mean).toBeGreaterThanOrEqual(-6);
    expect(mean).toBeLessThanOrEqual(6);
  });

  it("mean obPromGap is within [-6, +6] under random play", () => {
    const values = results.map((r) => r.finalState.obPromGap);
    const mean = values.reduce((a, b) => a + b, 0) / TRIAL_COUNT;
    expect(mean).toBeGreaterThanOrEqual(-6);
    expect(mean).toBeLessThanOrEqual(6);
  });
});

// ── INV-4: Arc independence ───────────────────────────────────────────────

describe("INV-4: arc independence", () => {
  /**
   * Arc pairs known to be structurally correlated (Pearson r > 0.9).
   *
   * usChinaRelations ↔ taiwan: both arcs are resolved primarily by the same
   * state variables (taiwanTension and ccpPatience). This coupling is intentional —
   * Taiwan IS geopolitically tied to US-China relations in the game narrative.
   * Decoupling them would require introducing distinct driving variables per arc.
   *
   * Format: "arcIdA:arcIdB" (canonical order: alphabetically first is arcIdA).
   */
  const KNOWN_CORRELATED_PAIRS = new Set<string>([
    "taiwan:usChinaRelations",
  ]);

  it("no two arcs have Pearson correlation >= 0.9 (excluding known-correlated pairs)", () => {
    const arcIds = results[0].arcs.map((a) => a.id);
    const arcResults: Record<string, number[]> = {};
    for (const id of arcIds) arcResults[id] = [];
    for (const r of results) {
      for (const arc of r.arcs) arcResults[arc.id].push(arc.result);
    }

    const overdetermined: string[] = [];
    for (let i = 0; i < arcIds.length; i++) {
      for (let j = i + 1; j < arcIds.length; j++) {
        const a = arcIds[i];
        const b = arcIds[j];
        // Canonical sort for lookup (alphabetical)
        const pairKey = [a, b].sort().join(":");
        if (KNOWN_CORRELATED_PAIRS.has(pairKey)) continue;

        const r = pearsonCorrelation(arcResults[a], arcResults[b]);
        if (Math.abs(r) >= 0.9) {
          overdetermined.push(`${a} ↔ ${b}: r=${r.toFixed(3)}`);
        }
      }
    }

    expect(overdetermined).toEqual([]);
  });
});

// ── INV-5: No dominated options ───────────────────────────────────────────

describe("INV-5: no dominated options", () => {
  it("every option in every sampled decision is selectable by random heuristic", () => {
    // Sample all 5 rounds from templates and verify all option indices are reached.
    // 200 picks per decision far exceeds what's needed to see all options with high probability
    // (worst case: 2 options → P(miss) = (1/2)^200 ≈ 0).
    const PICKS_PER_DECISION = 200;
    const dominated: string[] = [];

    const rounds = sampleAllRounds();
    for (const round of rounds) {
      const allDecisions = [...round.individual, ...round.team];
      for (const decision of allDecisions) {
        const decisionLabel = decision.prompt ?? `round ${round.round}`;
        if (decision.options.length === 0) {
          dominated.push(`${decisionLabel}: empty options array`);
          continue;
        }
        const seen = new Set<number>();
        for (let i = 0; i < PICKS_PER_DECISION; i++) {
          const picked = pickOption(decision.options, "random");
          const idx = decision.options.indexOf(picked);
          seen.add(idx);
        }
        for (let i = 0; i < decision.options.length; i++) {
          if (!seen.has(i)) {
            dominated.push(`${decisionLabel} option[${i}] never selected in ${PICKS_PER_DECISION} picks`);
          }
        }
      }
    }

    expect(dominated).toEqual([]);
  });
});
