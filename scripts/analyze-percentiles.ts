#!/usr/bin/env bun
/**
 * Percentile analysis for ending arc threshold tuning.
 *
 * Runs 10K generated-random trials, computes p10/p25/p50/p75/p90 for each
 * state variable's final value, and maps each resolver's thresholds to what
 * percentile of trials would trigger them.
 *
 * Usage:
 *   bun scripts/analyze-percentiles.ts                 # 10k trials, report to stdout
 *   bun scripts/analyze-percentiles.ts --trials 5000   # custom trial count
 *   bun scripts/analyze-percentiles.ts -o report.md    # write to file
 */

import {
  INITIAL_STATE,
  type StateVariables,
} from "../packages/shared/src/index.js";

import { sampleRoundDecisions, runGeneratedTrial } from "./simulate-generated.js";
import type { Heuristic, TrialResult } from "./simulate-core.js";

// ── Stats helpers ─────────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function fractionBelow(sorted: number[], threshold: number): number {
  let count = 0;
  for (const v of sorted) {
    if (v < threshold) count++;
    else break; // sorted, so we can stop
  }
  return count / sorted.length;
}

function fractionAtOrBelow(sorted: number[], threshold: number): number {
  let count = 0;
  for (const v of sorted) {
    if (v <= threshold) count++;
    else break;
  }
  return count / sorted.length;
}

function fractionAbove(sorted: number[], threshold: number): number {
  return 1 - fractionAtOrBelow(sorted, threshold);
}

function fractionAtOrAbove(sorted: number[], threshold: number): number {
  return 1 - fractionBelow(sorted, threshold);
}

// ── Resolver threshold mapping ────────────────────────────────────────────────

interface ThresholdCheck {
  resolver: string;
  outcome: string;
  description: string;
  /** Fraction of trials that would satisfy this condition */
  fractionMet: number;
}

function analyzeResolverThresholds(
  varData: Map<string, number[]>,
): ThresholdCheck[] {
  const checks: ThresholdCheck[] = [];

  const get = (key: string) => varData.get(key)!;

  // ── resolveAlignment ──
  checks.push({
    resolver: "alignment",
    outcome: "misaligned (doomClock < 2)",
    description: "doomClockDistance < 2",
    fractionMet: fractionBelow(get("doomClockDistance"), 2),
  });
  checks.push({
    resolver: "alignment",
    outcome: "genuinely aligned (path 1: safety breakthrough)",
    description: "promSafetyBreakthroughProgress >= 80 && alignmentConfidence >= 60 && aiAutonomyLevel <= 50",
    fractionMet: (() => {
      const psbp = varData.get("promSafetyBreakthroughProgress")!;
      const ac = varData.get("alignmentConfidence")!;
      const aal = varData.get("aiAutonomyLevel")!;
      // Need to check joint distribution — use raw data
      return -1; // placeholder, handled below
    })(),
  });
  checks.push({
    resolver: "alignment",
    outcome: "genuinely aligned (path 2: high confidence)",
    description: "alignmentConfidence >= 75 && misalignmentSeverity <= 15 && aiAutonomyLevel <= 60",
    fractionMet: -1,
  });
  checks.push({
    resolver: "alignment",
    outcome: "aligned to oversight",
    description: "alignmentConfidence >= 50 && misalignmentSeverity <= 35 && aiAutonomyLevel <= 70",
    fractionMet: -1,
  });

  // ── resolveControl ──
  checks.push({
    resolver: "control",
    outcome: "AI outpaced oversight",
    description: "aiAutonomyLevel > 70",
    fractionMet: fractionAbove(get("aiAutonomyLevel"), 70),
  });
  checks.push({
    resolver: "control",
    outcome: "government controlled (securityLevelOB >= 4)",
    description: "securityLevelOB >= 4",
    fractionMet: fractionAtOrAbove(get("securityLevelOB"), 4),
  });
  checks.push({
    resolver: "control",
    outcome: "government controlled (securityLevelProm >= 4)",
    description: "securityLevelProm >= 4",
    fractionMet: fractionAtOrAbove(get("securityLevelProm"), 4),
  });
  checks.push({
    resolver: "control",
    outcome: "government controlled (regulatoryPressure >= 70)",
    description: "regulatoryPressure >= 70",
    fractionMet: fractionAtOrAbove(get("regulatoryPressure"), 70),
  });

  // ── resolveUsChinaRelations ──
  checks.push({
    resolver: "usChinaRelations",
    outcome: "active conflict (taiwanTension > 75)",
    description: "taiwanTension > 75",
    fractionMet: fractionAbove(get("taiwanTension"), 75),
  });
  checks.push({
    resolver: "usChinaRelations",
    outcome: "active conflict (ccpPatience < 20)",
    description: "ccpPatience < 20",
    fractionMet: fractionBelow(get("ccpPatience"), 20),
  });

  // ── resolvePublicReaction ──
  checks.push({
    resolver: "publicReaction",
    outcome: "unaware",
    description: "publicAwareness <= 20",
    fractionMet: fractionAtOrBelow(get("publicAwareness"), 20),
  });

  // ── resolveEconomy ──
  // Need adjustedDisruption — compute from raw data
  // Placeholder
  checks.push({
    resolver: "economy",
    outcome: "thresholds require adjustedDisruption (see below)",
    description: "adjustedDisruption = economicDisruption + burnPressure*0.2 - (marketIndex-50)*0.3",
    fractionMet: -1,
  });

  return checks;
}

