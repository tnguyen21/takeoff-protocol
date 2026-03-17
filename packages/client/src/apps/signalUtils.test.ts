/**
 * Tests for SignalApp utilities.
 *
 * Invariants tested:
 * - INV-1: Sent messages show correct checkmark indicators via getReadReceiptStatus
 * - INV-2: isNpcId correctly identifies NPC IDs by __npc_ prefix
 * - INV-3: buildNpcContacts returns only NPCs with ≥1 message, sorted by timestamp ascending
 * - hasDisappearingTimer is deterministic and ~25% distribution
 */

import { describe, expect, it } from "bun:test";
import type { GameMessage } from "@takeoff/shared";
import { getReadReceiptStatus, hasDisappearingTimer, isNpcId, buildNpcContacts, NPC_IDS } from "./signalUtils.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeNpcMsg(overrides: Partial<GameMessage> & { id: string; from: string; to: string }): GameMessage {
  return {
    fromName: "Test NPC",
    faction: "external",
    content: "Test message",
    timestamp: 1_000_000,
    isTeamChat: false,
    ...overrides,
  } as GameMessage;
}

// ── getReadReceiptStatus (INV-1) ──────────────────────────────────────────────

describe("getReadReceiptStatus (INV-1)", () => {
  const now = 1_000_000;

  it("INV-1: returns 'sent' for messages < 5s old", () => {
    expect(getReadReceiptStatus(now - 4_999, now)).toBe("sent");
    expect(getReadReceiptStatus(now - 0, now)).toBe("sent");
    expect(getReadReceiptStatus(now - 1, now)).toBe("sent");
  });

  it("INV-1: returns 'sent' at exactly the boundary (age === 0)", () => {
    expect(getReadReceiptStatus(now, now)).toBe("sent");
  });

  it("INV-1: returns 'delivered' at exactly 5s old", () => {
    expect(getReadReceiptStatus(now - 5_000, now)).toBe("delivered");
  });

  it("INV-1: returns 'delivered' for messages 5–30s old", () => {
    expect(getReadReceiptStatus(now - 10_000, now)).toBe("delivered");
    expect(getReadReceiptStatus(now - 29_999, now)).toBe("delivered");
  });

  it("INV-1: returns 'read' at exactly 30s old", () => {
    expect(getReadReceiptStatus(now - 30_000, now)).toBe("read");
  });

  it("INV-1: returns 'read' for messages older than 30s", () => {
    expect(getReadReceiptStatus(now - 60_000, now)).toBe("read");
    expect(getReadReceiptStatus(now - 3_600_000, now)).toBe("read");
  });

  it("INV-1: handles future timestamps (negative age) as 'sent'", () => {
    // A message timestamped in the future should still read as 'sent'
    expect(getReadReceiptStatus(now + 5_000, now)).toBe("sent");
  });
});

// ── hasDisappearingTimer ──────────────────────────────────────────────────────

describe("hasDisappearingTimer", () => {
  it("~25% of a large sample returns true", () => {
    const ids = Array.from({ length: 100 }, (_, i) => `msg-${i}`);
    const trueCount = ids.filter((id) => hasDisappearingTimer(id)).length;
    // Should be roughly 25 ± 15 (generous range for any hash distribution)
    expect(trueCount).toBeGreaterThan(10);
    expect(trueCount).toBeLessThan(40);
  });
});

// ── isNpcId (INV-2) ───────────────────────────────────────────────────────────

describe("isNpcId (INV-2)", () => {
  it("INV-2: returns true for IDs starting with __npc_", () => {
    expect(isNpcId("__npc_anon__")).toBe(true);
    expect(isNpcId("__npc_insider__")).toBe(true);
    expect(isNpcId("__npc_unknown_new__")).toBe(true);
  });

  it("INV-2: returns false for player IDs", () => {
    expect(isNpcId("player-abc")).toBe(false);
    expect(isNpcId("socket-xyz-123")).toBe(false);
    expect(isNpcId("")).toBe(false);
  });

  it("INV-2: returns false for the __intel__ special contact", () => {
    expect(isNpcId("__intel__")).toBe(false);
  });

  it("INV-2: NPC_IDS set contains well-known NPC IDs", () => {
    expect(NPC_IDS.has("__npc_anon__")).toBe(true);
    expect(NPC_IDS.has("__npc_insider__")).toBe(true);
    expect(NPC_IDS.has("__npc_ob_engineer__")).toBe(true);
  });
});

// ── buildNpcContacts (INV-3) ──────────────────────────────────────────────────

