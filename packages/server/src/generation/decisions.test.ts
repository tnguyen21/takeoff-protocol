/**
 * Tests for decision generation and retry logic.
 *
 * Invariants tested:
 * - INV-1: MockProvider returning valid data → generateDecisionsWithRetry returns valid RoundDecisions
 * - INV-2: Generated option IDs start with "gen_"
 * - INV-3: Effects reference variables within the template's variableScope (happy path)
 * - INV-4: On provider failure, returns null (does not throw)
 *
 * Critical paths:
 * - Happy path: valid data returned
 * - Validation failure + retry: first invalid, second valid → retry succeeds
 * - Complete failure: both attempts invalid → returns null
 *
 * Failure modes:
 * - Provider throws → returns null
 * - Provider returns unparseable JSON → returns null
 * - Provider returns empty options array → validation fails → retry
 */

import { describe, it, expect } from "bun:test";
import type { DecisionTemplate, RoundDecisions } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import type { GenerationOptions, GenerationProvider } from "./provider.js";
import { GenerationTimeoutError, GenerationParseError } from "./provider.js";
import { generateDecisions, generateDecisionsWithRetry } from "./decisions.js";
import type { GenerationContext } from "./context.js";
import { ROUND_ARCS } from "./prompts/arcs.js";

// ── Fixtures ────────────────────────────────────────────────────────────────────

/** A minimal template for one individual decision in round 3 */
const TEST_TEMPLATE_INDIVIDUAL: DecisionTemplate = {
  round: 3,
  role: "ext_nsa",
  theme: "emergency powers response",
  variableScope: [
    "regulatoryPressure",
    "alignmentConfidence",
    "intlCooperation",
    "obBoardConfidence",
    "misalignmentSeverity",
    "economicDisruption",
    "obMorale",
    "publicSentiment",
  ],
  archetypes: ["seize control", "force oversight", "back full speed"],
};

/** A minimal template for one team decision in round 3 */
const TEST_TEMPLATE_TEAM: DecisionTemplate = {
  round: 3,
  faction: "openbrain",
  theme: "deployment strategy",
  variableScope: [
    "obCapability",
    "alignmentConfidence",
    "obMorale",
    "obBurnRate",
    "misalignmentSeverity",
    "regulatoryPressure",
    "publicSentiment",
    "obBoardConfidence",
  ],
  archetypes: ["aggressive deploy", "staged rollout", "pause and verify"],
};

const ALL_TEST_TEMPLATES = [TEST_TEMPLATE_INDIVIDUAL, TEST_TEMPLATE_TEAM];

/**
 * Build a valid GeneratedDecision matching TEST_TEMPLATE_INDIVIDUAL's scope.
 *
 * Each option: >= 2 positive and >= 2 negative deltas (no-free-lunch).
 * Options use different variable subsets to keep same-sign ratio < 60% across all pairs.
 *
 * Distinctness verification (shared variable pairs):
 * - A vs B: shared={intlCooperation(-,-→diff), obBoardConfidence(-,+→diff)} → 0/2 same (0%) ✓
 * - A vs C: shared={regulatoryPressure(-,+), alignmentConfidence(+,-), obBoardConfidence(-,+), publicSentiment(+,-)} → 0/4 same (0%) ✓
 * - B vs C: shared={misalignmentSeverity(-,+→diff), obBoardConfidence(+,+→same)} → 1/2 same (50%) ✓
 */
