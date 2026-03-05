/**
 * Fix directional bias for 4 saturating variables by:
 *
 * 1. alignmentConfidence: Target E[Δ] ≈ +25 (from +59.8). Zero out positive
 *    deltas in decisions where ALL options push positive (the "free safety" problem).
 *
 * 2. regulatoryPressure: Target E[Δ] ≈ +55 (from +86.4). Zero out some
 *    all-positive decisions.
 *
 * 3. usChinaGap: Target E[Δ] ≈ -4 (from -10.0). Add positive deltas to
 *    US-side roles that don't currently touch this variable.
 *
 * 4. obPromGap: Target E[Δ] ≈ -1 (from -4.0). Add positive deltas to
 *    OB-side roles that don't currently touch this variable.
 */

import { ROUND1_DECISIONS } from "../packages/server/src/content/decisions/round1.js";
import { ROUND2_DECISIONS } from "../packages/server/src/content/decisions/round2.js";
import { ROUND3_DECISIONS } from "../packages/server/src/content/decisions/round3.js";
import { ROUND4_DECISIONS } from "../packages/server/src/content/decisions/round4.js";
import { ROUND5_DECISIONS } from "../packages/server/src/content/decisions/round5.js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DECISION_DIR = join(import.meta.dir, "../packages/server/src/content/decisions");

// ── Analysis helpers ──

interface DecisionInfo {
  round: number;
  role: string;
  optionIds: string[];
  deltas: number[]; // one per option (0 if variable not present)
  expected: number;
  allPositive: boolean;
  allNegative: boolean;
}

function analyzeVariable(varName: string): DecisionInfo[] {
  const allRounds = [
    { round: 1, decisions: ROUND1_DECISIONS },
    { round: 2, decisions: ROUND2_DECISIONS },
    { round: 3, decisions: ROUND3_DECISIONS },
    { round: 4, decisions: ROUND4_DECISIONS },
    { round: 5, decisions: ROUND5_DECISIONS },
  ];

  const results: DecisionInfo[] = [];
  for (const { round, decisions } of allRounds) {
    const teamDecisions = (decisions as any).team ?? (decisions as any).collective ?? [];
    const allDecisions = [...decisions.individual, ...teamDecisions];
    for (const d of allDecisions) {
      const deltas: number[] = [];
      const optionIds: string[] = [];
      for (const opt of d.options) {
        optionIds.push(opt.id);
        const eff = opt.effects.find((e: any) => e.variable === varName);
        deltas.push(eff ? eff.delta : 0);
      }
      const sum = deltas.reduce((a, b) => a + b, 0);
      if (sum === 0 && deltas.every(d => d === 0)) continue;

      const nonZero = deltas.filter(d => d !== 0);
      results.push({
        round,
        role: (d as any).role || "collective",
        optionIds,
        deltas,
        expected: sum / deltas.length,
        allPositive: nonZero.length > 0 && nonZero.every(d => d > 0),
        allNegative: nonZero.length > 0 && nonZero.every(d => d < 0),
      });
    }
  }
  return results;
}

// ── File mutation helpers ──

