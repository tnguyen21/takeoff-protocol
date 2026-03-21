import type { AppContent, AppId, ContentItem, ContentItemType, Faction } from "@takeoff/shared";
import type { GenerationContext, PlayerSlackMessage } from "./context.js";
import type { GenerationOptions, GenerationProvider } from "./provider.js";
import { retryWithBackoff } from "./provider.js";
import { APP_VOICES, CONTENT_SYSTEM_PROMPT, FACTION_VOICES } from "./prompts/index.js";
import { contentBudget, validateContent } from "./validate.js";

// ── Valid Slack channels ───────────────────────────────────────────────────────

export const VALID_SLACK_CHANNELS = [
  "#general",
  "#research",
  "#alignment",
  "#safety",
  "#announcements",
  "#ops",
  "#random",
] as const;

// ── App → ContentItemType mapping ─────────────────────────────────────────────

export const APP_TYPE_MAP: Partial<Record<AppId, ContentItemType>> = {
  news: "headline",
  twitter: "tweet",
  slack: "message",
  email: "document",
  substack: "document",
  memo: "memo",
  signal: "message",
  intel: "document",
  bloomberg: "row",
  arxiv: "document",
};

// ── Content tiers ────────────────────────────────────────────────────────────
// Feed-tier: high volume, information overload. Critical intel buried in noise.
// Signal-tier: low volume, every item matters. Private/direct channels.

export type ContentTier = "feed" | "signal";

export const APP_CONTENT_TIER: Partial<Record<AppId, ContentTier>> = {
  slack: "feed",
  twitter: "feed",
  news: "feed",
  bloomberg: "feed",
  arxiv: "feed",
  substack: "feed",
  signal: "signal",
  memo: "signal",
  intel: "signal",
  email: "signal",
};