function validIndividualData() {
  return {
    prompt:
      "Agent-4 has exceeded all projected capability benchmarks. The emergency protocols you drafted six months ago are now on the President's desk. You have 48 hours to decide how much authority the federal government will claim over OpenBrain's deployment pipeline. The labs are lobbying hard. The public doesn't yet know what you know. Every hour you wait is an hour the race continues without guardrails.",
    options: [
      {
        id: "A",
        // seize control: reduces regulatory pressure, boosts alignment, alienates allies, tanks board confidence
        label: "Invoke Federal Emergency Oversight",
        description:
          "Trigger the emergency AI oversight protocol, placing OpenBrain under direct federal supervision. Drastic but legally defensible.",
        effects: [
          { variable: "regulatoryPressure", delta: -7 }, // negative
          { variable: "alignmentConfidence", delta: 6 }, // positive
          { variable: "intlCooperation", delta: -4 }, // negative
          { variable: "obBoardConfidence", delta: -5 }, // negative
          { variable: "publicSentiment", delta: 3 }, // positive
        ],
      },
      {
        id: "B",
        // force oversight: voluntary framework — different variables from A
        label: "Negotiate a Voluntary Framework",
        description:
          "Broker a voluntary compliance agreement with the labs. Slower but preserves relationships and avoids legal battles.",
        effects: [
          { variable: "economicDisruption", delta: -4 }, // negative
          { variable: "obMorale", delta: 5 }, // positive
          { variable: "misalignmentSeverity", delta: -3 }, // negative
          { variable: "intlCooperation", delta: 4 }, // positive (flipped from A)
          { variable: "obBoardConfidence", delta: 2 }, // positive (flipped from A)
        ],
      },
      {
        id: "C",
        // back full speed: opposite of A's signs on shared variables
        label: "Clear Path for Full Deployment",
        description:
          "Step back and let the labs move forward. The US needs the lead — slowing now hands the advantage to China.",
        effects: [
          { variable: "regulatoryPressure", delta: 5 }, // positive (opposite of A)
          { variable: "alignmentConfidence", delta: -6 }, // negative (opposite of A)
          { variable: "obBoardConfidence", delta: 4 }, // positive (flipped from A)
          { variable: "publicSentiment", delta: -3 }, // negative (opposite of A)
          { variable: "misalignmentSeverity", delta: 4 }, // positive (opposite of B)
        ],
      },
    ],
  };
}

/**
 * Build a valid GeneratedDecision matching TEST_TEMPLATE_TEAM's scope.
 *
 * Distinctness verification:
 * - A vs B: shared={obCapability(+,+→same), obMorale(+,-→diff), alignmentConfidence(-,+→diff), obBurnRate(-,-→same)} → 2/4 same (50%) ✓
 * - A vs C: shared={obCapability(+,-), obMorale(+,-), regulatoryPressure(+,-), alignmentConfidence(-,+), obBurnRate(-,+)} → 0/5 same (0%) ✓
 * - B vs C: shared={obCapability(+,-→diff), obMorale(-,-→same), alignmentConfidence(+,+→same), obBurnRate(-,+→diff)} → 2/4 same (50%) ✓
 */
function validTeamData() {
  return {
    prompt:
      "The Agent-4 capability milestone has arrived faster than your board expected. Three deployment strategies are on the table. Your safety team is split. The government is watching. What you decide in the next hour will define OpenBrain's trajectory for the rest of the race.",
    options: [
      {
        id: "A",
        // aggressive deploy: capability up, morale up, but regulatory heat and alignment concerns
        label: "Full Deployment — All Markets",
        description:
          "Release Agent-4 across all enterprise verticals simultaneously. Maximum revenue and market capture but significant risk.",
        effects: [
          { variable: "obCapability", delta: 5 }, // positive
          { variable: "obMorale", delta: 4 }, // positive
          { variable: "regulatoryPressure", delta: 5 }, // positive
          { variable: "alignmentConfidence", delta: -6 }, // negative
          { variable: "obBurnRate", delta: -4 }, // negative
        ],
      },
      {
        id: "B",
        // staged rollout: some capability gain, alignment improves, morale dips
        label: "Staged Rollout with Safety Review",
        description:
          "Deploy incrementally with safety checkpoints at each phase. Slower but maintains trust with regulators.",
        effects: [
          { variable: "obCapability", delta: 3 }, // positive (same sign as A → counted)
          { variable: "alignmentConfidence", delta: 4 }, // positive (opposite of A → different)
          { variable: "obMorale", delta: -3 }, // negative (opposite of A → different)
          { variable: "obBurnRate", delta: -2 }, // negative (same sign as A → counted)
          { variable: "misalignmentSeverity", delta: -3 }, // negative
        ],
      },
      {
        id: "C",
        // pause and verify: full opposite of A on shared variables
        label: "Pause Deployment — Internal Safety Audit",
        description:
          "Halt deployment pending a comprehensive safety review. Expensive and painful but may be necessary.",
        effects: [
          { variable: "obCapability", delta: -3 }, // negative (opposite of A, B)
          { variable: "obBurnRate", delta: 5 }, // positive (opposite of A, B)
          { variable: "obMorale", delta: -5 }, // negative (same sign as B)
          { variable: "alignmentConfidence", delta: 6 }, // positive (same sign as B)
          { variable: "regulatoryPressure", delta: -4 }, // negative (opposite of A)
        ],
      },
    ],
  };
}

