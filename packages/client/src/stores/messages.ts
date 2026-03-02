import { create } from "zustand";
import type { GameMessage } from "@takeoff/shared";
import { socket } from "../socket.js";
import { useNotificationsStore } from "./notifications.js";
import { useUIStore } from "./ui.js";
import { soundManager } from "../sounds/index.js";

interface MessagesStore {
  messages: GameMessage[];
  unreadCounts: Record<string, number>; // appId → count

  markRead: (appId: string) => void;
}

export const useMessagesStore = create<MessagesStore>((set) => ({
  messages: [],
  unreadCounts: {},

  markRead: (appId) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [appId]: 0 },
    })),
}));

// Replay all messages on reconnect — replace the whole list (no duplicates)
socket.on("message:history", ({ messages }: { messages: GameMessage[] }) => {
  useMessagesStore.setState({ messages, unreadCounts: {} });
});

socket.on("message:receive", (message: GameMessage) => {
  const appId = message.isTeamChat ? "slack" : "signal";
  useMessagesStore.setState((s) => {
    // Skip if we already have this message (deduplication)
    if (s.messages.some((m) => m.id === message.id)) {
      return s; // No change
    }
    return {
      messages: [...s.messages, message],
      unreadCounts: {
        ...s.unreadCounts,
        [appId]: (s.unreadCounts[appId] ?? 0) + 1,
      },
    };
  });

  soundManager.play("slack-knock");

  // Notify only if that app window is not currently focused (open + not minimized)
  const windows = useUIStore.getState().windows;
  const win = windows.find((w) => w.id === appId);
  const isFocused = win ? win.isOpen && !win.isMinimized : false;

  if (!isFocused) {
    const appLabel = appId === "slack" ? "Slack" : "Signal";
    const sender = message.fromName ?? "Unknown";
    const body = message.content ? (message.content.length > 80 ? message.content.slice(0, 80) + "…" : message.content) : "";
    useNotificationsStore.getState().addNotification({
      appId,
      title: `${appLabel}: ${sender}`,
      body,
      onClick: () => {
        useUIStore.getState().openWindow(appId, appLabel);
        useMessagesStore.getState().markRead(appId);
      },
    });
  }
});
