import { describe, expect, it } from "bun:test";
import { computeEndingArcs } from "./endings.js";
import type { StateVariables } from "./types.js";

const BASE_STATE: StateVariables = {
  obCapability: 50,
  promCapability: 45,
  chinaCapability: 40,
  usChinaGap: 5,
  obPromGap: 3,
  alignmentConfidence: 50,
  misalignmentSeverity: 20,
  publicAwareness: 30,
  publicSentiment: 0,
  economicDisruption: 30,
  taiwanTension: 30,
  obInternalTrust: 60,
  securityLevelOB: 3,
  securityLevelProm: 3,
  intlCooperation: 40,
  marketIndex: 50,
  regulatoryPressure: 30,
  globalMediaCycle: 0,
  chinaWeightTheftProgress: 20,
  aiAutonomyLevel: 25,
  whistleblowerPressure: 5,
  openSourceMomentum: 30,
  doomClockDistance: 5,
  obMorale: 75,
  obBurnRate: 20,
  obBoardConfidence: 60,
  promMorale: 60,
  promBurnRate: 20,
  promBoardConfidence: 55,
  promSafetyBreakthroughProgress: 20,
  cdzComputeUtilization: 30,
  ccpPatience: 50,
  domesticChipProgress: 20,
};

// ── INV-1: Every resolver returns a valid result index ───────────────────────

describe("INV-1: resolver bounds", () => {
  it("every arc result is within spectrum bounds for BASE_STATE", () => {
    const arcs = computeEndingArcs(BASE_STATE);
    expect(arcs).toHaveLength(9);
    for (const arc of arcs) {
      expect(arc.result).toBeGreaterThanOrEqual(0);
      expect(arc.result).toBeLessThan(arc.spectrum.length);
    }
  });

  it("every arc has a non-empty narrative matching its result", () => {
    const arcs = computeEndingArcs(BASE_STATE);
    for (const arc of arcs) {
      expect(arc.narrative).toBeTruthy();
      expect(arc.narrative.length).toBeGreaterThan(0);
    }
  });
});

// ── INV-2: Edge cases at min and max produce valid results ───────────────────

describe("INV-2: edge cases at variable extremes", () => {
  const stateKeys = Object.keys(BASE_STATE) as (keyof StateVariables)[];
  const zeroState = Object.fromEntries(stateKeys.map((k) => [k, 0])) as unknown as StateVariables;
  const maxState = Object.fromEntries(stateKeys.map((k) => [k, 100])) as unknown as StateVariables;

  it("all variables at zero: every arc returns a valid index", () => {
    const arcs = computeEndingArcs(zeroState);
    for (const arc of arcs) {
      expect(arc.result).toBeGreaterThanOrEqual(0);
      expect(arc.result).toBeLessThan(arc.spectrum.length);
    }
  });

  it("all variables at 100: every arc returns a valid index", () => {
    const arcs = computeEndingArcs(maxState);
    for (const arc of arcs) {
      expect(arc.result).toBeGreaterThanOrEqual(0);
      expect(arc.result).toBeLessThan(arc.spectrum.length);
    }
  });

  it("doomClockDistance=0 → misaligned (result 0) regardless of alignmentConfidence", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, doomClockDistance: 0, alignmentConfidence: 90, misalignmentSeverity: 0 });
    expect(arcs.find((a) => a.id === "alignment")!.result).toBe(0);
  });

  it("chinaWeightTheftProgress=100 → everything leaked (result 0)", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, chinaWeightTheftProgress: 100 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(0);
  });
});

// ── AI Race: critical paths ──────────────────────────────────────────────────

