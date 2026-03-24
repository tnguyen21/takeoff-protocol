import { useState } from "react";
import { FACTIONS, STATE_VARIABLE_RANGES, computeFogView } from "@takeoff/shared";
import type { Faction, Role, StateVariables, StateView } from "@takeoff/shared";
import { STATE_LABELS } from "../../constants/labels.js";
import { useGameStore } from "../../stores/game.js";

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
    if (pct > 66) return "var(--color-status-danger)";
    if (pct > 33) return "var(--color-status-warning)";
    return "var(--color-status-success)";
  }
  if (neutral.includes(key)) return "#60a5fa";
  // Default: high is good
  const pct = barPct(key, value);
  if (pct > 66) return "var(--color-status-success)";
  if (pct > 33) return "var(--color-status-warning)";
  return "var(--color-status-danger)";
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
    <div className="mt-6 pt-5 border-t border-red-500/25">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="py-0.5 px-[7px] rounded bg-red-500/15 border border-red-500/40 text-red-400 text-[9px] font-bold tracking-[0.12em] uppercase">
          DEV
        </div>
        <span className="text-text-muted text-[10px] font-semibold uppercase tracking-widest">
          State Overrides
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {(Object.keys(STATE_LABELS) as (keyof StateVariables)[]).map((key) => {
          const [min, max] = STATE_VARIABLE_RANGES[key];
          const value = getValue(key);
          const hasPending = pending[key] !== undefined;

          return (
            <div key={key}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-text-secondary text-[11px]">{STATE_LABELS[key]}</span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: hasPending ? "var(--color-status-warning)" : "var(--color-text-muted)" }}
                >
                  {value}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={1}
                  value={value}
                  onChange={(e) => setPending((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="flex-1 cursor-pointer"
                  style={{ accentColor: "var(--color-accent)" }}
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
                  className="py-0.5 px-2 rounded border border-accent-border bg-accent-bg text-accent-light text-[11px] font-semibold cursor-pointer shrink-0"
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

  return (
    <div className="mt-6">
      <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
        Fog Inspector
      </div>

      {/* Selectors */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-text-muted text-[10px] uppercase tracking-[0.08em]">Faction</label>
          <select
            value={selectedFaction}
            onChange={(e) => handleFactionChange(e.target.value as Faction)}
            className="bg-white/[0.06] border border-white/[0.12] rounded-md text-text-primary text-xs py-[5px] px-2 cursor-pointer outline-none"
          >
            {FACTIONS.map((f) => (
              <option key={f.id} value={f.id} className="bg-surface">
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-text-muted text-[10px] uppercase tracking-[0.08em]">Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
            className="bg-white/[0.06] border border-white/[0.12] rounded-md text-text-primary text-xs py-[5px] px-2 cursor-pointer outline-none"
          >
            {factionConfig.roles.map((r) => (
              <option key={r.id} value={r.id} className="bg-surface">
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="overflow-x-auto">
        {/* Header */}
        <div className="grid grid-cols-[1fr_90px_130px] gap-1 py-1 px-2 rounded-t bg-white/[0.04] border-b border-white/[0.08] mb-0.5">
          <span className="text-text-muted text-[10px] font-semibold uppercase tracking-[0.08em]">Variable</span>
          <span className="text-text-muted text-[10px] font-semibold uppercase tracking-[0.08em] text-right">True</span>
          <span className="text-text-muted text-[10px] font-semibold uppercase tracking-[0.08em] text-right">
            {FACTIONS.find((f) => f.id === selectedFaction)?.name ?? selectedFaction} sees
          </span>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-px">
          {(Object.keys(STATE_LABELS) as (keyof StateVariables)[]).map((key) => {
            const trueVal = gmRawState[key];
            const fogVar = fogView[key];
            const accuracy = fogVar.accuracy;

            let fogDisplay: string;
            let fogColor: string;
            if (accuracy === "exact") {
              fogDisplay = String(fogVar.value);
              fogColor = "var(--color-status-success)";
            } else if (accuracy === "estimate") {
              fogDisplay = `~${fogVar.value} ±${fogVar.confidence ?? "?"}`;
              fogColor = "var(--color-status-warning)";
            } else {
              fogDisplay = "HIDDEN";
              fogColor = "#4b5563";
            }

            return (
              <div
                key={key}
                className="grid grid-cols-[1fr_90px_130px] gap-1 py-[5px] px-2 rounded bg-white/[0.02] items-center"
              >
                <span className="text-text-secondary text-[11px]">{STATE_LABELS[key]}</span>
                <span className="font-mono text-xs font-bold text-text-primary text-right">{trueVal}</span>
                <span
                  className={`font-mono text-xs font-bold text-right py-px px-1.5 rounded${accuracy === "hidden" ? " italic" : ""}`}
                  style={{
                    color: fogColor,
                    background:
                      accuracy === "exact"
                        ? "rgba(52,211,153,0.08)"
                        : accuracy === "estimate"
                          ? "rgba(245,158,11,0.08)"
                          : "rgba(75,85,99,0.12)",
                  }}
                >
                  {fogDisplay}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 flex-wrap">
          {[
            { color: "#34d399", bg: "rgba(52,211,153,0.08)", label: "Exact" },
            { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "Estimate ±N" },
            { color: "#4b5563", bg: "rgba(75,85,99,0.12)", label: "Hidden" },
          ].map(({ color, bg, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-7 h-3.5 rounded-[3px]" style={{ background: bg, border: `1px solid ${color}44` }} />
              <span className="text-text-muted text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── StatePanel ────────────────────────────────────────────────────────────────

export function StatePanel() {
  const { gmRawState, round, gmSetState } = useGameStore();
  return (
    <div className="col-start-2 row-span-2 bg-surface py-5 px-6 overflow-auto border-r border-white/[0.06]">
      <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-4">
        World State (True Values — GM Only)
      </div>

      {gmRawState ? (
        <>
          <div className="flex flex-col gap-2.5">
            {(Object.keys(STATE_LABELS) as (keyof StateVariables)[]).map((key) => {
              const value = gmRawState[key];
              const pct = barPct(key, value);
              const color = barColor(key, value);

              return (
                <div key={key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-text-secondary text-xs">{STATE_LABELS[key]}</span>
                    <span className="font-mono text-[13px] font-bold" style={{ color }}>
                      {value}
                    </span>
                  </div>
                  <div className="h-1 rounded-[2px] bg-white/[0.07]">
                    <div
                      className="h-full rounded-[2px]"
                      style={{
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
              <div className="h-px bg-white/[0.06] my-2" />
              <FogInspector gmRawState={gmRawState} round={round ?? 1} />
            </>
          )}
        </>
      ) : (
        <div className="text-gray-600 text-[13px] italic">
          Waiting for game state…
        </div>
      )}

      {import.meta.env.DEV && gmRawState && (
        <DevStatePanel gmRawState={gmRawState} gmSetState={gmSetState} />
      )}
    </div>
  );
}
