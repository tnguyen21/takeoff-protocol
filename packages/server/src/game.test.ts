import { describe, it, expect, afterEach } from "bun:test";
import { buildNarrative, advancePhase, checkThresholds, startTutorial, endTutorial, syncPhaseTimer, clearPhaseTimer, emitContent, startGame, buildNameMap, personalizeText, personalizeContent } from "./game.js";
import { INITIAL_STATE, STATE_VARIABLE_RANGES } from "@takeoff/shared";
import type { AppContent, AppId, ContentItem, GameMessage, GameRoom, Player, StateVariables } from "@takeoff/shared";
import { setGeneratedContent } from "./generation/cache.js";
import { getContentForPlayer } from "./content/loader.js";
import { _setLoggerForRoom, _clearLoggers } from "./logger/registry.js";
import type { EventContext } from "./logger/types.js";

// ── SpyLogger for testing structured log calls ──

interface SpyCall {
  event: string;
  data: unknown;
  ctx?: EventContext;
}

class SpyLogger {
  calls: SpyCall[] = [];
  log(event: string, data: unknown, ctx?: EventContext): void {
    this.calls.push({ event, data, ctx });
  }
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
  get rejections(): number { return 0; }
}

// ── Helpers ──

function makePlayer(id: string, faction: Player["faction"], role: Player["role"]): Player {
  return { id, name: `Player ${id}`, faction, role, isLeader: false, connected: true };
}

function makeRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    code: "TEST",
    phase: "decision",
    round: 1,
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

// Minimal mock for socket.io Server
function createMockIo() {
  const emitted: Record<string, Array<[string, unknown]>> = {};

  const io = {
    to(target: string) {
      return {
        emit(event: string, data: unknown) {
          const key = `${target}:${event}`;
          (emitted[key] ??= []).push([event, data]);
        },
      };
    },
  };

  return { io: io as unknown as import("socket.io").Server, emitted };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── INV-3: buildNarrative mentions inaction for missing factions ──

describe("buildNarrative — inaction", () => {
  it("mentions inaction for factions that did not submit when activeFactions provided", () => {
    const teamDecisions = {
      openbrain: { optionId: "ob_a", label: "Race Full Speed Ahead" },
      prometheus: { optionId: "prom_b", label: "Slowdown" },
      china: { optionId: "cn_a", label: "Accelerate" },
    };
    const activeFactions = ["openbrain", "prometheus", "china", "external"];

    const narrative = buildNarrative(teamDecisions, 1, activeFactions);

    // external did not submit → must appear as inaction
    expect(narrative).toContain("External Stakeholders chose inaction — no team decision was submitted.");
    // submitted factions must NOT appear as inaction
    expect(narrative).not.toContain("OpenBrain chose inaction");
    expect(narrative).not.toContain("Prometheus chose inaction");
    expect(narrative).not.toContain("China (DeepCent) chose inaction");
  });

  it("notes inaction for all factions when no team decisions submitted (total inaction)", () => {
    const narrative = buildNarrative({}, 2, ["openbrain", "prometheus"]);

    expect(narrative).toContain("OpenBrain chose inaction — no team decision was submitted.");
    expect(narrative).toContain("Prometheus chose inaction — no team decision was submitted.");
  });

  it("does not add inaction lines when all factions submitted", () => {
    const teamDecisions = {
      openbrain: { optionId: "ob_a", label: "Race Full Speed Ahead" },
      prometheus: { optionId: "prom_b", label: "Slowdown" },
    };

    const narrative = buildNarrative(teamDecisions, 1, ["openbrain", "prometheus"]);

    expect(narrative).not.toContain("inaction");
  });

  it("produces no inaction lines when activeFactions is empty", () => {
    const narrative = buildNarrative({}, 1, []);

    expect(narrative).not.toContain("inaction");
  });

  it("includes submitted decision labels alongside inaction entries", () => {
    const teamDecisions = {
      openbrain: { optionId: "ob_a", label: "Coordinate Internationally" },
    };
    const narrative = buildNarrative(teamDecisions, 3, ["openbrain", "china"]);

    expect(narrative).toContain("OpenBrain chose to coordinate internationally.");
    expect(narrative).toContain("China (DeepCent) chose inaction — no team decision was submitted.");
  });
});

// ── advancePhase: inaction notifications ──

describe("advancePhase — inaction notifications on decision → resolution", () => {
  it("emits game:notification to players who did not submit decisions", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const player2 = makePlayer("p2", "prometheus", "prom_ceo");

    const room = makeRoom({
      phase: "decision",
      players: { p1: player1, p2: player2 },
      decisions: { p1: "some_option" }, // p1 submitted, p2 did not
    });

    const { io, emitted } = createMockIo();
    advancePhase(io, room);

    expect(room.phase).toBe("resolution");

    // p2 should receive inaction notification
    const p2Notifs = emitted["p2:game:notification"];
    expect(p2Notifs).toBeDefined();
    expect(p2Notifs?.length).toBe(1);
    const [, payload] = p2Notifs![0];
    expect((payload as { summary: string }).summary).toBe("You did not submit a decision. Inaction was applied.");

    // p1 should NOT receive inaction notification
    expect(emitted["p1:game:notification"]).toBeUndefined();
  });

  it("emits inaction notification to all players when nobody submits", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const player2 = makePlayer("p2", "china", "china_director");

    const room = makeRoom({
      phase: "decision",
      players: { p1: player1, p2: player2 },
      decisions: {}, // nobody submitted
    });

    const { io, emitted } = createMockIo();
    advancePhase(io, room);

    expect(room.phase).toBe("resolution");
    expect(emitted["p1:game:notification"]).toBeDefined();
    expect(emitted["p2:game:notification"]).toBeDefined();
  });

  it("does not emit inaction notifications when all players submitted", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const player2 = makePlayer("p2", "prometheus", "prom_ceo");

    const room = makeRoom({
      phase: "decision",
      players: { p1: player1, p2: player2 },
      decisions: { p1: "opt_a", p2: "opt_b" }, // everyone submitted
    });

    const { io, emitted } = createMockIo();
    advancePhase(io, room);

    expect(room.phase).toBe("resolution");
    expect(emitted["p1:game:notification"]).toBeUndefined();
    expect(emitted["p2:game:notification"]).toBeUndefined();
  });

  it("does not emit inaction notifications when transitioning from non-decision phases", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");

    const room = makeRoom({
      phase: "deliberation",
      players: { p1: player1 },
      decisions: {}, // no submissions, but we're not in decision phase
    });

    const { io, emitted } = createMockIo();
    advancePhase(io, room);

    // Should advance to decision, not resolution
    expect(room.phase).toBe("decision");
    expect(emitted["p1:game:notification"]).toBeUndefined();
  });

  it("skips players without faction/role when emitting inaction notifications", () => {
    const player1 = makePlayer("p1", null, null); // no faction/role
    const player2 = makePlayer("p2", "prometheus", "prom_ceo");

    const room = makeRoom({
      phase: "decision",
      players: { p1: player1, p2: player2 },
      decisions: {}, // nobody submitted
    });

    const { io, emitted } = createMockIo();
    advancePhase(io, room);

    // p1 has no faction/role → no notification
    expect(emitted["p1:game:notification"]).toBeUndefined();
    // p2 has faction+role and no submission → gets notification
    expect(emitted["p2:game:notification"]).toBeDefined();
  });
});

