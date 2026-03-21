import { describe, it, expect } from "bun:test";
import type { AppContent, ContentItem, Faction, StateVariables } from "@takeoff/shared";
import type { GenerationContext } from "./context.js";
import type { GenerationOptions, GenerationProvider } from "./provider.js";
import { MockProvider } from "./provider.js";
import { validateContent, validateFogSafety, scrubFogLeaks, contentBudget } from "./validate.js";
import { generateContent, generateContentWithRetry, forceSlackChannel, VALID_SLACK_CHANNELS } from "./content.js";
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
  playerSlackMessages: {},
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
function makeValidItemSet(_faction: Faction, round = 3): ContentItem[] {
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

// ── INV-2: Classification budget is now soft (warnings, not errors) ───────────

describe("INV-2: validateContent — classification budget violations are warnings", () => {
  it("warns (but passes) when only 2 critical items are present", () => {
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
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("critical"))).toBe(true);
  });

  it("warns (but passes) when 0 critical items are present", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 15; i++)
      items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round: 3 }));

    const result = validateContent(items, "china");
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("critical"))).toBe(true);
  });
});

// ── INV-3: Hard reject only for grossly out-of-range totals ───────────────────

describe("INV-3: validateContent — total count bounds", () => {
  it("passes with 55 items (over soft max, under hard max)", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 6; i++)
      items.push(makeItem({ id: `gen-c${i}`, type: "headline", classification: "critical", round: 3 }));
    for (let i = 0; i < 45; i++)
      items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round: 3 }));
    for (let i = 0; i < 4; i++)
      items.push(makeItem({ id: `gen-rh${i}`, type: "headline", classification: "red-herring", round: 3 }));
    // 55 items total — over soft max (50) but under hard max (100)

    const result = validateContent(items, "external");
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("total items"))).toBe(true);
  });

  it("fails when array has fewer than 50% of minimum", () => {
    const items = makeValidItemSet("openbrain").slice(0, 5);
    const result = validateContent(items, "openbrain");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("total items"))).toBe(true);
  });

  it("fails when array exceeds 2x maximum", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 105; i++)
      items.push(makeItem({ id: `gen-x${i}`, type: "headline", classification: "context", round: 3 }));
    // 105 items > 2 * maxTotal (2 * 50 = 100) → hard error
    const result = validateContent(items, "openbrain");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("total items"))).toBe(true);
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

// ── scrubFogLeaks: deterministic fog leak removal ────────────────────────────

