/**
 * Pure helper functions for WandBApp — extracted here so bun:test can import
 * without hitting react/jsx-dev-runtime issues.
 */

import type { StateView } from "@takeoff/shared";

/** Returns the CSS text color class for a run status string. */
export function getRunStatusColor(status: string): string {
  switch (status) {
    case "running":
      return "text-green-400";
    case "crashed":
      return "text-red-400";
    default:
      return "text-neutral-400";
  }
}

export type CapDataPoint = {
  round: number;
  ob: number | null;
  prom: number | null;
  china: number | null;
  obLow: number | null;
  obBandH: number | null;
  promLow: number | null;
  promBandH: number | null;
  chinaLow: number | null;
  chinaBandH: number | null;
};

export type CapData = {
  data: CapDataPoint[];
  obAcc: string;
  promAcc: string;
  chinaAcc: string;
};

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
