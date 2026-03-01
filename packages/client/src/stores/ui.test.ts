/**
 * Tests for UI store activity tracking.
 *
 * Invariants tested:
 * - INV-1: openedThisRound is populated when windows are opened/focused
 * - INV-4: openedThisRound resets on resetRoundActivity (round change)
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { useUIStore } from "./ui.js";

// Reset store state before each test
beforeEach(() => {
  useUIStore.setState({
    windows: [],
    topZ: 0,
    openedThisRound: new Set<string>(),
  });
});

describe("openedThisRound tracking", () => {
  it("INV-1: openWindow adds appId to openedThisRound", () => {
    useUIStore.getState().openWindow("slack", "Slack");
    expect(useUIStore.getState().openedThisRound.has("slack")).toBe(true);
  });

  it("INV-1: opening multiple apps accumulates in openedThisRound", () => {
    useUIStore.getState().openWindow("slack", "Slack");
    useUIStore.getState().openWindow("wandb", "W&B");
    const opened = useUIStore.getState().openedThisRound;
    expect(opened.has("slack")).toBe(true);
    expect(opened.has("wandb")).toBe(true);
  });

  it("INV-1: re-opening same app does not duplicate — set semantics", () => {
    useUIStore.getState().openWindow("slack", "Slack");
    useUIStore.getState().openWindow("slack", "Slack");
    expect(useUIStore.getState().openedThisRound.size).toBe(1);
  });

  it("INV-1: focusWindow adds appId to openedThisRound", () => {
    // Create window first via initWindows
    useUIStore.getState().initWindows([{ appId: "email", title: "Email" }]);
    useUIStore.getState().focusWindow("email");
    expect(useUIStore.getState().openedThisRound.has("email")).toBe(true);
  });

  it("INV-4: resetRoundActivity clears openedThisRound", () => {
    useUIStore.getState().openWindow("slack", "Slack");
    useUIStore.getState().openWindow("wandb", "W&B");
    expect(useUIStore.getState().openedThisRound.size).toBe(2);

    useUIStore.getState().resetRoundActivity();
    expect(useUIStore.getState().openedThisRound.size).toBe(0);
  });

  it("INV-4: after reset, newly opened apps are tracked fresh", () => {
    useUIStore.getState().openWindow("slack", "Slack");
    useUIStore.getState().resetRoundActivity();

    // slack was opened before reset — not in new round's set
    expect(useUIStore.getState().openedThisRound.has("slack")).toBe(false);

    useUIStore.getState().openWindow("wandb", "W&B");
    expect(useUIStore.getState().openedThisRound.has("wandb")).toBe(true);
    expect(useUIStore.getState().openedThisRound.has("slack")).toBe(false);
  });

  it("INV-4: resetRoundActivity on empty set does not throw", () => {
    expect(() => useUIStore.getState().resetRoundActivity()).not.toThrow();
    expect(useUIStore.getState().openedThisRound.size).toBe(0);
  });
});
