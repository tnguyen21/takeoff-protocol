/**
 * Tests for SignalApp utilities.
 *
 * Invariants tested:
 * - INV-1: Sent messages show correct checkmark indicators via getReadReceiptStatus
 * - INV-3: NPC contacts appear in the NPC_CONTACTS list with at least one message each
 * - hasDisappearingTimer is deterministic and ~25% distribution
 */

import { describe, expect, it } from "bun:test";
import { getReadReceiptStatus, hasDisappearingTimer, NPC_CONTACTS, NPC_IDS } from "./signalUtils.js";

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

describe("hasDisappearingTimer", () => {
  it("is deterministic — same ID always returns same result", () => {
    const id = "msg-abc-123";
    expect(hasDisappearingTimer(id)).toBe(hasDisappearingTimer(id));
  });

  it("returns a boolean", () => {
    expect(typeof hasDisappearingTimer("some-id")).toBe("boolean");
  });

  it("~25% of a large sample returns true", () => {
    const ids = Array.from({ length: 100 }, (_, i) => `msg-${i}`);
    const trueCount = ids.filter((id) => hasDisappearingTimer(id)).length;
    // Should be roughly 25 ± 15 (generous range for any hash distribution)
    expect(trueCount).toBeGreaterThan(10);
    expect(trueCount).toBeLessThan(40);
  });
});

describe("NPC_CONTACTS (INV-3)", () => {
  it("INV-3: has at least 2 NPC contacts", () => {
    expect(NPC_CONTACTS.length).toBeGreaterThanOrEqual(2);
  });

  it("INV-3: every NPC contact has at least one message", () => {
    for (const contact of NPC_CONTACTS) {
      expect(contact.messages.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("INV-3: all NPC contact IDs are unique", () => {
    const ids = NPC_CONTACTS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("INV-3: all NPC contact IDs are present in NPC_IDS set", () => {
    for (const contact of NPC_CONTACTS) {
      expect(NPC_IDS.has(contact.id)).toBe(true);
    }
  });

  it("INV-3: each contact has a non-empty name and avatarColor", () => {
    for (const contact of NPC_CONTACTS) {
      expect(contact.name.length).toBeGreaterThan(0);
      expect(contact.avatarColor.length).toBeGreaterThan(0);
    }
  });

  it("INV-3: NPC messages have numeric timestamps in the past", () => {
    const now = Date.now();
    for (const contact of NPC_CONTACTS) {
      for (const msg of contact.messages) {
        expect(typeof msg.timestamp).toBe("number");
        expect(msg.timestamp).toBeLessThan(now + 1000); // allow 1s clock drift
      }
    }
  });

  it("INV-3: NPC message IDs are unique within each contact", () => {
    for (const contact of NPC_CONTACTS) {
      const ids = contact.messages.map((m) => m.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  });
});
