import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "../stores/game.js";
import { FACTIONS } from "@takeoff/shared";
import type { DecisionOption } from "@takeoff/shared";
import { soundManager } from "../sounds/index.js";

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function isLeaderRole(role: string | null): boolean {
  if (!role) return false;
  for (const faction of FACTIONS) {
    const roleConfig = faction.roles.find((r) => r.id === role);
    if (roleConfig) return roleConfig.isLeader;
  }
  return false;
}

function RadioGroup({
  groupName,
  options,
  selected,
  onSelect,
  disabled,
}: {
  groupName: string;
  options: DecisionOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <label
            key={opt.id}
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              padding: "10px 14px",
              borderRadius: "8px",
              border: `1px solid ${isSelected ? "rgba(139,92,246,0.7)" : "rgba(255,255,255,0.1)"}`,
              background: isSelected ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled && !isSelected ? 0.5 : 1,
              transition: "all 0.15s ease",
            }}
          >
            <input
              type="radio"
              name={groupName}
              value={opt.id}
              checked={isSelected}
              disabled={disabled}
              onChange={() => !disabled && onSelect(opt.id)}
              style={{ marginTop: "3px", accentColor: "#8b5cf6", flexShrink: 0 }}
            />
            <div>
              <div style={{ color: isSelected ? "#c4b5fd" : "#e5e7eb", fontSize: "13px", fontWeight: 500, lineHeight: 1.3 }}>
                {opt.label}
              </div>
              <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "3px", lineHeight: 1.4 }}>
                {opt.description}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

