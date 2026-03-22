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
 * - INV-6: decision:submit second call from same player overwrites first
 * - INV-7: decision:submit outside "decision" phase is silently dropped
 * - INV-8: decision:leader-submit records team decision in room.teamDecisions
 * - INV-9: non-leader calling decision:leader-submit is rejected
 */

// Disable logging to avoid file I/O and setInterval timers during tests
process.env.LOG_ENABLED = "false";

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { GameRoom, Player } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { rooms, deleteRoom, MAX_CONCURRENT_ROOMS } from "./rooms.js";
import { registerGameEvents } from "./events.js";
import { clearPhaseTimer } from "./game.js";
import { extendUses, cleanupRoom } from "./extendUses.js";
import { NPC_PERSONAS } from "./content/npcPersonas.js";
import { setGeneratedDecisions } from "./generation/cache.js";
import { _setPublicationDraftProviderForTests } from "./generation/publicationDraft.js";
import { ROUND1_DECISIONS } from "./test-fixtures.js";
import { getLoggerForRoom, _setLoggerForRoom, _clearLoggers } from "./logger/registry.js";
import type { EventContext } from "./logger/types.js";

// ── Minimal mocks ─────────────────────────────────────────────────────────────

interface EmittedEvent { event: string; data: unknown }

function createSocket(id: string) {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
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
  handlers: Map<string, (...args: unknown[]) => unknown>,
  event: string,
  ...args: unknown[]
) {
  const h = handlers.get(event);
  if (!h) throw new Error(`Handler not registered: ${event}`);
  return h(...args);
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
    decisions2: {},
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
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

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

// ── decision:submit — edge cases ──────────────────────────────────────────────

// Round 1, ob_cto valid individual IDs: ob_cto_push, ob_cto_audit, ob_cto_safety_compute
// Round 1, ob_ceo valid individual IDs: ob_ceo_fundraise, ob_ceo_gov, ob_ceo_silence
// Round 1, openbrain valid team IDs: ob_team_allincap, ob_team_balanced, ob_team_safety

const DEC_EDGE_GM_ID = "gm-dec-edge-1";
const DEC_EDGE_PLAYER_A = "player-dec-edge-a";
const DEC_EDGE_PLAYER_B = "player-dec-edge-b";
const DEC_EDGE_ROOM = "DECE";

describe("decision:submit — edge cases", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let playerSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(DEC_EDGE_GM_ID, DEC_EDGE_ROOM);
    room.phase = "decision";
    room.round = 1;
    room.timer = { endsAt: Date.now() + 60_000 };
    room.players[DEC_EDGE_PLAYER_A] = makePlayer(DEC_EDGE_PLAYER_A, {
      faction: "openbrain",
      role: "ob_cto",
    });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    playerSocket = createSocket(DEC_EDGE_PLAYER_A);
    playerSocket.data.roomCode = DEC_EDGE_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      playerSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(DEC_EDGE_ROOM);
  });

  it("INV-1: second submission from same player overwrites first", () => {
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });
    expect(room.decisions[DEC_EDGE_PLAYER_A]).toBe("ob_cto_push");

    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_audit" });
    expect(room.decisions[DEC_EDGE_PLAYER_A]).toBe("ob_cto_audit");
  });

  it("INV-2: submission during 'briefing' phase is silently dropped — no write, no GM notify", () => {
    room.phase = "briefing";
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    expect(room.decisions[DEC_EDGE_PLAYER_A]).toBeUndefined();
    expect((io.emits[DEC_EDGE_GM_ID] ?? []).some((e) => e.event === "gm:decision-status")).toBe(false);
  });

  it("INV-2: submission during 'resolution' phase is silently dropped — no write, no GM notify", () => {
    room.phase = "resolution";
    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });

    expect(room.decisions[DEC_EDGE_PLAYER_A]).toBeUndefined();
    expect((io.emits[DEC_EDGE_GM_ID] ?? []).some((e) => e.event === "gm:decision-status")).toBe(false);
  });

  it("INV-5: GM gm:decision-status lists all submitted player IDs after each submission", () => {
    room.players[DEC_EDGE_PLAYER_B] = makePlayer(DEC_EDGE_PLAYER_B, {
      faction: "openbrain",
      role: "ob_ceo",
    });
    const socketB = createSocket(DEC_EDGE_PLAYER_B);
    socketB.data.roomCode = DEC_EDGE_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, socketB as unknown as import("socket.io").Socket);

    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });
    fire(socketB.handlers, "decision:submit", { individual: "ob_ceo_fundraise" });

    const gmEmits = io.emits[DEC_EDGE_GM_ID] ?? [];
    const statusEmits = gmEmits.filter((e) => e.event === "gm:decision-status");
    expect(statusEmits).toHaveLength(2);

    // After both submissions, the latest status reflects both players
    const lastStatus = statusEmits[1]!.data as { submitted: string[] };
    expect(lastStatus.submitted).toContain(DEC_EDGE_PLAYER_A);
    expect(lastStatus.submitted).toContain(DEC_EDGE_PLAYER_B);
  });

  it("valid individual + invalid teamVote: individual recorded, team vote ignored", () => {
    fire(playerSocket.handlers, "decision:submit", {
      individual: "ob_cto_push",
      teamVote: "not_a_valid_team_option",
    });

    expect(room.decisions[DEC_EDGE_PLAYER_A]).toBe("ob_cto_push");
    expect(room.teamVotes["openbrain"]?.[DEC_EDGE_PLAYER_A]).toBeUndefined();
  });

  it("empty string optionId is rejected — no write to room.decisions", () => {
    fire(playerSocket.handlers, "decision:submit", { individual: "" });

    expect(room.decisions[DEC_EDGE_PLAYER_A]).toBeUndefined();
  });

  it("two different players both recorded under their own socket IDs", () => {
    room.players[DEC_EDGE_PLAYER_B] = makePlayer(DEC_EDGE_PLAYER_B, {
      faction: "openbrain",
      role: "ob_ceo",
    });
    const socketB = createSocket(DEC_EDGE_PLAYER_B);
    socketB.data.roomCode = DEC_EDGE_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, socketB as unknown as import("socket.io").Socket);

    fire(playerSocket.handlers, "decision:submit", { individual: "ob_cto_push" });
    fire(socketB.handlers, "decision:submit", { individual: "ob_ceo_fundraise" });

    expect(room.decisions[DEC_EDGE_PLAYER_A]).toBe("ob_cto_push");
    expect(room.decisions[DEC_EDGE_PLAYER_B]).toBe("ob_ceo_fundraise");
  });
});

// ── decision:leader-submit ────────────────────────────────────────────────────

const DEC_LEAD_GM_ID = "gm-dec-lead-1";
const DEC_LEAD_LEADER = "player-dec-lead-leader";
const DEC_LEAD_NON_LEADER = "player-dec-lead-nonleader";
const DEC_LEAD_ROOM = "DECL";

