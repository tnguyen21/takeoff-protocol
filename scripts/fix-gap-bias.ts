/**
 * Strengthen positive usChinaGap deltas and add more obPromGap counterbalance.
 * 
 * usChinaGap: Upgrade existing +1 to +2, add +2 to ob_ceo first options
 * obPromGap: Upgrade existing +1 to +2 for ob_cto
 */

import { ROUND1_DECISIONS } from "../packages/server/src/content/decisions/round1.js";
import { ROUND2_DECISIONS } from "../packages/server/src/content/decisions/round2.js";
import { ROUND3_DECISIONS } from "../packages/server/src/content/decisions/round3.js";
import { ROUND4_DECISIONS } from "../packages/server/src/content/decisions/round4.js";
import { ROUND5_DECISIONS } from "../packages/server/src/content/decisions/round5.js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DECISION_DIR = join(import.meta.dir, "../packages/server/src/content/decisions");

const allRoundsData = [
  { round: 1, decisions: ROUND1_DECISIONS },
  { round: 2, decisions: ROUND2_DECISIONS },
  { round: 3, decisions: ROUND3_DECISIONS },
  { round: 4, decisions: ROUND4_DECISIONS },
  { round: 5, decisions: ROUND5_DECISIONS },
];

// Collect option IDs where we need to upgrade deltas or add new ones
const upgrades: { optionId: string; variable: string; from: number; to: number }[] = [];
const additions: { optionId: string; variable: string; delta: number }[] = [];

for (const { round, decisions } of allRoundsData) {
  const allDecisions = [...decisions.individual, ...(decisions.collective || [])];
  for (const d of allDecisions) {
    const role = (d as any).role;

    // usChinaGap: upgrade +1 to +2 for ob_cto and ext_nsa
    if (["ob_cto", "ext_nsa"].includes(role)) {
      for (const opt of d.options) {
        const eff = opt.effects.find((e: any) => e.variable === "usChinaGap" && e.delta === 1);
        if (eff) {
          upgrades.push({ optionId: opt.id, variable: "usChinaGap", from: 1, to: 2 });
        }
      }
    }

    // usChinaGap: add +2 to first option of ob_ceo decisions that don't touch it
    if (role === "ob_ceo") {
      const touchesGap = d.options.some((o: any) =>
        o.effects.some((e: any) => e.variable === "usChinaGap")
      );
      if (!touchesGap) {
        additions.push({ optionId: d.options[0].id, variable: "usChinaGap", delta: 2 });
      }
    }

    // obPromGap: upgrade +1 to +2 for ob_cto
    if (role === "ob_cto") {
      for (const opt of d.options) {
        const eff = opt.effects.find((e: any) => e.variable === "obPromGap" && e.delta === 1);
        if (eff) {
          upgrades.push({ optionId: opt.id, variable: "obPromGap", from: 1, to: 2 });
        }
      }
    }
  }
}

console.log(`usChinaGap upgrades: ${upgrades.filter(u => u.variable === "usChinaGap").length}`);
console.log(`usChinaGap additions: ${additions.filter(a => a.variable === "usChinaGap").length}`);
console.log(`obPromGap upgrades: ${upgrades.filter(u => u.variable === "obPromGap").length}`);

// Apply mutations
const roundFiles = ["round1.ts", "round2.ts", "round3.ts", "round4.ts", "round5.ts"];
for (const file of roundFiles) {
  const filePath = join(DECISION_DIR, file);
  let content = readFileSync(filePath, "utf-8");
  let changes = 0;

  // Apply upgrades (change delta value)
  for (const u of upgrades) {
    const optIdx = content.indexOf(`"${u.optionId}"`);
    if (optIdx === -1) continue;

    const afterOpt = content.slice(optIdx);
    const pattern = new RegExp(
      `(\\{ variable: "${u.variable}", delta: )${u.from}( \\})`
    );
    const match = afterOpt.match(pattern);
    if (!match || match.index === undefined) continue;

    const absPos = optIdx + match.index;
    const replacement = `${match[1]}${u.to}${match[2]}`;
    content = content.slice(0, absPos) + replacement + content.slice(absPos + match[0].length);
    changes++;
  }

  // Apply additions
  for (const a of additions) {
    const optIdx = content.indexOf(`"${a.optionId}"`);
    if (optIdx === -1) continue;

    const afterOpt = content.slice(optIdx);
    const effectsIdx = afterOpt.indexOf("effects: [");
    if (effectsIdx === -1) continue;

    const afterEffects = afterOpt.slice(effectsIdx);
    const closingIdx = afterEffects.indexOf("],");
    if (closingIdx === -1) continue;

    const absPos = optIdx + effectsIdx + closingIdx;
    const indent = "            ";
    const newEffect = `\n${indent}{ variable: "${a.variable}", delta: ${a.delta} },`;
    content = content.slice(0, absPos) + newEffect + "\n          " + content.slice(absPos);
    changes++;
  }

  if (changes > 0) {
    writeFileSync(filePath, content);
    console.log(`${file}: ${changes} changes`);
  }
}
