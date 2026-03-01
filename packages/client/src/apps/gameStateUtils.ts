/**
 * Pure utility functions for GameStateApp.
 * Extracted for unit testing without a DOM/JSX runtime.
 */

import type { Accuracy } from "@takeoff/shared";
import type { StateView } from "@takeoff/shared";

// ── Types ──────────────────────────────────────────────────────────────────────

export type Group = "aiRace" | "safety" | "geopolitics" | "economy" | "faction";

export interface StateRow {
  label: string;
  key: keyof StateView;
  min: number;
  max: number;
  unit?: string;
  group: Group;
  higherIsBetter?: boolean;
  dangerAbove?: number;
  dangerBelow?: number;
}

// ── Bar color ─────────────────────────────────────────────────────────────────

/**
 * Returns a Tailwind bg-* class for a state variable bar.
 * Danger thresholds override accuracy-based color.
 */
export function getBarColor(accuracy: Accuracy, value: number, rowDef: Pick<StateRow, "min" | "max" | "dangerAbove" | "dangerBelow">): string {
  if (accuracy === "hidden") return "bg-neutral-700";
  if (rowDef.dangerAbove !== undefined && value > rowDef.dangerAbove) {
    const severity = (value - rowDef.dangerAbove) / (rowDef.max - rowDef.dangerAbove);
    return severity > 0.5 ? "bg-red-600" : "bg-orange-500";
  }
  if (rowDef.dangerBelow !== undefined && value < rowDef.dangerBelow) {
    const severity = (rowDef.dangerBelow - value) / (rowDef.dangerBelow - rowDef.min);
    return severity > 0.5 ? "bg-red-600" : "bg-orange-500";
  }
  if (accuracy === "exact")    return "bg-green-500";
  if (accuracy === "estimate") return "bg-yellow-500";
  return "bg-neutral-600";
}

// ── Doom Clock helpers ────────────────────────────────────────────────────────

/** Returns the color hex for a doom clock value (0-5). */
export function getDoomColor(value: number): string {
  if (value >= 4) return "#22c55e";
  if (value >= 3) return "#eab308";
  if (value >= 2) return "#f97316";
  return "#ef4444";
}

/** Returns the status label for a doom clock value (0-5). */
export function getDoomLabel(value: number): string {
  if (value >= 4) return "STABLE";
  if (value >= 3) return "CAUTION";
  if (value >= 2) return "WARNING";
  if (value >= 1) return "CRITICAL";
  return "MIDNIGHT";
}

// ── Group status ──────────────────────────────────────────────────────────────

type FogMap = Record<string, { value: number; accuracy: Accuracy }>;

/**
 * Returns "green", "yellow", or "red" based on whether any visible variable
 * in the group is in its danger zone.
 */
export function groupStatusColor(rows: StateRow[], fogMap: FogMap): "green" | "yellow" | "red" {
  let worst: "green" | "yellow" | "red" = "green";
  for (const row of rows) {
    const fogVar = fogMap[row.key as string];
    if (!fogVar || fogVar.accuracy === "hidden") continue;
    const { value } = fogVar;
    let inDanger = false;
    if (row.dangerAbove !== undefined && value > row.dangerAbove) inDanger = true;
    if (row.dangerBelow !== undefined && value < row.dangerBelow) inDanger = true;
    if (inDanger) {
      let severity = 0;
      if (row.dangerAbove !== undefined && value > row.dangerAbove) {
        severity = (value - row.dangerAbove) / (row.max - row.dangerAbove);
      } else if (row.dangerBelow !== undefined && value < row.dangerBelow) {
        severity = (row.dangerBelow - value) / (row.dangerBelow - row.min);
      }
      if (severity > 0.5 && worst !== "red") worst = "red";
      else if (worst === "green") worst = "yellow";
    }
  }
  return worst;
}

// ── Delta ─────────────────────────────────────────────────────────────────────

/**
 * Computes the delta between current and previous value.
 * Returns null if either value is hidden.
 */
export function computeDelta(
  current: { value: number; accuracy: Accuracy },
  previous: { value: number; accuracy: Accuracy } | undefined,
): number | null {
  if (current.accuracy === "hidden") return null;
  if (!previous || previous.accuracy === "hidden") return null;
  return current.value - previous.value;
}