describe("scrubFogLeaks — replaces hidden variable values near keywords", () => {
  it("replaces leaked value with offset (+3)", () => {
    const state: StateVariables = { ...BASE_STATE, chinaWeightTheftProgress: 45 };
    const items: ContentItem[] = [
      makeItem({
        id: "gen-scrub-1",
        type: "headline",
        classification: "context",
        body: "Intelligence agencies report weight theft progress at 45 percent.",
        round: 3,
      }),
    ];

    const { items: scrubbed, scrubCount } = scrubFogLeaks(items, state, "openbrain");
    expect(scrubCount).toBe(1);
    expect(scrubbed[0]!.body).not.toContain("45");
    expect(scrubbed[0]!.body).toContain("48"); // 45 + 3
  });

  it("does not scrub values not near keywords", () => {
    const state: StateVariables = { ...BASE_STATE, chinaWeightTheftProgress: 45 };
    const items: ContentItem[] = [
      makeItem({
        id: "gen-scrub-2",
        type: "headline",
        classification: "context",
        body: "There are 45 countries represented at the summit today.",
        round: 3,
      }),
    ];

    const { items: scrubbed, scrubCount } = scrubFogLeaks(items, state, "openbrain");
    expect(scrubCount).toBe(0);
    expect(scrubbed[0]!.body).toContain("45");
  });

  it("does not scrub visible variables", () => {
    const state: StateVariables = { ...BASE_STATE, obCapability: 55 };
    const items: ContentItem[] = [
      makeItem({
        id: "gen-scrub-3",
        type: "headline",
        classification: "context",
        body: "OpenBrain capability reaches 55 on internal benchmarks.",
        round: 3,
      }),
    ];

    const { items: scrubbed, scrubCount } = scrubFogLeaks(items, state, "openbrain");
    expect(scrubCount).toBe(0);
    expect(scrubbed[0]!.body).toContain("55");
  });

  it("clamps replacement to variable range max", () => {
    // chinaWeightTheftProgress range is [0, 100], value 99 + 3 = 102 → clamped to 100
    // but 100 !== 99, so it stays at 100... actually let's use 98 to be clearer
    const state: StateVariables = { ...BASE_STATE, chinaWeightTheftProgress: 99 };
    const items: ContentItem[] = [
      makeItem({
        id: "gen-scrub-4",
        type: "headline",
        classification: "context",
        body: "Weight theft progress estimated at 99 percent completion.",
        round: 3,
      }),
    ];

    const { items: scrubbed, scrubCount } = scrubFogLeaks(items, state, "openbrain");
    expect(scrubCount).toBe(1);
    expect(scrubbed[0]!.body).not.toContain("99");
    // 99 + 3 = 102, clamped to 100
    expect(scrubbed[0]!.body).toContain("100");
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
  it("succeeds on first attempt when classification budget is off (now soft warning)", async () => {
    // Items with only 2 critical — was a hard error, now a warning
    const items = makeValidItemSet("openbrain").map((item) =>
      item.classification === "critical" && item.id.endsWith("2")
        ? { ...item, classification: "context" as const }
        : item,
    );
    const provider = new MockProvider({ items });
    const result = await generateContentWithRetry(provider, BASE_CONTEXT, "openbrain", ["news"]);
    expect(result).not.toBeNull();
  });

  it("retries when structural violation (empty body) on first attempt, succeeds on second", async () => {
    // First call: items with an empty body (hard error)
    const invalidItems = makeValidItemSet("openbrain").map((item, idx) =>
      idx === 0 ? { ...item, body: "" } : item,
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
        const resp = callCount === 0 ? { items: invalidItems } : { items: validItems };
        callCount++;
        return resp as T;
      },
    };

    const result = await generateContentWithRetry(sequenceProvider, BASE_CONTEXT, "openbrain", ["news"]);
    expect(result).not.toBeNull();
    expect(callCount).toBe(2);
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

  it("catches empty array (below hard minimum)", () => {
    const result = validateContent([], "openbrain");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("total items"))).toBe(true);
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

  it("throws for unsupported app ID (gamestate)", async () => {
    const provider = new MockProvider({ items: [] });
    await expect(
      generateContent(provider, BASE_CONTEXT, "openbrain", ["gamestate" as "news"]),
    ).rejects.toThrow("not supported");
  });

  it("throws for unsupported app ID (sheets)", async () => {
    const provider = new MockProvider({ items: [] });
    await expect(
      generateContent(provider, BASE_CONTEXT, "openbrain", ["sheets" as "news"]),
    ).rejects.toThrow("not supported");
  });

  it("throws for unsupported app ID (compute)", async () => {
    const provider = new MockProvider({ items: [] });
    await expect(
      generateContent(provider, BASE_CONTEXT, "openbrain", ["compute" as "news"]),
    ).rejects.toThrow("not supported");
  });
});

// ── INV-1 (new apps): APP_TYPE_MAP covers all 6 new apps ─────────────────────

describe("INV-1 (new apps): each new app produces items with the correct type after post-processing", () => {
  const newAppCases: Array<{ app: Parameters<typeof generateContent>[3][0]; expectedType: ContentItem["type"] }> = [
    { app: "slack", expectedType: "message" },
    { app: "email", expectedType: "document" },
    { app: "substack", expectedType: "document" },
    { app: "memo", expectedType: "memo" },
    { app: "signal", expectedType: "message" },
    { app: "intel", expectedType: "document" },
    { app: "bloomberg", expectedType: "row" },
    { app: "arxiv", expectedType: "document" },
  ];

  for (const { app, expectedType } of newAppCases) {
    it(`${app} → type="${expectedType}" (forceType corrects wrong provider output)`, async () => {
      // Provider returns wrong type — forceType must correct it
      const rawItems: ContentItem[] = [
        makeItem({ id: "gen-item-1", type: "headline", classification: "context", round: 3 }),
      ];
      const provider = new MockProvider({ items: rawItems });
      const result = await generateContent(provider, BASE_CONTEXT, "openbrain", [app]);
      expect(result[0]!.items[0]!.type).toBe(expectedType);
    });
  }
});

describe("INV-2 (new apps): post-processing invariants hold for all new app types", () => {
  it("ensureGenPrefix and forceRound work for slack items", async () => {
    const rawItems: ContentItem[] = [
      makeItem({ id: "bad-id", type: "message", classification: "context", round: 99 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["slack"]);
    const item = result[0]!.items[0]!;
    expect(item.id.startsWith("gen-")).toBe(true);
    expect(item.round).toBe(BASE_CONTEXT.targetRound);
  });

  it("condition field is stripped for email items", async () => {
    const itemWithCondition = {
      ...makeItem({ id: "gen-email-1", type: "document" as const, classification: "context" }),
      condition: { variable: "obCapability" as const, operator: "gt" as const, value: 50 },
    };
    const provider = new MockProvider({ items: [itemWithCondition] });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["email"]);
    expect("condition" in result[0]!.items[0]!).toBe(false);
  });

  it("substack items preserve subject and sender when provider supplies them", async () => {
    const substackItem: ContentItem = {
      ...makeItem({ id: "gen-substack-1", type: "document", classification: "context", round: 3 }),
      sender: "The World Feed",
      subject: "Frontier Labs Enter a New Phase",
    };
    const provider = new MockProvider({ items: [substackItem] });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["substack"]);
    const item = result[0]!.items[0]!;
    expect(item.sender).toBe("The World Feed");
    expect(item.subject).toBe("Frontier Labs Enter a New Phase");
  });
});

describe("INV-3 (new apps): unsupported apps still throw", () => {
  it("wandb throws not supported", async () => {
    const provider = new MockProvider({ items: [] });
    await expect(
      generateContent(provider, BASE_CONTEXT, "openbrain", ["wandb" as "news"]),
    ).rejects.toThrow("not supported");
  });
});

describe("Critical paths: new app content structure", () => {
  it("slack items preserve sender and channel when provider supplies them", async () => {
    const slackItem: ContentItem = {
      ...makeItem({ id: "gen-slack-1", type: "message", classification: "context", round: 3 }),
      sender: "@alice",
      channel: "#research",
    };
    const provider = new MockProvider({ items: [slackItem] });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["slack"]);
    const item = result[0]!.items[0]!;
    expect(item.sender).toBe("@alice");
    expect(item.channel).toBe("#research");
  });

  it("email items preserve sender and subject when provider supplies them", async () => {
    const emailItem: ContentItem = {
      ...makeItem({ id: "gen-email-1", type: "document", classification: "context", round: 3 }),
      sender: "ceo@openbrain.ai",
      subject: "Q3 Safety Review",
    };
    const provider = new MockProvider({ items: [emailItem] });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["email"]);
    const item = result[0]!.items[0]!;
    expect(item.sender).toBe("ceo@openbrain.ai");
    expect(item.subject).toBe("Q3 Safety Review");
  });

  it("intel items preserve subject when provider supplies it", async () => {
    const intelItem: ContentItem = {
      ...makeItem({ id: "gen-intel-1", type: "document", classification: "critical", round: 3 }),
      subject: "ASSESSMENT: China AI Capability Gap",
    };
    const provider = new MockProvider({ items: [intelItem] });
    const result = await generateContent(provider, BASE_CONTEXT, "external", ["intel"]);
    const item = result[0]!.items[0]!;
    expect(item.subject).toBe("ASSESSMENT: China AI Capability Gap");
  });

  it("slack items missing sender do not crash post-processing", async () => {
    // Sender is LLM-provided, not post-processed — missing sender should not throw
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-slack-nosender", type: "message", classification: "context", round: 3 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["slack"]);
    expect(result[0]!.items[0]!.type).toBe("message");
    expect(result[0]!.items[0]!.sender).toBeUndefined();
  });

  it("memo items preserve subject when provider supplies it", async () => {
    const memoItem: ContentItem = {
      ...makeItem({ id: "gen-memo-1", type: "memo", classification: "context", round: 3 }),
      subject: "RE: Safety Review Q3",
      sender: "director@openbrain.ai",
    };
    const provider = new MockProvider({ items: [memoItem] });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["memo"]);
    const item = result[0]!.items[0]!;
    expect(item.subject).toBe("RE: Safety Review Q3");
    expect(item.sender).toBe("director@openbrain.ai");
  });

  it("memo items without subject do not crash post-processing (subject remains undefined)", async () => {
    // MemoApp falls back to "Untitled Document" for missing subject — post-processing must not throw
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-memo-nosubject", type: "memo", classification: "context", round: 3 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["memo"]);
    const item = result[0]!.items[0]!;
    expect(item.type).toBe("memo");
    expect(item.subject).toBeUndefined();
  });

  it("bloomberg items have row type after post-processing", async () => {
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-bb-1", type: "headline", classification: "context", round: 3 }),
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["bloomberg"]);
    expect(result[0]!.items[0]!.type).toBe("row");
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

// ── contentBudget: scaling by appCount ───────────────────────────────────────

describe("contentBudget — scales budgets by appCount", () => {
  it("returns baseline budgets when appCount is undefined (INV-1)", () => {
    const b = contentBudget(undefined);
    expect(b.minTotal).toBe(25);
    expect(b.maxTotal).toBe(50);
    expect(b.minCritical).toBe(5);
    expect(b.maxCritical).toBe(10);
    expect(b.minContext).toBe(10);
    expect(b.maxContext).toBe(25);
    expect(b.minRedHerring).toBe(2);
    expect(b.maxRedHerring).toBe(5);
  });

  it("returns baseline budgets when appCount=2 (INV-1)", () => {
    const b = contentBudget(2);
    expect(b.minTotal).toBe(25);
    expect(b.maxTotal).toBe(50);
    expect(b.minCritical).toBe(5);
    expect(b.maxCritical).toBe(10);
    expect(b.minContext).toBe(10);
    expect(b.maxContext).toBe(25);
    expect(b.minRedHerring).toBe(2);
    expect(b.maxRedHerring).toBe(5);
  });

  it("scales to 4x for appCount=8 (INV-2: scale=ceil(8/2)=4)", () => {
    const b = contentBudget(8);
    expect(b.minTotal).toBe(100);
    expect(b.maxTotal).toBe(200);
    expect(b.minCritical).toBe(20);
    expect(b.maxCritical).toBe(40);
    expect(b.minContext).toBe(40);
    expect(b.maxContext).toBe(100);
    expect(b.minRedHerring).toBe(8);
    expect(b.maxRedHerring).toBe(20);
  });

  it("uses scale=2 for appCount=3 (ceil(3/2)=2)", () => {
    const b = contentBudget(3);
    expect(b.minTotal).toBe(50);
    expect(b.maxTotal).toBe(100);
    expect(b.minCritical).toBe(10);
    expect(b.maxCritical).toBe(20);
  });
});

// ── validateContent with appCount ─────────────────────────────────────────────

/** Build a valid item set for N apps (appCount > 2). Scale = ceil(N/2). */
function makeScaledItemSet(_faction: Faction, appCount: number, round = 3): ContentItem[] {
  const scale = Math.ceil(appCount / 2);
  const items: ContentItem[] = [];
  for (let i = 0; i < 5 * scale; i++)
    items.push(makeItem({ id: `gen-c${i}`, type: "headline", classification: "critical", round }));
  for (let i = 0; i < 12 * scale; i++)
    items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round }));
  for (let i = 0; i < 2 * scale; i++)
    items.push(makeItem({ id: `gen-rh${i}`, type: "headline", classification: "red-herring", round }));
  for (let i = 0; i < 4; i++)
    items.push(makeItem({ id: `gen-bc${i}`, type: "headline", classification: "breadcrumb", round }));
  return items;
}

