import type { DecisionOption, MediaCycle, StateEffect, StateVariables } from "./types.js";
import { STATE_VARIABLE_RANGES } from "./constants.js";

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
 * Ranges are defined in STATE_VARIABLE_RANGES (packages/shared/src/constants.ts).
 */
export function clampState(state: StateVariables): void {
  for (const key of Object.keys(STATE_VARIABLE_RANGES) as (keyof StateVariables)[]) {
    const [min, max] = STATE_VARIABLE_RANGES[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state as any)[key] = Math.max(min, Math.min(max, state[key] as number));
  }
  // globalMediaCycle is a discrete enum — round to nearest integer after clamping
  state.globalMediaCycle = Math.round(state.globalMediaCycle) as MediaCycle;
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