describe("decision:leader-submit — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let leaderSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(DEC_LEAD_GM_ID, DEC_LEAD_ROOM);
    room.phase = "decision";
    room.round = 1;
    room.timer = { endsAt: Date.now() + 60_000 };
    room.players[DEC_LEAD_LEADER] = makePlayer(DEC_LEAD_LEADER, {
      faction: "openbrain",
      role: "ob_ceo",
      isLeader: true,
    });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    leaderSocket = createSocket(DEC_LEAD_LEADER);
    leaderSocket.data.roomCode = DEC_LEAD_ROOM;
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      leaderSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(DEC_LEAD_ROOM);
  });

  it("INV-3: valid team decision recorded in room.teamDecisions[faction]", () => {
    fire(leaderSocket.handlers, "decision:leader-submit", { teamDecision: "ob_team_allincap" });

    expect(room.teamDecisions["openbrain"]).toBe("ob_team_allincap");
  });

  it("INV-4: non-leader calling decision:leader-submit is rejected — no write to teamDecisions", () => {
    room.players[DEC_LEAD_NON_LEADER] = makePlayer(DEC_LEAD_NON_LEADER, {
      faction: "openbrain",
      role: "ob_cto",
      isLeader: false,
    });
    const nonLeaderSocket = createSocket(DEC_LEAD_NON_LEADER);
    nonLeaderSocket.data.roomCode = DEC_LEAD_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, nonLeaderSocket as unknown as import("socket.io").Socket);

    fire(nonLeaderSocket.handlers, "decision:leader-submit", { teamDecision: "ob_team_allincap" });

    expect(room.teamDecisions["openbrain"]).toBeUndefined();
  });

  it("leader re-lock: second team submission overwrites first", () => {
    fire(leaderSocket.handlers, "decision:leader-submit", { teamDecision: "ob_team_allincap" });
    expect(room.teamDecisions["openbrain"]).toBe("ob_team_allincap");

    fire(leaderSocket.handlers, "decision:leader-submit", { teamDecision: "ob_team_safety" });
    expect(room.teamDecisions["openbrain"]).toBe("ob_team_safety");
  });

  it("invalid team option is rejected — no write to teamDecisions", () => {
    fire(leaderSocket.handlers, "decision:leader-submit", { teamDecision: "invalid_team_option" });

    expect(room.teamDecisions["openbrain"]).toBeUndefined();
  });

  it("decision:team-locked emitted to room after valid leader submission", () => {
    fire(leaderSocket.handlers, "decision:leader-submit", { teamDecision: "ob_team_balanced" });

    const roomEmits = io.emits[DEC_LEAD_ROOM] ?? [];
    const teamLocked = roomEmits.find((e) => e.event === "decision:team-locked");
    expect(teamLocked).toBeDefined();
    expect((teamLocked!.data as { faction: string }).faction).toBe("openbrain");
  });

  it("leader submit outside decision phase is silently dropped", () => {
    room.phase = "briefing";
    fire(leaderSocket.handlers, "decision:leader-submit", { teamDecision: "ob_team_allincap" });

    expect(room.teamDecisions["openbrain"]).toBeUndefined();
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

  it("INV-1: GM not in sending faction still receives team message via echo", () => {
    // GM has no faction (not in room.players), so they receive the explicit echo
    fire(senderSocket.handlers, "message:send", { to: null, content: "Faction update" });

    const gmMsgs = (io.emits[MSG_GM_ID] ?? []).filter((e) => e.event === "message:receive");
    expect(gmMsgs).toHaveLength(1);
    expect((gmMsgs[0]!.data as Record<string, unknown>)._gmView).toBe(true);
  });

  it("INV-2: GM who is also a player in the sending faction receives message exactly once (no duplicate)", () => {
    // Add GM as a player in the same faction as the sender (openbrain)
    room.players[MSG_GM_ID] = makePlayer(MSG_GM_ID, { faction: "openbrain", role: "ob_ceo" });

    fire(senderSocket.handlers, "message:send", { to: null, content: "Team secret" });

    // GM receives exactly one message:receive (from faction broadcast, not the echo)
    const gmMsgs = (io.emits[MSG_GM_ID] ?? []).filter((e) => e.event === "message:receive");
    expect(gmMsgs).toHaveLength(1);
    // Should NOT have _gmView since it came via the normal faction broadcast, not the explicit echo
    expect((gmMsgs[0]!.data as Record<string, unknown>)._gmView).toBeUndefined();
  });

  it("rejects DM to bot (real handler guards __bot_ prefix)", () => {
    const botId = "__bot_ob_cto";
    room.players[botId] = makePlayer(botId);

    fire(senderSocket.handlers, "message:send", { to: botId, content: "Hello bot" });

    // No message stored, no emit
    expect(room.messages).toHaveLength(0);
    expect((io.emits[botId] ?? []).filter((e) => e.event === "message:receive")).toHaveLength(0);
  });

  it("INV-1: DM to bot socket ID emits error to sender", () => {
    const botId = "__bot_openbrain_ob_ceo";
    room.players[botId] = makePlayer(botId, { id: botId });

    fire(senderSocket.handlers, "message:send", { to: botId, content: "Hey bot" });

    const errorEvent = senderSocket.selfEmits.find((e) => e.event === "error");
    expect(errorEvent).toBeDefined();
    expect((errorEvent!.data as Record<string, unknown>).message).toBe("Cannot send DMs to bot players");
    expect(room.messages).toHaveLength(0);
  });

  it("INV-2: DM to real player socket ID works normally", () => {
    fire(senderSocket.handlers, "message:send", { to: MSG_PLAYER_B, content: "Valid DM" });

    // Message stored
    expect(room.messages).toHaveLength(1);
    expect(room.messages[0].content).toBe("Valid DM");
    // Delivered to recipient and echoed to sender
    expect((io.emits[MSG_PLAYER_B] ?? []).some((e) => e.event === "message:receive")).toBe(true);
    expect((io.emits[MSG_PLAYER_A] ?? []).some((e) => e.event === "message:receive")).toBe(true);
    // No error emitted to sender
    expect(senderSocket.selfEmits.find((e) => e.event === "error")).toBeUndefined();
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

// ── message:send length guards ────────────────────────────────────────────────

const MSG_LEN_GM = "gm-msglen-1";
const MSG_LEN_SENDER = "player-msglen-a";
const MSG_LEN_PEER = "player-msglen-b";
const MSG_LEN_ROOM = "MSGL";

describe("message:send — length guards", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let senderSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(MSG_LEN_GM, MSG_LEN_ROOM);
    room.phase = "deliberation";
    room.round = 1;
    room.players[MSG_LEN_SENDER] = makePlayer(MSG_LEN_SENDER, { faction: "openbrain", role: "ob_cto" });
    room.players[MSG_LEN_PEER] = makePlayer(MSG_LEN_PEER, { faction: "openbrain", role: "ob_ceo" });
    senderSocket = createSocket(MSG_LEN_SENDER);
    senderSocket.data.roomCode = MSG_LEN_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, senderSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    rooms.delete(MSG_LEN_ROOM);
  });

  it("INV-1: message at exactly 2000 chars is accepted unchanged", () => {
    const exact = "a".repeat(2000);
    fire(senderSocket.handlers, "message:send", { to: null, content: exact });
    expect(room.messages[0].content).toBe(exact);
  });

  it("INV-2: message exceeding 2000 chars is truncated to 2000", () => {
    fire(senderSocket.handlers, "message:send", { to: null, content: "b".repeat(3000) });
    expect(room.messages[0].content).toBe("b".repeat(2000));
  });

  it("INV-3: normal-length message is unaffected", () => {
    const msg = "Hello team";
    fire(senderSocket.handlers, "message:send", { to: null, content: msg });
    expect(room.messages[0].content).toBe(msg);
  });
});

// ── publish:submit length guards ──────────────────────────────────────────────

const PUB_LEN_GM = "gm-publen-1";
const PUB_LEN_PLAYER = "player-publen-1";
const PUB_LEN_ROOM = "PUBL";

describe("publish:submit — length guards", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let playerSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(PUB_LEN_GM, PUB_LEN_ROOM);
    room.phase = "deliberation";
    room.round = 1;
    room.players[PUB_LEN_PLAYER] = makePlayer(PUB_LEN_PLAYER, { faction: "external", role: "ext_journalist" });
    playerSocket = createSocket(PUB_LEN_PLAYER);
    playerSocket.data.roomCode = PUB_LEN_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, playerSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    rooms.delete(PUB_LEN_ROOM);
  });

  it("INV-1: title at exactly 200 chars is accepted unchanged", () => {
    const exact = "t".repeat(200);
    fire(playerSocket.handlers, "publish:submit", { type: "article", title: exact, content: "body", source: "Test" });
    expect(room.publications[0].title).toBe(exact);
  });

  it("INV-2: title exceeding 200 chars is truncated to 200", () => {
    fire(playerSocket.handlers, "publish:submit", { type: "article", title: "t".repeat(300), content: "body", source: "Test" });
    expect(room.publications[0].title).toBe("t".repeat(200));
  });

  it("INV-3: normal-length title is unaffected", () => {
    fire(playerSocket.handlers, "publish:submit", { type: "article", title: "Short title", content: "body", source: "Test" });
    expect(room.publications[0].title).toBe("Short title");
  });

  it("INV-1: content at exactly 5000 chars is accepted unchanged", () => {
    const exact = "c".repeat(5000);
    fire(playerSocket.handlers, "publish:submit", { type: "article", title: "Title", content: exact, source: "Test" });
    expect(room.publications[0].content).toBe(exact);
  });

  it("INV-2: content exceeding 5000 chars is truncated to 5000", () => {
    fire(playerSocket.handlers, "publish:submit", { type: "article", title: "Title", content: "c".repeat(7000), source: "Test" });
    expect(room.publications[0].content).toBe("c".repeat(5000));
  });

  it("INV-3: normal-length content is unaffected", () => {
    const body = "Short article body.";
    fire(playerSocket.handlers, "publish:submit", { type: "article", title: "Title", content: body, source: "Test" });
    expect(room.publications[0].content).toBe(body);
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
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);
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

// ── Reconnection replay — replayPlayerState gaps ───────────────────────────────

const REJOIN_GM_ID = "gm-rejoin-1";
const REJOIN_OLD_ID = "player-rejoin-old";
const REJOIN_NEW_ID = "player-rejoin-new";
const REJOIN_ROOM = "RJN1";

describe("room:rejoin — replay state gaps", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let newSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(REJOIN_GM_ID, REJOIN_ROOM);
    room.round = 1;

    newSocket = createSocket(REJOIN_NEW_ID);
    newSocket.data.roomCode = undefined; // not yet in the room
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      newSocket as unknown as import("socket.io").Socket,
    );
    _setLoggerForRoom(REJOIN_ROOM, new SpyLogger());
  });

  afterEach(() => {
    rooms.delete(REJOIN_ROOM);
    _clearLoggers();
  });

  it("INV-1: leader reconnecting during decision phase receives decision:votes with current tally", () => {
    room.phase = "decision";
    room.players[REJOIN_OLD_ID] = makePlayer(REJOIN_OLD_ID, {
      faction: "openbrain",
      role: "ob_ceo",
      isLeader: true,
      connected: false,
    });
    // Two teammates already voted
    room.teamVotes["openbrain"] = {
      "player-teammate-a": "ob_push",
      "player-teammate-b": "ob_hold",
    };

    fire(newSocket.handlers, "room:rejoin", { code: REJOIN_ROOM, playerId: REJOIN_OLD_ID }, () => {});

    const voteEvent = newSocket.selfEmits.find((e) => e.event === "decision:votes");
    expect(voteEvent).toBeDefined();
    const data = voteEvent!.data as { faction: string; votes: Record<string, string> };
    expect(data.faction).toBe("openbrain");
    expect(data.votes["player-teammate-a"]).toBe("ob_push");
    expect(data.votes["player-teammate-b"]).toBe("ob_hold");
  });

  it("INV-1: non-leader reconnecting during decision phase does NOT receive decision:votes", () => {
    room.phase = "decision";
    room.players[REJOIN_OLD_ID] = makePlayer(REJOIN_OLD_ID, {
      faction: "openbrain",
      role: "ob_cto",
      isLeader: false,
      connected: false,
    });
    room.teamVotes["openbrain"] = { "player-teammate-a": "ob_push" };

    fire(newSocket.handlers, "room:rejoin", { code: REJOIN_ROOM, playerId: REJOIN_OLD_ID }, () => {});

    const voteEvent = newSocket.selfEmits.find((e) => e.event === "decision:votes");
    expect(voteEvent).toBeUndefined();
  });

  it("INV-2: player reconnecting after game ends receives game:ending with 9 arcs and non-empty state", () => {
    room.phase = "ending";
    room.history = [{ round: 1, decisions: {}, teamDecisions: {}, stateBefore: { ...room.state }, stateAfter: { ...room.state } }];
    room.players[REJOIN_OLD_ID] = makePlayer(REJOIN_OLD_ID, {
      faction: "openbrain",
      role: "ob_cto",
      connected: false,
    });

    fire(newSocket.handlers, "room:rejoin", { code: REJOIN_ROOM, playerId: REJOIN_OLD_ID }, () => {});

    const endingEvent = newSocket.selfEmits.find((e) => e.event === "game:ending");
    expect(endingEvent).toBeDefined();
    const data = endingEvent!.data as { arcs: unknown[]; history: unknown[]; finalState: unknown; players: unknown };
    expect(data.arcs).toHaveLength(9);
    expect(data.history).toHaveLength(1);
    expect(data.finalState).toBeDefined();
    expect(data.players).toBeDefined();
  });

  it("INV-3: player reconnecting with 2 publications in room receives 2 game:publish events", () => {
    room.phase = "deliberation";
    room.players[REJOIN_OLD_ID] = makePlayer(REJOIN_OLD_ID, {
      faction: "openbrain",
      role: "ob_cto",
      connected: false,
    });
    room.publications = [
      { id: "pub-1", type: "article", title: "First Article", content: "Content A", source: "OpenBrain", publishedBy: "ob_cto", publishedAt: Date.now() - 5000, round: 1 },
      { id: "pub-2", type: "leak", title: "Big Leak", content: "Leaked info", source: "Whistleblower", publishedBy: "ob_ceo", publishedAt: Date.now() - 2000, round: 1 },
    ];

    fire(newSocket.handlers, "room:rejoin", { code: REJOIN_ROOM, playerId: REJOIN_OLD_ID }, () => {});

    const publishEvents = newSocket.selfEmits.filter((e) => e.event === "game:publish");
    expect(publishEvents).toHaveLength(2);

    const articleEvent = publishEvents.find((e) => (e.data as { publication: { id: string } }).publication.id === "pub-1");
    expect(articleEvent).toBeDefined();
    const articleData = articleEvent!.data as { publication: unknown; newsContent: { app: string }; twitterContent: { app: string }; summary: string };
    expect(articleData.newsContent.app).toBe("news");
    expect(articleData.twitterContent.app).toBe("twitter");
    expect(articleData.summary).toContain("First Article");

    const leakEvent = publishEvents.find((e) => (e.data as { publication: { id: string } }).publication.id === "pub-2");
    expect(leakEvent).toBeDefined();
    const leakData = leakEvent!.data as { summary: string };
    expect(leakData.summary).toContain("LEAK");
  });
});