/** Per-app item count targets by tier. */
export const TIER_BUDGETS: Record<ContentTier, { min: number; max: number }> = {
  feed: { min: 12, max: 20 },
  signal: { min: 3, max: 6 },
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

/** Format player Slack messages for injection into the generation prompt. */
function formatPlayerSlackContext(messages: Record<string, PlayerSlackMessage[]>): string {
  const channelSections: string[] = [];
  for (const [channel, msgs] of Object.entries(messages)) {
    if (msgs.length === 0) continue;
    const lines = msgs.map((m) => `  ${m.from}: ${m.content}`).join("\n");
    channelSections.push(`${channel}:\n${lines}`);
  }
  return channelSections.join("\n\n");
}

function buildUserPrompt(
  context: GenerationContext,
  faction: Faction,
  app: AppId,
  type: ContentItemType,
  retryFeedback?: string,
  appCount?: number,
): string {
  const { storyBible, roundArc, currentState, history, firedThresholds, publications, targetRound, playerSlackMessages } = context;
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

  // Player Slack discussion context (only for the slack app)
  if (app === "slack") {
    const factionMessages = playerSlackMessages[faction];
    if (factionMessages && Object.keys(factionMessages).length > 0) {
      const formatted = formatPlayerSlackContext(factionMessages);
      parts.push(
        `## PLAYER SLACK DISCUSSION (previous round)
The following are recent messages players sent in their Slack channels last round.
Use these as thematic inspiration — have NPCs react to the *topics and concerns* raised,
NOT quote players directly. If no messages exist for a channel, generate standalone content.

${formatted}`,
      );
    } else {
      parts.push(
        `## PLAYER SLACK DISCUSSION (previous round)
No player messages in Slack last round. Generate standalone contextual messages as usual.`,
      );
    }
  }

  // Per-app structural hints
  const APP_STRUCTURAL_HINTS: Partial<Record<AppId, string>> = {
    slack: `Each item MUST include "sender" (proper-cased full name, e.g. "Alex Chen", "Sarah Kim" — no role/title in parentheses, no @-prefix) and "channel" (e.g. "#research", "#general").`,
    email: `Each item MUST include "sender" (email address or display name) and "subject" (email subject line).`,
    substack: `Each item MUST include "sender" (publication or byline) and "subject" (article headline). Write as a public-facing essay, newsletter post, or reported analysis piece. Do not write internal memos, DMs, or private correspondence.`,
    memo: `Each item MUST include "subject" (memo title/header, e.g. "RE: Safety Review Q3"). Keep the subject concise (≤60 chars) — it appears as the sidebar page title in the UI. Format the body as an internal memo or report, not a chat message (use formal headers, paragraph structure). Content should reference and build on events from prior rounds since memos accumulate and players see the progression across rounds.`,
    signal: `Each item MUST include "sender" (handle or name). Keep messages short and paranoid.`,
    intel: `Each item MUST include "subject" (report title). Use ICD 203 format with classification headers.`,
    bloomberg: `Use financial shorthand. Include ticker symbols, basis points, source attribution ("Sources say").`,
    arxiv: `Each item MUST include "subject" (paper title with authors/institution, e.g. "arXiv: 'Scaling Laws for X' — Smith et al., MIT (2027)") and "body" (abstract-style summary). Use realistic author names and institutions. Mix of AI safety, ML, policy, and adjacent CS topics.`,
  };

  // App voice guide and generation instructions
  const appVoice = APP_VOICES[app];
  const structuralHint = APP_STRUCTURAL_HINTS[app];
  const tier = APP_CONTENT_TIER[app] ?? "feed";
  const tierBudget = TIER_BUDGETS[tier];
  const budget = contentBudget(appCount);

  // Tier-specific generation guidance
  const tierGuidance = tier === "feed"
    ? `This is a FEED app — high volume, information overload. Generate ${tierBudget.min}-${tierBudget.max} items.
Players should feel like they're doom-scrolling a real ${app === "slack" ? "workplace Slack" : app === "twitter" ? "Twitter feed" : app === "news" ? "news wire" : app === "bloomberg" ? "Bloomberg terminal" : app === "arxiv" ? "arXiv feed" : "Substack inbox"} during a crisis.
Most items are atmospheric context. Critical intel should be BURIED — same tone, same style as everything else. A critical item should NOT stand out visually or stylistically. The player has to actually read and think to find what matters.
Classification targets: ~2-3 critical (hidden in the noise), ~${Math.round((tierBudget.min + tierBudget.max) / 2 * 0.6)} context, ~1-2 red-herring, ~1 breadcrumb.`
    : `This is a SIGNAL app — low volume, high stakes. Generate ${tierBudget.min}-${tierBudget.max} items.
Every item in ${app === "signal" ? "a Signal DM" : app === "memo" ? "an internal memo" : app === "intel" ? "an intelligence brief" : "an email"} should feel urgent and actionable. No filler. These are the "if you only have 60 seconds, check these" channels.
Players who are overwhelmed by the feed apps should still get critical information from here.
Classification targets: ~1-2 critical, ~${Math.max(1, tierBudget.min - 1)} context (still substantive, not filler). No red-herrings in signal channels — people trust these.`;

  parts.push(
    `## TARGET APP: ${app.toUpperCase()} [${tier.toUpperCase()} TIER]
Voice guide: ${appVoice ?? "Standard format."}
Content type: ${type}
${structuralHint ? `\nStructural requirements: ${structuralHint}` : ""}

${tierGuidance}

All items MUST have:
- type="${type}"
- round=${targetRound}
- id starting with "gen-" (e.g. "gen-r${targetRound}-${faction}-${app}-001")
- A non-empty body field

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

/**
 * Validate and normalise the `channel` field on slack (message) items.
 * - If channel is missing or not a known VALID_SLACK_CHANNELS entry, default to '#general'.
 * - Case-insensitive match: '#Research' → '#research'.
 */
export function forceSlackChannel(items: ContentItem[]): ContentItem[] {
  const validSet = new Set<string>(VALID_SLACK_CHANNELS);
  return items.map((item) => {
    const raw = item.channel;
    if (!raw) return { ...item, channel: "#general" };
    if (validSet.has(raw)) return item;
    // Case-insensitive fallback
    const lower = raw.toLowerCase();
    const match = VALID_SLACK_CHANNELS.find((c) => c === lower);
    if (match) return { ...item, channel: match };
    return { ...item, channel: "#general" };
  });
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
/** Max rollout calls per app (including the initial call). */
const MAX_ROLLOUTS = 3;

export async function generateContent(
  provider: GenerationProvider,
  context: GenerationContext,
  faction: Faction,
  apps: AppId[],
  retryFeedback?: string,
  options?: GenerationOptions,
): Promise<AppContent[]> {
  const results = await Promise.all(
    apps.map(async (app) => {
      const type = APP_TYPE_MAP[app];
      if (!type) {
        throw new Error(`generateContent: app "${app}" is not supported (gamestate, sheets, compute, wandb, and similar apps do not generate content)`);
      }

      const tier = APP_CONTENT_TIER[app] ?? "feed";
      const targetMin = TIER_BUDGETS[tier].min;
      let allItems: ContentItem[] = [];
      console.log(`[content:${faction}:${app}] Starting generation (tier=${tier}, target=${targetMin})`);

      for (let rollout = 0; rollout < MAX_ROLLOUTS; rollout++) {
        // Build rollout-aware prompt: after the first call, tell the LLM what exists
        let rolloutFeedback = retryFeedback;
        if (rollout > 0) {
          const existingIds = allItems.map(i => i.id).join(", ");
          const remaining = targetMin - allItems.length;
          rolloutFeedback = (rolloutFeedback ? rolloutFeedback + "\n\n" : "")
            + `You already generated ${allItems.length} items (IDs: ${existingIds}). Generate ${remaining}+ MORE items with NEW unique IDs. Do NOT repeat any existing items.`;
        }

        console.log(`[content:${faction}:${app}] Rollout ${rollout + 1}/${MAX_ROLLOUTS} — calling provider (have ${allItems.length} items)`);
        const raw = await provider.generate<{ items: ContentItem[] }>({
          systemPrompt: CONTENT_SYSTEM_PROMPT,
          userPrompt: buildUserPrompt(context, faction, app, type, rolloutFeedback, apps.length),
          schema: buildContentSchema(type),
          options,
        });
        console.log(`[content:${faction}:${app}] Rollout ${rollout + 1} returned ${Array.isArray(raw?.items) ? raw.items.length : 0} items`);

        let items: ContentItem[] = Array.isArray(raw?.items) ? raw.items : [];
        items = items.map(({ condition: _condition, ...rest }) => rest as ContentItem);
        items = ensureGenPrefix(items);
        items = forceRound(items, context.targetRound);
        items = forceType(items, type);
        if (app === "slack") {
          items = forceSlackChannel(items);
        }

        // Deduplicate by ID against existing items
        const existingIds = new Set(allItems.map(i => i.id));
        const newItems = items.filter(i => !existingIds.has(i.id));
        allItems.push(...newItems);

        if (allItems.length >= targetMin) break;
      }

      return { faction, app, items: allItems } as AppContent;
    }),
  );

  return results;
}

// ── Retry Wrapper ─────────────────────────────────────────────────────────────

// Retry tuning for transient errors (429, timeout, API errors) within each
// logical attempt. Validation-feedback retries remain capped at 2 attempts.
const TRANSIENT_RETRY_OPTS = { maxAttempts: 4, baseDelayMs: 1000, maxDelayMs: 30000 } as const;

/**
 * Attempt content generation once. If validation fails, retry once with error
 * feedback injected into the prompt. Returns null if both attempts fail.
 *
 * Validation is run on all items across all apps combined (classification
 * budget is per-faction, not per-app).
 *
 * INV: Transient errors (429, timeout, API) get up to 4 retries with backoff.
 * INV: Validation errors trigger at most 1 feedback retry (2 logical attempts total).
 */
export async function generateContentWithRetry(
  provider: GenerationProvider,
  context: GenerationContext,
  faction: Faction,
  apps: AppId[],
  options?: GenerationOptions,
): Promise<AppContent[] | null> {
  // Attempt 1 (transient errors retried with backoff)
  console.log(`[content:${faction}] Starting attempt 1 for apps=[${apps.join(",")}] model=${options?.model ?? "default"}`);
  let result: AppContent[];
  try {
    result = await retryWithBackoff(
      () => generateContent(provider, context, faction, apps, undefined, options),
      TRANSIENT_RETRY_OPTS,
    );
    console.log(`[content:${faction}] Attempt 1 completed — ${result.flatMap(ac => ac.items).length} items across ${result.length} apps`);
  } catch (err) {
    console.error(`[content:${faction}] Attempt 1 threw:`, String(err));
    return null;
  }

  const allItems = result.flatMap((ac) => ac.items);
  const validation = validateContent(allItems, faction, context.targetRound, apps.length);
  if (validation.valid) {
    return result;
  }

  console.error(`[content:${faction}] Attempt 1 validation failed (${allItems.length} items):`, validation.errors);

  // Attempt 2 — feed validation errors back into the prompt
  const feedback = validation.errors.join("\n");
  try {
    result = await retryWithBackoff(
      () => generateContent(provider, context, faction, apps, feedback, options),
      TRANSIENT_RETRY_OPTS,
    );
  } catch (err) {
    console.error(`[content:${faction}] Attempt 2 threw:`, String(err));
    return null;
  }

  const allItems2 = result.flatMap((ac) => ac.items);
  const validation2 = validateContent(allItems2, faction, context.targetRound, apps.length);
  if (!validation2.valid) {
    console.error(`[content:${faction}] Attempt 2 validation failed (${allItems2.length} items):`, validation2.errors);
  }
  return validation2.valid ? result : null;
}
