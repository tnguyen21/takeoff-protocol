import { create } from "zustand";
import type { GameMessage } from "@takeoff/shared";
import { socket } from "../socket.js";

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

socket.on("message:receive", (message: GameMessage) => {
  const appId = message.isTeamChat ? "slack" : "signal";
  useMessagesStore.setState((s) => ({
    messages: [...s.messages, message],
    unreadCounts: {
      ...s.unreadCounts,
      [appId]: (s.unreadCounts[appId] ?? 0) + 1,
    },
  }));
});
