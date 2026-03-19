/**
 * Micro-action tracking module.
 *
 * Records per-player, per-round action counts and applies diminishing-return
 * state effects silently. Players never see explicit numbers — the system
 * accumulates 'basis point' effects alongside bigger faction decisions.
 *
 * Diminishing returns: effectiveDelta = baseDelta / actionCount (1/n formula)
 * where actionCount is the Nth time this player has done this action type this round.
 */

import type { GameRoom, StateVariables } from "@takeoff/shared";
import { clampState } from "@takeoff/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MicroActionType = "tweet" | "slack" | "signal_dm";

export interface TweetContext {
  type: "tweet";
  content: string;
}

export type MicroActionContext = TweetContext;

// ── Keyword sets for tweet topic detection ────────────────────────────────────

const SAFETY_KEYWORDS = ["safety", "alignment", "risk", "danger", "doom", "existential", "misalignment", "control", "shutdown", "kill switch"];
const CAPABILITY_KEYWORDS = ["capability", "breakthrough", "AGI", "superintelligent", "progress", "advance", "frontier", "agent", "scaling"];
const ECONOMY_KEYWORDS = ["funding", "market", "investment", "stocks", "jobs", "disruption", "economy", "layoffs", "billion", "valuation"];

const BASE_DELTA = 2;

// ── Internal helpers ──────────────────────────────────────────────────────────

function detectTweetTopic(content: string): "safety" | "capability" | "economy" | null {
  const lower = content.toLowerCase();
  if (SAFETY_KEYWORDS.some((kw) => lower.includes(kw))) return "safety";
  if (CAPABILITY_KEYWORDS.some((kw) => lower.includes(kw))) return "capability";
  if (ECONOMY_KEYWORDS.some((kw) => lower.includes(kw))) return "economy";
  return null;
}

function computeTweetEffects(content: string, delta: number): Partial<StateVariables> {
  const effects: Partial<StateVariables> = {
    publicAwareness: delta,
  };

  const topic = detectTweetTopic(content);
  switch (topic) {
    case "safety":
      effects.regulatoryPressure = delta;
      effects.publicSentiment = delta * (Math.random() > 0.5 ? 1 : -1);
      break;
    case "capability":
      effects.economicDisruption = Math.round(delta / 2);
      effects.publicSentiment = delta * (Math.random() > 0.5 ? 1 : -1);
      break;
    case "economy":
      effects.marketIndex = Math.round(delta) * (Math.random() > 0.5 ? 1 : -1);
      effects.economicDisruption = Math.round(delta / 2);
      break;
    case null:
      // only publicAwareness — already set above
      break;
  }

  return effects;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get the current action count for a player+type combo.
 * Returns 0 if player has never performed this action type this round.
 */
export function getActionCount(room: GameRoom, socketId: string, actionType: string): number {
  return room.microActionCounts?.[socketId]?.[actionType] ?? 0;
}

/**
 * Record a micro-action and apply diminished state effects.
 * Returns the effective multiplier used (for logging/testing).
 *
 * Diminishing returns: effectiveDelta = baseDelta / actionCount
 * where actionCount is the Nth time this player has done this action type this round.
 */
export function applyMicroAction(
  room: GameRoom,
  socketId: string,
  actionType: MicroActionType,
  context: MicroActionContext,
): { multiplier: number; effects: Partial<StateVariables> } {
  // Ensure nested structure exists
  if (!room.microActionCounts) room.microActionCounts = {};
  if (!room.microActionCounts[socketId]) room.microActionCounts[socketId] = {};

  // Increment action count (post-increment: count is now the Nth action)
  const prevCount = room.microActionCounts[socketId][actionType] ?? 0;
  const actionCount = prevCount + 1;
  room.microActionCounts[socketId][actionType] = actionCount;

  const multiplier = 1 / actionCount;
  const effectiveDelta = BASE_DELTA * multiplier;

  // Compute effects based on action type
  let effects: Partial<StateVariables> = {};
  if (context.type === "tweet") {
    effects = computeTweetEffects(context.content, effectiveDelta);
  }

  // Apply effects to room state
  for (const key of Object.keys(effects) as (keyof StateVariables)[]) {
    const delta = effects[key] as number;
    if (typeof delta === "number" && typeof room.state[key] === "number") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (room.state as any)[key] += delta;
    }
  }

  // Clamp all state variables to valid ranges
  clampState(room.state);

  return { multiplier, effects };
}

/**
 * Reset all micro-action counts for a room (call on round advance).
 */
export function resetMicroActionCounts(room: GameRoom): void {
  room.microActionCounts = {};
}
