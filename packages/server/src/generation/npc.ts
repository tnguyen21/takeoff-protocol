import type { Faction, NpcTrigger } from "@takeoff/shared";
import type { GenerationOptions, GenerationProvider } from "./provider.js";
import type { GenerationContext } from "./context.js";
import { NPC_SYSTEM_PROMPT } from "./prompts/system.js";
import { ROUND_ARCS } from "./prompts/arcs.js";
import { FACTION_VOICES } from "./prompts/voices.js";
import { getNpcPersona, NPC_PERSONAS } from "../content/npcPersonas.js";
import { validateNpcTriggers } from "./validate.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_FACTIONS: ReadonlySet<string> = new Set<Faction>([
  "openbrain", "prometheus", "china", "external",
]);

// ── Raw LLM output type ───────────────────────────────────────────────────────

interface RawNpcTriggerItem {
  id?: unknown;
  npcId?: unknown;
  content?: unknown;
  target?: unknown;
  condition?: unknown;
  schedule?: unknown;
}

interface RawNpcOutput {
  items?: RawNpcTriggerItem[];
}

// ── JSON Schema for structured output ─────────────────────────────────────────

const NPC_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          npcId: { type: "string" },
          content: { type: "string" },
          target: {
            type: "object",
            properties: {
              faction: { type: "string" },
              role: { type: "string" },
            },
          },
          condition: {
            type: "object",
            properties: {
              variable: { type: "string" },
              operator: { type: "string", enum: ["gte", "lte", "eq"] },
              value: { type: "number" },
            },
            required: ["variable", "operator", "value"],
          },
          schedule: {
            type: "object",
            properties: {
              round: { type: "number" },
              phase: { type: "string" },
            },
            required: ["round", "phase"],
          },
        },
        required: ["id", "npcId", "content", "target"],
      },
    },
  },
  required: ["items"],
} as const;

// ── Prompt construction ────────────────────────────────────────────────────────

function buildNpcUserPrompt(context: GenerationContext, validationErrors?: string[]): string {
  const parts: string[] = [];

  // Story bible
  if (context.storyBible) {
    parts.push(`## Story Bible\n${JSON.stringify(context.storyBible, null, 2)}`);
  }

  // Round arc
  const arc = ROUND_ARCS[context.targetRound];
  if (arc) {
    parts.push(
      `## Round ${context.targetRound} Arc\nTitle: ${arc.title}\nEra: ${arc.era}\nNarrative Beat: ${arc.narrativeBeat}\nEscalation: ${arc.escalation}\nKey Tensions:\n${arc.keyTensions.map((t) => `- ${t}`).join("\n")}`,
    );
  }

  // Current state
  parts.push(`## Current Game State\n${JSON.stringify(context.currentState, null, 2)}`);

  // History
  if (context.history.length > 0) {
    const last = context.history[context.history.length - 1];
    parts.push(
      `## Last Round (Round ${last.round}) Decisions\nTeam decisions: ${JSON.stringify(last.teamDecisions)}\nIndividual decisions: ${JSON.stringify(last.decisions)}`,
    );
  }

  // Fired thresholds
  if (context.firedThresholds.length > 0) {
    parts.push(`## Events That Have Fired\n${context.firedThresholds.map((t) => `- ${t}`).join("\n")}`);
  }

  // Faction voice guides
  const voiceLines = (Object.entries(FACTION_VOICES) as [Faction, string][])
    .map(([f, v]) => `${f}: ${v}`)
    .join("\n\n");
  parts.push(`## Faction Voices\n${voiceLines}`);

  // Valid persona IDs
  const personaLines = NPC_PERSONAS.map(
    (p) => `- ${p.id}: ${p.name} (${p.subtitle}) — factions: ${p.factions.join(", ")}`,
  ).join("\n");
  parts.push(`## Valid NPC Persona IDs\n${personaLines}`);

  // Player roster
  if (context.players.length > 0) {
    const byFaction: Partial<Record<Faction, string[]>> = {};
    for (const p of context.players) {
      if (p.faction === null || p.role === null) continue;
      (byFaction[p.faction as Faction] ??= []).push(`${p.name} (${p.role})`);
    }
    const rosterLines = (Object.entries(byFaction) as [Faction, string[]][])
      .map(([f, names]) => `${f}: ${names.join(", ")}`)
      .join("\n");
    parts.push(`## Player Roster\n${rosterLines}`);
  }

  // Retry feedback
  if (validationErrors && validationErrors.length > 0) {
    parts.push(
      `## Validation Errors from Previous Attempt\nYour previous output failed validation. Fix these issues:\n${validationErrors.map((e) => `- ${e}`).join("\n")}\n\nEnsure 4-8 total triggers, all IDs start with "gen-npc-", and exactly one of condition/schedule per trigger.`,
    );
  }

  parts.push(
    `## Task\nGenerate NPC messages for round ${context.targetRound}. Return structured JSON only. All schedule.round values must be ${context.targetRound}.`,
  );

  return parts.join("\n\n");
}

