/**
 * Integration tests for server event handlers.
 *
 * These tests wire up REAL handlers from events.ts via registerGameEvents()
 * and assert on actual room state changes and emitted events.
 *
 * Invariants tested:
 * - INV-1: gm:send-npc-message with valid NPC ID stores message with isNpc: true
 * - INV-2: gm:send-npc-message from non-GM socket is rejected
 * - INV-3: decision:submit with valid option ID records in room.decisions
 * - INV-4: decision:submit with invalid option ID does not record
 * - INV-5: message:send to null routes to team channel (same-faction only)
 */

// Disable logging to avoid file I/O and setInterval timers during tests
process.env.LOG_ENABLED = "false";

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { GameRoom, Player } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { rooms } from "./rooms.js";
import { registerGameEvents } from "./events.js";
import { NPC_PERSONAS } from "./content/npcPersonas.js";
import { getLoggerForRoom, _setLoggerForRoom, _clearLoggers } from "./logger/registry.js";
import type { EventContext } from "./logger/types.js";

// ── Minimal mocks ─────────────────────────────────────────────────────────────

interface EmittedEvent { event: string; data: unknown }

function createSocket(id: string) {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const selfEmits: EmittedEvent[] = [];

  const socket = {
    id,
    data: {} as { roomCode?: string },
    handlers,
    selfEmits,
    on(event: string, handler: (...args: unknown[]) => void) {
      handlers.set(event, handler);
    },
    emit(event: string, data: unknown) {
      selfEmits.push({ event, data });
    },
    join(_code: string) {},
  };

  return socket;
}

function createIo() {
  const emits: Record<string, EmittedEvent[]> = {};

  const io = {
    emits,
    to(target: string) {
      return {
        emit(event: string, data: unknown) {
          (emits[target] ??= []).push({ event, data });
        },
      };
    },
  };

  return io;
}

/** Fire a registered socket event handler by name */
function fire(
  handlers: Map<string, (...args: unknown[]) => void>,
  event: string,
  ...args: unknown[]
) {
  const h = handlers.get(event);
  if (!h) throw new Error(`Handler not registered: ${event}`);
  h(...args);
}

// ── Room setup helpers ────────────────────────────────────────────────────────

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: `Player-${id}`,
    faction: "openbrain",
    role: "ob_cto",
    isLeader: false,
    connected: true,
    ...overrides,
  };
}

function makeTestRoom(gmId: string, code: string): GameRoom {
  const room: GameRoom = {
    code,
    phase: "lobby",
    round: 0,
    timer: { endsAt: 0 },
    players: {},
    gmId,
    state: { ...INITIAL_STATE },
    decisions: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
  };
  rooms.set(code, room);
  return room;
}

// ── SpyLogger ─────────────────────────────────────────────────────────────────

interface LogCall { event: string; data: unknown; ctx?: EventContext }

class SpyLogger {
  calls: LogCall[] = [];
  log(event: string, data: unknown, ctx?: EventContext): void {
    this.calls.push({ event, data, ctx });
  }
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
  get rejections(): number { return 0; }
}

// ── gm:send-npc-message ───────────────────────────────────────────────────────

const GM_ID = "gm-npc-1";
const PLAYER_ID = "player-npc-1";
const VALID_NPC_ID = "__npc_anon__";
const NPC_ROOM = "NPC1";

