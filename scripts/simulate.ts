#!/usr/bin/env bun
/**
 * Monte Carlo game simulator for Takeoff Protocol.
 *
 * Runs N games with random decision picks, computes ending arc distributions,
 * and writes a markdown report.
 *
 * Usage:
 *   bun scripts/simulate.ts                    # 10k trials, report to stdout
 *   bun scripts/simulate.ts --trials 50000     # custom trial count
 *   bun scripts/simulate.ts -o report.md       # write to file
 *   bun scripts/simulate.ts --heuristic hawk   # use hawkish heuristic
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

const ROUNDS: RoundDecisions[] = [
  ROUND1_DECISIONS,
  ROUND2_DECISIONS,
  ROUND3_DECISIONS,
  ROUND4_DECISIONS,
  ROUND5_DECISIONS,
];

// ── Heuristics ──────────────────────────────────────────────────────────────

type Heuristic = "random" | "hawk" | "dove" | "chaotic";

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

function pickOption(options: DecisionOption[], heuristic: Heuristic): DecisionOption {
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

// ── Simulation ──────────────────────────────────────────────────────────────

function getAllOptions(round: RoundDecisions, heuristic: Heuristic): DecisionOption[] {
  const chosen: DecisionOption[] = [];

  for (const ind of round.individual) {
    chosen.push(pickOption(ind.options, heuristic));
  }
  for (const team of round.team) {
    chosen.push(pickOption(team.options, heuristic));
  }

  return chosen;
}

interface TrialResult {
  arcs: EndingArc[];
  finalState: StateVariables;
}

function runTrial(heuristic: Heuristic): TrialResult {
  let state = { ...INITIAL_STATE };

  for (const round of ROUNDS) {
    const chosen = getAllOptions(round, heuristic);
    state = resolveDecisions(state, chosen);
  }

  return { arcs: computeEndingArcs(state), finalState: state };
}

// ── Stats ───────────────────────────────────────────────────────────────────

interface ArcStats {
  label: string;
  spectrum: string[];
  counts: number[];
}

interface VarStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  p25: number;
  median: number;
  p75: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeVarStats(values: number[]): VarStats {
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

// ── Report Generation ───────────────────────────────────────────────────────

function generateReport(
  trials: number,
  heuristic: Heuristic,
  results: TrialResult[],
): string {
  // Arc outcome distributions
  const arcMap = new Map<string, ArcStats>();
  for (const r of results) {
    for (const arc of r.arcs) {
      if (!arcMap.has(arc.id)) {
        arcMap.set(arc.id, { label: arc.label, spectrum: arc.spectrum, counts: new Array(arc.spectrum.length).fill(0) });
      }
      arcMap.get(arc.id)!.counts[arc.result]++;
    }
  }

  // State variable distributions
  const stateKeys = Object.keys(INITIAL_STATE) as (keyof StateVariables)[];
  const stateValues: Record<string, number[]> = {};
  for (const k of stateKeys) stateValues[k] = [];
  for (const r of results) {
    for (const k of stateKeys) {
      stateValues[k].push(r.finalState[k]);
    }
  }

  // Decision frequency tracking
  const decisionCounts: Record<string, Record<string, number>> = {};
  // (We don't track per-trial decisions in the current loop, so we'll skip this for now
  // and focus on outcomes. Decision tracking would require storing choices per trial.)

  // Build markdown
  const lines: string[] = [];
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  lines.push(`# Simulation Report`);
  lines.push(``);
  lines.push(`- **Trials:** ${trials.toLocaleString()}`);
  lines.push(`- **Heuristic:** ${heuristic}`);
  lines.push(`- **Generated:** ${now}`);
  lines.push(``);

  // ── Arc distributions
  lines.push(`## Ending Arc Distributions`);
  lines.push(``);

  for (const [_id, stats] of arcMap) {
    lines.push(`### ${stats.label}`);
    lines.push(``);
    lines.push(`| Outcome | Count | % |`);
    lines.push(`|---------|------:|--:|`);

    const maxCount = Math.max(...stats.counts);

    for (let i = 0; i < stats.spectrum.length; i++) {
      const count = stats.counts[i];
      const pct = ((count / trials) * 100).toFixed(1);
      const bar = "█".repeat(Math.round((count / maxCount) * 20));
      lines.push(`| ${stats.spectrum[i]} | ${count.toLocaleString()} | ${pct}% ${bar} |`);
    }

    // Flag balance issues
    const pcts = stats.counts.map((c) => (c / trials) * 100);
    const maxPct = Math.max(...pcts);
    const minPct = Math.min(...pcts);
    const unreachable = pcts.filter((p) => p === 0).length;

    if (unreachable > 0) {
      lines.push(``);
      lines.push(`> **Warning:** ${unreachable} outcome(s) never occurred in ${trials.toLocaleString()} trials.`);
    }
    if (maxPct > 70) {
      lines.push(``);
      lines.push(`> **Warning:** One outcome dominates at ${maxPct.toFixed(1)}% — may indicate a balance issue.`);
    }
    if (maxPct - minPct > 50 && unreachable === 0) {
      lines.push(``);
      lines.push(`> **Note:** Large spread (${minPct.toFixed(1)}% – ${maxPct.toFixed(1)}%). Some outcomes are much rarer than others.`);
    }

    lines.push(``);
  }

  // ── State distributions
  lines.push(`## Final State Variable Distributions`);
  lines.push(``);
  lines.push(`| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |`);
  lines.push(`|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|`);

  for (const k of stateKeys) {
    const s = computeVarStats(stateValues[k]);
    const init = INITIAL_STATE[k];
    lines.push(`| ${k} | ${init} | ${s.mean} | ${s.std} | ${s.min} | ${s.p25} | ${s.median} | ${s.p75} | ${s.max} |`);
  }

  lines.push(``);

  // ── Flag variables that barely move
  lines.push(`## Balance Flags`);
  lines.push(``);

  const staleVars: string[] = [];
  const volatileVars: string[] = [];
  const ceilingVars: string[] = [];
  const floorVars: string[] = [];

  for (const k of stateKeys) {
    const s = computeVarStats(stateValues[k]);
    const init = INITIAL_STATE[k];
    const range = s.max - s.min;

    // Variable barely moves from initial (skip zero-std vars — those have no decisions wired yet)
    if (s.std > 0 && s.std < 2 && Math.abs(s.mean - init) < 3) {
      staleVars.push(`\`${k}\` (init: ${init}, mean: ${s.mean}, std: ${s.std})`);
    }
    // Variable always ends at ceiling/floor (skip unwired — reported separately)
    if (s.max === s.min && s.std === 0 && s.mean === INITIAL_STATE[k]) {
      // unwired, skip
    } else if (s.max === s.min) {
      ceilingVars.push(`\`${k}\` — always ends at ${s.max} (moved from initial ${init})`);
    } else if (s.p75 === s.max && s.median === s.max) {
      ceilingVars.push(`\`${k}\` — hits ceiling ${s.max} in >50% of games`);
    } else if (s.p25 === s.min && s.median === s.min) {
      floorVars.push(`\`${k}\` — hits floor ${s.min} in >50% of games`);
    }
    // Very high variance
    if (s.std > 25) {
      volatileVars.push(`\`${k}\` (std: ${s.std})`);
    }
  }

  // Unwired variables (zero variance AND value equals initial = no decisions touch them)
  const unwiredVars: string[] = [];
  for (const k of stateKeys) {
    const s = computeVarStats(stateValues[k]);
    if (s.std === 0 && s.min === s.max && s.mean === INITIAL_STATE[k]) {
      unwiredVars.push(`\`${k}\` (stuck at ${s.mean})`);
    }
  }

  if (unwiredVars.length > 0) {
    lines.push(`### Unwired Variables (no decisions affect them)`);
    lines.push(``);
    lines.push(`These variables never change from their initial value. No decision effects reference them.`);
    lines.push(``);
    for (const v of unwiredVars) lines.push(`- ${v}`);
    lines.push(``);
  }

  if (staleVars.length > 0) {
    lines.push(`### Stale Variables (barely change from initial)`);
    lines.push(``);
    lines.push(`These variables don't move meaningfully across trials. They might not have enough decisions affecting them.`);
    lines.push(``);
    for (const v of staleVars) lines.push(`- ${v}`);
    lines.push(``);
  }

  if (ceilingVars.length > 0 || floorVars.length > 0) {
    lines.push(`### Ceiling/Floor Hits`);
    lines.push(``);
    lines.push(`Variables that frequently hit their bounds — decisions affecting them may need rebalancing.`);
    lines.push(``);
    for (const v of [...ceilingVars, ...floorVars]) lines.push(`- ${v}`);
    lines.push(``);
  }

  if (volatileVars.length > 0) {
    lines.push(`### High Volatility`);
    lines.push(``);
    lines.push(`Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.`);
    lines.push(``);
    for (const v of volatileVars) lines.push(`- ${v}`);
    lines.push(``);
  }

  // ── Correlation hints (which arcs always co-occur)
  lines.push(`## Arc Correlation Matrix`);
  lines.push(``);
  lines.push(`Shows how often two arcs land on their "best" outcome together vs independently.`);
  lines.push(`Values > 1.0 = positively correlated, < 1.0 = anti-correlated.`);
  lines.push(``);

  const arcIds = [...arcMap.keys()];
  const arcLabels = arcIds.map((id) => arcMap.get(id)!.label);
  const bestOutcome = results.map((r) =>
    Object.fromEntries(r.arcs.map((a) => [a.id, a.result === a.spectrum.length - 1]))
  );

  // Header
  const shortLabels = arcLabels.map((l) => l.slice(0, 10));
  lines.push(`| | ${shortLabels.join(" | ")} |`);
  lines.push(`|---|${"---:|".repeat(arcIds.length)}`);

  for (let i = 0; i < arcIds.length; i++) {
    const row = [shortLabels[i]];
    const pA = bestOutcome.filter((b) => b[arcIds[i]]).length / trials;

    for (let j = 0; j < arcIds.length; j++) {
      if (i === j) {
        row.push("-");
        continue;
      }
      const pB = bestOutcome.filter((b) => b[arcIds[j]]).length / trials;
      const pAB = bestOutcome.filter((b) => b[arcIds[i]] && b[arcIds[j]]).length / trials;

      if (pA === 0 || pB === 0) {
        row.push("n/a");
      } else {
        const lift = pAB / (pA * pB);
        row.push(lift.toFixed(2));
      }
    }
    lines.push(`| ${row.join(" | ")} |`);
  }

  lines.push(``);

  // ── Summary
  lines.push(`## Summary`);
  lines.push(``);

  const totalArcs = arcMap.size;
  let totalUnreachable = 0;
  let totalDominant = 0;
  for (const [, stats] of arcMap) {
    const pcts = stats.counts.map((c) => (c / trials) * 100);
    totalUnreachable += pcts.filter((p) => p === 0).length;
    totalDominant += pcts.filter((p) => p > 70).length;
  }

  lines.push(`- **${totalArcs} ending arcs** analyzed`);
  lines.push(`- **${totalUnreachable} unreachable outcomes** across all arcs`);
  lines.push(`- **${totalDominant} dominant outcomes** (>70% frequency)`);
  lines.push(`- **${staleVars.length} stale variables** that barely move`);
  lines.push(`- **${ceilingVars.length + floorVars.length} variables** frequently hitting bounds`);
  lines.push(``);

  return lines.join("\n");
}

// ── CLI ─────────────────────────────────────────────────────────────────────

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
      console.log(`Usage: bun scripts/simulate.ts [options]
  --trials, -n     Number of trials (default: 10000)
  --heuristic, -h  Heuristic: random|hawk|dove|chaotic (default: random)
  -o, --output     Write markdown report to file (default: stdout)`);
      process.exit(0);
    }
  }

  return { trials, heuristic, output };
}

// ── Main ────────────────────────────────────────────────────────────────────

const { trials, heuristic, output } = parseArgs();

console.error(`Running ${trials.toLocaleString()} trials with "${heuristic}" heuristic...`);

const results: TrialResult[] = [];
const t0 = performance.now();

for (let i = 0; i < trials; i++) {
  results.push(runTrial(heuristic));
}

const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
console.error(`Done in ${elapsed}s`);

const report = generateReport(trials, heuristic, results);

if (output) {
  await Bun.write(output, report);
  console.error(`Report written to ${output}`);
} else {
  console.log(report);
}
