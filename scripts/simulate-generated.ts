#!/usr/bin/env bun
/**
 * Monte Carlo simulator using randomly sampled decision sets for all 5 rounds.
 *
 * Instead of calling the LLM, this script samples random valid effect sets from
 * each DecisionTemplate's variableScope constraints. This lets balance tuning
 * account for the full range of possible LLM-generated decisions.
 *
 * All 5 rounds use sampleRoundDecisions() per template per trial.
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
  type RoundDecisions,
} from "../packages/shared/src/index.js";

import {
  sampleRandomDecision,
  sampleRoundDecisions,
  sampleAllRounds,
  runTrialWithDecisions,
  type Heuristic,
  type TrialResult,
} from "./simulate-core.js";

// Re-export for tests that import from here
export { sampleRandomDecision, sampleRoundDecisions };

// ── Generated Trial ──────────────────────────────────────────────────────────

/**
 * Run a single trial using freshly sampled decisions for all 5 rounds.
 */
export function runGeneratedTrial(heuristic: Heuristic): TrialResult {
  const rounds = sampleAllRounds();
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

function generateReport(
  trials: number,
  heuristic: Heuristic,
  results: TrialResult[],
): string {
  const arcMap = buildArcMap(results);
  const stateKeys = Object.keys(INITIAL_STATE) as (keyof StateVariables)[];

  const lines: string[] = [];
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  lines.push(`# Generated Decision Simulation Report`);
  lines.push(``);
  lines.push(`All 5 rounds sampled from templates.`);
  lines.push(``);
  lines.push(`- **Trials:** ${trials.toLocaleString()}`);
  lines.push(`- **Heuristic:** ${heuristic}`);
  lines.push(`- **Generated:** ${now}`);
  lines.push(``);

  // ── Arc outcome distribution
  lines.push(`## Ending Arc Distribution`);
  lines.push(``);

  const arcIds = [...arcMap.keys()];

  for (const arcId of arcIds) {
    const stats = arcMap.get(arcId)!;

    lines.push(`### ${stats.label}`);
    lines.push(``);
    lines.push(`| Outcome | Count | % |`);
    lines.push(`|---------|------:|--:|`);

    for (let i = 0; i < stats.spectrum.length; i++) {
      const count = stats.counts[i];
      const pct = ((count / trials) * 100).toFixed(1);
      lines.push(`| ${stats.spectrum[i]} | ${count.toLocaleString()} | ${pct}% |`);
    }

    const unreachable = stats.counts.filter((c) => c === 0).length;
    if (unreachable > 0) {
      lines.push(``);
      lines.push(`> **Warning:** ${unreachable} outcome(s) never occurred in ${trials.toLocaleString()} trials.`);
    }

    lines.push(``);
  }

  // ── Variable statistics
  lines.push(`## Final State Variable Distributions`);
  lines.push(``);
  lines.push(`| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |`);
  lines.push(`|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|`);

  for (const k of stateKeys) {
    const vals = results.map((r) => r.finalState[k]);
    const s = computeVarStats(vals);
    const init = INITIAL_STATE[k];
    lines.push(`| ${k} | ${init} | ${s.mean} | ${s.std} | ${s.min} | ${s.p25} | ${s.median} | ${s.p75} | ${s.max} |`);
  }

  lines.push(``);

  // ── Summary
  lines.push(`## Summary`);
  lines.push(``);

  let totalUnreachable = 0;
  for (const arcId of arcIds) {
    const stats = arcMap.get(arcId)!;
    totalUnreachable += stats.counts.filter((c) => c === 0).length;
  }

  lines.push(`- **${trials.toLocaleString()} trials** with template-sampled decisions`);
  lines.push(`- **${arcIds.length} ending arcs** analyzed`);
  lines.push(`- **${totalUnreachable} unreachable outcomes** across all arcs`);
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
  --trials, -n     Number of trials (default: 10000)
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
    `Running ${trials.toLocaleString()} generated trials with "${heuristic}" heuristic...`,
  );

  const t0 = performance.now();

  const results: TrialResult[] = [];
  for (let i = 0; i < trials; i++) {
    results.push(runGeneratedTrial(heuristic));
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
}
