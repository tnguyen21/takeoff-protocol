/**
 * Reconnection (room:rejoin) integration tests.
 *
 * Verifies that all game state is correctly replayed to reconnected clients.
 *
 * Invariants tested:
 * - INV-1: old socket ID deleted, new socket ID added with same player data (name/faction/role)
 * - INV-2: player.connected=true after rejoin; room:state broadcast reflects new status
 * - INV-3: fog-of-war state replayed — openbrain sees obCapability as exact, chinaCapability as estimate
 * - INV-4: content replayed (game:content) with correct faction/role filtering
 * - INV-5: message history replayed (message:history) with faction filtering
 * - INV-6: decision options replayed when phase=decision (game:decisions)
 * - INV-7: team votes replayed to leader (decision:votes) — requires w-18873d9343e8 (skipped)
 * - INV-8: ending data replayed when phase=ending (game:ending) — requires w-18873d9343e8 (skipped)
 */

process.env.LOG_ENABLED = "false";

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { GameMessage, GameRoom, Player } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { rooms } from "./rooms.js";
import { registerGameEvents } from "./events.js";
import { setGeneratedBriefing, setGeneratedContent, setGeneratedDecisions } from "./generation/cache.js";
import { emitBriefing } from "./game.js";
import { ROUND1_DECISIONS } from "./test-fixtures.js";

// ── Minimal mocks (same pattern as events.test.ts) ───────────────────────────

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

function fire(
  handlers: Map<string, (...args: unknown[]) => void>,
  event: string,
  ...args: unknown[]
) {
  const h = handlers.get(event);
  if (!h) throw new Error(`Handler not registered: ${event}`);
  h(...args);
}

// ── Room / player builders ────────────────────────────────────────────────────

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

function makeRoom(code: string, gmId: string, overrides: Partial<GameRoom> = {}): GameRoom {
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
    ...overrides,
  };
  rooms.set(code, room);
  return room;
}

function makeMessage(overrides: Partial<GameMessage>): GameMessage {
  return {
    id: Math.random().toString(36).slice(2),
    from: "sender-id",
    fromName: "Sender",
    to: null,
    content: "test message",
    faction: "openbrain",
    isTeamChat: true,
    timestamp: Date.now(),
    isNpc: false,
    ...overrides,
  };
}

// ── Shared test constants ─────────────────────────────────────────────────────

const ROOM_CODE = "RJ01";
const GM_ID = "gm-rejoin";
const OLD_SOCKET = "old-socket-1";
const NEW_SOCKET = "new-socket-1";

// ── Basic rejoin flow ─────────────────────────────────────────────────────────

