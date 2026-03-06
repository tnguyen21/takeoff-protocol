import { describe, expect, it } from "bun:test";
import { resolveDecisions } from "./resolution.js";
import { computeFogView } from "./fog.js";
import { computeEndingArcs } from "./endings.js";
import type { DecisionOption, Faction, GameMessage, NpcPersona, NpcTrigger, StateVariables } from "./types.js";

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

  it("keeps estimates within confidence bounds and varies by round", () => {
    const trueValue = BASE_STATE.obCapability;
    const confidence = 15; // from FOG_MATRIX: obCapability → prometheus

    const values = [1, 2, 3, 4, 5].map((round) => {
      const view = computeFogView(BASE_STATE, "prometheus", "prom_ceo", round);
      expect(view.obCapability.accuracy).toBe("estimate");
      expect(view.obCapability.confidence).toBe(confidence);
      return view.obCapability.value;
    });

    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(trueValue - confidence);
      expect(v).toBeLessThanOrEqual(trueValue + confidence);
    }

    expect(new Set(values).size).toBeGreaterThan(1);
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

  // ── INV-1: Determinism ────────────────────────────────────────────────────

  it("INV-1: deterministic — same args produce identical results across all factions", () => {
    const factions: Faction[] = ["openbrain", "prometheus", "china", "external"];
    for (const faction of factions) {
      const view1 = computeFogView(BASE_STATE, faction, "ob_ceo", 3);
      const view2 = computeFogView(BASE_STATE, faction, "ob_ceo", 3);
      const keys = Object.keys(view1) as (keyof StateVariables)[];
      for (const key of keys) {
        expect(view1[key].value).toBe(view2[key].value);
        expect(view1[key].accuracy).toBe(view2[key].accuracy);
      }
    }
  });

  // ── INV-2: Cross-round variation ─────────────────────────────────────────

  it("INV-2: different rounds produce different estimate values for at least some variables", () => {
    // prometheus sees obCapability as estimate(15) — must vary across rounds
    const values = [1, 2, 3, 4, 5].map((round) =>
      computeFogView(BASE_STATE, "prometheus", "prom_ceo", round).obCapability.value,
    );
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  // ── INV-3: Systematic FOG_MATRIX verification for all 4 factions ─────────

  it("INV-3: openbrain sees correct accuracy level for all variables", () => {
    const view = computeFogView(BASE_STATE, "openbrain", "ob_ceo", 1);
    // exact — own capabilities and internal variables
    expect(view.obCapability).toMatchObject({ accuracy: "exact", value: BASE_STATE.obCapability });
    expect(view.obPromGap).toMatchObject({ accuracy: "exact", value: BASE_STATE.obPromGap });
    expect(view.obInternalTrust).toMatchObject({ accuracy: "exact", value: BASE_STATE.obInternalTrust });
    expect(view.securityLevelOB).toMatchObject({ accuracy: "exact", value: BASE_STATE.securityLevelOB });
    expect(view.whistleblowerPressure).toMatchObject({ accuracy: "exact", value: BASE_STATE.whistleblowerPressure });
    expect(view.obMorale).toMatchObject({ accuracy: "exact", value: BASE_STATE.obMorale });
    expect(view.obBurnRate).toMatchObject({ accuracy: "exact", value: BASE_STATE.obBurnRate });
    expect(view.obBoardConfidence).toMatchObject({ accuracy: "exact", value: BASE_STATE.obBoardConfidence });
    // estimate
    expect(view.promCapability).toMatchObject({ accuracy: "estimate", confidence: 15 });
    expect(view.chinaCapability).toMatchObject({ accuracy: "estimate", confidence: 20 });
    expect(view.usChinaGap).toMatchObject({ accuracy: "estimate", confidence: 3 });
    expect(view.alignmentConfidence).toMatchObject({ accuracy: "estimate", confidence: 20 });
    expect(view.misalignmentSeverity).toMatchObject({ accuracy: "estimate", confidence: 25 });
    expect(view.publicAwareness).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.publicSentiment).toMatchObject({ accuracy: "estimate", confidence: 15 });
    expect(view.economicDisruption).toMatchObject({ accuracy: "estimate", confidence: 15 });
    expect(view.securityLevelProm).toMatchObject({ accuracy: "estimate", confidence: 1 });
    expect(view.marketIndex).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.regulatoryPressure).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.globalMediaCycle).toMatchObject({ accuracy: "estimate", confidence: 1 });
    expect(view.aiAutonomyLevel).toMatchObject({ accuracy: "estimate", confidence: 10 });
    // hidden
    expect(view.chinaWeightTheftProgress).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.openSourceMomentum).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.doomClockDistance).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.taiwanTension).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.intlCooperation).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promMorale).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promBurnRate).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promBoardConfidence).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promSafetyBreakthroughProgress).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.cdzComputeUtilization).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.ccpPatience).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.domesticChipProgress).toMatchObject({ accuracy: "hidden", value: 0 });
  });

  it("INV-3: prometheus sees correct accuracy level for all variables", () => {
    const view = computeFogView(BASE_STATE, "prometheus", "prom_ceo", 1);
    // exact — own capabilities and internal variables
    expect(view.promCapability).toMatchObject({ accuracy: "exact", value: BASE_STATE.promCapability });
    expect(view.obPromGap).toMatchObject({ accuracy: "exact", value: BASE_STATE.obPromGap });
    expect(view.alignmentConfidence).toMatchObject({ accuracy: "exact", value: BASE_STATE.alignmentConfidence });
    expect(view.economicDisruption).toMatchObject({ accuracy: "exact", value: BASE_STATE.economicDisruption });
    expect(view.securityLevelProm).toMatchObject({ accuracy: "exact", value: BASE_STATE.securityLevelProm });
    expect(view.promMorale).toMatchObject({ accuracy: "exact", value: BASE_STATE.promMorale });
    expect(view.promBurnRate).toMatchObject({ accuracy: "exact", value: BASE_STATE.promBurnRate });
    expect(view.promBoardConfidence).toMatchObject({ accuracy: "exact", value: BASE_STATE.promBoardConfidence });
    expect(view.promSafetyBreakthroughProgress).toMatchObject({ accuracy: "exact", value: BASE_STATE.promSafetyBreakthroughProgress });
    // estimate
    expect(view.obCapability).toMatchObject({ accuracy: "estimate", confidence: 15 });
    expect(view.usChinaGap).toMatchObject({ accuracy: "estimate", confidence: 4 });
    expect(view.publicAwareness).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.publicSentiment).toMatchObject({ accuracy: "estimate", confidence: 15 });
    expect(view.securityLevelOB).toMatchObject({ accuracy: "estimate", confidence: 1 });
    expect(view.intlCooperation).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.marketIndex).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.regulatoryPressure).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.globalMediaCycle).toMatchObject({ accuracy: "estimate", confidence: 1 });
    expect(view.aiAutonomyLevel).toMatchObject({ accuracy: "estimate", confidence: 10 });
    expect(view.openSourceMomentum).toMatchObject({ accuracy: "estimate", confidence: 10 });
    // hidden
    expect(view.chinaCapability).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obInternalTrust).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.misalignmentSeverity).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.taiwanTension).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.chinaWeightTheftProgress).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.whistleblowerPressure).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.doomClockDistance).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obMorale).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obBurnRate).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obBoardConfidence).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.cdzComputeUtilization).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.ccpPatience).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.domesticChipProgress).toMatchObject({ accuracy: "hidden", value: 0 });
  });

  it("INV-3: china sees correct accuracy level for all variables", () => {
    const view = computeFogView(BASE_STATE, "china", "china_director", 1);
    // exact — own internal variables + geopolitical variables china controls
    expect(view.chinaCapability).toMatchObject({ accuracy: "exact", value: BASE_STATE.chinaCapability });
    expect(view.usChinaGap).toMatchObject({ accuracy: "exact", value: BASE_STATE.usChinaGap });
    expect(view.taiwanTension).toMatchObject({ accuracy: "exact", value: BASE_STATE.taiwanTension });
    expect(view.chinaWeightTheftProgress).toMatchObject({ accuracy: "exact", value: BASE_STATE.chinaWeightTheftProgress });
    expect(view.cdzComputeUtilization).toMatchObject({ accuracy: "exact", value: BASE_STATE.cdzComputeUtilization });
    expect(view.ccpPatience).toMatchObject({ accuracy: "exact", value: BASE_STATE.ccpPatience });
    expect(view.domesticChipProgress).toMatchObject({ accuracy: "exact", value: BASE_STATE.domesticChipProgress });
    // estimate
    expect(view.obCapability).toMatchObject({ accuracy: "estimate", confidence: 25 });
    expect(view.promCapability).toMatchObject({ accuracy: "estimate", confidence: 30 });
    expect(view.obPromGap).toMatchObject({ accuracy: "estimate", confidence: 3 });
    expect(view.publicAwareness).toMatchObject({ accuracy: "estimate", confidence: 15 });
    expect(view.economicDisruption).toMatchObject({ accuracy: "estimate", confidence: 20 });
    expect(view.securityLevelOB).toMatchObject({ accuracy: "estimate", confidence: 1 });
    expect(view.securityLevelProm).toMatchObject({ accuracy: "estimate", confidence: 1 });
    expect(view.intlCooperation).toMatchObject({ accuracy: "estimate", confidence: 10 });
    // hidden
    expect(view.alignmentConfidence).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.misalignmentSeverity).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.publicSentiment).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obInternalTrust).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.marketIndex).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.regulatoryPressure).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.globalMediaCycle).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.aiAutonomyLevel).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.whistleblowerPressure).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.openSourceMomentum).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.doomClockDistance).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obMorale).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obBurnRate).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obBoardConfidence).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promMorale).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promBurnRate).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promBoardConfidence).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promSafetyBreakthroughProgress).toMatchObject({ accuracy: "hidden", value: 0 });
  });

  it("INV-3: external sees correct accuracy level for all variables", () => {
    const view = computeFogView(BASE_STATE, "external", "external_reporter", 1);
    // exact — public-facing variables
    expect(view.publicAwareness).toMatchObject({ accuracy: "exact", value: BASE_STATE.publicAwareness });
    expect(view.publicSentiment).toMatchObject({ accuracy: "exact", value: BASE_STATE.publicSentiment });
    expect(view.economicDisruption).toMatchObject({ accuracy: "exact", value: BASE_STATE.economicDisruption });
    expect(view.intlCooperation).toMatchObject({ accuracy: "exact", value: BASE_STATE.intlCooperation });
    expect(view.marketIndex).toMatchObject({ accuracy: "exact", value: BASE_STATE.marketIndex });
    expect(view.regulatoryPressure).toMatchObject({ accuracy: "exact", value: BASE_STATE.regulatoryPressure });
    expect(view.globalMediaCycle).toMatchObject({ accuracy: "exact", value: BASE_STATE.globalMediaCycle });
    // estimate
    expect(view.usChinaGap).toMatchObject({ accuracy: "estimate", confidence: 4 });
    expect(view.alignmentConfidence).toMatchObject({ accuracy: "estimate", confidence: 25 });
    expect(view.taiwanTension).toMatchObject({ accuracy: "estimate", confidence: 15 });
    expect(view.securityLevelOB).toMatchObject({ accuracy: "estimate", confidence: 1 });
    expect(view.securityLevelProm).toMatchObject({ accuracy: "estimate", confidence: 1 });
    // hidden
    expect(view.obCapability).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promCapability).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.chinaCapability).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obPromGap).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.misalignmentSeverity).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obInternalTrust).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.chinaWeightTheftProgress).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.aiAutonomyLevel).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.whistleblowerPressure).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.openSourceMomentum).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.doomClockDistance).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obMorale).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obBurnRate).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.obBoardConfidence).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promMorale).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promBurnRate).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promBoardConfidence).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.promSafetyBreakthroughProgress).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.cdzComputeUtilization).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.ccpPatience).toMatchObject({ accuracy: "hidden", value: 0 });
    expect(view.domesticChipProgress).toMatchObject({ accuracy: "hidden", value: 0 });
  });

  // ── INV-4: Property test — estimate bounds hold across random states ───────

  it("INV-4: estimate values stay within trueValue ± confidence for 50 random states", () => {
    type EstimateCheck = { key: keyof StateVariables; faction: Faction; confidence: number };
    const estimateChecks: EstimateCheck[] = [
      { key: "obCapability", faction: "prometheus", confidence: 15 },
      { key: "obCapability", faction: "china", confidence: 25 },
      { key: "promCapability", faction: "openbrain", confidence: 15 },
      { key: "promCapability", faction: "china", confidence: 30 },
      { key: "chinaCapability", faction: "openbrain", confidence: 20 },
      { key: "usChinaGap", faction: "openbrain", confidence: 3 },
      { key: "usChinaGap", faction: "prometheus", confidence: 4 },
      { key: "usChinaGap", faction: "external", confidence: 4 },
      { key: "obPromGap", faction: "china", confidence: 3 },
      { key: "alignmentConfidence", faction: "openbrain", confidence: 20 },
      { key: "alignmentConfidence", faction: "external", confidence: 25 },
      { key: "misalignmentSeverity", faction: "openbrain", confidence: 25 },
      { key: "publicAwareness", faction: "openbrain", confidence: 10 },
      { key: "publicAwareness", faction: "china", confidence: 15 },
      { key: "publicSentiment", faction: "openbrain", confidence: 15 },
      { key: "economicDisruption", faction: "openbrain", confidence: 15 },
      { key: "economicDisruption", faction: "china", confidence: 20 },
      { key: "taiwanTension", faction: "external", confidence: 15 },
      { key: "securityLevelOB", faction: "prometheus", confidence: 1 },
      { key: "securityLevelProm", faction: "openbrain", confidence: 1 },
      { key: "intlCooperation", faction: "prometheus", confidence: 10 },
      { key: "intlCooperation", faction: "china", confidence: 10 },
      { key: "marketIndex", faction: "openbrain", confidence: 10 },
      { key: "regulatoryPressure", faction: "openbrain", confidence: 10 },
      { key: "globalMediaCycle", faction: "openbrain", confidence: 1 },
      { key: "aiAutonomyLevel", faction: "openbrain", confidence: 10 },
      { key: "openSourceMomentum", faction: "prometheus", confidence: 10 },
    ];

    const stateKeys = Object.keys(BASE_STATE) as (keyof StateVariables)[];

    for (let i = 0; i < 50; i++) {
      const state = Object.fromEntries(
        stateKeys.map((k) => [k, Math.floor(Math.random() * 101)]),
      ) as StateVariables;
      const round = Math.floor(Math.random() * 10) + 1;

      for (const { key, faction, confidence } of estimateChecks) {
        const view = computeFogView(state, faction, "ob_ceo", round);
        const fv = view[key];
        expect(fv.accuracy).toBe("estimate");
        expect(fv.value).toBeGreaterThanOrEqual(state[key] - confidence);
        expect(fv.value).toBeLessThanOrEqual(state[key] + confidence);
      }
    }
  });

  // ── INV-5: Extreme true values ────────────────────────────────────────────

  it("INV-5: handles extreme true values (0 and 100) without throwing", () => {
    const stateKeys = Object.keys(BASE_STATE) as (keyof StateVariables)[];
    const stateAt0 = Object.fromEntries(stateKeys.map((k) => [k, 0])) as StateVariables;
    const stateAt100 = Object.fromEntries(stateKeys.map((k) => [k, 100])) as StateVariables;
    const factions: Faction[] = ["openbrain", "prometheus", "china", "external"];

    for (const faction of factions) {
      expect(() => computeFogView(stateAt0, faction, "ob_ceo", 1)).not.toThrow();
      expect(() => computeFogView(stateAt100, faction, "ob_ceo", 1)).not.toThrow();
      // hidden variables must always return 0 regardless of true value
      const view0 = computeFogView(stateAt0, faction, "ob_ceo", 1);
      const view100 = computeFogView(stateAt100, faction, "ob_ceo", 1);
      expect(view0.doomClockDistance).toMatchObject({ accuracy: "hidden", value: 0 });
      expect(view100.doomClockDistance).toMatchObject({ accuracy: "hidden", value: 0 });
    }
  });

  // ── Critical paths ────────────────────────────────────────────────────────

  it("critical path: doomClockDistance is hidden from ALL factions", () => {
    const factions: Faction[] = ["openbrain", "prometheus", "china", "external"];
    for (const faction of factions) {
      const view = computeFogView(BASE_STATE, faction, "ob_ceo", 1);
      expect(view.doomClockDistance).toMatchObject({ accuracy: "hidden", value: 0 });
    }
  });

  it("critical path: china sees its own internal variables as exact; other factions see them as hidden", () => {
    const chinaView = computeFogView(BASE_STATE, "china", "china_director", 1);
    expect(chinaView.cdzComputeUtilization).toMatchObject({ accuracy: "exact", value: BASE_STATE.cdzComputeUtilization });
    expect(chinaView.ccpPatience).toMatchObject({ accuracy: "exact", value: BASE_STATE.ccpPatience });
    expect(chinaView.domesticChipProgress).toMatchObject({ accuracy: "exact", value: BASE_STATE.domesticChipProgress });
    expect(chinaView.chinaWeightTheftProgress).toMatchObject({ accuracy: "exact", value: BASE_STATE.chinaWeightTheftProgress });

    const others: Faction[] = ["openbrain", "prometheus", "external"];
    for (const faction of others) {
      const view = computeFogView(BASE_STATE, faction, "ob_ceo", 1);
      expect(view.cdzComputeUtilization).toMatchObject({ accuracy: "hidden", value: 0 });
      expect(view.ccpPatience).toMatchObject({ accuracy: "hidden", value: 0 });
      expect(view.domesticChipProgress).toMatchObject({ accuracy: "hidden", value: 0 });
      expect(view.chinaWeightTheftProgress).toMatchObject({ accuracy: "hidden", value: 0 });
    }
  });

  it("critical path: usChinaGap and obPromGap have correct accuracy per faction", () => {
    const ob = computeFogView(BASE_STATE, "openbrain", "ob_ceo", 1);
    const prom = computeFogView(BASE_STATE, "prometheus", "prom_ceo", 1);
    const china = computeFogView(BASE_STATE, "china", "china_director", 1);
    const ext = computeFogView(BASE_STATE, "external", "external_reporter", 1);

    // usChinaGap: ob=estimate(3), prom=estimate(4), china=exact, external=estimate(4)
    expect(ob.usChinaGap).toMatchObject({ accuracy: "estimate", confidence: 3 });
    expect(prom.usChinaGap).toMatchObject({ accuracy: "estimate", confidence: 4 });
    expect(china.usChinaGap).toMatchObject({ accuracy: "exact", value: BASE_STATE.usChinaGap });
    expect(ext.usChinaGap).toMatchObject({ accuracy: "estimate", confidence: 4 });

    // obPromGap: ob=exact, prom=exact, china=estimate(3), external=hidden
    expect(ob.obPromGap).toMatchObject({ accuracy: "exact", value: BASE_STATE.obPromGap });
    expect(prom.obPromGap).toMatchObject({ accuracy: "exact", value: BASE_STATE.obPromGap });
    expect(china.obPromGap).toMatchObject({ accuracy: "estimate", confidence: 3 });
    expect(ext.obPromGap).toMatchObject({ accuracy: "hidden", value: 0 });
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

  // ── resolveAiRace branch coverage ──────────────────────────────────────────

  it("resolveAiRace: OB dominant when capable, leading prom, china not close", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, obCapability: 70, obPromGap: 5, usChinaGap: 5 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(2);
  });

  it("resolveAiRace: 3-way stalemate when no condition fires", () => {
    // BASE_STATE: obCapability=50 (<65), chinaClose=false, promClosing=false → result 0
    const arcs = computeEndingArcs(BASE_STATE);
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(0);
  });

  it("resolveAiRace: China parity via high compute + chip independence", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, usChinaGap: 0, cdzComputeUtilization: 85, domesticChipProgress: 65 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(1);
  });

  it("resolveAiRace: Prometheus leads via safety breakthrough", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, promSafetyBreakthroughProgress: 85 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(3);
  });

  it("resolveAiRace: Prometheus leads via gap closure", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, obPromGap: 0, promCapability: 60 });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(3);
  });

  it("resolveAiRace: chinaClose takes priority over promClosing (returns 1 not 3)", () => {
    // Both chinaClose and promClosing are true; china check comes first → 1
    const arcs = computeEndingArcs({
      ...BASE_STATE,
      usChinaGap: -3, // chinaClose
      promSafetyBreakthroughProgress: 85, // promClosing
    });
    expect(arcs.find((a) => a.id === "aiRace")!.result).toBe(1);
  });

  // ── resolveAlignment branch coverage ───────────────────────────────────────

  it("resolveAlignment: doomClockDistance=2 is NOT misaligned (boundary)", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, doomClockDistance: 2 });
    expect(arcs.find((a) => a.id === "alignment")!.result).not.toBe(0);
  });

  it("resolveAlignment: superficial alignment from moderate confidence + high severity", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, alignmentConfidence: 30, misalignmentSeverity: 55 });
    expect(arcs.find((a) => a.id === "alignment")!.result).toBe(1);
  });

  it("resolveAlignment: aligned to oversight from moderate confidence + low severity", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, alignmentConfidence: 55, misalignmentSeverity: 30, aiAutonomyLevel: 60 });
    expect(arcs.find((a) => a.id === "alignment")!.result).toBe(2);
  });

  it("resolveAlignment: full misaligned fallthrough when confidence low and severity high", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, alignmentConfidence: 20, misalignmentSeverity: 70 });
    expect(arcs.find((a) => a.id === "alignment")!.result).toBe(0);
  });

  // ── resolveControl branch coverage ─────────────────────────────────────────

  it("resolveControl: distributed/democratic when cooperation+trust both high", () => {
    const arcs = computeEndingArcs({
      ...BASE_STATE,
      intlCooperation: 65,
      obInternalTrust: 65,
      obBoardConfidence: 55,
      promBoardConfidence: 55,
      aiAutonomyLevel: 50,
    });
    expect(arcs.find((a) => a.id === "control")!.result).toBe(4);
  });

  it("resolveControl: AI outpaced oversight overrides all when aiAutonomyLevel > 70", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, aiAutonomyLevel: 75 });
    expect(arcs.find((a) => a.id === "control")!.result).toBe(1);
  });

  it("resolveControl: government controlled via high regulatoryPressure", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, regulatoryPressure: 75 });
    expect(arcs.find((a) => a.id === "control")!.result).toBe(3);
  });

  it("resolveControl: single company when OB dominates with entrenched board", () => {
    const arcs = computeEndingArcs({
      ...BASE_STATE,
      obCapability: 80,
      chinaCapability: 40,
      intlCooperation: 20,
      obBoardConfidence: 65,
    });
    expect(arcs.find((a) => a.id === "control")!.result).toBe(2);
  });

  it("resolveControl: AI autonomous when low alignment + capable systems (no one controls)", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, alignmentConfidence: 20, obCapability: 75, aiAutonomyLevel: 50 });
    expect(arcs.find((a) => a.id === "control")!.result).toBe(1);
  });

  // ── resolveEconomy branch coverage ─────────────────────────────────────────

  it("resolveEconomy: AI-driven boom when low disruption + high market + low burn", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, economicDisruption: 10, marketIndex: 80 });
    // adjustedDisruption = 10 + (20+20)/2*0.2 - (80-50)*0.3 = 10 + 4 - 9 = 5 → boom
    expect(arcs.find((a) => a.id === "economy")!.result).toBe(3);
  });

  it("resolveEconomy: collapse when high disruption + low market + high burn rates", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, economicDisruption: 80, marketIndex: 20, obBurnRate: 80, promBurnRate: 80 });
    // adjustedDisruption = 80 + 80*0.2 - (20-50)*0.3 = 80 + 16 + 9 = 105 → collapse
    expect(arcs.find((a) => a.id === "economy")!.result).toBe(0);
  });

  it("resolveEconomy: disruption with adaptation when adjustedDisruption mid-range", () => {
    // adjustedDisruption = 45 + 4 - 0 = 49 → result 2
    const arcs = computeEndingArcs({ ...BASE_STATE, economicDisruption: 45, marketIndex: 50 });
    expect(arcs.find((a) => a.id === "economy")!.result).toBe(2);
  });

  // ── resolvePrometheusFate branch coverage ──────────────────────────────────

  it("resolvePrometheusFate: marginalized when board confidence and morale both low", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, promBoardConfidence: 20, promMorale: 30 });
    expect(arcs.find((a) => a.id === "prometheusFate")!.result).toBe(0);
  });

  it("resolvePrometheusFate: became trusted lab when prom capability matches or beats OB", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, promCapability: 60, obCapability: 50, obPromGap: -5 });
    expect(arcs.find((a) => a.id === "prometheusFate")!.result).toBe(4);
  });

  it("resolvePrometheusFate: merger when OB leads by small gap + low prom morale", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, obPromGap: 3, promMorale: 50 });
    expect(arcs.find((a) => a.id === "prometheusFate")!.result).toBe(2);
  });

  it("resolvePrometheusFate: went open-source via intlCooperation (no higher condition)", () => {
    // promMorale=60 prevents merger; intlCooperation=45 triggers open-source
    const arcs = computeEndingArcs({ ...BASE_STATE, intlCooperation: 45, promMorale: 60 });
    expect(arcs.find((a) => a.id === "prometheusFate")!.result).toBe(1);
  });

  // ── resolveUsChinaRelations branch coverage ────────────────────────────────

  it("resolveUsChinaRelations: arms control from moderate cooperation + low tension", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, intlCooperation: 55, taiwanTension: 35 });
    expect(arcs.find((a) => a.id === "usChinaRelations")!.result).toBe(3);
  });

  it("resolveUsChinaRelations: cold war fallthrough when cooperation and tension both low", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, intlCooperation: 20, taiwanTension: 50 });
    expect(arcs.find((a) => a.id === "usChinaRelations")!.result).toBe(1);
  });

  it("resolveUsChinaRelations: chipReducesTension raises cooperation ceiling to 35", () => {
    // Without chip progress ceiling=20, so taiwanTension=30 would block result 4.
    // With domesticChipProgress>60, ceiling=35, so taiwanTension=30 allows result 4.
    const arcs = computeEndingArcs({ ...BASE_STATE, intlCooperation: 75, taiwanTension: 30, domesticChipProgress: 65 });
    expect(arcs.find((a) => a.id === "usChinaRelations")!.result).toBe(4);
  });

  it("resolveUsChinaRelations: weight theft + high tension forces conflict", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, chinaWeightTheftProgress: 85, taiwanTension: 75 });
    expect(arcs.find((a) => a.id === "usChinaRelations")!.result).toBe(0);
  });

  // ── resolveOpenSource branch coverage ─────────────────────────────────────

  it("resolveOpenSource: closed won when both labs locked down + low momentum", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, securityLevelOB: 4, securityLevelProm: 4, openSourceMomentum: 30 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(2);
  });

  it("resolveOpenSource: irrelevant fallthrough when momentum, security, and cooperation all low", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, intlCooperation: 20, openSourceMomentum: 20, securityLevelOB: 3, securityLevelProm: 3 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(3);
  });

  it("resolveOpenSource: strategic open-source via high momentum", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, openSourceMomentum: 65 });
    expect(arcs.find((a) => a.id === "openSource")!.result).toBe(1);
  });

  // ── resolveTaiwan branch coverage ──────────────────────────────────────────

  it("resolveTaiwan: de-escalation when tension low + cooperation present", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, taiwanTension: 35, intlCooperation: 45 });
    expect(arcs.find((a) => a.id === "taiwan")!.result).toBe(3);
  });

  it("resolveTaiwan: non-issue via domestic chip progress reducing Taiwan motivation", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, domesticChipProgress: 65, taiwanTension: 45 });
    expect(arcs.find((a) => a.id === "taiwan")!.result).toBe(4);
  });

  it("resolveTaiwan: standoff when tension is mid-range", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, taiwanTension: 55 });
    expect(arcs.find((a) => a.id === "taiwan")!.result).toBe(2);
  });

  it("resolveTaiwan: blockade when tension high but not extreme", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, taiwanTension: 65 });
    expect(arcs.find((a) => a.id === "taiwan")!.result).toBe(1);
  });

  // ── resolvePublicReaction branch coverage ──────────────────────────────────

  it("resolvePublicReaction: sustained protest when negative sentiment + moderate awareness", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, publicSentiment: -30, publicAwareness: 60 });
    expect(arcs.find((a) => a.id === "publicReaction")!.result).toBe(1);
  });

  it("resolvePublicReaction: anxious but stable when sentiment slightly positive", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, publicSentiment: 5, publicAwareness: 50 });
    expect(arcs.find((a) => a.id === "publicReaction")!.result).toBe(2);
  });

  it("resolvePublicReaction: unaware when publicAwareness <= 20 regardless of sentiment", () => {
    const arcs = computeEndingArcs({ ...BASE_STATE, publicAwareness: 15, publicSentiment: -80 });
    expect(arcs.find((a) => a.id === "publicReaction")!.result).toBe(4);
  });
});
