import { create } from "zustand";

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  isOpen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

interface UIStore {
  windows: WindowState[];
  topZ: number;
  notifications: Notification[];

  // Window actions
  openWindow: (appId: string, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  initWindows: (apps: { appId: string; title: string }[]) => void;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  appId: string;
  timestamp: number;
}

const DEFAULT_SIZE = { width: 520, height: 400 };
const OFFSET_STEP = 30;

export const useUIStore = create<UIStore>((set, get) => ({
  windows: [],
  topZ: 0,
  notifications: [],

  initWindows: (apps) => {
    const windows: WindowState[] = apps.map((app, i) => ({
      id: app.appId,
      appId: app.appId,
      title: app.title,
      isOpen: false,
      position: { x: 80 + i * OFFSET_STEP, y: 60 + i * OFFSET_STEP },
      size: { ...DEFAULT_SIZE },
      zIndex: i,
      isMinimized: false,
      isMaximized: false,
    }));
    set({ windows, topZ: apps.length });
  },

  openWindow: (appId, title) => {
    const { windows, topZ } = get();
    const existing = windows.find((w) => w.id === appId);

    if (existing) {
      // Already exists — focus and unminimize
      set({
        topZ: topZ + 1,
        windows: windows.map((w) =>
          w.id === appId ? { ...w, isOpen: true, isMinimized: false, zIndex: topZ + 1 } : w,
        ),
      });
    } else {
      // Create new
      const offset = windows.length * OFFSET_STEP;
      set({
        topZ: topZ + 1,
        windows: [
          ...windows,
          {
            id: appId,
            appId,
            title,
            isOpen: true,
            position: { x: 80 + offset, y: 60 + offset },
            size: { ...DEFAULT_SIZE },
            zIndex: topZ + 1,
            isMinimized: false,
            isMaximized: false,
          },
        ],
      });
    }
  },

  closeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, isOpen: false } : w)),
    })),

  focusWindow: (id) => {
    const { topZ } = get();
    set({
      topZ: topZ + 1,
      windows: get().windows.map((w) => (w.id === id ? { ...w, zIndex: topZ + 1 } : w)),
    });
  },

  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position: { x, y } } : w)),
    })),

  resizeWindow: (id, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size: { width, height } } : w)),
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: true, position: { x: 0, y: 28 }, size: { width: window.innerWidth, height: window.innerHeight - 28 - 64 } } : w,
      ),
    })),

  restoreWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: false, position: { x: 80, y: 60 }, size: { ...DEFAULT_SIZE } } : w,
      ),
    })),
}));
