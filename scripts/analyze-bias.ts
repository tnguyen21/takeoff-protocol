import { ROUND1_DECISIONS } from "../packages/server/src/content/decisions/round1.js";
import { ROUND2_DECISIONS } from "../packages/server/src/content/decisions/round2.js";
import { ROUND3_DECISIONS } from "../packages/server/src/content/decisions/round3.js";
import { ROUND4_DECISIONS } from "../packages/server/src/content/decisions/round4.js";
import { ROUND5_DECISIONS } from "../packages/server/src/content/decisions/round5.js";

const TARGET_VARS = ["alignmentConfidence", "regulatoryPressure", "usChinaGap", "obPromGap"];

const allRounds = [
  { round: 1, decisions: ROUND1_DECISIONS },
  { round: 2, decisions: ROUND2_DECISIONS },
  { round: 3, decisions: ROUND3_DECISIONS },
  { round: 4, decisions: ROUND4_DECISIONS },
  { round: 5, decisions: ROUND5_DECISIONS },
];

for (const varName of TARGET_VARS) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`Variable: ${varName}`);
  console.log(`${"=".repeat(70)}`);

  let totalExpected = 0;
  const rows: any[] = [];

  for (const { round, decisions } of allRounds) {
    const allDecisions = [...decisions.individual, ...(decisions.collective || [])];
    for (const d of allDecisions) {
      const deltas: number[] = [];
      for (const opt of d.options) {
        const eff = opt.effects.find((e: any) => e.variable === varName);
        deltas.push(eff ? eff.delta : 0);
      }

      const sum = deltas.reduce((a: number, b: number) => a + b, 0);
      if (sum === 0 && deltas.every((d) => d === 0)) continue;

      const nOpts = deltas.length;
      const expected = sum / nOpts;
      totalExpected += expected;
      const pos = deltas.filter((d) => d > 0).length;
      const neg = deltas.filter((d) => d < 0).length;
      const zero = deltas.filter((d) => d === 0).length;

      rows.push({
        round,
        id: (d as any).id || d.options[0].id.replace(/_[^_]+$/, ''),
        role: (d as any).role || "collective",
        nOpts,
        deltas: deltas.join(", "),
        sum,
        expected: expected.toFixed(2),
        pos,
        neg,
        zero,
      });
    }
  }

  rows.sort((a: any, b: any) => Math.abs(parseFloat(b.expected)) - Math.abs(parseFloat(a.expected)));

  console.log(`\nTotal expected net push across full game (random): ${totalExpected.toFixed(2)}`);
  console.log(`Decisions touching this var: ${rows.length}`);
  console.log(`\nAll decisions (sorted by |expected delta|):\n`);
  console.log("Rnd | Role/ID                    | Opts | Deltas                      | Sum  | E[Δ]  | +/-/0");
  console.log("----|----------------------------|------|-----------------------------|------|-------|------");
  for (const r of rows) {
    const label = `${r.role}`.slice(0, 26);
    const deltasStr = r.deltas.length > 28 ? r.deltas.slice(0, 25) + "..." : r.deltas.padEnd(28);
    console.log(
      `R${r.round}  | ${label.padEnd(26)} | ${String(r.nOpts).padEnd(4)} | ${deltasStr} | ${String(r.sum).padStart(4)} | ${r.expected.padStart(5)} | ${r.pos}/${r.neg}/${r.zero}`,
    );
  }

  let allPos = 0, allNeg = 0, allZero = 0;
  for (const r of rows) { allPos += r.pos; allNeg += r.neg; allZero += r.zero; }
  console.log(`\nAcross all options: ${allPos} positive, ${allNeg} negative, ${allZero} zero`);
}