describe("gm:send-npc-message — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let gmSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(GM_ID, NPC_ROOM);
    room.players[PLAYER_ID] = makePlayer(PLAYER_ID);

    gmSocket = createSocket(GM_ID);
    gmSocket.data.roomCode = NPC_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      gmSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(NPC_ROOM);
  });

  it("INV-1: valid NPC message stored in room.messages with isNpc: true", () => {
    let result: { ok: boolean; error?: string } | undefined;
    fire(
      gmSocket.handlers,
      "gm:send-npc-message",
      { npcId: VALID_NPC_ID, content: "The extraction already happened.", targetPlayerId: PLAYER_ID },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(true);
    expect(room.messages).toHaveLength(1);
    const msg = room.messages[0];
    expect(msg.isNpc).toBe(true);
    expect(msg.from).toBe(VALID_NPC_ID);
    expect(msg.fromName).toBe("Anonymous Source");
    expect(msg.to).toBe(PLAYER_ID);
    expect(msg.isTeamChat).toBe(false);
    expect(msg.content).toBe("The extraction already happened.");
    expect(msg.faction).toBe("openbrain");
    expect(typeof msg.id).toBe("string");
  });

  it("INV-2: non-GM socket is rejected with error", () => {
    const playerSocket = createSocket(PLAYER_ID);
    playerSocket.data.roomCode = NPC_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      playerSocket as unknown as import("socket.io").Socket,
    );

    let result: { ok: boolean; error?: string } | undefined;
    fire(
      playerSocket.handlers,
      "gm:send-npc-message",
      { npcId: VALID_NPC_ID, content: "hello", targetPlayerId: PLAYER_ID },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/Only GM/);
    expect(room.messages).toHaveLength(0);
  });

  it("rejects unknown npcId — message not stored", () => {
    let result: { ok: boolean; error?: string } | undefined;
    fire(
      gmSocket.handlers,
      "gm:send-npc-message",
      { npcId: "__npc_nonexistent__", content: "hello", targetPlayerId: PLAYER_ID },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/Unknown NPC id/);
    expect(room.messages).toHaveLength(0);
  });

  it("rejects unknown targetPlayerId — message not stored", () => {
    let result: { ok: boolean; error?: string } | undefined;
    fire(
      gmSocket.handlers,
      "gm:send-npc-message",
      { npcId: VALID_NPC_ID, content: "hello", targetPlayerId: "no-such-player" },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/Player not found/);
    expect(room.messages).toHaveLength(0);
  });

  it("rejects bot as target (real handler guards __bot_ prefix)", () => {
    const botId = "__bot_ob_cto";
    room.players[botId] = makePlayer(botId, { id: botId, name: "Bot" });

    let result: { ok: boolean; error?: string } | undefined;
    fire(
      gmSocket.handlers,
      "gm:send-npc-message",
      { npcId: VALID_NPC_ID, content: "hello", targetPlayerId: botId },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/Cannot DM bots/);
    expect(room.messages).toHaveLength(0);
  });

  it("emits message:receive to target player without _gmView flag", () => {
    fire(
      gmSocket.handlers,
      "gm:send-npc-message",
      { npcId: VALID_NPC_ID, content: "intel payload", targetPlayerId: PLAYER_ID },
      (_r: unknown) => {},
    );

    const playerEmits = io.emits[PLAYER_ID] ?? [];
    const received = playerEmits.find((e) => e.event === "message:receive");
    expect(received).toBeDefined();
    expect((received!.data as Record<string, unknown>)._gmView).toBeUndefined();
    expect((received!.data as Record<string, unknown>).isNpc).toBe(true);
  });

  it("echoes message:receive to GM socket with _gmView: true", () => {
    fire(
      gmSocket.handlers,
      "gm:send-npc-message",
      { npcId: VALID_NPC_ID, content: "intel payload", targetPlayerId: PLAYER_ID },
      (_r: unknown) => {},
    );

    const gmEmits = io.emits[GM_ID] ?? [];
    const gmMsg = gmEmits.find((e) => e.event === "message:receive");
    expect(gmMsg).toBeDefined();
    expect((gmMsg!.data as Record<string, unknown>)._gmView).toBe(true);
    expect((gmMsg!.data as Record<string, unknown>).isNpc).toBe(true);
  });

  it("all NPC_PERSONAS IDs are accepted by the real handler", () => {
    // Use a stable uppercase code so getRoom() lookup (which uppercases) matches
    const MULTI_NPC_ROOM = "NPCM";

    for (const persona of NPC_PERSONAS) {
      rooms.delete(MULTI_NPC_ROOM);
      const freshRoom = makeTestRoom(GM_ID, MULTI_NPC_ROOM);
      freshRoom.players[PLAYER_ID] = makePlayer(PLAYER_ID);

      const freshIo = createIo();
      const freshSocket = createSocket(GM_ID);
      freshSocket.data.roomCode = MULTI_NPC_ROOM;
      registerGameEvents(
        freshIo as unknown as import("socket.io").Server,
        freshSocket as unknown as import("socket.io").Socket,
      );

      let result: { ok: boolean; error?: string } | undefined;
      fire(
        freshSocket.handlers,
        "gm:send-npc-message",
        { npcId: persona.id, content: "test", targetPlayerId: PLAYER_ID },
        (r: { ok: boolean; error?: string }) => { result = r; },
      );

      expect(result?.ok).toBe(true);
      expect(freshRoom.messages[0].fromName).toBe(persona.name);
    }

    rooms.delete("NPCM");
  });
});

