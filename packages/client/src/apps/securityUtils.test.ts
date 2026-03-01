/**
 * Tests for SecurityApp pure helper functions.
 *
 * Invariants tested:
 * - INV-1: computeSecLevel reflects stateView when available
 * - INV-2: filterAlerts reduces visible alerts to matching severity
 * - INV-3: toggleAlertExpand toggles correctly (second click collapses)
 */

import { describe, expect, it } from "bun:test";
import { computeSecLevel, filterAlerts, toggleAlertExpand } from "./securityUtils.js";
import type { StateView } from "@takeoff/shared";

// Helper to build a minimal StateView stub
function makeView(secLevelOB: number, secLevelProm: number, accuracy: "exact" | "estimate" | "hidden" = "exact"): StateView {
  const fog = (v: number) => ({ value: v, accuracy } as const);
  return {
    obCapability: fog(50),
    promCapability: fog(50),
    chinaCapability: fog(50),
    usChinaGap: fog(0),
    obPromGap: fog(0),
    alignmentConfidence: fog(50),
    misalignmentSeverity: fog(0),
    publicAwareness: fog(50),
    publicSentiment: fog(0),
    economicDisruption: fog(20),
    taiwanTension: fog(30),
    obInternalTrust: fog(80),
    securityLevelOB: { value: secLevelOB, accuracy },
    securityLevelProm: { value: secLevelProm, accuracy },
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

describe("computeSecLevel", () => {
  it("INV-1: returns 3 when stateView is null (default)", () => {
    expect(computeSecLevel(null, null)).toBe(3);
    expect(computeSecLevel(null, "openbrain")).toBe(3);
  });

  it("INV-1: reads securityLevelOB for openbrain faction", () => {
    const sv = makeView(4, 2);
    expect(computeSecLevel(sv, "openbrain")).toBe(4);
  });

  it("INV-1: reads securityLevelOB for null faction (default to OB)", () => {
    const sv = makeView(2, 5);
    expect(computeSecLevel(sv, null)).toBe(2);
  });

  it("INV-1: reads securityLevelProm for prometheus faction", () => {
    const sv = makeView(1, 5);
    expect(computeSecLevel(sv, "prometheus")).toBe(5);
  });

  it("INV-1: returns 3 when field is hidden", () => {
    const sv = makeView(5, 5, "hidden");
    expect(computeSecLevel(sv, "openbrain")).toBe(3);
    expect(computeSecLevel(sv, "prometheus")).toBe(3);
  });

  it("INV-1: clamps value to 1-5 range", () => {
    const sv = makeView(0, 10);
    expect(computeSecLevel(sv, "openbrain")).toBe(1);
    expect(computeSecLevel(sv, "prometheus")).toBe(5);
  });
});

describe("filterAlerts", () => {
  const alerts = [
    { id: "1", severity: "critical" as const, title: "A", detail: "", time: "", sourceIp: "", destIp: "", ruleId: "", mitre: "" },
    { id: "2", severity: "high" as const, title: "B", detail: "", time: "", sourceIp: "", destIp: "", ruleId: "", mitre: "" },
    { id: "3", severity: "medium" as const, title: "C", detail: "", time: "", sourceIp: "", destIp: "", ruleId: "", mitre: "" },
    { id: "4", severity: "low" as const, title: "D", detail: "", time: "", sourceIp: "", destIp: "", ruleId: "", mitre: "" },
    { id: "5", severity: "info" as const, title: "E", detail: "", time: "", sourceIp: "", destIp: "", ruleId: "", mitre: "" },
    { id: "6", severity: "critical" as const, title: "F", detail: "", time: "", sourceIp: "", destIp: "", ruleId: "", mitre: "" },
  ];

  it("INV-2: null filter returns all alerts", () => {
    expect(filterAlerts(alerts, null)).toHaveLength(6);
  });

  it("INV-2: CRIT filter returns only critical severity alerts", () => {
    const result = filterAlerts(alerts, "CRIT");
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.severity === "critical")).toBe(true);
  });

  it("INV-2: HIGH filter returns only high severity alerts", () => {
    const result = filterAlerts(alerts, "HIGH");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("INV-2: MED filter returns only medium severity alerts", () => {
    const result = filterAlerts(alerts, "MED");
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("medium");
  });

  it("INV-2: LOW filter returns only low severity alerts", () => {
    const result = filterAlerts(alerts, "LOW");
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("low");
  });

  it("INV-2: INFO filter returns only info severity alerts", () => {
    const result = filterAlerts(alerts, "INFO");
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("info");
  });

  it("INV-2: filter on empty list returns empty", () => {
    expect(filterAlerts([], "CRIT")).toHaveLength(0);
  });
});

describe("toggleAlertExpand", () => {
  it("INV-3: expands a collapsed alert (null → id)", () => {
    expect(toggleAlertExpand(null, "a1")).toBe("a1");
  });

  it("INV-3: collapses an expanded alert (second click)", () => {
    expect(toggleAlertExpand("a1", "a1")).toBeNull();
  });

  it("INV-3: switches expansion to a different alert", () => {
    expect(toggleAlertExpand("a1", "a2")).toBe("a2");
  });

  it("INV-3: clicking same id twice toggles back to null", () => {
    const afterFirst = toggleAlertExpand(null, "xyz");
    const afterSecond = toggleAlertExpand(afterFirst, "xyz");
    expect(afterFirst).toBe("xyz");
    expect(afterSecond).toBeNull();
  });
});
