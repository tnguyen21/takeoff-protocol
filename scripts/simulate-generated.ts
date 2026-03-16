#!/usr/bin/env bun
/**
 * Monte Carlo simulator using randomly sampled decision sets for rounds 2–4.
 *
 * Instead of calling the LLM, this script samples random valid effect sets from
 * each DecisionTemplate's variableScope constraints. This lets balance tuning
 * account for the full range of possible LLM-generated decisions.
 *
 * Rounds 1 and 5 always use pre-authored decisions.
 * Rounds 2–4 use sampleRandomDecision() per template per trial.
 *
 * Usage:
 *   bun scripts/simulate-generated.ts                 # 10k trials, report to stdout
 *   bun scripts/simulate-generated.ts --trials 1000   # custom trial count
 *   bun scripts/simulate-generated.ts -o report.md    # write to file
 *   bun scripts/simulate-generated.ts --heuristic hawk
 */

import {
  INITIAL_STATE,
  type StateVariables,
  type IndividualDecision,
  type TeamDecision,
  type DecisionOption,
  type StateEffect,
  type RoundDecisions,
  type DecisionTemplate,
} from "../packages/shared/src/index.js";

import { ROUND1_DECISIONS } from "../packages/server/src/content/decisions/round1.js";
import { ROUND5_DECISIONS } from "../packages/server/src/content/decisions/round5.js";
import { getTemplatesForRound } from "../packages/server/src/generation/templates/decisions.js";
import { runTrial, runTrialWithDecisions, type Heuristic, type TrialResult } from "./simulate-core.js";

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
 * Run a single trial using pre-authored decisions for rounds 1 & 5, and
 * freshly sampled decisions for rounds 2–4.
 */
export function runGeneratedTrial(heuristic: Heuristic): TrialResult {
  const rounds: RoundDecisions[] = [
    ROUND1_DECISIONS,
    sampleRoundDecisions(2),
    sampleRoundDecisions(3),
    sampleRoundDecisions(4),
    ROUND5_DECISIONS,
  ];
  return runTrialWithDecisions(heuristic, rounds);
}

// ── Stats helpers ────────────────────────────────────────────────────────────

