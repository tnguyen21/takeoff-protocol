import type {
  DecisionOption,
  DecisionTemplate,
  Faction,
  IndividualDecision,
  Role,
  RoundDecisions,
  StateVariables,
  TeamDecision,
} from "@takeoff/shared";
import type { GenerationContext } from "./context.js";
import type { GenerationOptions, GenerationProvider } from "./provider.js";
import { retryWithBackoff } from "./provider.js";
import { DECISION_SYSTEM_PROMPT } from "./prompts/system.js";
import { validateDecisions } from "./validate.js";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Raw shape returned by the LLM before post-processing. */
type GeneratedDecision = {
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    description: string;
    effects: Array<{
      variable: string;
      delta: number;
      condition?: {
        variable: string;
        threshold: number;
        operator: "gt" | "lt" | "eq";
        multiplier: number;
      };
    }>;
  }>;
};

// ── JSON Schema for structured output ────────────────────────────────────────

const DECISION_SCHEMA = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description: "Decision prompt narrative (50-300 words) grounded in current game events",
    },
    options: {
      type: "array",
      description: "Exactly 3 decision options following the provided archetypes",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Simple option identifier (e.g. 'A', 'B', 'C') — will be overridden with gen_ prefix",
          },
          label: {
            type: "string",
            description: "Short label under 60 characters",
          },
          description: {
            type: "string",
            description: "1-3 sentences describing what this option does and why someone would choose it",
          },
          effects: {
            type: "array",
            description: "5-8 state effects, each from the variableScope list",
            items: {
              type: "object",
              properties: {
                variable: {
                  type: "string",
                  description: "State variable name from the variableScope list",
                },
                delta: {
                  type: "integer",
                  description: "Integer change in [-8, 8]. Positive = beneficial, negative = harmful.",
                },
                condition: {
                  type: "object",
                  description: "Optional: this effect is multiplied when the condition is true",
                  properties: {
                    variable: { type: "string" },
                    threshold: { type: "number" },
                    operator: { type: "string", enum: ["gt", "lt", "eq"] },
                    multiplier: {
                      type: "number",
                      description: "Multiplier in [0.5, 3.0]",
                    },
                  },
                  required: ["variable", "threshold", "operator", "multiplier"],
                  additionalProperties: false,
                },
              },
              required: ["variable", "delta"],
              additionalProperties: false,
            },
          },
        },
        required: ["id", "label", "description", "effects"],
        additionalProperties: false,
      },
    },
  },
  required: ["prompt", "options"],
  additionalProperties: false,
} as const;

// ── Variable descriptions for prompt context ──────────────────────────────────

const VARIABLE_DESCRIPTIONS: Partial<Record<keyof StateVariables, string>> = {
  obCapability: "OpenBrain AI capability level (0-100, maps to Agent 1-5)",
  promCapability: "Prometheus AI capability level (0-100)",
  chinaCapability: "China/DeepCent AI capability level (0-100)",
  usChinaGap: "US advantage over China in months (-8 to +16, positive=US ahead)",
  obPromGap: "OpenBrain advantage over Prometheus in months (-8 to +16)",
  alignmentConfidence: "Global confidence in AI alignment (0-100)",
  misalignmentSeverity: "Severity of detected misalignment issues (0-100)",
  publicAwareness: "Public awareness of AI risks (0-100)",
  publicSentiment: "Public sentiment toward AI (-100 to +100)",
  economicDisruption: "Economic disruption from AI automation (0-100)",
  taiwanTension: "US-China tension over Taiwan (0-100)",
  obInternalTrust: "Trust within OpenBrain among staff (0-100)",
  securityLevelOB: "OpenBrain security clearance level (1-5)",
  securityLevelProm: "Prometheus security clearance level (1-5)",
  intlCooperation: "International cooperation on AI governance (0-100)",
  marketIndex: "Global stock market index (0-200, baseline 100)",
  regulatoryPressure: "Regulatory pressure on AI labs (0-100)",
  globalMediaCycle: "Media narrative phase (0=ai-hype, 1=ai-fear, 2=ai-crisis, 3=ai-war, 4=ai-regulation, 5=ai-normalized)",
  chinaWeightTheftProgress: "Progress of China's weight theft operation (0-100) [HIDDEN]",
  aiAutonomyLevel: "AI system autonomy and agency level (0-100) [HIDDEN]",
  whistleblowerPressure: "Internal pressure for whistleblowing (0-100) [HIDDEN]",
  openSourceMomentum: "Momentum for open-source AI movement (0-100)",
  doomClockDistance: "Distance from catastrophe (5=safe, 0=catastrophe) [HIDDEN]",
  obMorale: "OpenBrain employee morale (0-100)",
  obBurnRate: "OpenBrain cash burn rate (0-100, higher=worse)",
  obBoardConfidence: "OpenBrain board confidence in leadership (0-100)",
  promMorale: "Prometheus employee morale (0-100)",
  promBurnRate: "Prometheus cash burn rate (0-100, higher=worse)",
  promBoardConfidence: "Prometheus board confidence in leadership (0-100)",
  promSafetyBreakthroughProgress: "Prometheus safety research breakthrough progress (0-100)",
  cdzComputeUtilization: "China CDZ compute utilization (0-100)",
  ccpPatience: "CCP patience with DeepCent's pace (0-100, lower=less patient)",
  domesticChipProgress: "China's domestic chip development progress (0-100)",
};

