import { useRef } from "react";
import { useGameStore } from "../stores/game.js";
import type { EndingArc, RoundHistory, StateVariables } from "@takeoff/shared";

// ── Constants ──────────────────────────────────────────────────────────────────

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
  // Tier 1
  marketIndex: "Market Index",
  regulatoryPressure: "Regulatory Pressure",
  globalMediaCycle: "Global Media Cycle",
  // Tier 2
  chinaWeightTheftProgress: "China Weight Theft",
  aiAutonomyLevel: "AI Autonomy Level",
  whistleblowerPressure: "Whistleblower Pressure",
  openSourceMomentum: "Open Source Momentum",
  doomClockDistance: "Doom Clock Distance",
  // Tier 3 — OpenBrain
  obMorale: "OB Morale",
  obBurnRate: "OB Burn Rate",
  obBoardConfidence: "OB Board Confidence",
  // Tier 3 — Prometheus
  promMorale: "Prom Morale",
  promBurnRate: "Prom Burn Rate",
  promBoardConfidence: "Prom Board Confidence",
  promSafetyBreakthroughProgress: "Prom Safety Breakthrough",
  // Tier 3 — China
  cdzComputeUtilization: "CDZ Compute Utilization",
  ccpPatience: "CCP Patience",
  domesticChipProgress: "Domestic Chip Progress",
};

const STATE_KEYS = Object.keys(STATE_LABELS) as (keyof StateVariables)[];

// ── Narrative Arc Table ─────────────────────────────────────────────────────────

