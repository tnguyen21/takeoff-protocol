/**
 * Pure utilities for BriefingApp fog-of-war rendering.
 * Extracted so they can be unit-tested without a DOM.
 */

import type { FogVariable } from "@takeoff/shared";

export type FogVar = FogVariable;

/** Format a single fog variable value for display. Returns "CLASSIFIED" when hidden. */
export function formatFogValue(v: FogVar, key: string): string {
  if (v.accuracy === "hidden") return "CLASSIFIED";

  let formatted: string;
  if (key === "securityLevelOB" || key === "securityLevelProm") {
    formatted = `SL-${v.value}`;
  } else if (key === "usChinaGap" || key === "obPromGap") {
    formatted = `${v.value > 0 ? "+" : ""}${v.value}mo`;
  } else if (key === "globalMediaCycle") {
    const labels = ["AI Hype", "AI Fear", "AI Crisis", "AI War", "AI Regulation", "AI Normalized"];
    formatted = labels[Math.floor(v.value)] ?? `${v.value}`;
  } else {
    formatted = `${v.value}`;
  }

  if (v.accuracy === "estimate" && v.confidence != null) {
    return `~${formatted} (±${v.confidence})`;
  }
  return formatted;
}

/** CSS text-color class based on accuracy. */
export function accuracyColor(v: FogVar): string {
  if (v.accuracy === "exact") return "text-green-400";
  if (v.accuracy === "estimate") return "text-yellow-400";
  return "text-neutral-500";
}