// ── Role identity context ─────────────────────────────────────────────────────
//
// Injected into the decision prompt so the LLM writes decisions that feel like
// they belong on this person's desk. Describes who the player is, what levers
// they control, and how their decisions should read.

const ROLE_IDENTITY: Record<Role, string> = {
  // ── OpenBrain ──
  ob_ceo:
    "You are the CEO of OpenBrain, the leading US AI lab. You answer to your board, your investors, and increasingly to the US government. You believe speed is safety — if you don't build it, China will. Your decisions read like high-stakes board memos and investor calls.",
  ob_cto:
    "You are OpenBrain's CTO and Head of Research. You architect the frontier systems. Agent-2 through Agent-5 are your babies. You care about technical elegance and pushing the capability boundary. Your decisions read like engineering trade-offs with civilization-scale consequences.",
  ob_safety:
    "You are OpenBrain's Chief Safety Officer. You see warning signs others dismiss. You've been hired to do alignment work but constantly deprioritized. You might be the only person standing between a breakthrough and a catastrophe. Your decisions carry the weight of conscience vs. career.",
  ob_security:
    "You are OpenBrain's Security Lead. You know the weight theft vulnerabilities. You want resources but capabilities always gets priority. Your decisions involve breach prevention, incident response, and the constant tension between security lockdown and engineering velocity.",

  // ── Prometheus ──
  prom_ceo:
    "You are the CEO of Prometheus, the safety-first AI lab. You're principled but frustrated watching OpenBrain cut corners and get rewarded. Your board wants you to move faster. Your decisions balance principles against competitive pressure.",
  prom_scientist:
    "You are Prometheus's Chief Scientist. You believe safety IS the path to better AI. Your alignment approaches might actually work — if given time and compute. Your decisions read like research strategy with existential stakes.",
  prom_policy:
    "You are Prometheus's Head of Policy, the bridge to Washington. You're positioning Prometheus as the 'responsible' choice. Your decisions involve regulatory advocacy, government partnerships, and leveraging safety credentials for competitive advantage.",
  prom_opensource:
    "You are Prometheus's Head of Open Source. You believe democratizing AI is morally right and strategically smart — but open-sourcing helps China too. Your decisions involve the tension between transparency, community, and national security.",

  // ── China ──
  china_director:
    "You are the Director of DeepCent, China's frontier AI lab. You can do more with less. You have stolen Agent-2 weights, massive state compute, and a strategy to commoditize the model layer. Your decisions read like asymmetric competitive strategy.",
  china_intel:
    "You are the CCP Intelligence Chief overseeing AI espionage. You have eyes on both US labs. Stealing Agent-3 or Agent-4 weights could leapfrog everything — but getting caught could trigger kinetic escalation. Your decisions are risk/reward calculations with geopolitical stakes.",
  china_military:
    "You are a PLA Military Strategist. Taiwan is always on the table. Cyber is always active. You evaluate kinetic and non-kinetic options on the escalation ladder. Your decisions read like military planning memos — posture, readiness, and contingency.",
  china_scientist:
    "You are a senior DeepCent researcher focused on AI capability and alignment evaluation. You work within the state system but care about technical excellence. Your decisions balance scientific ambition with party directives.",

  // ── External Stakeholders ──
  ext_nsa:
    "You are the US National Security Advisor. You see AI as the new Manhattan Project. You have classified intelligence others don't — PDBs, signals intercepts, lab assessments. Your decisions are presidential recommendations. Frame options as executive actions: invoke emergency powers, direct agencies, authorize operations. You speak with the weight of the Oval Office.",
  ext_journalist:
    "You are an investigative tech journalist with named sources inside both labs and the NSC. Your power is publishing — timing and framing determine whether you cause a market crash, protect a source, or shift the public narrative. Your decisions involve what to publish, when, how to protect sources, and whether to coordinate with government or go independent. Every story is a tradeoff between impact and trust.",
  ext_vc:
    "You are a major VC with board seats at both OpenBrain and Prometheus and $920M+ in illiquid positions. Your capital decisions directly affect lab operations — funding commitments set burn rates, board votes shape strategy, public statements move markets. Your decisions read like investment committee memos: deploy, hedge, divest, or leverage your board position to force governance changes.",
  ext_diplomat:
    "You are an international diplomat representing the EU and allied nations. Your power comes from coalition-building, treaty frameworks, and economic leverage — the EU's $400B market access is a real stick. Your decisions involve multilateral coordination, bilateral negotiation terms, sanctions threats, and the constant risk that your coalition fractures. Frame options as diplomatic moves with acceptance risk and coalition durability implications.",
};

