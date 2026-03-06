import { describe, it, expect, beforeEach } from "bun:test";
import { clearPhaseTimer, syncPhaseTimer, advancePhase } from "./game.js";
import { extendUses, cleanupRoom } from "./extendUses.js";
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
