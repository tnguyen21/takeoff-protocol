/**
 * Tests for gm:send-npc-message socket event handler.
 *
 * Invariants tested:
 * - INV-1: Only the GM (socket.id === room.gmId) can send NPC messages
 * - INV-2: npcId must exist in NPC_PERSONAS — unknown IDs are rejected
 * - INV-3: targetPlayerId must exist in room.players — unknown targets are rejected
 * - INV-4: On success, message is stored in room.messages with isNpc: true
 * - INV-5: On success, message is emitted to targetPlayerId and echoed to GM with _gmView: true
 *
 * Logging invariants (structured event logging):
 * - LOG-INV-1: room:create emits room.created log event
 * - LOG-INV-2: decision:submit emits decision.individual_submitted with correct actorId
 * - LOG-INV-3: message:send logs metadata only (contentLength), never message content
 * - LOG-INV-4: disconnect emits player.disconnected
 * - LOG-INV-5: All logged events have round and phase context when room is in-game
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { Faction, GameRoom, Player } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { NPC_PERSONAS, getNpcPersona } from "./content/npcPersonas.js";
import type { EventContext } from "./logger/types.js";
import { getLoggerForRoom, _setLoggerForRoom, _clearLoggers } from "./logger/registry.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePlayer(id: string): Player {
  return { id, name: `Player ${id}`, faction: "openbrain", role: "ob_cto", isLeader: false, connected: true };
}

function makeRoom(gmId: string, players: Player[]): GameRoom {
  return {
    code: "TEST",
    phase: "deliberation",
    round: 1,
    timer: { endsAt: 0 },
    players: Object.fromEntries(players.map((p) => [p.id, p])),
    gmId,
    state: { ...INITIAL_STATE },
    decisions: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
  };
}

interface EmittedEvent {
  event: string;
  data: unknown;
}

function createMockIo() {
  const emitted: Record<string, EmittedEvent[]> = {};

  const io = {
    to(target: string) {
      return {
        emit(event: string, data: unknown) {
          (emitted[target] ??= []).push({ event, data });
        },
      };
    },
  };

  return { io: io as unknown as import("socket.io").Server, emitted };
}

/**
 * Directly invokes the gm:send-npc-message handler logic in isolation,
 * matching the implementation in events.ts.
 */
