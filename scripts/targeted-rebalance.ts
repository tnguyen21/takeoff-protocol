#!/usr/bin/env bun
/**
 * Targeted second pass: further reduce deltas for variables that still saturate.
 *
 * From the sim report, these variables always hit ceiling/floor:
 * - publicAwareness: 10 → 100 (needs to stay ≤60 sometimes for "cautiously optimistic")
 * - economicDisruption: 20 → 95 (needs to stay ≤50 for "disruption with adaptation")
 * - openSourceMomentum: 15 → 98 (needs to stay <60 for "closed won")
 * - intlCooperation: 5 → 100 (drives too many arcs to same outcome)
 * - regulatoryPressure: 10 → 100 (always saturates)
 * - cdzComputeUtilization: 40 → 100 (drives AI Race to always China parity)
 * - promSafetyBreakthroughProgress: 20 → 97 (drives Prometheus fate)
 * - alignmentConfidence: 55 → 100 (drives alignment arc)
 * - marketIndex: 140 → 0 (crashes, feeds economy collapse)
 * - obInternalTrust: 65 → 5 (crashes)
 * - aiAutonomyLevel: 10 → 98 (drives control arc)
 *
 * Strategy: halve positive deltas for vars that saturate at ceiling,
 * halve negative deltas for vars that crash to floor.
 * Keep the sign direction — just reduce magnitude further.
 */

import { readFileSync, writeFileSync } from "fs";

// Variables that saturate at ceiling — reduce POSITIVE deltas
const ceilingVars = new Set([
  "publicAwareness",
  "economicDisruption",
  "openSourceMomentum",
  "intlCooperation",
  "regulatoryPressure",
  "cdzComputeUtilization",
  "promSafetyBreakthroughProgress",
  "alignmentConfidence",
  "aiAutonomyLevel",
  "ccpPatience",
]);

// Variables that crash to floor — reduce NEGATIVE deltas (make them less negative)
const floorVars = new Set([
  "marketIndex",
  "obInternalTrust",
]);

const files = [
  "packages/server/src/content/decisions/round1.ts",
  "packages/server/src/content/decisions/round2.ts",
  "packages/server/src/content/decisions/round3.ts",
  "packages/server/src/content/decisions/round4.ts",
  "packages/server/src/content/decisions/round5.ts",
];

let changes = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");

  // Match patterns like: { variable: "publicAwareness", delta: 5 }
  const result = content.replace(
    /\{\s*variable:\s*"(\w+)",\s*delta:\s*(-?\d+)\s*\}/g,
    (match, varName, rawDelta) => {
      const delta = parseInt(rawDelta, 10);
      let newDelta = delta;

      if (ceilingVars.has(varName) && delta > 0) {
        // Halve positive deltas for ceiling-saturating vars
        newDelta = Math.max(1, Math.round(delta * 0.5));
      } else if (floorVars.has(varName) && delta < 0) {
        // Halve negative deltas for floor-crashing vars
        newDelta = Math.min(-1, Math.round(delta * 0.5));
      }

      if (newDelta !== delta) {
        changes++;
        return `{ variable: "${varName}", delta: ${newDelta} }`;
      }
      return match;
    }
  );

  writeFileSync(file, result);
  console.log(`Processed ${file}`);
}

console.log(`\nTargeted changes: ${changes}`);
