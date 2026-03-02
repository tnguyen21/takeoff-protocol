import { describe, expect, it } from "bun:test";
import { resolveDecisions } from "./resolution.js";
import { computeFogView } from "./fog.js";
import { computeEndingArcs } from "./endings.js";
import type { DecisionOption, GameMessage, NpcPersona, NpcTrigger, StateVariables } from "./types.js";

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
  // Tier 1
  marketIndex: 50,            // neutral — no market bonus/penalty in tests
  regulatoryPressure: 30,
  globalMediaCycle: 0,
  // Tier 2
  chinaWeightTheftProgress: 20,
  aiAutonomyLevel: 25,
  whistleblowerPressure: 5,
  openSourceMomentum: 30,
  doomClockDistance: 5,
  // Tier 3 — OpenBrain
  obMorale: 75,
  obBurnRate: 20,
  obBoardConfidence: 60,
  // Tier 3 — Prometheus
  promMorale: 60,
  promBurnRate: 20,
  promBoardConfidence: 55,
  promSafetyBreakthroughProgress: 20,
  // Tier 3 — China
  cdzComputeUtilization: 30,
  ccpPatience: 50,
  domesticChipProgress: 20,
};

// ── NpcPersona / NpcTrigger / GameMessage.isNpc ───────────────────────────────

describe("NPC types", () => {
  it("GameMessage accepts isNpc flag", () => {
    const msg: GameMessage = {
      id: "m1",
      from: "npc-1",
      fromName: "Director Chen",
      to: null,
      faction: "china",
      content: "Hello",
      timestamp: 1000,
      isTeamChat: false,
      isNpc: true,
    };
    expect(msg.isNpc).toBe(true);
  });

  it("GameMessage.isNpc is optional (defaults to undefined)", () => {
    const msg: GameMessage = {
      id: "m2",
      from: "player-1",
      fromName: "Alice",
      to: null,
      faction: "openbrain",
      content: "Hi",
      timestamp: 2000,
      isTeamChat: false,
    };
    expect(msg.isNpc).toBeUndefined();
  });

  it("NpcPersona holds expected fields", () => {
    const persona: NpcPersona = {
      id: "npc-chen",
      name: "Director Chen",
      subtitle: "China State Security",
      avatarColor: "#c0392b",
      factions: ["china"],
    };
    expect(persona.id).toBe("npc-chen");
    expect(persona.factions).toContain("china");
  });

  it("NpcTrigger with full condition and schedule is valid", () => {
    const trigger: NpcTrigger = {
      id: "trigger-1",
      npcId: "npc-chen",
      content: "The weights have been acquired.",
      condition: {
        variable: "chinaWeightTheftProgress",
        operator: "gte",
        value: 75,
      },
      schedule: {
        round: 3,
        phase: "deliberation",
      },
      target: {
        faction: "china",
        role: "china_director",
      },
    };
    expect(trigger.condition?.variable).toBe("chinaWeightTheftProgress");
    expect(trigger.condition?.operator).toBe("gte");
    expect(trigger.schedule?.round).toBe(3);
    expect(trigger.target.faction).toBe("china");
  });

  it("NpcTrigger condition and schedule are optional", () => {
    const trigger: NpcTrigger = {
      id: "trigger-2",
      npcId: "npc-chen",
      content: "Unconditional message.",
      target: { faction: "china" },
    };
    expect(trigger.condition).toBeUndefined();
    expect(trigger.schedule).toBeUndefined();
  });

  it("NpcTrigger target can be faction-only or role-only", () => {
    const factionOnly: NpcTrigger = {
      id: "t-faction",
      npcId: "npc-1",
      content: "For all of china",
      target: { faction: "china" },
    };
    const roleOnly: NpcTrigger = {
      id: "t-role",
      npcId: "npc-1",
      content: "For the director",
      target: { role: "china_director" },
    };
    expect(factionOnly.target.role).toBeUndefined();
    expect(roleOnly.target.faction).toBeUndefined();
  });
});

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
      // Tier 1
      "marketIndex", "regulatoryPressure", "globalMediaCycle",
      // Tier 2
      "chinaWeightTheftProgress", "aiAutonomyLevel", "whistleblowerPressure",
      "openSourceMomentum", "doomClockDistance",
      // Tier 3
      "obMorale", "obBurnRate", "obBoardConfidence",
      "promMorale", "promBurnRate", "promBoardConfidence", "promSafetyBreakthroughProgress",
      "cdzComputeUtilization", "ccpPatience", "domesticChipProgress",
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

  it("doom clock < 2 forces misaligned outcome regardless of alignmentConfidence", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      alignmentConfidence: 90,
      misalignmentSeverity: 5,
      doomClockDistance: 1,
    };
    const arcs = computeEndingArcs(state);
    const alignmentArc = arcs.find((a) => a.id === "alignment")!;
    expect(alignmentArc.result).toBe(0); // Misaligned and scheming
  });

  it("promSafetyBreakthroughProgress >= 80 enables genuinely aligned outcome", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      promSafetyBreakthroughProgress: 85,
      alignmentConfidence: 65,
      aiAutonomyLevel: 30,
      doomClockDistance: 5,
    };
    const arcs = computeEndingArcs(state);
    const alignmentArc = arcs.find((a) => a.id === "alignment")!;
    expect(alignmentArc.result).toBe(3); // Genuinely aligned
  });

  it("ccpPatience < 20 forces conflict in taiwan arc", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      ccpPatience: 15,
      taiwanTension: 40, // tension not extreme — ccp patience drives it
    };
    const arcs = computeEndingArcs(state);
    const taiwanArc = arcs.find((a) => a.id === "taiwan")!;
    expect(taiwanArc.result).toBe(0); // Full invasion
  });

  it("ccpPatience < 20 forces conflict in usChinaRelations arc", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      ccpPatience: 10,
      intlCooperation: 60,
      taiwanTension: 20,
    };
    const arcs = computeEndingArcs(state);
    const usChinaArc = arcs.find((a) => a.id === "usChinaRelations")!;
    expect(usChinaArc.result).toBe(0); // Active conflict
  });

  it("chinaWeightTheftProgress = 100 enables everything leaked in openSource arc", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      chinaWeightTheftProgress: 100,
    };
    const arcs = computeEndingArcs(state);
    const openSourceArc = arcs.find((a) => a.id === "openSource")!;
    expect(openSourceArc.result).toBe(0); // Everything leaked
  });

  it("promSafetyBreakthroughProgress >= 80 enables safety work saved everyone in prometheusFate", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      promSafetyBreakthroughProgress: 85,
      alignmentConfidence: 70,
      promBoardConfidence: 55,
      promMorale: 70,
    };
    const arcs = computeEndingArcs(state);
    const promArc = arcs.find((a) => a.id === "prometheusFate")!;
    expect(promArc.result).toBe(3); // Safety work saved everyone
  });

  it("high regulatoryPressure with negative sentiment drives riots in publicReaction", () => {
    const state: StateVariables = {
      ...BASE_STATE,
      regulatoryPressure: 80,
      publicSentiment: -50,
      publicAwareness: 70,
    };
    const arcs = computeEndingArcs(state);
    const publicArc = arcs.find((a) => a.id === "publicReaction")!;
    expect(publicArc.result).toBe(0); // Riots and upheaval
  });
});
