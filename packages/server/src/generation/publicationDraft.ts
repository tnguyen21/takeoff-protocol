import type {
  ContentItem,
  Faction,
  GameRoom,
  GeneratedPublicationDraft,
  PublicationAngle,
  PublicationTarget,
  Role,
  StateView,
} from "@takeoff/shared";
import { computeFogView } from "@takeoff/shared";
import { getGenerationConfig } from "./config.js";
import { createProvider, retryWithBackoff, type GenerationOptions, type GenerationProvider } from "./provider.js";
import { scrubFogLeaks, validateFogSafety } from "./validate.js";
import { ROUND_ARCS } from "./prompts/arcs.js";

const MAX_PUBLISH_TITLE_LENGTH = 200;
const MAX_PUBLISH_CONTENT_LENGTH = 5000;
const TRANSIENT_RETRY_OPTS = { maxAttempts: 4, baseDelayMs: 1000, maxDelayMs: 30000 } as const;

type DraftOutput = {
  title: string;
  body: string;
};

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    body: { type: "string" },
  },
  required: ["title", "body"],
  additionalProperties: false,
} as const;

const DRAFT_SYSTEM_PROMPT = `You are ghostwriting an editable Substack draft for a live multiplayer strategy game.

Write a public-facing article that sounds publishable in a fast-moving AI/geopolitics media environment.

Hard constraints:
- Use ONLY the information provided in the prompt.
- Do not reveal hidden metrics, secret state, private chats, or internal game mechanics.
- Do not cite exact internal numbers unless they appear in the visible context.
- Prefer plausible public framing, reported analysis, market color, and qualitative interpretation.
- Return JSON only with keys "title" and "body".
- The body should be clean markdown prose, ready for a human player to edit.
- Avoid mentioning that this is a game, simulation, prompt, or draft assistant.`;

let publicationDraftProviderOverride: GenerationProvider | null = null;

interface GeneratePublicationDraftParams {
  room: GameRoom;
  role: Role;
  faction: Faction;
  angle: PublicationAngle;
  targetFaction: PublicationTarget;
}

function getProvider(): GenerationProvider {
  if (publicationDraftProviderOverride) return publicationDraftProviderOverride;
  const config = getGenerationConfig();
  return config.providerType === "mock" ? createProvider("mock", { data: { title: "", body: "" } }) : createProvider("anthropic");
}

function angleGuidance(angle: PublicationAngle): string {
  switch (angle) {
    case "safety":
      return "Lead with risk, caution, oversight, governance, and second-order consequences.";
    case "hype":
      return "Lead with momentum, breakthroughs, product stakes, investor energy, and competitive pressure.";
    case "geopolitics":
      return "Lead with strategic competition, state power, alliances, regulation, and cross-border consequences.";
  }
}

function targetGuidance(targetFaction: PublicationTarget): string {
  switch (targetFaction) {
    case "openbrain":
      return "Focus the piece on OpenBrain's posture, incentives, and public consequences.";
    case "prometheus":
      return "Focus the piece on Prometheus's posture, incentives, and public consequences.";
    case "china":
      return "Focus the piece on China's AI posture, strategic intent, and global implications.";
    case "general":
      return "Write a broader systems-level piece that surveys the whole race rather than one actor.";
  }
}

function formatVisibleState(view: StateView): string {
  const lines: string[] = [];
  for (const [key, fogVar] of Object.entries(view)) {
    if (fogVar.accuracy === "hidden") continue;
    if (fogVar.accuracy === "exact") {
      lines.push(`- ${key}: ${fogVar.value} (exact)`);
      continue;
    }
    lines.push(`- ${key}: ${fogVar.value} (estimate, confidence ±${fogVar.confidence ?? 0})`);
  }
  return lines.join("\n");
}

