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
  state.usChinaGap = clamp(state.usChinaGap, -6, 12);
  state.obPromGap = clamp(state.obPromGap, -6, 12);
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
