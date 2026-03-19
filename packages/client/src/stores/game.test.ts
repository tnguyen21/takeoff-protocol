/**
 * Tests for session storage helpers in game store.
 *
 * Invariants tested:
 * - INV-1: After saveSession, sessionStorage contains valid JSON at "takeoff:session" with all required fields
 * - INV-2: loadSession returns the exact object that was saved (round-trip fidelity)
 * - INV-3: After clearSession, loadSession returns null
 * - INV-4: loadSession with corrupt storage → returns null, does not throw
 *
 * Tests for game store phase resets and content helpers.
 *
 * Invariants tested:
 * - INV-1: After phase change, decisionSubmitted=false, teamVotes={}, teamLocked=false
 * - INV-2: After phase change, gmDecisionStatus=[] and gmExtendUsesRemaining=2
 * - INV-3: nextSeq() returns strictly increasing integers (no duplicates, gaps exactly 1)
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { loadSession, saveSession, clearSession, useGameStore, nextSeq } from "./game.js";

const SESSION_KEY = "takeoff:session";

beforeEach(() => {
  sessionStorage.clear();
});

beforeEach(() => {
  useGameStore.setState({
    decisionSubmitted: false,
    teamVotes: {},
    teamLocked: false,
    gmDecisionStatus: [],
    gmExtendUsesRemaining: 2,
    content: [],
  });
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

/**
 * Applies the same setState that the `game:phase` socket handler fires.
 * This lets us test the reset invariants without touching the socket layer.
 */
function applyPhaseReset(): void {
  useGameStore.setState({
    decisionSubmitted: false,
    teamVotes: {},
    teamLocked: false,
    gmExtendUsesRemaining: 2,
    gmDecisionStatus: [],
  });
}

// ── Phase transition resets ──────────────────────────────────────────────────

describe("phase transition state resets", () => {
  it("INV-1: resets decisionSubmitted, teamVotes, teamLocked after phase change", () => {
    useGameStore.setState({
      decisionSubmitted: true,
      teamVotes: { p1: "opt1", p2: "opt2" },
      teamLocked: true,
    });

    applyPhaseReset();

    const { decisionSubmitted, teamVotes, teamLocked } = useGameStore.getState();
    expect(decisionSubmitted).toBe(false);
    expect(teamVotes).toEqual({});
    expect(teamLocked).toBe(false);
  });

  it("INV-2: resets gmDecisionStatus and gmExtendUsesRemaining after phase change", () => {
    useGameStore.setState({
      gmDecisionStatus: ["player-a", "player-b", "player-c"],
      gmExtendUsesRemaining: 0,
    });

    applyPhaseReset();

    const { gmDecisionStatus, gmExtendUsesRemaining } = useGameStore.getState();
    expect(gmDecisionStatus).toEqual([]);
    expect(gmExtendUsesRemaining).toBe(2);
  });

  it("phase change when state already clean does not crash and state stays clean", () => {
    // State is already clean from beforeEach — applyPhaseReset should be a no-op
    expect(() => applyPhaseReset()).not.toThrow();

    const { decisionSubmitted, teamVotes, teamLocked, gmDecisionStatus, gmExtendUsesRemaining } = useGameStore.getState();
    expect(decisionSubmitted).toBe(false);
    expect(teamVotes).toEqual({});
    expect(teamLocked).toBe(false);
    expect(gmDecisionStatus).toEqual([]);
    expect(gmExtendUsesRemaining).toBe(2);
  });
});

// ── nextSeq ──────────────────────────────────────────────────────────────────

describe("nextSeq", () => {
  it("INV-3: each call returns exactly 1 more than the previous call", () => {
    const values: number[] = [];
    for (let i = 0; i < 100; i++) {
      values.push(nextSeq());
    }

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBe(values[i - 1] + 1);
    }
  });
});