function buildUserPrompt({ room, role, faction, angle, targetFaction }: GeneratePublicationDraftParams): string {
  const round = room.round;
  const roundArc = ROUND_ARCS[round];
  const visibleState = computeFogView(room.state, faction, round);
  const recentPublications = (room.publications ?? [])
    .slice(-6)
    .map(
      (publication) =>
        `- Round ${publication.round}: [${publication.type}] "${publication.title}" by ${publication.publishedBy} (${publication.angle ?? "legacy"} / ${publication.targetFaction ?? "legacy"})`,
    )
    .join("\n");

  const storyBibleSummary = room.storyBible
    ? [
        `Scenario: ${room.storyBible.scenario}`,
        `Active threads: ${room.storyBible.activeThreads.join("; ") || "none yet"}`,
        `Tone shift: ${room.storyBible.toneShift}`,
      ].join("\n")
    : "Story bible not initialized yet.";

  const parts = [
    `## Writer\nRole: ${role}\nFaction: ${faction}\nRound: ${round}`,
    roundArc
      ? `## Round Arc\nTitle: ${roundArc.title}\nEra: ${roundArc.era}\nNarrative beat: ${roundArc.narrativeBeat}\nEscalation: ${roundArc.escalation}\nKey tensions:\n${roundArc.keyTensions.map((item) => `- ${item}`).join("\n")}`
      : `## Round Arc\nNo round arc found for round ${round}.`,
    `## Story Context\n${storyBibleSummary}`,
    `## Visible State Snapshot\n${formatVisibleState(visibleState) || "- No visible state available."}`,
    `## Recent Public Publications\n${recentPublications || "- None yet."}`,
    `## Requested Framing\nAngle: ${angle}\nTarget: ${targetFaction}\nAngle guidance: ${angleGuidance(angle)}\nTarget guidance: ${targetGuidance(targetFaction)}`,
    `## Task\nWrite one strong Substack-style draft with:
- a headline that sounds specific and publishable
- a body of roughly 500-900 words
- clear public-facing analysis
- enough structure that the player can quickly edit and publish

Do not fabricate private access, leaks, or exact hidden metrics unless they are explicitly present above.`,
  ];

  return parts.join("\n\n");
}

function clampDraft(output: DraftOutput): DraftOutput {
  return {
    title: output.title.trim().slice(0, MAX_PUBLISH_TITLE_LENGTH),
    body: output.body.trim().slice(0, MAX_PUBLISH_CONTENT_LENGTH),
  };
}

function scrubDraft(output: DraftOutput, room: GameRoom, faction: Faction): DraftOutput {
  const titleItem: ContentItem = {
    id: "draft-title",
    type: "document",
    round: room.round,
    body: output.title,
    timestamp: new Date().toISOString(),
  };
  const bodyItem: ContentItem = {
    id: "draft-body",
    type: "document",
    round: room.round,
    body: output.body,
    timestamp: new Date().toISOString(),
  };
  const { items } = scrubFogLeaks([titleItem, bodyItem], room.state, faction);
  const title = items[0]?.body ?? output.title;
  const body = items[1]?.body ?? output.body;
  return { title, body };
}

function warnOnResidualLeaks(output: DraftOutput, room: GameRoom, faction: Faction): void {
  const result = validateFogSafety(
    [
      {
        id: "draft-title",
        type: "document",
        round: room.round,
        body: output.title,
        timestamp: new Date().toISOString(),
      },
      {
        id: "draft-body",
        type: "document",
        round: room.round,
        body: output.body,
        timestamp: new Date().toISOString(),
      },
    ],
    room.state,
    faction,
  );
  if (result.warnings.length > 0) {
    console.warn(`[publication-draft:${faction}] residual fog warnings`, result.warnings);
  }
}

async function generateDraft(
  provider: GenerationProvider,
  params: GeneratePublicationDraftParams,
  options?: GenerationOptions,
): Promise<DraftOutput> {
  return provider.generate<DraftOutput>({
    systemPrompt: DRAFT_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(params),
    schema: DRAFT_SCHEMA,
    options,
    cacheSystem: true,
  });
}

export async function generatePublicationDraft(
  params: GeneratePublicationDraftParams,
): Promise<GeneratedPublicationDraft> {
  const config = getGenerationConfig();
  const provider = getProvider();
  const options: GenerationOptions = {
    model: config.signalModel,
    timeout: config.timeout,
    maxTokens: 4096,
  };

  const raw = await retryWithBackoff(
    () => generateDraft(provider, params, options),
    TRANSIENT_RETRY_OPTS,
  );
  const clamped = clampDraft(raw);
  const scrubbed = scrubDraft(clamped, params.room, params.faction);
  warnOnResidualLeaks(scrubbed, params.room, params.faction);

  return {
    round: params.room.round,
    title: scrubbed.title,
    body: scrubbed.body,
    angle: params.angle,
    targetFaction: params.targetFaction,
    generatedAt: Date.now(),
  };
}

export function _setPublicationDraftProviderForTests(provider: GenerationProvider | null): void {
  publicationDraftProviderOverride = provider;
}
