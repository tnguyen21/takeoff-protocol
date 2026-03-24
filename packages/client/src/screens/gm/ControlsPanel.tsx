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

  const color =
    remaining <= 30_000
      ? "var(--color-status-danger)"
      : remaining <= 60_000
        ? "var(--color-status-warning)"
        : "var(--color-status-success)";

  return (
    <div
      className="font-mono text-[56px] font-bold leading-none tracking-[-2px] min-w-[3ch] tabular-nums"
      style={{ color }}
    >
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
    <div className="mt-4 flex flex-col gap-3">
      {arcs.map((arc) => (
        <div
          key={arc.id}
          className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden"
        >
          {/* Arc header */}
          <div className="py-2 px-3 bg-white/[0.04] border-b border-white/[0.06] text-[11px] font-bold text-accent-light tracking-[0.06em] uppercase">
            {arc.label}
          </div>
          {/* Outcome spectrum */}
          <div className="py-2 px-3 flex flex-col gap-1">
            {arc.spectrum.map((outcome, i) => {
              const isSelected = i === arc.result;
              const color = outcomeColor(i, arc.spectrum.length);
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md transition-all"
                  style={{
                    padding: isSelected ? "6px 8px" : "4px 8px",
                    background: isSelected ? `${color}18` : "transparent",
                    border: isSelected ? `1px solid ${color}55` : "1px solid transparent",
                  }}
                >
                  {/* Indicator dot */}
                  <div
                    className="w-[7px] h-[7px] rounded-full shrink-0 mt-1"
                    style={{
                      background: isSelected ? color : "rgba(255,255,255,0.12)",
                      boxShadow: isSelected ? `0 0 6px ${color}88` : "none",
                    }}
                  />
                  <span
                    className="text-[11px] leading-[1.4]"
                    style={{
                      color: isSelected ? color : "var(--color-text-muted)",
                      fontWeight: isSelected ? 600 : 400,
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

  return (
    <div className="p-3 rounded-lg bg-yellow-500/[0.06] border border-yellow-500/25">
      <div className="text-yellow-600 text-[9px] font-bold uppercase tracking-widest mb-2">
        Dev — Jump To
      </div>

      <div className="text-text-muted text-[10px] mb-2">
        Current: Round <strong className="text-text-secondary">{currentRound}</strong>{" "}
        <strong className="text-text-secondary">{currentPhase ?? "—"}</strong>
      </div>

      <div className="flex gap-1.5 mb-2">
        <select
          value={targetRound}
          onChange={(e) => setTargetRound(Number(e.target.value))}
          className="bg-surface-elevated border border-white/[0.12] rounded-md text-text-primary text-xs py-[5px] px-2 cursor-pointer flex-1"
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              Round {r}
            </option>
          ))}
        </select>

        <select
          value={targetPhase}
          onChange={(e) => setTargetPhase(e.target.value)}
          className="bg-surface-elevated border border-white/[0.12] rounded-md text-text-primary text-xs py-[5px] px-2 cursor-pointer flex-1"
        >
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
    <div className="p-3 rounded-lg bg-cyan-500/[0.05] border border-cyan-500/20">
      <div className="text-cyan-500 text-[9px] font-bold uppercase tracking-widest mb-2.5">
        Timer Settings
      </div>

      <div className="flex flex-col gap-2 mb-2.5">
        {TIMER_PHASES.map(({ phase, label }) => {
          const value = getEffective(phase);
          const r4Value = ROUND4_PHASE_DURATIONS[phase];
          const isOverridden = draft[phase] !== undefined || gmTimerOverrides[phase] !== undefined;
          const defaultVal = PHASE_DURATIONS[phase] ?? 180;

          return (
            <div key={phase}>
              <div className="flex justify-between mb-1">
                <span className="text-text-secondary text-[11px]">{label}</span>
                <div className="flex items-center gap-1">
                  {r4Value && r4Value !== defaultVal && (
                    <span className="text-text-muted text-[9px] italic">
                      R4:{formatSeconds(r4Value)}
                    </span>
                  )}
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: isOverridden ? "#22d3ee" : "var(--color-text-muted)" }}
                  >
                    {formatSeconds(value)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => step(phase, -30)}
                  className="py-[3px] px-2 rounded border border-border bg-white/5 text-text-secondary text-xs cursor-pointer font-bold leading-none"
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
                  className="flex-1 py-[3px] px-1.5 rounded border border-white/[0.12] bg-white/[0.06] text-text-primary text-xs font-mono text-center outline-none"
                />
                <button
                  onClick={() => step(phase, 30)}
                  className="py-[3px] px-2 rounded border border-border bg-white/5 text-text-secondary text-xs cursor-pointer font-bold leading-none"
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
                    className="py-[3px] px-1.5 rounded border border-red-500/20 bg-red-500/[0.08] text-red-400 text-[10px] cursor-pointer font-bold"
                  >
                    ↩
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5 items-center">
        <button
          onClick={save}
          disabled={!hasDraft}
          className="flex-1 py-1.5 px-2.5 rounded-md text-xs font-semibold"
          style={{
            border: hasDraft ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(255,255,255,0.08)",
            background: hasDraft ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)",
            color: hasDraft ? "#22d3ee" : "var(--color-text-muted)",
            cursor: hasDraft ? "pointer" : "not-allowed",
          }}
        >
          Apply Changes
        </button>
      </div>

      <div className="text-gray-600 text-[10px] mt-2 leading-[1.4]">
        Takes effect on next phase. Round 4 deliberation uses its own 7:00 default unless overridden.
      </div>
    </div>
  );
}

// ── ControlsPanel ─────────────────────────────────────────────────────────────

export function ControlsPanel() {
  const {
    round,
    phase,
    timer,
    gmRawState,
    gmExtendUsesRemaining,
    gmTimerOverrides,
    gmAdvance,
    gmPause,
    gmExtend,
    gmEndGame,
    gmSetTimers,
    endTutorial,
  } = useGameStore();
  const [showEndings, setShowEndings] = useState(false);
  const isPaused = !!timer.pausedAt;
  const handleEndGame = useCallback(() => {
    if (typeof window !== "undefined" && !window.confirm("End the game now and show the ending screen?")) {
      return;
    }
    gmEndGame();
  }, [gmEndGame]);

  return (
    <>
      <div>
        <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
          Phase Timer
        </div>
        <TimerDisplay endsAt={timer.endsAt} pausedAt={timer.pausedAt} isPaused={isPaused} />
        {isPaused && (
          <div className="mt-2 text-status-warning text-[11px] font-semibold uppercase tracking-[0.05em]">
            ⏸ Paused
          </div>
        )}
      </div>

      {/* Timer controls */}
      <div className="flex flex-col gap-2">
        {round === 0 ? (
          /* Tutorial mode: show End Tutorial button prominently */
          <>
            <div className="py-2 px-3 rounded-md bg-yellow-500/[0.08] border border-yellow-500/30 text-amber-400 text-[11px] leading-normal">
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
            <button
              onClick={handleEndGame}
              style={btnStyle("#f87171")}
            >
              ■ End Game Now
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
                className="ml-2 text-[10px] font-semibold py-px px-[5px] rounded"
                style={{
                  background: gmExtendUsesRemaining > 0 ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.05)",
                  color: gmExtendUsesRemaining > 0 ? "#93c5fd" : "var(--color-text-muted)",
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

            <button
              onClick={handleEndGame}
              style={btnStyle("#f87171")}
            >
              ■ End Game Now
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
          <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-2">
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
