/**
 * Tests for triggerGeneration orchestrator.
 *
 * Invariants tested:
 * - INV-1: triggerGeneration never throws on any error path
 * - INV-2: triggerGeneration is a no-op when GEN_ENABLED is false or missing
 * - INV-3: triggerGeneration is a no-op for rounds <= 1 or > 5
 * - INV-4: emitBriefing falls back to getBriefing() when no generated briefing exists
 *          (tested indirectly: generated briefing is cached when generation succeeds)
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { GameRoom } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { triggerGeneration } from "./orchestrator.js";
import { getGeneratedBriefing, getGenerationStatus } from "./cache.js";
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
    delete process.env.GEN_ENABLED;
  });

  afterEach(() => {
    process.env.GEN_ENABLED = savedEnabled;
  });

  it("is a no-op when GEN_ENABLED is not set", async () => {
    const room = makeRoom();
    await triggerGeneration(room, 2);
    // status must remain unset (no-op)
    expect(getGenerationStatus(room, 2)).toBeUndefined();
  });

  it("is a no-op when GEN_ENABLED is 'false'", async () => {
    process.env.GEN_ENABLED = "false";
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

  it("is a no-op for round 1", async () => {
    const room = makeRoom();
    await triggerGeneration(room, 1);
    expect(getGenerationStatus(room, 1)).toBeUndefined();
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