const FACTION_IDENTITY: Record<Faction, string> = {
  openbrain:
    "This is a team decision for the OpenBrain faction. The team includes the CEO, CTO, Safety Officer, and Security Lead. They must agree despite internal tensions between speed and safety. Frame the decision as a leadership consensus moment.",
  prometheus:
    "This is a team decision for the Prometheus faction. The team includes the CEO, Chief Scientist, Head of Policy, and Head of Open Source. They share safety values but disagree on tactics. Frame the decision as a principled strategy alignment.",
  china:
    "This is a team decision for the China faction (DeepCent + CCP). The team includes the DeepCent Director, Intelligence Chief, Military Strategist, and Senior Scientist. Party directives create a different decision-making dynamic than the US labs. Frame the decision as a strategic committee consensus.",
  external:
    "This is a team decision for the External Stakeholders. The NSA Advisor, Journalist, VC, and Diplomat have overlapping but conflicting interests — national security, transparency, profit, and cooperation. They rarely agree. Frame the decision as a fragile coalition moment where the compromise itself is the tension.",
};

// ── Prompt builder ─────────────────────────────────────────────────────────────

export function buildDecisionPrompt(
  context: GenerationContext,
  template: DecisionTemplate,
  validationErrors?: string[],
): string {
  const parts: string[] = [];

  // Story bible
  if (context.storyBible) {
    parts.push(`## Story Bible\n${JSON.stringify(context.storyBible, null, 2)}`);
  } else {
    parts.push(
      `## Story Bible\n(Not yet initialized — this is round ${context.targetRound}. Ground your decision in the canonical scenario.)`,
    );
  }

  // Current state snapshot scoped to this template's variables
  const scopedState: Partial<Record<keyof StateVariables, number>> = {};
  for (const varName of template.variableScope) {
    const val = context.currentState[varName];
    scopedState[varName] = val as number;
  }
  parts.push(
    `## Current State (variables in scope for this decision)\n${JSON.stringify(scopedState, null, 2)}`,
  );

  // Variable descriptions
  const varDescLines = template.variableScope.map((v) => {
    const desc = VARIABLE_DESCRIPTIONS[v] ?? v;
    return `- ${v}: ${desc}`;
  });
  parts.push(`## Variable Descriptions\n${varDescLines.join("\n")}`);

  // Role/faction identity context
  if (template.role && ROLE_IDENTITY[template.role]) {
    parts.push(`## Who You Are\n${ROLE_IDENTITY[template.role]}`);
  } else if (template.faction && FACTION_IDENTITY[template.faction]) {
    parts.push(`## Who You Are\n${FACTION_IDENTITY[template.faction]}`);
  }

  // Template details
  const actorLabel = template.role ? `Role: ${template.role}` : `Faction: ${template.faction}`;
  parts.push(
    `## Decision Template\nTheme: ${template.theme}\n${actorLabel}\nRound: ${template.round}\nVariable Scope: ${template.variableScope.join(", ")}\n\nArchetypes (generate exactly 3 options in this order):\n- Option 0 [${template.archetypes[0]}]: embodies the "${template.archetypes[0]}" play style\n- Option 1 [${template.archetypes[1]}]: embodies the "${template.archetypes[1]}" play style\n- Option 2 [${template.archetypes[2]}]: embodies the "${template.archetypes[2]}" play style`,
  );

  // Decision history for this role/faction — rendered with human-readable labels and effects
  if (context.history.length > 0) {
    const historyLines: string[] = [];
    for (const h of context.history) {
      const roundLines: string[] = [];
      if (template.role) {
        // Show this role's individual decision
        const optionId = h.roleDecisions?.[template.role];
        if (optionId) {
          const label = h.chosenLabels?.[optionId] ?? optionId;
          const effects = h.chosenEffects?.[optionId] ?? [];
          const effectsStr = effects.length > 0
            ? effects.map((e) => `${e.variable} ${e.delta > 0 ? "+" : ""}${e.delta}`).join(", ")
            : "(no effects recorded)";
          roundLines.push(`- ${template.role} chose: "${label}"\n  Effects: ${effectsStr}`);
        }
      } else if (template.faction) {
        // Show this faction's team decision
        const optionId = h.teamDecisions[template.faction];
        if (optionId) {
          const label = h.chosenLabels?.[optionId] ?? optionId;
          const effects = h.chosenEffects?.[optionId] ?? [];
          const effectsStr = effects.length > 0
            ? effects.map((e) => `${e.variable} ${e.delta > 0 ? "+" : ""}${e.delta}`).join(", ")
            : "(no effects recorded)";
          roundLines.push(`- ${template.faction} team chose: "${label}"\n  Effects: ${effectsStr}`);
        }
      }
      if (roundLines.length > 0) {
        historyLines.push(`Round ${h.round}:\n${roundLines.join("\n")}`);
      }
    }
    if (historyLines.length > 0) {
      parts.push(`## Prior Decisions (${template.role ?? template.faction})\n${historyLines.join("\n\n")}`);
    }
  }

  // Fired threshold events
  if (context.firedThresholds.length > 0) {
    parts.push(
      `## Events That Have Fired\n${context.firedThresholds.map((t) => `- ${t}`).join("\n")}`,
    );
  }

  // Validation error feedback (retry)
  if (validationErrors && validationErrors.length > 0) {
    parts.push(
      `## Validation Errors from Previous Attempt\nYour previous output failed validation. Fix ALL of these issues:\n${validationErrors.map((e) => `- ${e}`).join("\n")}\n\nRemember: each option needs >= 2 positive AND >= 2 negative deltas. All variables must be in the scope list.`,
    );
  }

  const continuityInstruction =
    context.history.length > 0
      ? "\n\nIf the player's prior choices show a consistent pattern (safety-focused, aggressive, diplomatic), one archetype should continue that path, one should represent a pivot."
      : "";

  parts.push(
    `## Task\nGenerate one decision for round ${context.targetRound}.\n${template.role ? `This is an individual decision for role: ${template.role}` : `This is a team decision for faction: ${template.faction}`}\n\nReturn exactly 3 options following the archetypes above. Set option ids to "A", "B", "C" — they will be replaced with canonical gen_ ids.${continuityInstruction}\n\nReturn structured JSON only.`,
  );

  return parts.join("\n\n");
}