// ── Report Generation ─────────────────────────────────────────────────────────

function generateReport(
  trials: number,
  heuristics: Heuristic[],
  allResults: Map<Heuristic, TrialResult[]>,
): string {
  const stateKeys = Object.keys(INITIAL_STATE) as (keyof StateVariables)[];
  const lines: string[] = [];
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  lines.push(`# Percentile Analysis for Threshold Tuning`);
  lines.push(``);
  lines.push(`- **Trials:** ${trials.toLocaleString()} per heuristic`);
  lines.push(`- **Heuristics:** ${heuristics.join(", ")}`);
  lines.push(`- **All 5 rounds sampled from templates**`);
  lines.push(`- **Generated:** ${now}`);
  lines.push(``);

  for (const heuristic of heuristics) {
    const results = allResults.get(heuristic)!;

    lines.push(`## Heuristic: ${heuristic}`);
    lines.push(``);

    // ── Variable percentiles
    lines.push(`### State Variable Percentiles`);
    lines.push(``);
    lines.push(`| Variable | Initial | p10 | p25 | p50 | p75 | p90 | Min | Max |`);
    lines.push(`|----------|---------|-----|-----|-----|-----|-----|-----|-----|`);

    const varData = new Map<string, number[]>();

    for (const k of stateKeys) {
      const values = results.map((r) => r.finalState[k]);
      const sorted = [...values].sort((a, b) => a - b);
      varData.set(k, sorted);

      const initial = INITIAL_STATE[k];
      const p10 = Math.round(percentile(sorted, 10) * 10) / 10;
      const p25 = Math.round(percentile(sorted, 25) * 10) / 10;
      const p50 = Math.round(percentile(sorted, 50) * 10) / 10;
      const p75 = Math.round(percentile(sorted, 75) * 10) / 10;
      const p90 = Math.round(percentile(sorted, 90) * 10) / 10;
      lines.push(
        `| ${k} | ${initial} | ${p10} | ${p25} | ${p50} | ${p75} | ${p90} | ${sorted[0]} | ${sorted[sorted.length - 1]} |`,
      );
    }
    lines.push(``);

    // ── Adjusted disruption percentiles (for economy resolver)
    const adjustedDisruptionValues = results.map((r) => {
      const s = r.finalState;
      const burnPressure = (s.obBurnRate + s.promBurnRate) / 2;
      return s.economicDisruption + burnPressure * 0.2 - (s.marketIndex - 50) * 0.3;
    });
    const adjSorted = [...adjustedDisruptionValues].sort((a, b) => a - b);

    lines.push(`### Economy Resolver: adjustedDisruption`);
    lines.push(``);
    lines.push(`adjustedDisruption = economicDisruption + burnPressure*0.2 - (marketIndex-50)*0.3`);
    lines.push(``);
    lines.push(`| p10 | p25 | p50 | p75 | p90 | Min | Max |`);
    lines.push(`|-----|-----|-----|-----|-----|-----|-----|`);
    lines.push(
      `| ${pf(percentile(adjSorted, 10))} | ${pf(percentile(adjSorted, 25))} | ${pf(percentile(adjSorted, 50))} | ${pf(percentile(adjSorted, 75))} | ${pf(percentile(adjSorted, 90))} | ${pf(adjSorted[0])} | ${pf(adjSorted[adjSorted.length - 1])} |`,
    );
    lines.push(``);
    lines.push(`Economy threshold trigger rates:`);
    lines.push(`- adjustedDisruption <= 25 (boom): ${pct(fractionAtOrBelow(adjSorted, 25))}`);
    lines.push(`- adjustedDisruption <= 50 (adaptation): ${pct(fractionAtOrBelow(adjSorted, 50))}`);
    lines.push(`- adjustedDisruption <= 70 (painful): ${pct(fractionAtOrBelow(adjSorted, 70))}`);
    lines.push(`- adjustedDisruption > 70 (collapse): ${pct(fractionAbove(adjSorted, 70))}`);
    lines.push(``);

    // ── Resolver threshold trigger rates
    lines.push(`### Resolver Threshold Trigger Rates`);
    lines.push(``);

    // Joint conditions — compute from raw results
    lines.push(`#### Alignment`);
    lines.push(``);
    let doomMis = 0, genuinePath1 = 0, genuinePath2 = 0, oversight = 0, superficial = 0, misaligned = 0;
    for (const r of results) {
      const s = r.finalState;
      if (s.doomClockDistance < 2) { doomMis++; continue; }
      if (s.promSafetyBreakthroughProgress >= 80 && s.alignmentConfidence >= 60 && s.aiAutonomyLevel <= 50) { genuinePath1++; continue; }
      if (s.alignmentConfidence >= 75 && s.misalignmentSeverity <= 15 && s.aiAutonomyLevel <= 60) { genuinePath2++; continue; }
      if (s.alignmentConfidence >= 50 && s.misalignmentSeverity <= 35 && s.aiAutonomyLevel <= 70) { oversight++; continue; }
      if (s.alignmentConfidence >= 25 || s.misalignmentSeverity <= 60) { superficial++; continue; }
      misaligned++;
    }
    const n = results.length;
    lines.push(`| Outcome | Trigger Rate |`);
    lines.push(`|---------|-------------|`);
    lines.push(`| Misaligned (doomClock < 2) | ${pct(doomMis / n)} |`);
    lines.push(`| Genuinely aligned (safety breakthrough path) | ${pct(genuinePath1 / n)} |`);
    lines.push(`| Genuinely aligned (high confidence path) | ${pct(genuinePath2 / n)} |`);
    lines.push(`| Aligned to oversight | ${pct(oversight / n)} |`);
    lines.push(`| Superficially aligned | ${pct(superficial / n)} |`);
    lines.push(`| Misaligned (fallthrough) | ${pct(misaligned / n)} |`);
    lines.push(``);

    lines.push(`#### Control`);
    lines.push(``);
    let ctrlAI = 0, ctrlDist = 0, ctrlGov = 0, ctrlSingle = 0, ctrlAILow = 0, ctrlNone = 0;
    for (const r of results) {
      const s = r.finalState;
      if (s.aiAutonomyLevel > 70) { ctrlAI++; continue; }
      if (s.intlCooperation >= 60 && s.obInternalTrust >= 60 && s.obBoardConfidence >= 50 && s.promBoardConfidence >= 50) { ctrlDist++; continue; }
      if (s.securityLevelOB >= 4 || s.securityLevelProm >= 4 || s.regulatoryPressure >= 70) { ctrlGov++; continue; }
      if (s.obCapability - s.chinaCapability > 30 && s.intlCooperation < 30 && s.obBoardConfidence >= 60) { ctrlSingle++; continue; }
      if (s.alignmentConfidence < 30 && (s.obCapability >= 70 || s.chinaCapability >= 70)) { ctrlAILow++; continue; }
      ctrlNone++;
    }
    lines.push(`| Outcome | Trigger Rate |`);
    lines.push(`|---------|-------------|`);
    lines.push(`| AI outpaced oversight (autonomy > 70) | ${pct(ctrlAI / n)} |`);
    lines.push(`| Distributed/democratic | ${pct(ctrlDist / n)} |`);
    lines.push(`| Government controlled | ${pct(ctrlGov / n)} |`);
    lines.push(`| Single company | ${pct(ctrlSingle / n)} |`);
    lines.push(`| AI autonomous (low alignment) | ${pct(ctrlAILow / n)} |`);
    lines.push(`| No one controls (fallthrough) | ${pct(ctrlNone / n)} |`);
    lines.push(``);

    lines.push(`#### US-China Relations`);
    lines.push(``);
    let uscrConflict = 0, uscrCold = 0, uscrTense = 0, uscrArms = 0, uscrCoop = 0;
    for (const r of results) {
      const s = r.finalState;
      if (s.ccpPatience < 20) { uscrConflict++; continue; }
      if (s.chinaWeightTheftProgress > 80 && s.taiwanTension > 70) { uscrConflict++; continue; }
      if (s.taiwanTension > 75) { uscrConflict++; continue; }
      const chipReducesTension = s.domesticChipProgress > 60;
      const cooperationTensionCeiling = chipReducesTension ? 35 : 20;
      if (s.intlCooperation >= 70 && s.taiwanTension <= cooperationTensionCeiling) { uscrCoop++; continue; }
      if (s.intlCooperation >= 50 && s.taiwanTension <= 40) { uscrArms++; continue; }
      if (s.intlCooperation >= 30 && s.taiwanTension <= 60) { uscrTense++; continue; }
      uscrCold++;
    }
    lines.push(`| Outcome | Trigger Rate |`);
    lines.push(`|---------|-------------|`);
    lines.push(`| Active conflict | ${pct(uscrConflict / n)} |`);
    lines.push(`| Cold war | ${pct(uscrCold / n)} |`);
    lines.push(`| Tense but stable | ${pct(uscrTense / n)} |`);
    lines.push(`| Arms control | ${pct(uscrArms / n)} |`);
    lines.push(`| Joint cooperation | ${pct(uscrCoop / n)} |`);
    lines.push(``);

    lines.push(`#### Public Reaction`);
    lines.push(``);
    let prRiots = 0, prProtest = 0, prAnxious = 0, prOptimistic = 0, prUnaware = 0;
    for (const r of results) {
      const s = r.finalState;
      if (s.publicAwareness <= 20) { prUnaware++; continue; }
      if (s.regulatoryPressure > 70 && s.publicSentiment < 0) { prRiots++; continue; }
      if (s.publicSentiment >= 30 && s.publicAwareness <= 90) { prOptimistic++; continue; }
      if (s.publicSentiment >= 0) { prAnxious++; continue; }
      if (s.publicSentiment >= -40) { prProtest++; continue; }
      prRiots++;
    }
    lines.push(`| Outcome | Trigger Rate |`);
    lines.push(`|---------|-------------|`);
    lines.push(`| Riots and upheaval | ${pct(prRiots / n)} |`);
    lines.push(`| Sustained protest | ${pct(prProtest / n)} |`);
    lines.push(`| Anxious but stable | ${pct(prAnxious / n)} |`);
    lines.push(`| Cautiously optimistic | ${pct(prOptimistic / n)} |`);
    lines.push(`| Unaware | ${pct(prUnaware / n)} |`);
    lines.push(``);

    // ── Individual threshold trigger rates (for tuning reference)
    lines.push(`### Individual Threshold Trigger Rates`);
    lines.push(``);
    lines.push(`| Condition | Trigger Rate |`);
    lines.push(`|-----------|-------------|`);

    const thresholds: [string, (s: StateVariables) => boolean][] = [
      ["alignmentConfidence >= 75", (s) => s.alignmentConfidence >= 75],
      ["alignmentConfidence >= 60", (s) => s.alignmentConfidence >= 60],
      ["alignmentConfidence >= 50", (s) => s.alignmentConfidence >= 50],
      ["alignmentConfidence >= 25", (s) => s.alignmentConfidence >= 25],
      ["misalignmentSeverity <= 15", (s) => s.misalignmentSeverity <= 15],
      ["misalignmentSeverity <= 35", (s) => s.misalignmentSeverity <= 35],
      ["aiAutonomyLevel <= 50", (s) => s.aiAutonomyLevel <= 50],
      ["aiAutonomyLevel <= 60", (s) => s.aiAutonomyLevel <= 60],
      ["aiAutonomyLevel <= 70", (s) => s.aiAutonomyLevel <= 70],
      ["aiAutonomyLevel > 70", (s) => s.aiAutonomyLevel > 70],
      ["securityLevelOB >= 4", (s) => s.securityLevelOB >= 4],
      ["securityLevelOB >= 5", (s) => s.securityLevelOB >= 5],
      ["securityLevelProm >= 4", (s) => s.securityLevelProm >= 4],
      ["securityLevelProm >= 5", (s) => s.securityLevelProm >= 5],
      ["regulatoryPressure >= 70", (s) => s.regulatoryPressure >= 70],
      ["regulatoryPressure >= 80", (s) => s.regulatoryPressure >= 80],
      ["publicAwareness <= 20", (s) => s.publicAwareness <= 20],
      ["publicAwareness <= 15", (s) => s.publicAwareness <= 15],
      ["publicAwareness <= 10", (s) => s.publicAwareness <= 10],
      ["publicSentiment >= 30", (s) => s.publicSentiment >= 30],
      ["publicSentiment >= 0", (s) => s.publicSentiment >= 0],
      ["publicSentiment < 0", (s) => s.publicSentiment < 0],
      ["taiwanTension > 75", (s) => s.taiwanTension > 75],
      ["taiwanTension > 80", (s) => s.taiwanTension > 80],
      ["taiwanTension > 65", (s) => s.taiwanTension > 65],
      ["ccpPatience < 20", (s) => s.ccpPatience < 20],
      ["ccpPatience < 30", (s) => s.ccpPatience < 30],
      ["intlCooperation >= 30", (s) => s.intlCooperation >= 30],
      ["intlCooperation >= 50", (s) => s.intlCooperation >= 50],
      ["intlCooperation >= 60", (s) => s.intlCooperation >= 60],
      ["intlCooperation >= 70", (s) => s.intlCooperation >= 70],
      ["doomClockDistance < 2", (s) => s.doomClockDistance < 2],
      ["promSafetyBreakthroughProgress >= 80", (s) => s.promSafetyBreakthroughProgress >= 80],
    ];

    for (const [label, pred] of thresholds) {
      const count = results.filter((r) => pred(r.finalState)).length;
      lines.push(`| ${label} | ${pct(count / n)} |`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

function pf(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): { trials: number; output: string | null } {
  const args = process.argv.slice(2);
  let trials = 10_000;
  let output: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--trials" || args[i] === "-n") trials = parseInt(args[++i], 10);
    else if (args[i] === "-o" || args[i] === "--output") output = args[++i];
    else if (args[i] === "--help") {
      console.log(`Usage: bun scripts/analyze-percentiles.ts [options]
  --trials, -n     Number of trials per heuristic (default: 10000)
  -o, --output     Write report to file (default: stdout)`);
      process.exit(0);
    }
  }

  return { trials, output };
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (import.meta.main) {
  const { trials, output } = parseArgs();
  const heuristics: Heuristic[] = ["random", "hawk", "dove"];

  const allResults = new Map<Heuristic, TrialResult[]>();

  for (const h of heuristics) {
    console.error(`Running ${trials.toLocaleString()} trials with "${h}" heuristic...`);
    const results: TrialResult[] = [];
    for (let i = 0; i < trials; i++) {
      results.push(runGeneratedTrial(h));
    }
    allResults.set(h, results);
  }

  console.error(`Done. Generating report...`);

  const report = generateReport(trials, heuristics, allResults);

  if (output) {
    await Bun.write(output, report);
    console.error(`Report written to ${output}`);
  } else {
    console.log(report);
  }
}
