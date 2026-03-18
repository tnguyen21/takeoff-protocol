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
  type DecisionTemplate,
  type IndividualDecision,
  type TeamDecision,
  type RoundDecisions,
  type StateEffect,
  type EndingArc,
} from "../packages/shared/src/index.js";

import { getTemplatesForRound } from "../packages/server/src/generation/templates/decisions.js";

// ── Decision Sampler ─────────────────────────────────────────────────────────

/**
 * Ensure an array of effects has at least 2 positive and 2 negative deltas.
 * Flips the smallest-magnitude effects to achieve this.
 * Mutates the array in place.
 */
function enforceNoFreeLunch(effects: StateEffect[]): void {
  // Ensure >= 2 positive effects
  while (effects.filter((e) => e.delta > 0).length < 2) {
    const neg = effects
      .filter((e) => e.delta < 0)
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
    if (neg.length === 0) break; // safety: shouldn't happen with 5+ effects
    neg[0].delta = -neg[0].delta;
  }
  // Ensure >= 2 negative effects
  while (effects.filter((e) => e.delta < 0).length < 2) {
    const pos = effects
      .filter((e) => e.delta > 0)
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
    if (pos.length === 0) break; // safety
    pos[0].delta = -pos[0].delta;
  }
}

/**
 * Check the distinctness constraint: for any two options, <60% of their shared
 * variables may have the same-sign delta.
 */
function isDistinct(options: DecisionOption[]): boolean {
  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      const signsA = new Map(options[i].effects.map((e) => [e.variable as string, Math.sign(e.delta)]));
      const signsB = new Map(options[j].effects.map((e) => [e.variable as string, Math.sign(e.delta)]));
      const sharedVars = [...signsA.keys()].filter((v) => signsB.has(v));
      if (sharedVars.length > 0) {
        const sameSignCount = sharedVars.filter((v) => signsA.get(v) === signsB.get(v)).length;
        if (sameSignCount / sharedVars.length >= 0.6) return false;
      }
    }
  }
  return true;
}

/**
 * Generate a single DecisionOption from a set of variables.
 * `priorSignMaps` holds the sign maps of previously generated options for this decision;
 * we try to pick opposite signs for shared variables to satisfy the distinctness constraint.
 */
function generateOption(
  id: string,
  variables: (keyof StateVariables)[],
  priorSignMaps: Map<string, number>[],
): DecisionOption {
  const numEffects = 5 + Math.floor(Math.random() * 4); // 5–8
  // Shuffle and pick numEffects variables (at most all of them)
  const shuffled = [...variables].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(numEffects, shuffled.length));

  const effects: StateEffect[] = selected.map((variable) => {
    const mag = 1 + Math.floor(Math.random() * 8); // 1–8
    const defaultSign = Math.random() < 0.5 ? 1 : -1;

    // Prefer opposite sign to prior options that have this variable
    const priorSigns = priorSignMaps.map((m) => m.get(variable as string)).filter((s) => s !== undefined) as number[];
    const sameCount = priorSigns.filter((s) => s === defaultSign).length;
    const sign = priorSigns.length > 0 && sameCount / priorSigns.length >= 0.5 ? -defaultSign : defaultSign;

    return { variable, delta: sign * mag };
  });

  enforceNoFreeLunch(effects);

  return {
    id,
    label: `Option ${id}`,
    description: `[sampled] option ${id}`,
    effects,
  };
}

/**
 * Sample a random valid IndividualDecision or TeamDecision from a DecisionTemplate.
 *
 * Generates 3 options with:
 * - 5–8 effects each, drawn from template.variableScope
 * - |delta| <= 8
 * - no-free-lunch: >= 2 positive, >= 2 negative effects per option
 * - distinctness: for any option pair, <60% of shared variables have same-sign deltas
 *
 * Retries up to 100 times if the distinctness check fails.
 */
export function sampleRandomDecision(template: DecisionTemplate): IndividualDecision | TeamDecision {
  const { variableScope } = template;

  for (let attempt = 0; attempt < 100; attempt++) {
    const options: DecisionOption[] = [];
    const priorSignMaps: Map<string, number>[] = [];

    for (let i = 0; i < 3; i++) {
      const optId = String.fromCharCode(65 + i); // "A", "B", "C"
      const opt = generateOption(optId, variableScope, priorSignMaps);
      options.push(opt);
      priorSignMaps.push(new Map(opt.effects.map((e) => [e.variable as string, Math.sign(e.delta)])));
    }

    if (isDistinct(options)) {
      const prompt = `[sampled] ${template.theme}`;
      if (template.role !== undefined) {
        return { role: template.role, prompt, options } satisfies IndividualDecision;
      } else {
        return { faction: template.faction!, prompt, options } satisfies TeamDecision;
      }
    }
  }

  throw new Error(`sampleRandomDecision: failed to generate distinct options for "${template.theme}" after 100 attempts`);
}

/**
 * Build a RoundDecisions for the given round by sampling one decision per template.
 */
export function sampleRoundDecisions(round: number): RoundDecisions {
  const templates = getTemplatesForRound(round);
  const individual: IndividualDecision[] = [];
  const team: TeamDecision[] = [];

  for (const template of templates) {
    const decision = sampleRandomDecision(template);
    if (template.role !== undefined) {
      individual.push(decision as IndividualDecision);
    } else {
      team.push(decision as TeamDecision);
    }
  }

  return { round, individual, team };
}

/**
 * Sample decisions for all 5 rounds from templates.
 */
export function sampleAllRounds(): RoundDecisions[] {
  return [
    sampleRoundDecisions(1),
    sampleRoundDecisions(2),
    sampleRoundDecisions(3),
    sampleRoundDecisions(4),
    sampleRoundDecisions(5),
  ];
}

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
  const rounds = sampleAllRounds();

  for (const round of rounds) {
    const chosen = getAllOptions(round, heuristic);
    state = resolveDecisions(state, chosen);
  }

  return { arcs: computeEndingArcs(state), finalState: state };
}

/**
 * Run a single trial with a custom set of RoundDecisions instead of sampling.
 * Used by simulate-generated.ts to test the effect range of sampled decisions.
 */
export function runTrialWithDecisions(heuristic: Heuristic, rounds: RoundDecisions[]): TrialResult {
  let state = { ...INITIAL_STATE };

  for (const round of rounds) {
    const chosen = getAllOptions(round, heuristic);
    state = resolveDecisions(state, chosen);
  }

  return { arcs: computeEndingArcs(state), finalState: state };
}