// ── gm:set-state ──────────────────────────────────────────────────────────────

const SS_GM_ID = "gm-ss-1";
const SS_ROOM = "SS01";

describe("gm:set-state — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let gmSocket: ReturnType<typeof createSocket>;
  let spy: SpyLogger;

  beforeEach(() => {
    io = createIo();
    spy = new SpyLogger();
    room = makeTestRoom(SS_GM_ID, SS_ROOM);
    room.round = 1;
    room.phase = "intel";
    _setLoggerForRoom(SS_ROOM, spy);
    gmSocket = createSocket(SS_GM_ID);
    gmSocket.data.roomCode = SS_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, gmSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    rooms.delete(SS_ROOM);
    _clearLoggers();
  });

  it("non-GM socket silently ignored — state unchanged", () => {
    const other = createSocket("non-gm-ss");
    other.data.roomCode = SS_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, other as unknown as import("socket.io").Socket);
    const orig = room.state.publicAwareness;
    fire(other.handlers, "gm:set-state", { variable: "publicAwareness", value: 99 });
    expect(room.state.publicAwareness).toBe(orig);
  });

  it("invalid variable name silently ignored — no state change", () => {
    const snap = { ...room.state };
    fire(gmSocket.handlers, "gm:set-state", { variable: "notARealVar", value: 50 });
    expect(room.state).toEqual(snap);
  });

  it("value within bounds stored exactly", () => {
    fire(gmSocket.handlers, "gm:set-state", { variable: "publicAwareness", value: 75 });
    expect(room.state.publicAwareness).toBe(75);
  });

  it("value above max clamped to max (usChinaGap max=16, set 30 → 16)", () => {
    fire(gmSocket.handlers, "gm:set-state", { variable: "usChinaGap", value: 30 });
    expect(room.state.usChinaGap).toBe(16);
  });

  it("value below min clamped to min (usChinaGap min=-8, set -50 → -8)", () => {
    fire(gmSocket.handlers, "gm:set-state", { variable: "usChinaGap", value: -50 });
    expect(room.state.usChinaGap).toBe(-8);
  });

  it("emitStateViews fires — game:state emitted to GM socket", () => {
    fire(gmSocket.handlers, "gm:set-state", { variable: "publicAwareness", value: 50 });
    const gmEmits = io.emits[SS_GM_ID] ?? [];
    expect(gmEmits.some((e) => e.event === "game:state")).toBe(true);
  });

  it("logs state.gm_override with variable, oldValue, newValue, gmId, and gm actorId", () => {
    const oldVal = room.state.publicAwareness;
    fire(gmSocket.handlers, "gm:set-state", { variable: "publicAwareness", value: 75 });
    const log = spy.calls.find((c) => c.event === "state.gm_override");
    expect(log).toBeDefined();
    const d = log!.data as Record<string, unknown>;
    expect(d.variable).toBe("publicAwareness");
    expect(d.oldValue).toBe(oldVal);
    expect(d.newValue).toBe(75);
    expect(d.gmId).toBe(SS_GM_ID);
    expect(log!.ctx?.actorId).toBe("gm");
  });
});

