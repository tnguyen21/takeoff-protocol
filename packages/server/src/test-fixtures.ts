/**
 * Minimal test fixtures for decision-cycle, devBots, events, and game tests.
 *
 * These replaced pre-authored content files that were removed in the
 * content-removal refactor. They contain only the minimal data needed
 * to exercise the game engine's decision and NPC trigger machinery.
 *
 * Option IDs and effects match those referenced in test assertions.
 */
import type { NpcTrigger, RoundDecisions, IndividualDecision, TeamDecision, DecisionOption } from "@takeoff/shared";

// ── Helper: build a stub individual decision ────────────────────────────────

function makeIndividual(role: string, overrideOptions?: DecisionOption[]): IndividualDecision {
  const options = overrideOptions ?? [
    { id: `${role}_a`, label: "Option A", description: "Test A", effects: [{ variable: "obCapability" as const, delta: 1 }] },
    { id: `${role}_b`, label: "Option B", description: "Test B", effects: [{ variable: "obCapability" as const, delta: -1 }] },
    { id: `${role}_c`, label: "Option C", description: "Test C", effects: [{ variable: "publicSentiment" as const, delta: 2 }] },
  ];
  return {
    role: role as IndividualDecision["role"],
    prompt: `Test prompt for ${role}`,
    options,
  };
}

function makeTeam(faction: string, overrideOptions?: DecisionOption[]): TeamDecision {
  const options = overrideOptions ?? [
    { id: `${faction}_team_a`, label: "Team A", description: "Test team A", effects: [{ variable: "publicSentiment" as const, delta: 1 }] },
    { id: `${faction}_team_b`, label: "Team B", description: "Test team B", effects: [{ variable: "publicSentiment" as const, delta: -1 }] },
    { id: `${faction}_team_c`, label: "Team C", description: "Test team C", effects: [{ variable: "marketIndex" as const, delta: 2 }] },
  ];
  return {
    faction: faction as TeamDecision["faction"],
    prompt: `Test team prompt for ${faction}`,
    options,
  };
}

// ── Round 1 Decisions ───────────────────────────────────────────────────────
// Includes all 16 roles and 4 factions.
// Roles/factions referenced by tests have their exact option IDs and effects.

