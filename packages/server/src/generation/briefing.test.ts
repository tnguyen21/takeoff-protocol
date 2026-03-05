/**
 * Tests for briefing generation and validation.
 *
 * Invariants tested:
 * - INV-1: Valid briefing (correct word counts, all factions) passes validation
 * - INV-2: Briefing missing a faction fails validation
 * - INV-3: Briefing with common text <150 words fails validation
 * - INV-4: generateBriefingWithRetry returns null on provider timeout (does not throw)
 * - INV-5: generateBriefingWithRetry returns null after two validation failures
 */

import { describe, it, expect } from "bun:test";
import type { Faction } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import type { GenerationProvider, GenerationOptions } from "./provider.js";
import { GenerationTimeoutError } from "./provider.js";
import { validateBriefing } from "./validate.js";
import { generateBriefingWithRetry } from "./briefing.js";
import type { GenerationContext } from "./context.js";
import { ROUND_ARCS } from "./prompts/arcs.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

// 200-word common text (valid: 150–300)
const COMMON_200 = "The artificial intelligence race has reached a critical inflection point. OpenBrain has deployed Agent-Three across thousands of instances, providing a five times research multiplier. Human researchers are watching their own contributions become optional. The gap between what is possible and what anyone publicly admits has never been wider. OpenBrain sits at the frontier, burning cash and burning time. Prometheus holds the safety research advantage but faces a restless board. China has narrowed the gap through unprecedented state investment and is no longer playing catch-up. The United States government has classified frontier AI progress at nuclear secrecy levels. A small inner circle knows what is actually being built. The public thinks this is about productivity software. The public is wrong. Economic disruption is accelerating. Markets respond to rumors before the facts emerge. Diplomatic back-channels are opening. Every faction knows that decisions made in this window will shape how the story ends. The question is not whether a threshold will be crossed. It already has. The question is what happens next when everyone finds out.";

// 60-word faction variant (valid: 40–80)
const VARIANT_60 = "You sit at the center of a race that has moved faster than anyone planned. The decisions you made last round are rippling through the system. Your competitors are watching. Your board is watching. The government is watching. You have leverage you did not have six months ago and a window that is closing. Use it wisely.";

// 30-word common text (invalid: too short)
const COMMON_30 = "The race is real. AI is advancing. Decisions matter. Stakes are high. Every faction must choose carefully. Time is running out. Act now.";

// 25-word faction variant (invalid: too short)
const VARIANT_25 = "You built this technology. Your decisions shaped the race. Now you face the consequences and must choose your final move carefully indeed.";

const VALID_BRIEFING = {
  common: COMMON_200,
  factionVariants: {
    openbrain: VARIANT_60,
    prometheus: VARIANT_60,
    china: VARIANT_60,
    external: VARIANT_60,
  } as Record<Faction, string>,
};

const MISSING_FACTION_BRIEFING = {
  common: COMMON_200,
  factionVariants: {
    openbrain: VARIANT_60,
    prometheus: VARIANT_60,
    china: VARIANT_60,
    // external intentionally missing
  } as Record<Faction, string>,
};

const SHORT_COMMON_BRIEFING = {
  common: COMMON_30,
  factionVariants: {
    openbrain: VARIANT_60,
    prometheus: VARIANT_60,
    china: VARIANT_60,
    external: VARIANT_60,
  } as Record<Faction, string>,
};

// ── makeContext ────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<GenerationContext> = {}): GenerationContext {
  return {
    targetRound: 2,
    storyBible: undefined,
    currentState: { ...INITIAL_STATE },
    players: [],
    firedThresholds: [],
    publications: [],
    history: [],
    roundArc: ROUND_ARCS[2]!,
    playerSlackMessages: {},
    ...overrides,
  };
}

// ── Provider helpers ───────────────────────────────────────────────────────────

class FixedProvider implements GenerationProvider {
  constructor(private readonly data: unknown) {}
  async generate<T>(_params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions }): Promise<T> {
    return this.data as T;
  }
}

class ThrowingProvider implements GenerationProvider {
  constructor(private readonly error: Error) {}
  async generate<T>(_params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions }): Promise<T> {
    throw this.error;
  }
}

/** Returns valid data on call N (1-indexed), invalid on all others */
class ValidOnNthCallProvider implements GenerationProvider {
  private calls = 0;
  constructor(
    private readonly validData: unknown,
    private readonly invalidData: unknown,
    private readonly validOnCall: number,
  ) {}
  async generate<T>(_params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions }): Promise<T> {
    this.calls++;
    return (this.calls === this.validOnCall ? this.validData : this.invalidData) as T;
  }
}

