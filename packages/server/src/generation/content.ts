import type { AppContent, AppId, ContentItem, ContentItemType, Faction } from "@takeoff/shared";
import type { GenerationContext } from "./context.js";
import type { GenerationProvider } from "./provider.js";
import { APP_VOICES, CONTENT_SYSTEM_PROMPT, FACTION_VOICES } from "./prompts/index.js";
import { contentBudget, validateContent } from "./validate.js";

// ── App → ContentItemType mapping ─────────────────────────────────────────────

export const APP_TYPE_MAP: Partial<Record<AppId, ContentItemType>> = {
  news: "headline",
  twitter: "tweet",
  slack: "message",
  email: "document",
  memo: "memo",
  signal: "message",
  intel: "document",
  bloomberg: "row",
  arxiv: "document",
};

// ── Schema Builder ────────────────────────────────────────────────────────────

/**
 * Build the Anthropic tool input_schema for generating ContentItem[] for one app.
 * Wrapped in an object so the provider's tool_use mode can return a structured response.
 */
/** Per-type required fields beyond the base set (id, type, round, timestamp, classification). */
const TYPE_REQUIRED_FIELDS: Record<ContentItemType, string[]> = {
  message: ["sender", "body"],
  document: ["subject", "body"],
  memo: ["subject", "body"],
  headline: ["body"],
  tweet: ["body"],
  row: ["body"],
  chart: ["body"],
};

function buildContentSchema(type: ContentItemType): object {
  const extraRequired = TYPE_REQUIRED_FIELDS[type] ?? ["body"];
  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: `Generated content items of type "${type}"`,
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique ID — MUST start with 'gen-', e.g. 'gen-r3-openbrain-news-001'",
            },
            type: { type: "string", enum: [type] },
            round: { type: "number" },
            sender: { type: "string" },
            channel: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
            timestamp: {
              type: "string",
              description: "ISO 8601 timestamp matching the in-game era",
            },
            classification: {
              type: "string",
              enum: ["critical", "context", "red-herring", "breadcrumb"],
            },
          },
          required: ["id", "type", "round", "timestamp", "classification", ...extraRequired],
        },
      },
    },
    required: ["items"],
  };
}

// ── Prompt Builder ────────────────────────────────────────────────────────────

function buildUserPrompt(
  context: GenerationContext,
  faction: Faction,
  app: AppId,
  type: ContentItemType,
  retryFeedback?: string,
  appCount?: number,
): string {
  const { storyBible, roundArc, currentState, history, firedThresholds, publications, targetRound } = context;
  const parts: string[] = [];

  // Layer 2: Story Bible
  if (storyBible) {
    parts.push(`## STORY BIBLE\n${JSON.stringify(storyBible, null, 2)}`);
  } else {
    parts.push("## STORY BIBLE\n(Not yet available — this is round 1 or generation started before the bible was initialized.)");
  }

  // Layer 3: Round-specific instructions
  parts.push(
    `## ROUND ${targetRound} — "${roundArc.title}" — ${roundArc.era}

Narrative beat: ${roundArc.narrativeBeat}

Escalation from prior round: ${roundArc.escalation}

Key tensions to advance:
${roundArc.keyTensions.map((t) => `- ${t}`).join("\n")}`,
  );

  // Prior decisions
  if (history.length > 0) {
    const last = history[history.length - 1];
    parts.push(
      `## PRIOR ROUND DECISIONS (Round ${last.round})
Team decisions: ${JSON.stringify(last.teamDecisions, null, 2)}
Individual decisions: ${JSON.stringify(last.decisions, null, 2)}`,
    );
  }

  // Threshold events
  parts.push(
    firedThresholds.length > 0
      ? `## FIRED THRESHOLD EVENTS\n${firedThresholds.join("\n")}`
      : "## FIRED THRESHOLD EVENTS\nNone",
  );

  // Publications
  if (publications.length > 0) {
    const pubLines = publications
      .map((p) => `- [${p.type}] "${p.title}" published by ${p.publishedBy}: ${p.content.slice(0, 200)}`)
      .join("\n");
    parts.push(`## PUBLICATIONS\n${pubLines}`);
  } else {
    parts.push("## PUBLICATIONS\nNone");
  }

  // Current game state
  parts.push(`## CURRENT STATE SNAPSHOT\n${JSON.stringify(currentState, null, 2)}`);

  // Faction voice guide
  parts.push(
    `## TARGET FACTION: ${faction.toUpperCase()}
Voice guide: ${FACTION_VOICES[faction]}`,
  );

  // Per-app structural hints
  const APP_STRUCTURAL_HINTS: Partial<Record<AppId, string>> = {
    slack: `Each item MUST include "sender" (display name, e.g. "@alice") and "channel" (e.g. "#research", "#general").`,
    email: `Each item MUST include "sender" (email address or display name) and "subject" (email subject line).`,
    memo: `Each item MUST include "subject" (memo title/header, e.g. "RE: Safety Review Q3").`,
    signal: `Each item MUST include "sender" (handle or name). Keep messages short and paranoid.`,
    intel: `Each item MUST include "subject" (report title). Use ICD 203 format with classification headers.`,
    bloomberg: `Use financial shorthand. Include ticker symbols, basis points, source attribution ("Sources say").`,
    arxiv: `Each item MUST include "subject" (paper title with authors/institution, e.g. "arXiv: 'Scaling Laws for X' — Smith et al., MIT (2027)") and "body" (abstract-style summary). Use realistic author names and institutions. Mix of AI safety, ML, policy, and adjacent CS topics.`,
  };

  // App voice guide and generation instructions
  const appVoice = APP_VOICES[app];
  const structuralHint = APP_STRUCTURAL_HINTS[app];
  const budget = contentBudget(appCount);
  const numApps = appCount ?? 2;
  const perAppMin = Math.max(1, Math.round(budget.minTotal / numApps));
  const perAppMax = Math.max(1, Math.round(budget.maxTotal / numApps));
  const perAppCritical = Math.max(1, Math.round((budget.minCritical + budget.maxCritical) / 2 / numApps));
  const perAppContext = Math.max(1, Math.round((budget.minContext + budget.maxContext) / 2 / numApps));
  const perAppRedHerring = Math.max(0, Math.round((budget.minRedHerring + budget.maxRedHerring) / 2 / numApps));
  parts.push(
    `## TARGET APP: ${app.toUpperCase()}
Voice guide: ${appVoice ?? "Standard format."}
Content type: ${type}
${structuralHint ? `\nStructural requirements: ${structuralHint}` : ""}
Generate ${perAppMin}-${perAppMax} items for the "${app}" app for faction ${faction} in round ${targetRound}.
All items MUST have:
- type="${type}"
- round=${targetRound}
- id starting with "gen-" (e.g. "gen-r${targetRound}-${faction}-${app}-001")
- A non-empty body field

CONTENT BUDGET across all apps for this faction this round (faction totals):
- ${budget.minCritical}-${budget.maxCritical} items classified "critical"
- ${budget.minContext}-${budget.maxContext} items classified "context"
- ${budget.minRedHerring}-${budget.maxRedHerring} items classified "red-herring"
- 1-4 items classified "breadcrumb"

Per-app target for this app (~1/${numApps} of total):
- ~${perAppCritical} critical, ~${perAppContext} context, ~${perAppRedHerring} red-herring

For this app, distribute your classifications so the faction's total budget is met.

IMPORTANT: Never reveal exact values of hidden state variables. Reference observable consequences, not raw numbers.`,
  );

  // Retry feedback
  if (retryFeedback) {
    parts.push(
      `## VALIDATION FEEDBACK — PLEASE FIX THESE ISSUES
The previous generation attempt was rejected. Fix all of the following:
${retryFeedback}`,
    );
  }

  return parts.join("\n\n");
}