// ── INV-2: state unchanged for players who did not submit ──

describe("INV-2: state unchanged when no decisions submitted", () => {
  it("state is identical before and after resolution when no decisions submitted", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const initialState: StateVariables = { ...INITIAL_STATE };

    const room = makeRoom({
      phase: "decision",
      players: { p1: player1 },
      decisions: {},        // no individual submissions
      teamDecisions: {},    // no team submissions
    });

    const { io } = createMockIo();
    advancePhase(io, room); // decision → resolution, applies no effects

    // All state variables must remain unchanged
    for (const key of Object.keys(initialState) as Array<keyof StateVariables>) {
      expect(room.state[key]).toBe(initialState[key]);
    }
  });
});

// ── Tutorial round (round 0) ──

describe("startTutorial", () => {
  it("sets round=0 and phase=intel", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      phase: "lobby",
      round: 0,
      players: { p1: player1 },
    });

    const { io } = createMockIo();
    startTutorial(io, room);

    // INV: round must be 0 after startTutorial
    expect(room.round).toBe(0);
    // INV: phase must be intel (desktop is shown)
    expect(room.phase).toBe("intel");
  });

  it("does nothing when not all players have roles", () => {
    const player1 = makePlayer("p1", null, null); // no role
    const room = makeRoom({
      phase: "lobby",
      round: 0,
      players: { p1: player1 },
    });

    const { io } = createMockIo();
    startTutorial(io, room);

    // Phase should remain lobby since player has no role
    expect(room.phase).toBe("lobby");
  });
});

describe("endTutorial", () => {
  it("transitions from round 0 to round 1 briefing", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      phase: "intel",
      round: 0,
      players: { p1: player1 },
    });

    const { io } = createMockIo();
    endTutorial(io, room);

    // INV: round must be 1 after endTutorial
    expect(room.round).toBe(1);
    // INV: phase must be briefing
    expect(room.phase).toBe("briefing");
  });

  it("does nothing when round is not 0", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      phase: "intel",
      round: 2,
      players: { p1: player1 },
    });

    const { io } = createMockIo();
    endTutorial(io, room);

    // Must remain unchanged
    expect(room.round).toBe(2);
    expect(room.phase).toBe("intel");
  });
});

describe("advancePhase — tutorial round behavior", () => {
  it("transitions from round 0 directly to round 1 briefing via advancePhase", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      phase: "intel",
      round: 0,
      players: { p1: player1 },
    });

    const { io } = createMockIo();
    advancePhase(io, room);

    expect(room.round).toBe(1);
    expect(room.phase).toBe("briefing");
  });
});

// ── checkThresholds ───────────────────────────────────────────────────────────