/** GeneratedDecision with empty options array — fails validation */
function invalidEmptyOptions() {
  return { prompt: "Something happened.", options: [] };
}

/** GeneratedDecision with only 2 options — fails "exactly 3" check */
function invalidTwoOptions() {
  return {
    prompt: "Something happened in the world. The stakes are high. Choose carefully.",
    options: [validIndividualData().options[0]!, validIndividualData().options[1]!],
  };
}

/** Factory that returns different data on call N */
class ValidOnNthCallProvider implements GenerationProvider {
  private calls = 0;
  constructor(
    private readonly validData: unknown,
    private readonly invalidData: unknown,
    private readonly validOnCall: number,
  ) {}
  async generate<T>(
    _params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions },
  ): Promise<T> {
    this.calls++;
    return (this.calls === this.validOnCall ? this.validData : this.invalidData) as T;
  }
}

/** Provider that always returns the given data */
class FixedProvider implements GenerationProvider {
  constructor(private readonly data: unknown) {}
  async generate<T>(
    _params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions },
  ): Promise<T> {
    return this.data as T;
  }
}

/** Provider that always throws the given error */
class ThrowingProvider implements GenerationProvider {
  constructor(private readonly error: Error) {}
  async generate<T>(
    _params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions },
  ): Promise<T> {
    throw this.error;
  }
}

/**
 * Provider that sequences through an array of responses.
 * Call 1 → responses[0], call 2 → responses[1], etc.
 * After all responses consumed, returns the last one.
 */
class SequenceProvider implements GenerationProvider {
  private idx = 0;
  constructor(private readonly responses: unknown[]) {}
  async generate<T>(
    _params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions },
  ): Promise<T> {
    const data = this.responses[Math.min(this.idx, this.responses.length - 1)];
    this.idx++;
    return data as T;
  }
}

/** Minimal GenerationContext for tests */
function makeContext(overrides: Partial<GenerationContext> = {}): GenerationContext {
  return {
    targetRound: 3,
    storyBible: undefined,
    currentState: { ...INITIAL_STATE },
    players: [],
    firedThresholds: [],
    publications: [],
    history: [],
    roundArc: ROUND_ARCS[3]!,
    playerSlackMessages: {},
    ...overrides,
  };
}

// ── INV-1: Valid data → valid RoundDecisions ────────────────────────────────────

describe("generateDecisionsWithRetry — INV-1: valid MockProvider data", () => {
  it("returns a valid RoundDecisions when provider returns well-formed decisions", async () => {
    const provider = new SequenceProvider([validIndividualData(), validTeamData()]);
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3);

    expect(result).not.toBeNull();
    expect(result!.round).toBe(3);
    expect(result!.individual).toHaveLength(1);
    expect(result!.individual[0]!.role).toBe("ext_nsa");
    expect(result!.team).toHaveLength(1);
    expect(result!.team[0]!.faction).toBe("openbrain");
  });

  it("returns RoundDecisions with exactly 3 options per decision", async () => {
    const provider = new SequenceProvider([validIndividualData(), validTeamData()]);
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3);

    expect(result!.individual[0]!.options).toHaveLength(3);
    expect(result!.team[0]!.options).toHaveLength(3);
  });

  it("only generates templates for the requested round (filters by round)", async () => {
    // Template for round 2 and template for round 3
    const templates: DecisionTemplate[] = [
      { ...TEST_TEMPLATE_INDIVIDUAL, round: 2 },
      { ...TEST_TEMPLATE_TEAM, round: 3 },
    ];
    // Only one call needed (only 1 template for round 3)
    const provider = new FixedProvider(validTeamData());
    const result = await generateDecisionsWithRetry(provider, makeContext({ targetRound: 3 }), templates, 3);

    expect(result).not.toBeNull();
    expect(result!.individual).toHaveLength(0); // round 2 template excluded
    expect(result!.team).toHaveLength(1);
  });
});

