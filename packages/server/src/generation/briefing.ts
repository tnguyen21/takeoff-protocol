import type { Faction } from "@takeoff/shared";
import type { GenerationOptions, GenerationProvider } from "./provider.js";
import { retryWithBackoff } from "./provider.js";
import type { GenerationContext } from "./context.js";
import { BRIEFING_SYSTEM_PROMPT } from "./prompts/system.js";
import { ROUND_ARCS } from "./prompts/arcs.js";
import { validateBriefing } from "./validate.js";

// ── Types ─────────────────────────────────────────────────────────────────────

type BriefingOutput = {
  common: string;
  factionVariants: Record<Faction, string>;
};

// ── JSON Schema for structured output ────────────────────────────────────────

const BRIEFING_SCHEMA = {
  type: "object",
  properties: {
    common: { type: "string" },
    factionVariants: {
      type: "object",
      properties: {
        openbrain: { type: "string" },
        prometheus: { type: "string" },
        china: { type: "string" },
        external: { type: "string" },
      },
      required: ["openbrain", "prometheus", "china", "external"],
      additionalProperties: false,
    },
  },
  required: ["common", "factionVariants"],
  additionalProperties: false,
} as const;

// ── Prompt construction ───────────────────────────────────────────────────────

function buildBriefingUserPrompt(context: GenerationContext, validationErrors?: string[]): string {
  const parts: string[] = [];

  // Layer 2: Story bible context
  if (context.storyBible) {
    parts.push(`## Story Bible\n${JSON.stringify(context.storyBible, null, 2)}`);
  } else {
    parts.push(`## Story Bible\nNo story bible initialized yet — this is round ${context.targetRound}. Generate a briefing grounded in the canonical round ${context.targetRound} scenario.`);
  }

  // Layer 3: Round-specific instructions
  const arc = ROUND_ARCS[context.targetRound];
  if (arc) {
    parts.push(`## Round ${context.targetRound} Arc\nTitle: ${arc.title}\nEra: ${arc.era}\nNarrative Beat: ${arc.narrativeBeat}\nEscalation: ${arc.escalation}\nKey Tensions:\n${arc.keyTensions.map((t) => `- ${t}`).join("\n")}`);
  }

  // Last round decisions (from history)
  if (context.history.length > 0) {
    const last = context.history[context.history.length - 1];
    parts.push(`## Last Round (Round ${last.round}) Decisions\nTeam decisions: ${JSON.stringify(last.teamDecisions)}\nIndividual decisions: ${JSON.stringify(last.decisions)}`);
  }

  // Fired thresholds (notable events that have occurred)
  if (context.firedThresholds.length > 0) {
    parts.push(`## Events That Have Fired\n${context.firedThresholds.map((t) => `- ${t}`).join("\n")}`);
  }

  // Player roster (for faction-specific voice)
  if (context.players.length > 0) {
    const byFaction: Partial<Record<Faction, string[]>> = {};
    for (const p of context.players) {
      if (p.faction === null || p.role === null) continue;
      (byFaction[p.faction] ??= []).push(`${p.name} (${p.role})`);
    }
    const rosterLines = (Object.entries(byFaction) as [Faction, string[]][])
      .map(([f, names]) => `${f}: ${names.join(", ")}`)
      .join("\n");
    parts.push(`## Player Roster\n${rosterLines}`);
  }

  // Retry context: inject previous validation errors so the model knows what to fix
  if (validationErrors && validationErrors.length > 0) {
    parts.push(`## Validation Errors from Previous Attempt\nYour previous output failed validation. Fix these issues:\n${validationErrors.map((e) => `- ${e}`).join("\n")}\n\nEnsure common text is 100–500 words and each faction variant is 30–150 words.`);
  }

  parts.push(`## Task\nGenerate the round ${context.targetRound} briefing. Return structured JSON only.`);

  return parts.join("\n\n");
}

// ── generateBriefing ──────────────────────────────────────────────────────────

/**
 * Calls the provider with a 3-layer prompt (system + story bible + round state)
 * and returns the structured briefing output.
 *
 * Does NOT retry or validate — callers should use generateBriefingWithRetry.
 */
async function generateBriefing(
  provider: GenerationProvider,
  context: GenerationContext,
  validationErrors?: string[],
  options?: GenerationOptions,
): Promise<BriefingOutput> {
  const systemPrompt = BRIEFING_SYSTEM_PROMPT;
  const userPrompt = buildBriefingUserPrompt(context, validationErrors);

  return provider.generate<BriefingOutput>({
    systemPrompt,
    userPrompt,
    schema: BRIEFING_SCHEMA,
    options,
    cacheSystem: true,
  });
}

// ── generateBriefingWithRetry ─────────────────────────────────────────────────

// Retry tuning for transient errors (429, timeout, API errors) within each
// logical attempt. Validation-feedback retries remain capped at 2 attempts.
const TRANSIENT_RETRY_OPTS = { maxAttempts: 4, baseDelayMs: 1000, maxDelayMs: 30000 } as const;

/**
 * Generates a briefing with retry-once on validation failure.
 *
 * - First attempt: generate + validate (with up to 4 transient-error retries)
 * - On validation failure: retry once with error feedback (up to 4 transient retries)
 * - On second failure or provider error: return null (caller falls back to pre-authored)
 *
 * INV: Never throws. Returns null on any failure.
 * INV: Transient errors (429, timeout, API) get up to 4 retries with backoff.
 * INV: Validation errors trigger at most 1 feedback retry (2 logical attempts total).
 */
export async function generateBriefingWithRetry(
  provider: GenerationProvider,
  context: GenerationContext,
  options?: GenerationOptions,
): Promise<BriefingOutput | null> {
  let firstResult: BriefingOutput;

  // ── First attempt (transient errors retried with backoff) ─────────────────
  try {
    firstResult = await retryWithBackoff(
      () => generateBriefing(provider, context, undefined, options),
      TRANSIENT_RETRY_OPTS,
    );
  } catch (err) {
    console.error(`[briefing] Attempt 1 threw:`, String(err));
    return null;
  }

  const firstValidation = validateBriefing(firstResult);
  if (firstValidation.valid) {
    return firstResult;
  }

  console.error(`[briefing] Attempt 1 validation failed:`, firstValidation.errors);

  // ── Retry once with error feedback ────────────────────────────────────────
  let retryResult: BriefingOutput;
  try {
    retryResult = await retryWithBackoff(
      () => generateBriefing(provider, context, firstValidation.errors, options),
      TRANSIENT_RETRY_OPTS,
    );
  } catch (err) {
    console.error(`[briefing] Attempt 2 threw:`, String(err));
    return null;
  }

  const retryValidation = validateBriefing(retryResult);
  if (!retryValidation.valid) {
    console.error(`[briefing] Attempt 2 validation failed:`, retryValidation.errors);
  }
  return retryValidation.valid ? retryResult : null;
}
