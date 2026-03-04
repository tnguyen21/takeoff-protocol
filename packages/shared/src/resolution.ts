import type { DecisionOption, StateEffect, StateVariables } from "./types.js";

/**
 * Apply a single state effect to game state.
 * Supports conditional multipliers at thresholds.
 */
function applyEffect(state: StateVariables, effect: StateEffect): void {
  let delta = effect.delta;

  if (effect.condition) {
    const { variable, threshold, operator, multiplier } = effect.condition;
    const val = state[variable];

    let conditionMet = false;
    switch (operator) {
      case "gt": conditionMet = val > threshold; break;
      case "lt": conditionMet = val < threshold; break;
      case "eq": conditionMet = val === threshold; break;
    }

    if (conditionMet) {
      delta = Math.round(delta * multiplier);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (state as any)[effect.variable] += delta;
}

/**
 * Clamp all state variables to their valid ranges.
 */
function clampState(state: StateVariables): void {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  state.obCapability = clamp(state.obCapability, 0, 100);
  state.promCapability = clamp(state.promCapability, 0, 100);
  state.chinaCapability = clamp(state.chinaCapability, 0, 100);
  state.usChinaGap = clamp(state.usChinaGap, -8, 16);
  state.obPromGap = clamp(state.obPromGap, -8, 16);
  state.alignmentConfidence = clamp(state.alignmentConfidence, 0, 100);
  state.misalignmentSeverity = clamp(state.misalignmentSeverity, 0, 100);
  state.publicAwareness = clamp(state.publicAwareness, 0, 100);
  state.publicSentiment = clamp(state.publicSentiment, -100, 100);
  state.economicDisruption = clamp(state.economicDisruption, 0, 100);
  state.taiwanTension = clamp(state.taiwanTension, 0, 100);
  state.obInternalTrust = clamp(state.obInternalTrust, 0, 100);
  state.securityLevelOB = clamp(state.securityLevelOB, 1, 5);
  state.securityLevelProm = clamp(state.securityLevelProm, 1, 5);
  state.intlCooperation = clamp(state.intlCooperation, 0, 100);

  // ── Tier 1: Public-Facing ──
  state.marketIndex = clamp(state.marketIndex, 0, 200);
  state.regulatoryPressure = clamp(state.regulatoryPressure, 0, 100);
  state.globalMediaCycle = clamp(state.globalMediaCycle, 0, 5);

  // ── Tier 2: Hidden Engine ──
  state.chinaWeightTheftProgress = clamp(state.chinaWeightTheftProgress, 0, 100);
  state.aiAutonomyLevel = clamp(state.aiAutonomyLevel, 0, 100);
  state.whistleblowerPressure = clamp(state.whistleblowerPressure, 0, 100);
  state.openSourceMomentum = clamp(state.openSourceMomentum, 0, 100);
  state.doomClockDistance = clamp(state.doomClockDistance, 0, 5);

  // ── Tier 3: Per-Faction Internal ──
  state.obMorale = clamp(state.obMorale, 0, 100);
  state.obBurnRate = clamp(state.obBurnRate, 0, 100);
  state.obBoardConfidence = clamp(state.obBoardConfidence, 0, 100);
  state.promMorale = clamp(state.promMorale, 0, 100);
  state.promBurnRate = clamp(state.promBurnRate, 0, 100);
  state.promBoardConfidence = clamp(state.promBoardConfidence, 0, 100);
  state.promSafetyBreakthroughProgress = clamp(state.promSafetyBreakthroughProgress, 0, 100);
  state.cdzComputeUtilization = clamp(state.cdzComputeUtilization, 0, 100);
  state.ccpPatience = clamp(state.ccpPatience, 0, 100);
  state.domesticChipProgress = clamp(state.domesticChipProgress, 0, 100);
}

/**
 * Resolve a set of chosen decisions into a new game state.
 * Returns a copy — does not mutate the input.
 */
export function resolveDecisions(
  currentState: StateVariables,
  chosenOptions: DecisionOption[],
): StateVariables {
  const newState = { ...currentState };

  for (const option of chosenOptions) {
    for (const effect of option.effects) {
      applyEffect(newState, effect);
    }
  }

  clampState(newState);
  return newState;
}