// ── decision:submit ───────────────────────────────────────────────────────────

// Round 1, ob_cto valid option IDs: ob_cto_push, ob_cto_audit, ob_cto_safety_compute
const DEC_GM_ID = "gm-dec-1";
const DEC_PLAYER_ID = "player-dec-1";
const DEC_ROOM = "DEC1";

describe("decision:submit — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let playerSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(DEC_GM_ID, DEC_ROOM);
    room.phase = "decision";
    room.round = 1;
    room.timer = { endsAt: Date.now() + 60_000 };
    room.players[DEC_PLAYER_ID] = makePlayer(DEC_PLAYER_ID, {
      faction: "openbrain",
      role: "ob_cto",
    });

    playerSocket = createSocket(DEC_PLAYER_ID);
    playerSocket.data.roomCode = DEC_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      playerSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(DEC_ROOM);
  });

  it("INV-3: valid individual option recorded in room.decisions", () => {
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    expect(room.decisions[DEC_PLAYER_ID]).toBe("ob_cto_push");
  });

  it("INV-4: invalid option ID not recorded in room.decisions", () => {
    fire(playerSocket.handlers, "decision:submit", { individual: "invalid_option_xyz" });

    expect(room.decisions[DEC_PLAYER_ID]).toBeUndefined();
  });

  it("silently ignores submission outside decision phase", () => {
    room.phase = "deliberation";
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    expect(room.decisions[DEC_PLAYER_ID]).toBeUndefined();
  });

  it("silently ignores submission for round with no decisions (round 0)", () => {
    room.phase = "decision";
    room.round = 0;
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    expect(room.decisions[DEC_PLAYER_ID]).toBeUndefined();
  });

  it("notifies GM of current decision submission status", () => {
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    const gmEmits = io.emits[DEC_GM_ID] ?? [];
    const statusEmit = gmEmits.find((e) => e.event === "gm:decision-status");
    expect(statusEmit).toBeDefined();
    const submitted = (statusEmit!.data as { submitted: string[] }).submitted;
    expect(submitted).toContain(DEC_PLAYER_ID);
  });

  it("player without role set is silently ignored", () => {
    room.players[DEC_PLAYER_ID]!.role = null;
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    expect(room.decisions[DEC_PLAYER_ID]).toBeUndefined();
  });
});

// ── message:send ──────────────────────────────────────────────────────────────

const MSG_GM_ID = "gm-msg-1";
const MSG_PLAYER_A = "player-msg-a";
const MSG_PLAYER_B = "player-msg-b";
const MSG_PLAYER_OTHER = "player-msg-other";
const MSG_ROOM = "MSG1";

