/**
 * Tests for PublishNotificationBanner auto-dismiss timer logic.
 *
 * Invariants tested:
 * - INV-1: Each notification's setTimeout delay reflects elapsed time since creation.
 *          A notification that is already 2s old gets a 4s timer, not a fresh 6s timer.
 * - INV-2: When one notification is removed from state (dismissed), the timer for
 *          remaining notifications is not reset to 6000ms — it continues from the
 *          notification's original timestamp.
 *
 * Design note (confirmed here):
 *   timestamp is set on the SERVER and embedded in GameNotification. Zustand's
 *   dismissNotification uses filter() which creates a new array but keeps the same
 *   object references — so notif.timestamp is stable across effect reruns. The
 *   elapsed-based calculation (6000 - (Date.now() - notif.timestamp)) is therefore
 *   correct without any useRef tracking.
 *
 * Failure modes covered:
 * - Multiple notifications created at different times: each fires on its own independent timer
 * - Over-elapsed notification (>6s old): clamped to 0ms, fires immediately
 */

import { describe, expect, it, afterEach, mock, spyOn } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { useGameStore } from "../stores/game.js";

// ── Module mocks ─────────────────────────────────────────────────────────────
// Must be declared before any imports that transitively load these modules.

mock.module("../socket.js", () => ({
  socket: {
    id: "mock-socket-id",
    connected: false,
    on: () => {},
    once: () => {},
    off: () => {},
    emit: () => {},
    connect: () => {},
    disconnect: () => {},
  },
}));

mock.module("../sounds/index.js", () => ({
  soundManager: {
    play: mock(() => {}),
    muted: true,
    setMuted: () => {},
    toggleMute: () => {},
    subscribe: () => () => {},
  },
  useSoundEffects: () => ({ muted: true, toggleMute: () => {} }),
}));

// Import after mocks are registered
const { PublishNotificationBanner } = await import("./PublishNotificationBanner.js");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE = 1_000_000;

/** Build a GameNotification with an absolute timestamp. */
function notif(id: string, timestamp: number, summary = `Summary ${id}`) {
  return { id, summary, from: "system", timestamp };
}

// ── Teardown ──────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  useGameStore.setState({ notifications: [] });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PublishNotificationBanner — rendering", () => {
  it("renders nothing when there are no notifications", () => {
    useGameStore.setState({ notifications: [] });
    const { container } = render(<PublishNotificationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders notification summary and source", () => {
    useGameStore.setState({ notifications: [notif("n1", BASE, "AI achieves sentience")] });
    render(<PublishNotificationBanner />);
    expect(screen.getByText("AI achieves sentience")).toBeTruthy();
    expect(screen.getByText("via system")).toBeTruthy();
  });

  it("caps display at 3 notifications even when more exist", () => {
    const five = ["a", "b", "c", "d", "e"].map((id) => notif(id, BASE));
    useGameStore.setState({ notifications: five });
    render(<PublishNotificationBanner />);
    // Each notification renders "via system" — there should be exactly 3
    expect(screen.getAllByText("via system")).toHaveLength(3);
  });
});

