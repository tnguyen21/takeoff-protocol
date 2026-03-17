/**
 * Tests for session storage helpers in game store.
 *
 * Invariants tested:
 * - INV-1: After saveSession, sessionStorage contains valid JSON at "takeoff:session" with all required fields
 * - INV-2: loadSession returns the exact object that was saved (round-trip fidelity)
 * - INV-3: After clearSession, loadSession returns null
 * - INV-4: loadSession with corrupt storage → returns null, does not throw
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { loadSession, saveSession, clearSession } from "./game.js";

const SESSION_KEY = "takeoff:session";

beforeEach(() => {
  sessionStorage.clear();
});

describe("loadSession / saveSession / clearSession", () => {
  it("INV-1+2: save → load round-trip preserves all fields", () => {
    const data = { roomCode: "ABCD", playerName: "Alice", playerId: "socket-123", isGM: false };
    saveSession(data);
    expect(loadSession()).toEqual(data);
  });

  it("INV-1: saveSession writes valid JSON at SESSION_KEY", () => {
    saveSession({ roomCode: "XY99", playerName: "Bob", playerId: "sock-456", isGM: true });
    const raw = sessionStorage.getItem(SESSION_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.roomCode).toBe("XY99");
    expect(parsed.playerName).toBe("Bob");
    expect(parsed.playerId).toBe("sock-456");
    expect(parsed.isGM).toBe(true);
  });

  it("INV-2: isGM=true survives round-trip without coercion", () => {
    saveSession({ roomCode: "GM01", playerName: "GameMaster", playerId: "gm-sock", isGM: true });
    expect(loadSession()?.isGM).toBe(true);
  });

  it("INV-3: clearSession → loadSession returns null", () => {
    saveSession({ roomCode: "ABCD", playerName: "Alice", playerId: "socket-123", isGM: false });
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it("INV-3: clearSession removes the key from sessionStorage", () => {
    saveSession({ roomCode: "ABCD", playerName: "Alice", playerId: "socket-123", isGM: false });
    clearSession();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("fresh state: loadSession returns null when nothing has been saved", () => {
    expect(loadSession()).toBeNull();
  });

  it("INV-4: loadSession with corrupt JSON returns null without throwing", () => {
    sessionStorage.setItem(SESSION_KEY, "not-valid-json{{{");
    expect(() => loadSession()).not.toThrow();
    expect(loadSession()).toBeNull();
  });

  it('INV-4: loadSession with "undefined" string returns null', () => {
    sessionStorage.setItem(SESSION_KEY, "undefined");
    expect(loadSession()).toBeNull();
  });

  it("INV-4: loadSession with empty string returns null (JSON.parse throws)", () => {
    sessionStorage.setItem(SESSION_KEY, "");
    // empty string is falsy → loadSession returns null without even parsing
    expect(loadSession()).toBeNull();
  });

  it("saveSession does not throw when sessionStorage.setItem throws", () => {
    const orig = sessionStorage.setItem.bind(sessionStorage);
    sessionStorage.setItem = () => { throw new Error("QuotaExceededError"); };
    expect(() =>
      saveSession({ roomCode: "ABCD", playerName: "Alice", playerId: "s1", isGM: false })
    ).not.toThrow();
    sessionStorage.setItem = orig;
  });

  it("clearSession does not throw on empty sessionStorage", () => {
    expect(() => clearSession()).not.toThrow();
    expect(loadSession()).toBeNull();
  });
});