export function Decision() {
  const {
    phase,
    timer,
    decisions,
    decisionSubmitted,
    teamVotes,
    teamLocked,
    selectedRole,
    submitDecision,
    submitLeaderDecision,
  } = useGameStore();

  const [individualChoice, setIndividualChoice] = useState<string | null>(null);
  const [teamVoteChoice, setTeamVoteChoice] = useState<string | null>(null);
  const [leaderFinalChoice, setLeaderFinalChoice] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const isLeader = isLeaderRole(selectedRole);

  // Reset local state when a new decision phase begins
  useEffect(() => {
    if (phase === "decision") {
      setIndividualChoice(null);
      setTeamVoteChoice(null);
      setLeaderFinalChoice(null);
      setTimedOut(false);
      setAutoSubmitted(false);
    }
  }, [phase, decisions]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "decision") return;

    const tick = () => {
      const now = Date.now();
      const endsAt = timer.pausedAt ? timer.endsAt - (now - timer.pausedAt) : timer.endsAt;
      const remaining = Math.max(0, endsAt - now);
      setTimeRemaining(remaining);

      if (remaining === 0 && !timedOut) {
        setTimedOut(true);
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [phase, timer, timedOut]);

  // Auto-submit when timer expires (if not already submitted)
  const handleSubmit = useCallback(() => {
    if (decisionSubmitted) return;
    soundManager.play("pop");
    submitDecision(individualChoice ?? "", teamVoteChoice ?? undefined);
  }, [decisionSubmitted, individualChoice, teamVoteChoice, submitDecision]);

  useEffect(() => {
    if (timedOut && !decisionSubmitted && !autoSubmitted) {
      setAutoSubmitted(true);
      handleSubmit();
    }
  }, [timedOut, decisionSubmitted, autoSubmitted, handleSubmit]);

  if (phase !== "decision") return null;

  const individual = decisions?.individual ?? null;
  const team = decisions?.team ?? null;

  const isSubmitDisabled = decisionSubmitted || timedOut;
  const timerColor = timeRemaining <= 30000 ? "#ef4444" : timeRemaining <= 60000 ? "#f59e0b" : "#34d399";

  // Build vote tallies for leader view
  const voteTallies: Record<string, number> = {};
  if (team) {
    for (const opt of team.options) {
      voteTallies[opt.id] = 0;
    }
    for (const optId of Object.values(teamVotes)) {
      if (optId in voteTallies) {
        voteTallies[optId]++;
      }
    }
  }
  const totalVotes = Object.values(voteTallies).reduce((a, b) => a + b, 0);

  return (
    // Full-screen overlay
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Modal */}
      <div
        style={{
          width: "min(860px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "rgba(18,18,28,0.95)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <div style={{ color: "#e5e7eb", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
              Decision Phase
            </div>
            <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "2px" }}>
              Submit your decisions before time runs out
            </div>
          </div>

          {/* Countdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "32px",
                fontWeight: 700,
                color: timerColor,
                lineHeight: 1,
                transition: "color 0.5s",
              }}
            >
              {timedOut ? "0:00" : formatTime(timeRemaining)}
            </div>
            <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              remaining
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", gap: "0", flex: 1 }}>
          {/* Individual Decision */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
          >
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
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#8b5cf6",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#a78bfa", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Individual Decision
              </span>
            </div>

            {individual ? (
              <>
                <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
                  {individual.prompt}
                </p>
                <RadioGroup
                  groupName="individual"
                  options={individual.options}
                  selected={individualChoice}
                  onSelect={setIndividualChoice}
                  disabled={isSubmitDisabled}
                />
              </>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "13px", fontStyle: "italic" }}>
                No individual decision this round.
              </p>
            )}
          </div>

          {/* Team Decision */}
          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "0" }}>
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
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#06b6d4",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#67e8f9", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Team Decision
              </span>
              {isLeader && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#fbbf24",
                    background: "rgba(251,191,36,0.12)",
                    border: "1px solid rgba(251,191,36,0.3)",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Leader
                </span>
              )}
            </div>

            {team ? (
              <>
                <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
                  {team.prompt}
                </p>
                <RadioGroup
                  groupName="team-vote"
                  options={team.options}
                  selected={teamVoteChoice}
                  onSelect={setTeamVoteChoice}
                  disabled={isSubmitDisabled}
                />

                {/* Leader: vote tallies + final submit */}
                {isLeader && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "14px",
                      background: "rgba(251,191,36,0.05)",
                      border: "1px solid rgba(251,191,36,0.15)",
                      borderRadius: "10px",
                    }}
                  >
                    <div style={{ color: "#fbbf24", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                      Team Vote Tallies
                    </div>
                    {team.options.map((opt) => {
                      const count = voteTallies[opt.id] ?? 0;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      return (
                        <div key={opt.id} style={{ marginBottom: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                            <span style={{ color: "#e5e7eb", fontSize: "12px" }}>{opt.label}</span>
                            <span style={{ color: "#9ca3af", fontSize: "12px" }}>{count} vote{count !== 1 ? "s" : ""} ({pct}%)</span>
                          </div>
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)" }}>
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "2px",
                                background: "#fbbf24",
                                width: `${pct}%`,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Leader final decision — can override popular vote */}
                    <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                      <div style={{ color: "#fbbf24", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                        Final Decision (your call — overrides vote)
                      </div>
                      <RadioGroup
                        groupName="leader-final"
                        options={team.options}
                        selected={leaderFinalChoice}
                        onSelect={setLeaderFinalChoice}
                        disabled={teamLocked}
                      />
                      <button
                        onClick={() => {
                          if (leaderFinalChoice && !teamLocked) {
                            submitLeaderDecision(leaderFinalChoice);
                          }
                        }}
                        disabled={!leaderFinalChoice || teamLocked}
                        style={{
                          marginTop: "12px",
                          width: "100%",
                          padding: "9px",
                          borderRadius: "8px",
                          border: "1px solid rgba(251,191,36,0.4)",
                          background: teamLocked
                            ? "rgba(255,255,255,0.03)"
                            : leaderFinalChoice
                            ? "rgba(251,191,36,0.15)"
                            : "rgba(255,255,255,0.03)",
                          color: teamLocked ? "#6b7280" : leaderFinalChoice ? "#fbbf24" : "#6b7280",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: teamLocked || !leaderFinalChoice ? "not-allowed" : "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {teamLocked ? "Team Decision Locked ✓" : "Lock Team Decision"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "13px", fontStyle: "italic" }}>
                No team decision this round.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {decisionSubmitted ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399" }} />
              <span style={{ color: "#34d399", fontSize: "13px", fontWeight: 500 }}>
                {timedOut && autoSubmitted ? "Time's up — inaction recorded." : "Submitted. Waiting for others..."}
              </span>
            </div>
          ) : timedOut ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: 500 }}>
                Time's up — inaction recorded.
              </span>
            </div>
          ) : (
            <div style={{ color: "#6b7280", fontSize: "12px" }}>
              {!individualChoice && !teamVoteChoice
                ? "Select your choices above, or skip to abstain."
                : "Ready to submit."}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              border: isSubmitDisabled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(139,92,246,0.5)",
              background: isSubmitDisabled ? "rgba(255,255,255,0.03)" : "rgba(139,92,246,0.2)",
              color: isSubmitDisabled ? "#6b7280" : "#c4b5fd",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isSubmitDisabled ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {decisionSubmitted ? "Submitted ✓" : "Submit Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
