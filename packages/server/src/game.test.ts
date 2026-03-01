import { describe, it, expect } from "bun:test";
import { buildNarrative, advancePhase } from "./game.js";
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
