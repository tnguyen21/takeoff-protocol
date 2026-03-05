/**
 * Tests for SlackApp channel management utilities.
 *
 * Invariants tested:
 * - INV-1: getChannelMessages correctly filters messages to a channel
 * - INV-2: computeUnreadCounts correctly counts unread messages per channel
 * - INV-channel-assign: assignChannelToMessage uses channel field or falls back to classification
 */

import { describe, expect, it } from "bun:test";
import type { ContentItem, GameMessage } from "@takeoff/shared";
import { assignChannelToMessage, getChannelMessages, computeUnreadCounts, SLACK_CHANNELS } from "./slackUtils.js";

function makeItem(overrides: Partial<ContentItem> & { id: string }): ContentItem {
  return {
    type: "message",
    round: 1,
    body: "test body",
    timestamp: "2026-01-01",
    ...overrides,
  };
}

describe("assignChannelToMessage", () => {
  it("uses channel field when present with # prefix", () => {
    const item = makeItem({ id: "1", channel: "#research" });
    expect(assignChannelToMessage(item)).toBe("#research");
  });

  it("normalizes channel field without # prefix", () => {
    const item = makeItem({ id: "2", channel: "alignment" });
    expect(assignChannelToMessage(item)).toBe("#alignment");
  });

  it("falls back to #general for unknown channel in channel field", () => {
    const item = makeItem({ id: "3", channel: "#unknown-channel" });
    expect(assignChannelToMessage(item)).toBe("#general");
  });

  it("classification=critical → #announcements when no channel field", () => {
    const item = makeItem({ id: "4", classification: "critical" });
    expect(assignChannelToMessage(item)).toBe("#announcements");
  });

  it("classification=red-herring → #random when no channel field", () => {
    const item = makeItem({ id: "5", classification: "red-herring" });
    expect(assignChannelToMessage(item)).toBe("#random");
  });

  it("classification=breadcrumb → #ops when no channel field", () => {
    const item = makeItem({ id: "6", classification: "breadcrumb" });
    expect(assignChannelToMessage(item)).toBe("#ops");
  });

  it("classification=context → #general when no channel field", () => {
    const item = makeItem({ id: "7", classification: "context" });
    expect(assignChannelToMessage(item)).toBe("#general");
  });

  it("no channel and no classification → #general", () => {
    const item = makeItem({ id: "8" });
    expect(assignChannelToMessage(item)).toBe("#general");
  });
});

describe("getChannelMessages (INV-1)", () => {
  const items: ContentItem[] = [
    makeItem({ id: "a", channel: "#research" }),
    makeItem({ id: "b", channel: "#general" }),
    makeItem({ id: "c", classification: "critical" }), // → #announcements
    makeItem({ id: "d" }), // → #general
    makeItem({ id: "e", channel: "#alignment" }),
  ];

  it("INV-1: returns only messages assigned to the requested channel", () => {
    const result = getChannelMessages(items, "#general");
    expect(result.map((i) => i.id)).toEqual(["b", "d"]);
  });

  it("INV-1: filters to #research correctly", () => {
    const result = getChannelMessages(items, "#research");
    expect(result.map((i) => i.id)).toEqual(["a"]);
  });

  it("INV-1: filters to #announcements using classification", () => {
    const result = getChannelMessages(items, "#announcements");
    expect(result.map((i) => i.id)).toEqual(["c"]);
  });

  it("INV-1: returns empty array for channel with no messages", () => {
    const result = getChannelMessages(items, "#ops");
    expect(result).toHaveLength(0);
  });

  it("INV-1: returns empty array for empty input", () => {
    expect(getChannelMessages([], "#general")).toHaveLength(0);
  });
});

