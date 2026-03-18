import { FACTIONS } from "@takeoff/shared";
import type { Faction } from "@takeoff/shared";
import { FACTION_COLORS } from "../../constants/factions.js";
import type { LobbyPlayer } from "../../stores/game.js";

interface PlayerRosterProps {
  lobbyPlayers: LobbyPlayer[];
  phase: string | null;
  roomCode: string | null;
  gmDecisionStatus: string[];
  gmPlayerActivity: Record<string, string[]>;
}

export function PlayerRoster({ lobbyPlayers, phase, roomCode, gmDecisionStatus, gmPlayerActivity }: PlayerRosterProps) {
  return (
    <div>
      <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
        Players
      </div>

      {FACTIONS.map((faction) => {
        const factionPlayers = lobbyPlayers.filter((p) => p.faction === faction.id);
        if (factionPlayers.length === 0) return null;

        return (
          <div key={faction.id} className="mb-4">
            <div
              className="text-[11px] font-bold mb-1.5 uppercase tracking-[0.07em]"
              style={{ color: FACTION_COLORS[faction.id as Faction] ?? "#9ca3af" }}
            >
              {faction.name}
            </div>
            <div className="flex flex-col gap-1">
              {factionPlayers.map((p) => {
                const roleConfig = faction.roles.find((r) => r.id === p.role);
                const hasSubmitted = gmDecisionStatus.includes(p.id);
                const playerOpened = gmPlayerActivity[p.id] ?? [];
                const primaryApps = roleConfig?.primaryApps ?? [];
                const missedPrimary = primaryApps.length > 0 && !primaryApps.some((app) => playerOpened.includes(app));

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-white/[0.03] border border-border-subtle"
                  >
                    {/* Connection dot */}
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: p.connected ? "var(--color-status-success)" : "var(--color-status-danger)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">{p.name}</div>
                      <div className="text-[10px] text-text-muted">{roleConfig?.label ?? p.role}</div>
                    </div>
                    {/* Primary app missed indicator */}
                    {phase !== "lobby" && phase !== "briefing" && missedPrimary && (
                      <span
                        title={`Hasn't checked: ${primaryApps.filter((a) => !playerOpened.includes(a)).join(", ")}`}
                        className="text-[11px] shrink-0 text-status-warning"
                      >
                        ⚠
                      </span>
                    )}
                    {/* Decision submitted indicator */}
                    {phase === "decision" && (
                      <div
                        className="text-[10px] font-semibold py-px px-[5px] rounded shrink-0"
                        style={{
                          background: hasSubmitted ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)",
                          color: hasSubmitted ? "var(--color-status-success)" : "var(--color-text-muted)",
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
                        className="text-[10px] text-text-muted no-underline shrink-0 py-px px-1 rounded-[3px] border border-white/[0.08] hover:text-text-primary hover:border-white/20"
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
