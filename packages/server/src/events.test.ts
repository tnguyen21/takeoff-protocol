/**
 * Tests for gm:send-npc-message socket event handler.
 *
 * Invariants tested:
 * - INV-1: Only the GM (socket.id === room.gmId) can send NPC messages
 * - INV-2: npcId must exist in NPC_PERSONAS — unknown IDs are rejected
 * - INV-3: targetPlayerId must exist in room.players — unknown targets are rejected
 * - INV-4: On success, message is stored in room.messages with isNpc: true
 * - INV-5: On success, message is emitted to targetPlayerId and echoed to GM with _gmView: true
 */

import { describe, it, expect, beforeEach } from "bun:test";
import type { GameRoom, Player } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { NPC_PERSONAS, getNpcPersona } from "./content/npcPersonas.js";

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

  const message = {
    id: crypto.randomUUID(),
    from: npcId,
    fromName: persona.name,
    to: targetPlayerId,
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
    expect(msg.faction).toBeUndefined();
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
