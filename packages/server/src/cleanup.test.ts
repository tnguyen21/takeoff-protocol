import { describe, it, expect, beforeEach } from "bun:test";
import { clearPhaseTimer, syncPhaseTimer, advancePhase } from "./game.js";
import { extendUses, cleanupRoom } from "./extendUses.js";
import { rooms, deleteRoom, pruneAbandonedRooms, allDisconnectedAt, recordAllDisconnected, clearAllDisconnected } from "./rooms.js";
import { INITIAL_STATE, TOTAL_ROUNDS } from "@takeoff/shared";
import type { GameRoom, Player } from "@takeoff/shared";
import { _setLoggerForRoom, _clearLoggers } from "./logger/registry.js";
import type { EventContext } from "./logger/types.js";

// ── Minimal SpyLogger ──

class SpyLogger {
  calls: unknown[] = [];
  log(event: string, data: unknown, ctx?: EventContext): void { this.calls.push({ event, data, ctx }); }
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
  get rejections(): number { return 0; }
}

// ── Helpers ──

function makePlayer(id: string): Player {
  return { id, name: `Player ${id}`, faction: "openbrain", role: "ob_ceo", isLeader: true, connected: true };
}

function makeRoom(code: string, overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    code,
    phase: "resolution",
    round: TOTAL_ROUNDS,
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
    ...overrides,
  };
}

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

beforeEach(() => {
  _clearLoggers();
  extendUses.clear();
  allDisconnectedAt.clear();
  // Remove any rooms added by tests (avoid cross-test pollution)
  for (const code of [...rooms.keys()]) {
    if (/^[A-Z0-9]{4}$/.test(code)) rooms.delete(code);
  }
});

// ── INV-3: clearPhaseTimer does not throw for unknown room codes ──

describe("clearPhaseTimer", () => {
  it("does not throw when called for a room with no active timer", () => {
    const room = makeRoom("UNKN");
    expect(() => clearPhaseTimer(room)).not.toThrow();
  });

  it("is safe to call multiple times on the same room", () => {
    const room = makeRoom("SAFE");
    expect(() => {
      clearPhaseTimer(room);
      clearPhaseTimer(room);
    }).not.toThrow();
  });
});

// ── INV-1: After game ends (phase=ending), phaseTimers has no entry for the room ──

describe("advancePhase — ending cleanup", () => {
  it("clears the phase timer when game transitions to ending", async () => {
    const spy = new SpyLogger();
    _setLoggerForRoom("END1", spy as never);

    const { io } = createMockIo();
    const room = makeRoom("END1", {
      phase: "resolution",
      round: TOTAL_ROUNDS,
      timer: { endsAt: Date.now() + 5000 },
    });

    // Set a live timer to confirm it gets cleared
    syncPhaseTimer(io, room);

    // Advance to ending — this calls clearPhaseTimer internally
    advancePhase(io, room);

    expect(room.phase).toBe("ending");

    // Calling clearPhaseTimer again should be a no-op (timer was already removed)
    expect(() => clearPhaseTimer(room)).not.toThrow();

    // The timer should not re-fire — wait a tick to ensure no phantom advance
    await new Promise((r) => setTimeout(r, 20));
    // If timer were still live it would have triggered advancePhase, changing phase;
    // since ending is terminal, re-entry returns early, so phase stays "ending"
    expect(room.phase).toBe("ending");
  });
});

// ── INV-2: After cleanupRoom, no extendUses keys start with the room code ──

describe("cleanupRoom", () => {
  it("removes all extendUses entries for the given room code", () => {
    extendUses.set("ROOM:1:deliberation", 1);
    extendUses.set("ROOM:1:decision", 2);
    extendUses.set("ROOM:2:briefing", 1);
    // Unrelated room entry should survive
    extendUses.set("OTHR:1:decision", 1);

    cleanupRoom("ROOM");

    for (const key of extendUses.keys()) {
      expect(key.startsWith("ROOM:")).toBe(false);
    }
    // Unrelated room untouched
    expect(extendUses.has("OTHR:1:decision")).toBe(true);
  });

  it("is safe to call on a room with no extendUses entries", () => {
    expect(() => cleanupRoom("NONE")).not.toThrow();
    expect(extendUses.size).toBe(0);
  });

  it("is safe to call twice (idempotent)", () => {
    extendUses.set("IDEM:1:decision", 1);
    cleanupRoom("IDEM");
    expect(() => cleanupRoom("IDEM")).not.toThrow();
    for (const key of extendUses.keys()) {
      expect(key.startsWith("IDEM:")).toBe(false);
    }
  });

  it("does not leave stale entries that would bleed into a room-code reuse", () => {
    // Simulate a game that left entries, then cleanup, then new game
    extendUses.set("REUSE:1:decision", 2);
    cleanupRoom("REUSE");

    // New game in same code starts fresh
    expect(extendUses.get("REUSE:1:decision")).toBeUndefined();
  });
});

// ── INV-1 (game end): advancePhase clears extend uses on game end ──

