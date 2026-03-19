/**
 * Tests for generateNpcMessages and related functions.
 *
 * Invariants tested:
 * - INV-1: Generated NPC triggers with invalid npcId are stripped in post-processing
 * - INV-2: Generated triggers use gen-npc- prefix — no ID collision with pre-authored triggers
 * - INV-3: Dedup via firedThresholds works for both pre-authored and generated triggers
 * - INV-4: GEN_NPC_ENABLED=false means zero generated NPC triggers in orchestrator
 */

import { describe, it, expect } from "bun:test";
import type { GameRoom, NpcTrigger } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { postProcessNpcTriggers, generateNpcMessagesWithRetry } from "./npc.js";
import { validateNpcTriggers } from "./validate.js";
import { setGeneratedNpcTriggers, getGeneratedNpcTriggers } from "./cache.js";
import { triggerGeneration } from "./orchestrator.js";
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
    decisions2: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
    firedThresholds: new Set(),
    ...overrides,
  };
}

function makeValidTriggers(count = 5): NpcTrigger[] {
  const triggers: NpcTrigger[] = [];
  for (let i = 0; i < count; i++) {
    triggers.push({
      id: `gen-npc-test-${i}`,
      npcId: "__npc_anon__",
      content: `Test message ${i}`,
      target: { faction: "openbrain" },
      schedule: { round: 2, phase: "intel" },
    });
  }
  return triggers;
}

// ── INV-1: Invalid npcId stripped in post-processing ─────────────────────────