describe("validateContent with appCount (backward compat + scaling)", () => {
  it("INV-1: appCount=2 passes with standard 15-item set", () => {
    const items = makeValidItemSet("openbrain");
    const result = validateContent(items, "openbrain", 3, 2);
    expect(result.valid).toBe(true);
  });

  it("INV-1: appCount=undefined passes with standard 15-item set (backward compat)", () => {
    const items = makeValidItemSet("openbrain");
    const result = validateContent(items, "openbrain", 3, undefined);
    expect(result.valid).toBe(true);
  });

  it("INV-2: appCount=8 accepts items that satisfy scaled budget", () => {
    // makeScaledItemSet gives 5*4=20 crit, 12*4=48 ctx, 2*4=8 rh, 4 bc = 80 items
    // scaled minTotal=100 → 80 is below min but above hard min (50). Add more context.
    const items = makeScaledItemSet("openbrain", 8);
    const extra = 20;
    for (let i = 0; i < extra; i++)
      items.push(makeItem({ id: `gen-extra${i}`, type: "headline", classification: "context", round: 3 }));
    // Now: 20 crit, 68 ctx, 8 rh, 4 bc = 100 total ✓
    const result = validateContent(items, "openbrain", 3, 8);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("INV-2: appCount=8 hard-rejects when below 50% of scaled minimum", () => {
    // 15 items for appCount=8 → scaled minTotal=100, hard min = 50. 15 < 50 → error.
    const items = makeValidItemSet("openbrain"); // 15 items
    const result = validateContent(items, "openbrain", 3, 8);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("total items"))).toBe(true);
  });

  it("INV-3: per-item structural validation is unchanged regardless of appCount", () => {
    const items = makeScaledItemSet("openbrain", 8);
    // Add padding to hit minimum
    for (let i = 0; i < 15; i++)
      items.push(makeItem({ id: `gen-pad${i}`, type: "headline", classification: "context", round: 3 }));
    // Inject a structural violation: empty body
    items[0]!.body = "";
    const result = validateContent(items, "openbrain", 3, 8);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("empty body"))).toBe(true);
  });

  it("failure mode: 15 items for 8 apps → rejected (below hard minimum of 50)", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 15; i++)
      items.push(makeItem({ id: `gen-f${i}`, type: "headline", classification: "context", round: 3 }));
    const result = validateContent(items, "openbrain", 3, 8);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("critical path: 2-app generation with 30 items passes (backward compat)", () => {
    const items: ContentItem[] = [];
    for (let i = 0; i < 6; i++)
      items.push(makeItem({ id: `gen-c${i}`, type: "headline", classification: "critical", round: 3 }));
    for (let i = 0; i < 15; i++)
      items.push(makeItem({ id: `gen-ctx${i}`, type: "headline", classification: "context", round: 3 }));
    for (let i = 0; i < 3; i++)
      items.push(makeItem({ id: `gen-rh${i}`, type: "headline", classification: "red-herring", round: 3 }));
    for (let i = 0; i < 6; i++)
      items.push(makeItem({ id: `gen-bc${i}`, type: "headline", classification: "breadcrumb", round: 3 }));
    // 30 items: 6 crit, 15 context, 3 rh, 6 bc — valid for 2 apps
    const result = validateContent(items, "openbrain", 3, 2);
    expect(result.valid).toBe(true);
  });
});