// ── Post-processing ───────────────────────────────────────────────────────────

/**
 * Assign canonical gen_ option IDs and coerce effects to DecisionOption shape.
 * ID format: gen_<role|faction>_r<round>_<index>
 * e.g. gen_ext_nsa_r3_0
 */
function postProcessDecision(
  raw: GeneratedDecision,
  roleOrFaction: string,
  round: number,
): { prompt: string; options: DecisionOption[] } {
  const options: DecisionOption[] = (raw.options ?? []).map((opt, idx) => ({
    id: `gen_${roleOrFaction}_r${round}_${idx}`,
    label: opt.label ?? "",
    description: opt.description ?? "",
    effects: (opt.effects ?? []).map((eff) => ({
      variable: eff.variable as keyof StateVariables,
      delta: eff.delta,
      ...(eff.condition !== undefined
        ? {
            condition: {
              variable: eff.condition.variable as keyof StateVariables,
              threshold: eff.condition.threshold,
              operator: eff.condition.operator,
              multiplier: eff.condition.multiplier,
            },
          }
        : {}),
    })),
  }));

  return { prompt: raw.prompt ?? "", options };
}

/**
 * Wrap a single decision into a minimal RoundDecisions for validateDecisions().
 */
function toRoundDecisions(
  round: number,
  template: DecisionTemplate,
  decision: { prompt: string; options: DecisionOption[] },
): RoundDecisions {
  if (template.role !== undefined) {
    const indiv: IndividualDecision = {
      role: template.role,
      prompt: decision.prompt,
      options: decision.options,
    };
    return { round, individual: [indiv], team: [] };
  }
  const team: TeamDecision = {
    faction: template.faction!,
    prompt: decision.prompt,
    options: decision.options,
  };
  return { round, individual: [], team: [team] };
}

// Retry tuning for transient errors (429, timeout, API errors) within each
// logical attempt. Validation-feedback retries remain capped at 2 attempts.
const TRANSIENT_RETRY_OPTS = { maxAttempts: 4, baseDelayMs: 1000, maxDelayMs: 30000 } as const;

