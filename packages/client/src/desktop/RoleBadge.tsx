import { useGameStore } from "../stores/game.js";
import { FACTIONS } from "@takeoff/shared";

const FACTION_PREFIX: Record<string, string> = {
  openbrain: "OB",
  prometheus: "Prom",
  china: "China",
  external: "Ext",
};

function getRoleDisplayName(faction: string | null, role: string | null): string | null {
  if (!faction || !role) return null;
  const factionConfig = FACTIONS.find((f) => f.id === faction);
  if (!factionConfig) return null;
  const roleConfig = factionConfig.roles.find((r) => r.id === role);
  if (!roleConfig) return null;
  const prefix = FACTION_PREFIX[faction];
  return prefix ? `${prefix} ${roleConfig.label}` : roleConfig.label;
}

export function RoleBadge() {
  const { selectedFaction, selectedRole, isGM, phase } = useGameStore();

  // Only show during active gameplay, not in lobby, ending, or for GM
  if (isGM || !phase || phase === "lobby") return null;

  const displayName = getRoleDisplayName(selectedFaction, selectedRole);
  if (!displayName) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "4px",
        right: "12px",
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        height: "20px",
        padding: "0 8px",
        borderRadius: "4px",
        background: "rgba(139,92,246,0.12)",
        border: "1px solid rgba(139,92,246,0.28)",
        color: "rgba(196,181,253,0.85)",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.03em",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {displayName}
    </div>
  );
}