interface ArcStats {
  label: string;
  spectrum: string[];
  counts: number[];
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeVarStats(values: number[]) {
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  return {
    mean: Math.round(mean * 10) / 10,
    std: Math.round(Math.sqrt(variance) * 10) / 10,
    min: sorted[0],
    max: sorted[n - 1],
    p25: Math.round(percentile(sorted, 25) * 10) / 10,
    median: Math.round(percentile(sorted, 50) * 10) / 10,
    p75: Math.round(percentile(sorted, 75) * 10) / 10,
  };
}

function buildArcMap(results: TrialResult[]): Map<string, ArcStats> {
  const arcMap = new Map<string, ArcStats>();
  for (const r of results) {
    for (const arc of r.arcs) {
      if (!arcMap.has(arc.id)) {
        arcMap.set(arc.id, { label: arc.label, spectrum: arc.spectrum, counts: new Array(arc.spectrum.length).fill(0) });
      }
      arcMap.get(arc.id)!.counts[arc.result]++;
    }
  }
  return arcMap;
}

// ── Report Generation ────────────────────────────────────────────────────────

function generateComparisonReport(
  trials: number,
  heuristic: Heuristic,
  authoredResults: TrialResult[],
  generatedResults: TrialResult[],
): string {
  const authoredArcs = buildArcMap(authoredResults);
  const generatedArcs = buildArcMap(generatedResults);
  const stateKeys = Object.keys(INITIAL_STATE) as (keyof StateVariables)[];

  const lines: string[] = [];
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  lines.push(`# Generated Decision Simulation Report`);
  lines.push(``);
  lines.push(`Compares pre-authored decisions (rounds 1–5) against sampled-from-template decisions (rounds 2–4).`);
  lines.push(`Rounds 1 and 5 are always pre-authored.`);
  lines.push(``);
  lines.push(`- **Trials:** ${trials.toLocaleString()} per mode`);
  lines.push(`- **Heuristic:** ${heuristic}`);
  lines.push(`- **Generated:** ${now}`);
  lines.push(``);

  // ── Arc outcome comparison
  lines.push(`## Ending Arc Distribution Comparison`);
  lines.push(``);
  lines.push(`"Generated" = sampled random decisions for rounds 2–4. "Authored" = pre-authored decisions for all rounds.`);
  lines.push(``);

  const arcIds = [...authoredArcs.keys()];

  for (const arcId of arcIds) {
    const auth = authoredArcs.get(arcId)!;
    const gen = generatedArcs.get(arcId);

    lines.push(`### ${auth.label}`);
    lines.push(``);
    lines.push(`| Outcome | Authored % | Generated % | Δ |`);
    lines.push(`|---------|----------:|------------:|--:|`);

    let newlyReachable: string[] = [];
    let newlyUnreachable: string[] = [];

    for (let i = 0; i < auth.spectrum.length; i++) {
      const authPct = (auth.counts[i] / trials) * 100;
      const genCount = gen?.counts[i] ?? 0;
      const genPct = (genCount / trials) * 100;
      const delta = genPct - authPct;
      const deltaStr = delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
      lines.push(`| ${auth.spectrum[i]} | ${authPct.toFixed(1)}% | ${genPct.toFixed(1)}% | ${deltaStr} |`);

      if (auth.counts[i] === 0 && genCount > 0) newlyReachable.push(auth.spectrum[i]);
      if (auth.counts[i] > 0 && genCount === 0) newlyUnreachable.push(auth.spectrum[i]);
    }

    if (newlyReachable.length > 0) {
      lines.push(``);
      lines.push(`> **Newly reachable** with generated decisions: ${newlyReachable.join(", ")}`);
    }
    if (newlyUnreachable.length > 0) {
      lines.push(``);
      lines.push(`> **Newly unreachable** with generated decisions: ${newlyUnreachable.join(", ")}`);
    }

    lines.push(``);
  }

  // ── Variable ceiling/floor comparison
  lines.push(`## Variable Ceiling/Floor Comparison`);
  lines.push(``);
  lines.push(`Variables where generated decisions significantly shift ceiling/floor hit rates (>10% difference).`);
  lines.push(``);

  interface BoundRow {
    variable: string;
    bound: string;
    authored: string;
    generated: string;
    delta: string;
  }
  const boundRows: BoundRow[] = [];

  for (const k of stateKeys) {
    const authVals = authoredResults.map((r) => r.finalState[k]);
    const genVals = generatedResults.map((r) => r.finalState[k]);
    const authStats = computeVarStats(authVals);
    const genStats = computeVarStats(genVals);

    // Check ceiling hit rate
    const authCeiling = authVals.filter((v) => v === authStats.max).length / trials;
    const genCeiling = genVals.filter((v) => v === genStats.max).length / trials;
    if (Math.abs(authCeiling - genCeiling) > 0.1) {
      boundRows.push({
        variable: k,
        bound: `ceil=${authStats.max}`,
        authored: `${(authCeiling * 100).toFixed(1)}%`,
        generated: `${(genCeiling * 100).toFixed(1)}%`,
        delta: `${((genCeiling - authCeiling) * 100 > 0 ? "+" : "") + ((genCeiling - authCeiling) * 100).toFixed(1)}%`,
      });
    }

    // Check floor hit rate
    const authFloor = authVals.filter((v) => v === authStats.min).length / trials;
    const genFloor = genVals.filter((v) => v === genStats.min).length / trials;
    if (Math.abs(authFloor - genFloor) > 0.1) {
      boundRows.push({
        variable: k,
        bound: `floor=${authStats.min}`,
        authored: `${(authFloor * 100).toFixed(1)}%`,
        generated: `${(genFloor * 100).toFixed(1)}%`,
        delta: `${((genFloor - authFloor) * 100 > 0 ? "+" : "") + ((genFloor - authFloor) * 100).toFixed(1)}%`,
      });
    }
  }

  if (boundRows.length > 0) {
    lines.push(`| Variable | Bound | Authored | Generated | Δ |`);
    lines.push(`|----------|-------|--------:|----------:|--:|`);
    for (const row of boundRows) {
      lines.push(`| ${row.variable} | ${row.bound} | ${row.authored} | ${row.generated} | ${row.delta} |`);
    }
  } else {
    lines.push(`No variables show >10% shift in ceiling/floor hit rates between authored and generated decisions.`);
  }

  lines.push(``);

  // ── Summary
  lines.push(`## Summary`);
  lines.push(``);

  let newlyReachableTotal = 0;
  let newlyUnreachableTotal = 0;
  for (const arcId of arcIds) {
    const auth = authoredArcs.get(arcId)!;
    const gen = generatedArcs.get(arcId);
    for (let i = 0; i < auth.spectrum.length; i++) {
      if (auth.counts[i] === 0 && (gen?.counts[i] ?? 0) > 0) newlyReachableTotal++;
      if (auth.counts[i] > 0 && (gen?.counts[i] ?? 0) === 0) newlyUnreachableTotal++;
    }
  }

  lines.push(`- **${trials.toLocaleString()} trials** per mode (authored vs generated)`);
  lines.push(`- **${newlyReachableTotal} arc outcomes** newly reachable with generated decisions`);
  lines.push(`- **${newlyUnreachableTotal} arc outcomes** lost (unreachable) with generated decisions`);
  lines.push(`- **${boundRows.length} variables** show >10% shift in ceiling/floor hit rates`);
  lines.push(``);

  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): { trials: number; heuristic: Heuristic; output: string | null } {
  const args = process.argv.slice(2);
  let trials = 10_000;
  let heuristic: Heuristic = "random";
  let output: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--trials" || args[i] === "-n") trials = parseInt(args[++i], 10);
    else if (args[i] === "--heuristic" || args[i] === "-h") heuristic = args[++i] as Heuristic;
    else if (args[i] === "-o" || args[i] === "--output") output = args[++i];
    else if (args[i] === "--help") {
      console.log(`Usage: bun scripts/simulate-generated.ts [options]
  --trials, -n     Number of trials per mode (default: 10000)
  --heuristic, -h  Heuristic: random|hawk|dove|chaotic (default: random)
  -o, --output     Write markdown report to file (default: stdout)`);
      process.exit(0);
    }
  }

  return { trials, heuristic, output };
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (import.meta.main) {
  const { trials, heuristic, output } = parseArgs();

  console.error(
    `Running ${trials.toLocaleString()} authored trials + ${trials.toLocaleString()} generated trials with "${heuristic}" heuristic...`,
  );

  const t0 = performance.now();

  const authoredResults: TrialResult[] = [];
  for (let i = 0; i < trials; i++) {
    authoredResults.push(runTrial(heuristic));
  }

  console.error(`  Authored done. Sampling generated decisions...`);

  const generatedResults: TrialResult[] = [];
  for (let i = 0; i < trials; i++) {
    generatedResults.push(runGeneratedTrial(heuristic));
  }

  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  console.error(`Done in ${elapsed}s`);

  const report = generateComparisonReport(trials, heuristic, authoredResults, generatedResults);

  if (output) {
    await Bun.write(output, report);
    console.error(`Report written to ${output}`);
  } else {
    console.log(report);
  }
}
