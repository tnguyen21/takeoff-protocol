import type { ContentClassification } from "@takeoff/shared";

// ── Pure helpers (exported for unit testing) ──────────────────────────────────

/** Maps taiwanTension value (0–100) to THREATCON level 1–5. */
export function computeThreatCon(tension: number): number {
  if (tension < 30) return 1;
  if (tension < 50) return 2;
  if (tension < 70) return 3;
  if (tension < 85) return 4;
  return 5;
}

/** Maps taiwanTension value to Taiwan Strait Situation display. */
export function getTaiwanSituation(tension: number): { value: string; color: string } {
  if (tension < 30) return { value: "NOMINAL", color: "text-green-400" };
  if (tension < 50) return { value: "ELEVATED", color: "text-yellow-400" };
  if (tension < 70) return { value: "ELEVATED", color: "text-orange-400" };
  if (tension < 85) return { value: "CRITICAL", color: "text-red-400" };
  return { value: "CRISIS", color: "text-red-500" };
}

/** Maps chinaCapability value to PRC Naval Movements display. */
export function getPrcNavalMovements(capability: number): { value: string; color: string } {
  if (capability < 40) return { value: "MONITORING", color: "text-yellow-400" };
  if (capability < 65) return { value: "INCREASED", color: "text-orange-400" };
  return { value: "HIGH ALERT", color: "text-red-400" };
}

/** Maps ContentClassification to message precedence label and color. */
export function getPrecedenceLabel(classification?: ContentClassification): { label: string; labelColor: string } {
  switch (classification) {
    case "critical":    return { label: "FLASH",    labelColor: "text-red-500" };
    case "context":     return { label: "PRIORITY", labelColor: "text-neutral-400" };
    case "red-herring": return { label: "ROUTINE",  labelColor: "text-green-700" };
    case "breadcrumb":  return { label: "ROUTINE",  labelColor: "text-green-700" };
    default:            return { label: "ROUTINE",  labelColor: "text-green-700" };
  }
}
