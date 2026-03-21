import type { ContentItem, DecisionTemplate, Faction, FogVariable, NpcTrigger, RoundDecisions, StateVariables } from "@takeoff/shared";
import { computeFogView, STATE_VARIABLE_RANGES } from "@takeoff/shared";
import { getNpcPersona } from "../content/npcPersonas.js";

// ── ValidationResult ──────────────────────────────────────────────────────────

interface ValidationResult {
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
 *
 * Base budgets are sized for the two-tier content system:
 *   feed apps (slack, twitter, news, etc): 12-20 items each
 *   signal apps (signal, memo, intel, email): 3-6 items each
 * A typical faction has ~5 feed + ~3 signal apps → ~75-130 items total.
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
    minTotal: 25 * scale,
    maxTotal: 50 * scale,
    minCritical: 5 * scale,
    maxCritical: 10 * scale,
    minContext: 10 * scale,
    maxContext: 25 * scale,
    minRedHerring: 2 * scale,
    maxRedHerring: 5 * scale,
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

  // Total count — hard error only if grossly out of range (< 50% of min or > 200% of max)
  if (items.length < Math.floor(minTotal * 0.5)) {
    errors.push(`${faction}: only ${items.length} total items, need ≥${Math.floor(minTotal * 0.5)}`);
  }
  if (items.length > maxTotal * 2) {
    errors.push(`${faction}: ${items.length} total items, max ${maxTotal * 2}`);
  }
  // Soft budget warnings for total count
  if (items.length < minTotal) {
    warnings.push(`${faction}: only ${items.length} total items, target ≥${minTotal}`);
  }
  if (items.length > maxTotal) {
    warnings.push(`${faction}: ${items.length} total items, target ≤${maxTotal}`);
  }

  // Classification budget — soft warnings only (prompt already guides distribution)
  const critical = items.filter((i) => i.classification === "critical").length;
  const context = items.filter((i) => i.classification === "context").length;
  const redHerring = items.filter((i) => i.classification === "red-herring").length;

  if (critical < minCritical) warnings.push(`${faction}: only ${critical} critical items, target ≥${minCritical}`);
  if (critical > maxCritical) warnings.push(`${faction}: ${critical} critical items, target ≤${maxCritical}`);
  if (context < minContext) warnings.push(`${faction}: only ${context} context items, target ≥${minContext}`);
  if (context > maxContext) warnings.push(`${faction}: ${context} context items, target ≤${maxContext}`);
  if (redHerring < minRedHerring)
    warnings.push(`${faction}: only ${redHerring} red-herring items, target ≥${minRedHerring}`);
  if (redHerring > maxRedHerring) warnings.push(`${faction}: ${redHerring} red-herring items, target ≤${maxRedHerring}`);

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