// ── gm:pause ──────────────────────────────────────────────────────────────────

const PAUSE_GM_ID = "gm-pause-1";
const PAUSE_ROOM = "PAUSE1";

describe("gm:pause — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let gmSocket: ReturnType<typeof createSocket>;
  let spy: SpyLogger;

  beforeEach(() => {
    io = createIo();
    spy = new SpyLogger();
    room = makeTestRoom(PAUSE_GM_ID, PAUSE_ROOM);
    room.round = 1;
    room.phase = "intel";
    room.timer = { endsAt: Date.now() + 120_000 };
    _setLoggerForRoom(PAUSE_ROOM, spy);
    gmSocket = createSocket(PAUSE_GM_ID);
    gmSocket.data.roomCode = PAUSE_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, gmSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    clearPhaseTimer(room);
    rooms.delete(PAUSE_ROOM);
    _clearLoggers();
  });

  it("non-GM socket silently ignored — timer not paused", () => {
    const other = createSocket("non-gm-pause");
    other.data.roomCode = PAUSE_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, other as unknown as import("socket.io").Socket);
    fire(other.handlers, "gm:pause");
    expect(room.timer.pausedAt).toBeUndefined();
  });

  it("first call sets pausedAt and emits game:phase to room", () => {
    fire(gmSocket.handlers, "gm:pause");
    expect(room.timer.pausedAt).toBeTypeOf("number");
    const emitted = (io.emits[PAUSE_ROOM] ?? []).find((e) => e.event === "game:phase");
    expect(emitted).toBeDefined();
    const data = emitted!.data as { timer: { pausedAt?: number } };
    expect(data.timer.pausedAt).toBeTypeOf("number");
  });

  it("second call clears pausedAt and endsAt >= original (resume extends timer by paused duration)", () => {
    const endsAtBefore = room.timer.endsAt;
    fire(gmSocket.handlers, "gm:pause"); // pause
    fire(gmSocket.handlers, "gm:pause"); // resume
    expect(room.timer.pausedAt).toBeUndefined();
    expect(room.timer.endsAt).toBeGreaterThanOrEqual(endsAtBefore);
  });

  it("logs phase.paused on first call and phase.resumed on second call", () => {
    fire(gmSocket.handlers, "gm:pause");
    expect(spy.calls.find((c) => c.event === "phase.paused")).toBeDefined();
    fire(gmSocket.handlers, "gm:pause");
    expect(spy.calls.find((c) => c.event === "phase.resumed")).toBeDefined();
  });
});

// ── gm:extend ─────────────────────────────────────────────────────────────────

const EXTEND_GM_ID = "gm-ext-1";
const EXTEND_ROOM = "EXT01";

describe("gm:extend — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let gmSocket: ReturnType<typeof createSocket>;
  let spy: SpyLogger;

  beforeEach(() => {
    io = createIo();
    spy = new SpyLogger();
    room = makeTestRoom(EXTEND_GM_ID, EXTEND_ROOM);
    room.round = 1;
    room.phase = "intel";
    room.timer = { endsAt: Date.now() + 120_000 };
    _setLoggerForRoom(EXTEND_ROOM, spy);
    gmSocket = createSocket(EXTEND_GM_ID);
    gmSocket.data.roomCode = EXTEND_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, gmSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    clearPhaseTimer(room);
    cleanupRoom(EXTEND_ROOM);
    rooms.delete(EXTEND_ROOM);
    _clearLoggers();
  });

  it("non-GM socket silently ignored — endsAt unchanged", () => {
    const other = createSocket("non-gm-ext");
    other.data.roomCode = EXTEND_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, other as unknown as import("socket.io").Socket);
    const before = room.timer.endsAt;
    fire(other.handlers, "gm:extend");
    expect(room.timer.endsAt).toBe(before);
  });

  it("first extend adds 60 seconds and emits gm:extend-ack with usesRemaining=1", () => {
    const before = room.timer.endsAt;
    fire(gmSocket.handlers, "gm:extend");
    expect(room.timer.endsAt).toBe(before + 60_000);
    const ack = (io.emits[EXTEND_GM_ID] ?? []).find((e) => e.event === "gm:extend-ack");
    expect(ack).toBeDefined();
    expect((ack!.data as { usesRemaining: number }).usesRemaining).toBe(1);
  });

  it("second extend adds another 60 seconds and usesRemaining=0", () => {
    const before = room.timer.endsAt;
    fire(gmSocket.handlers, "gm:extend");
    fire(gmSocket.handlers, "gm:extend");
    expect(room.timer.endsAt).toBe(before + 120_000);
    const acks = (io.emits[EXTEND_GM_ID] ?? []).filter((e) => e.event === "gm:extend-ack");
    expect((acks[1]!.data as { usesRemaining: number }).usesRemaining).toBe(0);
  });

  it("third extend attempt rejected — endsAt unchanged after 2 extends", () => {
    const before = room.timer.endsAt;
    fire(gmSocket.handlers, "gm:extend");
    fire(gmSocket.handlers, "gm:extend");
    fire(gmSocket.handlers, "gm:extend"); // rejected
    expect(room.timer.endsAt).toBe(before + 120_000); // only 2×60s added
    const acks = (io.emits[EXTEND_GM_ID] ?? []).filter((e) => e.event === "gm:extend-ack");
    expect(acks).toHaveLength(2); // no third ack
  });

  it("stale extendUses entries for the same room are pruned on extend", () => {
    extendUses.set(`${EXTEND_ROOM}:1:briefing`, 1); // stale entry
    fire(gmSocket.handlers, "gm:extend");
    expect(extendUses.has(`${EXTEND_ROOM}:1:briefing`)).toBe(false);
    expect(extendUses.get(`${EXTEND_ROOM}:1:intel`)).toBe(1);
  });

  it("logs phase.extended with extendCount and newDuration (remaining ms after extension)", () => {
    fire(gmSocket.handlers, "gm:extend");
    const log = spy.calls.find((c) => c.event === "phase.extended");
    expect(log).toBeDefined();
    const d = log!.data as Record<string, unknown>;
    expect(d.extendCount).toBe(1);
    expect(typeof d.newDuration).toBe("number");
    expect(d.newDuration as number).toBeGreaterThan(0);
  });
});