function NarrativeArcTable({ arcs }: { arcs: EndingArc[] }) {
  return (
    <div style={{ background: "#0a0a0f", border: "1px solid #1f2937", borderRadius: "4px", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", fontFamily: "sans-serif" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.6rem 1rem", color: "#6b7280", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap", width: "180px", fontFamily: "monospace", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Arc
            </th>
            <th style={{ textAlign: "left", padding: "0.6rem 1rem", color: "#6b7280", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap", width: "220px", fontFamily: "monospace", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Outcome
            </th>
            <th style={{ textAlign: "left", padding: "0.6rem 1rem", color: "#6b7280", borderBottom: "1px solid #1f2937", fontFamily: "monospace", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Narrative
            </th>
          </tr>
        </thead>
        <tbody>
          {arcs.map((arc, i) => {
            const outcomeTitle = arc.spectrum[arc.result].split(" — ")[0];
            return (
              <tr key={arc.id} style={{ borderBottom: i < arcs.length - 1 ? "1px solid #111" : "none" }}>
                <td style={{ padding: "0.75rem 1rem", color: "#f9fafb", fontWeight: 700, verticalAlign: "top", whiteSpace: "nowrap" }}>
                  {arc.label}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "#818cf8", fontFamily: "monospace", fontSize: "0.75rem", verticalAlign: "top", lineHeight: 1.4 }}>
                  {outcomeTitle}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "#9ca3af", lineHeight: 1.6, verticalAlign: "top" }}>
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
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", fontFamily: "monospace" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#6b7280", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap", minWidth: "160px" }}>
              Variable
            </th>
            {rounds.map((r) => (
              <th key={r} style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#6b7280", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap" }}>
                R{r} Before
              </th>
            ))}
            {finalState && (
              <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#6366f1", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap" }}>
                Final
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {STATE_KEYS.map((key) => (
            <tr key={key} style={{ borderBottom: "1px solid #111" }}>
              <td style={{ padding: "0.4rem 0.75rem", color: "#9ca3af", whiteSpace: "nowrap" }}>{STATE_LABELS[key]}</td>
              {history.map((h) => (
                <td key={h.round} style={{ textAlign: "right", padding: "0.4rem 0.75rem", color: "#d1d5db", fontVariantNumeric: "tabular-nums" }}>
                  {h.stateBefore[key].toFixed(0)}
                </td>
              ))}
              {finalState && (
                <td style={{ textAlign: "right", padding: "0.4rem 0.75rem", color: "#818cf8", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
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
        <div key={h.round} style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Round {h.round}
          </div>

          {/* Team decisions */}
          {Object.entries(h.teamDecisions).length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#4b5563", marginBottom: "0.25rem" }}>Team Decisions:</div>
              {Object.entries(h.teamDecisions).map(([faction, optionId]) => (
                <div key={faction} style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", fontFamily: "monospace", padding: "0.2rem 0", color: "#9ca3af" }}>
                  <span style={{ color: "#6b7280", minWidth: "120px" }}>{faction}</span>
                  <span style={{ color: "#e5e7eb" }}>{optionId}</span>
                </div>
              ))}
            </div>
          )}

          {/* Individual decisions */}
          {Object.entries(h.decisions).length > 0 && (
            <div>
              <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#4b5563", marginBottom: "0.25rem" }}>Individual Decisions:</div>
              {Object.entries(h.decisions).map(([playerId, optionId]) => (
                <div key={playerId} style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", fontFamily: "monospace", padding: "0.2rem 0", color: "#9ca3af" }}>
                  <span style={{ color: "#6b7280", minWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{playerId}</span>
                  <span style={{ color: "#e5e7eb" }}>{optionId}</span>
                </div>
              ))}
            </div>
          )}

          {Object.entries(h.teamDecisions).length === 0 && Object.entries(h.decisions).length === 0 && (
            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#374151", fontStyle: "italic" }}>No decisions recorded.</div>
          )}
        </div>
      ))}
    </div>
  );
}

function DebriefScreen() {
  const { endingArcs, endingHistory, endingFinalState } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#020204",
        overflowY: "auto",
        zIndex: 8000,
      }}
      ref={scrollRef}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(2, 2, 4, 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1f2937",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: "0.6rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b7280", marginBottom: "0.15rem" }}>
            Takeoff Protocol — After Action Report
          </div>
          <h1 style={{ fontFamily: "sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "-0.02em" }}>
            Full Debrief
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "3rem 2rem" }}>

        {/* Section 1: Narrative Arcs */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "0.01em" }}>
              § 1 — Narrative Arcs
            </h2>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }} />
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#6b7280", marginBottom: "2rem", lineHeight: 1.5 }}>
            Nine dimensions of the crisis, each resolved by the cumulative decisions made during the exercise.
          </p>
          {endingArcs.length > 0 ? (
            <NarrativeArcTable arcs={endingArcs} />
          ) : (
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#374151", fontStyle: "italic" }}>No arc data available.</div>
          )}
        </section>

        {/* Section 2: State History */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "0.01em" }}>
              § 2 — State Variable History
            </h2>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }} />
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Fog of war lifted. True values at the start of each round, as they actually were — not as any faction perceived them.
          </p>
          <div style={{ background: "#0a0a0f", border: "1px solid #1f2937", borderRadius: "4px", overflow: "hidden" }}>
            <StateHistoryTable history={endingHistory} finalState={endingFinalState} />
          </div>
        </section>

        {/* Section 3: Decision Log */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "0.01em" }}>
              § 3 — Decision Log
            </h2>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }} />
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Every faction team decision and individual player decision, round by round.
          </p>
          <div style={{ background: "#0a0a0f", border: "1px solid #1f2937", borderRadius: "4px", padding: "1.5rem" }}>
            {endingHistory.length > 0 ? (
              <DecisionHistoryPanel history={endingHistory} />
            ) : (
              <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#374151", fontStyle: "italic" }}>No decision history available.</div>
            )}
          </div>
        </section>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "2rem 0 4rem", borderTop: "1px solid #0f1117" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#1f2937", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Takeoff Protocol Exercise — End of Simulation
          </div>
          <div style={{ marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.55rem", color: "#111827" }}>
            Based on AI 2027 scenario · aicrisisexercise.com
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Ending Screen ─────────────────────────────────────────────────────────

export const Ending = DebriefScreen;
