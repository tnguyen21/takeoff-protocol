/**
 * Tests for ComputeApp pure helper functions.
 *
 * Invariants tested:
 * - INV-2: GPU tile color is correct for each utilization band boundary
 * - INV-2: jobProgressRatio is always in [0, 1]
 * - INV-3: deriveCost scales linearly with burnRate
 */

import { describe, expect, it } from "bun:test";
import { gpuTileColor, parseMinutes, jobProgressRatio, deriveCost } from "./computeUtils.js";

describe("gpuTileColor", () => {
  it("INV-2: 0% returns green", () => {
    expect(gpuTileColor(0)).toBe("#22c55e");
  });

  it("INV-2: 59% returns green (below yellow threshold)", () => {
    expect(gpuTileColor(59)).toBe("#22c55e");
  });

  it("INV-2: 60% returns yellow (at threshold)", () => {
    expect(gpuTileColor(60)).toBe("#eab308");
  });

  it("INV-2: 79% returns yellow (below orange threshold)", () => {
    expect(gpuTileColor(79)).toBe("#eab308");
  });

  it("INV-2: 80% returns orange (at threshold)", () => {
    expect(gpuTileColor(80)).toBe("#f97316");
  });

  it("INV-2: 89% returns orange (below red threshold)", () => {
    expect(gpuTileColor(89)).toBe("#f97316");
  });

  it("INV-2: 90% returns red (at threshold)", () => {
    expect(gpuTileColor(90)).toBe("#ef4444");
  });

  it("INV-2: 100% returns red", () => {
    expect(gpuTileColor(100)).toBe("#ef4444");
  });
});

describe("parseMinutes", () => {
  it("parses hours + minutes string", () => {
    expect(parseMinutes("4h 12m")).toBe(252);
  });

  it("parses hours-only with tilde prefix", () => {
    expect(parseMinutes("~16h")).toBe(960);
  });

  it("parses minutes-only with tilde prefix", () => {
    expect(parseMinutes("~30m")).toBe(30);
  });

  it("parses hours-only without prefix", () => {
    expect(parseMinutes("2h")).toBe(120);
  });

  it("returns 0 for empty string", () => {
    expect(parseMinutes("")).toBe(0);
  });

  it("parses 0h 44m correctly", () => {
    expect(parseMinutes("0h 44m")).toBe(44);
  });
});

describe("jobProgressRatio", () => {
  it("INV-2: returns value between 0 and 1 for normal progress", () => {
    const ratio = jobProgressRatio("4h 12m", "~16h");
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(1);
    // 252/960 ≈ 0.2625
    expect(ratio).toBeCloseTo(0.2625, 3);
  });

  it("INV-2: returns 0 when eta parses to 0", () => {
    expect(jobProgressRatio("0h 0m", "0h")).toBe(0);
  });

  it("INV-2: clamps to 1 when elapsed exceeds eta", () => {
    expect(jobProgressRatio("10h", "~5h")).toBe(1);
  });

  it("INV-2: 0h 44m / ~2h → about 0.367", () => {
    const ratio = jobProgressRatio("0h 44m", "~2h");
    expect(ratio).toBeCloseTo(44 / 120, 3);
  });
});

describe("deriveCost", () => {
  it("INV-3: at burnRate=50, today is $42,800", () => {
    const cost = deriveCost(50);
    expect(cost.today).toBe("$42,800");
  });

  it("INV-3: at burnRate=50, month is ~$1.24M", () => {
    const cost = deriveCost(50);
    // daily=42800, monthly=42800*29=1,241,200 → "$1.24M"
    expect(cost.month).toBe("$1.24M");
  });

  it("INV-3: at burnRate=50, projected is ~$1.38M", () => {
    const cost = deriveCost(50);
    // projected=1,241,200*1.11=1,377,732 → "$1.38M"
    expect(cost.projected).toBe("$1.38M");
  });

  it("INV-3: at burnRate=100, today is $85,600 (double burnRate=50)", () => {
    const cost = deriveCost(100);
    expect(cost.today).toBe("$85,600");
  });

  it("INV-3: burnRate=0 yields $0 today", () => {
    const cost = deriveCost(0);
    expect(cost.today).toBe("$0");
  });

  it("INV-3: all returned fields are non-empty strings starting with $", () => {
    const cost = deriveCost(75);
    expect(cost.today).toMatch(/^\$/);
    expect(cost.month).toMatch(/^\$/);
    expect(cost.projected).toMatch(/^\$/);
  });
});