describe("resolveAiRace: critical paths", () => {
  it("high obCapability (>80) with large gap → OB dominant (result 2), not stalemate", () => {
    // obCapability well above threshold (44), gap well above threshold (0) — clear dominance
    const arcs = computeEndingArcs({ ...BASE_STATE, obCapability: 85, obPromGap: 8, usChinaGap: 5 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(2);
  });

  it("very high absolute obCapability (≥68) wins when Prom is not catching up", () => {
    // obCapability=72 ≥ 68 absolute threshold; obPromGap=5 > 3 so promClosing doesn't fire
    const arcs = computeEndingArcs({ ...BASE_STATE, obCapability: 72, obPromGap: 5, usChinaGap: 5 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(2);
  });

  it("stalemate when OB capability is below threshold and Prom gap is large", () => {
    // obCapability=43 < 44 (obDominant threshold); obPromGap=5 > 3 (promClosing threshold)
    const arcs = computeEndingArcs({ ...BASE_STATE, obCapability: 43, obPromGap: 5, usChinaGap: 5 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(0);
  });

  it("Prometheus closing gap (obPromGap ≤ 3) with modest capability → result 3", () => {
    // obPromGap=2 ≤ 3 AND promCapability=42 ≥ 38 → promClosing fires
    const arcs = computeEndingArcs({ ...BASE_STATE, obPromGap: 2, promCapability: 42, usChinaGap: 5 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(3);
  });

  it("China parity when usChinaGap turns negative → result 1", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, usChinaGap: -3 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(1);
  });

  it("chinaClose takes priority over promClosing when both conditions are true", () => {
    // usChinaGap=-3 → chinaClose, but also promSafetyBreakthrough → promClosing; china wins
    const arcs = computeEndingArcs({ ...BASE_STATE, usChinaGap: -3, promSafetyBreakthroughProgress: 85 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(1);
  });

  it("chinaClose suppresses obDominant: high OB capability with china ahead → result 1", () => {
    // Even with OB dominant conditions met, china parity overrides
    const arcs = computeEndingArcs({ ...BASE_STATE, obCapability: 80, obPromGap: 5, usChinaGap: -3 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(1);
  });
});

// ── Open Source: critical paths ──────────────────────────────────────────────

describe("resolveOpenSource: critical paths", () => {
  it("moderate openSourceMomentum (50-60) → strategic release (result 1), not irrelevant", () => {
    // momentum=52 ≥ 40 threshold → strategic; not caught by low-security path (secOB=3)
    const arcs = computeEndingArcs({ ...BASE_STATE, openSourceMomentum: 52, intlCooperation: 5, securityLevelOB: 3, securityLevelProm: 3 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(1);
  });

  it("low securityLevelOB (≤1) + high momentum → everything leaked (result 0)", () => {
    // Either lab at minimum security with momentum≥25 → uncontrolled release
    const arcs = computeEndingArcs({ ...BASE_STATE, securityLevelOB: 1, securityLevelProm: 3, openSourceMomentum: 30 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(0);
  });

  it("low securityLevelProm (≤1) + high momentum → everything leaked (result 0)", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, securityLevelOB: 3, securityLevelProm: 1, openSourceMomentum: 30 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(0);
  });

  it("low security but momentum below threshold → NOT leaked", () => {
    // sec=1 but momentum=20 < 25 threshold → leaked path doesn't fire
    const arcs = computeEndingArcs({ ...BASE_STATE, securityLevelOB: 1, securityLevelProm: 1, openSourceMomentum: 20, intlCooperation: 5 });
    const result = arcs.find((a) => a.id === "openSource")!.result;
    expect(result).not.toBe(0);
  });

  it("both labs locked down (secOB≥4 AND secProm≥4) → closed won (result 2)", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, securityLevelOB: 4, securityLevelProm: 4, openSourceMomentum: 20, intlCooperation: 5 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(2);
  });

  it("moderate intlCooperation (≥30) → strategic release even without high momentum", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, intlCooperation: 35, openSourceMomentum: 15, securityLevelOB: 3, securityLevelProm: 3 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(1);
  });

  it("low momentum, low cooperation, medium security → irrelevant (result 3)", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, openSourceMomentum: 20, intlCooperation: 20, securityLevelOB: 3, securityLevelProm: 3 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(3);
  });

  it("complete weight theft still takes priority over all other conditions", () => {
    // Even with high security and low momentum, theft=100 → leaked
    const arcs = computeEndingArcs({ ...BASE_STATE, chinaWeightTheftProgress: 100, securityLevelOB: 5, securityLevelProm: 5 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(0);
  });
});
