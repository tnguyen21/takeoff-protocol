/**
 * Pure helper functions for ComputeApp.
 * Extracted for unit testing — no JSX or React dependencies.
 *
 * Invariants:
 * - gpuTileColor returns a hex color for each utilization band
 * - jobProgressRatio always returns a value in [0, 1]
 * - deriveCost scales linearly with burnRate
 */

/**
 * Returns the hex background color for a GPU tile based on utilization percentage.
 * Bands: 0-60% green, 60-80% yellow, 80-90% orange, 90-100% red.
 */
export function gpuTileColor(util: number): string {
  if (util >= 90) return "#ef4444"; // red
  if (util >= 80) return "#f97316"; // orange
  if (util >= 60) return "#eab308"; // yellow
  return "#22c55e"; // green
}

/**
 * Parses a human-readable time string like "4h 12m", "~16h", "30m" into minutes.
 */
export function parseMinutes(s: string): number {
  const clean = s.replace(/^~/, "").trim();
  let total = 0;
  const h = clean.match(/(\d+)h/);
  const m = clean.match(/(\d+)m/);
  if (h) total += parseInt(h[1], 10) * 60;
  if (m) total += parseInt(m[1], 10);
  return total;
}

/**
 * Computes a progress ratio in [0, 1] from elapsed/eta strings.
 * Returns 0 if eta cannot be parsed or is zero.
 */
export function jobProgressRatio(elapsed: string, eta: string): number {
  const elapsedMin = parseMinutes(elapsed);
  const etaMin = parseMinutes(eta);
  if (etaMin <= 0) return 0;
  return Math.min(1, elapsedMin / etaMin);
}

/**
 * Derives cost display strings from a burnRate value (0-100).
 * Calibrated so that burnRate=50 → ~$42,800/day, ~$1.24M/month, ~$1.38M projected.
 */
export function deriveCost(burnRate: number): { today: string; month: string; projected: string } {
  const daily = Math.round((42800 * burnRate) / 50);
  const monthly = daily * 29;
  const projected = Math.round(monthly * 1.11);

  function fmt(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 100_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  }

  return { today: fmt(daily), month: fmt(monthly), projected: fmt(projected) };
}
