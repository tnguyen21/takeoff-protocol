import { useState, useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../stores/game.js";
import { FACTIONS } from "@takeoff/shared";
import { soundManager } from "../sounds/index.js";
import { formatTime } from "../utils.js";
import { RadioGroup } from "../components/RadioGroup.js";

function isLeaderRole(role: string | null): boolean {
  if (!role) return false;
  for (const faction of FACTIONS) {
    const roleConfig = faction.roles.find((r) => r.id === role);
    if (roleConfig) return roleConfig.isLeader;
  }
  return false;
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
  const [individual2Choice, setIndividual2Choice] = useState<string | null>(null);
  const [teamVoteChoice, setTeamVoteChoice] = useState<string | null>(null);
  const [leaderFinalChoice, setLeaderFinalChoice] = useState<string | null>(null);

  // Refs that always hold the latest choice values, eliminating stale closure in auto-submit
  const individualChoiceRef = useRef(individualChoice);
  const individual2ChoiceRef = useRef(individual2Choice);
  const teamVoteChoiceRef = useRef(teamVoteChoice);
  useEffect(() => { individualChoiceRef.current = individualChoice; }, [individualChoice]);
  useEffect(() => { individual2ChoiceRef.current = individual2Choice; }, [individual2Choice]);
  useEffect(() => { teamVoteChoiceRef.current = teamVoteChoice; }, [teamVoteChoice]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const isLeader = isLeaderRole(selectedRole);

  // Reset local state when a new decision phase begins
  useEffect(() => {
    if (phase === "decision") {
      setIndividualChoice(null);
      setIndividual2Choice(null);
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
      if (timer.pausedAt) {
        const remaining = Math.max(0, timer.endsAt - timer.pausedAt);
        setTimeRemaining(remaining);
        return;
      }
      const remaining = Math.max(0, timer.endsAt - Date.now());
      setTimeRemaining(remaining);
      if (remaining === 0 && !timedOut) {
        setTimedOut(true);
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [phase, timer, timedOut]);

  // Auto-submit when timer expires (if not already submitted).
  // Reads from refs so the callback always uses the latest choice values even if
  // the timer fires in the same render batch as a radio-button selection change.
  const handleSubmit = useCallback(() => {
    if (decisionSubmitted) return;
    soundManager.play("pop");
    submitDecision(
      individualChoiceRef.current ?? "",
      individual2ChoiceRef.current ?? undefined,
      teamVoteChoiceRef.current ?? undefined,
    );
  }, [decisionSubmitted, submitDecision]);

  useEffect(() => {
    if (timedOut && !decisionSubmitted && !autoSubmitted) {
      setAutoSubmitted(true);
      handleSubmit();
    }
  }, [timedOut, decisionSubmitted, autoSubmitted, handleSubmit]);

  if (phase !== "decision") return null;

  const individual = decisions?.individual ?? null;
  const individual2 = decisions?.individual2 ?? null;
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur">
      {/* Modal */}
      <div
        className="w-[min(860px,95vw)] max-h-[90vh] overflow-y-auto bg-[rgba(18,18,28,0.95)] border border-white/[0.12] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-b-white/8">
          <div>
            <div className="text-text-primary text-lg font-bold tracking-[-0.3px]">
              Decision Phase
            </div>
            <div className="text-text-muted text-xs mt-0.5">
              Submit your decisions before time runs out
            </div>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="font-mono text-[32px] font-bold leading-none"
              style={{ color: timerColor, transition: "color 0.5s" }}
            >
              {timedOut ? "0:00" : formatTime(timeRemaining)}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-[0.05em]">
              remaining
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1">
          {/* Individual Decision */}
          <div className="flex-1 px-6 py-5 border-r border-r-white/[0.06]">
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span className="text-accent-muted text-[11px] font-semibold uppercase tracking-[0.08em]">
                Individual Decision
              </span>
            </div>

            {individual ? (
              <>
                <p className="text-gray-300 text-[13px] leading-relaxed mb-4">
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
              <p className="text-text-muted text-[13px] italic">
                No individual decision this round.
              </p>
            )}
          </div>

          {/* Right Column: Tactical Decision OR Team Decision */}
          <div className="flex-1 px-6 py-5 flex flex-col">
            {individual2 ? (
              <>
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-300 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    Tactical Decision
                  </span>
                </div>

                <p className="text-gray-300 text-[13px] leading-relaxed mb-4">
                  {individual2.prompt}
                </p>
                <RadioGroup
                  groupName="individual2"
                  options={individual2.options}
                  selected={individual2Choice}
                  onSelect={setIndividual2Choice}
                  disabled={isSubmitDisabled}
                />
              </>
            ) : team ? (
              <>
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-faction-prometheus shrink-0" />
                  <span className="text-cyan-300 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    Team Decision
                  </span>
                  {isLeader && (
                    <span className="ml-auto text-[10px] font-semibold text-amber-400 bg-amber-400/[0.12] border border-amber-400/30 rounded px-1.5 py-px tracking-[0.04em] uppercase">
                      Leader
                    </span>
                  )}
                </div>

                <p className="text-gray-300 text-[13px] leading-relaxed mb-4">
                  {team.prompt}
                </p>

                {isLeader ? (
                  <>
                    {totalVotes > 0 && (
                      <div className="mb-4 px-3.5 py-3 bg-white/3 border border-white/8 rounded-[10px]">
                        <div className="text-text-secondary text-[10px] font-semibold uppercase tracking-[0.08em] mb-2">
                          Team Votes
                        </div>
                        {team.options.map((opt) => {
                          const count = voteTallies[opt.id] ?? 0;
                          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                          return (
                            <div key={opt.id} className="mb-1.5">
                              <div className="flex justify-between mb-0.5">
                                <span className="text-gray-300 text-xs">{opt.label}</span>
                                <span className="text-text-muted text-[11px]">{count} ({pct}%)</span>
                              </div>
                              <div className="h-[3px] rounded-[2px] bg-white/[0.06]">
                                <div
                                  className="h-full rounded-[2px] bg-amber-400/60"
                                  style={{
                                    width: `${pct}%`,
                                    transition: "width 0.4s ease",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

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
                      className={`mt-3 w-full py-[9px] rounded-lg border border-amber-400/40 text-[13px] font-semibold transition-all duration-[150ms] ${
                        !teamLocked && leaderFinalChoice
                          ? "bg-amber-400/[0.15] text-amber-400 cursor-pointer"
                          : "bg-white/3 text-text-muted cursor-not-allowed"
                      }`}
                    >
                      {teamLocked ? "Team Decision Locked ✓" : "Lock Team Decision"}
                    </button>
                  </>
                ) : (
                  <RadioGroup
                    groupName="team-vote"
                    options={team.options}
                    selected={teamVoteChoice}
                    onSelect={setTeamVoteChoice}
                    disabled={isSubmitDisabled}
                  />
                )}
              </>
            ) : (
              <p className="text-text-muted text-[13px] italic">
                No decision this round.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-t-white/8 flex items-center justify-between">
          {decisionSubmitted ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-success" />
              <span className="text-status-success text-[13px] font-medium">
                {timedOut && autoSubmitted ? "Time's up — inaction recorded." : "Submitted. Waiting for others..."}
              </span>
            </div>
          ) : timedOut ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-danger" />
              <span className="text-status-danger text-[13px] font-medium">
                Time's up — inaction recorded.
              </span>
            </div>
          ) : (
            <div className="text-text-muted text-xs">
              {!individualChoice && !individual2Choice && !teamVoteChoice
                ? "Select your choices above, or skip to abstain."
                : "Ready to submit."}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`py-[9px] px-5 rounded-lg text-[13px] font-semibold transition-all duration-[150ms] ${
              isSubmitDisabled
                ? "border border-white/8 bg-white/3 text-text-muted cursor-not-allowed"
                : "border border-accent/50 bg-accent/20 text-accent-light cursor-pointer"
            }`}
          >
            {decisionSubmitted ? "Submitted ✓" : "Submit Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
