/**
 * Tests for messages store state management.
 *
 * Invariants tested:
 * - INV-1: A message with a duplicate id is never added to the messages array
 * - INV-2: Unread counts only increment for messages where from !== playerId
 * - INV-3: markRead(appId) sets unreadCounts[appId] to exactly 0
 * - INV-4: After message:history replay, messages = replayed set (with _seq), unreadCounts = {}
 */

import { describe, expect, it, beforeEach, mock } from "bun:test";
import type { GameMessage } from "@takeoff/shared";

// Capture socket event handlers so tests can invoke them directly
const socketHandlers: Record<string, Array<(data: unknown) => void>> = {};

mock.module("../socket.js", () => ({
  socket: {
    id: "mock-socket-id",
    connected: false,
    on: (event: string, handler: (data: unknown) => void) => {
      if (!socketHandlers[event]) socketHandlers[event] = [];
      socketHandlers[event].push(handler);
    },
    once: () => {},
    off: () => {},
    emit: () => {},
    connect: () => {},
    disconnect: () => {},
  },
}));

mock.module("../sounds/index.js", () => ({
  soundManager: {
    play: () => {},
    muted: true,
    setMuted: () => {},
    toggleMute: () => {},
    subscribe: () => () => {},
  },
  useSoundEffects: () => ({ muted: true, toggleMute: () => {} }),
}));

// Import stores AFTER mocks so they use the captured-handler socket
const { useMessagesStore } = await import("./messages.js");
const { useGameStore } = await import("./game.js");

// Helper: fire a socket event through the registered handlers
function emit(event: string, data: unknown): void {
  socketHandlers[event]?.forEach((h) => h(data));
}

// Helper: build a minimal valid GameMessage
function makeMsg(overrides: Partial<GameMessage> = {}): GameMessage {
  return {
    id: "msg-1",
    from: "player-other",
    fromName: "Other Player",
    to: null,
    faction: "openbrain",
    content: "Hello!",
    timestamp: Date.now(),
    isTeamChat: true,
    ...overrides,
  };
}

beforeEach(() => {
  useMessagesStore.setState({ messages: [], unreadCounts: {} });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useGameStore.setState({ playerId: "player-self" } as any);
});

// ── markRead ─────────────────────────────────────────────────────────────────

describe("markRead", () => {
  it("INV-3: sets unreadCounts[appId] to exactly 0", () => {
    useMessagesStore.setState({ unreadCounts: { slack: 5 } });
    useMessagesStore.getState().markRead("slack");
    expect(useMessagesStore.getState().unreadCounts["slack"]).toBe(0);
  });

  it("INV-3: markRead on appId with no prior messages does not crash and sets 0", () => {
    expect(() => useMessagesStore.getState().markRead("signal")).not.toThrow();
    expect(useMessagesStore.getState().unreadCounts["signal"]).toBe(0);
  });

  it("INV-3: markRead only resets the target appId, leaves others untouched", () => {
    useMessagesStore.setState({ unreadCounts: { slack: 3, signal: 7 } });
    useMessagesStore.getState().markRead("slack");
    expect(useMessagesStore.getState().unreadCounts["slack"]).toBe(0);
    expect(useMessagesStore.getState().unreadCounts["signal"]).toBe(7);
  });
});

// ── message:receive ───────────────────────────────────────────────────────────

