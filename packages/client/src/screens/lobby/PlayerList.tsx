import { useGameStore } from "../../stores/game.js";
import { FACTIONS } from "@takeoff/shared";
import { FACTION_SHORT_NAMES, FACTION_THEMES } from "../../constants/factions.js";

export function PlayerList() {
  const { lobbyPlayers } = useGameStore();

  return (
    <div className="border-t border-neutral-800/60 pt-5 mb-6">
      <h3 className="text-neutral-500 text-xs uppercase tracking-widest mb-3">
        Connected Players ({lobbyPlayers.length})
      </h3>
      {lobbyPlayers.length === 0 ? (
        <p className="text-neutral-700 text-sm italic">No players yet — share the room code.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lobbyPlayers.map((p) => {
            const theme = p.faction ? FACTION_THEMES[p.faction] : null;
            const factionRole = p.faction && p.role
              ? FACTIONS.find((f) => f.id === p.faction)?.roles.find((r) => r.id === p.role)
              : null;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                  theme ? `${theme.cardBorder} ${theme.cardBg}` : "border-neutral-800 bg-neutral-900/40"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.connected ? (theme?.dot ?? "bg-neutral-400") : "bg-neutral-700"}`} />
                <span className="text-neutral-200 font-medium">{p.name}</span>
                {factionRole && theme && (
                  <span className={`text-xs ${theme.badgeText}`}>
                    {factionRole.label}
                  </span>
                )}
                {!factionRole && p.faction && theme && (
                  <span className={`text-xs ${theme.badgeText}`}>
                    {FACTION_SHORT_NAMES[p.faction]}
                  </span>
                )}
                {!p.faction && (
                  <span className="text-xs text-neutral-600">no role selected</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
