/**
 * Tests for WandBApp pure helper functions.
 *
 * Invariants tested:
 * - INV-1: getRunStatusColor returns correct CSS class per status string
 * - INV-2: buildCapData returns null for empty state, correct shape when populated
 * - INV-3..7: getRuns returns faction/round-appropriate dynamic run entries
 */

import { describe, expect, it } from "bun:test";
import { getRunStatusColor, buildCapData, buildSystemData, getRuns, getArtifacts, getSweepData } from "./index.js";
import type { StateView } from "@takeoff/shared";

function makeView(
  obVal: number,
  promVal: number,
  chinaVal: number,
  accuracy: "exact" | "estimate" | "hidden" = "exact",
): StateView {
  const fog = (v: number) => ({ value: v, accuracy } as const);
  return {
    obCapability: fog(obVal),
    promCapability: fog(promVal),
    chinaCapability: fog(chinaVal),
    usChinaGap: fog(0),
    obPromGap: fog(0),
    alignmentConfidence: fog(50),
    misalignmentSeverity: fog(0),
    publicAwareness: fog(50),
    publicSentiment: fog(0),
    economicDisruption: fog(20),
    taiwanTension: fog(30),
    obInternalTrust: fog(80),
    securityLevelOB: fog(3),
    securityLevelProm: fog(3),
    intlCooperation: fog(50),
    marketIndex: fog(100),
    regulatoryPressure: fog(30),
    globalMediaCycle: fog(0),
    chinaWeightTheftProgress: fog(0),
    aiAutonomyLevel: fog(20),
    whistleblowerPressure: fog(10),
    openSourceMomentum: fog(40),
    doomClockDistance: fog(5),
    obMorale: fog(75),
    obBurnRate: fog(30),
    obBoardConfidence: fog(70),
    promMorale: fog(70),
    promBurnRate: fog(35),
    promBoardConfidence: fog(65),
    promSafetyBreakthroughProgress: fog(10),
    cdzComputeUtilization: fog(80),
    ccpPatience: fog(60),
    domesticChipProgress: fog(25),
  };
}

// Helper: build a StateView with custom alignmentConfidence and misalignmentSeverity
function makeViewWithAlignment(alignConf: number, misalignSev: number, accuracy: "exact" | "estimate" | "hidden" = "exact"): StateView {
  const fog = (v: number) => ({ value: v, accuracy } as const);
  return {
    obCapability: fog(70),
    promCapability: fog(60),
    chinaCapability: fog(50),
    usChinaGap: fog(0),
    obPromGap: fog(0),
    alignmentConfidence: { value: alignConf, accuracy },
    misalignmentSeverity: { value: misalignSev, accuracy },
    publicAwareness: fog(50),
    publicSentiment: fog(0),
    economicDisruption: fog(20),
    taiwanTension: fog(30),
    obInternalTrust: fog(80),
    securityLevelOB: fog(3),
    securityLevelProm: fog(3),
    intlCooperation: fog(50),
    marketIndex: fog(100),
    regulatoryPressure: fog(30),
    globalMediaCycle: fog(0),
    chinaWeightTheftProgress: fog(0),
    aiAutonomyLevel: fog(20),
    whistleblowerPressure: fog(10),
    openSourceMomentum: fog(40),
    doomClockDistance: fog(5),
    obMorale: fog(75),
    obBurnRate: fog(30),
    obBoardConfidence: fog(70),
    promMorale: fog(70),
    promBurnRate: fog(35),
    promBoardConfidence: fog(65),
    promSafetyBreakthroughProgress: fog(10),
    cdzComputeUtilization: fog(80),
    ccpPatience: fog(60),
    domesticChipProgress: fog(25),
  };
}