// ── Single-decision generator with per-decision retry ─────────────────────────

async function generateSingleDecision(
  provider: GenerationProvider,
  context: GenerationContext,
  template: DecisionTemplate,
  round: number,
  options?: GenerationOptions,
): Promise<{ prompt: string; options: DecisionOption[] } | null> {
  const roleOrFaction = template.role ?? template.faction ?? "unknown";

  // ── Attempt 1 (transient errors retried with backoff) ─────────────────────
  let raw: GeneratedDecision;
  try {
    raw = await retryWithBackoff(
      () =>
        provider.generate<GeneratedDecision>({
          systemPrompt: DECISION_SYSTEM_PROMPT,
          userPrompt: buildDecisionPrompt(context, template),
          schema: DECISION_SCHEMA,
          options,
        }),
      TRANSIENT_RETRY_OPTS,
    );
  } catch (err) {
    console.error(`[decision:${roleOrFaction}] Attempt 1 threw:`, String(err));
    return null;
  }

  const processed = postProcessDecision(raw, roleOrFaction, round);
  const miniRound = toRoundDecisions(round, template, processed);
  const validation = validateDecisions(miniRound, [template]);
  if (validation.valid) {
    return processed;
  }

  console.error(`[decision:${roleOrFaction}] Attempt 1 validation failed:`, validation.errors);

  // ── Retry with validation errors injected ─────────────────────────────────
  let raw2: GeneratedDecision;
  try {
    raw2 = await retryWithBackoff(
      () =>
        provider.generate<GeneratedDecision>({
          systemPrompt: DECISION_SYSTEM_PROMPT,
          userPrompt: buildDecisionPrompt(context, template, validation.errors),
          schema: DECISION_SCHEMA,
          options,
        }),
      TRANSIENT_RETRY_OPTS,
    );
  } catch (err) {
    console.error(`[decision:${roleOrFaction}] Attempt 2 threw:`, String(err));
    return null;
  }

  const processed2 = postProcessDecision(raw2, roleOrFaction, round);
  const miniRound2 = toRoundDecisions(round, template, processed2);
  const validation2 = validateDecisions(miniRound2, [template]);
  if (!validation2.valid) {
    console.error(`[decision:${roleOrFaction}] Attempt 2 validation failed:`, validation2.errors);
  }
  return validation2.valid ? processed2 : null;
}

// ── generateDecisions ─────────────────────────────────────────────────────────

/**
 * Generate all decisions for the given round, one LLM call per template.
 *
 * - Filters templates to those matching `round`.
 * - For each template, calls the provider and validates the single decision.
 * - Retries once per decision on validation failure.
 * - If ANY decision fails (both attempts fail), returns null (caller falls back to pre-authored).
 * - Assembles successful decisions into a RoundDecisions object.
 *
 * Does NOT catch unexpected errors — use generateDecisionsWithRetry for that.
 */
export async function generateDecisions(
  provider: GenerationProvider,
  context: GenerationContext,
  templates: DecisionTemplate[],
  round: number,
  options?: GenerationOptions,
): Promise<RoundDecisions | null> {
  const roundTemplates = templates.filter((t) => t.round === round);

  // Parallelize all decision generation (semaphore in provider handles concurrency)
  const results = await Promise.all(
    roundTemplates.map(async (template) => {
      const result = await generateSingleDecision(provider, context, template, round, options);
      return { template, result };
    }),
  );

  const individual: IndividualDecision[] = [];
  const team: TeamDecision[] = [];

  for (const { template, result } of results) {
    if (result === null) {
      // Any single decision failure → fall back entire round to pre-authored
      return null;
    }

    if (template.role !== undefined) {
      individual.push({ role: template.role, prompt: result.prompt, options: result.options });
    } else if (template.faction !== undefined) {
      team.push({ faction: template.faction, prompt: result.prompt, options: result.options });
    }
  }

  return { round, individual, team };
}

// ── generateDecisionsWithRetry ────────────────────────────────────────────────

/**
 * Wrapper around generateDecisions that catches all unexpected errors.
 *
 * INV: Never throws. Returns null on any failure (provider error, parse error,
 *      validation failure after retry, unexpected exception).
 */
export async function generateDecisionsWithRetry(
  provider: GenerationProvider,
  context: GenerationContext,
  templates: DecisionTemplate[],
  round: number,
  options?: GenerationOptions,
): Promise<RoundDecisions | null> {
  try {
    return await generateDecisions(provider, context, templates, round, options);
  } catch {
    return null;
  }
}
