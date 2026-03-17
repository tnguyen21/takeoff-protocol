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
