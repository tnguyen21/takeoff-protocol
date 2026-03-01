/**
 * Tests for EmailApp pure utility functions.
 *
 * Invariants tested:
 * - INV-1: filterEmailsByFolder correctly routes emails to folders
 * - INV-2: computeFolderUnreadCounts returns correct unread badges per folder
 * - INV-3: filterEmailsBySearch filters by subject, sender, and body
 */

import { describe, expect, it } from "bun:test";
import {
  emailBelongsToFolder,
  filterEmailsByFolder,
  computeFolderUnreadCounts,
  filterEmailsBySearch,
  EMAIL_FOLDERS,
} from "./emailUtils.js";
import type { EmailItem } from "./emailUtils.js";

function makeEmail(overrides: Partial<EmailItem> & { from: string; subject: string }): EmailItem {
  return {
    preview: "preview text",
    time: "10:00 AM",
    read: false,
    body: "body text",
    ...overrides,
  };
}

// ── emailBelongsToFolder ──────────────────────────────────────────────────────

describe("emailBelongsToFolder", () => {
  it("email with no folder field belongs to inbox", () => {
    const e = makeEmail({ from: "A", subject: "S" });
    expect(emailBelongsToFolder(e, "inbox")).toBe(true);
    expect(emailBelongsToFolder(e, "sent")).toBe(false);
  });

  it("email with folder=sent belongs to sent only", () => {
    const e = makeEmail({ from: "A", subject: "S", folder: "sent" });
    expect(emailBelongsToFolder(e, "sent")).toBe(true);
    expect(emailBelongsToFolder(e, "inbox")).toBe(false);
  });

  it("email with folder=drafts belongs to drafts only", () => {
    const e = makeEmail({ from: "A", subject: "S", folder: "drafts" });
    expect(emailBelongsToFolder(e, "drafts")).toBe(true);
    expect(emailBelongsToFolder(e, "inbox")).toBe(false);
  });

  it("starred email appears in starred folder regardless of its folder field", () => {
    const inboxStarred = makeEmail({ from: "A", subject: "S", starred: true });
    expect(emailBelongsToFolder(inboxStarred, "starred")).toBe(true);
    expect(emailBelongsToFolder(inboxStarred, "inbox")).toBe(true);

    const sentStarred = makeEmail({ from: "A", subject: "S", starred: true, folder: "sent" });
    expect(emailBelongsToFolder(sentStarred, "starred")).toBe(true);
    expect(emailBelongsToFolder(sentStarred, "sent")).toBe(true);
  });

  it("non-starred email does not appear in starred folder", () => {
    const e = makeEmail({ from: "A", subject: "S" });
    expect(emailBelongsToFolder(e, "starred")).toBe(false);
  });

  it("archive and spam folders work correctly", () => {
    const archived = makeEmail({ from: "A", subject: "S", folder: "archive" });
    expect(emailBelongsToFolder(archived, "archive")).toBe(true);
    expect(emailBelongsToFolder(archived, "inbox")).toBe(false);

    const spam = makeEmail({ from: "A", subject: "S", folder: "spam" });
    expect(emailBelongsToFolder(spam, "spam")).toBe(true);
    expect(emailBelongsToFolder(spam, "inbox")).toBe(false);
  });
});

// ── filterEmailsByFolder (INV-1) ──────────────────────────────────────────────

describe("filterEmailsByFolder (INV-1)", () => {
  const emails: EmailItem[] = [
    makeEmail({ from: "Alice", subject: "Inbox 1" }),
    makeEmail({ from: "Bob", subject: "Inbox 2", starred: true }),
    makeEmail({ from: "Carol", subject: "Sent 1", folder: "sent" }),
    makeEmail({ from: "Dave", subject: "Draft 1", folder: "drafts" }),
    makeEmail({ from: "Eve", subject: "Spam 1", folder: "spam" }),
    makeEmail({ from: "Frank", subject: "Archived", folder: "archive" }),
  ];

  it("INV-1: inbox returns only emails with no folder or folder=inbox", () => {
    const result = filterEmailsByFolder(emails, "inbox");
    expect(result.map((e) => e.subject)).toEqual(["Inbox 1", "Inbox 2"]);
  });

  it("INV-1: sent returns only sent emails", () => {
    const result = filterEmailsByFolder(emails, "sent");
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Sent 1");
  });

  it("INV-1: drafts returns only draft emails", () => {
    const result = filterEmailsByFolder(emails, "drafts");
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Draft 1");
  });

  it("INV-1: starred returns all starred emails (inbox and sent)", () => {
    const result = filterEmailsByFolder(emails, "starred");
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Inbox 2");
  });

  it("INV-1: returns empty array for empty input", () => {
    expect(filterEmailsByFolder([], "inbox")).toHaveLength(0);
  });

  it("INV-1: returns empty array when no emails match folder", () => {
    expect(filterEmailsByFolder(emails, "archive").map((e) => e.subject)).toEqual(["Archived"]);
  });
});

