/**
 * Dev-only bot autoplay for solo playtesting.
 *
 * All exports are gated on NODE_ENV !== "production".
 * Bots are synthetic Player objects added to room.players with id prefix "__bot_".
 * They write decisions directly to room state — no socket events.
 */

import type { Server } from "socket.io";
import type { Faction, GameRoom, Player, Role } from "@takeoff/shared";
import { FACTIONS } from "@takeoff/shared";
import { getActiveDecisions } from "./game.js";

export interface DevBotOptions {
  mode: "all_roles" | "minimum_table";
  seed?: number;
  submitJitterMs?: [number, number]; // default [200, 2200]
  leaderExtraDelayMs?: number; // default 500
}

/** Simple mulberry32 seeded PRNG — returns a function that produces floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick a random option id from the array.
 * If seed is provided, uses a seeded PRNG (deterministic).
 * Returns "" on empty array.
 */
export function pickRandomOption(options: { id: string }[], seed?: number): string {
  if (options.length === 0) return "";
  const random = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);
  const idx = Math.floor(random() * options.length);
  return options[idx].id;
}

/**
 * Add synthetic bot players to room.players for all unoccupied roles.
 *
 * INV: Must not be called in production.
 * INV: Human player role is never overwritten.
 * INV: Bot ids have format __bot_{factionId}_{roleId}.
 */
export function seedBotsForRoom(room: GameRoom, humanPlayerId: string, opts: DevBotOptions): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("[dev-bot] seedBotsForRoom called in production — dev-only function");
  }

  const humanPlayer = room.players[humanPlayerId];
  const humanRole = humanPlayer?.role;

  let botCount = 0;

  for (const faction of FACTIONS) {
    for (const roleConfig of faction.roles) {
      // Skip the human player's role
      if (roleConfig.id === humanRole) continue;

      // In minimum_table mode, skip optional roles
      if (opts.mode === "minimum_table" && roleConfig.optional) continue;

      const botId = `__bot_${faction.id}_${roleConfig.id}`;
      const bot: Player = {
        id: botId,
        name: `BOT ${roleConfig.label}`,
        faction: faction.id as Faction,
        role: roleConfig.id as Role,
        isLeader: roleConfig.isLeader,
        connected: true,
      };

      room.players[botId] = bot;
      botCount++;
    }
  }

  console.log(`[dev-bot] seeded ${botCount} bots (mode=${opts.mode})`);
}

/**
 * Schedule random decision submissions for all bot players in the room.
 * Writes directly to room.decisions / room.teamVotes / room.teamDecisions.
 * No-ops silently if no bots present or round === 0.
 */
export function scheduleBotDecisionSubmissions(io: Server, room: GameRoom, opts: DevBotOptions): void {
  // Silently no-op if no bots in room
  const botIds = Object.keys(room.players).filter((id) => id.startsWith("__bot_"));
  if (botIds.length === 0) return;

  // Tutorial round has no decisions
  if (room.round === 0) return;

  const roundDecisions = getActiveDecisions(room, room.round);
  if (!roundDecisions) return;

  const jitterMin = opts.submitJitterMs?.[0] ?? 200;
  const jitterMax = opts.submitJitterMs?.[1] ?? 2200;
  const leaderExtraDelay = opts.leaderExtraDelayMs ?? 500;

  for (const botId of botIds) {
    const bot = room.players[botId];
    if (!bot.faction || !bot.role) continue;

    const baseDelay = jitterMin + Math.random() * (jitterMax - jitterMin);
    const delay = bot.isLeader ? baseDelay + leaderExtraDelay : baseDelay;

    setTimeout(() => {
      // Guard: room may have advanced out of decision phase before timer fires
      if (room.phase !== "decision") return;

      // Individual decision
      const individualDecision = roundDecisions.individual.find((d) => d.role === bot.role);
      if (individualDecision && individualDecision.options.length > 0) {
        const chosenOptionId = pickRandomOption(individualDecision.options, opts.seed);
        room.decisions[botId] = chosenOptionId;
        console.log(`[dev-bot] submitted individual role=${bot.role} option=${chosenOptionId}`);
      }

      // Team vote
      const teamDecision = roundDecisions.team.find((d) => d.faction === bot.faction);
      if (teamDecision && teamDecision.options.length > 0) {
        const chosenOptionId = pickRandomOption(teamDecision.options, opts.seed);
        room.teamVotes[bot.faction!] ??= {};
        room.teamVotes[bot.faction!][botId] = chosenOptionId;
        console.log(`[dev-bot] voted faction=${bot.faction} option=${chosenOptionId}`);
      }

      // Leader lock: leader also sets the team decision
      if (bot.isLeader && teamDecision && teamDecision.options.length > 0) {
        const chosenOptionId = pickRandomOption(teamDecision.options, opts.seed);
        room.teamDecisions[bot.faction!] = chosenOptionId;
        console.log(`[dev-bot] leader-locked faction=${bot.faction} option=${chosenOptionId}`);
      }
    }, delay);
  }
}