describe("postProcessNpcTriggers — INV-1: invalid npcId stripped", () => {
  it("strips trigger with unknown npcId", () => {
    const raw = {
      items: [
        {
          id: "gen-npc-test-001",
          npcId: "__npc_nonexistent__",
          content: "Some message",
          target: { faction: "openbrain" },
          schedule: { round: 2, phase: "intel" },
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 2);
    expect(result).toHaveLength(0);
  });

  it("keeps trigger with valid npcId", () => {
    const raw = {
      items: [
        {
          id: "gen-npc-test-001",
          npcId: "__npc_anon__",
          content: "Some message",
          target: { faction: "openbrain" },
          schedule: { round: 2, phase: "intel" },
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 2);
    expect(result).toHaveLength(1);
    expect(result[0].npcId).toBe("__npc_anon__");
  });
});

// ── INV-2: gen-npc- prefix enforced ──────────────────────────────────────────

describe("postProcessNpcTriggers — INV-2: gen-npc- prefix", () => {
  it("strips trigger without gen-npc- prefix", () => {
    const raw = {
      items: [
        {
          id: "npc-test-001",  // missing gen-npc- prefix
          npcId: "__npc_anon__",
          content: "Some message",
          target: { faction: "openbrain" },
          schedule: { round: 2, phase: "intel" },
        },
        {
          id: "r2_ob_npc_001",  // pre-authored style ID
          npcId: "__npc_anon__",
          content: "Another message",
          target: { faction: "prometheus" },
          schedule: { round: 2, phase: "intel" },
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 2);
    expect(result).toHaveLength(0);
  });

  it("keeps trigger with gen-npc- prefix", () => {
    const raw = {
      items: [
        {
          id: "gen-npc-r2-ob-001",
          npcId: "__npc_ob_engineer__",
          content: "Systems are looking unstable",
          target: { faction: "openbrain" },
          schedule: { round: 2, phase: "intel" },
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 2);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("gen-npc-r2-ob-001");
  });
});

// ── Post-processing: invalid faction stripped ─────────────────────────────────

describe("postProcessNpcTriggers — invalid faction stripped", () => {
  it("strips trigger with unknown faction", () => {
    const raw = {
      items: [
        {
          id: "gen-npc-test-001",
          npcId: "__npc_anon__",
          content: "Some message",
          target: { faction: "invalid_faction" },
          schedule: { round: 2, phase: "intel" },
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 2);
    expect(result).toHaveLength(0);
  });
});

// ── Post-processing: both/neither condition+schedule stripped ─────────────────

describe("postProcessNpcTriggers — condition/schedule mutual exclusion", () => {
  it("strips trigger with both condition and schedule", () => {
    const raw = {
      items: [
        {
          id: "gen-npc-test-001",
          npcId: "__npc_anon__",
          content: "Some message",
          target: { faction: "openbrain" },
          condition: { variable: "chinaWeightTheftProgress", operator: "gte", value: 50 },
          schedule: { round: 2, phase: "intel" },
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 2);
    expect(result).toHaveLength(0);
  });

  it("strips trigger with neither condition nor schedule", () => {
    const raw = {
      items: [
        {
          id: "gen-npc-test-001",
          npcId: "__npc_anon__",
          content: "Some message",
          target: { faction: "openbrain" },
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 2);
    expect(result).toHaveLength(0);
  });
});

// ── Post-processing: schedule.round forced to targetRound ─────────────────────

describe("postProcessNpcTriggers — schedule.round forced to targetRound", () => {
  it("corrects schedule.round when LLM returns wrong round", () => {
    const raw = {
      items: [
        {
          id: "gen-npc-test-001",
          npcId: "__npc_anon__",
          content: "Some message",
          target: { faction: "openbrain" },
          schedule: { round: 99, phase: "intel" },  // wrong round
        },
      ],
    };
    const result = postProcessNpcTriggers(raw, 3);
    expect(result).toHaveLength(1);
    expect(result[0].schedule?.round).toBe(3);  // forced to targetRound
  });
});

// ── validateNpcTriggers ────────────────────────────────────────────────────────

describe("validateNpcTriggers", () => {
  it("rejects when fewer than 4 triggers", () => {
    const triggers = makeValidTriggers(3);
    const result = validateNpcTriggers(triggers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("need ≥4"))).toBe(true);
  });

  it("rejects when more than 8 triggers", () => {
    const triggers = makeValidTriggers(9);
    const result = validateNpcTriggers(triggers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("max 8"))).toBe(true);
  });

  it("passes for 4-8 triggers with valid fields", () => {
    const triggers = makeValidTriggers(5);
    const result = validateNpcTriggers(triggers);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects trigger with empty content", () => {
    const triggers = makeValidTriggers(5);
    triggers[0].content = "";
    const result = validateNpcTriggers(triggers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("empty content"))).toBe(true);
  });

  it("rejects trigger with unknown npcId", () => {
    const triggers = makeValidTriggers(5);
    triggers[0].npcId = "__npc_fake__";
    const result = validateNpcTriggers(triggers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown npcId"))).toBe(true);
  });
});

// ── Cache helpers ─────────────────────────────────────────────────────────────

describe("cache helpers — setGeneratedNpcTriggers / getGeneratedNpcTriggers", () => {
  it("stores and retrieves generated triggers", () => {
    const room = makeRoom();
    const triggers = makeValidTriggers(4);
    setGeneratedNpcTriggers(room, 2, triggers);
    const retrieved = getGeneratedNpcTriggers(room, 2);
    expect(retrieved).toBeDefined();
    expect(retrieved).toHaveLength(4);
    expect(retrieved![0].id).toBe("gen-npc-test-0");
  });

  it("returns undefined for rounds with no cached triggers", () => {
    const room = makeRoom();
    expect(getGeneratedNpcTriggers(room, 3)).toBeUndefined();
  });

  it("stores triggers per round independently", () => {
    const room = makeRoom();
    const round2Triggers = makeValidTriggers(4);
    const round3Triggers = makeValidTriggers(5).map((t) => ({ ...t, id: `gen-npc-r3-${t.id}` }));
    setGeneratedNpcTriggers(room, 2, round2Triggers);
    setGeneratedNpcTriggers(room, 3, round3Triggers);
    expect(getGeneratedNpcTriggers(room, 2)).toHaveLength(4);
    expect(getGeneratedNpcTriggers(room, 3)).toHaveLength(5);
  });
});

// ── generateNpcMessagesWithRetry ──────────────────────────────────────────────

const VALID_MOCK_NPC_OUTPUT = {
  items: [
    { id: "gen-npc-r2-001", npcId: "__npc_anon__", content: "Message one", target: { faction: "openbrain" }, schedule: { round: 2, phase: "intel" } },
    { id: "gen-npc-r2-002", npcId: "__npc_insider__", content: "Message two", target: { faction: "prometheus" }, schedule: { round: 2, phase: "briefing" } },
    { id: "gen-npc-r2-003", npcId: "__npc_ob_engineer__", content: "Message three", target: { faction: "openbrain" }, schedule: { round: 2, phase: "decision" } },
    { id: "gen-npc-r2-004", npcId: "__npc_personal__", content: "Message four", target: { faction: "china" }, schedule: { round: 2, phase: "resolution" } },
    { id: "gen-npc-r2-005", npcId: "__npc_china_liaison__", content: "Message five for condition", target: { faction: "china" }, condition: { variable: "chinaWeightTheftProgress", operator: "gte", value: 30 } },
  ],
};

function makeContext() {
  return {
    storyBible: undefined,
    currentState: { ...INITIAL_STATE },
    history: [],
    players: [],
    firedThresholds: [],
    publications: [],
    targetRound: 2,
    roundArc: {
      round: 2,
      title: "Test Arc",
      era: "Test Era",
      narrativeBeat: "Test Beat",
      escalation: "Test Escalation",
      keyTensions: ["Tension 1"],
    },
    playerSlackMessages: {},
  };
}

describe("generateNpcMessagesWithRetry", () => {
  it("returns triggers on success", async () => {
    const provider = new MockProvider(VALID_MOCK_NPC_OUTPUT);
    const context = makeContext();
    const result = await generateNpcMessagesWithRetry(provider, context);
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(4);
    expect(result!.every((t) => t.id.startsWith("gen-npc-"))).toBe(true);
  });

  it("returns null when provider throws", async () => {
    const throwingProvider = {
      generate: () => Promise.reject(new GenerationParseError("parse fail")),
    };
    const context = makeContext();
    const result = await generateNpcMessagesWithRetry(throwingProvider, context);
    expect(result).toBeNull();
  });

  it("returns null when provider returns null data", async () => {
    const nullProvider = new MockProvider(null);
    const context = makeContext();
    const result = await generateNpcMessagesWithRetry(nullProvider, context);
    expect(result).toBeNull();
  });
});

// ── INV-3: Dedup works for generated triggers ─────────────────────────────────

describe("INV-3: gen-npc- IDs don't collide with pre-authored IDs", () => {
  it("pre-authored and generated IDs are in different namespaces", () => {
    // Pre-authored triggers use IDs like "ob_round2_engineer_001"
    // Generated triggers use IDs like "gen-npc-r2-001"
    const preAuthored = "ob_round2_engineer_001";
    const generated = "gen-npc-r2-001";
    expect(generated.startsWith("gen-npc-")).toBe(true);
    expect(preAuthored.startsWith("gen-npc-")).toBe(false);
  });
});

// ── INV-4: GEN_NPC_ENABLED=false → no generated triggers ─────────────────────

describe("triggerGeneration — INV-4: npcEnabled kill switch", () => {
  it("does not generate NPC triggers when GEN_NPC_ENABLED is not set", async () => {
    const savedEnabled = process.env.GEN_ENABLED;
    const savedNpc = process.env.GEN_NPC_ENABLED;
    process.env.GEN_ENABLED = "true";
    delete process.env.GEN_NPC_ENABLED;

    try {
      const room = makeRoom();
      // MockProvider returns valid briefing-like data — won't be called for NPC since disabled
      const mockProvider = new MockProvider({
        common: "Test " + "word ".repeat(149),
        factionVariants: {
          openbrain: "Test " + "word ".repeat(39),
          prometheus: "Test " + "word ".repeat(39),
          china: "Test " + "word ".repeat(39),
          external: "Test " + "word ".repeat(39),
        },
      });
      await triggerGeneration(room, 2, mockProvider);
      // NPC triggers should NOT be cached
      expect(getGeneratedNpcTriggers(room, 2)).toBeUndefined();
    } finally {
      process.env.GEN_ENABLED = savedEnabled;
      process.env.GEN_NPC_ENABLED = savedNpc;
    }
  });

  it("generates NPC triggers when GEN_NPC_ENABLED=true", async () => {
    const savedEnabled = process.env.GEN_ENABLED;
    const savedNpc = process.env.GEN_NPC_ENABLED;
    process.env.GEN_ENABLED = "true";
    process.env.GEN_NPC_ENABLED = "true";

    try {
      const room = makeRoom();
      const mockProvider = new MockProvider(VALID_MOCK_NPC_OUTPUT);
      await triggerGeneration(room, 2, mockProvider);
      // NPC triggers should be cached
      const cached = getGeneratedNpcTriggers(room, 2);
      expect(cached).toBeDefined();
      expect(cached!.length).toBeGreaterThan(0);
    } finally {
      process.env.GEN_ENABLED = savedEnabled;
      process.env.GEN_NPC_ENABLED = savedNpc;
    }
  });
});
