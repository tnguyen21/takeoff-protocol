/**
 * Tests for GameStateApp pure utility functions.
 *
 * Invariants tested:
 * - INV-1: getBarColor returns danger colors when thresholds are crossed
 * - INV-2: getBarColor falls back to accuracy-based colors when no danger
 * - INV-3: getDoomLabel returns correct status strings for each value range
 * - INV-4: getDoomColor returns correct hex color for each value range
 * - INV-5: groupStatusColor is green when no variable is in danger zone
 * - INV-5: groupStatusColor is red when a variable is deeply in danger zone
 * - INV-6: computeDelta returns null when either value is hidden
 * - INV-6: computeDelta returns correct signed difference
 */

import { describe, expect, it } from "bun:test";
import { getBarColor, getDoomLabel, getDoomColor, groupStatusColor, computeDelta } from "./gameStateUtils.js";
import type { StateRow } from "./gameStateUtils.js";

// ── getBarColor ────────────────────────────────────────────────────────────────

describe("getBarColor", () => {
  const rowBase = { min: 0, max: 100 };

  it("INV-1: returns bg-red-600 when value is deeply above dangerAbove threshold", () => {
    const row = { ...rowBase, dangerAbove: 60 };
    // severity = (90 - 60) / (100 - 60) = 30/40 = 0.75 → red
    expect(getBarColor("exact", 90, row)).toBe("bg-red-600");
  });

  it("INV-1: returns bg-orange-500 when value is just above dangerAbove threshold", () => {
    const row = { ...rowBase, dangerAbove: 60 };
    // severity = (65 - 60) / (100 - 60) = 5/40 = 0.125 → orange
    expect(getBarColor("exact", 65, row)).toBe("bg-orange-500");
  });

  it("INV-1: returns bg-red-600 when value is deeply below dangerBelow threshold", () => {
    const row = { ...rowBase, dangerBelow: 40, min: 0 };
    // severity = (40 - 5) / (40 - 0) = 35/40 = 0.875 → red
    expect(getBarColor("exact", 5, row)).toBe("bg-red-600");
  });

  it("INV-1: returns bg-orange-500 when value is just below dangerBelow threshold", () => {
    const row = { ...rowBase, dangerBelow: 40, min: 0 };
    // severity = (40 - 35) / (40 - 0) = 5/40 = 0.125 → orange
    expect(getBarColor("exact", 35, row)).toBe("bg-orange-500");
  });

  it("INV-2: hidden accuracy always returns bg-neutral-700", () => {
    const row = { ...rowBase, dangerAbove: 60 };
    expect(getBarColor("hidden", 90, row)).toBe("bg-neutral-700");
  });

  it("INV-2: exact within safe range returns bg-green-500", () => {
    const row = { ...rowBase, dangerAbove: 80 };
    expect(getBarColor("exact", 50, row)).toBe("bg-green-500");
  });

  it("INV-2: estimate within safe range returns bg-yellow-500", () => {
    const row = { ...rowBase };
    expect(getBarColor("estimate", 50, row)).toBe("bg-yellow-500");
  });

  it("INV-1: value exactly at dangerAbove is NOT in danger (boundary)", () => {
    const row = { ...rowBase, dangerAbove: 60 };
    // value must be strictly > dangerAbove
    expect(getBarColor("exact", 60, row)).toBe("bg-green-500");
  });
});

// ── getDoomLabel ──────────────────────────────────────────────────────────────

describe("getDoomLabel", () => {
  it("INV-3: value 5 → STABLE", () => {
    expect(getDoomLabel(5)).toBe("STABLE");
  });

  it("INV-3: value 4 → STABLE", () => {
    expect(getDoomLabel(4)).toBe("STABLE");
  });

  it("INV-3: value 3 → CAUTION", () => {
    expect(getDoomLabel(3)).toBe("CAUTION");
  });

  it("INV-3: value 2 → WARNING", () => {
    expect(getDoomLabel(2)).toBe("WARNING");
  });

  it("INV-3: value 1 → CRITICAL", () => {
    expect(getDoomLabel(1)).toBe("CRITICAL");
  });

  it("INV-3: value 0 → MIDNIGHT", () => {
    expect(getDoomLabel(0)).toBe("MIDNIGHT");
  });

  it("INV-3: value 0.5 → MIDNIGHT (below 1)", () => {
    expect(getDoomLabel(0.5)).toBe("MIDNIGHT");
  });
});

// ── getDoomColor ──────────────────────────────────────────────────────────────

