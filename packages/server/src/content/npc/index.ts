import type { NpcTrigger } from "@takeoff/shared";
import { ROUND1_NPC_TRIGGERS } from "./round1.js";
import { ROUND2_NPC_TRIGGERS } from "./round2.js";

export { ROUND1_NPC_TRIGGERS } from "./round1.js";
export { ROUND2_NPC_TRIGGERS } from "./round2.js";

/** All NPC triggers indexed by round number. */
const NPC_TRIGGERS_BY_ROUND: Record<number, NpcTrigger[]> = {
  1: ROUND1_NPC_TRIGGERS,
  2: ROUND2_NPC_TRIGGERS,
};

/**
 * Returns NPC triggers for the given round, or an empty array if none are defined.
 *
 * INV: Every returned trigger has a non-empty `id`, `npcId`, and `content`.
 */
export function getNpcTriggersForRound(round: number): NpcTrigger[] {
  return NPC_TRIGGERS_BY_ROUND[round] ?? [];
}