describe("checkThresholds — each fires at most once (idempotency invariant)", () => {
  it("whistleblower_autoleak fires when whistleblowerPressure >= 80 and applies state effects", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { p1: ob },
      state: { ...INITIAL_STATE, whistleblowerPressure: 80, publicAwareness: 30, publicSentiment: 0, obInternalTrust: 60 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    // INV: state effects applied
    expect(room.state.publicAwareness).toBe(55);    // 30 + 25
    expect(room.state.publicSentiment).toBe(-15);   // 0 - 15
    expect(room.state.obInternalTrust).toBe(40);    // 60 - 20

    // INV: OB players notified
    const notif = emitted["p1:game:notification"];
    expect(notif).toBeDefined();
    expect((notif![0][1] as { id: string }).id).toBe("whistleblower_autoleak");

    // INV: threshold recorded
    expect(room.firedThresholds?.has("whistleblower_autoleak")).toBe(true);
  });

  it("whistleblower_autoleak does NOT fire again when called a second time (idempotency)", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { p1: ob },
      state: { ...INITIAL_STATE, whistleblowerPressure: 80, publicAwareness: 30, publicSentiment: 0, obInternalTrust: 60 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);
    checkThresholds(io, room); // second call — should be no-op

    // State effects must not double-apply
    expect(room.state.publicAwareness).toBe(55);
    expect(room.state.publicSentiment).toBe(-15);
    expect(room.state.obInternalTrust).toBe(40);

    // Notification emitted exactly once
    expect(emitted["p1:game:notification"]?.length).toBe(1);
  });

  it("china_weight_theft fires when chinaWeightTheftProgress >= 100 and applies state effects", () => {
    const china = makePlayer("c1", "china", "china_director");
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { c1: china, p1: ob },
      state: { ...INITIAL_STATE, chinaWeightTheftProgress: 100, chinaCapability: 50, taiwanTension: 20 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    // chinaCapability +25, taiwanTension +15
    expect(room.state.chinaCapability).toBe(75);
    expect(room.state.taiwanTension).toBe(35);

    // OB gets security crisis notification
    const obNotif = emitted["p1:game:notification"];
    expect(obNotif).toBeDefined();
    expect((obNotif![0][1] as { id: string }).id).toBe("china_weight_theft");

    // China does NOT get a notification (it's an OB security event)
    expect(emitted["c1:game:notification"]).toBeUndefined();

    expect(room.firedThresholds?.has("china_weight_theft")).toBe(true);
  });

  it("ob_board_revolt fires when obBoardConfidence < 30 and decrements obInternalTrust", () => {
    const ob1 = makePlayer("p1", "openbrain", "ob_ceo");
    const ob2 = makePlayer("p2", "openbrain", "ob_safety");
    const room = makeRoom({
      players: { p1: ob1, p2: ob2 },
      state: { ...INITIAL_STATE, obBoardConfidence: 25, obInternalTrust: 50 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    expect(room.state.obInternalTrust).toBe(40); // -10
    expect(emitted["p1:game:notification"]).toBeDefined();
    expect(emitted["p2:game:notification"]).toBeDefined();
    expect(room.firedThresholds?.has("ob_board_revolt")).toBe(true);
  });

  it("ccp_military_mandate fires when ccpPatience < 20 and notifies china faction", () => {
    const china = makePlayer("c1", "china", "china_director");
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { c1: china, p1: ob },
      state: { ...INITIAL_STATE, ccpPatience: 15 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    expect(emitted["c1:game:notification"]).toBeDefined();
    expect((emitted["c1:game:notification"]![0][1] as { id: string }).id).toBe("ccp_military_mandate");
    // OB should NOT be notified
    expect(emitted["p1:game:notification"]).toBeUndefined();
    expect(room.firedThresholds?.has("ccp_military_mandate")).toBe(true);
  });

  it("prom_alignment_breakthrough fires when promSafetyBreakthroughProgress >= 80 and boosts alignmentConfidence", () => {
    const prom = makePlayer("prom1", "prometheus", "prom_scientist");
    const room = makeRoom({
      players: { prom1: prom },
      state: { ...INITIAL_STATE, promSafetyBreakthroughProgress: 85, alignmentConfidence: 50 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    expect(room.state.alignmentConfidence).toBe(65); // 50 + 15
    expect(emitted["prom1:game:notification"]).toBeDefined();
    expect(room.firedThresholds?.has("prom_alignment_breakthrough")).toBe(true);
  });

  it("regulatory_emergency_powers fires when regulatoryPressure >= 70 and notifies external faction", () => {
    const nsa = makePlayer("nsa1", "external", "ext_nsa");
    const china = makePlayer("c1", "china", "china_director");
    const room = makeRoom({
      players: { nsa1: nsa, c1: china },
      state: { ...INITIAL_STATE, regulatoryPressure: 75 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    expect(emitted["nsa1:game:notification"]).toBeDefined();
    // China not notified
    expect(emitted["c1:game:notification"]).toBeUndefined();
    expect(room.firedThresholds?.has("regulatory_emergency_powers")).toBe(true);
  });

  it("point_of_no_return fires when doomClockDistance <= 1 and notifies GM", () => {
    const room = makeRoom({
      gmId: "gm1",
      state: { ...INITIAL_STATE, doomClockDistance: 1 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    expect(emitted["gm1:game:notification"]).toBeDefined();
    expect(room.firedThresholds?.has("point_of_no_return")).toBe(true);
  });

  it("ui_degradation fires when aiAutonomyLevel >= 60 AND alignmentConfidence < 40", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { p1: ob },
      state: { ...INITIAL_STATE, aiAutonomyLevel: 65, alignmentConfidence: 35 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    expect(room.uiDegradationActive).toBe(true);
    expect(emitted["p1:game:notification"]).toBeDefined();
    expect(room.firedThresholds?.has("ui_degradation")).toBe(true);
  });

  it("ui_degradation does NOT fire when aiAutonomyLevel >= 60 but alignmentConfidence >= 40", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { p1: ob },
      state: { ...INITIAL_STATE, aiAutonomyLevel: 65, alignmentConfidence: 45 },
    });

    const { io } = createMockIo();
    checkThresholds(io, room);

    expect(room.uiDegradationActive).toBeUndefined();
    expect(room.firedThresholds?.has("ui_degradation")).toBe(false);
  });

  it("initializes firedThresholds lazily if not present on room", () => {
    const room = makeRoom({
      state: { ...INITIAL_STATE, whistleblowerPressure: 85 },
    });

    // No firedThresholds on room before call
    expect(room.firedThresholds).toBeUndefined();

    const { io } = createMockIo();
    checkThresholds(io, room);

    expect(room.firedThresholds).toBeDefined();
    expect(room.firedThresholds!.has("whistleblower_autoleak")).toBe(true);
  });

  it("chinaCapability is clamped to 100 even when theft would push it beyond", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { p1: ob },
      state: { ...INITIAL_STATE, chinaWeightTheftProgress: 100, chinaCapability: 90 },
    });

    const { io } = createMockIo();
    checkThresholds(io, room);

    expect(room.state.chinaCapability).toBe(100); // clamped, not 115
  });

  it("no thresholds fire when variables are below trigger values", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      players: { p1: ob },
      // publicAwareness set above 25 to avoid npc_r1_public_darkness_tip (lte: 25) at initial state
      // securityLevelOB set above 2 to avoid npc_security_vendor_patch_gap (lte: 2) at initial state
      state: { ...INITIAL_STATE, publicAwareness: 30, securityLevelOB: 3 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    // No notifications should be emitted to players
    expect(emitted["p1:game:notification"]).toBeUndefined();
    expect(room.firedThresholds?.size ?? 0).toBe(0);
  });
});

// ── NPC Triggers ──────────────────────────────────────────────────────────────

describe("checkThresholds — NPC triggers", () => {
  // npc_r1_anon_ob_intel is scheduled for round 1, intel phase → openbrain players
  it("schedule-based NPC trigger fires for matching round + phase", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      round: 1,
      phase: "intel",
      players: { p1: ob },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    const msgs = emitted["p1:message:receive"];
    expect(msgs).toBeDefined();
    const msg = msgs![0][1] as GameMessage;
    expect(msg.isNpc).toBe(true);
    expect(msg.from).toBe("__npc_anon__");
    expect(msg.fromName).toBe("Anonymous Source");
    expect(msg.to).toBe("p1");
    expect(msg.isTeamChat).toBe(false);
    expect(room.firedThresholds!.has("npc_r1_anon_ob_intel")).toBe(true);
  });

  it("schedule-based NPC trigger appends message to room.messages for replay", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      round: 1,
      phase: "intel",
      players: { p1: ob },
    });

    const { io } = createMockIo();
    checkThresholds(io, room);

    const npcMsgs = room.messages.filter((m) => m.isNpc);
    expect(npcMsgs.length).toBeGreaterThan(0);
    expect(npcMsgs[0].from).toBe("__npc_anon__");
  });

  it("schedule-based NPC trigger does NOT fire for wrong phase", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    // npc_r1_anon_ob_intel requires phase=intel; set phase=deliberation
    const room = makeRoom({
      round: 1,
      phase: "deliberation",
      players: { p1: ob },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    // Should not have fired the intel-phase trigger (but may fire deliberation one)
    expect(room.firedThresholds!.has("npc_r1_anon_ob_intel")).toBe(false);
  });

  it("schedule-based NPC trigger does NOT fire for wrong round", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    // npc_r4_anon_ob_crisis requires round=4; use round=1
    const room = makeRoom({
      round: 1,
      phase: "briefing",
      players: { p1: ob },
    });

    const { io } = createMockIo();
    checkThresholds(io, room);

    expect(room.firedThresholds!.has("npc_r4_anon_ob_crisis")).toBe(false);
  });

  it("NPC trigger fires at most once (idempotency)", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      round: 1,
      phase: "intel",
      players: { p1: ob },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);
    checkThresholds(io, room); // second call must be a no-op

    const msgs = emitted["p1:message:receive"] ?? [];
    // Count how many times the specific trigger was delivered
    const triggerMsgs = msgs.filter(([, m]) => (m as GameMessage).id?.startsWith("npc-npc_r1_anon_ob_intel"));
    expect(triggerMsgs.length).toBe(1);
  });

  it("condition-based NPC trigger fires when condition is met", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    // npc_r2_anon_alignment_warning: alignmentConfidence < 50
    const room = makeRoom({
      round: 2,
      phase: "intel",
      players: { p1: ob },
      state: { ...INITIAL_STATE, alignmentConfidence: 40 },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    expect(room.firedThresholds!.has("npc_r2_anon_alignment_warning")).toBe(true);
    const msgs = emitted["p1:message:receive"];
    expect(msgs).toBeDefined();
  });

  it("condition-based NPC trigger does NOT fire when condition is not met", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    // npc_r2_anon_alignment_warning: alignmentConfidence < 50 → not met at 70
    const room = makeRoom({
      round: 2,
      phase: "intel",
      players: { p1: ob },
      state: { ...INITIAL_STATE, alignmentConfidence: 70 },
    });

    const { io } = createMockIo();
    checkThresholds(io, room);

    expect(room.firedThresholds!.has("npc_r2_anon_alignment_warning")).toBeFalsy();
  });

  it("NPC trigger only targets players matching the trigger's faction", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const ext = makePlayer("p2", "external", "ext_nsa");
    // npc_r1_anon_ob_intel targets openbrain only
    const room = makeRoom({
      round: 1,
      phase: "intel",
      players: { p1: ob, p2: ext },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    // openbrain player gets the intel trigger
    const obMsgs = (emitted["p1:message:receive"] ?? []).filter(([, m]) => (m as GameMessage).isNpc);
    expect(obMsgs.length).toBeGreaterThan(0);

    // external player should NOT receive the openbrain-targeted trigger
    const extNpcMsgs = (emitted["p2:message:receive"] ?? []).filter(
      ([, m]) => (m as GameMessage).id === "npc-npc_r1_anon_ob_intel-p2",
    );
    expect(extNpcMsgs.length).toBe(0);
  });

  it("NPC trigger echoes to GM with _gmView flag", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      round: 1,
      phase: "intel",
      gmId: "gm1",
      players: { p1: ob },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    const gmMsgs = emitted["gm1:message:receive"];
    expect(gmMsgs).toBeDefined();
    const gmMsg = gmMsgs![0][1] as GameMessage & { _gmView?: boolean };
    expect(gmMsg._gmView).toBe(true);
    expect(gmMsg.isNpc).toBe(true);
  });

  it("NPC triggers do not fire in tutorial round (round 0)", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      round: 0,
      phase: "intel",
      players: { p1: ob },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    const npcMsgs = (emitted["p1:message:receive"] ?? []).filter(([, m]) => (m as GameMessage).isNpc);
    expect(npcMsgs.length).toBe(0);
  });

  it("players without faction/role are excluded from NPC targeting", () => {
    const noRole = makePlayer("p1", null, null);
    const ob = makePlayer("p2", "openbrain", "ob_ceo");
    const room = makeRoom({
      round: 1,
      phase: "intel",
      players: { p1: noRole, p2: ob },
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    // p1 has no faction/role → should not receive NPC messages
    const p1NpcMsgs = (emitted["p1:message:receive"] ?? []).filter(([, m]) => (m as GameMessage).isNpc);
    expect(p1NpcMsgs.length).toBe(0);
  });
});

// ── advancePhase calls checkThresholds for non-resolution phases ──────────────

describe("advancePhase — NPC triggers fire on phase transition", () => {
  it("schedule-based NPC trigger fires when advancePhase transitions to intel", () => {
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    // Start in briefing; advancing will transition to intel (round 1)
    const room = makeRoom({
      phase: "briefing",
      round: 1,
      players: { p1: ob },
    });

    const { io, emitted } = createMockIo();
    advancePhase(io, room);

    expect(room.phase).toBe("intel");
    // npc_r1_anon_ob_intel is scheduled for round 1, intel → should fire
    expect(room.firedThresholds!.has("npc_r1_anon_ob_intel")).toBe(true);
    const npcMsgs = (emitted["p1:message:receive"] ?? []).filter(([, m]) => (m as GameMessage).isNpc);
    expect(npcMsgs.length).toBeGreaterThan(0);
  });
});

// ── Timer regression tests ────────────────────────────────────────────────────

describe("timer sync regressions", () => {
  it("emits a fresh game:phase timer payload on phase transition", () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "TEST_TIMER_FRESH",
      phase: "deliberation",
      round: 1,
      players: { p1: player1 },
      timer: { endsAt: 1 }, // stale timer value that should be replaced
    });

    const { io, emitted } = createMockIo();
    advancePhase(io, room); // deliberation -> decision

    const phaseEvents = emitted[`${room.code}:game:phase`];
    expect(phaseEvents).toBeDefined();
    expect(phaseEvents!.length).toBeGreaterThan(0);

    const [, payload] = phaseEvents![phaseEvents!.length - 1];
    const data = payload as { phase: string; timer: { endsAt: number } };

    expect(data.phase).toBe("decision");
    expect(data.timer.endsAt).toBe(room.timer.endsAt);
    expect(data.timer.endsAt).toBeGreaterThan(Date.now());

    clearPhaseTimer(room);
  });

  it("extend-style timer mutation plus resync prevents early auto-advance", async () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "TEST_TIMER_EXTEND",
      phase: "decision",
      round: 1,
      players: { p1: player1 },
      timer: { endsAt: Date.now() + 40 },
    });

    const { io } = createMockIo();
    syncPhaseTimer(io, room);

    await wait(20);
    room.timer.endsAt += 120; // gm:extend-style shift of deadline
    syncPhaseTimer(io, room);

    await wait(40);
    // If old timeout were still active, this would have advanced already.
    expect(room.phase).toBe("decision");

    clearPhaseTimer(room);
  });
});