// ── INV-1 (slack): forceSlackChannel validates and normalises channel fields ───

describe("INV-1 (slack): forceSlackChannel normalises channel fields", () => {
  it("defaults to '#general' when channel is missing", () => {
    const items: ContentItem[] = [
      makeItem({ id: "gen-s1", type: "message", classification: "context" }),
    ];
    const result = forceSlackChannel(items);
    expect(result[0]!.channel).toBe("#general");
  });

  it("preserves a valid channel when already present", () => {
    const items: ContentItem[] = [
      { ...makeItem({ id: "gen-s2", type: "message", classification: "context" }), channel: "#research" },
    ];
    const result = forceSlackChannel(items);
    expect(result[0]!.channel).toBe("#research");
  });

  it("replaces an invalid channel with '#general'", () => {
    const items: ContentItem[] = [
      { ...makeItem({ id: "gen-s3", type: "message", classification: "context" }), channel: "#bogus-channel" },
    ];
    const result = forceSlackChannel(items);
    expect(result[0]!.channel).toBe("#general");
  });

  it("handles case-insensitive channel matching", () => {
    const items: ContentItem[] = [
      { ...makeItem({ id: "gen-s4", type: "message", classification: "context" }), channel: "#RESEARCH" },
    ];
    const result = forceSlackChannel(items);
    expect(result[0]!.channel).toBe("#research");
  });

  it("all returned channels are members of VALID_SLACK_CHANNELS", () => {
    const mixedItems: ContentItem[] = [
      { ...makeItem({ id: "gen-s5", type: "message", classification: "context" }), channel: "#safety" },
      { ...makeItem({ id: "gen-s6", type: "message", classification: "context" }), channel: "#bad" },
      makeItem({ id: "gen-s7", type: "message", classification: "context" }),
    ];
    const result = forceSlackChannel(mixedItems);
    const validSet = new Set<string>(VALID_SLACK_CHANNELS);
    for (const item of result) {
      expect(validSet.has(item.channel!)).toBe(true);
    }
  });
});