// ── gm:advance ────────────────────────────────────────────────────────────────

const ADV_GM_ID = "gm-adv-1";
const ADV_ROOM = "ADV01";

describe("gm:advance — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let gmSocket: ReturnType<typeof createSocket>;
  let spy: SpyLogger;

  beforeEach(() => {
    io = createIo();
    spy = new SpyLogger();
    room = makeTestRoom(ADV_GM_ID, ADV_ROOM);
    room.round = 1;
    room.phase = "briefing";
    _setLoggerForRoom(ADV_ROOM, spy);
    gmSocket = createSocket(ADV_GM_ID);
    gmSocket.data.roomCode = ADV_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, gmSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    clearPhaseTimer(room);
    rooms.delete(ADV_ROOM);
    _clearLoggers();
  });

  it("non-GM socket silently ignored — phase unchanged", () => {
    const other = createSocket("non-gm-adv");
    other.data.roomCode = ADV_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, other as unknown as import("socket.io").Socket);
    fire(other.handlers, "gm:advance");
    expect(room.phase).toBe("briefing");
  });

  it("advance moves phase from briefing to intel", () => {
    fire(gmSocket.handlers, "gm:advance");
    expect(room.phase).toBe("intel");
  });

  it("logs phase.gm_advanced with gm actorId and pre-advance round/phase", () => {
    fire(gmSocket.handlers, "gm:advance");
    const log = spy.calls.find((c) => c.event === "phase.gm_advanced");
    expect(log).toBeDefined();
    expect(log!.ctx?.actorId).toBe("gm");
    expect(log!.ctx?.round).toBe(1);
    expect(log!.ctx?.phase).toBe("briefing"); // logged before phase changes
  });
});

// ── gm:end-game ───────────────────────────────────────────────────────────────

const END_GM_ID = "gm-end-1";
const END_ROOM = "ENDGM";

describe("gm:end-game — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let gmSocket: ReturnType<typeof createSocket>;
  let spy: SpyLogger;

  beforeEach(() => {
    io = createIo();
    spy = new SpyLogger();
    room = makeTestRoom(END_GM_ID, END_ROOM);
    room.round = 2;
    room.phase = "deliberation";
    room.timer = { endsAt: Date.now() + 5000 };
    _setLoggerForRoom(END_ROOM, spy);
    gmSocket = createSocket(END_GM_ID);
    gmSocket.data.roomCode = END_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, gmSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    clearPhaseTimer(room);
    rooms.delete(END_ROOM);
    _clearLoggers();
  });

  it("non-GM socket silently ignored — phase unchanged", () => {
    const other = createSocket("non-gm-end");
    other.data.roomCode = END_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, other as unknown as import("socket.io").Socket);
    fire(other.handlers, "gm:end-game");
    expect(room.phase).toBe("deliberation");
  });

  it("ends the game immediately and emits ending payloads", () => {
    fire(gmSocket.handlers, "gm:end-game");

    expect(room.phase).toBe("ending");

    const roomEmits = io.emits[END_ROOM] ?? [];
    expect(roomEmits.some((e) => e.event === "game:phase" && (e.data as { phase?: string }).phase === "ending")).toBe(true);
    expect(roomEmits.some((e) => e.event === "game:ending")).toBe(true);

    const endedLog = spy.calls.find((c) => c.event === "game.ended");
    expect(endedLog).toBeDefined();
    expect(endedLog!.ctx?.actorId).toBe("gm");
    expect(endedLog!.data).toMatchObject({ endedBy: "gm", endedEarly: true });
  });
});

// ── publish:submit ────────────────────────────────────────────────────────────

const PUB_GM_ID = "gm-pub-1";
const PUB_JOURNALIST = "player-pub-journalist";
const PUB_OTHER = "player-pub-other";
const PUB_ROOM = "PUB01";

describe("publish:submit — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let journalistSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(PUB_GM_ID, PUB_ROOM);
    room.round = 1;
    room.phase = "intel";
    room.players[PUB_JOURNALIST] = makePlayer(PUB_JOURNALIST, { faction: "external", role: "ext_journalist" });
    room.players[PUB_OTHER] = makePlayer(PUB_OTHER, { faction: "openbrain", role: "ob_cto" });
    journalistSocket = createSocket(PUB_JOURNALIST);
    journalistSocket.data.roomCode = PUB_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, journalistSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    rooms.delete(PUB_ROOM);
    _setPublicationDraftProviderForTests(null);
  });

  it("ob_cto cannot publish — non-writer role is rejected", () => {
    const nonPub = createSocket(PUB_OTHER);
    nonPub.data.roomCode = PUB_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, nonPub as unknown as import("socket.io").Socket);
    fire(nonPub.handlers, "publish:submit", { type: "article", title: "Test", content: "Body", source: "OB" });
    expect(room.publications).toHaveLength(0);
  });

  it("ext_journalist can publish article — stored in room.publications", () => {
    fire(journalistSocket.handlers, "publish:submit", { type: "article", title: "Big Story", content: "Details", source: "Press" });
    expect(room.publications).toHaveLength(1);
    const pub = room.publications[0];
    expect(pub.type).toBe("article");
    expect(pub.title).toBe("Big Story");
    expect(pub.publishedBy).toBe("ext_journalist");
  });

  it("ob_safety can publish a leak", () => {
    const safetyId = "player-pub-safety";
    room.players[safetyId] = makePlayer(safetyId, { faction: "openbrain", role: "ob_safety" });
    const safetySocket = createSocket(safetyId);
    safetySocket.data.roomCode = PUB_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, safetySocket as unknown as import("socket.io").Socket);
    fire(safetySocket.handlers, "publish:submit", { type: "leak", title: "Internal Concerns", content: "...", source: "Anon" });
    expect(room.publications).toHaveLength(1);
    expect(room.publications[0].type).toBe("leak");
  });

  it("ob_safety can publish articles via the writer allowlist", () => {
    const safetyId = "player-pub-safety2";
    room.players[safetyId] = makePlayer(safetyId, { faction: "openbrain", role: "ob_safety" });
    const safetySocket = createSocket(safetyId);
    safetySocket.data.roomCode = PUB_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, safetySocket as unknown as import("socket.io").Socket);
    fire(safetySocket.handlers, "publish:submit", { type: "article", title: "Article", content: "...", source: "OB" });
    expect(room.publications).toHaveLength(1);
    expect(room.publications[0].publishedBy).toBe("ob_safety");
  });

  it("ext_diplomat can publish articles via the writer allowlist", () => {
    const diplomatId = "player-pub-diplomat";
    room.players[diplomatId] = makePlayer(diplomatId, { faction: "external", role: "ext_diplomat" });
    const diplomatSocket = createSocket(diplomatId);
    diplomatSocket.data.roomCode = PUB_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, diplomatSocket as unknown as import("socket.io").Socket);
    fire(diplomatSocket.handlers, "publish:submit", { type: "article", title: "Joint Statement", content: "...", source: "EU Delegation" });
    expect(room.publications).toHaveLength(1);
    expect(room.publications[0].publishedBy).toBe("ext_diplomat");
  });

  it("article applies +15 publicAwareness and +10 publicSentiment to state", () => {
    const initAwareness = room.state.publicAwareness;
    const initSentiment = room.state.publicSentiment;
    fire(journalistSocket.handlers, "publish:submit", { type: "article", title: "Title", content: "Content", source: "Press" });
    expect(room.state.publicAwareness).toBe(initAwareness + 15);
    expect(room.state.publicSentiment).toBe(initSentiment + 10);
  });

  it("leak applies +25 publicAwareness and -10 publicSentiment to state", () => {
    const initAwareness = room.state.publicAwareness;
    const initSentiment = room.state.publicSentiment;
    fire(journalistSocket.handlers, "publish:submit", { type: "leak", title: "Leak Title", content: "Leaked", source: "Whistleblower" });
    expect(room.state.publicAwareness).toBe(initAwareness + 25);
    expect(room.state.publicSentiment).toBe(initSentiment - 10);
  });

  it("game:publish emitted to all players in the room", () => {
    fire(journalistSocket.handlers, "publish:submit", { type: "article", title: "Breaking", content: "News", source: "Press" });
    for (const pid of [PUB_JOURNALIST, PUB_OTHER]) {
      expect((io.emits[pid] ?? []).some((e) => e.event === "game:publish")).toBe(true);
    }
  });

  it("game:notification emitted to all players in the room", () => {
    fire(journalistSocket.handlers, "publish:submit", { type: "article", title: "Breaking", content: "News", source: "Press" });
    for (const pid of [PUB_JOURNALIST, PUB_OTHER]) {
      expect((io.emits[pid] ?? []).some((e) => e.event === "game:notification")).toBe(true);
    }
  });

  it("server-enforces one publication per writer per round", () => {
    fire(journalistSocket.handlers, "publish:submit", { type: "article", title: "First", content: "News", source: "Press" });
    fire(journalistSocket.handlers, "publish:submit", { type: "article", title: "Second", content: "More", source: "Press" });
    expect(room.publications).toHaveLength(1);
    expect(room.publications[0].title).toBe("First");
  });
});

