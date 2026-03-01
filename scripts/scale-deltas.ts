#!/usr/bin/env bun
/**
 * Mechanically scale decision deltas to prevent variable saturation.
 *
 * Scaling rules (matching the worker's good results):
 * - |delta| <= 3: keep as-is
 * - |delta| 4-6: ×0.6 (5→3, 6→4)
 * - |delta| 7-10: ×0.5 (8→4, 10→5)
 * - |delta| 11-15: ×0.4 (12→5, 15→6)
 * - |delta| 16-20: ×0.35 (20→7)
 * - |delta| > 20: ×0.3
 */

import { readFileSync, writeFileSync } from "fs";

function scaleDelta(delta: number): number {
  const sign = Math.sign(delta);
  const abs = Math.abs(delta);
  if (abs <= 3) return delta;
  if (abs <= 6) return sign * Math.max(2, Math.round(abs * 0.6));
  if (abs <= 10) return sign * Math.max(3, Math.round(abs * 0.5));
  if (abs <= 15) return sign * Math.max(4, Math.round(abs * 0.4));
  if (abs <= 20) return sign * Math.max(5, Math.round(abs * 0.35));
  return sign * Math.max(6, Math.round(abs * 0.3));
}

const files = [
  "packages/server/src/content/decisions/round1.ts",
  "packages/server/src/content/decisions/round2.ts",
  "packages/server/src/content/decisions/round3.ts",
  "packages/server/src/content/decisions/round4.ts",
  "packages/server/src/content/decisions/round5.ts",
];

let totalChanges = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const result = content.replace(/delta:\s*(-?\d+)/g, (_match, rawDelta) => {
    const original = parseInt(rawDelta, 10);
    const scaled = scaleDelta(original);
    if (original !== scaled) totalChanges++;
    return `delta: ${scaled}`;
  });
  writeFileSync(file, result);
  console.log(`Processed ${file}`);
}

console.log(`\nTotal deltas changed: ${totalChanges}`);