describe("computeUnreadCounts (INV-2)", () => {
  const items: ContentItem[] = [
    makeItem({ id: "a", channel: "#research" }),
    makeItem({ id: "b", channel: "#research" }),
    makeItem({ id: "c", channel: "#general" }),
    makeItem({ id: "d", classification: "critical" }), // → #announcements
  ];

  it("INV-2: active channel has 0 unread regardless of messages", () => {
    const counts = computeUnreadCounts(items, new Set(), "#research");
    expect(counts["#research"]).toBe(0);
  });

  it("INV-2: unseen channels report their full message count", () => {
    const counts = computeUnreadCounts(items, new Set(["#general"]), "#general");
    // #research has 2 messages and is not seen
    expect(counts["#research"]).toBe(2);
    // #announcements has 1 message and is not seen
    expect(counts["#announcements"]).toBe(1);
    // #general is active, 0 unread
    expect(counts["#general"]).toBe(0);
  });

  it("INV-2: seen channels have 0 unread even when not active", () => {
    const counts = computeUnreadCounts(items, new Set(["#research"]), "#general");
    expect(counts["#research"]).toBe(0);
  });

  it("INV-2: all channels 0 when all seen", () => {
    const allSeen = new Set(SLACK_CHANNELS as unknown as string[]);
    const counts = computeUnreadCounts(items, allSeen, "#general");
    for (const ch of SLACK_CHANNELS) {
      expect(counts[ch]).toBe(0);
    }
  });

  it("INV-2: channels with no messages always have 0 unread", () => {
    const counts = computeUnreadCounts(items, new Set(), "#general");
    expect(counts["#alignment"]).toBe(0);
    expect(counts["#ops"]).toBe(0);
    expect(counts["#random"]).toBe(0);
  });
});

// ── computeUnreadCounts with team messages ───────────────────────────────────

function makeTeamMessage(id: string, channel: string | undefined): GameMessage {
  return {
    id,
    from: "player-1",
    fromName: "Alice",
    to: null,
    faction: "openbrain",
    content: "test",
    timestamp: Date.now(),
    isTeamChat: true,
    channel,
  };
}

describe("computeUnreadCounts with teamMessages", () => {
  it("counts team messages in unseen channels", () => {
    const teamMessages = [
      makeTeamMessage("t1", "#research"),
      makeTeamMessage("t2", "#research"),
      makeTeamMessage("t3", "#alignment"),
    ];
    const counts = computeUnreadCounts([], new Set(), "#general", teamMessages);
    expect(counts["#research"]).toBe(2);
    expect(counts["#alignment"]).toBe(1);
    expect(counts["#general"]).toBe(0); // active channel
  });

  it("team message without channel defaults to #general", () => {
    const teamMessages = [makeTeamMessage("t1", undefined)];
    // #general is not active, #research is active
    const counts = computeUnreadCounts([], new Set(), "#research", teamMessages);
    expect(counts["#general"]).toBe(1);
  });

  it("team messages in seen channels have 0 unread", () => {
    const teamMessages = [
      makeTeamMessage("t1", "#research"),
      makeTeamMessage("t2", "#research"),
    ];
    const counts = computeUnreadCounts([], new Set(["#research"]), "#general", teamMessages);
    expect(counts["#research"]).toBe(0);
  });

  it("combines content items and team messages for unread count", () => {
    const contentItems: ContentItem[] = [makeItem({ id: "c1", channel: "#research" })];
    const teamMessages = [makeTeamMessage("t1", "#research")];
    const counts = computeUnreadCounts(contentItems, new Set(), "#general", teamMessages);
    expect(counts["#research"]).toBe(2); // 1 content + 1 team
  });

  it("backward compatible: no teamMessages parameter gives same result as empty array", () => {
    const contentItems: ContentItem[] = [makeItem({ id: "c1", channel: "#research" })];
    const withEmpty = computeUnreadCounts(contentItems, new Set(), "#general", []);
    const withoutParam = computeUnreadCounts(contentItems, new Set(), "#general");
    expect(withoutParam).toEqual(withEmpty);
  });
});