// ── emitContent — generated content merge ─────────────────────────────────────

/**
 * Helper: collect the game:content payloads emitted to a given socket.
 */
function getEmittedContent(emitted: Record<string, Array<[string, unknown]>>, socketId: string): AppContent[] {
  const events = emitted[`${socketId}:game:content`];
  if (!events || events.length === 0) return [];
  const [, payload] = events[events.length - 1]!;
  return (payload as { content: AppContent[] }).content;
}

/**
 * Build a generated AppContent entry with "gen-" prefixed IDs.
 */
function makeGenContent(faction: AppContent["faction"], app: AppId, count = 2): AppContent {
  const items: ContentItem[] = Array.from({ length: count }, (_, i) => ({
    id: `gen-test-${faction}-${app}-${i + 1}`,
    type: app === "news" ? "headline" as const : "tweet" as const,
    round: 1,
    body: `Generated ${app} item ${i + 1} for ${faction}`,
    timestamp: "2027-01-01T00:00:00Z",
    classification: "context" as const,
  }));
  return { faction, app, items };
}

describe("emitContent — INV-1: no generated content → identical to current behavior", () => {
  it("emits pre-authored content when no generated content is set", () => {
    const player = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ round: 1, players: { p1: player } });

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    const content = getEmittedContent(emitted, "p1");
    // Pre-authored round 1 openbrain content must be present
    expect(content.length).toBeGreaterThan(0);

    // Result must match personalized getContentForPlayer output
    const expected = getContentForPlayer(1, "openbrain", "ob_ceo", room.state);
    const nameMap = buildNameMap(room);
    expect(content).toEqual(personalizeContent(expected, nameMap));
  });

  it("skips players without faction/role", () => {
    const noRole = makePlayer("p1", null, null);
    const room = makeRoom({ round: 1, players: { p1: noRole } });

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    // No game:content should be emitted to a player with no faction
    expect(emitted["p1:game:content"]).toBeUndefined();
  });
});