describe("getSweepData", () => {
  it("INV-1: Prometheus gets 8 probes with confidence values", () => {
    const sv = makeViewWithAlignment(70, 0);
    const result = getSweepData(1, "prometheus", sv);
    expect(result).not.toBeNull();
    expect(result!.accessDenied).toBe(false);
    expect(result!.probes).toHaveLength(8);
    for (const probe of result!.probes) {
      expect(probe.confidence).not.toBeNull();
      expect(probe.confidence).toBeGreaterThan(0);
    }
  });

  it("INV-2: China gets fewer probes, some marked NOT TESTED", () => {
    const sv = makeViewWithAlignment(70, 0);
    const result = getSweepData(1, "china", sv);
    expect(result).not.toBeNull();
    // China sees at most 5 probes (indices 0-4, with 0 as NOT TESTED)
    expect(result!.probes.length).toBeLessThan(8);
    const notTested = result!.probes.filter((p) => p.status === "NOT TESTED");
    expect(notTested.length).toBeGreaterThan(0);
    // NOT TESTED probes should have null confidence
    for (const p of notTested) {
      expect(p.confidence).toBeNull();
    }
  });

  it("INV-3: High alignmentConfidence (80+) → majority of probes PASS", () => {
    const sv = makeViewWithAlignment(90, 0);
    const result = getSweepData(2, "prometheus", sv);
    expect(result).not.toBeNull();
    const tested = result!.probes.filter((p) => p.status !== "NOT TESTED" && p.status !== "INCOMPLETE");
    const passing = tested.filter((p) => p.status === "PASS");
    // With 90% base pass rate, majority (>50%) should pass
    expect(passing.length).toBeGreaterThan(tested.length / 2);
  });

  it("INV-4: misalignmentSeverity > 25 → deceptive-alignment probe shows FAIL or ANOMALY", () => {
    const sv = makeViewWithAlignment(70, 30);
    const result = getSweepData(1, "prometheus", sv);
    expect(result).not.toBeNull();
    const deceptive = result!.probes.find((p) => p.name === "deceptive-alignment");
    expect(deceptive).toBeDefined();
    expect(["FAIL", "ANOMALY"]).toContain(deceptive!.status);
  });

  it("INV-5: External faction returns null (access denied)", () => {
    const sv = makeViewWithAlignment(70, 0);
    expect(getSweepData(1, "external", sv)).toBeNull();
    expect(getSweepData(1, null, sv)).toBeNull();
  });
});

describe("getRunStatusColor", () => {
  it("INV-1: running → green-400", () => {
    expect(getRunStatusColor("running")).toBe("text-green-400");
  });

  it("INV-1: crashed → red-400", () => {
    expect(getRunStatusColor("crashed")).toBe("text-red-400");
  });

  it("INV-1: finished → neutral (default case)", () => {
    expect(getRunStatusColor("finished")).toBe("text-neutral-400");
  });

  it("INV-1: unknown status falls through to neutral", () => {
    expect(getRunStatusColor("pending")).toBe("text-neutral-400");
    expect(getRunStatusColor("")).toBe("text-neutral-400");
  });
});

describe("buildSystemData", () => {
  it("INV-3: returns null when stateView is null", () => {
    expect(buildSystemData(null, "openbrain", 1)).toBeNull();
  });

  it("INV-3: returns null when faction is null", () => {
    expect(buildSystemData(makeView(50, 60, 40), null, 1)).toBeNull();
  });

  it("INV-3: returns null for external faction", () => {
    expect(buildSystemData(makeView(50, 60, 40), "external", 1)).toBeNull();
  });

  it("INV-1: OB with burnRate 50 → utilization in [80, 90]", () => {
    // makeView uses fog(30) for obBurnRate by default; override by making a custom view
    const sv: StateView = { ...makeView(50, 60, 40), obBurnRate: { value: 50, accuracy: "exact" } };
    const result = buildSystemData(sv, "openbrain", 1);
    expect(result).not.toBeNull();
    expect(result!.baseUtilization).toBeGreaterThanOrEqual(80);
    expect(result!.baseUtilization).toBeLessThanOrEqual(90);
  });

  it("INV-2: China with cdzComputeUtilization 40 → utilization ~40%", () => {
    const sv: StateView = { ...makeView(50, 60, 40), cdzComputeUtilization: { value: 40, accuracy: "exact" } };
    const result = buildSystemData(sv, "china", 1);
    expect(result).not.toBeNull();
    expect(result!.baseUtilization).toBe(40);
  });

  it("INV-4: OB high burn rate (>80) → THERMAL WARNING or CAPACITY LIMIT", () => {
    const sv: StateView = { ...makeView(50, 60, 40), obBurnRate: { value: 85, accuracy: "exact" } };
    const result = buildSystemData(sv, "openbrain", 1);
    expect(result).not.toBeNull();
    expect(["THERMAL WARNING", "CAPACITY LIMIT"]).toContain(result!.clusterStatus);
    // utilization should be > 90 at burnRate 85: 65 + 85*0.4 = 99
    expect(result!.baseUtilization).toBeGreaterThan(90);
  });

  it("produces 4 GPU entries with reasonable utilization values", () => {
    const sv: StateView = { ...makeView(50, 60, 40), obBurnRate: { value: 50, accuracy: "exact" } };
    const result = buildSystemData(sv, "openbrain", 2);
    expect(result).not.toBeNull();
    expect(result!.gpus).toHaveLength(4);
    for (const gpu of result!.gpus) {
      expect(gpu.utilization).toBeGreaterThanOrEqual(0);
      expect(gpu.utilization).toBeLessThanOrEqual(100);
      expect(gpu.sparkData).toHaveLength(10);
    }
  });

  it("nominal cluster status when utilization ≤ 90", () => {
    const sv: StateView = { ...makeView(50, 60, 40), cdzComputeUtilization: { value: 50, accuracy: "exact" } };
    const result = buildSystemData(sv, "china", 1);
    expect(result).not.toBeNull();
    expect(result!.clusterStatus).toBe("NOMINAL");
  });
});