describe("room:rejoin — basic rejoin flow", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let newSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeRoom(ROOM_CODE, GM_ID, { phase: "decision", round: 1 });
    room.players[OLD_SOCKET] = makePlayer(OLD_SOCKET);
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);
    setGeneratedContent(room, 1, "openbrain", [
      { faction: "openbrain", app: "slack", items: [{ id: "test-slack-1", type: "message", round: 1, body: "Test content", timestamp: "2027-01-01T00:00:00Z", classification: "context" }] },
    ]);

    newSocket = createSocket(NEW_SOCKET);
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      newSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(ROOM_CODE);
  });

  it("INV-1: old socket ID removed, new socket ID added with same player data", () => {
    let result: { ok: boolean; error?: string } | undefined;
    fire(
      newSocket.handlers,
      "room:rejoin",
      { code: ROOM_CODE, playerId: OLD_SOCKET },
      (r: { ok: boolean }) => { result = r; },
    );

    expect(result?.ok).toBe(true);
    // Old socket is gone
    expect(room.players[OLD_SOCKET]).toBeUndefined();
    // New socket has the same player data
    const player = room.players[NEW_SOCKET];
    expect(player).toBeDefined();
    expect(player!.name).toBe(`Player-${OLD_SOCKET}`);
    expect(player!.faction).toBe("openbrain");
    expect(player!.role).toBe("ob_cto");
  });

  it("INV-2: player.connected=true after rejoin; room:state broadcast reflects this", () => {
    // Simulate prior disconnect
    room.players[OLD_SOCKET]!.connected = false;

    fire(newSocket.handlers, "room:rejoin", { code: ROOM_CODE, playerId: OLD_SOCKET }, () => {});

    // Player is connected
    expect(room.players[NEW_SOCKET]!.connected).toBe(true);
    // room:state was broadcast to the room
    const roomEmits = io.emits[ROOM_CODE] ?? [];
    const stateEmit = roomEmits.find((e) => e.event === "room:state");
    expect(stateEmit).toBeDefined();
    const players = (stateEmit!.data as { players: { connected: boolean }[] }).players;
    expect(players.some((p) => p.connected)).toBe(true);
  });

  it("game:phase is replayed to reconnected socket", () => {
    fire(newSocket.handlers, "room:rejoin", { code: ROOM_CODE, playerId: OLD_SOCKET }, () => {});

    const phaseEmit = newSocket.selfEmits.find((e) => e.event === "game:phase");
    expect(phaseEmit).toBeDefined();
    const data = phaseEmit!.data as { phase: string; round: number };
    expect(data.phase).toBe("decision");
    expect(data.round).toBe(1);
  });

  it("INV-3: fog-of-war state replayed — openbrain sees obCapability as exact, chinaCapability as estimate", () => {
    fire(newSocket.handlers, "room:rejoin", { code: ROOM_CODE, playerId: OLD_SOCKET }, () => {});

    const stateEmit = newSocket.selfEmits.find((e) => e.event === "game:state");
    expect(stateEmit).toBeDefined();
    const view = (stateEmit!.data as { view: Record<string, { accuracy: string }> }).view;
    // openbrain has exact visibility on their own capability
    expect(view.obCapability?.accuracy).toBe("exact");
    // openbrain sees chinaCapability as an estimate
    expect(view.chinaCapability?.accuracy).toBe("estimate");
  });

  it("INV-4: content is replayed via game:content with round 1 data", () => {
    fire(newSocket.handlers, "room:rejoin", { code: ROOM_CODE, playerId: OLD_SOCKET }, () => {});

    const contentEmit = newSocket.selfEmits.find((e) => e.event === "game:content");
    expect(contentEmit).toBeDefined();
    const content = (contentEmit!.data as { content: unknown[] }).content;
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThan(0);
  });

  it("INV-6: decision options replayed when phase=decision", () => {
    fire(newSocket.handlers, "room:rejoin", { code: ROOM_CODE, playerId: OLD_SOCKET }, () => {});

    const decisionsEmit = newSocket.selfEmits.find((e) => e.event === "game:decisions");
    expect(decisionsEmit).toBeDefined();
    const { individual, team } = decisionsEmit!.data as { individual: unknown; team: unknown };
    // ob_cto has individual decisions in round 1
    expect(individual).not.toBeNull();
    // openbrain faction has team decisions in round 1
    expect(team).not.toBeNull();
  });

  it("no game:decisions emitted outside decision phase", () => {
    room.phase = "intel";

    fire(newSocket.handlers, "room:rejoin", { code: ROOM_CODE, playerId: OLD_SOCKET }, () => {});

    const decisionsEmit = newSocket.selfEmits.find((e) => e.event === "game:decisions");
    expect(decisionsEmit).toBeUndefined();
  });

  it("no state replayed in lobby phase", () => {
    room.phase = "lobby";

    fire(newSocket.handlers, "room:rejoin", { code: ROOM_CODE, playerId: OLD_SOCKET }, () => {});

    expect(newSocket.selfEmits.find((e) => e.event === "game:state")).toBeUndefined();
    expect(newSocket.selfEmits.find((e) => e.event === "game:content")).toBeUndefined();
    expect(newSocket.selfEmits.find((e) => e.event === "game:decisions")).toBeUndefined();
  });
});

// ── Message history filtering (INV-5) ─────────────────────────────────────────

const MSG_ROOM = "RJMSG";
const MSG_GM = "gm-msg-rejoin";
const MSG_OLD_OB = "ob-old";
const MSG_OLD_PROM = "prom-old";
const MSG_NEW_OB = "ob-new";