// ── Post-processing ────────────────────────────────────────────────────────────

/**
 * Post-process raw LLM output into validated NpcTrigger[].
 * Strips triggers with invalid fields rather than failing entirely.
 */
export function postProcessNpcTriggers(raw: RawNpcOutput, targetRound: number): NpcTrigger[] {
  if (!raw || !Array.isArray(raw.items)) return [];

  const result: NpcTrigger[] = [];

  for (const item of raw.items) {
    // id must start with "gen-npc-"
    if (typeof item.id !== "string" || !item.id.startsWith("gen-npc-")) continue;

    // npcId must be a known persona
    if (typeof item.npcId !== "string" || !getNpcPersona(item.npcId)) continue;

    // content must be non-empty string
    if (typeof item.content !== "string" || item.content.trim() === "") continue;

    // target must exist with valid faction
    const rawTarget = item.target as Record<string, unknown> | undefined;
    if (!rawTarget || typeof rawTarget !== "object") continue;

    const faction = rawTarget.faction as string | undefined;
    const role = rawTarget.role as string | undefined;

    if (faction !== undefined && !VALID_FACTIONS.has(faction)) continue;

    // Exactly one of condition or schedule
    const hasCondition = item.condition !== undefined && item.condition !== null;
    const hasSchedule = item.schedule !== undefined && item.schedule !== null;
    if (hasCondition === hasSchedule) continue; // both or neither — skip

    const trigger: NpcTrigger = {
      id: item.id,
      npcId: item.npcId,
      content: item.content.trim(),
      target: { faction: faction as Faction | undefined, role: role as import("@takeoff/shared").Role | undefined },
    };

    if (hasCondition) {
      const cond = item.condition as Record<string, unknown>;
      if (
        typeof cond.variable !== "string" ||
        !["gte", "lte", "eq"].includes(cond.operator as string) ||
        typeof cond.value !== "number"
      ) {
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trigger.condition = cond as any;
    }

    if (hasSchedule) {
      const sched = item.schedule as Record<string, unknown>;
      if (typeof sched.round !== "number" || typeof sched.phase !== "string") continue;
      // Force round to targetRound
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trigger.schedule = { round: targetRound, phase: sched.phase as any };
    }

    result.push(trigger);
  }

  return result;
}

// ── generateNpcMessages ────────────────────────────────────────────────────────

/**
 * Calls the provider and returns post-processed NpcTrigger[].
 * Does NOT retry or validate — callers should use generateNpcMessagesWithRetry.
 */
async function generateNpcMessages(
  provider: GenerationProvider,
  context: GenerationContext,
  validationErrors?: string[],
  options?: GenerationOptions,
): Promise<NpcTrigger[]> {
  const systemPrompt = NPC_SYSTEM_PROMPT;
  const userPrompt = buildNpcUserPrompt(context, validationErrors);

  const raw = await provider.generate<RawNpcOutput>({
    systemPrompt,
    userPrompt,
    schema: NPC_SCHEMA,
    options,
  });

  return postProcessNpcTriggers(raw, context.targetRound);
}

// ── generateNpcMessagesWithRetry ───────────────────────────────────────────────

/**
 * Generates NPC triggers with retry-once on validation failure.
 *
 * - First attempt: generate + post-process + validate
 * - On validation failure: retry once, feeding errors back into the prompt
 * - On second failure or provider error: return null
 *
 * INV: Never throws. Returns null on any failure.
 */
export async function generateNpcMessagesWithRetry(
  provider: GenerationProvider,
  context: GenerationContext,
  options?: GenerationOptions,
): Promise<NpcTrigger[] | null> {
  let firstResult: NpcTrigger[];

  // ── First attempt ─────────────────────────────────────────────────────────
  try {
    firstResult = await generateNpcMessages(provider, context, undefined, options);
  } catch {
    return null;
  }

  const firstValidation = validateNpcTriggers(firstResult);
  if (firstValidation.valid) {
    return firstResult;
  }

  // ── Retry once with error feedback ────────────────────────────────────────
  let retryResult: NpcTrigger[];
  try {
    retryResult = await generateNpcMessages(provider, context, firstValidation.errors, options);
  } catch {
    return null;
  }

  const retryValidation = validateNpcTriggers(retryResult);
  if (retryValidation.valid) {
    return retryResult;
  }

  return null;
}
