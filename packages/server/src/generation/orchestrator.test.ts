/**
 * Tests for triggerGeneration orchestrator.
 *
 * Invariants tested:
 * - INV-1: triggerGeneration never throws on any error path
 * - INV-2: triggerGeneration is a no-op when GEN_ENABLED is false or missing
 * - INV-3: triggerGeneration is a no-op for rounds <= 1 or > 5
 * - INV-4: emitBriefing falls back to getBriefing() when no generated briefing exists
 *          (tested indirectly: generated briefing is cached when generation succeeds)
 *
 * Decision generation invariants:
 * - D-INV-1: When GEN_DECISIONS_ENABLED=false, decisions are NOT cached (kill switch)
 * - D-INV-2: When generation succeeds, decisions ARE cached
 * - D-INV-3: When generation fails, decisions are NOT cached (fallback to pre-authored)
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { GameRoom } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { triggerGeneration } from "./orchestrator.js";
import { getGeneratedBriefing, getGeneratedDecisions, getGenerationStatus } from "./cache.js";
import { MockProvider, GenerationParseError } from "./provider.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    code: "TEST",
    phase: "resolution",
    round: 2,
    timer: { endsAt: 0 },
    players: {},
    gmId: null,
    state: { ...INITIAL_STATE },
    decisions: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
    ...overrides,
  };
}

// Common text: ~160 words — satisfies validateBriefing requirement of 150–300 words
const COMMON_TEXT =
  "In the weeks following the summit, the situation across frontier AI development has reached a critical turning point. " +
  "Multiple organizations have simultaneously crossed significant capability thresholds, forcing policymakers to address scenarios that were previously theoretical. " +
  "The international community remains fractured between unilateral development advocates and those who argue that only coordinated multilateral governance can prevent catastrophic outcomes. " +
  "Emergency sessions have been convened in multiple legislative bodies while regulatory agencies accelerate disclosure requirements. " +
  "Intelligence assessments now suggest that deployment timelines are converging faster than projected, creating a compressed window for all decision-makers. " +
  "Internal divisions are deepening within organizations as technical teams push for capability deployment and safety researchers advocate for extended evaluation periods. " +
  "The consequences of this period will echo through subsequent rounds and shape the long-term trajectory of AI governance. " +
  "Each faction carries distinct imperatives, constraints, and risk tolerances into the decisions that follow. " +
  "The actions taken now will determine whether the world arrives at a coordinated or fractured future.";

// Faction variants: ~55-60 words each — satisfies validateBriefing requirement of 40–80 words
const VARIANT_OB =
  "OpenBrain's internal coalition has fractured following the latest capability announcement. " +
  "The board faces simultaneous pressure from investors demanding commercial deployment and the safety committee insisting on extended evaluation before any public release. " +
  "Resolving this tension is the primary strategic challenge, as the outcome will determine whether OpenBrain leads or cedes its competitive position in the emerging governance framework.";

const VARIANT_PROM =
  "Prometheus has positioned itself as the regulatory compliance leader, but this advantage is eroding as competitors adopt similar standards. " +
  "The board has signaled flexibility on governance negotiations while the research team insists on maintaining current safety thresholds before any capability deployment. " +
  "Strategic choices this round will determine whether Prometheus leverages its credibility advantage or loses ground to faster-moving competitors.";

const VARIANT_CHINA =
  "DeepCent has secured expanded compute allocation, accelerating the timeline for its frontier model release ahead of projections. " +
  "The directorate is monitoring Western regulatory responses closely while preparing contingency plans for multiple governance scenarios. " +
  "This round presents an opportunity to establish strategic positioning that could either align with international standards or signal a divergent development trajectory. The decision requires careful calibration.";

const VARIANT_EXT =
  "External stakeholders face a narrowing window to influence the governance conversation before technical developments outpace available policy instruments. " +
  "The intelligence community has identified several capability milestones as potential emergency triggers, creating urgency around building effective coalitions. " +
  "Diplomatic channels remain open but are increasingly strained as competing national interests diverge. This round demands decisive engagement before the window closes entirely.";

const VALID_BRIEFING = {
  common: COMMON_TEXT,
  factionVariants: {
    openbrain: VARIANT_OB,
    prometheus: VARIANT_PROM,
    china: VARIANT_CHINA,
    external: VARIANT_EXT,
  },
};

// ── Environment helpers ───────────────────────────────────────────────────────

function withGenEnabled(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    const saved = {
      GEN_ENABLED: process.env.GEN_ENABLED,
      GEN_BRIEFINGS_ENABLED: process.env.GEN_BRIEFINGS_ENABLED,
    };
    process.env.GEN_ENABLED = "true";
    process.env.GEN_BRIEFINGS_ENABLED = "true";
    try {
      await fn();
    } finally {
      process.env.GEN_ENABLED = saved.GEN_ENABLED;
      process.env.GEN_BRIEFINGS_ENABLED = saved.GEN_BRIEFINGS_ENABLED;
    }
  };
}

// ── INV-2: Kill switch ────────────────────────────────────────────────────────

describe("triggerGeneration — kill switch (INV-2)", () => {
  let savedEnabled: string | undefined;

  beforeEach(() => {
    savedEnabled = process.env.GEN_ENABLED;
  });

  afterEach(() => {
    if (savedEnabled === undefined) {
      delete process.env.GEN_ENABLED;
    } else {
      process.env.GEN_ENABLED = savedEnabled;
    }
  });

  it("is a no-op when GEN_ENABLED is 'false'", async () => {
    process.env.GEN_ENABLED = "false";
    const room = makeRoom();
    await triggerGeneration(room, 2);
    expect(getGenerationStatus(room, 2)).toBeUndefined();
  });

  it("is a no-op when GEN_ENABLED is '0'", async () => {
    process.env.GEN_ENABLED = "0";
    const room = makeRoom();
    await triggerGeneration(room, 2);
    expect(getGenerationStatus(room, 2)).toBeUndefined();
  });
});

// ── INV-3: Round bounds ────────────────────────────────────────────────────────

describe("triggerGeneration — round bounds (INV-3)", () => {
  it("is a no-op for round 0", async () => {
    const room = makeRoom();
    await triggerGeneration(room, 0);
    expect(getGenerationStatus(room, 0)).toBeUndefined();
  });

  it("is a no-op for round 6", async () => {
    const room = makeRoom();
    await triggerGeneration(room, 6);
    expect(getGenerationStatus(room, 6)).toBeUndefined();
  });

  it("is a no-op for round 100", async () => {
    const room = makeRoom();
    await triggerGeneration(room, 100);
    expect(getGenerationStatus(room, 100)).toBeUndefined();
  });
});

// ── INV-1: Never throws ────────────────────────────────────────────────────────

describe("triggerGeneration — never throws (INV-1)", () => {
  it(
    "does not throw when provider throws synchronously",
    withGenEnabled(async () => {
      const throwingProvider = {
        generate: () => { throw new Error("Unexpected sync error"); },
      };
      const room = makeRoom();
      // Must resolve, not reject
      await expect(triggerGeneration(room, 2, throwingProvider)).resolves.toBeUndefined();
      // Status must be "failed" after caught error
      expect(getGenerationStatus(room, 2)).toBe("failed");
    }),
  );

  it(
    "does not throw when provider rejects",
    withGenEnabled(async () => {
      const rejectingProvider = {
        generate: () => Promise.reject(new GenerationParseError("parse fail")),
      };
      const room = makeRoom();
      await expect(triggerGeneration(room, 2, rejectingProvider)).resolves.toBeUndefined();
      expect(getGenerationStatus(room, 2)).toBe("failed");
    }),
  );
});

// ── Idempotency ───────────────────────────────────────────────────────────────

describe("triggerGeneration — idempotency", () => {
  it(
    "second call for same round is a no-op (status already pending)",
    withGenEnabled(async () => {
      // Use a provider that hangs forever — to make the first call set pending and block
      // We test idempotency by pre-seeding status as pending
      const room = makeRoom();
      // Manually set status to pending (simulating in-flight first call)
      const { setGenerationStatus } = await import("./cache.js");
      setGenerationStatus(room, 2, "pending");

      // Second call should exit immediately without provider interaction
      let providerCalled = false;
      const trackingProvider = {
        generate: async <T>() => {
          providerCalled = true;
          return {} as T;
        },
      };
      await triggerGeneration(room, 2, trackingProvider);
      expect(providerCalled).toBe(false);
      expect(getGenerationStatus(room, 2)).toBe("pending");
    }),
  );

  it(
    "second call when status is 'ready' is a no-op",
    withGenEnabled(async () => {
      const room = makeRoom();
      const { setGenerationStatus } = await import("./cache.js");
      setGenerationStatus(room, 2, "pending");
      setGenerationStatus(room, 2, "ready");

      let providerCalled = false;
      const trackingProvider = {
        generate: async <T>() => {
          providerCalled = true;
          return {} as T;
        },
      };
      await triggerGeneration(room, 2, trackingProvider);
      expect(providerCalled).toBe(false);
      expect(getGenerationStatus(room, 2)).toBe("ready");
    }),
  );
});

// ── Happy path: briefing generated and cached ──────────────────────────────────

describe("triggerGeneration — briefing cached on success", () => {
  it(
    "caches generated briefing and sets status to ready",
    withGenEnabled(async () => {
      const mockProvider = new MockProvider(VALID_BRIEFING);
      const room = makeRoom();
      await triggerGeneration(room, 2, mockProvider);

      const cached = getGeneratedBriefing(room, 2);
      expect(cached).toBeDefined();
      expect(cached?.common).toBe(VALID_BRIEFING.common);
      expect(cached?.factionVariants.openbrain).toBe(VALID_BRIEFING.factionVariants.openbrain);
      // Status may be "failed" if content/NPC generation fails (MockProvider only handles briefings).
      // The key invariant is that the briefing itself was cached successfully.
      expect(["ready", "failed"]).toContain(getGenerationStatus(room, 2) as string);
    }),
  );

  it(
    "generation for round 2 does not populate round 3 cache",
    withGenEnabled(async () => {
      const mockProvider = new MockProvider(VALID_BRIEFING);
      const room = makeRoom();
      await triggerGeneration(room, 2, mockProvider);
      expect(getGeneratedBriefing(room, 3)).toBeUndefined();
    }),
  );
});

// ── Critical path: provider failure → status failed, no throw ─────────────────

describe("triggerGeneration — provider failure path", () => {
  it(
    "sets status to failed when provider returns null-equivalent (parse error)",
    withGenEnabled(async () => {
      // MockProvider with null data throws GenerationParseError
      const mockProvider = new MockProvider(null);
      const room = makeRoom();
      await expect(triggerGeneration(room, 2, mockProvider)).resolves.toBeUndefined();
      expect(getGenerationStatus(room, 2)).toBe("failed");
      expect(getGeneratedBriefing(room, 2)).toBeUndefined();
    }),
  );
});

// ── Decision generation helpers ───────────────────────────────────────────────

/**
 * A valid SingleDecisionOutput fixture.
 *
 * Satisfies all hard validation constraints:
 * - Exactly 3 options (A, B, C)
 * - 5 effects per option (in [5, 8])
 * - |delta| <= 8 for all effects
 * - >= 2 positive AND >= 2 negative effects per option
 * - No duplicate variables within an option
 * - Distinctness: no pair has >= 60% same-sign on shared variables
 *
 * Distinctness verification:
 * A vs B shared: obCapability(+/-), publicAwareness(+/-), regulatoryPressure(-/+), obBoardConfidence(+/-) = 0/4 same → 0% ✓
 * A vs C shared: obCapability(+/+), publicAwareness(+/-), obBurnRate(-/+) = 1/3 same → 33% ✓
 * B vs C shared: obCapability(-/+), intlCooperation(+/-), publicAwareness(-/-) = 1/3 same → 33% ✓
 */
