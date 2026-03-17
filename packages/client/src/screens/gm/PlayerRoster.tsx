import { FACTIONS } from "@takeoff/shared";
import type { Faction } from "@takeoff/shared";
import { FACTION_COLORS } from "../../constants/factions.js";
import type { LobbyPlayer } from "../../stores/game.js";

export interface PlayerRosterProps {
  lobbyPlayers: LobbyPlayer[];
  phase: string | null;
  roomCode: string | null;
  gmDecisionStatus: string[];
  gmPlayerActivity: Record<string, string[]>;
}

export function PlayerRoster({ lobbyPlayers, phase, roomCode, gmDecisionStatus, gmPlayerActivity }: PlayerRosterProps) {
  return (
    <div>
      <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
        Players
      </div>

      {FACTIONS.map((faction) => {
        const factionPlayers = lobbyPlayers.filter((p) => p.faction === faction.id);
        if (factionPlayers.length === 0) return null;

        return (
          <div key={faction.id} style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: FACTION_COLORS[faction.id as Faction] ?? "#9ca3af",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              {faction.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {factionPlayers.map((p) => {
                const roleConfig = faction.roles.find((r) => r.id === p.role);
                const hasSubmitted = gmDecisionStatus.includes(p.id);
                const playerOpened = gmPlayerActivity[p.id] ?? [];
                const primaryApps = roleConfig?.primaryApps ?? [];
                const missedPrimary = primaryApps.length > 0 && !primaryApps.some((app) => playerOpened.includes(app));

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {/* Connection dot */}
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: p.connected ? "#34d399" : "#ef4444",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: "10px", color: "#6b7280" }}>{roleConfig?.label ?? p.role}</div>
                    </div>
                    {/* Primary app missed indicator */}
                    {phase !== "lobby" && phase !== "briefing" && missedPrimary && (
                      <span
                        title={`Hasn't checked: ${primaryApps.filter((a) => !playerOpened.includes(a)).join(", ")}`}
                        style={{ fontSize: "11px", flexShrink: 0, color: "#f59e0b" }}
                      >
                        ⚠
                      </span>
                    )}
                    {/* Decision submitted indicator */}
                    {phase === "decision" && (
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: hasSubmitted ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)",
                          color: hasSubmitted ? "#34d399" : "#6b7280",
                          flexShrink: 0,
                        }}
                      >
                        {hasSubmitted ? "✓" : "…"}
                      </div>
                    )}
                    {/* Dev: open player view in new tab */}
                    {import.meta.env.DEV && p.role && (
                      <a
                        href={`/?dev=1&code=${roomCode}&faction=${faction.id}&role=${p.role}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${roleConfig?.label ?? p.role} view in new tab`}
                        style={{
                          fontSize: "10px",
                          color: "#6b7280",
                          textDecoration: "none",
                          flexShrink: 0,
                          padding: "1px 4px",
                          borderRadius: "3px",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#e5e7eb"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                      >
                        view
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
