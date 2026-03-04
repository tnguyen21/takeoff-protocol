import type { ContentItem, Faction, FogVariable, NpcTrigger, Role, StateVariables } from "@takeoff/shared";
import { computeFogView } from "@takeoff/shared";
import { getNpcPersona } from "../content/npcPersonas.js";

// ── ValidationResult ──────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ── Content Validation ────────────────────────────────────────────────────────

/**
 * Compute classification budget scaled by app count.
 * For appCount <= 2 (or undefined), returns baseline budgets.
 * For appCount > 2, scales by Math.ceil(appCount / 2).
 * Breadcrumb is always 1-4 regardless of scale.
 */
export function contentBudget(appCount?: number): {
  minTotal: number;
  maxTotal: number;
  minCritical: number;
  maxCritical: number;
  minContext: number;
  maxContext: number;
  minRedHerring: number;
  maxRedHerring: number;
} {
  const scale = appCount !== undefined && appCount > 2 ? Math.ceil(appCount / 2) : 1;
  return {
    minTotal: 15 * scale,
    maxTotal: 30 * scale,
    minCritical: 3 * scale,
    maxCritical: 5 * scale,
    minContext: 5 * scale,
    maxContext: 10 * scale,
    minRedHerring: 1 * scale,
    maxRedHerring: 2 * scale,
  };
}

/**
 * Validate that a set of ContentItems for one faction meets the classification
 * budget and per-item structural requirements.
 *
 * Budget (per faction per round, for 2 apps — scales with appCount):
 *   - 3-5 critical
 *   - 5-10 context
 *   - 1-2 red-herring
 *   - Total: 15-30
 *
 * If targetRound is provided, every item must have round === targetRound.
 * If appCount > 2, budgets scale by Math.ceil(appCount / 2).
 */
