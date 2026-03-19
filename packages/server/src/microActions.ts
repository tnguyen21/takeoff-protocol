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

import type { Faction, GameRoom, StateVariables } from "@takeoff/shared";
import { clampState } from "@takeoff/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MicroActionType = "tweet" | "slack" | "signal_dm";

export interface TweetContext {
  type: "tweet";
  content: string;
}

export interface SlackContext {
  type: "slack";
  channel: string;  // e.g. '#research', '#alignment'
  faction: Faction; // sender's faction — determines which variables are affected
}

export interface SignalDmContext {
  type: "signal_dm";
  senderFaction: Faction;
  recipientFaction: Faction;
  senderRole: string;
  recipientRole: string;
}

export type MicroActionContext = TweetContext | SlackContext | SignalDmContext;

// ── Keyword sets for tweet topic detection ────────────────────────────────────

const SAFETY_KEYWORDS = ["safety", "alignment", "risk", "danger", "doom", "existential", "misalignment", "control", "shutdown", "kill switch"];
const CAPABILITY_KEYWORDS = ["capability", "breakthrough", "AGI", "superintelligent", "progress", "advance", "frontier", "agent", "scaling"];
const ECONOMY_KEYWORDS = ["funding", "market", "investment", "stocks", "jobs", "disruption", "economy", "layoffs", "billion", "valuation"];

const BASE_DELTA = 2;

// ── Internal helpers: tweet ───────────────────────────────────────────────────

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

// ── Internal helpers: slack ───────────────────────────────────────────────────

/** Base delta for a single Slack message. Smaller than tweet (more frequent). */
const SLACK_BASE_DELTA = 1;

interface SlackEffect {
  key: keyof StateVariables;
  multiplier: number; // positive = increase, negative = decrease
}

/**
 * Map a (channel, faction) pair to the state variable that is affected.
 * Returns null if there is no defined effect (skip silently).
 *
 * Negative multiplier: obBurnRate/promBurnRate decrease because active ops
 * communication signals efficiency. Higher burn rate is bad.
 */
function getSlackEffect(channel: string, faction: Faction): SlackEffect | null {
  switch (channel) {
    case "#general":
      switch (faction) {
        case "openbrain":   return { key: "obMorale",          multiplier: 1 };
        case "prometheus":  return { key: "promMorale",        multiplier: 1 };
        case "china":       return { key: "ccpPatience",       multiplier: 1 };
        case "external":    return { key: "intlCooperation",   multiplier: 0.5 };
      }
      break;

    case "#research":
      switch (faction) {
        case "openbrain":   return { key: "obCapability",      multiplier: 0.5 };
        case "prometheus":  return { key: "promCapability",    multiplier: 0.5 };
        case "china":       return { key: "chinaCapability",   multiplier: 0.5 };
        case "external":    return { key: "publicAwareness",   multiplier: 0.5 };
      }
      break;

    case "#alignment":
      // All factions: alignment confidence +delta/2
      return { key: "alignmentConfidence", multiplier: 0.5 };

    case "#announcements":
      switch (faction) {
        case "openbrain":   return { key: "obInternalTrust",    multiplier: 0.5 };
        case "prometheus":  return { key: "promBoardConfidence", multiplier: 0.5 };
        case "china":       return { key: "ccpPatience",         multiplier: 0.5 };
        case "external":    return { key: "intlCooperation",     multiplier: 0.5 };
      }
      break;

    case "#ops":
      switch (faction) {
        case "openbrain":   return { key: "obBurnRate",            multiplier: -0.5 };
        case "prometheus":  return { key: "promBurnRate",          multiplier: -0.5 };
        case "china":       return { key: "cdzComputeUtilization", multiplier: 0.5 };
        case "external":    return null; // no effect
      }
      break;

    case "#random":
      switch (faction) {
        case "openbrain":   return { key: "obMorale",   multiplier: 1 / 3 };
        case "prometheus":  return { key: "promMorale", multiplier: 1 / 3 };
        case "china":       return null;
        case "external":    return null;
      }
      break;

    case "#safety":
      switch (faction) {
        case "openbrain":   return { key: "alignmentConfidence", multiplier: 0.5 };
        case "prometheus":  return { key: "alignmentConfidence", multiplier: 0.5 };
        case "china":       return null;
        case "external":    return { key: "regulatoryPressure",  multiplier: 0.5 };
      }
      break;
  }
  return null; // unknown channel or unhandled combination
}

function computeSlackEffects(context: SlackContext, effectiveDelta: number): Partial<StateVariables> {
  const effect = getSlackEffect(context.channel, context.faction);
  if (!effect) return {};
  return { [effect.key]: effectiveDelta * effect.multiplier } as Partial<StateVariables>;
}

// ── Internal helpers: signal_dm ───────────────────────────────────────────────

/** Base delta for a cross-faction Signal DM. Cross-faction communication is impactful. */
const SIGNAL_DM_BASE_DELTA = 1.5;

function computeSignalDmEffects(context: SignalDmContext, effectiveDelta: number): Partial<StateVariables> {
  // Same-faction DMs produce no effect — callers should guard before calling,
  // but defensive check here preserves the invariant.
  if (context.senderFaction === context.recipientFaction) return {};

  const effects: Partial<StateVariables> = {
    intlCooperation: effectiveDelta / 2,
  };

  // Journalist involvement: talking to or from a journalist = potential leak source
  if (context.senderRole === "ext_journalist" || context.recipientRole === "ext_journalist") {
    effects.whistleblowerPressure = effectiveDelta / 2;
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
 *
 * DR key namespacing:
 *   tweet:  uses actionType string ("tweet")
 *   slack:  uses "slack:#channel" so each channel has its own DR counter
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

  // DR key: tweets use actionType; slack uses channel-namespaced key; signal_dm shares one counter
  const drKey = context.type === "slack" ? `slack:${context.channel}` : actionType;

  // Same-faction Signal DMs: no effect, no count consumed (invariant: guard BEFORE increment)
  if (context.type === "signal_dm" && context.senderFaction === context.recipientFaction) {
    return { multiplier: 0, effects: {} };
  }

  // Increment action count (post-increment: count is now the Nth action)
  const prevCount = room.microActionCounts[socketId][drKey] ?? 0;
  const actionCount = prevCount + 1;
  room.microActionCounts[socketId][drKey] = actionCount;

  const multiplier = 1 / actionCount;

  // Compute effects based on context type
  let effects: Partial<StateVariables> = {};
  if (context.type === "tweet") {
    const effectiveDelta = BASE_DELTA * multiplier;
    effects = computeTweetEffects(context.content, effectiveDelta);
  } else if (context.type === "slack") {
    const effectiveDelta = SLACK_BASE_DELTA * multiplier;
    effects = computeSlackEffects(context, effectiveDelta);
  } else if (context.type === "signal_dm") {
    const effectiveDelta = SIGNAL_DM_BASE_DELTA * multiplier;
    effects = computeSignalDmEffects(context, effectiveDelta);
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