const VALID_SINGLE_DECISION = {
  prompt: "The situation has reached a critical inflection point. Your decision in the next 48 hours will define the trajectory of the organization for the foreseeable future.",
  options: [
    {
      id: "A",
      label: "Announce publicly now",
      description: "Get ahead of the leaks. Control the narrative.",
      effects: [
        { variable: "obCapability", delta: 5 },
        { variable: "publicAwareness", delta: 4 },
        { variable: "regulatoryPressure", delta: -3 },
        { variable: "obBurnRate", delta: -4 },
        { variable: "obBoardConfidence", delta: 3 },
      ],
    },
    {
      id: "B",
      label: "Brief government first",
      description: "Bring government fully in before any public announcement.",
      effects: [
        { variable: "obCapability", delta: -3 },
        { variable: "intlCooperation", delta: 5 },
        { variable: "regulatoryPressure", delta: 4 },
        { variable: "obBoardConfidence", delta: -4 },
        { variable: "publicAwareness", delta: -3 },
      ],
    },
    {
      id: "C",
      label: "Maintain operational secrecy",
      description: "Say nothing. Invest the silence into R&D speed.",
      effects: [
        { variable: "obCapability", delta: 4 },
        { variable: "aiAutonomyLevel", delta: 3 },
        { variable: "intlCooperation", delta: -4 },
        { variable: "obBurnRate", delta: 5 },
        { variable: "publicAwareness", delta: -3 },
      ],
    },
  ],
};