export function validateContent(
  items: ContentItem[],
  faction: Faction,
  targetRound?: number,
  appCount?: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { minTotal, maxTotal, minCritical, maxCritical, minContext, maxContext, minRedHerring, maxRedHerring } =
    contentBudget(appCount);

  // Total count
  if (items.length < minTotal) {
    errors.push(`${faction}: only ${items.length} total items, need ≥${minTotal}`);
  }
  if (items.length > maxTotal) {
    errors.push(`${faction}: ${items.length} total items, max ${maxTotal}`);
  }

  // Classification budget
  const critical = items.filter((i) => i.classification === "critical").length;
  const context = items.filter((i) => i.classification === "context").length;
  const redHerring = items.filter((i) => i.classification === "red-herring").length;

  if (critical < minCritical) errors.push(`${faction}: only ${critical} critical items, need ≥${minCritical}`);
  if (critical > maxCritical) errors.push(`${faction}: ${critical} critical items, max ${maxCritical}`);
  if (context < minContext) errors.push(`${faction}: only ${context} context items, need ≥${minContext}`);
  if (context > maxContext) errors.push(`${faction}: ${context} context items, max ${maxContext}`);
  if (redHerring < minRedHerring)
    errors.push(`${faction}: only ${redHerring} red-herring items, need ≥${minRedHerring}`);
  if (redHerring > maxRedHerring) errors.push(`${faction}: ${redHerring} red-herring items, max ${maxRedHerring}`);

  // Per-item invariants
  for (const item of items) {
    if (!item.body || item.body.trim() === "") {
      errors.push(`item ${item.id}: empty body`);
    }
    if (!item.type) {
      errors.push(`item ${item.id}: missing type`);
    }
    if (targetRound !== undefined && item.round !== targetRound) {
      errors.push(`item ${item.id}: round ${item.round} does not match target round ${targetRound}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Fog-Safe Validation ───────────────────────────────────────────────────────

// Placeholder roles used to compute fog view (fog accuracy depends only on faction)
const FACTION_DEFAULT_ROLES: Record<Faction, Role> = {
  openbrain: "ob_ceo",
  prometheus: "prom_ceo",
  china: "china_director",
  external: "ext_nsa",
};

/**
 * Split a camelCase identifier into lowercase word tokens of length > 2.
 * e.g. "chinaWeightTheftProgress" → ["china", "weight", "theft", "progress"]
 */
function camelKeywords(name: string): string[] {
  return name
    .split(/(?=[A-Z])/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2);
}

/**
 * Heuristic fog-safety check. Scans each item's body text for exact numeric
 * values of state variables that are hidden from the target faction.
 *
 * A value is "suspicious" if it appears in the body AND at least one keyword
 * derived from the variable name appears within 80 characters of the number.
 *
 * Returns warnings (not errors) — this is a heuristic, not a hard block.
 */
export function validateFogSafety(
  items: ContentItem[],
  state: StateVariables,
  faction: Faction,
): ValidationResult {
  const warnings: string[] = [];

  const role = FACTION_DEFAULT_ROLES[faction];
  // Round 1 is representative — fog accuracy does not depend on round
  const fogView = computeFogView(state, faction, role, 1);

  // Collect hidden variables with their true values and keyword lists
  const hiddenVars: Array<{ key: string; value: number; keywords: string[] }> = [];
  for (const [key, fogVar] of Object.entries(fogView) as [string, FogVariable][]) {
    if (fogVar.accuracy === "hidden") {
      const trueValue = (state as unknown as Record<string, number>)[key];
      // Skip zero values — "0" appears everywhere in text and generates too many false positives
      if (trueValue !== 0 && trueValue !== undefined) {
        hiddenVars.push({ key, value: trueValue, keywords: camelKeywords(key) });
      }
    }
  }

  if (hiddenVars.length === 0) return { valid: true, errors: [], warnings };

  for (const item of items) {
    const lowerBody = item.body.toLowerCase();

    for (const { key, value, keywords } of hiddenVars) {
      const valueStr = String(value);
      let searchFrom = 0;
      let foundLeak = false;

      while (!foundLeak) {
        const pos = lowerBody.indexOf(valueStr, searchFrom);
        if (pos === -1) break;

        // Check if any keyword appears within 80 chars of the number
        const windowStart = Math.max(0, pos - 80);
        const windowEnd = Math.min(lowerBody.length, pos + valueStr.length + 80);
        const window = lowerBody.slice(windowStart, windowEnd);

        if (keywords.some((kw) => window.includes(kw))) {
          warnings.push(
            `item ${item.id}: possible fog leak — value ${value} of hidden variable "${key}" appears near related keyword`,
          );
          foundLeak = true;
        }

        searchFrom = pos + 1;
      }
    }
  }

  return { valid: true, errors: [], warnings };
}

// ── NPC Trigger Validation ────────────────────────────────────────────────────

const VALID_FACTIONS_SET: ReadonlySet<string> = new Set<Faction>([
  "openbrain", "prometheus", "china", "external",
]);

/**
 * Validate a set of generated NpcTriggers.
 *
 * Invariants:
 * - Each trigger must have non-empty content
 * - Each trigger must have valid npcId (known persona)
 * - Each trigger must have valid target faction (if specified)
 * - Exactly one of condition or schedule per trigger
 * - Total 4-8 triggers per round
 */
export function validateNpcTriggers(triggers: NpcTrigger[]): ValidationResult {
  const errors: string[] = [];

  if (triggers.length < 4) {
    errors.push(`only ${triggers.length} NPC triggers, need ≥4`);
  }
  if (triggers.length > 8) {
    errors.push(`${triggers.length} NPC triggers, max 8`);
  }

  for (const trigger of triggers) {
    if (!trigger.content || trigger.content.trim() === "") {
      errors.push(`trigger ${trigger.id}: empty content`);
    }
    if (!getNpcPersona(trigger.npcId)) {
      errors.push(`trigger ${trigger.id}: unknown npcId '${trigger.npcId}'`);
    }
    if (trigger.target.faction !== undefined && !VALID_FACTIONS_SET.has(trigger.target.faction)) {
      errors.push(`trigger ${trigger.id}: invalid faction '${trigger.target.faction}'`);
    }
    const hasCondition = trigger.condition !== undefined;
    const hasSchedule = trigger.schedule !== undefined;
    if (hasCondition && hasSchedule) {
      errors.push(`trigger ${trigger.id}: has both condition and schedule — must have exactly one`);
    }
    if (!hasCondition && !hasSchedule) {
      errors.push(`trigger ${trigger.id}: has neither condition nor schedule — must have exactly one`);
    }
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_FACTIONS: Faction[] = ["openbrain", "prometheus", "china", "external"];

const COMMON_MIN_WORDS = 150;
const COMMON_MAX_WORDS = 300;
const VARIANT_MIN_WORDS = 40;
const VARIANT_MAX_WORDS = 80;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── validateBriefing ──────────────────────────────────────────────────────────

/**
 * Validates a generated briefing object.
 *
 * Invariants:
 * - common must be 150–300 words
 * - factionVariants must have entries for all 4 factions
 * - each faction variant must be 40–80 words
 * - no empty strings anywhere
 */
export function validateBriefing(briefing: {
  common: string;
  factionVariants: Record<Faction, string>;
}): ValidationResult {
  const errors: string[] = [];

  // ── common ────────────────────────────────────────────────────────────────
  if (!briefing.common || briefing.common.trim() === "") {
    errors.push("common text is empty");
  } else {
    const count = wordCount(briefing.common);
    if (count < COMMON_MIN_WORDS) {
      errors.push(`common text has ${count} words (minimum ${COMMON_MIN_WORDS})`);
    }
    if (count > COMMON_MAX_WORDS) {
      errors.push(`common text has ${count} words (maximum ${COMMON_MAX_WORDS})`);
    }
  }

  // ── factionVariants ───────────────────────────────────────────────────────
  if (!briefing.factionVariants || typeof briefing.factionVariants !== "object") {
    errors.push("factionVariants is missing");
    return { valid: false, errors, warnings: [] };
  }

  for (const faction of ALL_FACTIONS) {
    const variant = briefing.factionVariants[faction];
    if (variant === undefined || variant === null) {
      errors.push(`factionVariants missing entry for '${faction}'`);
      continue;
    }
    if (variant.trim() === "") {
      errors.push(`factionVariants['${faction}'] is empty`);
      continue;
    }
    const count = wordCount(variant);
    if (count < VARIANT_MIN_WORDS) {
      errors.push(`factionVariants['${faction}'] has ${count} words (minimum ${VARIANT_MIN_WORDS})`);
    }
    if (count > VARIANT_MAX_WORDS) {
      errors.push(`factionVariants['${faction}'] has ${count} words (maximum ${VARIANT_MAX_WORDS})`);
    }
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}
