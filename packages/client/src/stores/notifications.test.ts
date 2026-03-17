/**
 * Tests for notifications store queue, visible cap, and dismiss logic.
 *
 * Invariants tested:
 * - INV-1: visible.length <= MAX_VISIBLE (3) regardless of queue size
 * - INV-2: Dismissing a visible notification promotes the next queued one (FIFO)
 * - INV-3: dismissByApp removes ALL matching appId from queue and visible, then promotes
 * - INV-4: Each notification gets a unique ID (even when added rapidly)
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { useNotificationsStore } from "./notifications.js";

const base = { appId: "test-app", title: "Title", body: "Body" };

function addN(n: number, appId = "test-app") {
  for (let i = 0; i < n; i++) {
    useNotificationsStore.getState().addNotification({ ...base, appId, title: `T${i}`, body: `B${i}` });
  }
}

beforeEach(() => {
  useNotificationsStore.setState({ queue: [], visible: [] });
});

describe("addNotification", () => {
  it("add 1 → queue=[1], visible=[1]", () => {
    useNotificationsStore.getState().addNotification(base);
    const { queue, visible } = useNotificationsStore.getState();
    expect(queue.length).toBe(1);
    expect(visible.length).toBe(1);
  });

  it("add 4 → queue=[4], visible=[3] (first 3 visible)", () => {
    addN(4);
    const { queue, visible } = useNotificationsStore.getState();
    expect(queue.length).toBe(4);
    expect(visible.length).toBe(3);
    // visible is the first 3 in queue order
    expect(visible[0]).toBe(queue[0]);
    expect(visible[1]).toBe(queue[1]);
    expect(visible[2]).toBe(queue[2]);
  });

  it("INV-1: visible never exceeds 3 after many additions", () => {
    addN(10);
    expect(useNotificationsStore.getState().visible.length).toBe(3);
  });

  it("onClick callback is preserved in queue and visible", () => {
    let called = false;
    const onClick = () => { called = true; };
    useNotificationsStore.getState().addNotification({ ...base, onClick });
    const { queue, visible } = useNotificationsStore.getState();
    expect(queue[0].onClick).toBe(onClick);
    expect(visible[0].onClick).toBe(onClick);
    queue[0].onClick!();
    expect(called).toBe(true);
  });

  it("INV-4: 10 rapid notifications all get distinct IDs", () => {
    addN(10);
    const ids = useNotificationsStore.getState().queue.map((n) => n.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });
});

describe("dismissNotification", () => {
  it("INV-2: dismissing 2nd visible promotes 4th from queue", () => {
    addN(4);
    const { queue } = useNotificationsStore.getState();
    const secondId = queue[1].id;
    const fourthId = queue[3].id;

    useNotificationsStore.getState().dismissNotification(secondId);

    const state = useNotificationsStore.getState();
    expect(state.queue.length).toBe(3);
    expect(state.visible.length).toBe(3);
    expect(state.visible.map((n) => n.id)).toContain(fourthId);
    expect(state.visible.map((n) => n.id)).not.toContain(secondId);
  });

  it("INV-2: dismissing 1st visible shifts 2nd and 3rd up and promotes 4th", () => {
    addN(4);
    const { queue } = useNotificationsStore.getState();
    const [first, second, third, fourth] = queue;

    useNotificationsStore.getState().dismissNotification(first.id);

    const state = useNotificationsStore.getState();
    expect(state.visible.map((n) => n.id)).toEqual([second.id, third.id, fourth.id]);
  });

  it("dismiss non-existent ID → no crash, state unchanged", () => {
    addN(2);
    const before = useNotificationsStore.getState().queue.length;
    expect(() => useNotificationsStore.getState().dismissNotification("nonexistent-id")).not.toThrow();
    expect(useNotificationsStore.getState().queue.length).toBe(before);
  });

  it("dismiss from empty store → no crash", () => {
    expect(() => useNotificationsStore.getState().dismissNotification("any-id")).not.toThrow();
    const { queue, visible } = useNotificationsStore.getState();
    expect(queue.length).toBe(0);
    expect(visible.length).toBe(0);
  });

  it("INV-1: visible stays ≤ 3 after dismiss when queue has extras", () => {
    addN(5);
    const firstId = useNotificationsStore.getState().queue[0].id;
    useNotificationsStore.getState().dismissNotification(firstId);
    expect(useNotificationsStore.getState().visible.length).toBe(3);
  });
});

describe("dismissByApp", () => {
  it("INV-3: removes all notifications matching appId from queue and visible", () => {
    useNotificationsStore.getState().addNotification({ appId: "app-a", title: "A1", body: "" });
    useNotificationsStore.getState().addNotification({ appId: "app-b", title: "B1", body: "" });
    useNotificationsStore.getState().addNotification({ appId: "app-a", title: "A2", body: "" });

    useNotificationsStore.getState().dismissByApp("app-a");

    const { queue, visible } = useNotificationsStore.getState();
    expect(queue.every((n) => n.appId !== "app-a")).toBe(true);
    expect(visible.every((n) => n.appId !== "app-a")).toBe(true);
    expect(queue.length).toBe(1);
    expect(visible.length).toBe(1);
  });

  it("INV-3: dismissByApp promotes from queue after removing visible entries", () => {
    // 3 visible from app-a, 1 queued from app-b
    useNotificationsStore.getState().addNotification({ appId: "app-a", title: "A1", body: "" });
    useNotificationsStore.getState().addNotification({ appId: "app-a", title: "A2", body: "" });
    useNotificationsStore.getState().addNotification({ appId: "app-a", title: "A3", body: "" });
    useNotificationsStore.getState().addNotification({ appId: "app-b", title: "B1", body: "" });

    const bId = useNotificationsStore.getState().queue[3].id;
    useNotificationsStore.getState().dismissByApp("app-a");

    const { queue, visible } = useNotificationsStore.getState();
    expect(queue.length).toBe(1);
    expect(visible.length).toBe(1);
    expect(visible[0].id).toBe(bId);
  });

  it("dismissByApp with no matching appId → no crash, state unchanged", () => {
    addN(2);
    const before = useNotificationsStore.getState().queue.length;
    expect(() => useNotificationsStore.getState().dismissByApp("no-such-app")).not.toThrow();
    expect(useNotificationsStore.getState().queue.length).toBe(before);
  });

  it("dismissByApp on empty store → no crash", () => {
    expect(() => useNotificationsStore.getState().dismissByApp("app-a")).not.toThrow();
  });

  it("INV-1: visible stays ≤ 3 after dismissByApp promotes from queue", () => {
    // 2 app-a visible, 1 app-b visible, 3 more app-c queued
    useNotificationsStore.getState().addNotification({ appId: "app-a", title: "A1", body: "" });
    useNotificationsStore.getState().addNotification({ appId: "app-a", title: "A2", body: "" });
    useNotificationsStore.getState().addNotification({ appId: "app-b", title: "B1", body: "" });
    addN(3, "app-c");

    useNotificationsStore.getState().dismissByApp("app-a");

    expect(useNotificationsStore.getState().visible.length).toBe(3);
  });
});