describe("emitContent — INV-2: generated news replaces pre-authored news (no duplicates)", () => {
  it("replaces pre-authored news with generated news", () => {
    const player = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ round: 1, players: { p1: player } });

    const genNews = makeGenContent("openbrain", "news", 3);
    setGeneratedContent(room, 1, "openbrain", [genNews]);

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    const content = getEmittedContent(emitted, "p1");

    // Must contain news app content
    const newsEntries = content.filter((c) => c.app === "news");
    expect(newsEntries.length).toBeGreaterThan(0);

    // All news items must be from generated content (gen- prefix)
    const allNewsItems = newsEntries.flatMap((c) => c.items);
    for (const item of allNewsItems) {
      expect(item.id).toMatch(/^gen-/);
    }

    // Exactly 3 generated news items (from makeGenContent)
    expect(allNewsItems.length).toBe(3);
  });

  it("does not duplicate news — generated replaces pre-authored, not supplements", () => {
    const player = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ round: 1, players: { p1: player } });

    // Pre-authored already has news for round 1 openbrain
    const preAuthored = getContentForPlayer(1, "openbrain", "ob_ceo", room.state);
    const preAuthoredNews = preAuthored.filter((c) => c.app === "news").flatMap((c) => c.items);

    const genNews = makeGenContent("openbrain", "news", 2);
    setGeneratedContent(room, 1, "openbrain", [genNews]);

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    const content = getEmittedContent(emitted, "p1");
    const newsItems = content.filter((c) => c.app === "news").flatMap((c) => c.items);

    // No pre-authored news IDs should appear in the merged payload
    const preAuthoredNewsIds = new Set(preAuthoredNews.map((i) => i.id));
    for (const item of newsItems) {
      expect(preAuthoredNewsIds.has(item.id)).toBe(false);
    }
  });
});

describe("emitContent — INV-3: non-news/twitter apps always present regardless of generation", () => {
  it("email app remains in payload when news is replaced by generated content", () => {
    const player = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ round: 1, players: { p1: player } });

    const genNews = makeGenContent("openbrain", "news", 2);
    setGeneratedContent(room, 1, "openbrain", [genNews]);

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    const content = getEmittedContent(emitted, "p1");
    const appIds = content.map((c) => c.app);

    // Email is an accumulating app — must still be present
    expect(appIds).toContain("email");
    // News must be present (generated version)
    expect(appIds).toContain("news");
  });

  it("non-generated apps are unaffected when twitter is generated", () => {
    const player = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ round: 1, players: { p1: player } });

    const genTwitter = makeGenContent("openbrain", "twitter", 2);
    setGeneratedContent(room, 1, "openbrain", [genTwitter]);

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    const content = getEmittedContent(emitted, "p1");
    const appIds = content.map((c) => c.app);

    // Slack is an accumulating app — must still be present
    expect(appIds).toContain("slack");
    // Twitter must be present (generated version)
    expect(appIds).toContain("twitter");
    // All twitter items must be generated
    const twitterItems = content.filter((c) => c.app === "twitter").flatMap((c) => c.items);
    for (const item of twitterItems) {
      expect(item.id).toMatch(/^gen-/);
    }
  });
});

describe("emitContent — INV-4: content IDs are unique within a single emit payload", () => {
  it("deduplicates content IDs across all app entries", () => {
    const player = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ round: 1, players: { p1: player } });

    // Create two AppContent entries for the same app — this simulates a malformed generated payload
    // The dedup guard should keep only the first occurrence
    const genItem1: ContentItem = {
      id: "gen-dedup-test-001",
      type: "headline",
      round: 1,
      body: "Dedup test item 1",
      timestamp: "2027-01-01T00:00:00Z",
      classification: "context",
    };
    const genItem2: ContentItem = {
      id: "gen-dedup-test-001", // same ID — should be deduplicated
      type: "headline",
      round: 1,
      body: "Dedup test item 2 (duplicate ID)",
      timestamp: "2027-01-01T00:00:00Z",
      classification: "context",
    };
    // Two AppContent entries for "news" with overlapping IDs
    const genContent: AppContent[] = [
      { faction: "openbrain", app: "news", items: [genItem1, genItem2] },
    ];
    setGeneratedContent(room, 1, "openbrain", genContent);

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    const content = getEmittedContent(emitted, "p1");
    const allItems = content.flatMap((c) => c.items);
    const ids = allItems.map((i) => i.id);
    const uniqueIds = new Set(ids);

    // All IDs must be unique
    expect(ids.length).toBe(uniqueIds.size);
  });
});

describe("emitContent — critical paths: per-faction generation independence", () => {
  it("openbrain gets generated content, prometheus gets pre-authored when only openbrain generated", () => {
    const obPlayer = makePlayer("p1", "openbrain", "ob_ceo");
    const promPlayer = makePlayer("p2", "prometheus", "prom_ceo");
    const room = makeRoom({ round: 1, players: { p1: obPlayer, p2: promPlayer } });

    // Only set generated content for openbrain
    const genNews = makeGenContent("openbrain", "news", 3);
    setGeneratedContent(room, 1, "openbrain", [genNews]);
    // prometheus has NO generated content set

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    // openbrain player (p1) should get generated news
    const obContent = getEmittedContent(emitted, "p1");
    const obNewsItems = obContent.filter((c) => c.app === "news").flatMap((c) => c.items);
    expect(obNewsItems.every((i) => i.id.startsWith("gen-"))).toBe(true);

    // prometheus player (p2) should get personalized pre-authored content
    const promContent = getEmittedContent(emitted, "p2");
    const promExpected = getContentForPlayer(1, "prometheus", "prom_ceo", room.state);
    const nameMap = buildNameMap(room);
    expect(promContent).toEqual(personalizeContent(promExpected, nameMap));
  });
});

describe("emitContent — failure mode: empty generated array falls back to pre-authored", () => {
  it("empty generated content array falls back to pre-authored for that faction", () => {
    const player = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ round: 1, players: { p1: player } });

    // Set an EMPTY generated content array
    setGeneratedContent(room, 1, "openbrain", []);

    const { io, emitted } = createMockIo();
    emitContent(io, room);

    const content = getEmittedContent(emitted, "p1");
    const expected = getContentForPlayer(1, "openbrain", "ob_ceo", room.state);

    // Should get personalized pre-authored content
    const nameMap = buildNameMap(room);
    expect(content).toEqual(personalizeContent(expected, nameMap));
  });
});

