/**
 * Tests for UI store activity tracking and window management lifecycle.
 *
 * Invariants tested:
 * - INV-1: openedThisRound is populated when windows are opened/focused
 * - INV-2: initWindows creates windows with cascading positions and incremental zIndex
 * - INV-3: openWindow on closed window reopens it; new appId creates a new WindowState
 * - INV-4: openedThisRound resets on resetRoundActivity (round change)
 * - INV-5: focusWindow sets zIndex to topZ+1 monotonically
 * - INV-6: maximizeWindow saves preMaximize, sets position=(0,0), isMaximized=true
 * - INV-7: restoreWindow restores from preMaximize; falls back to defaults when missing
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

describe("initWindows — cascading layout", () => {
  it("INV-2: creates N windows with correct cascading positions", () => {
    const apps = [
      { appId: "app0", title: "App 0" },
      { appId: "app1", title: "App 1" },
      { appId: "app2", title: "App 2" },
    ];
    useUIStore.getState().initWindows(apps);
    const { windows } = useUIStore.getState();

    expect(windows).toHaveLength(3);
    expect(windows[0].position).toEqual({ x: 80, y: 60 });
    expect(windows[1].position).toEqual({ x: 110, y: 90 });
    expect(windows[2].position).toEqual({ x: 140, y: 120 });
  });

  it("INV-2: windows start closed and have incremental zIndex", () => {
    const apps = [
      { appId: "a", title: "A" },
      { appId: "b", title: "B" },
      { appId: "c", title: "C" },
    ];
    useUIStore.getState().initWindows(apps);
    const { windows, topZ } = useUIStore.getState();

    windows.forEach((w) => {
      expect(w.isOpen).toBe(false);
      expect(w.isMinimized).toBe(false);
      expect(w.isMaximized).toBe(false);
    });

    expect(windows[0].zIndex).toBe(0);
    expect(windows[1].zIndex).toBe(1);
    expect(windows[2].zIndex).toBe(2);
    expect(topZ).toBe(3);
  });

  it("INV-2: initWindows sets DEFAULT_SIZE on all windows", () => {
    useUIStore.getState().initWindows([{ appId: "x", title: "X" }]);
    const win = useUIStore.getState().windows[0];
    expect(win.size).toEqual({ width: 520, height: 400 });
  });
});

describe("openWindow / closeWindow lifecycle", () => {
  it("INV-3: opening an existing closed window reopens it with focus", () => {
    useUIStore.getState().initWindows([{ appId: "editor", title: "Editor" }]);
    // Window starts closed
    expect(useUIStore.getState().windows[0].isOpen).toBe(false);

    useUIStore.getState().openWindow("editor", "Editor");
    const win = useUIStore.getState().windows.find((w) => w.id === "editor")!;

    expect(win.isOpen).toBe(true);
    expect(win.isMinimized).toBe(false);
  });

  it("INV-3: opening a minimized window restores it", () => {
    useUIStore.getState().initWindows([{ appId: "term", title: "Terminal" }]);
    useUIStore.getState().openWindow("term", "Terminal");
    useUIStore.getState().minimizeWindow("term");
    expect(useUIStore.getState().windows.find((w) => w.id === "term")!.isMinimized).toBe(true);

    useUIStore.getState().openWindow("term", "Terminal");
    const win = useUIStore.getState().windows.find((w) => w.id === "term")!;
    expect(win.isOpen).toBe(true);
    expect(win.isMinimized).toBe(false);
  });

  it("INV-3: opening a new appId creates a new WindowState", () => {
    useUIStore.getState().initWindows([{ appId: "a", title: "A" }]);
    useUIStore.getState().openWindow("brand-new", "Brand New");

    const { windows } = useUIStore.getState();
    expect(windows).toHaveLength(2);
    const newWin = windows.find((w) => w.id === "brand-new")!;
    expect(newWin).toBeDefined();
    expect(newWin.isOpen).toBe(true);
    expect(newWin.appId).toBe("brand-new");
  });

  it("critical path: init 5 windows → open #3 (closed) → reopened with focus", () => {
    const apps = Array.from({ length: 5 }, (_, i) => ({ appId: `app${i}`, title: `App ${i}` }));
    useUIStore.getState().initWindows(apps);

    const topZBefore = useUIStore.getState().topZ;
    useUIStore.getState().openWindow("app2", "App 2");

    const win = useUIStore.getState().windows.find((w) => w.id === "app2")!;
    expect(win.isOpen).toBe(true);
    expect(win.isMinimized).toBe(false);
    expect(win.zIndex).toBe(topZBefore + 1);
  });

  it("closeWindow on already-closed window does not crash and leaves state unchanged", () => {
    useUIStore.getState().initWindows([{ appId: "x", title: "X" }]);
    const before = useUIStore.getState().windows[0];
    expect(before.isOpen).toBe(false);

    expect(() => useUIStore.getState().closeWindow("x")).not.toThrow();
    const after = useUIStore.getState().windows[0];
    expect(after.isOpen).toBe(false);
  });

  it("closeWindow on unknown id does not crash", () => {
    expect(() => useUIStore.getState().closeWindow("does-not-exist")).not.toThrow();
    expect(useUIStore.getState().windows).toHaveLength(0);
  });
});

describe("auto-minimize at MAX_VISIBLE_WINDOWS", () => {
  it("INV-3: opening a 7th window auto-minimizes the oldest visible one", () => {
    // Open 6 windows so MAX_VISIBLE_WINDOWS is reached
    for (let i = 0; i < 6; i++) {
      useUIStore.getState().openWindow(`app${i}`, `App ${i}`);
    }
    const { windows: before } = useUIStore.getState();
    const visibleBefore = before.filter((w) => w.isOpen && !w.isMinimized);
    expect(visibleBefore).toHaveLength(6);

    // The oldest visible window has the lowest zIndex among the 6
    const oldest = visibleBefore.reduce((a, b) => (a.zIndex < b.zIndex ? a : b));

    // Open a 7th window — should trigger auto-minimize
    useUIStore.getState().openWindow("app6", "App 6");

    const { windows: after } = useUIStore.getState();
    const minimized = after.find((w) => w.id === oldest.id)!;
    expect(minimized.isMinimized).toBe(true);

    // 7th window is open and visible
    const newWin = after.find((w) => w.id === "app6")!;
    expect(newWin.isOpen).toBe(true);
    expect(newWin.isMinimized).toBe(false);
  });

  it("critical path: open 7 windows sequentially → first is auto-minimized", () => {
    // Open them one by one — the first opened has the lowest zIndex
    for (let i = 0; i < 7; i++) {
      useUIStore.getState().openWindow(`seq${i}`, `Seq ${i}`);
    }

    const { windows } = useUIStore.getState();
    // seq0 was opened first, has the lowest zIndex among the visible set
    const seq0 = windows.find((w) => w.id === "seq0")!;
    expect(seq0.isMinimized).toBe(true);

    // seq6 (7th) is open and not minimized
    const seq6 = windows.find((w) => w.id === "seq6")!;
    expect(seq6.isOpen).toBe(true);
    expect(seq6.isMinimized).toBe(false);
  });
});

describe("focusWindow — z-index monotonicity", () => {
  it("INV-5: focusWindow sets zIndex to topZ+1 and increments topZ", () => {
    useUIStore.getState().initWindows([{ appId: "win", title: "Win" }]);
    const topZBefore = useUIStore.getState().topZ;

    useUIStore.getState().focusWindow("win");

    const { topZ, windows } = useUIStore.getState();
    expect(topZ).toBe(topZBefore + 1);
    expect(windows[0].zIndex).toBe(topZBefore + 1);
  });

  it("critical path: focus A, then B, then A → A has highest zIndex", () => {
    useUIStore.getState().initWindows([
      { appId: "winA", title: "A" },
      { appId: "winB", title: "B" },
    ]);

    useUIStore.getState().focusWindow("winA");
    useUIStore.getState().focusWindow("winB");
    useUIStore.getState().focusWindow("winA");

    const { windows } = useUIStore.getState();
    const a = windows.find((w) => w.id === "winA")!;
    const b = windows.find((w) => w.id === "winB")!;
    expect(a.zIndex).toBeGreaterThan(b.zIndex);
  });

  it("INV-5: topZ is strictly monotonic across multiple focus calls", () => {
    useUIStore.getState().initWindows([
      { appId: "p", title: "P" },
      { appId: "q", title: "Q" },
    ]);

    const z0 = useUIStore.getState().topZ;
    useUIStore.getState().focusWindow("p");
    const z1 = useUIStore.getState().topZ;
    useUIStore.getState().focusWindow("q");
    const z2 = useUIStore.getState().topZ;
    useUIStore.getState().focusWindow("p");
    const z3 = useUIStore.getState().topZ;

    expect(z1).toBeGreaterThan(z0);
    expect(z2).toBeGreaterThan(z1);
    expect(z3).toBeGreaterThan(z2);
  });
});

describe("moveWindow / resizeWindow", () => {
  it("moveWindow updates position correctly", () => {
    useUIStore.getState().initWindows([{ appId: "mv", title: "Mv" }]);
    useUIStore.getState().moveWindow("mv", 200, 300);
    const win = useUIStore.getState().windows[0];
    expect(win.position).toEqual({ x: 200, y: 300 });
  });

  it("resizeWindow updates size correctly", () => {
    useUIStore.getState().initWindows([{ appId: "rs", title: "Rs" }]);
    useUIStore.getState().resizeWindow("rs", 800, 600);
    const win = useUIStore.getState().windows[0];
    expect(win.size).toEqual({ width: 800, height: 600 });
  });

  it("moveWindow does not affect other windows", () => {
    useUIStore.getState().initWindows([
      { appId: "a", title: "A" },
      { appId: "b", title: "B" },
    ]);
    useUIStore.getState().moveWindow("a", 999, 888);
    const b = useUIStore.getState().windows.find((w) => w.id === "b")!;
    expect(b.position).toEqual({ x: 110, y: 90 });
  });
});

describe("maximizeWindow / restoreWindow", () => {
  it("INV-6: maximizeWindow saves preMaximize, sets position=(0,0), isMaximized=true", () => {
    useUIStore.getState().initWindows([{ appId: "mx", title: "Mx" }]);
    useUIStore.getState().moveWindow("mx", 150, 200);
    useUIStore.getState().resizeWindow("mx", 640, 480);

    useUIStore.getState().maximizeWindow("mx");

    const win = useUIStore.getState().windows[0];
    expect(win.isMaximized).toBe(true);
    expect(win.position).toEqual({ x: 0, y: 0 });
    expect(win.preMaximize).toEqual({
      position: { x: 150, y: 200 },
      size: { width: 640, height: 480 },
    });
  });

  it("INV-7: restoreWindow restores position and size from preMaximize", () => {
    useUIStore.getState().initWindows([{ appId: "rx", title: "Rx" }]);
    useUIStore.getState().moveWindow("rx", 150, 200);
    useUIStore.getState().resizeWindow("rx", 640, 480);

    useUIStore.getState().maximizeWindow("rx");
    useUIStore.getState().restoreWindow("rx");

    const win = useUIStore.getState().windows[0];
    expect(win.isMaximized).toBe(false);
    expect(win.position).toEqual({ x: 150, y: 200 });
    expect(win.size).toEqual({ width: 640, height: 480 });
    expect(win.preMaximize).toBeUndefined();
  });

  it("critical path: maximize → restore → position/size match original", () => {
    useUIStore.getState().initWindows([{ appId: "cycle", title: "Cycle" }]);
    const original = useUIStore.getState().windows[0];
    const origPos = { ...original.position };
    const origSize = { ...original.size };

    useUIStore.getState().maximizeWindow("cycle");
    expect(useUIStore.getState().windows[0].isMaximized).toBe(true);

    useUIStore.getState().restoreWindow("cycle");
    const restored = useUIStore.getState().windows[0];
    expect(restored.position).toEqual(origPos);
    expect(restored.size).toEqual(origSize);
    expect(restored.isMaximized).toBe(false);
  });

  it("INV-7: restoreWindow with no preMaximize falls back to default position and DEFAULT_SIZE", () => {
    useUIStore.getState().initWindows([{ appId: "nopre", title: "NoPre" }]);
    // No maximize call — preMaximize is undefined
    useUIStore.getState().restoreWindow("nopre");

    const win = useUIStore.getState().windows[0];
    expect(win.isMaximized).toBe(false);
    expect(win.position).toEqual({ x: 80, y: 60 });
    expect(win.size).toEqual({ width: 520, height: 400 });
    expect(win.preMaximize).toBeUndefined();
  });
});
