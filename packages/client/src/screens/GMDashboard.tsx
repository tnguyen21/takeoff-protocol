import { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../stores/game.js";
import { useMessagesStore } from "../stores/messages.js";
import { FACTIONS, PHASE_DURATIONS, ROUND4_PHASE_DURATIONS, computeEndingArcs, computeFogView } from "@takeoff/shared";
import type { Faction, GamePhase, Role, StateVariables, EndingArc, StateView } from "@takeoff/shared";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const PHASE_LABELS: Record<string, string> = {
  briefing: "Briefing",
  intel: "Intel Gathering",
  deliberation: "Deliberation",
  decision: "Decision",
  resolution: "Resolution",
  ending: "Ending",
};

const FACTION_COLORS: Record<string, string> = {
  openbrain: "#8b5cf6",
  prometheus: "#06b6d4",
  china: "#ef4444",
  external: "#f59e0b",
};

const STATE_LABELS: Record<keyof StateVariables, string> = {
  obCapability: "OB Capability",
  promCapability: "Prom Capability",
  chinaCapability: "China Capability",
  usChinaGap: "US-China Gap (mo)",
  obPromGap: "OB-Prom Gap (mo)",
  alignmentConfidence: "Alignment Confidence",
  misalignmentSeverity: "Misalignment Severity",
  publicAwareness: "Public Awareness",
  publicSentiment: "Public Sentiment",
  economicDisruption: "Economic Disruption",
  taiwanTension: "Taiwan Tension",
  obInternalTrust: "OB Internal Trust",
  securityLevelOB: "Security Level (OB)",
  securityLevelProm: "Security Level (Prom)",
  intlCooperation: "Intl Cooperation",
};

// State variable ranges for bar rendering
const STATE_RANGES: Record<keyof StateVariables, [number, number]> = {
  obCapability: [0, 100],
  promCapability: [0, 100],
  chinaCapability: [0, 100],
  usChinaGap: [-24, 24],
  obPromGap: [-24, 24],
  alignmentConfidence: [0, 100],
  misalignmentSeverity: [0, 100],
  publicAwareness: [0, 100],
  publicSentiment: [-100, 100],
  economicDisruption: [0, 100],
  taiwanTension: [0, 100],
  obInternalTrust: [0, 100],
  securityLevelOB: [1, 5],
  securityLevelProm: [1, 5],
  intlCooperation: [0, 100],
};

function barPct(key: keyof StateVariables, value: number): number {
  const [min, max] = STATE_RANGES[key];
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function barColor(key: keyof StateVariables, value: number): string {
  // Danger variables — high is bad
  const danger = ["misalignmentSeverity", "economicDisruption", "taiwanTension"] as (keyof StateVariables)[];
  // Neutral range variables
  const neutral = ["usChinaGap", "obPromGap", "publicSentiment"] as (keyof StateVariables)[];

  if (danger.includes(key)) {
    const pct = barPct(key, value);
    if (pct > 66) return "#ef4444";
    if (pct > 33) return "#f59e0b";
    return "#34d399";
  }
  if (neutral.includes(key)) return "#60a5fa";
  // Default: high is good
  const pct = barPct(key, value);
  if (pct > 66) return "#34d399";
  if (pct > 33) return "#f59e0b";
  return "#ef4444";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TimerDisplay({
  endsAt,
  pausedAt,
  isPaused,
}: {
  endsAt: number;
  pausedAt?: number;
  isPaused: boolean;
}) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (isPaused && pausedAt) {
      // Freeze at remaining time when paused: endsAt - pausedAt
      setRemaining(Math.max(0, endsAt - pausedAt));
      return;
    }
    const tick = () => {
      setRemaining(Math.max(0, endsAt - Date.now()));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, pausedAt, isPaused]);

  const color = remaining <= 30_000 ? "#ef4444" : remaining <= 60_000 ? "#f59e0b" : "#34d399";

  return (
    <div style={{ fontFamily: "monospace", fontSize: "56px", fontWeight: 700, color, lineHeight: 1, letterSpacing: "-2px", minWidth: "3ch", fontVariantNumeric: "tabular-nums" }}>
      {formatTime(remaining)}
    </div>
  );
}

// ── Dev State Panel (DEV only) ────────────────────────────────────────────────

function DevStatePanel({
  gmRawState,
  gmSetState,
}: {
  gmRawState: StateVariables;
  gmSetState: (variable: keyof StateVariables, value: number) => void;
}) {
  const [pending, setPending] = useState<Partial<Record<keyof StateVariables, number>>>({});

  const getValue = (key: keyof StateVariables) => pending[key] ?? gmRawState[key];

  return (
    <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(239,68,68,0.25)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            padding: "2px 7px",
            borderRadius: "4px",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#f87171",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          DEV
        </div>
        <span style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          State Overrides
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {(Object.keys(STATE_LABELS) as (keyof StateVariables)[]).map((key) => {
          const [min, max] = STATE_RANGES[key];
          const value = getValue(key);
          const hasPending = pending[key] !== undefined;

          return (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ color: "#9ca3af", fontSize: "11px" }}>{STATE_LABELS[key]}</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: hasPending ? "#f59e0b" : "#6b7280",
                  }}
                >
                  {value}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={1}
                  value={value}
                  onChange={(e) => setPending((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{ flex: 1, accentColor: "#8b5cf6", cursor: "pointer" }}
                />
                <button
                  onClick={() => {
                    gmSetState(key, value);
                    setPending((prev) => {
                      const next = { ...prev };
                      delete next[key];
                      return next;
                    });
                  }}
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(139,92,246,0.4)",
                    background: "rgba(139,92,246,0.15)",
                    color: "#c4b5fd",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Set
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fog Inspector (DEV only) ──────────────────────────────────────────────────

function FogInspector({ gmRawState, round }: { gmRawState: StateVariables; round: number }) {
  const [selectedFaction, setSelectedFaction] = useState<Faction>(FACTIONS[0].id);
  const factionConfig = FACTIONS.find((f) => f.id === selectedFaction)!;
  const [selectedRole, setSelectedRole] = useState<Role>(factionConfig.roles[0].id);

  // When faction changes, reset role to first available
  const handleFactionChange = (f: Faction) => {
    setSelectedFaction(f);
    const cfg = FACTIONS.find((fc) => fc.id === f)!;
    setSelectedRole(cfg.roles[0].id);
  };

  const fogView: StateView = computeFogView(gmRawState, selectedFaction, selectedRole, round);

  const dropdownStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "6px",
    color: "#e5e7eb",
    fontSize: "12px",
    padding: "5px 8px",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
        Fog Inspector
      </div>

      {/* Selectors */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ color: "#6b7280", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Faction</label>
          <select value={selectedFaction} onChange={(e) => handleFactionChange(e.target.value as Faction)} style={dropdownStyle}>
            {FACTIONS.map((f) => (
              <option key={f.id} value={f.id} style={{ background: "#0a0a14" }}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ color: "#6b7280", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as Role)} style={dropdownStyle}>
            {factionConfig.roles.map((r) => (
              <option key={r.id} value={r.id} style={{ background: "#0a0a14" }}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div style={{ overflowX: "auto" }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 130px",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "4px 4px 0 0",
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "2px",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Variable</span>
          <span style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>True</span>
          <span style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>
            {FACTIONS.find((f) => f.id === selectedFaction)?.name ?? selectedFaction} sees
          </span>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {(Object.keys(STATE_LABELS) as (keyof StateVariables)[]).map((key) => {
            const trueVal = gmRawState[key];
            const fogVar = fogView[key];
            const accuracy = fogVar.accuracy;

            let fogDisplay: string;
            let fogColor: string;
            if (accuracy === "exact") {
              fogDisplay = String(fogVar.value);
              fogColor = "#34d399"; // green
            } else if (accuracy === "estimate") {
              fogDisplay = `~${fogVar.value} ±${fogVar.confidence ?? "?"}`;
              fogColor = "#f59e0b"; // yellow
            } else {
              fogDisplay = "HIDDEN";
              fogColor = "#4b5563"; // gray
            }

            return (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 130px",
                  gap: "4px",
                  padding: "5px 8px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.02)",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#9ca3af", fontSize: "11px" }}>{STATE_LABELS[key]}</span>
                <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "#e5e7eb", textAlign: "right" }}>{trueVal}</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: fogColor,
                    textAlign: "right",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background:
                      accuracy === "exact"
                        ? "rgba(52,211,153,0.08)"
                        : accuracy === "estimate"
                          ? "rgba(245,158,11,0.08)"
                          : "rgba(75,85,99,0.12)",
                    fontStyle: accuracy === "hidden" ? "italic" : "normal",
                  }}
                >
                  {fogDisplay}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
          {[
            { color: "#34d399", bg: "rgba(52,211,153,0.08)", label: "Exact" },
            { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "Estimate ±N" },
            { color: "#4b5563", bg: "rgba(75,85,99,0.12)", label: "Hidden" },
          ].map(({ color, bg, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "28px", height: "14px", borderRadius: "3px", background: bg, border: `1px solid ${color}44` }} />
              <span style={{ color: "#6b7280", fontSize: "10px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Endings Preview ───────────────────────────────────────────────────────────

function outcomeColor(index: number, total: number): string {
  // spectrum is ordered worst→best; last index is best
  const position = index / Math.max(1, total - 1); // 0 = worst, 1 = best
  if (position >= 0.7) return "#34d399"; // green — favorable
  if (position >= 0.4) return "#f59e0b"; // yellow — mixed
  return "#ef4444"; // red — catastrophic
}

function EndingsPreview({ arcs }: { arcs: EndingArc[] }) {
  return (
    <div
      style={{
        marginTop: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {arcs.map((arc) => (
        <div
          key={arc.id}
          style={{
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
          }}
        >
          {/* Arc header */}
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#c4b5fd",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {arc.label}
          </div>
          {/* Outcome spectrum */}
          <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {arc.spectrum.map((outcome, i) => {
              const isSelected = i === arc.result;
              const color = outcomeColor(i, arc.spectrum.length);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: isSelected ? "6px 8px" : "4px 8px",
                    borderRadius: "6px",
                    background: isSelected ? `${color}18` : "transparent",
                    border: isSelected ? `1px solid ${color}55` : "1px solid transparent",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Indicator dot */}
                  <div
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: isSelected ? color : "rgba(255,255,255,0.12)",
                      flexShrink: 0,
                      marginTop: "4px",
                      boxShadow: isSelected ? `0 0 6px ${color}88` : "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      color: isSelected ? color : "#6b7280",
                      fontWeight: isSelected ? 600 : 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {outcome}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dev Jump Panel ────────────────────────────────────────────────────────────

const JUMP_PHASES = ["briefing", "intel", "deliberation", "decision", "resolution"] as const;

function DevJumpPanel({ currentRound, currentPhase }: { currentRound: number; currentPhase: string | null }) {
  const gmJump = useGameStore((s) => s.gmJump);
  const [targetRound, setTargetRound] = useState(currentRound || 1);
  const [targetPhase, setTargetPhase] = useState<string>(JUMP_PHASES[0]);

  const handleJump = useCallback(() => {
    gmJump(targetRound, targetPhase);
  }, [gmJump, targetRound, targetPhase]);

  const selectStyle: React.CSSProperties = {
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "6px",
    color: "#e5e7eb",
    fontSize: "12px",
    padding: "5px 8px",
    cursor: "pointer",
    flex: 1,
  };

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        background: "rgba(234,179,8,0.06)",
        border: "1px solid rgba(234,179,8,0.25)",
      }}
    >
      <div
        style={{
          color: "#ca8a04",
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "8px",
        }}
      >
        Dev — Jump To
      </div>

      <div style={{ color: "#6b7280", fontSize: "10px", marginBottom: "8px" }}>
        Current: Round <strong style={{ color: "#9ca3af" }}>{currentRound}</strong>{" "}
        <strong style={{ color: "#9ca3af" }}>{currentPhase ?? "—"}</strong>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        <select value={targetRound} onChange={(e) => setTargetRound(Number(e.target.value))} style={selectStyle}>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              Round {r}
            </option>
          ))}
        </select>

        <select value={targetPhase} onChange={(e) => setTargetPhase(e.target.value)} style={selectStyle}>
          {JUMP_PHASES.map((p) => (
            <option key={p} value={p}>
              {PHASE_LABELS[p] ?? p}
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleJump} style={btnStyle("#ca8a04")}>
        ⚡ Jump
      </button>
    </div>
  );
}

// ── Timer Settings Panel ──────────────────────────────────────────────────────

const TIMER_PHASES: { phase: GamePhase; label: string }[] = [
  { phase: "briefing", label: "Briefing" },
  { phase: "intel", label: "Intel Gathering" },
  { phase: "deliberation", label: "Deliberation" },
  { phase: "decision", label: "Decision" },
  { phase: "resolution", label: "Resolution" },
];

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function TimerSettingsPanel({
  gmTimerOverrides,
  gmSetTimers,
}: {
  gmTimerOverrides: Partial<Record<GamePhase, number>>;
  gmSetTimers: (overrides: Partial<Record<GamePhase, number>>) => void;
}) {
  // Local draft state — only sent to server on Save
  const [draft, setDraft] = useState<Partial<Record<GamePhase, number>>>({});

  const getEffective = (phase: GamePhase): number =>
    draft[phase] ?? gmTimerOverrides[phase] ?? PHASE_DURATIONS[phase] ?? 180;

  const step = (phase: GamePhase, delta: number) => {
    const current = getEffective(phase);
    const next = Math.max(30, current + delta);
    setDraft((prev) => ({ ...prev, [phase]: next }));
  };

  const save = () => {
    const merged = { ...gmTimerOverrides, ...draft };
    gmSetTimers(merged);
    setDraft({});
  };

  const hasDraft = Object.keys(draft).length > 0;

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        background: "rgba(6,182,212,0.05)",
        border: "1px solid rgba(6,182,212,0.2)",
      }}
    >
      <div
        style={{
          color: "#06b6d4",
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "10px",
        }}
      >
        Timer Settings
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
        {TIMER_PHASES.map(({ phase, label }) => {
          const value = getEffective(phase);
          const r4Value = ROUND4_PHASE_DURATIONS[phase];
          const isOverridden = draft[phase] !== undefined || gmTimerOverrides[phase] !== undefined;
          const defaultVal = PHASE_DURATIONS[phase] ?? 180;

          return (
            <div key={phase}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#9ca3af", fontSize: "11px" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {r4Value && r4Value !== defaultVal && (
                    <span style={{ color: "#6b7280", fontSize: "9px", fontStyle: "italic" }}>
                      R4:{formatSeconds(r4Value)}
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isOverridden ? "#22d3ee" : "#6b7280",
                    }}
                  >
                    {formatSeconds(value)}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button
                  onClick={() => step(phase, -30)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#9ca3af",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={30}
                  max={3600}
                  step={30}
                  value={value}
                  onChange={(e) => {
                    const v = Math.max(30, Math.min(3600, Number(e.target.value)));
                    setDraft((prev) => ({ ...prev, [phase]: v }));
                  }}
                  style={{
                    flex: 1,
                    padding: "3px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e5e7eb",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    textAlign: "center",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => step(phase, 30)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#9ca3af",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  +
                </button>
                {(draft[phase] !== undefined || gmTimerOverrides[phase] !== undefined) && (
                  <button
                    onClick={() => {
                      // Reset this phase: remove override
                      setDraft((prev) => {
                        const next = { ...prev };
                        delete next[phase];
                        return next;
                      });
                      const next = { ...gmTimerOverrides };
                      delete next[phase];
                      gmSetTimers(next);
                    }}
                    title="Reset to default"
                    style={{
                      padding: "3px 6px",
                      borderRadius: "4px",
                      border: "1px solid rgba(239,68,68,0.2)",
                      background: "rgba(239,68,68,0.08)",
                      color: "#f87171",
                      fontSize: "10px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ↩
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button
          onClick={save}
          disabled={!hasDraft}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: "6px",
            border: hasDraft ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(255,255,255,0.08)",
            background: hasDraft ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)",
            color: hasDraft ? "#22d3ee" : "#4b5563",
            fontSize: "12px",
            fontWeight: 600,
            cursor: hasDraft ? "pointer" : "not-allowed",
          }}
        >
          Apply Changes
        </button>
      </div>

      <div style={{ color: "#4b5563", fontSize: "10px", marginTop: "8px", lineHeight: 1.4 }}>
        Takes effect on next phase. Round 4 deliberation uses its own 7:00 default unless overridden.
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function GMDashboard() {
  const {
    roomCode,
    phase,
    round,
    timer,
    lobbyPlayers,
    gmRawState,
    gmDecisionStatus,
    gmExtendUsesRemaining,
    gmPlayerActivity,
    gmTimerOverrides,
    gmAdvance,
    gmPause,
    gmExtend,
    gmSetState,
    gmSetTimers,
    endTutorial,
  } = useGameStore();

  const { messages } = useMessagesStore();
  const feedRef = useRef<HTMLDivElement>(null);
  const [showEndings, setShowEndings] = useState(false);

  const isPaused = !!timer.pausedAt;
  const connectedCount = lobbyPlayers.filter((p) => p.connected).length;

  // Auto-scroll message feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(160deg, #0a0a14 0%, #0d1117 50%, #060912 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          padding: "12px 24px",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {/* GM badge */}
        <div
          style={{
            padding: "3px 10px",
            borderRadius: "6px",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#f87171",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          GM
        </div>

        {/* Room code */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#6b7280", fontSize: "12px" }}>Room</span>
          <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 700, letterSpacing: "0.15em", color: "#e5e7eb" }}>
            {roomCode ?? "—"}
          </span>
        </div>

        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />

        {/* Round + Phase */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#9ca3af", fontSize: "13px" }}>
            Round <strong style={{ color: "#e5e7eb" }}>{round === 0 ? "Tutorial" : round}</strong>
          </span>
          <span
            style={{
              padding: "2px 10px",
              borderRadius: "20px",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.35)",
              color: "#c4b5fd",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {PHASE_LABELS[phase ?? ""] ?? phase ?? "—"}
          </span>
          {round === 0 && (
            <span
              style={{
                padding: "2px 10px",
                borderRadius: "20px",
                background: "rgba(234,179,8,0.15)",
                border: "1px solid rgba(234,179,8,0.4)",
                color: "#fbbf24",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              TUTORIAL MODE
            </span>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: connectedCount > 0 ? "#34d399" : "#6b7280",
            }}
          />
          <span style={{ color: "#9ca3af", fontSize: "12px" }}>
            {connectedCount} / {lobbyPlayers.length} connected
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "300px 1fr 280px",
          gridTemplateRows: "auto 1fr",
          gap: "1px",
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {/* ── Timer + Controls (spans first column) ── */}
        <div
          style={{
            gridColumn: "1",
            gridRow: "1 / 3",
            background: "#0a0a14",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            overflow: "auto",
          }}
        >
          <div>
            <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Phase Timer
            </div>
            <TimerDisplay endsAt={timer.endsAt} pausedAt={timer.pausedAt} isPaused={isPaused} />
            {isPaused && (
              <div style={{ marginTop: "8px", color: "#f59e0b", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⏸ Paused
              </div>
            )}
          </div>

          {/* Timer controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {round === 0 ? (
              /* Tutorial mode: show End Tutorial button prominently */
              <>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "rgba(234,179,8,0.08)",
                    border: "1px solid rgba(234,179,8,0.3)",
                    color: "#fbbf24",
                    fontSize: "11px",
                    lineHeight: 1.5,
                  }}
                >
                  Tutorial mode active. Players are exploring the desktop with practice content. When ready, end the tutorial to start Round 1.
                </div>
                <button
                  onClick={endTutorial}
                  style={btnStyle("#34d399")}
                >
                  ▶ End Tutorial → Start Game
                </button>
                <button
                  onClick={gmAdvance}
                  style={btnStyle("#6b7280")}
                >
                  ⏭ Skip to Round 1
                </button>
              </>
            ) : (
              /* Normal game controls */
              <>
                <button
                  onClick={gmPause}
                  style={btnStyle(isPaused ? "#34d399" : "#f59e0b")}
                >
                  {isPaused ? "▶ Resume" : "⏸ Pause"}
                </button>

                <button
                  onClick={gmExtend}
                  disabled={gmExtendUsesRemaining <= 0}
                  style={btnStyle("#60a5fa", gmExtendUsesRemaining <= 0)}
                >
                  +60s Extend
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 5px",
                      borderRadius: "4px",
                      background: gmExtendUsesRemaining > 0 ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.05)",
                      color: gmExtendUsesRemaining > 0 ? "#93c5fd" : "#4b5563",
                    }}
                  >
                    {gmExtendUsesRemaining} left
                  </span>
                </button>

                <button
                  onClick={gmAdvance}
                  style={btnStyle("#ef4444")}
                >
                  ⏭ Advance Phase
                </button>

                {import.meta.env.DEV && (
                  <button
                    onClick={() => setShowEndings((v) => !v)}
                    style={btnStyle("#a78bfa")}
                  >
                    {showEndings ? "▲ Hide Endings" : "▼ Preview Endings"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Endings Preview Panel */}
          {import.meta.env.DEV && showEndings && gmRawState && (
            <div>
              <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Ending Arc Preview
              </div>
              <EndingsPreview arcs={computeEndingArcs(gmRawState)} />
            </div>
          )}

          {/* Timer Settings */}
          <TimerSettingsPanel gmTimerOverrides={gmTimerOverrides} gmSetTimers={gmSetTimers} />

          {/* Dev-only jump panel */}
          {import.meta.env.DEV && (
            <DevJumpPanel currentRound={round} currentPhase={phase} />
          )}

          {/* Player Panel */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Players
            </div>

            {FACTIONS.map((faction) => {
              const factionPlayers = lobbyPlayers.filter((p) => p.faction === faction.id);
              if (factionPlayers.length === 0) return null;

              return (
                <div key={faction.id} style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: FACTION_COLORS[faction.id] ?? "#9ca3af",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {faction.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {factionPlayers.map((p) => {
                      const roleConfig = faction.roles.find((r) => r.id === p.role);
                      const hasSubmitted = gmDecisionStatus.includes(p.id);
                      const playerOpened = gmPlayerActivity[p.id] ?? [];
                      const primaryApps = roleConfig?.primaryApps ?? [];
                      const missedPrimary = primaryApps.length > 0 && !primaryApps.some((app) => playerOpened.includes(app));

                      return (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {/* Connection dot */}
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: p.connected ? "#34d399" : "#ef4444",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                            <div style={{ fontSize: "10px", color: "#6b7280" }}>{roleConfig?.label ?? p.role}</div>
                          </div>
                          {/* Primary app missed indicator */}
                          {phase !== "lobby" && phase !== "briefing" && missedPrimary && (
                            <span
                              title={`Hasn't checked: ${primaryApps.filter((a) => !playerOpened.includes(a)).join(", ")}`}
                              style={{ fontSize: "11px", flexShrink: 0, color: "#f59e0b" }}
                            >
                              ⚠
                            </span>
                          )}
                          {/* Decision submitted indicator */}
                          {phase === "decision" && (
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "1px 5px",
                                borderRadius: "4px",
                                background: hasSubmitted ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)",
                                color: hasSubmitted ? "#34d399" : "#6b7280",
                                flexShrink: 0,
                              }}
                            >
                              {hasSubmitted ? "✓" : "…"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── State Panel ── */}
        <div
          style={{
            gridColumn: "2",
            gridRow: "1 / 3",
            background: "#0a0a14",
            padding: "20px 24px",
            overflow: "auto",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
            World State (True Values — GM Only)
          </div>

          {gmRawState ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(Object.keys(STATE_LABELS) as (keyof StateVariables)[]).map((key) => {
                  const value = gmRawState[key];
                  const pct = barPct(key, value);
                  const color = barColor(key, value);

                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>{STATE_LABELS[key]}</span>
                        <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color }}>
                          {value}
                        </span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.07)" }}>
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "2px",
                            background: color,
                            width: `${pct}%`,
                            transition: "width 0.4s ease, background 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {import.meta.env.DEV && (
                <>
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                  <FogInspector gmRawState={gmRawState} round={round ?? 1} />
                </>
              )}
            </>
          ) : (
            <div style={{ color: "#4b5563", fontSize: "13px", fontStyle: "italic" }}>
              Waiting for game state…
            </div>
          )}

          {import.meta.env.DEV && gmRawState && (
            <DevStatePanel gmRawState={gmRawState} gmSetState={gmSetState} />
          )}
        </div>

        {/* ── Message Feed ── */}
        <div
          style={{
            gridColumn: "3",
            gridRow: "1 / 3",
            background: "#0a0a14",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              All Messages
            </div>
            {phase === "decision" && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ color: "#9ca3af", fontSize: "11px" }}>
                  Decisions submitted:{" "}
                  <strong style={{ color: "#e5e7eb" }}>{gmDecisionStatus.length}</strong>
                  {" / "}
                  <strong style={{ color: "#e5e7eb" }}>{lobbyPlayers.length}</strong>
                </div>
              </div>
            )}
          </div>

          <div
            ref={feedRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {messages.length === 0 ? (
              <div style={{ color: "#4b5563", fontSize: "12px", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                No messages yet
              </div>
            ) : (
              messages.map((msg) => {
                const factionColor = FACTION_COLORS[msg.faction] ?? "#9ca3af";
                return (
                  <div
                    key={msg.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ color: "#4b5563", fontSize: "10px", fontFamily: "monospace" }}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <span style={{ color: factionColor, fontWeight: 700, fontSize: "11px" }}>
                        {msg.fromName}
                      </span>
                      <span style={{ color: "#4b5563", fontSize: "10px" }}>
                        → {msg.isTeamChat ? "team chat" : "DM"}
                      </span>
                    </div>
                    <div style={{ color: "#d1d5db", lineHeight: 1.4 }}>{msg.content}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Style helper ──────────────────────────────────────────────────────────────

function btnStyle(color: string, disabled = false): React.CSSProperties {
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