describe("publish:draft-generate — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let journalistSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(PUB_GM_ID, PUB_ROOM);
    room.round = 2;
    room.phase = "intel";
    room.players[PUB_JOURNALIST] = makePlayer(PUB_JOURNALIST, { faction: "external", role: "ext_journalist" });
    room.players[PUB_OTHER] = makePlayer(PUB_OTHER, { faction: "openbrain", role: "ob_cto" });
    journalistSocket = createSocket(PUB_JOURNALIST);
    journalistSocket.data.roomCode = PUB_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, journalistSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    rooms.delete(PUB_ROOM);
    _setPublicationDraftProviderForTests(null);
  });

  it("rejects non-writer roles", async () => {
    const nonWriter = createSocket(PUB_OTHER);
    nonWriter.data.roomCode = PUB_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, nonWriter as unknown as import("socket.io").Socket);

    let result: { ok: boolean; error?: string } | undefined;
    await fire(
      nonWriter.handlers,
      "publish:draft-generate",
      { angle: "safety", targetFaction: "general" },
      (res: { ok: boolean; error?: string }) => {
        result = res;
      },
    );

    expect(result).toEqual({ ok: false, error: "This role cannot publish to Substack" });
  });

  it("returns a generated draft and caches it for the round", async () => {
    let callCount = 0;
    _setPublicationDraftProviderForTests({
      async generate<T>() {
        callCount++;
        return {
          title: "The Compute Panic Is Finally Public",
          body: "Draft body about public risk and market structure.",
        } as T;
      },
    });

    let firstResult: { ok: boolean; title?: string; body?: string; error?: string } | undefined;
    await fire(
      journalistSocket.handlers,
      "publish:draft-generate",
      { angle: "safety", targetFaction: "openbrain" },
      (res: { ok: boolean; title?: string; body?: string; error?: string }) => {
        firstResult = res;
      },
    );

    let secondResult: { ok: boolean; title?: string; body?: string; error?: string } | undefined;
    await fire(
      journalistSocket.handlers,
      "publish:draft-generate",
      { angle: "hype", targetFaction: "china" },
      (res: { ok: boolean; title?: string; body?: string; error?: string }) => {
        secondResult = res;
      },
    );

    expect(firstResult?.ok).toBe(true);
    expect(firstResult?.title).toBe("The Compute Panic Is Finally Public");
    expect(firstResult?.body).toContain("market structure");
    expect(secondResult).toEqual(firstResult);
    expect(callCount).toBe(1);
    expect(room.generatedPublicationDrafts?.ext_journalist?.round).toBe(2);
  });

  it("rejects draft generation after the writer already published this round", async () => {
    fire(journalistSocket.handlers, "publish:submit", {
      type: "article",
      title: "Already live",
      content: "Body",
      source: "Press",
      angle: "safety",
      targetFaction: "general",
    });

    let result: { ok: boolean; error?: string } | undefined;
    await fire(
      journalistSocket.handlers,
      "publish:draft-generate",
      { angle: "safety", targetFaction: "general" },
      (res: { ok: boolean; error?: string }) => {
        result = res;
      },
    );

    expect(result).toEqual({ ok: false, error: "Already published this round" });
  });

  it("allows a fresh draft in the next round", async () => {
    let callCount = 0;
    _setPublicationDraftProviderForTests({
      async generate<T>() {
        callCount++;
        return {
          title: `Draft ${callCount}`,
          body: `Body ${callCount}`,
        } as T;
      },
    });

    await fire(
      journalistSocket.handlers,
      "publish:draft-generate",
      { angle: "safety", targetFaction: "general" },
      () => {},
    );
    room.round = 3;

    let result: { ok: boolean; title?: string; body?: string } | undefined;
    await fire(
      journalistSocket.handlers,
      "publish:draft-generate",
      { angle: "safety", targetFaction: "general" },
      (res: { ok: boolean; title?: string; body?: string }) => {
        result = res;
      },
    );

    expect(callCount).toBe(2);
    expect(result?.title).toBe("Draft 2");
    expect(room.generatedPublicationDrafts?.ext_journalist?.round).toBe(3);
  });
});

// ── tweet:send ────────────────────────────────────────────────────────────────

const TWEET_GM_ID = "gm-tweet-1";
const TWEET_PLAYER_A = "player-tweet-a";
const TWEET_PLAYER_B = "player-tweet-b";
const TWEET_ROOM = "TWE01";

describe("tweet:send — real handler", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let senderSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(TWEET_GM_ID, TWEET_ROOM);
    room.round = 1;
    room.phase = "intel";
    room.players[TWEET_PLAYER_A] = makePlayer(TWEET_PLAYER_A, { faction: "openbrain", role: "ob_cto" });
    room.players[TWEET_PLAYER_B] = makePlayer(TWEET_PLAYER_B, { faction: "prometheus", role: "prom_ceo" });
    senderSocket = createSocket(TWEET_PLAYER_A);
    senderSocket.data.roomCode = TWEET_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, senderSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    rooms.delete(TWEET_ROOM);
  });

  it("valid tweet broadcast to all players (including sender)", () => {
    fire(senderSocket.handlers, "tweet:send", { text: "Hello world" });
    for (const pid of [TWEET_PLAYER_A, TWEET_PLAYER_B]) {
      expect((io.emits[pid] ?? []).some((e) => e.event === "tweet:receive")).toBe(true);
    }
  });

  it("tweet also broadcast to GM", () => {
    fire(senderSocket.handlers, "tweet:send", { text: "Watch this" });
    expect((io.emits[TWEET_GM_ID] ?? []).some((e) => e.event === "tweet:receive")).toBe(true);
  });

  it("tweet object has correct shape (id, playerName, playerRole, playerFaction, text, timestamp)", () => {
    fire(senderSocket.handlers, "tweet:send", { text: "  trimmed  " });
    const ev = (io.emits[TWEET_PLAYER_A] ?? []).find((e) => e.event === "tweet:receive");
    expect(ev).toBeDefined();
    const tweet = ev!.data as Record<string, unknown>;
    expect(typeof tweet.id).toBe("string");
    expect(tweet.playerName).toBe(`Player-${TWEET_PLAYER_A}`);
    expect(tweet.playerRole).toBe("ob_cto");
    expect(tweet.playerFaction).toBe("openbrain");
    expect(tweet.text).toBe("trimmed");
    expect(typeof tweet.timestamp).toBe("number");
  });

  it("empty string (after trim) silently ignored — no tweet:receive emitted", () => {
    fire(senderSocket.handlers, "tweet:send", { text: "   " });
    expect((io.emits[TWEET_PLAYER_A] ?? []).filter((e) => e.event === "tweet:receive")).toHaveLength(0);
  });

  it("text longer than 280 chars is truncated to 280 and sent (INV-2)", () => {
    fire(senderSocket.handlers, "tweet:send", { text: "x".repeat(400) });
    const ev = (io.emits[TWEET_PLAYER_A] ?? []).find((e) => e.event === "tweet:receive");
    expect(ev).toBeDefined();
    expect((ev!.data as Record<string, unknown>).text).toBe("x".repeat(280));
  });

  it("text exactly 280 chars is accepted unchanged (INV-1)", () => {
    const exact = "x".repeat(280);
    fire(senderSocket.handlers, "tweet:send", { text: exact });
    const ev = (io.emits[TWEET_PLAYER_A] ?? []).find((e) => e.event === "tweet:receive");
    expect(ev).toBeDefined();
    expect((ev!.data as Record<string, unknown>).text).toBe(exact);
  });
});

