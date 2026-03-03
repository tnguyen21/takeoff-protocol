import { describe, it, expect } from "bun:test";
import type { AppContent, ContentItem, Faction, StateVariables } from "@takeoff/shared";
import type { GenerationContext } from "./context.js";
import type { GenerationOptions, GenerationProvider } from "./provider.js";
import { MockProvider, GenerationParseError } from "./provider.js";
import { validateContent, validateFogSafety } from "./validate.js";
import { generateContent, generateContentWithRetry } from "./content.js";
import { ROUND_ARCS } from "./prompts/arcs.js";

// ── Shared test fixtures ──────────────────────────────────────────────────────

/** Minimal valid StateVariables for testing. All zeros except where tests need specific values. */
const BASE_STATE: StateVariables = {
  obCapability: 55,
  promCapability: 48,
  chinaCapability: 40,
  usChinaGap: 12,
  obPromGap: 7,
  alignmentConfidence: 65,
  misalignmentSeverity: 30,
  publicAwareness: 20,
  publicSentiment: 10,
  economicDisruption: 15,
  taiwanTension: 25,
  obInternalTrust: 70,
  securityLevelOB: 3,
  securityLevelProm: 2,
  intlCooperation: 45,
  marketIndex: 120,
  regulatoryPressure: 40,
  globalMediaCycle: 1,
  chinaWeightTheftProgress: 45,
  aiAutonomyLevel: 20,
  whistleblowerPressure: 30,
  openSourceMomentum: 35,
  doomClockDistance: 4,
  obMorale: 75,
  obBurnRate: 40,
  obBoardConfidence: 60,
  promMorale: 65,
  promBurnRate: 35,
  promBoardConfidence: 55,
  promSafetyBreakthroughProgress: 25,
  cdzComputeUtilization: 80,
  ccpPatience: 60,
  domesticChipProgress: 50,
};

const BASE_CONTEXT: GenerationContext = {
  storyBible: undefined,
  currentState: BASE_STATE,
  history: [],
  players: [],
  firedThresholds: [],
  publications: [],
  targetRound: 3,
  roundArc: ROUND_ARCS[3]!,
};

/** Build a valid ContentItem. */
function makeItem(
  overrides: Partial<ContentItem> & Pick<ContentItem, "id" | "type" | "classification">,
): ContentItem {
  return {
    round: 3,
    body: "Sample content body that is non-empty.",
    timestamp: "2027-07-01T09:00:00Z",
    ...overrides,
  };
}

/**
 * Build a set of items that satisfies the classification budget (per validateContent):
 * 3 critical, 5 context, 1 red-herring, 1 breadcrumb → 10 items is short.
 * We need 15-30 total, so pad with extra context items.
 */
function makeValidItemSet(faction: Faction, round = 3): ContentItem[] {
  const items: ContentItem[] = [];
  // 3 critical
  for (let i = 0; i < 3; i++) {
    items.push(
      makeItem({ id: `gen-c${i}`, type: "headline", classification: "critical", round }),
    );
  }
  // 7 context
  for (let i = 0; i < 7; i++) {
    items.push(
      makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round }),
    );
  }
  // 1 red-herring
  items.push(makeItem({ id: "gen-rh0", type: "headline", classification: "red-herring", round }));
  // 4 breadcrumb (fills total to 15)
  for (let i = 0; i < 4; i++) {
    items.push(
      makeItem({ id: `gen-bc${i}`, type: "headline", classification: "breadcrumb", round }),
    );
  }
  return items; // 15 items total
}

// ── INV-1: Valid content passes validation ────────────────────────────────────

describe("INV-1: validateContent — valid items pass", () => {
  it("passes when classification budget and total count are within bounds", () => {
    const items = makeValidItemSet("openbrain");
    const result = validateContent(items, "openbrain", 3);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("passes with maximum allowed counts (5 critical, 10 context, 2 red-herring)", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 5; i++)
      items.push(makeItem({ id: `gen-c${i}`, type: "headline", classification: "critical", round: 3 }));
    for (let i = 0; i < 10; i++)
      items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round: 3 }));
    for (let i = 0; i < 2; i++)
      items.push(makeItem({ id: `gen-rh${i}`, type: "headline", classification: "red-herring", round: 3 }));
    // 17 items
    const result = validateContent(items, "prometheus", 3);
    expect(result.valid).toBe(true);
  });
});

