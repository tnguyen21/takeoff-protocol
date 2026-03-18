/**
 * State-to-chart transform functions for the W&B simulation dashboard.
 */

import type { Faction, StateView } from "@takeoff/shared";
import type { CapData, GpuEntry, SystemData } from "./types.js";
import { GPU_OFFSETS, INSTANCE_COUNTS } from "./types.js";

/** Returns the CSS text color class for a run status string. */
export function getRunStatusColor(status: string): string {
  switch (status) {
    case "running":
      return "text-green-400";
    case "crashed":
      return "text-red-400";
    case "failed":
      return "text-red-400";
    default:
      return "text-neutral-400";
  }
}

/** Deterministic pseudo-random variance in [-range, +range] from a numeric seed. */
function detVariance(seed: number, range: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * range * 2 - range;
}

/**
 * Derives system/compute metrics from game state for the given faction.
 * Returns null when stateView or faction is unavailable.
 *
 * INV-1: OB with burnRate 50 → utilization in [80, 90]
 * INV-2: China with cdzComputeUtilization 40 → utilization ~40%
 * INV-3: Returns null when stateView is null
 * INV-4: Utilization >80 OB burn rate → THERMAL WARNING or CAPACITY LIMIT
 */
export function buildSystemData(
  stateView: StateView | null,
  faction: Faction | null,
  round: number,
): SystemData | null {
  if (!stateView || !faction) return null;

  let baseUtil: number;
  let monthlyComputeCost: string;

  if (faction === "openbrain") {
    const burnRate = stateView.obBurnRate.value;
    // At 50 (initial) → ~85%; at 80+ → 95%+
    baseUtil = Math.min(99, 65 + burnRate * 0.4);
    monthlyComputeCost = `$${Math.round(47 * (burnRate / 50))}M/mo`;
  } else if (faction === "prometheus") {
    const burnRate = stateView.promBurnRate.value;
    // At 40 (initial) → ~75%; lower baseline
    baseUtil = Math.min(99, 55 + burnRate * 0.5);
    monthlyComputeCost = `$${Math.round(38 * (burnRate / 40))}M/mo`;
  } else if (faction === "china") {
    const util = stateView.cdzComputeUtilization.value;
    // Direct mapping
    baseUtil = util;
    monthlyComputeCost = `$${Math.round(35 * (util / 40))}M/mo`;
  } else {
    return null; // external faction has no compute metrics
  }

  let clusterStatus: SystemData["clusterStatus"];
  if (baseUtil > 95) clusterStatus = "CAPACITY LIMIT";
  else if (baseUtil > 90) clusterStatus = "THERMAL WARNING";
  else clusterStatus = "NOMINAL";

  // Per-GPU fixed offsets (±3-5%) so GPUs show slight variance
  const gpus: GpuEntry[] = GPU_OFFSETS.map((offset, i) => {
    const gpuUtil = Math.min(100, Math.max(0, Math.round(baseUtil + offset)));
    const sparkData = Array.from({ length: 10 }, (_, j) => {
      const v = Math.min(100, Math.max(0, Math.round(gpuUtil + detVariance(round * 100 + i * 10 + j, 4))));
      return { v };
    });
    // Final point reflects current utilization
    sparkData[9] = { v: gpuUtil };
    return { label: `GPU ${i}`, utilization: gpuUtil, sparkData };
  });

  const activeInstances = INSTANCE_COUNTS[round] ?? `~${round * 200}`;

  return { clusterStatus, baseUtilization: Math.round(baseUtil), gpus, activeInstances, monthlyComputeCost };
}

/**
 * Builds capability chart data from game state history.
 * Returns null if no state data is available.
 *
 * INV: round > 0 is required for sv to be included in the output data.
 */
export function buildCapData(
  stateHistory: Record<number, StateView>,
  round: number,
  sv: StateView | null,
): CapData | null {
  const hist: Record<number, StateView> = { ...stateHistory };
  if (sv && round > 0) hist[round] = sv;

  const rounds = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;

  const latestRound = rounds[rounds.length - 1];
  const latest = hist[latestRound];
  const obAcc = latest.obCapability.accuracy;
  const promAcc = latest.promCapability.accuracy;
  const chinaAcc = latest.chinaCapability.accuracy;

  const obConf = obAcc === "estimate" ? (latest.obCapability.confidence ?? 0) : 0;
  const promConf = promAcc === "estimate" ? (latest.promCapability.confidence ?? 0) : 0;
  const chinaConf = chinaAcc === "estimate" ? (latest.chinaCapability.confidence ?? 0) : 0;

  const data = rounds.map((r) => {
    const s = hist[r];
    const ob = s.obCapability;
    const prom = s.promCapability;
    const china = s.chinaCapability;
    return {
      round: r,
      ob: ob.accuracy !== "hidden" ? ob.value : null,
      prom: prom.accuracy !== "hidden" ? prom.value : null,
      china: china.accuracy !== "hidden" ? china.value : null,
      obLow: obConf > 0 && ob.accuracy !== "hidden" ? ob.value - obConf : null,
      obBandH: obConf > 0 && ob.accuracy !== "hidden" ? obConf * 2 : null,
      promLow: promConf > 0 && prom.accuracy !== "hidden" ? prom.value - promConf : null,
      promBandH: promConf > 0 && prom.accuracy !== "hidden" ? promConf * 2 : null,
      chinaLow: chinaConf > 0 && china.accuracy !== "hidden" ? china.value - chinaConf : null,
      chinaBandH: chinaConf > 0 && china.accuracy !== "hidden" ? chinaConf * 2 : null,
    };
  });

  return { data, obAcc, promAcc, chinaAcc };
}