// ── Post-Processing ───────────────────────────────────────────────────────────

/** Ensure every item ID starts with "gen-". */
function ensureGenPrefix(items: ContentItem[]): ContentItem[] {
  return items.map((item) => ({
    ...item,
    id: item.id.startsWith("gen-") ? item.id : `gen-${item.id}`,
  }));
}

/** Force every item's round to the target round. */
function forceRound(items: ContentItem[], round: number): ContentItem[] {
  return items.map((item) => ({ ...item, round }));
}

/** Force every item's type to the expected type for the app. */
function forceType(items: ContentItem[], type: ContentItemType): ContentItem[] {
  return items.map((item) => ({ ...item, type }));
}

// ── Core Generator ────────────────────────────────────────────────────────────

/**
 * Generate ContentItem[] for the given apps (e.g. ["news", "twitter"]) for one faction.
 *
 * Makes one provider call per app. Post-processes items to enforce:
 * - id starts with "gen-"
 * - round matches context.targetRound
 * - type matches the app's expected ContentItemType
 * - condition is stripped (generated content is state-aware, not condition-gated)
 *
 * @param retryFeedback - When retrying after validation failure, pass the error strings so the
 *   LLM can correct them. Internal use by generateContentWithRetry.
 */
export async function generateContent(
  provider: GenerationProvider,
  context: GenerationContext,
  faction: Faction,
  apps: AppId[],
  retryFeedback?: string,
): Promise<AppContent[]> {
  const results: AppContent[] = [];

  for (const app of apps) {
    const type = APP_TYPE_MAP[app];
    if (!type) {
      throw new Error(`generateContent: app "${app}" is not supported (gamestate, sheets, compute, wandb, and similar apps do not generate content)`);
    }

    const raw = await provider.generate<{ items: ContentItem[] }>({
      systemPrompt: CONTENT_SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(context, faction, app, type, retryFeedback, apps.length),
      schema: buildContentSchema(type),
    });

    // Post-process: guard against malformed/missing items array
    let items: ContentItem[] = Array.isArray(raw?.items) ? raw.items : [];

    // Strip condition — generated content is state-aware, not condition-gated
    items = items.map(({ condition: _condition, ...rest }) => rest as ContentItem);

    // Enforce structural invariants
    items = ensureGenPrefix(items);
    items = forceRound(items, context.targetRound);
    items = forceType(items, type);

    results.push({ faction, app, items });
  }

  return results;
}

// ── Retry Wrapper ─────────────────────────────────────────────────────────────

/**
 * Attempt content generation once. If validation fails, retry once with error
 * feedback injected into the prompt. Returns null if both attempts fail.
 *
 * Validation is run on all items across all apps combined (classification
 * budget is per-faction, not per-app).
 */
export async function generateContentWithRetry(
  provider: GenerationProvider,
  context: GenerationContext,
  faction: Faction,
  apps: AppId[],
): Promise<AppContent[] | null> {
  // Attempt 1
  let result: AppContent[];
  try {
    result = await generateContent(provider, context, faction, apps);
  } catch {
    return null;
  }

  const allItems = result.flatMap((ac) => ac.items);
  const validation = validateContent(allItems, faction, context.targetRound, apps.length);
  if (validation.valid) {
    return result;
  }

  // Attempt 2 — feed validation errors back into the prompt
  const feedback = validation.errors.join("\n");
  try {
    result = await generateContent(provider, context, faction, apps, feedback);
  } catch {
    return null;
  }

  const allItems2 = result.flatMap((ac) => ac.items);
  const validation2 = validateContent(allItems2, faction, context.targetRound, apps.length);
  return validation2.valid ? result : null;
}