describe("PublishNotificationBanner — timer delay (INV-1)", () => {
  it("INV-1: brand-new notification gets a 6000ms timer", () => {
    const dateNowSpy = spyOn(Date, "now").mockReturnValue(BASE);
    const setTimeoutSpy = spyOn(globalThis, "setTimeout");

    useGameStore.setState({ notifications: [notif("n1", BASE)] }); // 0ms elapsed
    render(<PublishNotificationBanner />);

    const delays = setTimeoutSpy.mock.calls.map((args) => args[1] as number);
    expect(delays).toContain(6000);

    dateNowSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it("INV-1: notification 2000ms old gets a 4000ms timer", () => {
    // Notification created at BASE, rendered at BASE+2000 → remaining = 4000ms
    const dateNowSpy = spyOn(Date, "now").mockReturnValue(BASE + 2000);
    const setTimeoutSpy = spyOn(globalThis, "setTimeout");

    useGameStore.setState({ notifications: [notif("n1", BASE)] });
    render(<PublishNotificationBanner />);

    const delays = setTimeoutSpy.mock.calls.map((args) => args[1] as number);
    expect(delays).toContain(4000);

    dateNowSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it("INV-1: over-elapsed notification (>6s old) gets a 0ms timer, not a negative delay", () => {
    // Notification is 8000ms old → remaining = max(0, -2000) = 0ms
    const dateNowSpy = spyOn(Date, "now").mockReturnValue(BASE + 8000);
    const setTimeoutSpy = spyOn(globalThis, "setTimeout");

    useGameStore.setState({ notifications: [notif("n1", BASE)] });
    render(<PublishNotificationBanner />);

    const delays = setTimeoutSpy.mock.calls.map((args) => args[1] as number);
    expect(delays).toContain(0);
    // No negative delays — Math.max(0, ...) guards this
    expect(delays.every((d) => d >= 0)).toBe(true);

    dateNowSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it("INV-1: two notifications with different ages get independent timers", () => {
    // A: created 1000ms ago → 5000ms remaining
    // B: created 3000ms ago → 3000ms remaining
    const dateNowSpy = spyOn(Date, "now").mockReturnValue(BASE);
    const setTimeoutSpy = spyOn(globalThis, "setTimeout");

    useGameStore.setState({
      notifications: [
        notif("a", BASE - 1000), // 1000ms elapsed
        notif("b", BASE - 3000), // 3000ms elapsed
      ],
    });
    render(<PublishNotificationBanner />);

    const delays = setTimeoutSpy.mock.calls.map((args) => args[1] as number);
    expect(delays).toContain(5000); // A: 6000 - 1000
    expect(delays).toContain(3000); // B: 6000 - 3000

    dateNowSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });
});

describe("PublishNotificationBanner — timer independence (INV-2)", () => {
  it("INV-2: timer for remaining notification uses its original timestamp after sibling is dismissed", async () => {
    // This test catches the regression where dismissing one notification causes the
    // effect to rerun and reset ALL remaining timers to a fresh 6000ms.
    //
    // Scenario:
    //   - Notification A was created at BASE+0 and dismissed 6s later.
    //   - Notification B was created at BASE+2000 (2s after A).
    //   - When the component re-renders at BASE+6000 (after A is gone), B is 4000ms old.
    //   - Correct:    remaining = 6000 - 4000 = 2000ms
    //   - Regression: timestamp reset → remaining = 6000ms
    //
    // We test the post-dismiss state directly: render with only B in state at BASE+6000.

    const dateNowSpy = spyOn(Date, "now").mockReturnValue(BASE + 6000);
    const setTimeoutSpy = spyOn(globalThis, "setTimeout");

    // B: timestamp = BASE+2000, rendered at BASE+6000 → elapsed = 4000ms → remaining = 2000ms
    useGameStore.setState({ notifications: [notif("b", BASE + 2000)] });
    render(<PublishNotificationBanner />);

    const delays = setTimeoutSpy.mock.calls.map((args) => args[1] as number);
    expect(delays).toContain(2000); // correct remaining time
    // The regression: this must NOT be 6000ms (timestamp-reset bug)
    expect(delays.every((d) => d !== 6000)).toBe(true);

    dateNowSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it("INV-2: dismissNotification is called with the correct notification id when timer fires", async () => {
    // Verify the callback registered with setTimeout closes over the correct id.
    // This catches a stale-closure regression where all timers call dismiss on the
    // same (last) notification id.
    const dismissNotification = mock((id: string) => {
      // Real dismiss: filter out the notification so state updates correctly
      useGameStore.setState((s) => ({
        notifications: s.notifications.filter((n) => n.id !== id),
      }));
    });

    const dateNowSpy = spyOn(Date, "now").mockReturnValue(BASE);

    // Collect the actual dismiss callbacks registered with setTimeout
    const registeredCallbacks: Array<() => void> = [];
    const setTimeoutSpy = spyOn(globalThis, "setTimeout").mockImplementation(((fn: TimerHandler) => {
      registeredCallbacks.push(fn as () => void);
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout);

    useGameStore.setState({
      notifications: [notif("id-alpha", BASE - 0), notif("id-beta", BASE - 500)],
      dismissNotification,
    });
    render(<PublishNotificationBanner />);

    // Two timers should have been registered (one per notification)
    expect(registeredCallbacks.length).toBe(2);

    // Fire both callbacks — each should call dismiss with its own id
    for (const cb of registeredCallbacks) cb();

    expect(dismissNotification).toHaveBeenCalledWith("id-alpha");
    expect(dismissNotification).toHaveBeenCalledWith("id-beta");

    dateNowSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });
});