// ── Structured Logging Tests ───────────────────────────────────────────────────

describe("INV-1: startGame logs game.started with correct player roster", () => {
  afterEach(() => _clearLoggers());

  it("logs game.started with playerCount and roster after startGame", () => {
    const spy = new SpyLogger();
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const p2 = makePlayer("p2", "prometheus", "prom_scientist");
    const room = makeRoom({
      code: "LOG1",
      phase: "lobby",
      players: { p1, p2 },
    });
    _setLoggerForRoom("LOG1", spy);

    const { io } = createMockIo();
    startGame(io, room);

    const startedCall = spy.calls.find(c => c.event === "game.started");
    expect(startedCall).toBeDefined();
    const data = startedCall!.data as { playerCount: number; roster: unknown[] };
    expect(data.playerCount).toBe(2);
    expect(data.roster).toHaveLength(2);
    expect(startedCall!.ctx).toMatchObject({ round: 1, phase: "briefing" });
  });

  it("roster entries include name, faction, and role", () => {
    const spy = new SpyLogger();
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ code: "LOG1ROSTER", phase: "lobby", players: { p1 } });
    _setLoggerForRoom("LOG1ROSTER", spy);

    const { io } = createMockIo();
    startGame(io, room);

    const startedCall = spy.calls.find(c => c.event === "game.started")!;
    const data = startedCall.data as { roster: Array<{ name: string; faction: string; role: string }> };
    expect(data.roster[0]).toMatchObject({ name: "Player p1", faction: "openbrain", role: "ob_ceo" });
  });
});

describe("INV-2: advancePhase logs phase.changed at every transition", () => {
  afterEach(() => _clearLoggers());

  it("logs phase.changed with round, phase, prevPhase, duration for each transition", () => {
    const spy = new SpyLogger();
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "LOG2",
      phase: "briefing",
      round: 1,
      players: { p1 },
    });
    _setLoggerForRoom("LOG2", spy);

    const { io } = createMockIo();
    advancePhase(io, room); // briefing → intel

    const phaseCall = spy.calls.find(c => c.event === "phase.changed");
    expect(phaseCall).toBeDefined();
    const data = phaseCall!.data as { round: number; phase: string; prevPhase: string; duration: number };
    expect(data.round).toBe(1);
    expect(data.phase).toBe("intel");
    expect(data.prevPhase).toBe("briefing");
    expect(data.duration).toBeGreaterThan(0);
    expect(phaseCall!.ctx).toMatchObject({ round: 1, phase: "intel", actorId: "system" });
  });

  it("full round cycle briefing→intel→deliberation→decision→resolution produces 5 phase.changed events", () => {
    const spy = new SpyLogger();
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "LOG2CYCLE",
      phase: "briefing",
      round: 1,
      players: { p1 },
    });
    _setLoggerForRoom("LOG2CYCLE", spy);

    const { io } = createMockIo();
    advancePhase(io, room); // briefing → intel
    advancePhase(io, room); // intel → deliberation
    advancePhase(io, room); // deliberation → decision
    advancePhase(io, room); // decision → resolution
    advancePhase(io, room); // resolution → briefing (round 2)

    const phaseChanges = spy.calls.filter(c => c.event === "phase.changed");
    expect(phaseChanges.length).toBe(5);

    const phases = phaseChanges.map(c => (c.data as { phase: string }).phase);
    expect(phases).toEqual(["intel", "deliberation", "decision", "resolution", "briefing"]);

    clearPhaseTimer(room);
  });

  it("logs decision.inaction for players who did not submit", () => {
    const spy = new SpyLogger();
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const p2 = makePlayer("p2", "prometheus", "prom_scientist");
    const room = makeRoom({
      code: "LOG2INACT",
      phase: "decision",
      round: 1,
      players: { p1, p2 },
      decisions: { p1: "some_option" }, // p2 did not submit
    });
    _setLoggerForRoom("LOG2INACT", spy);

    const { io } = createMockIo();
    advancePhase(io, room);

    const inactionCalls = spy.calls.filter(c => c.event === "decision.inaction");
    expect(inactionCalls.length).toBe(1);
    const data = inactionCalls[0].data as { playerId: string; role: string };
    expect(data.playerId).toBe("Player p2");
    expect(data.role).toBe("prom_scientist");
    expect(inactionCalls[0].ctx?.actorId).toBe("Player p2");
  });
});

// ── history[].stateAfter correctness ──

describe("emitResolution — history.stateAfter invariants", () => {
  afterEach(() => _clearLoggers());

  it("INV-3: stateBefore captures state before any mutation", () => {
    // Verify stateBefore is a snapshot of the pre-resolution state, not affected by penalties
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "HIST_INV3",
      phase: "decision",
      round: 1,
      players: { p1 },
      state: { ...INITIAL_STATE, obInternalTrust: 50 },
      playerActivity: {}, // penalty will fire: obInternalTrust −3
    });

    const { io } = createMockIo();
    advancePhase(io, room); // decision → resolution

    expect(room.history.length).toBe(1);
    expect(room.history[0].stateBefore.obInternalTrust).toBe(50);
  });

  it("INV-1: stateAfter includes activity penalty delta when player skips primary app", () => {
    // ob_ceo penalty: obInternalTrust −3 when email not opened this round
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "HIST_INV1",
      phase: "decision",
      round: 1,
      players: { p1 },
      state: { ...INITIAL_STATE, obInternalTrust: 50 },
      playerActivity: {}, // p1 did not open email → penalty fires
    });

    const { io } = createMockIo();
    advancePhase(io, room);

    expect(room.history.length).toBe(1);
    // stateAfter must include the penalty: 50 − 3 = 47
    expect(room.history[0].stateAfter.obInternalTrust).toBe(47);
    // stateAfter and stateBefore must differ on the penalised variable
    expect(room.history[0].stateAfter.obInternalTrust).not.toBe(
      room.history[0].stateBefore.obInternalTrust,
    );
  });

  it("INV-2: stateAfter is clamped when penalty would push a value below its minimum", () => {
    // ob_ceo penalty is −3 on obInternalTrust; starting at 2 → raw result −1, clamped to 0
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "HIST_INV2",
      phase: "decision",
      round: 1,
      players: { p1 },
      state: { ...INITIAL_STATE, obInternalTrust: 2 },
      playerActivity: {}, // penalty fires
    });

    const { io } = createMockIo();
    advancePhase(io, room);

    expect(room.history.length).toBe(1);
    const { stateAfter } = room.history[0];

    // Specific: clamped to 0, not −1
    expect(stateAfter.obInternalTrust).toBe(0);

    // General: every variable in stateAfter must be within its declared range
    for (const key of Object.keys(STATE_VARIABLE_RANGES) as (keyof StateVariables)[]) {
      const [min, max] = STATE_VARIABLE_RANGES[key];
      expect(stateAfter[key]).toBeGreaterThanOrEqual(min);
      expect(stateAfter[key]).toBeLessThanOrEqual(max);
    }
  });
});