describe("message:receive", () => {
  it("routes isTeamChat=true to slack unreadCounts", () => {
    emit("message:receive", makeMsg({ isTeamChat: true }));
    expect(useMessagesStore.getState().unreadCounts["slack"]).toBe(1);
    expect(useMessagesStore.getState().unreadCounts["signal"]).toBeUndefined();
  });

  it("routes isTeamChat=false to signal unreadCounts", () => {
    emit("message:receive", makeMsg({ id: "dm1", isTeamChat: false }));
    expect(useMessagesStore.getState().unreadCounts["signal"]).toBe(1);
    expect(useMessagesStore.getState().unreadCounts["slack"]).toBeUndefined();
  });

  it("INV-2: own messages do not increment unread counts", () => {
    emit("message:receive", makeMsg({ from: "player-self", isTeamChat: true }));
    expect(useMessagesStore.getState().unreadCounts["slack"]).toBeUndefined();
  });

  it("INV-2: own messages are still added to the messages array", () => {
    emit("message:receive", makeMsg({ from: "player-self", isTeamChat: true }));
    expect(useMessagesStore.getState().messages).toHaveLength(1);
  });

  it("INV-1: duplicate message id is silently dropped", () => {
    const msg = makeMsg({ id: "dup-id" });
    emit("message:receive", msg);
    emit("message:receive", msg);
    expect(useMessagesStore.getState().messages).toHaveLength(1);
  });

  it("INV-1: duplicate message does not increment unread count a second time", () => {
    const msg = makeMsg({ id: "dup-id" });
    emit("message:receive", msg);
    emit("message:receive", msg);
    expect(useMessagesStore.getState().unreadCounts["slack"]).toBe(1);
  });

  it("unread count accumulates for distinct messages", () => {
    emit("message:receive", makeMsg({ id: "m1", isTeamChat: true }));
    emit("message:receive", makeMsg({ id: "m2", isTeamChat: true }));
    emit("message:receive", makeMsg({ id: "m3", isTeamChat: true }));
    expect(useMessagesStore.getState().unreadCounts["slack"]).toBe(3);
  });

  it("receive 3 slack + 1 signal, markRead(slack) → slack=0, signal unaffected", () => {
    emit("message:receive", makeMsg({ id: "s1", isTeamChat: true }));
    emit("message:receive", makeMsg({ id: "s2", isTeamChat: true }));
    emit("message:receive", makeMsg({ id: "s3", isTeamChat: true }));
    emit("message:receive", makeMsg({ id: "dm1", isTeamChat: false }));

    useMessagesStore.getState().markRead("slack");

    expect(useMessagesStore.getState().unreadCounts["slack"]).toBe(0);
    expect(useMessagesStore.getState().unreadCounts["signal"]).toBe(1);
  });

  it("received messages get a numeric _seq stamp", () => {
    emit("message:receive", makeMsg({ id: "m1" }));
    const msg = useMessagesStore.getState().messages[0] as GameMessage & { _seq: number };
    expect(typeof msg._seq).toBe("number");
  });
});

// ── message:history ───────────────────────────────────────────────────────────

describe("message:history", () => {
  it("INV-4: replaces existing messages with the replayed set", () => {
    useMessagesStore.setState({ messages: [makeMsg({ id: "old" }) as GameMessage & { _seq: number }], unreadCounts: { slack: 2 } });

    const replayed = [makeMsg({ id: "h1" }), makeMsg({ id: "h2" }), makeMsg({ id: "h3" })];
    emit("message:history", { messages: replayed });

    const stored = useMessagesStore.getState().messages;
    expect(stored).toHaveLength(3);
    expect(stored.map((m) => m.id)).toEqual(["h1", "h2", "h3"]);
  });

  it("INV-4: clears all unreadCounts after history replay", () => {
    useMessagesStore.setState({ unreadCounts: { slack: 5, signal: 3 } });
    emit("message:history", { messages: [] });
    expect(useMessagesStore.getState().unreadCounts).toEqual({});
  });

  it("INV-4: history messages receive _seq stamps", () => {
    emit("message:history", { messages: [makeMsg({ id: "h1" }), makeMsg({ id: "h2" })] });
    const msgs = useMessagesStore.getState().messages as Array<GameMessage & { _seq: number }>;
    expect(typeof msgs[0]._seq).toBe("number");
    expect(typeof msgs[1]._seq).toBe("number");
  });

  it("INV-4: 5-message history replay clears pre-existing messages and unreadCounts", () => {
    // Populate with existing receive traffic
    emit("message:receive", makeMsg({ id: "pre-1" }));
    emit("message:receive", makeMsg({ id: "pre-2" }));
    emit("message:receive", makeMsg({ id: "pre-3" }));
    expect(useMessagesStore.getState().messages).toHaveLength(3);

    const replayed = Array.from({ length: 5 }, (_, i) => makeMsg({ id: `hist-${i}` }));
    emit("message:history", { messages: replayed });

    expect(useMessagesStore.getState().messages).toHaveLength(5);
    expect(useMessagesStore.getState().unreadCounts).toEqual({});
  });
});
