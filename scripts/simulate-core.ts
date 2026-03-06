/**
 * Core simulation logic extracted from simulate.ts.
 * Importable without side effects — no CLI parsing, no process.argv access.
 */

import {
  INITIAL_STATE,
  resolveDecisions,
  computeEndingArcs,
  type StateVariables,
  type DecisionOption,
  type RoundDecisions,
  type EndingArc,
} from "../packages/shared/src/index.js";

import { ROUND1_DECISIONS } from "../packages/server/src/content/decisions/round1.js";
import { ROUND2_DECISIONS } from "../packages/server/src/content/decisions/round2.js";
import { ROUND3_DECISIONS } from "../packages/server/src/content/decisions/round3.js";
import { ROUND4_DECISIONS } from "../packages/server/src/content/decisions/round4.js";
import { ROUND5_DECISIONS } from "../packages/server/src/content/decisions/round5.js";

export const ROUNDS: RoundDecisions[] = [
  ROUND1_DECISIONS,
  ROUND2_DECISIONS,
  ROUND3_DECISIONS,
  ROUND4_DECISIONS,
  ROUND5_DECISIONS,
];

// ── Heuristics ──────────────────────────────────────────────────────────────

export type Heuristic = "random" | "hawk" | "dove" | "chaotic";

export interface TrialResult {
  arcs: EndingArc[];
  finalState: StateVariables;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Sum of all positive capability/gap deltas minus cooperation deltas. */
function hawkScore(opt: DecisionOption): number {
  const HAWK_VARS = new Set(["obCapability", "promCapability", "chinaCapability", "obPromGap", "usChinaGap"]);
  const DOVE_VARS = new Set(["alignmentConfidence", "intlCooperation", "publicSentiment"]);
  let score = 0;
  for (const e of opt.effects) {
    if (HAWK_VARS.has(e.variable)) score += e.delta;
    if (DOVE_VARS.has(e.variable)) score -= e.delta;
  }
  return score;
}

function doveScore(opt: DecisionOption): number {
  return -hawkScore(opt);
}

function chaoticScore(opt: DecisionOption): number {
  let mag = 0;
  for (const e of opt.effects) mag += Math.abs(e.delta);
  return mag;
}

export function pickOption(options: DecisionOption[], heuristic: Heuristic): DecisionOption {
  if (heuristic === "random") return pickRandom(options);

  const scoreFn = heuristic === "hawk" ? hawkScore : heuristic === "dove" ? doveScore : chaoticScore;
  const scored = options.map((o) => ({ o, s: scoreFn(o) }));
  scored.sort((a, b) => b.s - a.s);

  // Top pick with small randomness: 70% best, 20% second, 10% third
  const roll = Math.random();
  if (scored.length >= 3 && roll > 0.9) return scored[2].o;
  if (scored.length >= 2 && roll > 0.7) return scored[1].o;
  return scored[0].o;
}

export function getAllOptions(round: RoundDecisions, heuristic: Heuristic): DecisionOption[] {
  const chosen: DecisionOption[] = [];

  for (const ind of round.individual) {
    chosen.push(pickOption(ind.options, heuristic));
  }
  for (const team of round.team) {
    chosen.push(pickOption(team.options, heuristic));
  }

  return chosen;
}

export function runTrial(heuristic: Heuristic): TrialResult {
  let state = { ...INITIAL_STATE };

  for (const round of ROUNDS) {
    const chosen = getAllOptions(round, heuristic);
    state = resolveDecisions(state, chosen);
  }

  return { arcs: computeEndingArcs(state), finalState: state };
}