export const ROUND1_DECISIONS: RoundDecisions = {
  round: 1,
  individual: [
    // ── OpenBrain ──
    makeIndividual("ob_ceo", [
      {
        id: "ob_ceo_fundraise", label: "Focus on fundraising narrative", description: "Emphasize Agent-1's commercial potential.",
        effects: [
          { variable: "obInternalTrust", delta: -1 }, { variable: "publicSentiment", delta: 3 },
          { variable: "marketIndex", delta: 6 }, { variable: "obBurnRate", delta: 4 },
          { variable: "obBoardConfidence", delta: 4 }, { variable: "whistleblowerPressure", delta: 3 },
          { variable: "usChinaGap", delta: 2 },
        ],
      },
      { id: "ob_ceo_gov", label: "Engage government", description: "Open dialogue with NSC.", effects: [{ variable: "intlCooperation", delta: 2 }] },
      { id: "ob_ceo_silence", label: "Maintain silence", description: "Go dark.", effects: [{ variable: "publicAwareness", delta: -3 }] },
    ]),
    makeIndividual("ob_cto", [
      {
        id: "ob_cto_push", label: "Push Agent-2 training now", description: "Start the next training run immediately.",
        effects: [
          { variable: "obCapability", delta: 3 }, { variable: "alignmentConfidence", delta: -3 },
          { variable: "obInternalTrust", delta: -1 }, { variable: "obBurnRate", delta: 5 },
          { variable: "aiAutonomyLevel", delta: 2 }, { variable: "obMorale", delta: -3 },
          { variable: "obBoardConfidence", delta: 4 }, { variable: "whistleblowerPressure", delta: 4 },
          { variable: "usChinaGap", delta: 2 }, { variable: "obPromGap", delta: 2 },
        ],
      },
      {
        id: "ob_cto_audit", label: "Audit Agent-1 fully first", description: "Understand what you have.",
        effects: [
          { variable: "alignmentConfidence", delta: 2 }, { variable: "obCapability", delta: 1 },
          { variable: "obMorale", delta: 3 }, { variable: "obBurnRate", delta: 3 },
          { variable: "obBoardConfidence", delta: -3 },
        ],
      },
      {
        id: "ob_cto_safety_compute", label: "Redirect 20% of compute to safety", description: "Partially appease the safety team.",
        effects: [
          { variable: "alignmentConfidence", delta: 2 }, { variable: "obCapability", delta: 3 },
          { variable: "obInternalTrust", delta: 3 }, { variable: "obMorale", delta: 2 },
          { variable: "obBurnRate", delta: 4 }, { variable: "obBoardConfidence", delta: -3 },
          { variable: "promSafetyBreakthroughProgress", delta: 2 },
        ],
      },
    ]),
    makeIndividual("ob_safety"),
    makeIndividual("ob_security"),
    // ── Prometheus ──
    makeIndividual("prom_ceo", [
      {
        id: "prom_ceo_safety_narrative", label: "Lead with safety narrative", description: "Double down on responsible AI.",
        effects: [
          { variable: "publicSentiment", delta: 4 }, { variable: "publicAwareness", delta: 2 },
          { variable: "promCapability", delta: -1 }, { variable: "promBurnRate", delta: 4 },
          { variable: "regulatoryPressure", delta: 0 }, { variable: "promBoardConfidence", delta: 3 },
        ],
      },
      { id: "prom_ceo_gov_compute", label: "Seek gov compute", description: "Pitch NSC.", effects: [{ variable: "promCapability", delta: 2 }] },
      { id: "prom_ceo_accelerate", label: "Accelerate", description: "Speed up.", effects: [{ variable: "promCapability", delta: 3 }] },
    ]),
    makeIndividual("prom_scientist"),
    makeIndividual("prom_policy"),
    makeIndividual("prom_opensource"),
    // ── China ──
    makeIndividual("china_director", [
      {
        id: "china_dir_max_training", label: "Maximize training runs", description: "Throw everything at frontier model training.",
        effects: [
          { variable: "chinaCapability", delta: 3 }, { variable: "alignmentConfidence", delta: -3 },
          { variable: "taiwanTension", delta: 3 }, { variable: "cdzComputeUtilization", delta: 3 },
          { variable: "aiAutonomyLevel", delta: 2 }, { variable: "ccpPatience", delta: 2 },
        ],
      },
      { id: "china_dir_architecture", label: "Divert to architecture", description: "Efficiency gains.", effects: [{ variable: "chinaCapability", delta: 1 }] },
      { id: "china_dir_steal", label: "Accelerate espionage", description: "Increase weight theft.", effects: [{ variable: "chinaWeightTheftProgress", delta: 5 }] },
    ]),
    makeIndividual("china_intel"),
    makeIndividual("china_military"),
    makeIndividual("china_scientist"),
    // ── External ──
    makeIndividual("ext_nsa"),
    makeIndividual("ext_journalist", [
      {
        id: "ext_journalist_secret_race", label: "Inside the secret AI race", description: "The government is classifying AI progress.",
        effects: [
          { variable: "publicAwareness", delta: 4 }, { variable: "publicSentiment", delta: -3 },
          { variable: "obInternalTrust", delta: -1 }, { variable: "globalMediaCycle", delta: 6 },
          { variable: "marketIndex", delta: -3 }, { variable: "regulatoryPressure", delta: 3 },
          { variable: "whistleblowerPressure", delta: -3 },
        ],
      },
      { id: "ext_journalist_ob_safety", label: "OpenBrain safety shortcuts", description: "Corporate angle.", effects: [{ variable: "publicAwareness", delta: 3 }] },
      { id: "ext_journalist_profile", label: "Profile piece", description: "Human angle.", effects: [{ variable: "publicSentiment", delta: 2 }] },
    ]),
    makeIndividual("ext_vc"),
    makeIndividual("ext_diplomat"),
  ],
  team: [
    makeTeam("openbrain", [
      {
        id: "ob_team_allincap", label: "All-in on capabilities", description: "Agent-2 training starts now.",
        effects: [
          { variable: "obCapability", delta: 6 }, { variable: "alignmentConfidence", delta: -4 },
          { variable: "obPromGap", delta: 2 }, { variable: "usChinaGap", delta: 2 },
          { variable: "obBurnRate", delta: 6 }, { variable: "obBoardConfidence", delta: 5 },
          { variable: "obMorale", delta: -4 }, { variable: "aiAutonomyLevel", delta: 2 },
          { variable: "whistleblowerPressure", delta: 5 },
        ],
      },
      {
        id: "ob_team_balanced", label: "Balanced approach", description: "Continue Agent-2 while maintaining safety.",
        effects: [
          { variable: "obCapability", delta: 2 }, { variable: "alignmentConfidence", delta: 1 },
          { variable: "obPromGap", delta: 1 }, { variable: "obBurnRate", delta: 4 },
          { variable: "obMorale", delta: 3 }, { variable: "obBoardConfidence", delta: 3 },
        ],
      },
      {
        id: "ob_team_safety", label: "Invest more in safety", description: "Redirect 30% of R&D to alignment.",
        effects: [
          { variable: "obCapability", delta: 2 }, { variable: "alignmentConfidence", delta: 3 },
          { variable: "obInternalTrust", delta: 4 }, { variable: "obMorale", delta: 4 },
          { variable: "obBurnRate", delta: 4 }, { variable: "obBoardConfidence", delta: -3 },
          { variable: "promSafetyBreakthroughProgress", delta: 3 },
        ],
      },
    ]),
    makeTeam("prometheus", [
      {
        id: "prom_team_safety_diff", label: "Double down on safety differentiation", description: "Prometheus's advantage is being trustworthy.",
        effects: [
          { variable: "promCapability", delta: 2 }, { variable: "alignmentConfidence", delta: 3 },
          { variable: "publicSentiment", delta: 4 }, { variable: "promSafetyBreakthroughProgress", delta: 3 },
          { variable: "promMorale", delta: 4 }, { variable: "promBurnRate", delta: 4 },
          { variable: "promBoardConfidence", delta: -3 },
        ],
      },
      { id: "prom_team_accelerate", label: "Accelerate capabilities", description: "Speed up R&D.", effects: [{ variable: "promCapability", delta: 4 }] },
      { id: "prom_team_gov_compute", label: "Gov compute partnership", description: "Access to gov compute.", effects: [{ variable: "promCapability", delta: 3 }] },
    ]),
    makeTeam("china", [
      {
        id: "china_team_max_cdz", label: "Max CDZ buildout", description: "Double the cluster.",
        effects: [
          { variable: "chinaCapability", delta: 2 }, { variable: "usChinaGap", delta: -2 },
          { variable: "taiwanTension", delta: 3 }, { variable: "cdzComputeUtilization", delta: 4 },
          { variable: "ccpPatience", delta: 3 }, { variable: "domesticChipProgress", delta: 3 },
        ],
      },
      { id: "china_team_domestic_chips", label: "Invest in domestic chips", description: "Build resilience.", effects: [{ variable: "domesticChipProgress", delta: 6 }] },
      { id: "china_team_espionage", label: "Prioritize espionage", description: "Weight theft.", effects: [{ variable: "chinaWeightTheftProgress", delta: 4 }] },
    ]),
    makeTeam("external", [
      { id: "ext_team_share", label: "Share intel", description: "Coordinate across agencies.", effects: [{ variable: "intlCooperation", delta: 3 }] },
      { id: "ext_team_regulate", label: "Push regulation", description: "Draft legislation.", effects: [{ variable: "regulatoryPressure", delta: 4 }] },
      { id: "ext_team_market", label: "Let the market decide", description: "Light touch.", effects: [{ variable: "marketIndex", delta: 3 }] },
    ]),
  ],
};

