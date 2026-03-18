import { useState } from "react";
import { FACTIONS, STATE_VARIABLE_RANGES, computeFogView } from "@takeoff/shared";
import type { Faction, Role, StateVariables, StateView } from "@takeoff/shared";
import { STATE_LABELS } from "../../constants/labels.js";

// ── Private helpers ───────────────────────────────────────────────────────────

function barPct(key: keyof StateVariables, value: number): number {
  const [min, max] = STATE_VARIABLE_RANGES[key];
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
          const [min, max] = STATE_VARIABLE_RANGES[key];
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

  const fogView: StateView = computeFogView(gmRawState, selectedFaction, round);

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

// ── StatePanel ────────────────────────────────────────────────────────────────

interface StatePanelProps {
  gmRawState: StateVariables | null;
  round: number;
  gmSetState: (variable: keyof StateVariables, value: number) => void;
}

export function StatePanel({ gmRawState, round, gmSetState }: StatePanelProps) {
  return (
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
  );
}