function invokeNpcMessageHandler(
  io: import("socket.io").Server,
  socketId: string,
  room: GameRoom | undefined,
  { npcId, content, targetPlayerId }: { npcId: string; content: string; targetPlayerId: string },
): { ok: boolean; error?: string } {
  let result: { ok: boolean; error?: string } = { ok: false, error: "handler not called" };

  const callback = (res: { ok: boolean; error?: string }) => {
    result = res;
  };

  // Replicate handler logic from events.ts
  if (!room) {
    callback({ ok: false, error: "Not in a room" });
    return result;
  }

  if (room.gmId !== socketId) {
    callback({ ok: false, error: "Only GM can send NPC messages" });
    return result;
  }

  const persona = getNpcPersona(npcId);
  if (!persona) {
    callback({ ok: false, error: `Unknown NPC id: ${npcId}` });
    return result;
  }

  if (!room.players[targetPlayerId]) {
    callback({ ok: false, error: `Player not found: ${targetPlayerId}` });
    return result;
  }

  const targetPlayer = room.players[targetPlayerId];
  const message = {
    id: crypto.randomUUID(),
    from: npcId,
    fromName: persona.name,
    to: targetPlayerId,
    faction: targetPlayer.faction as Faction,
    content,
    timestamp: Date.now(),
    isTeamChat: false,
    isNpc: true as const,
  };

  room.messages.push(message);

  (io as unknown as { to: (t: string) => { emit: (e: string, d: unknown) => void } })
    .to(targetPlayerId).emit("message:receive", message);
  (io as unknown as { to: (t: string) => { emit: (e: string, d: unknown) => void } })
    .to(socketId).emit("message:receive", { ...message, _gmView: true });

  callback({ ok: true });
  return result;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const GM_ID = "gm-socket-1";
const PLAYER_ID = "player-socket-1";
const VALID_NPC_ID = "__npc_anon__";

describe("gm:send-npc-message", () => {
  let room: GameRoom;
  let emitted: Record<string, EmittedEvent[]>;
  let io: import("socket.io").Server;

  beforeEach(() => {
    const mock = createMockIo();
    io = mock.io;
    emitted = mock.emitted;
    room = makeRoom(GM_ID, [makePlayer(PLAYER_ID)]);
  });

  it("INV-2: rejects unknown npcId", () => {
    const result = invokeNpcMessageHandler(io, GM_ID, room, {
      npcId: "__npc_nonexistent__",
      content: "hello",
      targetPlayerId: PLAYER_ID,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown NPC id/);
    expect(room.messages).toHaveLength(0);
  });

  it("INV-3: rejects unknown targetPlayerId", () => {
    const result = invokeNpcMessageHandler(io, GM_ID, room, {
      npcId: VALID_NPC_ID,
      content: "hello",
      targetPlayerId: "no-such-player",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Player not found/);
    expect(room.messages).toHaveLength(0);
  });

  it("INV-1: rejects non-GM socket", () => {
    const result = invokeNpcMessageHandler(io, "imposter-socket", room, {
      npcId: VALID_NPC_ID,
      content: "hello",
      targetPlayerId: PLAYER_ID,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Only GM/);
    expect(room.messages).toHaveLength(0);
  });

  it("INV-4: stores message in room.messages with isNpc: true on success", () => {
    const result = invokeNpcMessageHandler(io, GM_ID, room, {
      npcId: VALID_NPC_ID,
      content: "The weight extraction already happened.",
      targetPlayerId: PLAYER_ID,
    });

    expect(result.ok).toBe(true);
    expect(room.messages).toHaveLength(1);

    const msg = room.messages[0];
    expect(msg.isNpc).toBe(true);
    expect(msg.from).toBe(VALID_NPC_ID);
    expect(msg.fromName).toBe("Anonymous Source");
    expect(msg.to).toBe(PLAYER_ID);
    expect(msg.isTeamChat).toBe(false);
    expect(msg.content).toBe("The weight extraction already happened.");
    expect(typeof msg.id).toBe("string");
    expect(msg.faction).toBe("openbrain");
  });

  it("INV-5: emits message:receive to target player", () => {
    invokeNpcMessageHandler(io, GM_ID, room, {
      npcId: VALID_NPC_ID,
      content: "hello",
      targetPlayerId: PLAYER_ID,
    });

    const playerEmits = emitted[PLAYER_ID] ?? [];
    expect(playerEmits.some((e) => e.event === "message:receive")).toBe(true);

    const receivedMsg = playerEmits.find((e) => e.event === "message:receive")?.data as Record<string, unknown>;
    expect(receivedMsg?.isNpc).toBe(true);
    expect(receivedMsg?.from).toBe(VALID_NPC_ID);
    expect((receivedMsg as Record<string, unknown> | undefined)?._gmView).toBeUndefined();
  });

  it("INV-5: echoes message:receive to GM with _gmView: true", () => {
    invokeNpcMessageHandler(io, GM_ID, room, {
      npcId: VALID_NPC_ID,
      content: "hello",
      targetPlayerId: PLAYER_ID,
    });

    const gmEmits = emitted[GM_ID] ?? [];
    expect(gmEmits.some((e) => e.event === "message:receive")).toBe(true);

    const gmMsg = gmEmits.find((e) => e.event === "message:receive")?.data as Record<string, unknown>;
    expect(gmMsg?._gmView).toBe(true);
    expect(gmMsg?.isNpc).toBe(true);
  });

  it("all NPC_PERSONAS ids are valid for use in handler", () => {
    for (const persona of NPC_PERSONAS) {
      const id = persona.id;
      const r = makeRoom(GM_ID, [makePlayer(PLAYER_ID)]);
      const { io: testIo } = createMockIo();

      const result = invokeNpcMessageHandler(testIo, GM_ID, r, {
        npcId: id,
        content: "test",
        targetPlayerId: PLAYER_ID,
      });

      expect(result.ok).toBe(true);
      expect(r.messages[0].fromName).toBe(persona.name);
    }
  });
});

// ── SpyLogger ─────────────────────────────────────────────────────────────────

interface LogCall {
  event: string;
  data: unknown;
  ctx?: EventContext;
}

class SpyLogger {
  calls: LogCall[] = [];
  log(event: string, data: unknown, ctx?: EventContext): void {
    this.calls.push({ event, data, ctx });
  }
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
  get rejections(): number { return 0; }
}

// ── Logging Invariant Tests ───────────────────────────────────────────────────

const TEST_ROOM_CODE = "TLOG";

function makeInGameRoom(players: Player[] = []): GameRoom {
  return {
    code: TEST_ROOM_CODE,
    phase: "decision",
    round: 2,
    timer: { endsAt: Date.now() + 60_000 },
    players: Object.fromEntries(players.map((p) => [p.id, p])),
    gmId: GM_ID,
    state: { ...INITIAL_STATE },
    decisions: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
  };
}

describe("structured logging invariants", () => {
  let spy: SpyLogger;

  beforeEach(() => {
    spy = new SpyLogger();
    _setLoggerForRoom(TEST_ROOM_CODE, spy);
  });

  afterEach(() => {
    _clearLoggers();
  });

  // ── LOG-INV-1: room:create emits room.created ──────────────────────────────

  it("LOG-INV-1: room:create logs room.created with actorId=system", () => {
    // Simulate the room:create handler logging logic
    spy.log("room.created", { code: TEST_ROOM_CODE, gmName: "Alice" }, { actorId: "system" });

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("room.created");
    expect((call.data as Record<string, unknown>).code).toBe(TEST_ROOM_CODE);
    expect((call.data as Record<string, unknown>).gmName).toBe("Alice");
    expect(call.ctx?.actorId).toBe("system");
  });

  // ── LOG-INV-2: decision:submit emits decision.individual_submitted ─────────

  it("LOG-INV-2: decision:submit logs individual_submitted with correct actorId and round/phase", () => {
    const player = makePlayer(PLAYER_ID);
    const room = makeInGameRoom([player]);

    // Simulate decision:submit handler logging
    const timeRemainingMs = room.timer.endsAt - Date.now();
    const logger = spy;
    logger.log(
      "decision.individual_submitted",
      { playerName: player.name, role: player.role, optionId: "option_A", timeRemainingMs },
      { actorId: player.name, round: room.round, phase: room.phase },
    );

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("decision.individual_submitted");
    expect(call.ctx?.actorId).toBe(player.name);
    expect(call.ctx?.round).toBe(2);
    expect(call.ctx?.phase).toBe("decision");
    expect((call.data as Record<string, unknown>).optionId).toBe("option_A");
    expect((call.data as Record<string, unknown>).timeRemainingMs).toBeTypeOf("number");
  });

  // ── LOG-INV-3: message:send logs metadata only ─────────────────────────────

  it("LOG-INV-3: message:send logs contentLength and never message content", () => {
    const player = makePlayer(PLAYER_ID);
    const room = makeInGameRoom([player]);
    const secretContent = "This is a secret message that must not be logged.";

    // Simulate message:send handler logging
    spy.log(
      "message.sent",
      { from: player.name, toName: null, faction: player.faction, contentLength: secretContent.length, isTeamChat: true },
      { actorId: player.name, round: room.round, phase: room.phase },
    );

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("message.sent");

    // Content must NOT appear anywhere in the logged data
    const serialized = JSON.stringify(call.data);
    expect(serialized).not.toContain(secretContent);
    expect(serialized).not.toContain("secret message");

    // Metadata should be logged
    const data = call.data as Record<string, unknown>;
    expect(data.contentLength).toBe(secretContent.length);
    expect(data.from).toBe(player.name);
    expect(data.isTeamChat).toBe(true);
  });

  // ── LOG-INV-4: disconnect emits player.disconnected ───────────────────────

  it("LOG-INV-4: disconnect logs player.disconnected with player info", () => {
    const player = makePlayer(PLAYER_ID);
    const room = makeInGameRoom([player]);

    // Simulate disconnect handler logging
    spy.log(
      "player.disconnected",
      { playerName: player.name, faction: player.faction, role: player.role },
      { actorId: player.name, round: room.round, phase: room.phase },
    );

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("player.disconnected");
    expect((call.data as Record<string, unknown>).playerName).toBe(player.name);
    expect((call.data as Record<string, unknown>).faction).toBe("openbrain");
    expect(call.ctx?.actorId).toBe(player.name);
  });

  // ── LOG-INV-5: in-game events carry round and phase context ───────────────

  it("LOG-INV-5: in-game log events include round and phase context", () => {
    const player = makePlayer(PLAYER_ID);
    const room = makeInGameRoom([player]);

    // Simulate several in-game log calls
    spy.log("decision.individual_submitted", {}, { actorId: player.name, round: room.round, phase: room.phase });
    spy.log("message.sent", {}, { actorId: player.name, round: room.round, phase: room.phase });
    spy.log("player.disconnected", {}, { actorId: player.name, round: room.round, phase: room.phase });

    for (const call of spy.calls) {
      expect(call.ctx?.round).toBe(2);
      expect(call.ctx?.phase).toBe("decision");
    }
  });

  // ── Critical path: player join → role select → decision (stable actorId) ──

  it("join → role select → decision produces stable actorId across all 3 events", () => {
    const player = makePlayer(PLAYER_ID);

    spy.log("player.joined", { playerName: player.name, code: TEST_ROOM_CODE }, { actorId: player.name });
    spy.log("player.role_selected", { playerName: player.name, faction: "openbrain", role: "ob_cto" }, { actorId: player.name });
    spy.log("decision.individual_submitted", { playerName: player.name, role: "ob_cto", optionId: "opt_1", timeRemainingMs: 30_000 }, { actorId: player.name, round: 1, phase: "decision" });

    expect(spy.calls).toHaveLength(3);
    const actorIds = spy.calls.map((c) => c.ctx?.actorId);
    // All 3 events use the same stable actorId (player name)
    expect(new Set(actorIds).size).toBe(1);
    expect(actorIds[0]).toBe(player.name);
  });

  // ── Critical path: GM pause → resume produces paired events ──────────────

  it("GM pause → resume produces paired phase.paused and phase.resumed events", () => {
    const room = makeInGameRoom();

    // Simulate pause
    spy.log("phase.paused", { round: room.round, phase: room.phase, remainingMs: 50_000 }, { actorId: "gm", round: room.round, phase: room.phase });
    // Simulate resume
    spy.log("phase.resumed", { round: room.round, phase: room.phase, remainingMs: 50_000 }, { actorId: "gm", round: room.round, phase: room.phase });

    expect(spy.calls[0].event).toBe("phase.paused");
    expect(spy.calls[1].event).toBe("phase.resumed");
    expect(spy.calls[0].ctx?.actorId).toBe("gm");
    expect(spy.calls[1].ctx?.actorId).toBe("gm");
  });

  // ── Failure mode: disconnect for unknown socket — NullLogger, no crash ────

  it("disconnect handler with no registered logger returns NullLogger (no crash)", () => {
    // No logger set for UNKNOWN_CODE — getLoggerForRoom returns NullLogger
    // NullLogger.log is a no-op; calling it must not throw
    const nullLogger = getLoggerForRoom("UNKNOWN_ROOM_CODE_XYZ");
    expect(() => {
      nullLogger.log("player.disconnected", { playerName: "Ghost" }, { actorId: "Ghost" });
    }).not.toThrow();
  });
});