// ── INV-1 (slack): generateContent applies forceSlackChannel to slack items ───

describe("INV-1 (slack): generateContent enforces valid channels on slack items", () => {
  it("replaces invalid channel with '#general' during post-processing", async () => {
    const rawItems: ContentItem[] = [
      { ...makeItem({ id: "gen-slack-bad-ch", type: "message", classification: "context" }), channel: "#notachannel" },
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["slack"]);
    expect(result[0]!.items[0]!.channel).toBe("#general");
  });

  it("preserves a valid channel through post-processing", async () => {
    const rawItems: ContentItem[] = [
      { ...makeItem({ id: "gen-slack-good-ch", type: "message", classification: "context" }), channel: "#alignment" },
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["slack"]);
    expect(result[0]!.items[0]!.channel).toBe("#alignment");
  });

  it("does NOT apply forceSlackChannel to non-slack apps", async () => {
    // signal app also uses type 'message' but should not have channel forced
    const rawItems: ContentItem[] = [
      makeItem({ id: "gen-signal-1", type: "message", classification: "context" }),
      // no channel field — should remain undefined for signal
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["signal"]);
    // signal items should not have channel injected
    expect(result[0]!.items[0]!.channel).toBeUndefined();
  });
});

// ── INV-2 (slack): generation succeeds with no player messages ────────────────