// ── INV-1: Valid briefing passes validation ────────────────────────────────────

describe("validateBriefing — INV-1: valid briefing passes", () => {
  it("accepts a briefing with correct word counts and all factions", () => {
    const result = validateBriefing(VALID_BRIEFING);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ── INV-2: Missing faction fails validation ────────────────────────────────────

describe("validateBriefing — INV-2: missing faction", () => {
  it("rejects a briefing that is missing the external faction", () => {
    const result = validateBriefing(MISSING_FACTION_BRIEFING);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("external"))).toBe(true);
  });
});

// ── INV-3: Short common text fails validation ──────────────────────────────────

describe("validateBriefing — INV-3: common text too short", () => {
  it("rejects a briefing where common has fewer than 150 words", () => {
    const result = validateBriefing(SHORT_COMMON_BRIEFING);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("common text has"))).toBe(true);
  });
});

// ── Additional validation edge cases ─────────────────────────────────────────

describe("validateBriefing — edge cases", () => {
  it("rejects empty common string", () => {
    const result = validateBriefing({ ...VALID_BRIEFING, common: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("empty"))).toBe(true);
  });

  it("rejects common text over 300 words", () => {
    const over300 = (COMMON_200 + " " + COMMON_200).split(" ").slice(0, 310).join(" ");
    const result = validateBriefing({ ...VALID_BRIEFING, common: over300 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("maximum 300"))).toBe(true);
  });

  it("rejects faction variant under 40 words", () => {
    const result = validateBriefing({
      ...VALID_BRIEFING,
      factionVariants: { ...VALID_BRIEFING.factionVariants, openbrain: VARIANT_25 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("openbrain") && e.includes("minimum 40"))).toBe(true);
  });

  it("rejects empty faction variant string", () => {
    const result = validateBriefing({
      ...VALID_BRIEFING,
      factionVariants: { ...VALID_BRIEFING.factionVariants, china: "" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("china") && e.includes("empty"))).toBe(true);
  });
});

// ── INV-4: Provider timeout → null ────────────────────────────────────────────

describe("generateBriefingWithRetry — INV-4: provider timeout", () => {
  it("returns null when provider throws GenerationTimeoutError (does not throw)", async () => {
    const provider = new ThrowingProvider(new GenerationTimeoutError(30000));
    const result = await generateBriefingWithRetry(provider, makeContext());
    expect(result).toBeNull();
  });
});

// ── INV-5: Two validation failures → null ─────────────────────────────────────

describe("generateBriefingWithRetry — INV-5: two validation failures", () => {
  it("returns null after two attempts both produce invalid briefings", async () => {
    const provider = new FixedProvider(SHORT_COMMON_BRIEFING);
    const result = await generateBriefingWithRetry(provider, makeContext());
    expect(result).toBeNull();
  });
});

// ── Happy path: valid data returned as-is ────────────────────────────────────

describe("generateBriefingWithRetry — happy path", () => {
  it("returns valid briefing on first attempt", async () => {
    const provider = new FixedProvider(VALID_BRIEFING);
    const result = await generateBriefingWithRetry(provider, makeContext());
    expect(result).not.toBeNull();
    expect(result!.common).toBe(VALID_BRIEFING.common);
    expect(result!.factionVariants.openbrain).toBe(VARIANT_60);
  });
});

// ── Retry path: first invalid, second valid ────────────────────────────────────

describe("generateBriefingWithRetry — retry path", () => {
  it("returns second attempt when first attempt fails validation but second succeeds", async () => {
    const provider = new ValidOnNthCallProvider(VALID_BRIEFING, SHORT_COMMON_BRIEFING, 2);
    const result = await generateBriefingWithRetry(provider, makeContext());
    expect(result).not.toBeNull();
    expect(result!.common).toBe(VALID_BRIEFING.common);
  });
});

// ── Failure mode: wrong shape ─────────────────────────────────────────────────

describe("generateBriefingWithRetry — wrong shape", () => {
  it("returns null when provider returns valid JSON but wrong shape (missing factionVariants)", async () => {
    const wrongShape = { common: COMMON_200 }; // missing factionVariants
    const provider = new FixedProvider(wrongShape);
    const result = await generateBriefingWithRetry(provider, makeContext());
    expect(result).toBeNull();
  });

  it("returns null when provider returns a briefing with 0-word common", async () => {
    const zeroWords = {
      common: "",
      factionVariants: VALID_BRIEFING.factionVariants,
    };
    const provider = new FixedProvider(zeroWords);
    const result = await generateBriefingWithRetry(provider, makeContext());
    expect(result).toBeNull();
  });
});