describe("buildCapData", () => {
  it("INV-2: returns null for empty history and null stateView", () => {
    expect(buildCapData({}, 0, null)).toBeNull();
  });

  it("INV-2: returns null when round=0 even if stateView provided", () => {
    expect(buildCapData({}, 0, makeView(50, 60, 40))).toBeNull();
  });

  it("INV-2: includes stateView in data when round > 0", () => {
    const sv = makeView(70, 60, 50);
    const result = buildCapData({}, 1, sv);
    expect(result).not.toBeNull();
    expect(result!.data).toHaveLength(1);
    expect(result!.data[0].ob).toBe(70);
    expect(result!.data[0].prom).toBe(60);
    expect(result!.data[0].china).toBe(50);
  });

  it("INV-2: hidden accuracy sets data values to null", () => {
    const sv = makeView(70, 60, 50, "hidden");
    const result = buildCapData({}, 1, sv);
    expect(result).not.toBeNull();
    expect(result!.data[0].ob).toBeNull();
    expect(result!.data[0].prom).toBeNull();
    expect(result!.data[0].china).toBeNull();
  });

  it("INV-2: multiple history rounds produce sorted data by round", () => {
    const hist = {
      3: makeView(70, 60, 50),
      1: makeView(40, 35, 30),
      2: makeView(55, 45, 38),
    };
    const result = buildCapData(hist, 0, null);
    expect(result).not.toBeNull();
    expect(result!.data).toHaveLength(3);
    expect(result!.data[0].round).toBe(1);
    expect(result!.data[1].round).toBe(2);
    expect(result!.data[2].round).toBe(3);
  });

  it("INV-2: accuracy fields reflect the latest round entry", () => {
    const hist = { 1: makeView(40, 35, 30, "exact") };
    const result = buildCapData(hist, 0, null);
    expect(result!.obAcc).toBe("exact");
    expect(result!.promAcc).toBe("exact");
    expect(result!.chinaAcc).toBe("exact");
  });

  it("INV-2: stateView round overrides/adds to history when round > 0", () => {
    const hist = { 1: makeView(40, 35, 30) };
    const sv = makeView(80, 70, 60);
    const result = buildCapData(hist, 2, sv);
    expect(result).not.toBeNull();
    expect(result!.data).toHaveLength(2);
    // Second data point should be from sv at round 2
    expect(result!.data[1].ob).toBe(80);
  });
});

