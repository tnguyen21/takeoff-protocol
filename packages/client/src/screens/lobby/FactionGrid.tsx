import { useGameStore } from "../../stores/game.js";
import { FACTIONS } from "@takeoff/shared";
import type { Faction } from "@takeoff/shared";
import type { Role } from "@takeoff/shared";
import { FACTION_IDENTITIES, FACTION_SHORT_NAMES, FACTION_THEMES } from "../../constants/factions.js";

interface RoleButtonProps {
  faction: Faction;
  roleId: Role;
  roleLabel: string;
  roleDescription: string;
  isLeader: boolean;
  isOptional: boolean;
  isSelected: boolean;
  isTaken: boolean;
  takenByName?: string;
  isGM: boolean;
  onSelect: () => void;
}

function RoleButton({
  faction,
  roleLabel,
  roleDescription,
  isLeader,
  isOptional,
  isSelected,
  isTaken,
  takenByName,
  isGM,
  onSelect,
}: RoleButtonProps) {
  const theme = FACTION_THEMES[faction];

  return (
    <button
      onClick={onSelect}
      disabled={isGM || isTaken}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
        isSelected
          ? theme.roleSelectedBg
          : isTaken
            ? "bg-neutral-800/30 cursor-not-allowed"
            : isGM
              ? "bg-neutral-800/20 cursor-default"
              : `bg-neutral-800/40 ${theme.roleHover} cursor-pointer`
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {isLeader && (
          <span className={`text-xs ${isSelected ? "text-white/80" : theme.badgeText}`} title="Faction leader">
            ★
          </span>
        )}
        <span className={`font-medium text-xs ${isTaken ? "text-neutral-600" : isSelected ? "text-white" : "text-neutral-200"}`}>
          {roleLabel}
        </span>
        {isOptional && !isTaken && (
          <span className={`text-xs ml-auto ${isSelected ? "text-white/50" : "text-neutral-600"}`}>opt</span>
        )}
      </div>
      {isTaken ? (
        <p className="text-neutral-600 text-xs">taken by {takenByName}</p>
      ) : (
        <p className={`text-xs leading-relaxed ${isSelected ? "text-white/70" : "text-neutral-500"}`}>
          {roleDescription}
        </p>
      )}
    </button>
  );
}

export function FactionGrid() {
  const { lobbyPlayers, selectedFaction, selectedRole, isGM, playerId, selectRole } = useGameStore();

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {FACTIONS.map((faction) => {
        const theme = FACTION_THEMES[faction.id];
        const factionPlayers = lobbyPlayers.filter((p) => p.faction === faction.id);
        const isFactionSelected = selectedFaction === faction.id;

        return (
          <div
            key={faction.id}
            className={`rounded-xl border flex flex-col transition-colors ${
              isFactionSelected && !isGM
                ? `${theme.cardBorderSelected} ${theme.cardBg}`
                : `${theme.cardBorder} bg-neutral-900/40`
            }`}
          >
            {/* Faction header */}
            <div className="p-4 border-b border-neutral-800/60">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-bold text-base ${theme.headerText}`}>
                  {FACTION_SHORT_NAMES[faction.id]}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${theme.countBg} ${theme.countText}`}>
                  {factionPlayers.length}/{faction.maxPlayers}
                </span>
              </div>
              <p className="text-neutral-500 text-xs leading-relaxed">
                {FACTION_IDENTITIES[faction.id]}
              </p>
            </div>

            {/* Roles */}
            <div className="p-2 flex flex-col gap-1 flex-1">
              {faction.roles.map((role) => {
                const takenBy = lobbyPlayers.find(
                  (p) => p.faction === faction.id && p.role === role.id && p.id !== playerId,
                );
                const isTaken = !!takenBy;
                const isSelected = selectedFaction === faction.id && selectedRole === role.id;

                return (
                  <RoleButton
                    key={role.id}
                    faction={faction.id}
                    roleId={role.id}
                    roleLabel={role.label}
                    roleDescription={role.description}
                    isLeader={role.isLeader}
                    isOptional={!!role.optional}
                    isSelected={isSelected}
                    isTaken={isTaken}
                    takenByName={takenBy?.name}
                    isGM={isGM}
                    onSelect={async () => {
                      if (!isGM && !isTaken) {
                        await selectRole(faction.id, role.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