describe("INV-3: emitResolution logs state.snapshot and state.delta", () => {
  afterEach(() => _clearLoggers());

  it("logs state.snapshot before and state.snapshot+state.delta after resolution", () => {
    const spy = new SpyLogger();
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "LOG3",
      phase: "decision",
      round: 1,
      players: { p1 },
      decisions: {},
      teamDecisions: {},
    });
    _setLoggerForRoom("LOG3", spy);

    const { io } = createMockIo();
    advancePhase(io, room); // decision → resolution (triggers emitResolution)

    const snapshots = spy.calls.filter(c => c.event === "state.snapshot");
    const deltas = spy.calls.filter(c => c.event === "state.delta");

    expect(snapshots.length).toBeGreaterThanOrEqual(2); // before + after
    expect(deltas.length).toBeGreaterThanOrEqual(1);

    // First snapshot has stateBefore
    const beforeSnap = snapshots.find(c => (c.data as Record<string, unknown>).stateBefore !== undefined);
    expect(beforeSnap).toBeDefined();

    // Last snapshot has stateAfter
    const afterSnap = snapshots.find(c => (c.data as Record<string, unknown>).stateAfter !== undefined);
    expect(afterSnap).toBeDefined();

    // delta has changes array
    const delta = deltas[0].data as { round: number; changes: unknown[] };
    expect(delta.round).toBe(1);
    expect(Array.isArray(delta.changes)).toBe(true);
  });

  it("state.delta captures correct before/after values when a threshold fires during resolution", () => {
    const spy = new SpyLogger();
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    // china_weight_theft fires when chinaWeightTheftProgress >= 100, adds +25 to chinaCapability
    const room = makeRoom({
      code: "LOG3DELTA",
      phase: "decision",
      round: 1,
      players: { p1: ob },
      decisions: {},
      teamDecisions: {},
      state: { ...INITIAL_STATE, chinaWeightTheftProgress: 100, chinaCapability: 50 },
    });
    _setLoggerForRoom("LOG3DELTA", spy);

    const { io } = createMockIo();
    advancePhase(io, room);

    const deltas = spy.calls.filter(c => c.event === "state.delta");
    expect(deltas.length).toBeGreaterThan(0);

    const delta = deltas[0].data as { changes: Array<{ variable: string; before: number; after: number }> };
    const chinaCapChange = delta.changes.find(ch => ch.variable === "chinaCapability");
    expect(chinaCapChange).toBeDefined();
    expect(chinaCapChange!.before).toBe(50);
    expect(chinaCapChange!.after).toBe(75); // 50 + 25 from threshold
  });
});

describe("INV-4: checkThresholds logs threshold.fired for each fired threshold", () => {
  afterEach(() => _clearLoggers());

  it("logs threshold.fired with thresholdId, triggerVariable, triggerValue when china_weight_theft fires", () => {
    const spy = new SpyLogger();
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "LOG4",
      players: { p1: ob },
      state: { ...INITIAL_STATE, chinaWeightTheftProgress: 100 },
    });
    _setLoggerForRoom("LOG4", spy);

    const { io } = createMockIo();
    checkThresholds(io, room);

    const fired = spy.calls.filter(c => c.event === "threshold.fired");
    expect(fired.length).toBeGreaterThanOrEqual(1);

    const wt = fired.find(c => (c.data as { thresholdId: string }).thresholdId === "china_weight_theft");
    expect(wt).toBeDefined();
    const data = wt!.data as { thresholdId: string; triggerVariable: string; triggerValue: number };
    expect(data.triggerVariable).toBe("chinaWeightTheftProgress");
    expect(data.triggerValue).toBe(100);
    expect(wt!.ctx?.actorId).toBe("system");
  });

  it("logs npc_trigger.fired for schedule-based NPC trigger", () => {
    const spy = new SpyLogger();
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "LOG4NPC",
      round: 1,
      phase: "intel",
      players: { p1: ob },
    });
    _setLoggerForRoom("LOG4NPC", spy);

    const { io } = createMockIo();
    checkThresholds(io, room);

    const npcFired = spy.calls.filter(c => c.event === "npc_trigger.fired");
    expect(npcFired.length).toBeGreaterThan(0);

    const r1Trigger = npcFired.find(c =>
      (c.data as { triggerId: string }).triggerId === "npc_r1_anon_ob_intel",
    );
    expect(r1Trigger).toBeDefined();
    const data = r1Trigger!.data as { triggerId: string; npcId: string; wasCondition: boolean };
    expect(data.npcId).toBe("__npc_anon__");
    expect(data.wasCondition).toBe(false);
    expect(r1Trigger!.ctx?.actorId).toBe("system");
  });
});

describe("INV-5: all logged events have valid round and phase context", () => {
  afterEach(() => _clearLoggers());

  it("phase.changed events always carry round and phase in ctx", () => {
    const spy = new SpyLogger();
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "LOG5",
      phase: "briefing",
      round: 2,
      players: { p1 },
    });
    _setLoggerForRoom("LOG5", spy);

    const { io } = createMockIo();
    advancePhase(io, room);

    const phaseChanges = spy.calls.filter(c => c.event === "phase.changed");
    for (const call of phaseChanges) {
      expect(call.ctx?.round).toBeDefined();
      expect(call.ctx?.phase).toBeDefined();
    }
    clearPhaseTimer(room);
  });
});

describe("Failure mode: NullLogger when no logger registered (LOG_ENABLED=false equivalent)", () => {
  afterEach(() => _clearLoggers());

  it("checkThresholds does not throw when no logger is registered for the room", () => {
    // Do NOT call _setLoggerForRoom — getLoggerForRoom will return NullLogger
    const ob = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "NOLOGGER",
      players: { p1: ob },
      state: { ...INITIAL_STATE, chinaWeightTheftProgress: 100 },
    });

    const { io } = createMockIo();
    expect(() => checkThresholds(io, room)).not.toThrow();
  });

  it("startGame does not throw when no logger is registered", () => {
    const p1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({ code: "NOLOGGER2", phase: "lobby", players: { p1 } });

    const { io } = createMockIo();
    expect(() => startGame(io, room)).not.toThrow();
  });
});

// ── Content personalization ──

function makeContentItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "test-item",
    type: "message",
    round: 1,
    body: "Hello world",
    timestamp: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeAppContent(items: ContentItem[], overrides: Partial<AppContent> = {}): AppContent {
  return {
    faction: "openbrain",
    app: "slack" as AppId,
    items,
    ...overrides,
  };
}

