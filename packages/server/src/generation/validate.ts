import type { ContentItem, Faction, FogVariable, Role, StateVariables } from "@takeoff/shared";
import { computeFogView } from "@takeoff/shared";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ── Content Validation ────────────────────────────────────────────────────────

/**
 * Validate that a set of ContentItems for one faction meets the classification
 * budget and per-item structural requirements.
 *
 * Budget (per faction per round):
 *   - 3-5 critical
 *   - 5-10 context
 *   - 1-2 red-herring
 *   - Total: 15-30
 *
 * If targetRound is provided, every item must have round === targetRound.
 */
export function validateContent(
  items: ContentItem[],
  faction: Faction,
  targetRound?: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Total count
  if (items.length < 15) {
    errors.push(`${faction}: only ${items.length} total items, need ≥15`);
  }
  if (items.length > 30) {
    errors.push(`${faction}: ${items.length} total items, max 30`);
  }

  // Classification budget
  const critical = items.filter((i) => i.classification === "critical").length;
  const context = items.filter((i) => i.classification === "context").length;
  const redHerring = items.filter((i) => i.classification === "red-herring").length;

  if (critical < 3) errors.push(`${faction}: only ${critical} critical items, need ≥3`);
  if (critical > 5) errors.push(`${faction}: ${critical} critical items, max 5`);
  if (context < 5) errors.push(`${faction}: only ${context} context items, need ≥5`);
  if (context > 10) errors.push(`${faction}: ${context} context items, max 10`);
  if (redHerring < 1) errors.push(`${faction}: only ${redHerring} red-herring items, need ≥1`);
  if (redHerring > 2) errors.push(`${faction}: ${redHerring} red-herring items, max 2`);

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