describe("INV-2 (slack): generation succeeds when no player messages exist", () => {
  it("generateContent succeeds with empty playerSlackMessages", async () => {
    const rawItems: ContentItem[] = [
      { ...makeItem({ id: "gen-slack-empty", type: "message", classification: "context" }), channel: "#general" },
    ];
    const provider = new MockProvider({ items: rawItems });
    const contextNoMessages: GenerationContext = { ...BASE_CONTEXT, playerSlackMessages: {} };
    const result = await generateContent(provider, contextNoMessages, "openbrain", ["slack"]);
    expect(result[0]!.items.length).toBeGreaterThan(0);
  });

  it("generateContent succeeds when faction has no messages in playerSlackMessages", async () => {
    const rawItems: ContentItem[] = [
      { ...makeItem({ id: "gen-slack-no-faction", type: "message", classification: "context" }), channel: "#research" },
    ];
    const provider = new MockProvider({ items: rawItems });
    // Other factions have messages, but openbrain does not
    const contextOtherFaction: GenerationContext = {
      ...BASE_CONTEXT,
      playerSlackMessages: {
        prometheus: { "#general": [{ from: "Bob", content: "hello", channel: "#general" }] },
      },
    };
    const result = await generateContent(provider, contextOtherFaction, "openbrain", ["slack"]);
    expect(result[0]!.items.length).toBeGreaterThan(0);
  });
});

