import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../stores/game.js";
import type { Faction, StateDelta } from "@takeoff/shared";
import { FACTION_LONG_NAMES } from "../constants/factions.js";

const REVEAL_DURATION_MS = 4000;

function DeltaRow({ delta }: { delta: StateDelta }) {
  const isPositive = delta.delta > 0;
  const isNegative = delta.delta < 0;

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-md border ${
        isPositive
          ? "bg-status-success/6 border-status-success/15"
          : isNegative
          ? "bg-status-danger/6 border-status-danger/15"
          : "bg-white/3 border-white/6"
      }`}
    >
      {/* Delta indicator */}
      <div
        className={`font-mono text-[13px] font-bold min-w-[48px] text-right shrink-0 ${
          isPositive ? "text-status-success" : isNegative ? "text-red-400" : "text-text-secondary"
        }`}
      >
        {isPositive ? "+" : ""}
        {delta.delta}
      </div>

      {/* Variable label */}
      <div className="flex-1 min-w-0">
        <div className="text-text-primary text-xs font-medium">
          {delta.label}
        </div>
        <div className="text-text-muted text-[11px] mt-px font-mono">
          {delta.oldValue} → {delta.newValue}
          {delta.accuracy === "estimate" && (
            <span className="text-gray-600 ml-1.5">~estimate</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div
        className={`text-[14px] shrink-0 ${
          isPositive ? "text-status-success" : isNegative ? "text-red-400" : "text-text-muted"
        }`}
      >
        {isPositive ? "▲" : isNegative ? "▼" : "—"}
      </div>
    </div>
  );
}

export function Resolution() {
  const { round, resolution, selectedFaction } = useGameStore();

  const paragraphs = resolution
    ? resolution.narrative.split(/\n\n+/).filter(Boolean)
    : [];

  const [revealedCount, setRevealedCount] = useState(0);
  const [fullyRevealed, setFullyRevealed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRevealedCount(0);
    setFullyRevealed(false);

    if (!resolution || paragraphs.length === 0) {
      setFullyRevealed(true);
      return;
    }

    const perParagraph = REVEAL_DURATION_MS / paragraphs.length;
    setRevealedCount(1);

    let count = 1;
    intervalRef.current = setInterval(() => {
      count++;
      setRevealedCount(count);
      if (count >= paragraphs.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setTimeout(() => setFullyRevealed(true), 400);
      }
    }, perParagraph);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // Deps: paragraphs is derived from resolution.narrative; intervalRef, setRevealedCount, setFullyRevealed are stable refs/setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolution?.narrative]);

  if (!resolution) return null;

  const myFaction = selectedFaction;
  const myTeamDecision = myFaction ? resolution.teamDecisions[myFaction] : null;

  const positiveDeltas = resolution.stateDeltas.filter((d) => d.delta > 0);
  const negativeDeltas = resolution.stateDeltas.filter((d) => d.delta < 0);

  return (
    <div
      className="absolute inset-0 flex items-start justify-center overflow-y-auto bg-black/[0.88] backdrop-blur-sm pt-8 pb-8 z-[1000]"
    >
      <div className="flex flex-col gap-6 px-8 py-10 max-w-[760px] w-full">
        {/* Round header */}
        <div className="flex flex-col gap-1">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-text-secondary/70">
            Round {round}
          </div>
          <h1 className="text-2xl font-bold text-text-bright tracking-[-0.02em]">
            <span className="text-text-secondary/50">
              RESOLUTION —{" "}
            </span>
            Consequences
          </h1>
          <div
            className="mt-2 h-px"
            style={{
              background: "linear-gradient(90deg, rgba(234,179,8,0.6) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Narrative */}
        <div className="flex flex-col gap-4">
          {paragraphs.map((para, idx) => (
            <p
              key={idx}
              className="text-sm leading-relaxed"
              style={{
                color: idx < revealedCount ? "rgba(209, 213, 219, 0.92)" : "transparent",
                transition: "color 0.6s ease, opacity 0.6s ease",
                opacity: idx < revealedCount ? 1 : 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Team decisions summary */}
        {fullyRevealed && Object.keys(resolution.teamDecisions).length > 0 && (
          <div className="p-4 rounded-[10px] bg-white/3 border border-white/8">
            <div className="text-text-secondary text-[10px] font-semibold uppercase tracking-[0.1em] mb-2.5">
              Team Decisions
            </div>

            <div className="flex flex-col gap-2">
              {Object.entries(resolution.teamDecisions).map(([faction, decision]) => {
                const isMyFaction = faction === myFaction;
                return (
                  <div key={faction} className="flex items-baseline gap-2">
                    <span
                      className={`text-[11px] min-w-[160px] shrink-0 ${
                        isMyFaction ? "text-amber-400 font-bold" : "text-text-muted font-medium"
                      }`}
                    >
                      {(faction in FACTION_LONG_NAMES) ? FACTION_LONG_NAMES[faction as Faction] : faction}
                      {isMyFaction && " (you)"}
                    </span>
                    <span
                      className={`text-xs italic ${isMyFaction ? "text-text-primary" : "text-text-secondary"}`}
                    >
                      {decision.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Your team's choice — prominent callout */}
        {fullyRevealed && myTeamDecision && (
          <div className="px-[18px] py-[14px] rounded-[10px] bg-amber-400/[0.08] border border-amber-400/25">
            <div className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-1">
              Your Team Chose
            </div>
            <div className="text-amber-100 text-sm font-semibold">
              {myTeamDecision.label}
            </div>
          </div>
        )}

        {/* State deltas */}
        {fullyRevealed && resolution.stateDeltas.length > 0 && (
          <div>
            <div className="text-text-secondary text-[10px] font-semibold uppercase tracking-[0.1em] mb-2.5">
              State Changes (your visibility)
            </div>

            <div className="flex flex-col gap-2">
              {/* Positive deltas first */}
              {positiveDeltas.map((d) => (
                <DeltaRow key={d.variable} delta={d} />
              ))}
              {/* Negative deltas */}
              {negativeDeltas.map((d) => (
                <DeltaRow key={d.variable} delta={d} />
              ))}
            </div>
          </div>
        )}

        {/* No visible changes message */}
        {fullyRevealed && resolution.stateDeltas.length === 0 && (
          <div className="text-text-muted text-[13px] italic p-3 rounded-lg bg-white/2 border border-white/6">
            No state changes visible to your faction this round.
          </div>
        )}

        {/* Waiting indicator */}
        <div
          className="flex items-center gap-2 text-xs font-mono mt-2 text-text-muted/80"
          style={{
            opacity: fullyRevealed ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500/70"
            style={{
              animation: fullyRevealed ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
            }}
          />
          waiting for GM to advance...
        </div>
      </div>
    </div>
  );
}
