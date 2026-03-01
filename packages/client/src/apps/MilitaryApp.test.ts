/**
 * Tests for MilitaryApp pure helper functions.
 *
 * Invariants tested:
 * - INV-1: THREATCON level changes based on taiwanTension value
 * - INV-3: Event log entries have precedence labels (getPrecedenceLabel)
 * - INV-extra: Taiwan Strait Situation and PRC Naval Movements map correctly
 */

import { describe, expect, it } from "bun:test";
import { computeThreatCon, getTaiwanSituation, getPrcNavalMovements, getPrecedenceLabel } from "./militaryUtils.js";

// ── INV-1: computeThreatCon ───────────────────────────────────────────────────

describe("computeThreatCon (INV-1)", () => {
  it("returns level 1 for tension < 30", () => {
    expect(computeThreatCon(0)).toBe(1);
    expect(computeThreatCon(15)).toBe(1);
    expect(computeThreatCon(29)).toBe(1);
  });

  it("returns level 2 for tension 30–49", () => {
    expect(computeThreatCon(30)).toBe(2);
    expect(computeThreatCon(40)).toBe(2);
    expect(computeThreatCon(49)).toBe(2);
  });

  it("returns level 3 for tension 50–69", () => {
    expect(computeThreatCon(50)).toBe(3);
    expect(computeThreatCon(60)).toBe(3);
    expect(computeThreatCon(69)).toBe(3);
  });

  it("returns level 4 for tension 70–84", () => {
    expect(computeThreatCon(70)).toBe(4);
    expect(computeThreatCon(77)).toBe(4);
    expect(computeThreatCon(84)).toBe(4);
  });

  it("returns level 5 for tension >= 85", () => {
    expect(computeThreatCon(85)).toBe(5);
    expect(computeThreatCon(100)).toBe(5);
  });

  it("boundary: tension exactly at 30 is level 2, not level 1", () => {
    expect(computeThreatCon(30)).toBe(2);
  });

  it("boundary: tension exactly at 85 is level 5, not level 4", () => {
    expect(computeThreatCon(85)).toBe(5);
  });
});

// ── getTaiwanSituation ────────────────────────────────────────────────────────

describe("getTaiwanSituation", () => {
  it("low tension → NOMINAL green", () => {
    const result = getTaiwanSituation(20);
    expect(result.value).toBe("NOMINAL");
    expect(result.color).toContain("green");
  });

  it("moderate tension → ELEVATED", () => {
    const result = getTaiwanSituation(40);
    expect(result.value).toBe("ELEVATED");
  });

  it("high tension → CRITICAL red", () => {
    const result = getTaiwanSituation(75);
    expect(result.value).toBe("CRITICAL");
    expect(result.color).toContain("red");
  });

  it("extreme tension → CRISIS red", () => {
    const result = getTaiwanSituation(90);
    expect(result.value).toBe("CRISIS");
    expect(result.color).toContain("red");
  });
});

// ── getPrcNavalMovements ──────────────────────────────────────────────────────

describe("getPrcNavalMovements", () => {
  it("low capability → MONITORING", () => {
    const result = getPrcNavalMovements(25);
    expect(result.value).toBe("MONITORING");
  });

  it("moderate capability → INCREASED", () => {
    const result = getPrcNavalMovements(50);
    expect(result.value).toBe("INCREASED");
  });

  it("high capability → HIGH ALERT", () => {
    const result = getPrcNavalMovements(70);
    expect(result.value).toBe("HIGH ALERT");
    expect(result.color).toContain("red");
  });

  it("boundary: capability exactly at 40 is INCREASED, not MONITORING", () => {
    expect(getPrcNavalMovements(40).value).toBe("INCREASED");
  });
});

// ── INV-3: getPrecedenceLabel ─────────────────────────────────────────────────

describe("getPrecedenceLabel (INV-3)", () => {
  it("critical classification → FLASH with red color", () => {
    const result = getPrecedenceLabel("critical");
    expect(result.label).toBe("FLASH");
    expect(result.labelColor).toContain("red");
  });

  it("context classification → PRIORITY", () => {
    const result = getPrecedenceLabel("context");
    expect(result.label).toBe("PRIORITY");
  });

  it("red-herring classification → ROUTINE", () => {
    const result = getPrecedenceLabel("red-herring");
    expect(result.label).toBe("ROUTINE");
  });

  it("breadcrumb classification → ROUTINE", () => {
    const result = getPrecedenceLabel("breadcrumb");
    expect(result.label).toBe("ROUTINE");
  });

  it("undefined classification → ROUTINE", () => {
    const result = getPrecedenceLabel(undefined);
    expect(result.label).toBe("ROUTINE");
  });
});