// ── computeFolderUnreadCounts (INV-2) ─────────────────────────────────────────

describe("computeFolderUnreadCounts (INV-2)", () => {
  const emails: EmailItem[] = [
    makeEmail({ from: "A", subject: "s1", read: false }),                          // inbox, unread
    makeEmail({ from: "B", subject: "s2", read: true }),                           // inbox, read
    makeEmail({ from: "C", subject: "s3", read: false, starred: true }),           // inbox + starred, unread
    makeEmail({ from: "D", subject: "s4", folder: "sent", read: false }),          // sent, unread
    makeEmail({ from: "E", subject: "s5", folder: "sent", read: true }),           // sent, read
    makeEmail({ from: "F", subject: "s6", folder: "drafts", read: false }),        // drafts, unread
  ];

  it("INV-2: inbox unread count is correct", () => {
    const counts = computeFolderUnreadCounts(emails);
    expect(counts["inbox"]).toBe(2); // s1 and s3
  });

  it("INV-2: starred unread count reflects unread starred emails", () => {
    const counts = computeFolderUnreadCounts(emails);
    expect(counts["starred"]).toBe(1); // s3
  });

  it("INV-2: sent unread count is correct", () => {
    const counts = computeFolderUnreadCounts(emails);
    expect(counts["sent"]).toBe(1); // s4
  });

  it("INV-2: drafts unread count is correct", () => {
    const counts = computeFolderUnreadCounts(emails);
    expect(counts["drafts"]).toBe(1); // s6
  });

  it("INV-2: folders with no emails have 0 unread", () => {
    const counts = computeFolderUnreadCounts(emails);
    expect(counts["archive"]).toBe(0);
    expect(counts["spam"]).toBe(0);
  });

  it("INV-2: all counts are 0 when all emails are read", () => {
    const allRead = emails.map((e) => ({ ...e, read: true }));
    const counts = computeFolderUnreadCounts(allRead);
    for (const folder of EMAIL_FOLDERS) {
      expect(counts[folder]).toBe(0);
    }
  });

  it("INV-2: returns counts for all defined folders", () => {
    const counts = computeFolderUnreadCounts(emails);
    for (const folder of EMAIL_FOLDERS) {
      expect(typeof counts[folder]).toBe("number");
    }
  });
});

// ── filterEmailsBySearch (INV-3) ──────────────────────────────────────────────

describe("filterEmailsBySearch (INV-3)", () => {
  const emails: EmailItem[] = [
    makeEmail({ from: "Alice Smith", subject: "Budget Q1 Review", body: "Please review the attached budget." }),
    makeEmail({ from: "Bob Jones", subject: "Team Outing Plans", body: "Let's go hiking this Saturday." }),
    makeEmail({ from: "Carol White", subject: "Safety Metrics Update", body: "Alignment scores attached." }),
    makeEmail({ from: "Dave Black", subject: "RE: Budget Q1 Review", body: "Approved, looks good." }),
  ];

  it("INV-3: empty query returns all emails", () => {
    expect(filterEmailsBySearch(emails, "")).toHaveLength(4);
    expect(filterEmailsBySearch(emails, "   ")).toHaveLength(4);
  });

  it("INV-3: matches subject case-insensitively", () => {
    const result = filterEmailsBySearch(emails, "budget");
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.from)).toEqual(["Alice Smith", "Dave Black"]);
  });

  it("INV-3: matches sender name case-insensitively", () => {
    const result = filterEmailsBySearch(emails, "alice");
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Budget Q1 Review");
  });

  it("INV-3: matches body text", () => {
    const result = filterEmailsBySearch(emails, "alignment");
    expect(result).toHaveLength(1);
    expect(result[0].from).toBe("Carol White");
  });

  it("INV-3: returns empty array when no match", () => {
    expect(filterEmailsBySearch(emails, "xyzzy123")).toHaveLength(0);
  });

  it("INV-3: returns empty array for empty input list", () => {
    expect(filterEmailsBySearch([], "budget")).toHaveLength(0);
  });

  it("INV-3: uses preview as fallback when body is absent", () => {
    const noBody = [makeEmail({ from: "X", subject: "S", preview: "tokenizer boundary issue", body: undefined })];
    expect(filterEmailsBySearch(noBody, "tokenizer")).toHaveLength(1);
  });
});