describe("buildNpcContacts (INV-3)", () => {
  const PLAYER = "player-1";
  const OTHER_PLAYER = "player-2";

  it("INV-3: returns empty array when no messages", () => {
    expect(buildNpcContacts([], PLAYER)).toEqual([]);
  });

  it("INV-3: returns empty array when no NPC messages for current player", () => {
    const messages = [
      makeNpcMsg({ id: "m1", from: "__npc_anon__", to: OTHER_PLAYER, content: "For someone else" }),
    ];
    expect(buildNpcContacts(messages, PLAYER)).toEqual([]);
  });

  it("INV-3: returns one contact for an NPC with one message", () => {
    const messages = [
      makeNpcMsg({ id: "m1", from: "__npc_anon__", to: PLAYER, fromName: "Anonymous Source" }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].id).toBe("__npc_anon__");
    expect(contacts[0].name).toBe("Anonymous Source");
    expect(contacts[0].messages).toHaveLength(1);
  });

  it("INV-3: groups multiple messages from the same NPC into one contact", () => {
    const messages = [
      makeNpcMsg({ id: "m1", from: "__npc_anon__", to: PLAYER, timestamp: 1000 }),
      makeNpcMsg({ id: "m2", from: "__npc_anon__", to: PLAYER, timestamp: 2000 }),
      makeNpcMsg({ id: "m3", from: "__npc_anon__", to: PLAYER, timestamp: 3000 }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].messages).toHaveLength(3);
  });

  it("INV-3: creates separate contacts for different NPCs", () => {
    const messages = [
      makeNpcMsg({ id: "m1", from: "__npc_anon__", to: PLAYER }),
      makeNpcMsg({ id: "m2", from: "__npc_insider__", to: PLAYER }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    expect(contacts).toHaveLength(2);
    const ids = contacts.map((c) => c.id).sort();
    expect(ids).toEqual(["__npc_anon__", "__npc_insider__"].sort());
  });

  it("INV-3: sorts messages by timestamp ascending", () => {
    const messages = [
      makeNpcMsg({ id: "m3", from: "__npc_anon__", to: PLAYER, timestamp: 3000 }),
      makeNpcMsg({ id: "m1", from: "__npc_anon__", to: PLAYER, timestamp: 1000 }),
      makeNpcMsg({ id: "m2", from: "__npc_anon__", to: PLAYER, timestamp: 2000 }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    const ts = contacts[0].messages.map((m) => m.timestamp);
    expect(ts).toEqual([1000, 2000, 3000]);
  });

  it("INV-3: uses fromName from messages for the contact name", () => {
    const messages = [
      makeNpcMsg({ id: "m1", from: "__npc_new__", to: PLAYER, fromName: "Mysterious Stranger" }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    expect(contacts[0].name).toBe("Mysterious Stranger");
  });

  it("INV-3: uses known avatarColor for well-known NPC IDs", () => {
    const messages = [
      makeNpcMsg({ id: "m1", from: "__npc_anon__", to: PLAYER }),
      makeNpcMsg({ id: "m2", from: "__npc_insider__", to: PLAYER }),
      makeNpcMsg({ id: "m3", from: "__npc_ob_engineer__", to: PLAYER }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    const byId = Object.fromEntries(contacts.map((c) => [c.id, c]));
    expect(byId["__npc_anon__"].avatarColor).toBe("bg-red-900");
    expect(byId["__npc_insider__"].avatarColor).toBe("bg-purple-900");
    expect(byId["__npc_ob_engineer__"].avatarColor).toBe("bg-emerald-900");
  });

  it("INV-3: falls back to default metadata for unknown NPC IDs", () => {
    const messages = [
      makeNpcMsg({ id: "m1", from: "__npc_unknown_new__", to: PLAYER }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    expect(contacts[0].avatarColor).toBe("bg-neutral-700");
    expect(contacts[0].subtitle).toBe("· unknown source");
  });

  it("INV-3: filters out non-NPC messages", () => {
    const messages: GameMessage[] = [
      makeNpcMsg({ id: "m1", from: "real-player-id", to: PLAYER }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    expect(contacts).toHaveLength(0);
  });

  it("INV-3: maps message fields correctly (id, content, timestamp)", () => {
    const messages = [
      makeNpcMsg({ id: "msg-xyz", from: "__npc_anon__", to: PLAYER, content: "Secret info", timestamp: 42_000 }),
    ];
    const contacts = buildNpcContacts(messages, PLAYER);
    expect(contacts[0].messages[0]).toEqual({ id: "msg-xyz", content: "Secret info", timestamp: 42_000 });
  });
});