// ── INV-2: Content with <3 critical items fails ───────────────────────────────

describe("INV-2: validateContent — rejects insufficient critical items", () => {
  it("fails when only 2 critical items are present", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 2; i++)
      items.push(makeItem({ id: `gen-c${i}`, type: "headline", classification: "critical", round: 3 }));
    for (let i = 0; i < 8; i++)
      items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round: 3 }));
    for (let i = 0; i < 2; i++)
      items.push(makeItem({ id: `gen-rh${i}`, type: "headline", classification: "red-herring", round: 3 }));
    for (let i = 0; i < 3; i++)
      items.push(makeItem({ id: `gen-bc${i}`, type: "headline", classification: "breadcrumb", round: 3 }));

    const result = validateContent(items, "openbrain", 3);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("critical"))).toBe(true);
  });

  it("fails when 0 critical items are present", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 15; i++)
      items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round: 3 }));

    const result = validateContent(items, "china");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("critical"))).toBe(true);
  });
});

// ── INV-3: Content with >30 total items fails ─────────────────────────────────

describe("INV-3: validateContent — rejects too many items", () => {
  it("fails when 31 items are provided", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 3; i++)
      items.push(makeItem({ id: `gen-c${i}`, type: "headline", classification: "critical", round: 3 }));
    for (let i = 0; i < 26; i++)
      items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round: 3 }));
    for (let i = 0; i < 2; i++)
      items.push(makeItem({ id: `gen-rh${i}`, type: "headline", classification: "red-herring", round: 3 }));
    // 31 items total

    const result = validateContent(items, "external");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("max 30"))).toBe(true);
  });

  it("fails when array has fewer than 15 items", () => {
    const items = makeValidItemSet("openbrain").slice(0, 5);
    const result = validateContent(items, "openbrain");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("≥15"))).toBe(true);
  });
});

// ── INV-4: Generated items have "gen-" id prefix ─────────────────────────────