describe("advancePhase — game end clears extend uses", () => {
  it("removes extendUses entries when game transitions to ending", () => {
    const spy = new SpyLogger();
    _setLoggerForRoom("GEEND", spy as never);

    const { io } = createMockIo();
    const room = makeRoom("GEEND", {
      phase: "resolution",
      round: TOTAL_ROUNDS,
      timer: { endsAt: Date.now() + 5000 },
    });

    extendUses.set("GEEND:5:deliberation", 1);
    extendUses.set("GEEND:5:decision", 2);
    extendUses.set("OTHER:5:decision", 1);

    advancePhase(io, room);

    expect(room.phase).toBe("ending");
    for (const key of extendUses.keys()) {
      expect(key.startsWith("GEEND:")).toBe(false);
    }
    // Unrelated room not affected
    expect(extendUses.has("OTHER:5:decision")).toBe(true);
  });
});

// ── INV-2: deleteRoom removes room from the rooms Map ──

describe("deleteRoom", () => {
  it("removes the room from the rooms Map", () => {
    const room = makeRoom("DEL1");
    rooms.set("DEL1", room);
    expect(rooms.has("DEL1")).toBe(true);

    deleteRoom("DEL1");

    expect(rooms.has("DEL1")).toBe(false);
  });

  it("also clears the allDisconnectedAt entry", () => {
    const room = makeRoom("DEL2");
    rooms.set("DEL2", room);
    allDisconnectedAt.set("DEL2", Date.now() - 1000);

    deleteRoom("DEL2");

    expect(allDisconnectedAt.has("DEL2")).toBe(false);
  });

  it("is safe to call on an unknown room code", () => {
    expect(() => deleteRoom("GONE")).not.toThrow();
  });
});

// ── TTL pruning invariants ──

describe("pruneAbandonedRooms", () => {
  // INV-2: After pruning, the room is in the pruned list
  it("returns room codes that have been abandoned past the TTL", () => {
    const room = makeRoom("PRUNE");
    room.players = { p1: makePlayer("p1") };
    room.players.p1.connected = false;
    rooms.set("PRUNE", room);
    allDisconnectedAt.set("PRUNE", Date.now() - 31 * 60 * 1000); // 31 min ago

    const pruned = pruneAbandonedRooms(30 * 60 * 1000);

    expect(pruned).toContain("PRUNE");
  });

  // INV-3: Active rooms (with connected players) are never pruned
  it("never prunes rooms with at least one connected player", () => {
    const room = makeRoom("ACTV");
    room.players = {
      p1: makePlayer("p1"),
      p2: { ...makePlayer("p2"), connected: false },
    };
    rooms.set("ACTV", room);
    allDisconnectedAt.set("ACTV", Date.now() - 99 * 60 * 1000); // way past TTL

    const pruned = pruneAbandonedRooms(30 * 60 * 1000);

    expect(pruned).not.toContain("ACTV");
    // allDisconnectedAt entry should be cleared since room is active
    expect(allDisconnectedAt.has("ACTV")).toBe(false);
  });

  // INV-4: Rooms disconnected less than TTL ago are not pruned
  it("does not prune rooms abandoned less than TTL ago", () => {
    const room = makeRoom("WAIT");
    room.players = { p1: { ...makePlayer("p1"), connected: false } };
    rooms.set("WAIT", room);
    allDisconnectedAt.set("WAIT", Date.now() - 10 * 60 * 1000); // only 10 min ago

    const pruned = pruneAbandonedRooms(30 * 60 * 1000);

    expect(pruned).not.toContain("WAIT");
  });

  it("does not prune rooms with no allDisconnectedAt entry (never abandoned)", () => {
    const room = makeRoom("LIVE");
    room.players = { p1: makePlayer("p1") };
    rooms.set("LIVE", room);
    // No entry in allDisconnectedAt

    const pruned = pruneAbandonedRooms(30 * 60 * 1000);

    expect(pruned).not.toContain("LIVE");
  });
});

// ── TTL disconnect tracking helpers ──

describe("recordAllDisconnected / clearAllDisconnected", () => {
  it("records the current timestamp for a room", () => {
    const before = Date.now();
    recordAllDisconnected("DISC");
    const after = Date.now();

    const ts = allDisconnectedAt.get("DISC")!;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("clearAllDisconnected removes the entry", () => {
    recordAllDisconnected("CLR1");
    expect(allDisconnectedAt.has("CLR1")).toBe(true);

    clearAllDisconnected("CLR1");
    expect(allDisconnectedAt.has("CLR1")).toBe(false);
  });

  it("clearAllDisconnected is safe when no entry exists", () => {
    expect(() => clearAllDisconnected("NOENT")).not.toThrow();
  });

  it("reconnecting player clears the TTL (room survives pruning)", () => {
    const room = makeRoom("RCON");
    const p1 = makePlayer("p1");
    p1.connected = false;
    room.players = { p1 };
    rooms.set("RCON", room);
    allDisconnectedAt.set("RCON", Date.now() - 99 * 60 * 1000); // past TTL

    // Simulate reconnect: mark player connected, then clearAllDisconnected
    room.players.p1.connected = true;
    clearAllDisconnected("RCON");

    const pruned = pruneAbandonedRooms(30 * 60 * 1000);
    expect(pruned).not.toContain("RCON");
  });
});
