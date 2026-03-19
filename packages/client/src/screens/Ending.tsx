import { useRef } from "react";
import { useGameStore } from "../stores/game.js";
import type { EndingArc, RoundHistory, StateVariables } from "@takeoff/shared";
import { STATE_LABELS } from "../constants/labels.js";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATE_KEYS = Object.keys(STATE_LABELS) as (keyof StateVariables)[];

// ── Narrative Arc Table ─────────────────────────────────────────────────────────

function NarrativeArcTable({ arcs }: { arcs: EndingArc[] }) {
  return (
    <div className="bg-surface border border-gray-800 rounded overflow-hidden">
      <table className="w-full border-collapse text-[0.8rem] font-sans">
        <thead>
          <tr>
            <th className="text-left px-4 py-[0.6rem] text-text-muted border-b border-gray-800 whitespace-nowrap w-[180px] font-mono text-[0.65rem] tracking-[0.08em] uppercase">
              Arc
            </th>
            <th className="text-left px-4 py-[0.6rem] text-text-muted border-b border-gray-800 whitespace-nowrap w-[220px] font-mono text-[0.65rem] tracking-[0.08em] uppercase">
              Outcome
            </th>
            <th className="text-left px-4 py-[0.6rem] text-text-muted border-b border-gray-800 font-mono text-[0.65rem] tracking-[0.08em] uppercase">
              Narrative
            </th>
          </tr>
        </thead>
        <tbody>
          {arcs.map((arc) => {
            const outcomeTitle = arc.spectrum[arc.result].split(" — ")[0];
            return (
              <tr key={arc.id} className="border-b border-[#111] last:border-0">
                <td className="px-4 py-3 text-text-bright font-bold align-top whitespace-nowrap">
                  {arc.label}
                </td>
                <td className="px-4 py-3 text-indigo-400 font-mono text-xs align-top leading-[1.4]">
                  {outcomeTitle}
                </td>
                <td className="px-4 py-3 text-text-secondary leading-relaxed align-top">
                  {arc.narrative}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── State History Table ─────────────────────────────────────────────────────────

function StateHistoryTable({ history, finalState }: { history: RoundHistory[]; finalState: StateVariables | null }) {
  const rounds = history.length > 0 ? history.map((h) => h.round) : [1, 2, 3, 4, 5];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs font-mono">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-text-muted border-b border-gray-800 whitespace-nowrap min-w-[160px]">
              Variable
            </th>
            {rounds.map((r) => (
              <th key={r} className="text-right px-3 py-2 text-text-muted border-b border-gray-800 whitespace-nowrap">
                R{r} Before
              </th>
            ))}
            {finalState && (
              <th className="text-right px-3 py-2 text-indigo-500 border-b border-gray-800 whitespace-nowrap">
                Final
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {STATE_KEYS.map((key) => (
            <tr key={key} className="border-b border-[#111]">
              <td className="px-3 py-[0.4rem] text-text-secondary whitespace-nowrap">{STATE_LABELS[key]}</td>
              {history.map((h) => (
                <td key={h.round} className="text-right px-3 py-[0.4rem] text-gray-300 tabular-nums">
                  {h.stateBefore[key].toFixed(0)}
                </td>
              ))}
              {finalState && (
                <td className="text-right px-3 py-[0.4rem] text-indigo-400 font-bold tabular-nums">
                  {finalState[key].toFixed(0)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DecisionHistoryPanel({ history }: { history: RoundHistory[] }) {
  return (
    <div>
      {history.map((h) => (
        <div key={h.round} className="mb-6">
          <div className="text-[0.7rem] font-mono text-indigo-500 tracking-[0.12em] uppercase mb-2">
            Round {h.round}
          </div>

          {/* Team decisions */}
          {Object.entries(h.teamDecisions).length > 0 && (
            <div className="mb-2">
              <div className="text-[0.65rem] font-mono text-gray-600 mb-1">Team Decisions:</div>
              {Object.entries(h.teamDecisions).map(([faction, optionId]) => (
                <div key={faction} className="flex gap-4 text-xs font-mono py-[0.2rem] text-text-secondary">
                  <span className="text-text-muted min-w-[120px]">{faction}</span>
                  <span className="text-text-primary">{optionId}</span>
                </div>
              ))}
            </div>
          )}

          {/* Individual decisions */}
          {Object.entries(h.decisions).length > 0 && (
            <div>
              <div className="text-[0.65rem] font-mono text-gray-600 mb-1">Individual Decisions:</div>
              {Object.entries(h.decisions).map(([playerId, optionId]) => (
                <div key={playerId} className="flex gap-4 text-xs font-mono py-[0.2rem] text-text-secondary">
                  <span className="text-text-muted min-w-[200px] overflow-hidden text-ellipsis">{playerId}</span>
                  <span className="text-text-primary">{optionId}</span>
                </div>
              ))}
            </div>
          )}

          {Object.entries(h.teamDecisions).length === 0 && Object.entries(h.decisions).length === 0 && (
            <div className="text-xs font-mono text-gray-700 italic">No decisions recorded.</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function Ending() {
  const { endingArcs, endingHistory, endingFinalState } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="fixed inset-0 bg-black overflow-y-auto z-[8000]"
      ref={scrollRef}
    >
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur border-b border-gray-800 px-8 py-4 flex items-center gap-4 z-10">
        <div>
          <div className="text-[0.6rem] font-mono tracking-[0.2em] uppercase text-text-muted mb-[0.15rem]">
            Takeoff Protocol — After Action Report
          </div>
          <h1 className="font-sans text-[1.3rem] font-bold text-text-bright m-0 tracking-[-0.02em]">
            Full Debrief
          </h1>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-8 py-12">

        {/* Section 1: Narrative Arcs */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sans text-base font-bold text-text-bright m-0 tracking-[0.01em]">
              § 1 — Narrative Arcs
            </h2>
            <div
              className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }}
            />
          </div>
          <p className="font-sans text-[0.8rem] text-text-muted mb-8 leading-normal">
            Nine dimensions of the crisis, each resolved by the cumulative decisions made during the exercise.
          </p>
          {endingArcs.length > 0 ? (
            <NarrativeArcTable arcs={endingArcs} />
          ) : (
            <div className="font-mono text-[0.8rem] text-gray-700 italic">No arc data available.</div>
          )}
        </section>

        {/* Section 2: State History */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sans text-base font-bold text-text-bright m-0 tracking-[0.01em]">
              § 2 — State Variable History
            </h2>
            <div
              className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }}
            />
          </div>
          <p className="font-sans text-[0.8rem] text-text-muted mb-6 leading-normal">
            Fog of war lifted. True values at the start of each round, as they actually were — not as any faction perceived them.
          </p>
          <div className="bg-surface border border-gray-800 rounded overflow-hidden">
            <StateHistoryTable history={endingHistory} finalState={endingFinalState} />
          </div>
        </section>

        {/* Section 3: Decision Log */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sans text-base font-bold text-text-bright m-0 tracking-[0.01em]">
              § 3 — Decision Log
            </h2>
            <div
              className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }}
            />
          </div>
          <p className="font-sans text-[0.8rem] text-text-muted mb-6 leading-normal">
            Every faction team decision and individual player decision, round by round.
          </p>
          <div className="bg-surface border border-gray-800 rounded p-6">
            {endingHistory.length > 0 ? (
              <DecisionHistoryPanel history={endingHistory} />
            ) : (
              <div className="font-mono text-[0.8rem] text-gray-700 italic">No decision history available.</div>
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 pb-16 border-t border-[#0f1117]">
          <div className="font-mono text-[0.6rem] text-gray-800 tracking-[0.15em] uppercase">
            Takeoff Protocol Exercise — End of Simulation
          </div>
          <div className="mt-2 font-mono text-[0.55rem] text-gray-900">
            Based on AI 2027 scenario · aicrisisexercise.com
          </div>
        </div>
      </div>
    </div>
  );
}