describe("INV-4: generateContent — all item IDs start with 'gen-'", () => {
  it("prefixes IDs that lack the 'gen-' prefix", async () => {
    // MockProvider returns items with IDs that do NOT have the gen- prefix
    const rawItems: ContentItem[] = [
      makeItem({ id: "r3-ob-news-001", type: "headline", classification: "critical", round: 3 }),
      makeItem({ id: "r3-ob-news-002", type: "headline", classification: "context", round: 3 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["news"]);

    for (const appContent of result) {
      for (const item of appContent.items) {
        expect(item.id.startsWith("gen-")).toBe(true);
      }
    }
  });

  it("preserves IDs that already have the 'gen-' prefix", async () => {
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-already-prefixed", type: "headline", classification: "critical", round: 3 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["news"]);
    expect(result[0]!.items[0]!.id).toBe("gen-already-prefixed");
  });

  it("sets round to targetRound even when provider returns wrong round", async () => {
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-item-1", type: "headline", classification: "context", round: 99 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["news"]);
    expect(result[0]!.items[0]!.round).toBe(BASE_CONTEXT.targetRound);
  });

  it("sets correct type for news app regardless of what provider returns", async () => {
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-item-1", type: "tweet", classification: "context", round: 3 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["news"]);
    expect(result[0]!.items[0]!.type).toBe("headline");
  });

  it("sets correct type for twitter app", async () => {
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-item-1", type: "headline", classification: "context", round: 3 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["twitter"]);
    expect(result[0]!.items[0]!.type).toBe("tweet");
  });
});

// ── INV-5: Fog-safe check warns on hidden variable values ─────────────────────

describe("INV-5: validateFogSafety — warns when hidden variable value appears near keyword", () => {
  it("warns when chinaWeightTheftProgress value appears near 'theft' keyword for openbrain", () => {
    // chinaWeightTheftProgress=45 is hidden from openbrain (see fog.ts)
    const state: StateVariables = { ...BASE_STATE, chinaWeightTheftProgress: 45 };
    const items: ContentItem[] = [
      makeItem({
        id: "gen-test-1",
        type: "headline",
        classification: "context",
        body: "Analysts note concerning theft activity with progress indicators at 45 percent threshold.",
        round: 3,
      }),
    ];

    const result = validateFogSafety(items, state, "openbrain");
    // Must return only warnings, not errors (it's a heuristic)
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("45");
  });

  it("does not warn when the value appears without any related keyword", () => {
    const state: StateVariables = { ...BASE_STATE, chinaWeightTheftProgress: 45 };
    const items: ContentItem[] = [
      makeItem({
        id: "gen-test-2",
        type: "headline",
        classification: "context",
        // "45" appears, but no weight/theft/progress keywords near it
        body: "There are 45 countries represented at the summit today.",
        round: 3,
      }),
    ];

    const result = validateFogSafety(items, state, "openbrain");
    expect(result.warnings).toHaveLength(0);
  });

  it("never returns hard errors — only warnings", () => {
    const state: StateVariables = { ...BASE_STATE, chinaWeightTheftProgress: 45 };
    // Deliberately suspicious body
    const items: ContentItem[] = [
      makeItem({
        id: "gen-test-3",
        type: "headline",
        classification: "critical",
        body: "BREAKING: China weight theft progress hits 45, sources confirm",
        round: 3,
      }),
    ];

    const result = validateFogSafety(items, state, "openbrain");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("does not warn for variables that are visible (not hidden) to the faction", () => {
    // obCapability is exact for openbrain — should never trigger a fog warning
    const state: StateVariables = { ...BASE_STATE, obCapability: 55 };
    const items: ContentItem[] = [
      makeItem({
        id: "gen-test-4",
        type: "headline",
        classification: "context",
        body: "OpenBrain capability reaches 55 — an exact measurement confirms agent-level progress.",
        round: 3,
      }),
    ];

    const result = validateFogSafety(items, state, "openbrain");
    // obCapability is not hidden from openbrain, so no fog warning
    expect(result.warnings).toHaveLength(0);
  });

  it("checks faction-specific fog — same value may be hidden for one faction but not another", () => {
    // chinaWeightTheftProgress is visible to china (exact), hidden to openbrain
    const state: StateVariables = { ...BASE_STATE, chinaWeightTheftProgress: 45 };
    const body = "Theft operation progress: 45% completion confirmed.";
    const items: ContentItem[] = [
      makeItem({ id: "gen-test-5", type: "headline", classification: "context", body, round: 3 }),
    ];

    // Should warn for openbrain (hidden)
    const obResult = validateFogSafety(items, state, "openbrain");
    expect(obResult.warnings.length).toBeGreaterThan(0);

    // Should NOT warn for china (visible)
    const chinaResult = validateFogSafety(items, state, "china");
    expect(chinaResult.warnings).toHaveLength(0);
  });
});

// ── Happy path: provider returns valid content ────────────────────────────────

describe("Happy path: generateContent succeeds with valid mock data", () => {
  it("returns AppContent[] with one entry per app", async () => {
    const newsItems = makeValidItemSet("openbrain").map((i) => ({ ...i, type: "headline" as const }));
    const twitterItems = makeValidItemSet("openbrain").map((i) => ({ ...i, type: "tweet" as const }));

    // Provider needs to be called twice — once for news, once for twitter
    // Use a sequence-aware mock
    let callCount = 0;
    const sequenceProvider: GenerationProvider = {
      async generate<T>(_params: {
        systemPrompt: string;
        userPrompt: string;
        schema: object;
        options?: GenerationOptions;
      }): Promise<T> {
        const resp = callCount === 0 ? { items: newsItems } : { items: twitterItems };
        callCount++;
        return resp as T;
      },
    };

    const result = await generateContent(sequenceProvider, BASE_CONTEXT, "openbrain", ["news", "twitter"]);

    expect(result).toHaveLength(2);
    expect(result[0]!.app).toBe("news");
    expect(result[0]!.faction).toBe("openbrain");
    expect(result[1]!.app).toBe("twitter");
    expect(result[1]!.faction).toBe("openbrain");
  });

  it("strips condition field from generated items", async () => {
    const itemWithCondition = {
      ...makeItem({ id: "gen-item-1", type: "headline" as const, classification: "context" }),
      condition: { variable: "obCapability" as const, operator: "gt" as const, value: 50 },
    };
    const provider = new MockProvider({ items: [itemWithCondition] });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["news"]);

    const item = result[0]!.items[0]!;
    expect("condition" in item).toBe(false);
  });
});

// ── Budget violation: retry succeeds ─────────────────────────────────────────

describe("Budget violation: generateContentWithRetry retries on validation failure", () => {
  it("succeeds on second attempt when first attempt has too few critical items", async () => {
    // First call: items with only 2 critical (fails budget check)
    const invalidItems = makeValidItemSet("openbrain").map((item) =>
      item.classification === "critical" && item.id.endsWith("2")
        ? { ...item, classification: "context" as const }
        : item,
    );
    // Ensure we have exactly 2 critical by patching:
    const patchedInvalidItems = invalidItems.map((item, idx) =>
      item.classification === "critical" && idx > 0 ? { ...item, classification: "context" as const } : item,
    );

    // Second call: valid items
    const validItems = makeValidItemSet("openbrain");

    let callCount = 0;
    const sequenceProvider: GenerationProvider = {
      async generate<T>(_params: {
        systemPrompt: string;
        userPrompt: string;
        schema: object;
        options?: GenerationOptions;
      }): Promise<T> {
        const resp = callCount === 0 ? { items: patchedInvalidItems } : { items: validItems };
        callCount++;
        return resp as T;
      },
    };

    const result = await generateContentWithRetry(sequenceProvider, BASE_CONTEXT, "openbrain", ["news"]);

    expect(result).not.toBeNull();
    expect(callCount).toBe(2); // Both calls were made
  });

  it("returns null when both attempts fail validation", async () => {
    // Always returns too-few items (< 15 total)
    const tooFewItems = [makeItem({ id: "gen-only-one", type: "headline", classification: "context", round: 3 })];
    const provider = new MockProvider({ items: tooFewItems });

    const result = await generateContentWithRetry(provider, BASE_CONTEXT, "openbrain", ["news"]);
    expect(result).toBeNull();
  });

  it("returns null when provider throws on first call", async () => {
    const provider = new MockProvider(null); // throws GenerationParseError
    const result = await generateContentWithRetry(provider, BASE_CONTEXT, "openbrain", ["news"]);
    expect(result).toBeNull();
  });
});

// ── Failure modes ─────────────────────────────────────────────────────────────

describe("Failure modes: validation catches structural violations", () => {
  it("catches wrong round number in items", () => {
    // Items with round=2 but target is 3
    const items = makeValidItemSet("openbrain", 2); // round=2
    const result = validateContent(items, "openbrain", 3);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("round"))).toBe(true);
  });

  it("catches empty array (< 15 items)", () => {
    const result = validateContent([], "openbrain");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("≥15"))).toBe(true);
  });

  it("catches items with empty body", () => {
    const items = makeValidItemSet("openbrain");
    items[0]!.body = "";
    const result = validateContent(items, "openbrain", 3);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("empty body"))).toBe(true);
  });

  it("generates correct app structure (AppContent entries per app)", async () => {
    const newsItems = makeValidItemSet("openbrain").map((i) => ({ ...i, type: "headline" as const }));
    const provider = new MockProvider({ items: newsItems });
    const result = await generateContent(provider, BASE_CONTEXT, "china", ["news"]);

    expect(result).toHaveLength(1);
    const appContent: AppContent = result[0]!;
    expect(appContent.app).toBe("news");
    expect(appContent.faction).toBe("china");
    expect(Array.isArray(appContent.items)).toBe(true);
  });

  it("throws for unsupported app ID", async () => {
    const provider = new MockProvider({ items: [] });
    await expect(
      generateContent(provider, BASE_CONTEXT, "openbrain", ["slack" as "news"]),
    ).rejects.toThrow("not supported");
  });
});

// ── Context round arc ─────────────────────────────────────────────────────────

describe("Context: round arcs are defined and usable", () => {
  it("uses the round arc from context in generation (round 2)", async () => {
    const context: GenerationContext = {
      ...BASE_CONTEXT,
      targetRound: 2,
      roundArc: ROUND_ARCS[2]!,
    };
    const newsItems = makeValidItemSet("openbrain").map((i) => ({ ...i, type: "headline" as const, round: 2 }));
    const provider = new MockProvider({ items: newsItems });
    const result = await generateContent(provider, context, "openbrain", ["news"]);

    // Items should be forced to round 2
    for (const item of result[0]!.items) {
      expect(item.round).toBe(2);
    }
  });
});