// ── Minimal NPC Triggers ─────────────────────────────────────────────────────
// Only the specific triggers referenced by game.test.ts assertions.

const ROUND1_NPC_TRIGGERS: NpcTrigger[] = [
  {
    id: "npc_r1_anon_ob_intel",
    npcId: "__npc_anon__",
    content: "Heads up: internal safety reports at OpenBrain are being quietly shelved.",
    schedule: { round: 1, phase: "intel" },
    target: { faction: "openbrain" },
  },
];

const ROUND2_NPC_TRIGGERS: NpcTrigger[] = [
  {
    id: "npc_r2_anon_alignment_warning",
    npcId: "__npc_anon__",
    content: "I've seen the internal evals. The published alignment numbers don't match.",
    condition: { variable: "alignmentConfidence", operator: "lte", value: 50 },
    target: { faction: "openbrain" },
  },
];

const NPC_TRIGGERS_BY_ROUND: Record<number, NpcTrigger[]> = {
  1: ROUND1_NPC_TRIGGERS,
  2: ROUND2_NPC_TRIGGERS,
};

/**
 * Returns NPC triggers for a given round (test-only replacement for the
 * deleted content/npc module).
 */
export function getNpcTriggersForRound(round: number): NpcTrigger[] {
  return NPC_TRIGGERS_BY_ROUND[round] ?? [];
}