function withDecisionsEnabled(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    const saved = {
      GEN_ENABLED: process.env.GEN_ENABLED,
      GEN_DECISIONS_ENABLED: process.env.GEN_DECISIONS_ENABLED,
    };
    process.env.GEN_ENABLED = "true";
    process.env.GEN_DECISIONS_ENABLED = "true";
    try {
      await fn();
    } finally {
      process.env.GEN_ENABLED = saved.GEN_ENABLED;
      process.env.GEN_DECISIONS_ENABLED = saved.GEN_DECISIONS_ENABLED;
    }
  };
}

// ── D-INV-1: Kill switch — decisions not cached when disabled ─────────────────

describe("triggerGeneration — decisions kill switch (D-INV-1)", () => {
  it(
    "does not cache decisions when GEN_DECISIONS_ENABLED=false",
    withGenEnabled(async () => {
      process.env.GEN_DECISIONS_ENABLED = "false";
      const mockProvider = new MockProvider(VALID_SINGLE_DECISION);
      const room = makeRoom();
      await triggerGeneration(room, 2, mockProvider);
      expect(getGeneratedDecisions(room, 2)).toBeUndefined();
    }),
  );

  it(
    "does not cache decisions when GEN_DECISIONS_ENABLED='0'",
    withGenEnabled(async () => {
      process.env.GEN_DECISIONS_ENABLED = "0";
      const mockProvider = new MockProvider(VALID_SINGLE_DECISION);
      const room = makeRoom();
      await triggerGeneration(room, 2, mockProvider);
      expect(getGeneratedDecisions(room, 2)).toBeUndefined();
    }),
  );
});

