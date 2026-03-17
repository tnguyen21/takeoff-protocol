import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "../../stores/game.js";
import { PHASE_DURATIONS, ROUND4_PHASE_DURATIONS, computeEndingArcs } from "@takeoff/shared";
import type { GamePhase, StateVariables, EndingArc } from "@takeoff/shared";
import { formatTime } from "../../utils.js";
import { PHASE_LABELS, btnStyle } from "./shared.js";

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

// ── ControlsPanel ─────────────────────────────────────────────────────────────

interface ControlsPanelProps {
  round: number;
  phase: string | null;
  timer: { endsAt: number; pausedAt?: number };
  gmRawState: StateVariables | null;
  gmExtendUsesRemaining: number;
  gmTimerOverrides: Partial<Record<GamePhase, number>>;
  gmAdvance: () => void;
  gmPause: () => void;
  gmExtend: () => void;
  gmSetTimers: (overrides: Partial<Record<GamePhase, number>>) => void;
  endTutorial: () => void;
}

export function ControlsPanel({
  round,
  phase,
  timer,
  gmRawState,
  gmExtendUsesRemaining,
  gmTimerOverrides,
  gmAdvance,
  gmPause,
  gmExtend,
  gmSetTimers,
  endTutorial,
}: ControlsPanelProps) {
  const [showEndings, setShowEndings] = useState(false);
  const isPaused = !!timer.pausedAt;

  return (
    <>
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
    </>
  );
}
