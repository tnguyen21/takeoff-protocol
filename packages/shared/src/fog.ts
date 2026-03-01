import type { Accuracy, Faction, FogVariable, Role, StateVariables, StateView } from "./types.js";

/**
 * Fog-of-war visibility matrix.
 * For each state variable, defines what each faction sees.
 * 'exact' = true value, 'estimate' = noised value with confidence interval, 'hidden' = not shown.
 */
type FogMatrix = Record<keyof StateVariables, Record<Faction, { accuracy: Accuracy; confidence?: number }>>;

const FOG_MATRIX: FogMatrix = {
  obCapability:          { openbrain: { accuracy: "exact" },     prometheus: { accuracy: "estimate", confidence: 15 }, china: { accuracy: "estimate", confidence: 25 }, external: { accuracy: "hidden" } },
  promCapability:        { openbrain: { accuracy: "estimate", confidence: 15 }, prometheus: { accuracy: "exact" },     china: { accuracy: "estimate", confidence: 30 }, external: { accuracy: "hidden" } },
  chinaCapability:       { openbrain: { accuracy: "estimate", confidence: 20 }, prometheus: { accuracy: "hidden" },    china: { accuracy: "exact" },                   external: { accuracy: "hidden" } },
  usChinaGap:            { openbrain: { accuracy: "estimate", confidence: 3 },  prometheus: { accuracy: "estimate", confidence: 4 },  china: { accuracy: "exact" },   external: { accuracy: "estimate", confidence: 4 } },
  obPromGap:             { openbrain: { accuracy: "exact" },     prometheus: { accuracy: "exact" },     china: { accuracy: "estimate", confidence: 3 },  external: { accuracy: "hidden" } },
  alignmentConfidence:   { openbrain: { accuracy: "estimate", confidence: 20 }, prometheus: { accuracy: "exact" },     china: { accuracy: "hidden" },                  external: { accuracy: "estimate", confidence: 25 } },
  misalignmentSeverity:  { openbrain: { accuracy: "estimate", confidence: 25 }, prometheus: { accuracy: "hidden" },    china: { accuracy: "hidden" },                  external: { accuracy: "hidden" } },
  publicAwareness:       { openbrain: { accuracy: "estimate", confidence: 10 }, prometheus: { accuracy: "estimate", confidence: 10 }, china: { accuracy: "estimate", confidence: 15 }, external: { accuracy: "exact" } },
  publicSentiment:       { openbrain: { accuracy: "estimate", confidence: 15 }, prometheus: { accuracy: "estimate", confidence: 15 }, china: { accuracy: "hidden" },   external: { accuracy: "exact" } },
  economicDisruption:    { openbrain: { accuracy: "estimate", confidence: 15 }, prometheus: { accuracy: "exact" },     china: { accuracy: "estimate", confidence: 20 }, external: { accuracy: "exact" } },
  taiwanTension:         { openbrain: { accuracy: "hidden" },    prometheus: { accuracy: "hidden" },    china: { accuracy: "exact" },                   external: { accuracy: "estimate", confidence: 15 } },
  obInternalTrust:       { openbrain: { accuracy: "exact" },     prometheus: { accuracy: "hidden" },    china: { accuracy: "hidden" },                  external: { accuracy: "hidden" } },
  securityLevelOB:       { openbrain: { accuracy: "exact" },     prometheus: { accuracy: "estimate", confidence: 1 },  china: { accuracy: "estimate", confidence: 1 },  external: { accuracy: "estimate", confidence: 1 } },
  securityLevelProm:     { openbrain: { accuracy: "estimate", confidence: 1 },  prometheus: { accuracy: "exact" },     china: { accuracy: "estimate", confidence: 1 },  external: { accuracy: "estimate", confidence: 1 } },
  intlCooperation:       { openbrain: { accuracy: "hidden" },    prometheus: { accuracy: "estimate", confidence: 10 }, china: { accuracy: "estimate", confidence: 10 }, external: { accuracy: "exact" } },

  // ── Tier 1: Public-Facing ──
  marketIndex:           { openbrain: { accuracy: "estimate", confidence: 10 }, prometheus: { accuracy: "estimate", confidence: 10 }, china: { accuracy: "hidden" }, external: { accuracy: "exact" } },
  regulatoryPressure:    { openbrain: { accuracy: "estimate", confidence: 10 }, prometheus: { accuracy: "estimate", confidence: 10 }, china: { accuracy: "hidden" }, external: { accuracy: "exact" } },
  globalMediaCycle:      { openbrain: { accuracy: "estimate", confidence: 1 },  prometheus: { accuracy: "estimate", confidence: 1 },  china: { accuracy: "hidden" }, external: { accuracy: "exact" } },

  // ── Tier 2: Hidden Engine ──
  chinaWeightTheftProgress: { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "exact" },  external: { accuracy: "hidden" } },
  aiAutonomyLevel:          { openbrain: { accuracy: "estimate", confidence: 10 }, prometheus: { accuracy: "estimate", confidence: 10 }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  whistleblowerPressure:    { openbrain: { accuracy: "exact" },  prometheus: { accuracy: "hidden" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  openSourceMomentum:       { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "estimate", confidence: 10 }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  doomClockDistance:        { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },

  // ── Tier 3: Per-Faction Internal ──
  obMorale:              { openbrain: { accuracy: "exact" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  obBurnRate:            { openbrain: { accuracy: "exact" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  obBoardConfidence:     { openbrain: { accuracy: "exact" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  promMorale:            { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "exact" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  promBurnRate:          { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "exact" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  promBoardConfidence:   { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "exact" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  promSafetyBreakthroughProgress: { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "exact" }, china: { accuracy: "hidden" }, external: { accuracy: "hidden" } },
  cdzComputeUtilization: { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "exact" }, external: { accuracy: "hidden" } },
  ccpPatience:           { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "exact" }, external: { accuracy: "hidden" } },
  domesticChipProgress:  { openbrain: { accuracy: "hidden" }, prometheus: { accuracy: "hidden" }, china: { accuracy: "exact" }, external: { accuracy: "hidden" } },
};

/**
 * Apply noise to a value within a confidence interval.
 * Uses a seeded offset so the same player sees consistent (but wrong) values within a round.
 */
function applyNoise(trueValue: number, confidence: number, seed: number): number {
  // Simple deterministic noise from seed
  const noise = ((Math.sin(seed * 9301 + 49297) % 233280) / 233280) * 2 - 1; // -1 to 1
  return Math.round(trueValue + noise * confidence);
}

/**
 * Compute the fog-of-war view of game state for a given faction.
 */
export function computeFogView(
  state: StateVariables,
  faction: Faction,
  _role: Role,
  round: number,
): StateView {
  const view = {} as StateView;
  const seed = round * 1000 + faction.charCodeAt(0);

  for (const key of Object.keys(FOG_MATRIX) as (keyof StateVariables)[]) {
    const fogEntry = FOG_MATRIX[key][faction];
    const trueValue = state[key];

    let fogVar: FogVariable;
    switch (fogEntry.accuracy) {
      case "exact":
        fogVar = { value: trueValue, accuracy: "exact" };
        break;
      case "estimate":
        fogVar = {
          value: applyNoise(trueValue, fogEntry.confidence!, seed + key.charCodeAt(0)),
          accuracy: "estimate",
          confidence: fogEntry.confidence,
        };
        break;
      case "hidden":
        fogVar = { value: 0, accuracy: "hidden" };
        break;
    }

    view[key] = fogVar;
  }

  return view;
}
