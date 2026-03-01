import { describe, expect, it } from "bun:test";
import { resolveDecisions } from "./resolution.js";
import { computeFogView } from "./fog.js";
import { computeEndingArcs } from "./endings.js";
import type { DecisionOption, StateVariables } from "./types.js";

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
};

// ── resolveDecisions ──────────────────────────────────────────────────────────

describe("resolveDecisions", () => {
  it("does not mutate the input state", () => {
    const frozen = { ...BASE_STATE };
    const option: DecisionOption = {
      id: "opt1",
      label: "Test",
      description: "Test option",
      effects: [{ variable: "obCapability", delta: 10 }],
    };
    resolveDecisions(BASE_STATE, [option]);
    expect(BASE_STATE).toEqual(frozen);
  });

  it("applies positive effects", () => {
    const option: DecisionOption = {
      id: "opt1",
      label: "Test",
      description: "Boost OB",
      effects: [{ variable: "obCapability", delta: 10 }],
    };
    const result = resolveDecisions(BASE_STATE, [option]);
    expect(result.obCapability).toBe(60);
  });

  it("applies negative effects", () => {
    const option: DecisionOption = {
      id: "opt1",
      label: "Test",
      description: "Cut intl",
      effects: [{ variable: "intlCooperation", delta: -20 }],
    };
    const result = resolveDecisions(BASE_STATE, [option]);
    expect(result.intlCooperation).toBe(20);
  });

  it("clamps values at upper bound (100)", () => {
    const option: DecisionOption = {
      id: "opt1",
      label: "Test",
      description: "Overshoot",
      effects: [{ variable: "obCapability", delta: 100 }],
    };
    const result = resolveDecisions(BASE_STATE, [option]);
    expect(result.obCapability).toBe(100);
  });

  it("clamps values at lower bound (0)", () => {
    const option: DecisionOption = {
      id: "opt1",
      label: "Test",
      description: "Undershoot",
      effects: [{ variable: "intlCooperation", delta: -200 }],
    };
    const result = resolveDecisions(BASE_STATE, [option]);
    expect(result.intlCooperation).toBe(0);
  });

  it("applies conditional multiplier when condition is met", () => {
    // obCapability=50 > 40 → condition met → delta * 2 = 20
    const option: DecisionOption = {
      id: "opt1",
      label: "Test",
      description: "Conditional",
      effects: [
        {
          variable: "obCapability",
          delta: 10,
          condition: {
            variable: "obCapability",
            threshold: 40,
            operator: "gt",
            multiplier: 2,
          },
        },
      ],
    };
    const result = resolveDecisions(BASE_STATE, [option]);
    expect(result.obCapability).toBe(70); // 50 + 20
  });

  it("ignores conditional multiplier when condition is not met", () => {
    // obCapability=50 is NOT > 80 → delta stays 10
    const option: DecisionOption = {
      id: "opt1",
      label: "Test",
      description: "Conditional not met",
      effects: [
        {
          variable: "obCapability",
          delta: 10,
          condition: {
            variable: "obCapability",
            threshold: 80,
            operator: "gt",
            multiplier: 3,
          },
        },
      ],
    };
    const result = resolveDecisions(BASE_STATE, [option]);
    expect(result.obCapability).toBe(60); // 50 + 10
  });

  it("applies multiple options in order", () => {
    const options: DecisionOption[] = [
      {
        id: "a",
        label: "A",
        description: "",
        effects: [{ variable: "obCapability", delta: 5 }],
      },
      {
        id: "b",
        label: "B",
        description: "",
        effects: [{ variable: "obCapability", delta: 5 }],
      },
    ];
    const result = resolveDecisions(BASE_STATE, options);
    expect(result.obCapability).toBe(60);
  });
});

// ── computeFogView ────────────────────────────────────────────────────────────

describe("computeFogView", () => {
  it("returns exact values for own capabilities", () => {
    const view = computeFogView(BASE_STATE, "openbrain", "ob_ceo", 1);
    expect(view.obCapability.accuracy).toBe("exact");
    expect(view.obCapability.value).toBe(BASE_STATE.obCapability);
  });

  it("hides variables marked as hidden from faction", () => {
    // obInternalTrust is hidden from prometheus
    const view = computeFogView(BASE_STATE, "prometheus", "prom_ceo", 1);
    expect(view.obInternalTrust.accuracy).toBe("hidden");
    expect(view.obInternalTrust.value).toBe(0);
  });

  it("returns estimate for partially-visible variables", () => {
    // obCapability for prometheus is estimate
    const view = computeFogView(BASE_STATE, "prometheus", "prom_ceo", 1);
    expect(view.obCapability.accuracy).toBe("estimate");
    expect(view.obCapability.confidence).toBeGreaterThan(0);
  });

  it("returns all keys from StateVariables", () => {
    const view = computeFogView(BASE_STATE, "openbrain", "ob_ceo", 1);
    const expectedKeys: (keyof StateVariables)[] = [
      "obCapability", "promCapability", "chinaCapability", "usChinaGap",
      "obPromGap", "alignmentConfidence", "misalignmentSeverity",
      "publicAwareness", "publicSentiment", "economicDisruption",
      "taiwanTension", "obInternalTrust", "securityLevelOB",
      "securityLevelProm", "intlCooperation",
    ];
    for (const key of expectedKeys) {
      expect(view[key]).toBeDefined();
    }
  });
});

// ── computeEndingArcs ─────────────────────────────────────────────────────────

describe("computeEndingArcs", () => {
  it("returns 9 arcs", () => {
    const arcs = computeEndingArcs(BASE_STATE);
    expect(arcs).toHaveLength(9);
  });

  it("every arc has result within spectrum bounds", () => {
    const arcs = computeEndingArcs(BASE_STATE);
    for (const arc of arcs) {
      expect(arc.result).toBeGreaterThanOrEqual(0);
      expect(arc.result).toBeLessThan(arc.spectrum.length);
    }
  });

  it("every arc has a non-empty narrative", () => {
    const arcs = computeEndingArcs(BASE_STATE);
    for (const arc of arcs) {
      expect(arc.narrative.length).toBeGreaterThan(0);
    }
  });

  it("high intlCooperation and low taiwanTension yields good usChinaRelations", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      intlCooperation: 75,
      taiwanTension: 10,
    };
    const arcs = computeEndingArcs(state);
    const usChinaArc = arcs.find((a) => a.id === "usChinaRelations")!;
    expect(usChinaArc.result).toBe(4); // Joint cooperation
  });

  it("very high taiwanTension yields conflict outcome", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      taiwanTension: 90,
    };
    const arcs = computeEndingArcs(state);
    const taiwanArc = arcs.find((a) => a.id === "taiwan")!;
    expect(taiwanArc.result).toBe(0); // Full invasion
  });

  it("good alignment conditions produce aligned outcome", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      alignmentConfidence: 80,
      misalignmentSeverity: 5,
    };
    const arcs = computeEndingArcs(state);
    const alignmentArc = arcs.find((a) => a.id === "alignment")!;
    expect(alignmentArc.result).toBe(3); // Genuinely aligned
  });

  it("economic disruption maps correctly to economy arc", () => {
    const lowDisruption: StateVariables = { ...BASE_STATE, economicDisruption: 20 };
    const highDisruption: StateVariables = { ...BASE_STATE, economicDisruption: 80 };

    const low = computeEndingArcs(lowDisruption).find((a) => a.id === "economy")!;
    const high = computeEndingArcs(highDisruption).find((a) => a.id === "economy")!;

    expect(low.result).toBe(3); // AI-driven boom
    expect(high.result).toBe(0); // Collapse
  });
});