describe("buildNameMap", () => {
  it("maps role_id to first name for each player with role and name", () => {
    const room = makeRoom({
      players: {
        s1: { id: "s1", name: "Alice Smith", faction: "openbrain", role: "ob_ceo", isLeader: true, connected: true },
        s2: { id: "s2", name: "Bob Jones", faction: "prometheus", role: "prom_scientist", isLeader: false, connected: true },
      },
    });
    const nameMap = buildNameMap(room);
    expect(nameMap.get("ob_ceo")).toBe("Alice");
    expect(nameMap.get("prom_scientist")).toBe("Bob");
  });

  it("excludes players with no role", () => {
    const room = makeRoom({
      players: {
        s1: { id: "s1", name: "Alice Smith", faction: "openbrain", role: null, isLeader: false, connected: true },
      },
    });
    const nameMap = buildNameMap(room);
    expect(nameMap.size).toBe(0);
  });

  it("excludes players with no name", () => {
    const room = makeRoom({
      players: {
        s1: { id: "s1", name: "", faction: "openbrain", role: "ob_ceo", isLeader: false, connected: true },
      },
    });
    const nameMap = buildNameMap(room);
    expect(nameMap.size).toBe(0);
  });

  it("uses only the first name when player has a full name", () => {
    const room = makeRoom({
      players: {
        s1: { id: "s1", name: "Jean-Claude Van Damme", faction: "china", role: "china_director", isLeader: true, connected: true },
      },
    });
    const nameMap = buildNameMap(room);
    expect(nameMap.get("china_director")).toBe("Jean-Claude");
  });
});

describe("personalizeText", () => {
  it("INV-1: resolves {ob_ceo} to the OB CEO player first name", () => {
    const nameMap = new Map([["ob_ceo", "Alice"]]);
    expect(personalizeText("Hello {ob_ceo}, welcome.", nameMap)).toBe("Hello Alice, welcome.");
  });

  it("INV-2: resolves {prom_scientist} to the Prometheus scientist first name", () => {
    const nameMap = new Map([["prom_scientist", "Bob"]]);
    expect(personalizeText("Report from {prom_scientist}.", nameMap)).toBe("Report from Bob.");
  });

  it("INV-3: cross-faction: OB text with {prom_ceo} resolves correctly", () => {
    const nameMap = new Map([["ob_ceo", "Alice"], ["prom_ceo", "Carlos"]]);
    expect(personalizeText("OB CEO {ob_ceo} and Prom CEO {prom_ceo} met.", nameMap)).toBe("OB CEO Alice and Prom CEO Carlos met.");
  });

  it("INV-4: unmatched placeholder passes through unchanged", () => {
    const nameMap = new Map([["ob_ceo", "Alice"]]);
    expect(personalizeText("Hello {nonexistent_role}!", nameMap)).toBe("Hello {nonexistent_role}!");
  });

  it("resolves multiple placeholders in one body string", () => {
    const nameMap = new Map([["ob_ceo", "Alice"], ["prom_scientist", "Bob"]]);
    expect(personalizeText("{ob_ceo} and {prom_scientist} are both here.", nameMap)).toBe("Alice and Bob are both here.");
  });

  it("leaves all placeholders unchanged when name map is empty", () => {
    const nameMap = new Map<string, string>();
    expect(personalizeText("Dear {ob_ceo}, meet {prom_ceo}.", nameMap)).toBe("Dear {ob_ceo}, meet {prom_ceo}.");
  });
});

describe("personalizeContent", () => {
  it("INV-1/INV-2: personalizes body with player name", () => {
    const nameMap = new Map([["ob_ceo", "Alice"]]);
    const items = [makeContentItem({ body: "Hello {ob_ceo}" })];
    const [result] = personalizeContent([makeAppContent(items)], nameMap);
    expect(result.items[0].body).toBe("Hello Alice");
  });

  it("INV-5: sender field is never modified", () => {
    const nameMap = new Map([["ob_ceo", "Alice"]]);
    const items = [makeContentItem({ body: "body", sender: "{ob_ceo} NPC", senderRole: "ob_ceo" })];
    const [result] = personalizeContent([makeAppContent(items)], nameMap);
    expect(result.items[0].sender).toBe("{ob_ceo} NPC");
  });

  it("INV-6: subject fields are personalized", () => {
    const nameMap = new Map([["ob_ceo", "Alice"]]);
    const items = [makeContentItem({ body: "body", subject: "RE: {ob_ceo}" })];
    const [result] = personalizeContent([makeAppContent(items)], nameMap);
    expect(result.items[0].subject).toBe("RE: Alice");
  });

  it("INV-7: items without subject field do not break", () => {
    const nameMap = new Map([["ob_ceo", "Alice"]]);
    const items = [makeContentItem({ body: "Hello {ob_ceo}", subject: undefined })];
    const [result] = personalizeContent([makeAppContent(items)], nameMap);
    expect(result.items[0].subject).toBeUndefined();
    expect(result.items[0].body).toBe("Hello Alice");
  });

  it("empty name map leaves all placeholders unchanged", () => {
    const nameMap = new Map<string, string>();
    const items = [makeContentItem({ body: "{ob_ceo} message", subject: "From {ob_ceo}" })];
    const [result] = personalizeContent([makeAppContent(items)], nameMap);
    expect(result.items[0].body).toBe("{ob_ceo} message");
    expect(result.items[0].subject).toBe("From {ob_ceo}");
  });
});

// ── INV-1 & INV-2: gm:advance + pending timer race condition ──

describe("advancePhase race condition — timer + manual advance", () => {
  it("INV-1: manual advance with pending timer causes exactly 1 phase transition", async () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "RACE_TEST_1",
      phase: "briefing",
      round: 1,
      players: { p1: player1 },
      timer: { endsAt: Date.now() + 50 },
    });

    const { io } = createMockIo();
    // Schedule a timer that would fire in 50ms
    syncPhaseTimer(io, room);
    const phaseBeforeAdvance = room.phase;

    // Manually advance — this should clear the timer first, then advance once
    clearPhaseTimer(room);
    advancePhase(io, room);
    const phaseAfterManual = room.phase;

    // Wait past the timer deadline to ensure timer callback doesn't fire again
    await wait(100);

    expect(phaseBeforeAdvance).toBe("briefing");
    // Phase should have advanced exactly once (briefing → intel)
    expect(phaseAfterManual).toBe("intel");
    // After waiting, phase should still be the same — no double-advance
    expect(room.phase).toBe("intel");

    clearPhaseTimer(room);
  });

  it("INV-2: timer callback does not fire after clearPhaseTimer is called", async () => {
    const player1 = makePlayer("p1", "openbrain", "ob_ceo");
    const room = makeRoom({
      code: "RACE_TEST_2",
      phase: "briefing",
      round: 1,
      players: { p1: player1 },
      timer: { endsAt: Date.now() + 50 },
    });

    const { io } = createMockIo();
    syncPhaseTimer(io, room);

    // Cancel the timer before it fires (simulating what gm:advance does)
    clearPhaseTimer(room);

    // Wait past the original deadline
    await wait(100);

    // Phase must remain unchanged — the timer must have been cancelled
    expect(room.phase).toBe("briefing");
  });
});