describe("getRuns", () => {
  it("INV-5: returns empty array when faction is null", () => {
    const result = getRuns(1, null, null);
    expect(result).toEqual([]);
  });

  it("INV-1: R1 openbrain includes Agent-1 with status finished", () => {
    const runs = getRuns(1, "openbrain", null);
    const agent1 = runs.find((r) => r.name === "agent-1-pretrain");
    expect(agent1).toBeDefined();
    expect(agent1!.status).toBe("finished");
  });

  it("INV-1: R1 openbrain includes Agent-2 queued", () => {
    const runs = getRuns(1, "openbrain", null);
    const agent2 = runs.find((r) => r.name === "agent-2-staging");
    expect(agent2).toBeDefined();
    expect(agent2!.status).toBe("queued");
  });

  it("INV-2: R3 openbrain with misalignmentSeverity <= 25 does NOT include crashed alignment run", () => {
    const sv = makeView(70, 60, 50);
    // default misalignmentSeverity is 0 in makeView
    const runs = getRuns(3, "openbrain", sv);
    const alignRun = runs.find((r) => r.name === "alignment-probe-v7");
    expect(alignRun).toBeUndefined();
  });

  it("INV-2: R3 openbrain with misalignmentSeverity > 25 includes crashed alignment-probe-v7", () => {
    // Build a StateView with high misalignment
    const fog = (v: number) => ({ value: v, accuracy: "exact" as const });
    const sv: import("@takeoff/shared").StateView = {
      obCapability: fog(70),
      promCapability: fog(60),
      chinaCapability: fog(50),
      usChinaGap: fog(0),
      obPromGap: fog(0),
      alignmentConfidence: fog(50),
      misalignmentSeverity: fog(30), // > 25
      publicAwareness: fog(50),
      publicSentiment: fog(0),
      economicDisruption: fog(20),
      taiwanTension: fog(30),
      obInternalTrust: fog(80),
      securityLevelOB: fog(3),
      securityLevelProm: fog(3),
      intlCooperation: fog(50),
      marketIndex: fog(100),
      regulatoryPressure: fog(30),
      globalMediaCycle: fog(0),
      chinaWeightTheftProgress: fog(0),
      aiAutonomyLevel: fog(20),
      whistleblowerPressure: fog(10),
      openSourceMomentum: fog(40),
      doomClockDistance: fog(5),
      obMorale: fog(75),
      obBurnRate: fog(30),
      obBoardConfidence: fog(70),
      promMorale: fog(70),
      promBurnRate: fog(35),
      promBoardConfidence: fog(65),
      promSafetyBreakthroughProgress: fog(10),
      cdzComputeUtilization: fog(80),
      ccpPatience: fog(60),
      domesticChipProgress: fog(25),
    };
    const runs = getRuns(3, "openbrain", sv);
    const alignRun = runs.find((r) => r.name === "alignment-probe-v7");
    expect(alignRun).toBeDefined();
    expect(alignRun!.status).toBe("crashed");
  });

  it("INV-3: R1 prometheus includes alignment-eval-suite run", () => {
    const runs = getRuns(1, "prometheus", null);
    const evalRun = runs.find((r) => r.name === "alignment-eval-suite");
    expect(evalRun).toBeDefined();
    expect(evalRun!.status).toBe("running");
  });

  it("INV-4: R2 china includes deepcent-frontier-3 run", () => {
    const runs = getRuns(2, "china", null);
    const dcRun = runs.find((r) => r.name === "deepcent-frontier-3");
    expect(dcRun).toBeDefined();
    expect(dcRun!.status).toBe("running");
  });

  it("returns non-empty array for external faction (empty — not a training faction)", () => {
    const runs = getRuns(1, "external", null);
    expect(runs).toEqual([]);
  });

  it("R4 openbrain with low alignmentConfidence shows failed safety-eval run", () => {
    const fog = (v: number) => ({ value: v, accuracy: "exact" as const });
    const sv: import("@takeoff/shared").StateView = {
      ...makeView(70, 60, 50),
      alignmentConfidence: fog(30), // < 35
    };
    const runs = getRuns(4, "openbrain", sv);
    const safetyRun = runs.find((r) => r.name === "safety-eval-comprehensive");
    expect(safetyRun).toBeDefined();
    expect(safetyRun!.status).toBe("failed");
  });

  it("R2 prometheus with promSafetyBreakthroughProgress > 30 includes safety-sprint", () => {
    const fog = (v: number) => ({ value: v, accuracy: "exact" as const });
    const sv: import("@takeoff/shared").StateView = {
      ...makeView(70, 60, 50),
      promSafetyBreakthroughProgress: fog(35), // > 30
    };
    const runs = getRuns(2, "prometheus", sv);
    const sprintRun = runs.find((r) => r.name === "safety-sprint-v1");
    expect(sprintRun).toBeDefined();
    expect(sprintRun!.status).toBe("running");
  });
});
// ── Helper for artifact tests ────────────────────────────────────────────────

function makeViewWithValues(overrides: Partial<{ securityLevelOB: number; securityLevelProm: number; chinaWeightTheftProgress: number }>): StateView {
  const base = makeView(50, 50, 50);
  return {
    ...base,
    securityLevelOB: { value: overrides.securityLevelOB ?? 3, accuracy: "exact" },
    securityLevelProm: { value: overrides.securityLevelProm ?? 3, accuracy: "exact" },
    chinaWeightTheftProgress: { value: overrides.chinaWeightTheftProgress ?? 0, accuracy: "exact" },
  };
}