function zeroOutEffect(content: string, optionId: string, varName: string): string {
  // Find the option block by its ID, then find the variable effect and set delta to 0
  const optIdIdx = content.indexOf(`"${optionId}"`);
  if (optIdIdx === -1) return content;

  // Find the next effects array after this option ID
  const afterOpt = content.slice(optIdIdx);
  const effectPattern = new RegExp(
    `(\\{ variable: "${varName}", delta: )-?\\d+( \\})`,
  );
  const match = afterOpt.match(effectPattern);
  if (!match || match.index === undefined) return content;

  // Make sure this effect is within the same option (before the next option ID)
  const nextOptMatch = afterOpt.slice(100).match(/id: "/);
  if (nextOptMatch && nextOptMatch.index !== undefined && match.index > nextOptMatch.index + 100) {
    return content; // effect belongs to a different option
  }

  const absPos = optIdIdx + match.index;
  return content.slice(0, absPos) + `${match[1]}0${match[2]}` + content.slice(absPos + match[0].length);
}

function addEffect(content: string, optionId: string, varName: string, delta: number): string {
  // Find the option block, then add a new effect entry at the end of its effects array
  const optIdIdx = content.indexOf(`"${optionId}"`);
  if (optIdIdx === -1) return content;

  // Find the effects array closing bracket
  const afterOpt = content.slice(optIdIdx);
  // Find the last effect entry before the effects array closes
  // Look for the pattern: "{ variable: ..., delta: ... },\n          ]"
  // or just find "],\n" after effects entries

  // Find "effects: [" after this option
  const effectsIdx = afterOpt.indexOf("effects: [");
  if (effectsIdx === -1) return content;

  const afterEffects = afterOpt.slice(effectsIdx);
  // Find the closing "]" of the effects array
  const closingIdx = afterEffects.indexOf("],");
  if (closingIdx === -1) return content;

  // Insert before the closing bracket
  const absPos = optIdIdx + effectsIdx + closingIdx;
  const indent = "            ";
  const newEffect = `\n${indent}{ variable: "${varName}", delta: ${delta} },`;

  return content.slice(0, absPos) + newEffect + "\n          " + content.slice(absPos);
}

// ── Main ──

// Step 1: alignmentConfidence — zero out the smallest delta in all-positive decisions
// Target: reduce E[Δ] from 59.8 to ~25 (need to remove ~35)
const acInfos = analyzeVariable("alignmentConfidence");
const acAllPositive = acInfos
  .filter(d => d.allPositive)
  .sort((a, b) => b.expected - a.expected); // biggest expected first

console.log(`alignmentConfidence: ${acAllPositive.length} all-positive decisions`);

// For each all-positive decision, zero out the option with the smallest delta
// Each zeroing removes delta/nOpts from expected. We need to remove ~35 total.
let acRemoved = 0;
const acTargetRemoval = 35;
const acZeroOuts: { optionId: string; delta: number; nOpts: number }[] = [];

for (const d of acAllPositive) {
  if (acRemoved >= acTargetRemoval) break;
  // Find smallest positive delta
  let minIdx = 0;
  for (let i = 1; i < d.deltas.length; i++) {
    if (d.deltas[i] > 0 && (d.deltas[minIdx] === 0 || d.deltas[i] < d.deltas[minIdx])) {
      minIdx = i;
    }
  }
  const removal = d.deltas[minIdx] / d.deltas.length;
  acZeroOuts.push({ optionId: d.optionIds[minIdx], delta: d.deltas[minIdx], nOpts: d.deltas.length });
  acRemoved += removal;
}
console.log(`  Will zero out ${acZeroOuts.length} deltas, removing ~${acRemoved.toFixed(1)} from E[Δ]`);

// Step 2: regulatoryPressure — same approach
// Target: reduce from 86.4 to ~55 (remove ~31)
const rpInfos = analyzeVariable("regulatoryPressure");
const rpAllPositive = rpInfos
  .filter(d => d.allPositive)
  .sort((a, b) => b.expected - a.expected);

console.log(`\nregulatoryPressure: ${rpAllPositive.length} all-positive decisions`);

let rpRemoved = 0;
const rpTargetRemoval = 31;
const rpZeroOuts: { optionId: string; delta: number; nOpts: number }[] = [];

for (const d of rpAllPositive) {
  if (rpRemoved >= rpTargetRemoval) break;
  let minIdx = 0;
  for (let i = 1; i < d.deltas.length; i++) {
    if (d.deltas[i] > 0 && (d.deltas[minIdx] === 0 || d.deltas[i] < d.deltas[minIdx])) {
      minIdx = i;
    }
  }
  const removal = d.deltas[minIdx] / d.deltas.length;
  rpZeroOuts.push({ optionId: d.optionIds[minIdx], delta: d.deltas[minIdx], nOpts: d.deltas.length });
  rpRemoved += removal;
}
console.log(`  Will zero out ${rpZeroOuts.length} deltas, removing ~${rpRemoved.toFixed(1)} from E[Δ]`);

// Step 3 & 4: usChinaGap and obPromGap — find US/OB decisions to add positive deltas
// For usChinaGap: add to ob_cto, ext_nsa roles (target +6 to expected)
// For obPromGap: add to ob_cto, ob_ceo roles (target +3 to expected)

const allRoundsData = [
  { round: 1, decisions: ROUND1_DECISIONS },
  { round: 2, decisions: ROUND2_DECISIONS },
  { round: 3, decisions: ROUND3_DECISIONS },
  { round: 4, decisions: ROUND4_DECISIONS },
  { round: 5, decisions: ROUND5_DECISIONS },
];

// Find ob_cto decisions that don't touch usChinaGap
const gapAdditions: { optionId: string; variable: string; delta: number }[] = [];

for (const { round, decisions } of allRoundsData) {
  const teamDecisions = (decisions as any).team ?? (decisions as any).collective ?? [];
  const allDecisions = [...decisions.individual, ...teamDecisions];
  for (const d of allDecisions) {
    const role = (d as any).role;

    // usChinaGap: add +1 to one option in ob_cto and ext_nsa decisions
    if (["ob_cto", "ext_nsa"].includes(role)) {
      const touchesGap = d.options.some((o: any) =>
        o.effects.some((e: any) => e.variable === "usChinaGap")
      );
      if (!touchesGap) {
        // Add +1 to the first option (the "aggressive capability" option typically)
        gapAdditions.push({ optionId: d.options[0].id, variable: "usChinaGap", delta: 1 });
      }
    }

    // obPromGap: add +1 to one option in ob_cto decisions
    if (role === "ob_cto") {
      const touchesGap = d.options.some((o: any) =>
        o.effects.some((e: any) => e.variable === "obPromGap")
      );
      if (!touchesGap) {
        gapAdditions.push({ optionId: d.options[0].id, variable: "obPromGap", delta: 1 });
      }
    }

    // obPromGap: add +1 to one option in ob_security decisions
    if (role === "ob_security") {
      const touchesGap = d.options.some((o: any) =>
        o.effects.some((e: any) => e.variable === "obPromGap")
      );
      if (!touchesGap) {
        gapAdditions.push({ optionId: d.options[0].id, variable: "obPromGap", delta: 1 });
      }
    }
  }
}

console.log(`\nusChinaGap: will add ${gapAdditions.filter(g => g.variable === "usChinaGap").length} positive deltas`);
console.log(`obPromGap: will add ${gapAdditions.filter(g => g.variable === "obPromGap").length} positive deltas`);

// ── Apply mutations ──

const roundFiles = ["round1.ts", "round2.ts", "round3.ts", "round4.ts", "round5.ts"];
for (const file of roundFiles) {
  const filePath = join(DECISION_DIR, file);
  let content = readFileSync(filePath, "utf-8");
  let changes = 0;

  // Apply zero-outs for alignmentConfidence
  for (const z of acZeroOuts) {
    const before = content;
    content = zeroOutEffect(content, z.optionId, "alignmentConfidence");
    if (content !== before) changes++;
  }

  // Apply zero-outs for regulatoryPressure
  for (const z of rpZeroOuts) {
    const before = content;
    content = zeroOutEffect(content, z.optionId, "regulatoryPressure");
    if (content !== before) changes++;
  }

  // Apply additions for gaps
  for (const g of gapAdditions) {
    const before = content;
    content = addEffect(content, g.optionId, g.variable, g.delta);
    if (content !== before) changes++;
  }

  if (changes > 0) {
    writeFileSync(filePath, content);
    console.log(`${file}: ${changes} changes`);
  }
}

console.log("\nDone. Run `bun scripts/analyze-bias.ts` to verify.");