// ── INV-2: Generated option IDs start with "gen_" ─────────────────────────────

describe("generateDecisionsWithRetry — INV-2: option IDs start with gen_", () => {
  it("all generated option IDs start with gen_", async () => {
    const provider = new SequenceProvider([validIndividualData(), validTeamData()]);
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3);

    expect(result).not.toBeNull();
    for (const indiv of result!.individual) {
      for (const opt of indiv.options) {
        expect(opt.id.startsWith("gen_")).toBe(true);
      }
    }
    for (const team of result!.team) {
      for (const opt of team.options) {
        expect(opt.id.startsWith("gen_")).toBe(true);
      }
    }
  });

  it("option IDs follow gen_<roleOrFaction>_r<round>_<index> format", async () => {
    const provider = new FixedProvider(validIndividualData());
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );

    expect(result).not.toBeNull();
    const opts = result!.individual[0]!.options;
    expect(opts[0]!.id).toBe("gen_ext_nsa_r3_0");
    expect(opts[1]!.id).toBe("gen_ext_nsa_r3_1");
    expect(opts[2]!.id).toBe("gen_ext_nsa_r3_2");
  });

  it("team decision option IDs include faction name", async () => {
    const provider = new FixedProvider(validTeamData());
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_TEAM],
      3,
    );

    expect(result).not.toBeNull();
    const opts = result!.team[0]!.options;
    expect(opts[0]!.id).toBe("gen_openbrain_r3_0");
    expect(opts[1]!.id).toBe("gen_openbrain_r3_1");
    expect(opts[2]!.id).toBe("gen_openbrain_r3_2");
  });

  it("overrides whatever ID the LLM put in the raw output", async () => {
    const dataWithBadIds = {
      ...validIndividualData(),
      options: validIndividualData().options.map((o, i) => ({ ...o, id: `bad-id-${i}` })),
    };
    const provider = new FixedProvider(dataWithBadIds);
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );

    expect(result).not.toBeNull();
    for (const opt of result!.individual[0]!.options) {
      expect(opt.id.startsWith("gen_")).toBe(true);
    }
  });
});

// ── INV-3: Effects within variableScope ───────────────────────────────────────

describe("generateDecisionsWithRetry — INV-3: effects reference template variableScope", () => {
  it("happy path: effects use variables from the scope, no scope warnings produce errors", async () => {
    const provider = new SequenceProvider([validIndividualData(), validTeamData()]);
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3);

    // If any effects were outside scope, validation would produce warnings (not errors).
    // The happy path data uses only scoped variables, so result is valid.
    expect(result).not.toBeNull();
    // Verify all effect variables are in scope for the individual decision
    const scopeSet = new Set(TEST_TEMPLATE_INDIVIDUAL.variableScope);
    for (const opt of result!.individual[0]!.options) {
      for (const eff of opt.effects) {
        expect(scopeSet.has(eff.variable)).toBe(true);
      }
    }
  });
});

// ── INV-4: Provider failure → null ────────────────────────────────────────────

describe("generateDecisionsWithRetry — INV-4: provider failure returns null", () => {
  it("returns null when provider throws GenerationTimeoutError", async () => {
    const provider = new ThrowingProvider(new GenerationTimeoutError(30000));
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );
    expect(result).toBeNull();
  });

  it("returns null when provider throws GenerationParseError", async () => {
    const provider = new ThrowingProvider(new GenerationParseError("bad JSON"));
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );
    expect(result).toBeNull();
  });

  it("returns null when provider throws a generic error", async () => {
    const provider = new ThrowingProvider(new Error("network failure"));
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );
    expect(result).toBeNull();
  });

  it("does not throw — always returns null or a valid result", async () => {
    const provider = new ThrowingProvider(new Error("unexpected"));
    await expect(
      generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3),
    ).resolves.toBeNull();
  });
});

