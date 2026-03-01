/**
 * Tests for BriefingApp fog-of-war formatting utilities.
 *
 * Invariants tested:
 * - INV-2a: hidden variables always render as "CLASSIFIED"
 * - INV-2b: estimate variables render with ~prefix and ±confidence
 * - INV-2c: exact variables render the raw value without decorators
 * - INV-2d: security level keys render as "SL-N" prefix format
 * - INV-2e: gap keys render with sign and "mo" suffix
 */

import { describe, expect, it } from "bun:test";
import { formatFogValue, accuracyColor } from "./briefingUtils.js";

describe("formatFogValue", () => {
  it("INV-2a: hidden variables return CLASSIFIED regardless of value", () => {
    expect(formatFogValue({ value: 87, accuracy: "hidden" }, "alignmentConfidence")).toBe("CLASSIFIED");
    expect(formatFogValue({ value: 0, accuracy: "hidden" }, "obCapability")).toBe("CLASSIFIED");
  });

  it("INV-2c: exact variables return the raw value string", () => {
    expect(formatFogValue({ value: 87, accuracy: "exact" }, "alignmentConfidence")).toBe("87");
    expect(formatFogValue({ value: 42, accuracy: "exact" }, "publicAwareness")).toBe("42");
  });

  it("INV-2b: estimate without confidence returns ~value", () => {
    expect(formatFogValue({ value: 62, accuracy: "estimate" }, "taiwanTension")).toBe("62");
  });

  it("INV-2b: estimate with confidence returns ~value (±N)", () => {
    expect(formatFogValue({ value: 62, accuracy: "estimate", confidence: 12 }, "taiwanTension")).toBe("~62 (±12)");
    expect(formatFogValue({ value: 44, accuracy: "estimate", confidence: 7 }, "intlCooperation")).toBe("~44 (±7)");
  });

  it("INV-2d: securityLevelOB renders as SL-N prefix", () => {
    expect(formatFogValue({ value: 3, accuracy: "exact" }, "securityLevelOB")).toBe("SL-3");
    expect(formatFogValue({ value: 5, accuracy: "exact" }, "securityLevelProm")).toBe("SL-5");
  });

  it("INV-2d: hidden security level still returns CLASSIFIED", () => {
    expect(formatFogValue({ value: 3, accuracy: "hidden" }, "securityLevelOB")).toBe("CLASSIFIED");
  });

  it("INV-2e: gap keys render with sign and mo suffix", () => {
    expect(formatFogValue({ value: 4, accuracy: "exact" }, "obPromGap")).toBe("+4mo");
    expect(formatFogValue({ value: -3, accuracy: "exact" }, "usChinaGap")).toBe("-3mo");
    expect(formatFogValue({ value: 0, accuracy: "exact" }, "obPromGap")).toBe("0mo");
  });

  it("INV-2e: estimated gap includes confidence suffix", () => {
    expect(formatFogValue({ value: 6, accuracy: "estimate", confidence: 3 }, "usChinaGap")).toBe("~+6mo (±3)");
  });
});

describe("accuracyColor", () => {
  it("exact → green class", () => {
    expect(accuracyColor({ value: 50, accuracy: "exact" })).toBe("text-green-400");
  });

  it("estimate → yellow class", () => {
    expect(accuracyColor({ value: 50, accuracy: "estimate" })).toBe("text-yellow-400");
  });

  it("hidden → neutral class", () => {
    expect(accuracyColor({ value: 50, accuracy: "hidden" })).toBe("text-neutral-500");
  });
});
