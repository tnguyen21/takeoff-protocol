import type { Faction, StateView } from "@takeoff/shared";

// ── Types ──

export interface SecurityAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  time: string;
  sourceIp: string;
  destIp: string;
  ruleId: string;
  mitre: string;
}

// Filter pill label → severity key
const FILTER_TO_SEV: Record<string, string> = {
  CRIT: "critical",
  HIGH: "high",
  MED: "medium",
  LOW: "low",
  INFO: "info",
};

// ── Pure helpers (exported for unit testing) ──

export function computeSecLevel(stateView: StateView | null, faction: Faction | null): number {
  if (!stateView) return 3;
  const field = faction === "prometheus" ? stateView.securityLevelProm : stateView.securityLevelOB;
  if (field.accuracy === "hidden") return 3;
  return Math.max(1, Math.min(5, Math.round(field.value)));
}

export function filterAlerts(alerts: SecurityAlert[], filter: string | null): SecurityAlert[] {
  if (!filter) return alerts;
  const target = FILTER_TO_SEV[filter] ?? filter.toLowerCase();
  return alerts.filter((a) => a.severity === target);
}

export function toggleAlertExpand(expandedId: string | null, id: string): string | null {
  return expandedId === id ? null : id;
}