// ── Happy path ─────────────────────────────────────────────────────────────────

describe("generateDecisionsWithRetry — happy path", () => {
  it("returns decisions with the correct round number", async () => {
    const provider = new SequenceProvider([validIndividualData(), validTeamData()]);
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3);

    expect(result!.round).toBe(3);
  });

  it("preserves the generated prompt text", async () => {
    const provider = new FixedProvider(validIndividualData());
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );

    expect(result!.individual[0]!.prompt).toBe(validIndividualData().prompt);
  });

  it("returns empty individual and team arrays when no templates match the round", async () => {
    const provider = new FixedProvider(validIndividualData());
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 99);

    expect(result).not.toBeNull();
    expect(result!.round).toBe(99);
    expect(result!.individual).toHaveLength(0);
    expect(result!.team).toHaveLength(0);
  });
});

// ── Validation failure + retry ─────────────────────────────────────────────────

describe("generateDecisionsWithRetry — validation failure + retry", () => {
  it("retries on validation failure and returns valid result on second attempt", async () => {
    // Call 1: empty options (fails validation) → call 2: valid data
    const provider = new ValidOnNthCallProvider(
      validIndividualData(),
      invalidEmptyOptions(),
      2, // valid on 2nd call
    );
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );

    expect(result).not.toBeNull();
    expect(result!.individual[0]!.options).toHaveLength(3);
  });

  it("returns null when both attempts fail validation (2 options instead of 3)", async () => {
    const provider = new FixedProvider(invalidTwoOptions());
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );

    expect(result).toBeNull();
  });

  it("returns null when both attempts return empty options array", async () => {
    const provider = new FixedProvider(invalidEmptyOptions());
    const result = await generateDecisionsWithRetry(
      provider,
      makeContext(),
      [TEST_TEMPLATE_INDIVIDUAL],
      3,
    );

    expect(result).toBeNull();
  });
});

// ── Complete failure: one decision fails → whole round null ───────────────────

describe("generateDecisionsWithRetry — any-decision-failure returns null", () => {
  it("returns null if the first template succeeds but the second fails", async () => {
    // Template 1 (individual): valid. Template 2 (team): always invalid.
    // Per spec: if ANY decision fails, return null for the whole round.
    const provider = new SequenceProvider([
      validIndividualData(), // template 1 attempt 1 — valid
      invalidEmptyOptions(), // template 2 attempt 1 — invalid
      invalidEmptyOptions(), // template 2 attempt 2 (retry) — still invalid
    ]);
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3);

    expect(result).toBeNull();
  });

  it("returns null if provider throws on second template", async () => {
    let calls = 0;
    const provider: GenerationProvider = {
      async generate<T>(_p: { systemPrompt: string; userPrompt: string; schema: object }): Promise<T> {
        calls++;
        if (calls === 1) return validIndividualData() as T; // template 1 OK
        throw new GenerationTimeoutError(30000); // template 2 throws
      },
    };
    const result = await generateDecisionsWithRetry(provider, makeContext(), ALL_TEST_TEMPLATES, 3);

    expect(result).toBeNull();
  });
});

// ── generateDecisions (non-retry version) ─────────────────────────────────────

describe("generateDecisions — low-level function", () => {
  it("returns null without throwing when provider fails", async () => {
    const provider = new ThrowingProvider(new Error("fail"));
    const result = await generateDecisions(provider, makeContext(), [TEST_TEMPLATE_INDIVIDUAL], 3);
    expect(result).toBeNull();
  });

  it("returns valid RoundDecisions on success", async () => {
    const provider = new FixedProvider(validIndividualData());
    const result = await generateDecisions(provider, makeContext(), [TEST_TEMPLATE_INDIVIDUAL], 3);
    expect(result).not.toBeNull();
    expect(result!.individual).toHaveLength(1);
  });
});
