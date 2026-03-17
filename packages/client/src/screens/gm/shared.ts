import type { CSSProperties } from "react";

// ── Shared helpers for GM screens ────────────────────────────────────────────

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export const PHASE_LABELS: Record<string, string> = {
  briefing: "Briefing",
  intel: "Intel Gathering",
  deliberation: "Deliberation",
  decision: "Decision",
  resolution: "Resolution",
  ending: "Ending",
};

export function btnStyle(color: string, disabled = false): CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: disabled ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${color}55`,
    background: disabled ? "rgba(255,255,255,0.03)" : `${color}18`,
    color: disabled ? "#4b5563" : color,
    fontSize: "13px",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "left" as const,
    display: "flex",
    alignItems: "center",
    transition: "all 0.15s",
    opacity: disabled ? 0.6 : 1,
  };
}
