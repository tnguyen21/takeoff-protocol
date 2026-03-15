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
      className="w-full flex items-center justify-between select-none"
      style={{
        height: "var(--menubar-height)",
        background: "rgba(24, 24, 26, 0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        paddingInline: "12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      {/* Left side: Apple logo + faction */}
      <div className="flex items-center gap-3">
        <span
          style={{
            fontSize: "16px",
            lineHeight: 1,
            color: "rgba(255,255,255,0.9)",
            marginTop: "-1px",
          }}
          aria-hidden="true"
        >
          {"\uF8FF"}
        </span>
        <span style={{ color: "rgba(255,255,255,0.90)", fontWeight: 600 }}>
          {factionLabel}
        </span>
        {phase && phase !== "lobby" && (
          <>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span>
            {round === 0 ? (
              <span
                style={{
                  padding: "1px 7px",
                  borderRadius: "4px",
                  background: "rgba(234,179,8,0.15)",
                  border: "1px solid rgba(234,179,8,0.35)",
                  color: "#fbbf24",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                TUTORIAL
              </span>
            ) : round === 4 && phase === "deliberation" ? (
              <span style={{ color: "#fbbf24", fontWeight: 600, letterSpacing: "0.04em", fontSize: "11px" }}>
                NEGOTIATION PHASE
              </span>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
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
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: muted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            padding: "2px",
            borderRadius: "4px",
            transition: "color 0.15s",
          }}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        {round === 0 && (
          <span style={{ color: "rgba(255,255,255,0.30)", fontSize: "11px" }}>
            Practice Round
          </span>
        )}
        {round > 0 && (
          <>
            <span
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "12px",
              }}
            >
              {ROUND_DATES[round]}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.30)",
                fontSize: "11px",
              }}
            >
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
                  style={{
                    padding: "0 8px",
                    borderRadius: "4px",
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.28)",
                    color: "rgba(196,181,253,0.85)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    whiteSpace: "nowrap",
                    cursor: "help",
                    position: "relative",
                  }}
                >
                  {name}
                </span>
              );
            })()}
          </>
        )}
        {timeLeft && (
          <span
            style={{
              fontFamily: "'SF Mono', 'Menlo', 'Monaco', monospace",
              fontSize: "12px",
              color: "rgba(255,255,255,0.85)",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "5px",
              padding: "1px 7px",
              border: "1px solid rgba(255,255,255,0.10)",
              letterSpacing: "0.02em",
              fontVariantNumeric: "tabular-nums",
              minWidth: "3.5ch",
              display: "inline-block",
              textAlign: "center",
            }}
          >
            {timeLeft}
          </span>
        )}
      </div>

      {/* Role Tooltip */}
      {showRoleTooltip && roleConfig && (
        <div
          style={{
            position: "fixed",
            top: roleBadgeRef.current ? roleBadgeRef.current.getBoundingClientRect().bottom + 8 : 0,
            right: 12,
            width: "320px",
            maxWidth: "calc(100vw - 24px)",
            background: "rgba(28, 28, 32, 0.95)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderRadius: "10px",
            border: "1px solid rgba(139,92,246,0.25)",
            padding: "16px",
            zIndex: 10000,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)",
            animation: "roleTooltipIn 0.15s ease-out",
          }}
        >
          {/* Role Title */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "rgba(196,181,253,0.95)",
              marginBottom: "8px",
              letterSpacing: "0.02em",
            }}
          >
            {(selectedFaction ? FACTION_PREFIX[selectedFaction] : "")} {roleConfig.label}
          </div>
          
          {/* Description */}
          <div
            style={{
              fontSize: "12px",
              lineHeight: "1.5",
              color: "rgba(255,255,255,0.65)",
              marginBottom: "12px",
            }}
          >
            {roleConfig.description}
          </div>
          
          {/* Goals Section */}
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(139,92,246,0.8)",
              marginBottom: "8px",
            }}
          >
            Your Objectives
          </div>
          
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {roleConfig.goals.map((goal, index) => (
              <li
                key={index}
                style={{
                  fontSize: "11px",
                  lineHeight: "1.5",
                  color: "rgba(255,255,255,0.55)",
                  paddingLeft: "14px",
                  position: "relative",
                  marginBottom: index < roleConfig.goals.length - 1 ? "6px" : 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "5px",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "rgba(139,92,246,0.6)",
                  }}
                />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