describe("room:rejoin — INV-5: message history filtering", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let newSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeRoom(MSG_ROOM, MSG_GM, { phase: "decision", round: 1 });

    // openbrain player reconnecting
    room.players[MSG_OLD_OB] = makePlayer(MSG_OLD_OB, { faction: "openbrain", role: "ob_cto" });
    // prometheus player still in room
    room.players[MSG_OLD_PROM] = makePlayer(MSG_OLD_PROM, { faction: "prometheus", role: "prom_ceo" });

    // Team chat for openbrain (should be replayed)
    room.messages.push(makeMessage({
      id: "msg-ob-team",
      faction: "openbrain",
      isTeamChat: true,
      from: MSG_OLD_OB,
      to: null,
      content: "OB team chat",
    }));

    // Team chat for prometheus (should NOT be replayed to OB player)
    room.messages.push(makeMessage({
      id: "msg-prom-team",
      faction: "prometheus",
      isTeamChat: true,
      from: MSG_OLD_PROM,
      to: null,
      content: "Prom team chat",
    }));

    // DM to the OB player (should be replayed)
    room.messages.push(makeMessage({
      id: "msg-dm-to-ob",
      faction: "prometheus",
      isTeamChat: false,
      from: MSG_OLD_PROM,
      to: MSG_OLD_OB,
      content: "DM to OB player",
    }));

    // DM from the OB player (should be replayed)
    room.messages.push(makeMessage({
      id: "msg-dm-from-ob",
      faction: "openbrain",
      isTeamChat: false,
      from: MSG_OLD_OB,
      to: MSG_OLD_PROM,
      content: "DM from OB player",
    }));

    // DM between two other players (should NOT be replayed)
    room.messages.push(makeMessage({
      id: "msg-dm-other",
      faction: "prometheus",
      isTeamChat: false,
      from: MSG_OLD_PROM,
      to: MSG_GM,
      content: "Other DM",
    }));

    newSocket = createSocket(MSG_NEW_OB);
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      newSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(MSG_ROOM);
  });

  it("replays own team chat and DMs, excludes other faction's chat and unrelated DMs", () => {
    fire(newSocket.handlers, "room:rejoin", { code: MSG_ROOM, playerId: MSG_OLD_OB }, () => {});

    const historyEmit = newSocket.selfEmits.find((e) => e.event === "message:history");
    expect(historyEmit).toBeDefined();
    const messages = (historyEmit!.data as { messages: { id: string }[] }).messages;
    const ids = messages.map((m) => m.id);

    expect(ids).toContain("msg-ob-team");      // own team chat ✓
    expect(ids).toContain("msg-dm-to-ob");     // DM received ✓
    expect(ids).toContain("msg-dm-from-ob");   // DM sent ✓
    expect(ids).not.toContain("msg-prom-team"); // other faction team chat ✗
    expect(ids).not.toContain("msg-dm-other"); // unrelated DM ✗
  });
});

// ── GM rejoin ─────────────────────────────────────────────────────────────────

const GM_ROOM = "RJGM";
const GM_OLD = "gm-old";
const GM_NEW = "gm-new";

describe("room:rejoin — GM rejoin", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let newSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeRoom(GM_ROOM, GM_OLD, { phase: "decision", round: 1 });
    // A player in the room
    room.players["some-player"] = makePlayer("some-player", { faction: "openbrain", role: "ob_ceo" });

    newSocket = createSocket(GM_NEW);
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      newSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(GM_ROOM);
  });

  it("GM rejoin: room.gmId updated to new socket ID", () => {
    fire(newSocket.handlers, "room:rejoin", { code: GM_ROOM, playerId: GM_OLD }, () => {});

    expect(room.gmId).toBe(GM_NEW);
  });

  it("GM rejoin: full unfogged state sent with isFull: true", () => {
    fire(newSocket.handlers, "room:rejoin", { code: GM_ROOM, playerId: GM_OLD }, () => {});

    const stateEmit = newSocket.selfEmits.find((e) => e.event === "game:state");
    expect(stateEmit).toBeDefined();
    expect((stateEmit!.data as { isFull?: boolean }).isFull).toBe(true);
  });

  it("GM rejoin: callback returns ok: true with no player data", () => {
    let result: { ok: boolean; player?: unknown } | undefined;
    fire(
      newSocket.handlers,
      "room:rejoin",
      { code: GM_ROOM, playerId: GM_OLD },
      (r: { ok: boolean; player?: unknown }) => { result = r; },
    );

    expect(result?.ok).toBe(true);
    expect(result?.player).toBeUndefined();
  });
});

