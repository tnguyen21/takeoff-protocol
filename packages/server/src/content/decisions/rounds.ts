import type { RoundDecisions } from "@takeoff/shared";
import { ROUND1_DECISIONS } from "./round1.js";
import { ROUND2_DECISIONS } from "./round2.js";
import { ROUND3_DECISIONS } from "./round3.js";
import { ROUND4_DECISIONS } from "./round4.js";
import { ROUND5_DECISIONS } from "./round5.js";

// Round N decisions at index N-1.
export const ROUND_DECISIONS: ReadonlyArray<RoundDecisions> = [
  ROUND1_DECISIONS, // index 0 = round 1
  ROUND2_DECISIONS, // index 1 = round 2
  ROUND3_DECISIONS, // index 2 = round 3
  ROUND4_DECISIONS, // index 3 = round 4
  ROUND5_DECISIONS, // index 4 = round 5
];

export function getRoundDecisions(round: number): RoundDecisions | undefined {
  return ROUND_DECISIONS[round - 1];
}