describe("message:send — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let senderSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(MSG_GM_ID, MSG_ROOM);
    room.phase = "deliberation";
    room.round = 1;
    room.players[MSG_PLAYER_A] = makePlayer(MSG_PLAYER_A, { faction: "openbrain", role: "ob_cto" });
    room.players[MSG_PLAYER_B] = makePlayer(MSG_PLAYER_B, { faction: "openbrain", role: "ob_ceo" });
    room.players[MSG_PLAYER_OTHER] = makePlayer(MSG_PLAYER_OTHER, { faction: "prometheus", role: "prom_ceo" });

    senderSocket = createSocket(MSG_PLAYER_A);
    senderSocket.data.roomCode = MSG_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      senderSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(MSG_ROOM);
  });

  it("INV-5: team message (to: null) delivered to all same-faction players only", () => {
    fire(senderSocket.handlers, "message:send", { to: null, content: "Team update" });

    // Same-faction players receive it
    expect((io.emits[MSG_PLAYER_A] ?? []).some((e) => e.event === "message:receive")).toBe(true);
    expect((io.emits[MSG_PLAYER_B] ?? []).some((e) => e.event === "message:receive")).toBe(true);
    // Cross-faction player does NOT receive it
    expect((io.emits[MSG_PLAYER_OTHER] ?? []).filter((e) => e.event === "message:receive")).toHaveLength(0);
  });

  it("team message stored in room.messages with isTeamChat: true", () => {
    fire(senderSocket.handlers, "message:send", { to: null, content: "Meeting at 3" });

    expect(room.messages).toHaveLength(1);
    expect(room.messages[0].isTeamChat).toBe(true);
    expect(room.messages[0].content).toBe("Meeting at 3");
  });

  it("team message without channel defaults to #general", () => {
    fire(senderSocket.handlers, "message:send", { to: null, content: "Hi team" });

    expect((room.messages[0] as unknown as Record<string, unknown>).channel).toBe("#general");
  });

  it("team message with explicit channel stores that channel", () => {
    fire(senderSocket.handlers, "message:send", { to: null, content: "Research note", channel: "#research" });

    expect((room.messages[0] as unknown as Record<string, unknown>).channel).toBe("#research");
  });

  it("DM has no channel field", () => {
    fire(senderSocket.handlers, "message:send", { to: MSG_PLAYER_B, content: "Private" });

    const msg = room.messages[0] as unknown as Record<string, unknown>;
    expect(msg.isTeamChat).toBe(false);
    expect(msg.channel).toBeUndefined();
  });

  it("DM is delivered to recipient and echoed to sender", () => {
    fire(senderSocket.handlers, "message:send", { to: MSG_PLAYER_B, content: "Whisper" });

    expect((io.emits[MSG_PLAYER_B] ?? []).some((e) => e.event === "message:receive")).toBe(true);
    expect((io.emits[MSG_PLAYER_A] ?? []).some((e) => e.event === "message:receive")).toBe(true);
  });

  it("GM receives _gmView copy of team message when not in same faction", () => {
    fire(senderSocket.handlers, "message:send", { to: null, content: "Team chat" });

    const gmEmits = io.emits[MSG_GM_ID] ?? [];
    const gmMsg = gmEmits.find((e) => e.event === "message:receive");
    expect(gmMsg).toBeDefined();
    expect((gmMsg!.data as Record<string, unknown>)._gmView).toBe(true);
  });

  it("rejects DM to bot (real handler guards __bot_ prefix)", () => {
    const botId = "__bot_ob_cto";
    room.players[botId] = makePlayer(botId);

    fire(senderSocket.handlers, "message:send", { to: botId, content: "Hello bot" });

    // No message stored, no emit
    expect(room.messages).toHaveLength(0);
    expect((io.emits[botId] ?? []).filter((e) => e.event === "message:receive")).toHaveLength(0);
  });

  it("message persists in room.messages for reconnect replay", () => {
    fire(senderSocket.handlers, "message:send", { to: null, content: "msg1", channel: "#safety" });
    fire(senderSocket.handlers, "message:send", { to: null, content: "msg2" });
    fire(senderSocket.handlers, "message:send", { to: MSG_PLAYER_B, content: "dm" });

    expect(room.messages).toHaveLength(3);
    expect((room.messages[0] as unknown as Record<string, unknown>).channel).toBe("#safety");
    expect((room.messages[1] as unknown as Record<string, unknown>).channel).toBe("#general");
    expect((room.messages[2] as unknown as Record<string, unknown>).channel).toBeUndefined();
  });
});

// ── Logging invariants — real handlers produce correct log entries ─────────────

const LOG_GM_ID = "gm-log-1";
const LOG_PLAYER_ID = "player-log-1";
const LOG_ROOM = "LOG1";

