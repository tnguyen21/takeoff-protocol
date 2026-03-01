import { describe, it, expect } from "bun:test";
import { buildNarrative, advancePhase, checkThresholds, startTutorial, endTutorial } from "./game.js";
import { INITIAL_STATE } from "@takeoff/shared";
import type { GameRoom, Player, StateVariables } from "@takeoff/shared";

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
      state: { ...INITIAL_STATE }, // all at safe defaults
    });

    const { io, emitted } = createMockIo();
    checkThresholds(io, room);

    // No notifications should be emitted to players
    expect(emitted["p1:game:notification"]).toBeUndefined();
    expect(room.firedThresholds?.size ?? 0).toBe(0);
  });
});