// ── INV-3 (slack): player messages appear in the generation prompt ────────────

describe("INV-3 (slack): player messages are included in the slack generation prompt", () => {
  it("prompt includes channel name and content when player messages exist", async () => {
    let capturedPrompt = "";
    const capturingProvider: GenerationProvider = {
      async generate<T>(params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions }): Promise<T> {
        capturedPrompt = params.userPrompt;
        return { items: [{ ...makeItem({ id: "gen-slack-captured", type: "message", classification: "context" }), channel: "#research" }] } as T;
      },
    };

    const contextWithMessages: GenerationContext = {
      ...BASE_CONTEXT,
      playerSlackMessages: {
        openbrain: {
          "#research": [{ from: "Alice", content: "We should prioritize safety eval", channel: "#research" }],
        },
      },
    };

    await generateContent(capturingProvider, contextWithMessages, "openbrain", ["slack"]);

    expect(capturedPrompt).toContain("#research");
    expect(capturedPrompt).toContain("safety eval");
    expect(capturedPrompt).toContain("Alice");
  });

  it("prompt contains fallback text when no player messages exist", async () => {
    let capturedPrompt = "";
    const capturingProvider: GenerationProvider = {
      async generate<T>(params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions }): Promise<T> {
        capturedPrompt = params.userPrompt;
        return { items: [] } as T;
      },
    };

    await generateContent(capturingProvider, BASE_CONTEXT, "openbrain", ["slack"]);

    expect(capturedPrompt).toContain("No player messages");
  });

  it("prompt does NOT include player message section when generating for non-slack app", async () => {
    let capturedPrompt = "";
    const capturingProvider: GenerationProvider = {
      async generate<T>(params: { systemPrompt: string; userPrompt: string; schema: object; options?: GenerationOptions }): Promise<T> {
        capturedPrompt = params.userPrompt;
        return { items: [] } as T;
      },
    };

    const contextWithMessages: GenerationContext = {
      ...BASE_CONTEXT,
      playerSlackMessages: {
        openbrain: {
          "#research": [{ from: "Alice", content: "SECRET", channel: "#research" }],
        },
      },
    };

    await generateContent(capturingProvider, contextWithMessages, "openbrain", ["news"]);

    expect(capturedPrompt).not.toContain("PLAYER SLACK DISCUSSION");
  });
});

// ── INV-4 (slack): generated items pass existing validation ───────────────────

describe("INV-4 (slack): slack items pass post-processing invariants (id, round, type, channel)", () => {
  it("slack item with wrong id/round/type/channel is fully corrected", async () => {
    const rawItems: ContentItem[] = [
      {
        id: "no-gen-prefix",
        type: "headline" as const,  // wrong type
        round: 99,                   // wrong round
        body: "message body",
        timestamp: "2027-01-01T00:00:00Z",
        classification: "context",
        channel: "#notvalid",        // wrong channel
      },
    ];
    const provider = new MockProvider({ items: rawItems });
    const result = await generateContent(provider, BASE_CONTEXT, "openbrain", ["slack"]);
    const item = result[0]!.items[0]!;
    expect(item.id.startsWith("gen-")).toBe(true);
    expect(item.round).toBe(BASE_CONTEXT.targetRound);
    expect(item.type).toBe("message");
    expect(item.channel).toBe("#general");
  });
});
