import { create } from "zustand";

export interface ToastNotification {
  id: string;
  appId: string;
  title: string;
  body: string;
  timestamp: number;
  onClick?: () => void;
}

interface NotificationsStore {
  queue: ToastNotification[]; // all pending + visible
  visible: ToastNotification[]; // up to 3 shown at once

  addNotification: (n: Omit<ToastNotification, "id" | "timestamp">) => void;
  dismissNotification: (id: string) => void;
  dismissByApp: (appId: string) => void;
}

const MAX_VISIBLE = 3;

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  queue: [],
  visible: [],

  addNotification: (n) => {
    const notification: ToastNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };

    set((s) => {
      const newQueue = [...s.queue, notification];
      const newVisible = newQueue.slice(0, MAX_VISIBLE);
      return { queue: newQueue, visible: newVisible };
    });
  },

  dismissNotification: (id) => {
    set((s) => {
      const newQueue = s.queue.filter((n) => n.id !== id);
      const newVisible = newQueue.slice(0, MAX_VISIBLE);
      return { queue: newQueue, visible: newVisible };
    });
  },

  dismissByApp: (appId) => {
    set((s) => {
      const newQueue = s.queue.filter((n) => n.appId !== appId);
      const newVisible = newQueue.slice(0, MAX_VISIBLE);
      return { queue: newQueue, visible: newVisible };
    });
  },
}));