describe("getDoomColor", () => {
  it("INV-4: value >= 4 → green", () => {
    expect(getDoomColor(4)).toBe("#22c55e");
    expect(getDoomColor(5)).toBe("#22c55e");
  });

  it("INV-4: value >= 3 and < 4 → yellow", () => {
    expect(getDoomColor(3)).toBe("#eab308");
    expect(getDoomColor(3.5)).toBe("#eab308");
  });

  it("INV-4: value >= 2 and < 3 → orange", () => {
    expect(getDoomColor(2)).toBe("#f97316");
    expect(getDoomColor(2.9)).toBe("#f97316");
  });

  it("INV-4: value < 2 → red", () => {
    expect(getDoomColor(1)).toBe("#ef4444");
    expect(getDoomColor(0)).toBe("#ef4444");
  });
});

// ── groupStatusColor ──────────────────────────────────────────────────────────

describe("groupStatusColor", () => {
  const safeRows: StateRow[] = [
    { label: "Taiwan Tension", key: "taiwanTension", min: 0, max: 100, group: "geopolitics", dangerAbove: 60 },
    { label: "Alignment Confidence", key: "alignmentConfidence", min: 0, max: 100, group: "safety", dangerBelow: 40 },
  ];

  it("INV-5: all variables in safe range → green", () => {
    const fogMap = {
      taiwanTension: { value: 40, accuracy: "exact" as const },
      alignmentConfidence: { value: 60, accuracy: "exact" as const },
    };
    expect(groupStatusColor(safeRows, fogMap)).toBe("green");
  });

  it("INV-5: one variable just above dangerAbove → yellow", () => {
    const fogMap = {
      taiwanTension: { value: 65, accuracy: "exact" as const },  // just above 60, severity ~0.125
      alignmentConfidence: { value: 60, accuracy: "exact" as const },
    };
    expect(groupStatusColor(safeRows, fogMap)).toBe("yellow");
  });

  it("INV-5: one variable deeply above dangerAbove → red", () => {
    const fogMap = {
      taiwanTension: { value: 90, accuracy: "exact" as const },  // severity = (90-60)/(100-60) = 0.75 → red
      alignmentConfidence: { value: 60, accuracy: "exact" as const },
    };
    expect(groupStatusColor(safeRows, fogMap)).toBe("red");
  });

  it("INV-5: hidden variables are ignored in status calculation", () => {
    const fogMap = {
      taiwanTension: { value: 95, accuracy: "hidden" as const },  // high but hidden
      alignmentConfidence: { value: 60, accuracy: "exact" as const },
    };
    expect(groupStatusColor(safeRows, fogMap)).toBe("green");
  });

  it("INV-5: variable below dangerBelow → yellow", () => {
    const fogMap = {
      taiwanTension: { value: 30, accuracy: "exact" as const },
      alignmentConfidence: { value: 35, accuracy: "exact" as const },  // just below 40
    };
    expect(groupStatusColor(safeRows, fogMap)).toBe("yellow");
  });
});

// ── computeDelta ──────────────────────────────────────────────────────────────

describe("computeDelta", () => {
  it("INV-6: returns null when current is hidden", () => {
    expect(computeDelta(
      { value: 80, accuracy: "hidden" },
      { value: 60, accuracy: "exact" },
    )).toBeNull();
  });

  it("INV-6: returns null when previous is hidden", () => {
    expect(computeDelta(
      { value: 80, accuracy: "exact" },
      { value: 60, accuracy: "hidden" },
    )).toBeNull();
  });

  it("INV-6: returns null when previous is undefined", () => {
    expect(computeDelta(
      { value: 80, accuracy: "exact" },
      undefined,
    )).toBeNull();
  });

  it("INV-6: returns positive delta when value increased", () => {
    expect(computeDelta(
      { value: 75, accuracy: "exact" },
      { value: 60, accuracy: "exact" },
    )).toBe(15);
  });

  it("INV-6: returns negative delta when value decreased", () => {
    expect(computeDelta(
      { value: 40, accuracy: "estimate" },
      { value: 55, accuracy: "exact" },
    )).toBe(-15);
  });

  it("INV-6: returns zero when value unchanged", () => {
    expect(computeDelta(
      { value: 50, accuracy: "exact" },
      { value: 50, accuracy: "exact" },
    )).toBe(0);
  });

  it("INV-6: works with estimate accuracy on current", () => {
    expect(computeDelta(
      { value: 62, accuracy: "estimate" },
      { value: 50, accuracy: "exact" },
    )).toBe(12);
  });
});