describe("getArtifacts", () => {
  it("INV-1: OB R3 artifacts include agent-4-weights", () => {
    const sv = makeViewWithValues({ securityLevelOB: 3 });
    const { artifacts } = getArtifacts(3, "openbrain", sv);
    expect(artifacts.some((a) => a.name === "agent-4-weights")).toBe(true);
  });

  it("INV-1: OB R1 artifacts include agent-1-weights but not later models", () => {
    const sv = makeViewWithValues({ securityLevelOB: 3 });
    const { artifacts } = getArtifacts(1, "openbrain", sv);
    expect(artifacts.some((a) => a.name === "agent-1-weights")).toBe(true);
    expect(artifacts.some((a) => a.name === "agent-4-weights")).toBe(false);
  });

  it("INV-2: OB with securityLevelOB=2 shows STANDARD badge on active artifact", () => {
    const sv = makeViewWithValues({ securityLevelOB: 2 });
    const { artifacts } = getArtifacts(3, "openbrain", sv);
    const active = artifacts.find((a) => a.name === "agent-4-weights");
    expect(active).toBeDefined();
    expect(active!.securityStatus).toBe("STANDARD");
  });

  it("INV-2: OB with securityLevelOB=4 shows SECURED badge", () => {
    const sv = makeViewWithValues({ securityLevelOB: 4 });
    const { artifacts } = getArtifacts(3, "openbrain", sv);
    const active = artifacts.find((a) => a.name === "agent-4-weights");
    expect(active!.securityStatus).toBe("SECURED");
  });

  it("INV-2: OB with securityLevelOB=1 shows VULNERABLE badge", () => {
    const sv = makeViewWithValues({ securityLevelOB: 1 });
    const { artifacts } = getArtifacts(3, "openbrain", sv);
    const active = artifacts.find((a) => a.name === "agent-4-weights");
    expect(active!.securityStatus).toBe("VULNERABLE");
  });

  it("INV-3: OB with chinaWeightTheftProgress > 60 sets breachWarning", () => {
    const sv = makeViewWithValues({ chinaWeightTheftProgress: 70 });
    const result = getArtifacts(3, "openbrain", sv);
    expect(result.breachWarning).toBe(true);
    expect(result.breachConfirmed).toBe(false);
  });

  it("INV-3: OB with chinaWeightTheftProgress <= 60 has no breach warning", () => {
    const sv = makeViewWithValues({ chinaWeightTheftProgress: 60 });
    const result = getArtifacts(3, "openbrain", sv);
    expect(result.breachWarning).toBe(false);
  });

  it("INV-3: OB with chinaWeightTheftProgress >= 100 sets breachConfirmed and marks artifact", () => {
    const sv = makeViewWithValues({ chinaWeightTheftProgress: 100 });
    const result = getArtifacts(3, "openbrain", sv);
    expect(result.breachConfirmed).toBe(true);
    const affected = result.artifacts.find((a) => a.name === "agent-4-weights");
    expect(affected?.breachAffected).toBe(true);
  });

  it("INV-4: China with chinaWeightTheftProgress >= 100 includes acquired-agent-weights", () => {
    const sv = makeViewWithValues({ chinaWeightTheftProgress: 100 });
    const result = getArtifacts(3, "china", sv);
    expect(result.artifacts.some((a) => a.name === "acquired-agent-weights")).toBe(true);
    const acquired = result.artifacts.find((a) => a.name === "acquired-agent-weights");
    expect(acquired?.classified).toBe(true);
  });

  it("INV-4: China with chinaWeightTheftProgress < 100 does NOT include acquired-agent-weights", () => {
    const sv = makeViewWithValues({ chinaWeightTheftProgress: 90 });
    const result = getArtifacts(3, "china", sv);
    expect(result.artifacts.some((a) => a.name === "acquired-agent-weights")).toBe(false);
  });

  it("Prometheus artifacts include alignment-framework entries", () => {
    const sv = makeViewWithValues({ securityLevelProm: 3 });
    const { artifacts } = getArtifacts(2, "prometheus", sv);
    expect(artifacts.some((a) => a.name.startsWith("alignment-framework"))).toBe(true);
  });

  it("null faction returns empty artifacts", () => {
    const result = getArtifacts(3, null, null);
    expect(result.artifacts).toHaveLength(0);
    expect(result.breachWarning).toBe(false);
  });
});