// ── tweet:send — persistence & rejoin replay ──────────────────────────────────

const TWEET_PERSIST_GM = "gm-tweet-persist-1";
const TWEET_PERSIST_PLAYER_A = "player-tweet-persist-a";
const TWEET_PERSIST_PLAYER_B = "player-tweet-persist-b";
const TWEET_PERSIST_PLAYER_B_NEW = "player-tweet-persist-b-new";
const TWEET_PERSIST_ROOM = "TWP01";

describe("tweet persistence and rejoin replay", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let senderSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(TWEET_PERSIST_GM, TWEET_PERSIST_ROOM);
    room.round = 1;
    room.phase = "intel";
    room.players[TWEET_PERSIST_PLAYER_A] = makePlayer(TWEET_PERSIST_PLAYER_A, { faction: "openbrain", role: "ob_cto" });
    room.players[TWEET_PERSIST_PLAYER_B] = makePlayer(TWEET_PERSIST_PLAYER_B, { faction: "prometheus", role: "prom_ceo", connected: false });
    senderSocket = createSocket(TWEET_PERSIST_PLAYER_A);
    senderSocket.data.roomCode = TWEET_PERSIST_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, senderSocket as unknown as import("socket.io").Socket);
    _setLoggerForRoom(TWEET_PERSIST_ROOM, new SpyLogger());
  });

  afterEach(() => {
    rooms.delete(TWEET_PERSIST_ROOM);
    _clearLoggers();
  });

  it("INV-1: player tweets stored in room.playerTweets on send", () => {
    fire(senderSocket.handlers, "tweet:send", { text: "First tweet" });
    fire(senderSocket.handlers, "tweet:send", { text: "Second tweet" });
    expect(room.playerTweets).toHaveLength(2);
    expect(room.playerTweets![0]?.text).toBe("First tweet");
    expect(room.playerTweets![1]?.text).toBe("Second tweet");
  });

  it("INV-3: tweet storage does not break broadcast to all players", () => {
    fire(senderSocket.handlers, "tweet:send", { text: "Broadcast check" });
    for (const pid of [TWEET_PERSIST_PLAYER_A, TWEET_PERSIST_PLAYER_B]) {
      expect((io.emits[pid] ?? []).some((e) => e.event === "tweet:receive")).toBe(true);
    }
    expect((io.emits[TWEET_PERSIST_GM] ?? []).some((e) => e.event === "tweet:receive")).toBe(true);
  });

  it("INV-2: on rejoin, all stored tweets are replayed to reconnecting player", () => {
    // Player A tweets twice before Player B reconnects
    fire(senderSocket.handlers, "tweet:send", { text: "Tweet before rejoin 1" });
    fire(senderSocket.handlers, "tweet:send", { text: "Tweet before rejoin 2" });
    expect(room.playerTweets).toHaveLength(2);

    // Player B reconnects
    const rejoinSocket = createSocket(TWEET_PERSIST_PLAYER_B_NEW);
    rejoinSocket.data.roomCode = undefined;
    registerGameEvents(io as unknown as import("socket.io").Server, rejoinSocket as unknown as import("socket.io").Socket);

    fire(rejoinSocket.handlers, "room:rejoin", { code: TWEET_PERSIST_ROOM, playerId: TWEET_PERSIST_PLAYER_B }, () => {});

    const replayedTweets = rejoinSocket.selfEmits.filter((e) => e.event === "tweet:receive");
    expect(replayedTweets).toHaveLength(2);
    const texts = replayedTweets.map((e) => (e.data as Record<string, unknown>).text);
    expect(texts).toContain("Tweet before rejoin 1");
    expect(texts).toContain("Tweet before rejoin 2");
  });

  it("multiple players tweet — all tweets stored in order", () => {
    // Register a second sender
    room.players[TWEET_PERSIST_PLAYER_B] = makePlayer(TWEET_PERSIST_PLAYER_B, { faction: "prometheus", role: "prom_ceo" });
    const senderB = createSocket(TWEET_PERSIST_PLAYER_B);
    senderB.data.roomCode = TWEET_PERSIST_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, senderB as unknown as import("socket.io").Socket);

    fire(senderSocket.handlers, "tweet:send", { text: "From A" });
    fire(senderB.handlers, "tweet:send", { text: "From B" });
    fire(senderSocket.handlers, "tweet:send", { text: "From A again" });

    expect(room.playerTweets).toHaveLength(3);
    const texts = room.playerTweets!.map((t) => t.text);
    expect(texts).toEqual(["From A", "From B", "From A again"]);
  });
});

// ── Room cap enforcement ──────────────────────────────────────────────────────

describe("room:create — room cap enforcement", () => {
  let io: ReturnType<typeof createIo>;

  beforeEach(() => {
    rooms.clear();
    io = createIo();
    _clearLoggers();
  });

  afterEach(() => {
    rooms.clear();
    _clearLoggers();
  });

  it("blocks room creation when at capacity", () => {
    for (let i = 0; i < MAX_CONCURRENT_ROOMS; i++) {
      makeTestRoom(`gm-${i}`, `CAP${i}`);
    }

    const gmSocket = createSocket("gm-cap-test");
    registerGameEvents(io as any, gmSocket as any);

    let result: any;
    fire(gmSocket.handlers, "room:create", { gmName: "GM" }, (res: any) => { result = res; });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("capacity");
  });

  it("allows room creation after a room is deleted", () => {
    for (let i = 0; i < MAX_CONCURRENT_ROOMS; i++) {
      makeTestRoom(`gm-${i}`, `DEL${i}`);
    }

    // Delete one room to make space
    deleteRoom("DEL0");

    const gmSocket = createSocket("gm-del-test");
    registerGameEvents(io as any, gmSocket as any);

    let result: any;
    fire(gmSocket.handlers, "room:create", { gmName: "GM" }, (res: any) => { result = res; });

    expect(result.ok).toBe(true);
    expect(result.code).toBeDefined();
  });
});

// ── publish:submit — angle×target effect matrix ───────────────────────────────

const EFF_GM_ID = "gm-eff-1";
const EFF_JOURNALIST = "player-eff-journalist";
const EFF_OTHER = "player-eff-other";
const EFF_ROOM = "EFF01";