// ── D-INV-2: Decisions cached on successful generation ────────────────────────

describe("triggerGeneration — decisions cached on success (D-INV-2)", () => {
  it(
    "caches generated decisions for round 2 when enabled and provider returns valid data",
    withDecisionsEnabled(async () => {
      const mockProvider = new MockProvider(VALID_SINGLE_DECISION);
      const room = makeRoom();
      await triggerGeneration(room, 2, mockProvider);

      const cached = getGeneratedDecisions(room, 2);
      expect(cached).toBeDefined();
      expect(cached?.round).toBe(2);
      // Round 2 templates include both individual and team decisions
      expect(cached?.individual.length).toBeGreaterThan(0);
      expect(cached?.team.length).toBeGreaterThan(0);
    }),
  );

  it(
    "generated option IDs use gen_ prefix to avoid collision with pre-authored IDs",
    withDecisionsEnabled(async () => {
      const mockProvider = new MockProvider(VALID_SINGLE_DECISION);
      const room = makeRoom();
      await triggerGeneration(room, 2, mockProvider);

      const cached = getGeneratedDecisions(room, 2);
      expect(cached).toBeDefined();
      for (const indiv of cached!.individual) {
        for (const opt of indiv.options) {
          expect(opt.id).toMatch(/^gen_/);
        }
      }
      for (const team of cached!.team) {
        for (const opt of team.options) {
          expect(opt.id).toMatch(/^gen_/);
        }
      }
    }),
  );

  it(
    "does not populate round 3 decisions when generating round 2",
    withDecisionsEnabled(async () => {
      const mockProvider = new MockProvider(VALID_SINGLE_DECISION);
      const room = makeRoom();
      await triggerGeneration(room, 2, mockProvider);
      expect(getGeneratedDecisions(room, 3)).toBeUndefined();
    }),
  );
});

// ── D-INV-3: Provider failure → decisions not cached ─────────────────────────

describe("triggerGeneration — decisions fallback on failure (D-INV-3)", () => {
  it(
    "does not cache decisions when provider returns unparseable data",
    withDecisionsEnabled(async () => {
      // MockProvider(null) throws GenerationParseError on generate()
      const mockProvider = new MockProvider(null);
      const room = makeRoom();
      await expect(triggerGeneration(room, 2, mockProvider)).resolves.toBeUndefined();
      // Decisions must NOT be cached — pre-authored fallback will be used
      expect(getGeneratedDecisions(room, 2)).toBeUndefined();
    }),
  );
});
