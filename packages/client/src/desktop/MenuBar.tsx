import { useEffect, useState, useRef } from "react";
import { useGameStore } from "../stores/game.js";
import { useSoundEffects } from "../sounds/index.js";
import { Volume2, VolumeX } from "lucide-react";
import { FACTIONS } from "@takeoff/shared";
import type { Faction, Role, RoleConfig } from "@takeoff/shared";
import { FACTION_PREFIX, FACTION_SHORT_NAMES } from "../constants/factions.js";

function getRoleConfig(faction: Faction | null, role: Role | null): RoleConfig | null {
  if (!faction || !role) return null;
  const factionConfig = FACTIONS.find((f) => f.id === faction);
  if (!factionConfig) return null;
  return factionConfig.roles.find((r) => r.id === role) ?? null;
}

function getRoleDisplayName(faction: Faction | null, role: Role | null): string | null {
  const roleConfig = getRoleConfig(faction, role);
  if (!roleConfig) return null;
  const prefix = faction ? FACTION_PREFIX[faction] : null;
  return prefix ? `${prefix} ${roleConfig.label}` : roleConfig.label;
}

const ROUND_NAMES: Record<number, string> = {
  1: "The Race Heats Up",
  2: "The Superhuman Coder",
  3: "The Intelligence Explosion",
  4: "The Branch Point",
  5: "Endgame",
};

const ROUND_DATES: Record<number, string> = {
  1: "Nov 2026",
  2: "Mar 2027",
  3: "Jul 2027",
  4: "Nov 2027",
  5: "Feb 2028",
};

export function MenuBar() {
  const { phase, round, timer, selectedFaction, selectedRole, isGM } = useGameStore();
  const { muted, toggleMute } = useSoundEffects();
  const [timeLeft, setTimeLeft] = useState("");
  const [showRoleTooltip, setShowRoleTooltip] = useState(false);
  const roleBadgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!timer.endsAt) {
      setTimeLeft("");
      return;
    }

    if (timer.pausedAt) {
      // Show frozen time at moment of pause
      const remaining = Math.max(0, timer.endsAt - timer.pausedAt);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, timer.endsAt - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 200);

    return () => clearInterval(interval);
  }, [timer]);

  const factionLabel = selectedFaction ? FACTION_SHORT_NAMES[selectedFaction] : "—";

  const roleConfig = getRoleConfig(selectedFaction, selectedRole);

  return (
    <div
      className="w-full flex items-center justify-between select-none h-[var(--menubar-height)] bg-[rgba(24,24,26,0.72)] border-b border-white/[0.08] px-3 text-[13px] font-medium"
      style={{
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      {/* Left side: Apple logo + faction */}
      <div className="flex items-center gap-3">
        <span
          className="text-[16px] leading-none text-white/90 -mt-px"
          aria-hidden="true"
        >
          {"\uF8FF"}
        </span>
        <span className="text-white/90 font-semibold">
          {factionLabel}
        </span>
        {phase && phase !== "lobby" && (
          <>
            <span className="text-white/25">|</span>
            {round === 0 ? (
              <span className="py-px px-[7px] rounded bg-yellow-500/15 border border-yellow-500/35 text-amber-400 text-[10px] font-bold tracking-[0.1em] uppercase">
                TUTORIAL
              </span>
            ) : round === 4 && phase === "deliberation" ? (
              <span className="text-amber-400 font-semibold tracking-[0.04em] text-[11px]">
                NEGOTIATION PHASE
              </span>
            ) : (
              <span className="text-white/45 font-normal">
                {phase.charAt(0).toUpperCase() + phase.slice(1)}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right side: round info + timer + mute */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMute}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          className="bg-transparent border-none cursor-pointer flex items-center p-0.5 rounded transition-colors duration-150"
          style={{
            color: muted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
          }}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        {round === 0 && (
          <span className="text-white/30 text-[11px]">
            Practice Round
          </span>
        )}
        {round > 0 && (
          <>
            <span className="text-white/45 text-xs">
              {ROUND_DATES[round]}
            </span>
            <span className="text-white/30 text-[11px]">
              R{round}: {ROUND_NAMES[round]}
            </span>
            {!isGM && (() => {
              const name = getRoleDisplayName(selectedFaction, selectedRole);
              if (!name) return null;
              return (
                <span
                  ref={roleBadgeRef}
                  onMouseEnter={() => setShowRoleTooltip(true)}
                  onMouseLeave={() => setShowRoleTooltip(false)}
                  className="px-2 rounded bg-violet-500/12 border border-violet-500/28 text-violet-300/85 text-[11px] font-semibold tracking-[0.03em] whitespace-nowrap cursor-help relative"
                >
                  {name}
                </span>
              );
            })()}
          </>
        )}
        {timeLeft && (
          <span className="font-mono text-xs text-white/85 bg-white/[0.08] rounded py-px px-[7px] border border-white/10 tracking-[0.02em] tabular-nums min-w-[3.5ch] inline-block text-center">
            {timeLeft}
          </span>
        )}
      </div>

      {/* Role Tooltip */}
      {showRoleTooltip && roleConfig && (
        <div
          className="fixed right-3 w-80 max-w-[calc(100vw-24px)] bg-[rgba(28,28,32,0.95)] rounded-[10px] border border-violet-500/25 p-4 z-[10000]"
          style={{
            top: roleBadgeRef.current ? roleBadgeRef.current.getBoundingClientRect().bottom + 8 : 0,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)",
            animation: "roleTooltipIn 0.15s ease-out",
          }}
        >
          {/* Role Title */}
          <div className="text-[13px] font-bold text-violet-300/95 mb-2 tracking-[0.02em]">
            {(selectedFaction ? FACTION_PREFIX[selectedFaction] : "")} {roleConfig.label}
          </div>

          {/* Description */}
          <div className="text-xs leading-[1.5] text-white/65 mb-3">
            {roleConfig.description}
          </div>

          {/* Goals Section */}
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500/80 mb-2">
            Your Objectives
          </div>

          <ul className="m-0 p-0 list-none">
            {roleConfig.goals.map((goal, index) => (
              <li
                key={index}
                className="text-[11px] leading-[1.5] text-white/55 pl-[14px] relative"
                style={{ marginBottom: index < roleConfig.goals.length - 1 ? "6px" : 0 }}
              >
                <span className="absolute left-0 top-[5px] w-[5px] h-[5px] rounded-full bg-violet-500/60" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
