import type { AppId, GameRoom, Role, StateVariables } from "@takeoff/shared";

export interface ActivityPenalty {
  app: AppId;
  variable: keyof StateVariables;
  delta: number;
}

export const PRIMARY_APP_PENALTIES: Partial<Record<Role, ActivityPenalty>> = {
  ob_cto:         { app: "wandb",     variable: "obCapability",        delta: -3 },
  ob_safety:      { app: "slack",     variable: "alignmentConfidence",  delta: -3 },
  ob_ceo:         { app: "email",     variable: "obInternalTrust",      delta: -3 },
  prom_scientist: { app: "wandb",     variable: "promCapability",       delta: -3 },
  china_director: { app: "compute",   variable: "chinaCapability",      delta: -3 },
  ext_journalist: { app: "signal",    variable: "publicAwareness",      delta: -3 },
  ext_nsa:        { app: "briefing",  variable: "intlCooperation",      delta: -3 },
  ext_vc:         { app: "bloomberg", variable: "economicDisruption",   delta: 2  },
};

export interface AppliedActivityPenalty {
  playerId: string;
  role: Role;
  primaryApp: AppId;
  variable: keyof StateVariables;
  delta: number;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function boundsForPenaltyVar(variable: keyof StateVariables): [number, number] {
  switch (variable) {
    case "obCapability":
    case "promCapability":
    case "chinaCapability":
    case "alignmentConfidence":
    case "publicAwareness":
    case "intlCooperation":
    case "economicDisruption":
    case "obInternalTrust":
      return [0, 100];
    default:
      return [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  }
}

export function applyActivityPenalties(
  room: Pick<GameRoom, "players" | "state" | "playerActivity" | "round">,
): AppliedActivityPenalty[] {
  if (!room.playerActivity) return [];
  if (room.round === 0) return []; // tutorial round: no penalties

  const applied: AppliedActivityPenalty[] = [];
  for (const [playerId, player] of Object.entries(room.players)) {
    if (!player.role) continue;
    const penalty = PRIMARY_APP_PENALTIES[player.role];
    if (!penalty) continue;
    const opened = room.playerActivity[playerId] ?? [];
    if (opened.includes(penalty.app)) continue;

    const [min, max] = boundsForPenaltyVar(penalty.variable);
    const current = room.state[penalty.variable] as number;
    (room.state[penalty.variable] as number) = clamp(current + penalty.delta, min, max);

    applied.push({
      playerId,
      role: player.role,
      primaryApp: penalty.app,
      variable: penalty.variable,
      delta: penalty.delta,
    });
  }

  return applied;
}

