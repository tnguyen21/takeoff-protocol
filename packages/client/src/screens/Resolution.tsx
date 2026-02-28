import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../stores/game.js";
import type { StateDelta } from "@takeoff/shared";

const FACTION_NAMES: Record<string, string> = {
  openbrain: "OpenBrain",
  prometheus: "Prometheus",
  china: "China (DeepCent)",
  external: "External Stakeholders",
};

const REVEAL_DURATION_MS = 4000;

function DeltaRow({ delta }: { delta: StateDelta }) {
  const isPositive = delta.delta > 0;
  const isNegative = delta.delta < 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 12px",
        borderRadius: "6px",
        background: isPositive
          ? "rgba(52, 211, 153, 0.06)"
          : isNegative
          ? "rgba(239, 68, 68, 0.06)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isPositive ? "rgba(52,211,153,0.15)" : isNegative ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Delta indicator */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "13px",
          fontWeight: 700,
          color: isPositive ? "#34d399" : isNegative ? "#f87171" : "#9ca3af",
          minWidth: "48px",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {isPositive ? "+" : ""}
        {delta.delta}
      </div>

      {/* Variable label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#e5e7eb", fontSize: "12px", fontWeight: 500 }}>
          {delta.label}
        </div>
        <div style={{ color: "#6b7280", fontSize: "11px", marginTop: "1px", fontFamily: "monospace" }}>
          {delta.oldValue} → {delta.newValue}
          {delta.accuracy === "estimate" && (
            <span style={{ color: "#4b5563", marginLeft: "6px" }}>~estimate</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div
        style={{
          fontSize: "14px",
          color: isPositive ? "#34d399" : isNegative ? "#f87171" : "#6b7280",
          flexShrink: 0,
        }}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolution?.narrative]);

  if (!resolution) return null;

  const myFaction = selectedFaction;
  const myTeamDecision = myFaction ? resolution.teamDecisions[myFaction] : null;

  const positiveDeltas = resolution.stateDeltas.filter((d) => d.delta > 0);
  const negativeDeltas = resolution.stateDeltas.filter((d) => d.delta < 0);

  return (
    <div
      className="absolute inset-0 flex items-start justify-center overflow-y-auto"
      style={{
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(4px)",
        paddingTop: "32px",
        paddingBottom: "32px",
        zIndex: 1000,
      }}
    >
      <div
        className="flex flex-col gap-6 px-8 py-10"
        style={{ maxWidth: "760px", width: "100%" }}
      >
        {/* Round header */}
        <div className="flex flex-col gap-1">
          <div
            className="text-xs font-mono uppercase tracking-[0.25em]"
            style={{ color: "rgba(156, 163, 175, 0.7)" }}
          >
            Round {round}
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#f9fafb", letterSpacing: "-0.02em" }}
          >
            <span style={{ color: "rgba(156, 163, 175, 0.5)" }}>
              RESOLUTION —{" "}
            </span>
            Consequences
          </h1>
          <div
            className="mt-2"
            style={{
              height: "1px",
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
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                color: "#9ca3af",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
              Team Decisions
            </div>

            <div className="flex flex-col gap-2">
              {Object.entries(resolution.teamDecisions).map(([faction, decision]) => {
                const isMyFaction = faction === myFaction;
                return (
                  <div
                    key={faction}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: isMyFaction ? "#fbbf24" : "#6b7280",
                        fontSize: "11px",
                        fontWeight: isMyFaction ? 700 : 500,
                        minWidth: "160px",
                        flexShrink: 0,
                      }}
                    >
                      {FACTION_NAMES[faction] ?? faction}
                      {isMyFaction && " (you)"}
                    </span>
                    <span
                      style={{
                        color: isMyFaction ? "#e5e7eb" : "#9ca3af",
                        fontSize: "12px",
                        fontStyle: "italic",
                      }}
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
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            <div
              style={{
                color: "#fbbf24",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              Your Team Chose
            </div>
            <div style={{ color: "#fef3c7", fontSize: "14px", fontWeight: 600 }}>
              {myTeamDecision.label}
            </div>
          </div>
        )}

        {/* State deltas */}
        {fullyRevealed && resolution.stateDeltas.length > 0 && (
          <div>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
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
          <div
            style={{
              color: "#6b7280",
              fontSize: "13px",
              fontStyle: "italic",
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            No state changes visible to your faction this round.
          </div>
        )}

        {/* Waiting indicator */}
        <div
          className="flex items-center gap-2 text-xs font-mono"
          style={{
            color: "rgba(107, 114, 128, 0.8)",
            opacity: fullyRevealed ? 1 : 0,
            transition: "opacity 0.8s ease",
            marginTop: "0.5rem",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: "rgba(234, 179, 8, 0.7)",
              animation: fullyRevealed ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
            }}
          />
          waiting for GM to advance...
        </div>
      </div>
    </div>
  );
}
