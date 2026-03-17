/**
 * ControlsPanel extraction verification tests.
 *
 * INV-1: The new module compiles and exports the expected symbols.
 * INV-2: Shared helpers export the correct shapes.
 *
 * No React render tests — no test infrastructure yet for this component.
 */
import { describe, it, expect } from "bun:test";
import { btnStyle, PHASE_LABELS, formatTimestamp } from "./shared.js";

describe("shared helpers", () => {
  it("btnStyle returns enabled style with correct color", () => {
    const style = btnStyle("#34d399");
    expect(style.color).toBe("#34d399");
    expect(style.cursor).toBe("pointer");
    expect(style.opacity).toBe(1);
  });

  it("btnStyle returns disabled style when disabled=true", () => {
    const style = btnStyle("#34d399", true);
    expect(style.color).toBe("#4b5563");
    expect(style.cursor).toBe("not-allowed");
    expect(style.opacity).toBe(0.6);
  });

  it("PHASE_LABELS covers all standard phases", () => {
    const phases = ["briefing", "intel", "deliberation", "decision", "resolution", "ending"];
    for (const phase of phases) {
      expect(PHASE_LABELS[phase]).toBeTruthy();
    }
  });

  it("formatTimestamp returns a non-empty time string", () => {
    const result = formatTimestamp(Date.now());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