// ── Failure modes ─────────────────────────────────────────────────────────────

const FAIL_ROOM = "RJFAIL";
const FAIL_GM = "gm-fail";

describe("room:rejoin — failure modes", () => {
  let io: ReturnType<typeof createIo>;
  let newSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    makeRoom(FAIL_ROOM, FAIL_GM, { phase: "decision", round: 1 });
    newSocket = createSocket("fail-new-socket");
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      newSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(FAIL_ROOM);
  });

  it("rejects rejoin with invalid playerId — callback { ok: false }", () => {
    let result: { ok: boolean; error?: string } | undefined;
    fire(
      newSocket.handlers,
      "room:rejoin",
      { code: FAIL_ROOM, playerId: "no-such-player-id" },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toBeDefined();
  });

  it("rejects rejoin to wrong room code — callback { ok: false }", () => {
    let result: { ok: boolean; error?: string } | undefined;
    fire(
      newSocket.handlers,
      "room:rejoin",
      { code: "XXXX", playerId: FAIL_GM },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/Room not found/);
  });

  it("rejects rejoin after room cleaned up — callback { ok: false }", () => {
    rooms.delete(FAIL_ROOM);

    let result: { ok: boolean; error?: string } | undefined;
    fire(
      newSocket.handlers,
      "room:rejoin",
      { code: FAIL_ROOM, playerId: FAIL_GM },
      (r: { ok: boolean; error?: string }) => { result = r; },
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/Room not found/);
  });

  it("no state emitted when rejoin fails", () => {
    fire(
      newSocket.handlers,
      "room:rejoin",
      { code: FAIL_ROOM, playerId: "no-such-player" },
      () => {},
    );

    expect(newSocket.selfEmits).toHaveLength(0);
  });
});

// ── Mid-decision rejoin ───────────────────────────────────────────────────────

const MID_ROOM = "RJMID";
const MID_GM = "gm-mid";
const MID_OLD = "mid-old";
const MID_NEW = "mid-new";

describe("room:rejoin — mid-decision rejoin", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let newSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeRoom(MID_ROOM, MID_GM, { phase: "decision", round: 1 });
    room.players[MID_OLD] = makePlayer(MID_OLD, { faction: "openbrain", role: "ob_ceo", isLeader: true });
    setGeneratedDecisions(room, 1, ROUND1_DECISIONS);

    newSocket = createSocket(MID_NEW);
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      newSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(MID_ROOM);
  });

  it("player can still submit a decision after rejoining", () => {
    fire(newSocket.handlers, "room:rejoin", { code: MID_ROOM, playerId: MID_OLD }, () => {});

    // After rejoin, newSocket is registered for the room, so fire decision:submit
    fire(newSocket.handlers, "decision:submit", { individual: "ob_ceo_fundraise" });

    // Decision recorded under new socket ID
    expect(room.decisions[MID_NEW]).toBe("ob_ceo_fundraise");
  });

  it("game:decisions replayed with correct individual and team options for ob_ceo", () => {
    fire(newSocket.handlers, "room:rejoin", { code: MID_ROOM, playerId: MID_OLD }, () => {});

    const decisionsEmit = newSocket.selfEmits.find((e) => e.event === "game:decisions");
    expect(decisionsEmit).toBeDefined();
    const { individual, team } = decisionsEmit!.data as { individual: { role: string } | null; team: { faction: string } | null };
    expect(individual?.role).toBe("ob_ceo");
    expect(team?.faction).toBe("openbrain");
  });

  // INV-7: Team votes replay (requires w-18873d9343e8)
  it.skip("INV-7: team votes replayed to leader (decision:votes) — requires w-18873d9343e8", () => {
    // When w-18873d9343e8 is merged: set room.teamVotes["openbrain"] = { "some-player": "ob_accelerate" }
    // fire rejoin, verify decision:votes is emitted to leader socket
  });
});

// INV-8: Ending data replay (requires w-18873d9343e8)
describe.skip("room:rejoin — INV-8: post-ending rejoin (requires w-18873d9343e8)", () => {
  it("ending arcs replayed when phase=ending (game:ending event)", () => {
    // When w-18873d9343e8 is merged: set room.phase="ending", set room.endingData
    // fire rejoin, verify game:ending is emitted with arc outcomes
  });
});