describe("structured logging — real handlers produce expected log entries", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let spy: SpyLogger;

  beforeEach(() => {
    io = createIo();
    spy = new SpyLogger();
    room = makeTestRoom(LOG_GM_ID, LOG_ROOM);
    room.phase = "decision";
    room.round = 1;
    room.timer = { endsAt: Date.now() + 60_000 };
    room.players[LOG_PLAYER_ID] = makePlayer(LOG_PLAYER_ID, {
      faction: "openbrain",
      role: "ob_cto",
    });
    _setLoggerForRoom(LOG_ROOM, spy);
  });

  afterEach(() => {
    rooms.delete(LOG_ROOM);
    _clearLoggers();
  });

  it("LOG-INV-2: decision:submit logs decision.individual_submitted with correct actorId and round/phase", () => {
    const playerSocket = createSocket(LOG_PLAYER_ID);
    playerSocket.data.roomCode = LOG_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      playerSocket as unknown as import("socket.io").Socket,
    );

    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    const decisionLog = spy.calls.find((c) => c.event === "decision.individual_submitted");
    expect(decisionLog).toBeDefined();
    expect(decisionLog!.ctx?.actorId).toBe(`Player-${LOG_PLAYER_ID}`);
    expect(decisionLog!.ctx?.round).toBe(1);
    expect(decisionLog!.ctx?.phase).toBe("decision");
    expect((decisionLog!.data as Record<string, unknown>).optionId).toBe("ob_cto_push");
    expect((decisionLog!.data as Record<string, unknown>).timeRemainingMs).toBeTypeOf("number");
  });

  it("LOG-INV-3: message:send logs contentLength and never message content", () => {
    const playerSocket = createSocket(LOG_PLAYER_ID);
    playerSocket.data.roomCode = LOG_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      playerSocket as unknown as import("socket.io").Socket,
    );

    const secretContent = "This is a secret message that must not be logged.";
    fire(playerSocket.handlers, "message:send", { to: null, content: secretContent });

    const msgLog = spy.calls.find((c) => c.event === "message.sent");
    expect(msgLog).toBeDefined();

    // Content must NOT appear in the logged data
    const serialized = JSON.stringify(msgLog!.data);
    expect(serialized).not.toContain(secretContent);
    expect(serialized).not.toContain("secret message");

    // Only metadata is logged
    const data = msgLog!.data as Record<string, unknown>;
    expect(data.contentLength).toBe(secretContent.length);
    expect(data.isTeamChat).toBe(true);
  });

  it("LOG-INV-4: disconnect logs player.disconnected with player info", () => {
    room.players[LOG_PLAYER_ID]!.connected = true;

    const playerSocket = createSocket(LOG_PLAYER_ID);
    playerSocket.data.roomCode = LOG_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      playerSocket as unknown as import("socket.io").Socket,
    );

    fire(playerSocket.handlers, "disconnect");

    const disconnectLog = spy.calls.find((c) => c.event === "player.disconnected");
    expect(disconnectLog).toBeDefined();
    expect((disconnectLog!.data as Record<string, unknown>).playerName).toBe(`Player-${LOG_PLAYER_ID}`);
    expect((disconnectLog!.data as Record<string, unknown>).faction).toBe("openbrain");
    expect(disconnectLog!.ctx?.actorId).toBe(`Player-${LOG_PLAYER_ID}`);
  });

  it("LOG-INV-5: in-game log events from real handlers include round and phase context", () => {
    const playerSocket = createSocket(LOG_PLAYER_ID);
    playerSocket.data.roomCode = LOG_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      playerSocket as unknown as import("socket.io").Socket,
    );

    // Trigger multiple log-producing events
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });
    fire(playerSocket.handlers, "message:send", { to: null, content: "hi" });

    const inGameLogs = spy.calls.filter((c) =>
      c.event === "decision.individual_submitted" || c.event === "message.sent",
    );
    expect(inGameLogs.length).toBeGreaterThan(0);

    for (const log of inGameLogs) {
      expect(log.ctx?.round).toBe(1);
      expect(log.ctx?.phase).toBe("decision");
    }
  });

  it("NullLogger is returned for unknown room — no crash on disconnect", () => {
    const nullLogger = getLoggerForRoom("UNKNOWN_ROOM_XYZ");
    expect(() => {
      nullLogger.log("player.disconnected", { playerName: "Ghost" }, { actorId: "Ghost" });
    }).not.toThrow();
  });
});