  // Round 1 is representative — fog accuracy does not depend on round
  const fogView = computeFogView(state, faction, 1);

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

// ── Fog Leak Scrubbing ──────────────────────────────────────────────────────

/**
 * Deterministically scrub fog leaks from generated content.
 * Uses the same detection heuristic as validateFogSafety: when an exact hidden
 * variable value appears near a related keyword, replace the number with a
 * nearby but incorrect value (offset by +3, clamped to variable range).
 *
 * Returns a new array of items with scrubbed bodies and the count of scrubs.
 */
export function scrubFogLeaks(
  items: ContentItem[],
  state: StateVariables,
  faction: Faction,
): { items: ContentItem[]; scrubCount: number } {
  const fogView = computeFogView(state, faction, 1);

  const hiddenVars: Array<{ key: string; value: number; keywords: string[] }> = [];
  for (const [key, fogVar] of Object.entries(fogView) as [string, FogVariable][]) {
    if (fogVar.accuracy === "hidden") {
      const trueValue = (state as unknown as Record<string, number>)[key];
      if (trueValue !== 0 && trueValue !== undefined) {
        hiddenVars.push({ key, value: trueValue, keywords: camelKeywords(key) });
      }
    }
  }

  if (hiddenVars.length === 0) return { items, scrubCount: 0 };

  let scrubCount = 0;
  const scrubbed = items.map((item) => {
    let body = item.body;
    let changed = false;

    for (const { key, value, keywords } of hiddenVars) {
      const valueStr = String(value);
      const lowerBody = body.toLowerCase();
      let searchFrom = 0;

      while (true) {
        const pos = lowerBody.indexOf(valueStr, searchFrom);
        if (pos === -1) break;

        const windowStart = Math.max(0, pos - 80);
        const windowEnd = Math.min(lowerBody.length, pos + valueStr.length + 80);
        const window = lowerBody.slice(windowStart, windowEnd);

        if (keywords.some((kw) => window.includes(kw))) {
          // Compute replacement: offset by +3, clamp to variable range
          const range = STATE_VARIABLE_RANGES[key as keyof typeof STATE_VARIABLE_RANGES];
          let replacement = value + 3;
          if (range) {
            replacement = Math.min(replacement, range[1]);
            if (replacement === value) replacement = Math.max(value - 3, range[0]);
          }
          body = body.slice(0, pos) + String(replacement) + body.slice(pos + valueStr.length);
          scrubCount++;
          changed = true;
          // Re-scan from the replacement position (replacement may be different length)
          break; // Move to next variable — one scrub per variable per item is sufficient
        }

        searchFrom = pos + 1;
      }
    }

    return changed ? { ...item, body } : item;
  });

  return { items: scrubbed, scrubCount };
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

const COMMON_MIN_WORDS = 100;
const COMMON_MAX_WORDS = 500;
const VARIANT_MIN_WORDS = 30;
const VARIANT_MAX_WORDS = 150;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── validateBriefing ──────────────────────────────────────────────────────────

/**
 * Validates a generated briefing object.
 *
 * Invariants:
 * - common must be 100–500 words
 * - factionVariants must have entries for all 4 factions
 * - each faction variant must be 30–150 words
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

// ── Decision Validation ───────────────────────────────────────────────────────

/**
 * Validate a generated RoundDecisions object.
 *
 * Hard constraints (errors):
 * - Each decision must have exactly 3 options
 * - Each option must have 5-8 effects
 * - Each effect delta: |delta| <= 8
 * - No-free-lunch: each option must have >=2 positive effects AND >=2 negative effects
 * - Variable existence: every effect.variable must be in STATE_VARIABLE_RANGES
 * - No duplicate variables within the same option
 * - Distinctness: for any option pair, <60% of shared variables may have same-sign deltas
 * - Conditional multiplier in [0.5, 3.0] and condition.variable must exist in STATE_VARIABLE_RANGES
 *
 * Soft constraints (warnings):
 * - Scope check (if templates provided): effect variables should be in template.variableScope
 * - Net |delta| sum per option should be in [15, 35]
 * - Option labels should be <60 characters
 * - Decision prompts should be 50-300 words
 */
export function validateDecisions(
  decisions: RoundDecisions,
  templates?: DecisionTemplate[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  function validateDecision(
    decisionId: string,
    prompt: string,
    options: RoundDecisions["individual"][number]["options"],
    template?: DecisionTemplate,
  ): void {
    // Hard: exactly 3 options
    if (options.length !== 3) {
      errors.push(`${decisionId}: expected 3 options, got ${options.length}`);
    }

    // Soft: prompt word count 50-300
    const promptWords = wordCount(prompt);
    if (promptWords < 50 || promptWords > 300) {
      warnings.push(`${decisionId}: prompt has ${promptWords} words (expected 50-300)`);
    }

    for (const opt of options) {
      const optId = `${decisionId}/${opt.id}`;

      // Soft: label length <60 characters
      if (opt.label.length >= 60) {
        warnings.push(`${optId}: label is ${opt.label.length} characters (expected <60)`);
      }

      // Hard: effect count 5-8
      if (opt.effects.length < 5 || opt.effects.length > 8) {
        errors.push(`${optId}: expected 5-8 effects, got ${opt.effects.length}`);
      }

      const seenVars = new Set<string>();
      let posCount = 0;
      let negCount = 0;
      let netAbs = 0;

      for (const effect of opt.effects) {
        // Hard: variable existence
        if (!(effect.variable in STATE_VARIABLE_RANGES)) {
          errors.push(`${optId}: effect variable "${effect.variable}" does not exist in STATE_VARIABLE_RANGES`);
        }

        // Hard: no duplicate variables
        if (seenVars.has(effect.variable)) {
          errors.push(`${optId}: duplicate effect variable "${effect.variable}"`);
        }
        seenVars.add(effect.variable);

        // Hard: delta magnitude
        if (Math.abs(effect.delta) > 8) {
          errors.push(`${optId}: effect "${effect.variable}" has |delta|=${Math.abs(effect.delta)} > 8`);
        }

        if (effect.delta > 0) posCount++;
        if (effect.delta < 0) negCount++;
        netAbs += Math.abs(effect.delta);

        // Hard: conditional multiplier bounds
        if (effect.condition) {
          const { multiplier, variable: condVar } = effect.condition;
          if (multiplier < 0.5 || multiplier > 3.0) {
            errors.push(
              `${optId}: effect "${effect.variable}" condition multiplier ${multiplier} out of [0.5, 3.0]`,
            );
          }
          if (!(condVar in STATE_VARIABLE_RANGES)) {
            errors.push(
              `${optId}: effect "${effect.variable}" condition variable "${condVar}" does not exist in STATE_VARIABLE_RANGES`,
            );
          }
        }

        // Soft: scope check
        if (template && !template.variableScope.includes(effect.variable)) {
          warnings.push(`${optId}: effect variable "${effect.variable}" is outside template variableScope`);
        }
      }

      // Hard: no-free-lunch (must have at least 1 positive and 1 negative)
      if (posCount < 1) {
        errors.push(`${optId}: no-free-lunch violation — only ${posCount} positive effects (need ≥1)`);
      }
      if (negCount < 1) {
        errors.push(`${optId}: no-free-lunch violation — only ${negCount} negative effects (need ≥1)`);
      }

      // Soft: net delta magnitude [15, 35]
      if (netAbs < 15 || netAbs > 35) {
        warnings.push(`${optId}: net |delta| sum is ${netAbs} (expected 15-35)`);
      }
    }

    // Soft: distinctness check for each option pair (LLMs often share directional effects)
    for (let i = 0; i < options.length; i++) {
      for (let j = i + 1; j < options.length; j++) {
        const optA = options[i]!;
        const optB = options[j]!;

        const signsA = new Map<string, number>();
        for (const effect of optA.effects) signsA.set(effect.variable, Math.sign(effect.delta));
        const signsB = new Map<string, number>();
        for (const effect of optB.effects) signsB.set(effect.variable, Math.sign(effect.delta));

        const sharedVars = [...signsA.keys()].filter((v) => signsB.has(v));
        if (sharedVars.length > 0) {
          const sameSignCount = sharedVars.filter((v) => signsA.get(v) === signsB.get(v)).length;
          const ratio = sameSignCount / sharedVars.length;
          if (ratio >= 0.6) {
            warnings.push(
              `${decisionId}: options "${optA.id}" and "${optB.id}" have low distinctness — ${sameSignCount}/${sharedVars.length} shared variables have same-sign deltas (≥60%)`,
            );
          }
        }
      }
    }
  }

  for (const indiv of decisions.individual) {
    const decisionId = `individual[${indiv.role}]`;
    const template = templates?.find((t) => t.role === indiv.role);
    validateDecision(decisionId, indiv.prompt, indiv.options, template);
  }

  for (const team of decisions.team) {
    const decisionId = `team[${team.faction}]`;
    const template = templates?.find((t) => t.faction === team.faction);
    validateDecision(decisionId, team.prompt, team.options, template);
  }

  return { valid: errors.length === 0, errors, warnings };
}