// ── Briefing replay invariants ────────────────────────────────────────────────

const BRF_ROOM = "RJBRF";
const BRF_GM = "gm-brf";
const BRF_OLD = "brf-old";
const BRF_NEW = "brf-new";

describe("room:rejoin — briefing replay", () => {
  let room: GameRoom;
  let io: ReturnType<typeof createIo>;
  let newSocket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    io = createIo();
    room = makeRoom(BRF_ROOM, BRF_GM, { phase: "briefing", round: 1 });
    room.players[BRF_OLD] = makePlayer(BRF_OLD, { faction: "openbrain", role: "ob_cto" });

    newSocket = createSocket(BRF_NEW);
    registerGameEvents(
      io as unknown as import("socket.io").Server,
      newSocket as unknown as import("socket.io").Socket,
    );
  });

  afterEach(() => {
    rooms.delete(BRF_ROOM);
  });

  it("INV-1: emits generated briefing when room cache has one", () => {
    setGeneratedBriefing(room, 1, {
      common: "Generated common text",
      factionVariants: {
        openbrain: "Generated OB variant",
        prometheus: "Prom variant",
        china: "China variant",
        external: "External variant",
      },
    });

    fire(newSocket.handlers, "room:rejoin", { code: BRF_ROOM, playerId: BRF_OLD }, () => {});

    const briefingEmit = newSocket.selfEmits.find((e) => e.event === "game:briefing");
    expect(briefingEmit).toBeDefined();
    const text = (briefingEmit!.data as { text: string }).text;
    expect(text).toContain("Generated common text");
    expect(text).toContain("Generated OB variant");
  });

  it("INV-1 regression: pre-authored text is NOT emitted when generated briefing exists", () => {
    setGeneratedBriefing(room, 1, {
      common: "Generated common text",
      factionVariants: {
        openbrain: "Generated OB variant",
        prometheus: "Prom variant",
        china: "China variant",
        external: "External variant",
      },
    });

    fire(newSocket.handlers, "room:rejoin", { code: BRF_ROOM, playerId: BRF_OLD }, () => {});

    const briefingEmit = newSocket.selfEmits.find((e) => e.event === "game:briefing");
    const text = (briefingEmit!.data as { text: string }).text;
    // Pre-authored round 1 common text starts with "It's November 2026"
    expect(text).not.toContain("It's November 2026");
  });

  it("INV-2: emits placeholder briefing when no generated briefing exists", () => {
    // No setGeneratedBriefing call — room.generatedRounds is unset

    fire(newSocket.handlers, "room:rejoin", { code: BRF_ROOM, playerId: BRF_OLD }, () => {});

    const briefingEmit = newSocket.selfEmits.find((e) => e.event === "game:briefing");
    expect(briefingEmit).toBeDefined();
    const text = (briefingEmit!.data as { text: string }).text;
    // Placeholder text is emitted when no generated briefing exists
    expect(text).toContain("Content generation in progress");
  });

  it("INV-3: replayPlayerState emits same text as emitBriefing for the same player", () => {
    setGeneratedBriefing(room, 1, {
      common: "Invariant common",
      factionVariants: {
        openbrain: "Invariant OB variant",
        prometheus: "Prom v",
        china: "China v",
        external: "Ext v",
      },
    });

    // Trigger replayPlayerState via rejoin
    fire(newSocket.handlers, "room:rejoin", { code: BRF_ROOM, playerId: BRF_OLD }, () => {});
    const replayText = (newSocket.selfEmits.find((e) => e.event === "game:briefing")?.data as { text: string })?.text;

    // After rejoin, BRF_NEW is in room.players; call emitBriefing and compare
    const emitIo = createIo();
    emitBriefing(emitIo as unknown as import("socket.io").Server, room);
    const emittedText = (emitIo.emits[BRF_NEW]?.find((e) => e.event === "game:briefing")?.data as { text: string })?.text;

    expect(replayText).toBeDefined();
    expect(emittedText).toBeDefined();
    expect(replayText).toBe(emittedText);
  });
});