describe("publish:submit — angle×target effect matrix", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let journalistSocket: ReturnType<typeof createSocket>;
  let otherSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeTestRoom(EFF_GM_ID, EFF_ROOM);
    room.round = 1;
    room.phase = "intel";
    room.players[EFF_JOURNALIST] = makePlayer(EFF_JOURNALIST, { faction: "external", role: "ext_journalist" });
    room.players[EFF_OTHER] = makePlayer(EFF_OTHER, { faction: "external", role: "ext_diplomat" });

    journalistSocket = createSocket(EFF_JOURNALIST);
    journalistSocket.data.roomCode = EFF_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, journalistSocket as unknown as import("socket.io").Socket);

    otherSocket = createSocket(EFF_OTHER);
    otherSocket.data.roomCode = EFF_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, otherSocket as unknown as import("socket.io").Socket);
  });

  afterEach(() => {
    rooms.delete(EFF_ROOM);
  });

  // INV-1: Publication effects match the expected (angle × target × role) combination
  it("INV-1: journalist safety×openbrain — 2× effects on obBoardConfidence, regulatoryPressure, publicAwareness", () => {
    const initAwareness = room.state.publicAwareness;
    const initReg = room.state.regulatoryPressure;
    const initOBBoard = room.state.obBoardConfidence;
    const initOBTrust = room.state.obInternalTrust;
    const initSentiment = room.state.publicSentiment;

    fire(journalistSocket.handlers, "publish:submit", {
      type: "article", title: "Safety Exposé", content: "...", source: "Press",
      angle: "safety", targetFaction: "openbrain",
    });

    // Base publicAwareness +3, safety adds nothing extra, openbrain target adds nothing to awareness
    // All at ×2 for journalist: publicAwareness +6
    expect(room.state.publicAwareness).toBe(initAwareness + 6);
    // regulatoryPressure +3 × 2 = +6
    expect(room.state.regulatoryPressure).toBe(initReg + 6);
    // publicSentiment -2 × 2 = -4
    expect(room.state.publicSentiment).toBe(initSentiment - 4);
    // obBoardConfidence -3 × 2 = -6
    expect(room.state.obBoardConfidence).toBe(initOBBoard - 6);
    // obInternalTrust -2 × 2 = -4
    expect(room.state.obInternalTrust).toBe(initOBTrust - 4);
  });

  // INV-2: Journalist gets 2x effects, other writer roles get 1x base
  it("INV-2: non-journalist ext_diplomat hype×china — 1× base effects, modest values", () => {
    const initAwareness = room.state.publicAwareness;
    const initMarket = room.state.marketIndex;
    const initEconDisrupt = room.state.economicDisruption;
    const initTaiwan = room.state.taiwanTension;
    const initCCP = room.state.ccpPatience;

    fire(otherSocket.handlers, "publish:submit", {
      type: "article", title: "Hype Story", content: "...", source: "OB",
      angle: "hype", targetFaction: "china",
    });

    // publicAwareness +3 × 1 = +3
    expect(room.state.publicAwareness).toBe(initAwareness + 3);
    // marketIndex +5 × 1 = +5
    expect(room.state.marketIndex).toBe(initMarket + 5);
    // economicDisruption +2 × 1 = +2
    expect(room.state.economicDisruption).toBe(initEconDisrupt + 2);
    // taiwanTension +3 × 1 = +3
    expect(room.state.taiwanTension).toBe(initTaiwan + 3);
    // ccpPatience -2 × 1 = -2
    expect(room.state.ccpPatience).toBe(initCCP - 2);
  });

  // INV-3: All state deltas are clamped to STATE_VARIABLE_RANGES after application
  it("INV-3: effects clamped — publicAwareness does not exceed 100", () => {
    room.state.publicAwareness = 99; // near max

    fire(journalistSocket.handlers, "publish:submit", {
      type: "article", title: "Title", content: "...", source: "Press",
      angle: "geopolitics", targetFaction: "general",
    });

    // geopolitics: publicAwareness +2 (stacks), general: publicAwareness +2 (stacks) = base 3+2+2=7, ×2=14
    // 99 + 14 would exceed 100, must clamp to 100
    expect(room.state.publicAwareness).toBe(100);
  });

  // INV-4: Legacy publications (no angle/target) still work with old flat effects
  it("INV-4: no angle/target — fallback to legacy flat effects (article +15 awareness, +10 sentiment)", () => {
    const initAwareness = room.state.publicAwareness;
    const initSentiment = room.state.publicSentiment;

    fire(journalistSocket.handlers, "publish:submit", {
      type: "article", title: "Legacy Article", content: "...", source: "Press",
      // no angle, no targetFaction
    });

    expect(room.state.publicAwareness).toBe(initAwareness + 15);
    expect(room.state.publicSentiment).toBe(initSentiment + 10);
  });

  it("invalid angle rejected — no publication stored", () => {
    fire(journalistSocket.handlers, "publish:submit", {
      type: "article", title: "Bad Angle", content: "...", source: "Press",
      angle: "invalid_angle" as any, targetFaction: "general",
    });
    expect(room.publications).toHaveLength(0);
  });

  it("invalid target rejected — no publication stored", () => {
    fire(journalistSocket.handlers, "publish:submit", {
      type: "article", title: "Bad Target", content: "...", source: "Press",
      angle: "safety", targetFaction: "notafaction" as any,
    });
    expect(room.publications).toHaveLength(0);
  });

  it("geopolitics×prometheus — journalist gets 2× on intlCooperation, promBoardConfidence, alignmentConfidence", () => {
    const initIntl = room.state.intlCooperation;
    const initAwareness = room.state.publicAwareness;
    const initPromBoard = room.state.promBoardConfidence;
    const initAlign = room.state.alignmentConfidence;

    fire(journalistSocket.handlers, "publish:submit", {
      type: "article", title: "Geopolitics Prom", content: "...", source: "Press",
      angle: "geopolitics", targetFaction: "prometheus",
    });

    // intlCooperation -2 × 2 = -4
    expect(room.state.intlCooperation).toBe(initIntl - 4);
    // publicAwareness (3+2) × 2 = +10
    expect(room.state.publicAwareness).toBe(initAwareness + 10);
    // promBoardConfidence -2 × 2 = -4
    expect(room.state.promBoardConfidence).toBe(initPromBoard - 4);
    // alignmentConfidence +2 × 2 = +4
    expect(room.state.alignmentConfidence).toBe(initAlign + 4);
  });

  it("ob_safety can still publish leaks with legacy flat effects", () => {
    const safetyId = "player-eff-safety";
    room.players[safetyId] = makePlayer(safetyId, { faction: "openbrain", role: "ob_safety" });
    const safetySocket = createSocket(safetyId);
    safetySocket.data.roomCode = EFF_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, safetySocket as unknown as import("socket.io").Socket);

    const initAwareness = room.state.publicAwareness;
    const initSentiment = room.state.publicSentiment;

    fire(safetySocket.handlers, "publish:submit", {
      type: "leak", title: "Internal Leak", content: "...", source: "Anon",
    });

    // ob_safety uses legacy flat effects for leaks: +25 awareness, -10 sentiment
    expect(room.state.publicAwareness).toBe(initAwareness + 25);
    expect(room.state.publicSentiment).toBe(initSentiment - 10);
  });

  it("ob_safety can publish articles through the shared writer allowlist", () => {
    const safetyId = "player-eff-safety2";
    room.players[safetyId] = makePlayer(safetyId, { faction: "openbrain", role: "ob_safety" });
    const safetySocket = createSocket(safetyId);
    safetySocket.data.roomCode = EFF_ROOM;
    registerGameEvents(io as unknown as import("socket.io").Server, safetySocket as unknown as import("socket.io").Socket);

    fire(safetySocket.handlers, "publish:submit", {
      type: "article", title: "Article", content: "...", source: "OB",
      angle: "safety", targetFaction: "general",
    });
    expect(room.publications).toHaveLength(1);
    expect(room.publications[0].publishedBy).toBe("ob_safety");
  });
});
