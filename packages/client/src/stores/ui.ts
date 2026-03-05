import { create } from "zustand";
import { soundManager } from "../sounds/index.js";

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
  preMaximize?: { position: { x: number; y: number }; size: { width: number; height: number } };
}

interface UIStore {
  windows: WindowState[];
  topZ: number;
  openedThisRound: Set<string>; // appIds opened during the current round

  // Window actions
  openWindow: (appId: string, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  moveResizeWindow: (id: string, x: number, y: number, width: number, height: number) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  initWindows: (apps: { appId: string; title: string }[]) => void;
  resetRoundActivity: () => void;
}

const DEFAULT_SIZE = { width: 520, height: 400 };
const OFFSET_STEP = 30;
const MENUBAR_H = 28;
const DOCK_H = 64;
const MAX_VISIBLE_WINDOWS = 6;

export const useUIStore = create<UIStore>((set, get) => ({
  windows: [],
  topZ: 0,
  openedThisRound: new Set<string>(),

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
    let shouldPlay = false;
    set((s) => {
      const existing = s.windows.find((w) => w.id === appId);

      // Count currently visible (open + not minimized) windows, excluding the target window
      const visibleWindows = s.windows.filter((w) => w.isOpen && !w.isMinimized && w.id !== appId);

      // If opening this window would exceed the cap, auto-minimize the oldest visible window
      const isNewlyVisible = !existing || !existing.isOpen || existing.isMinimized;
      let updatedWindows = s.windows;

      if (isNewlyVisible && visibleWindows.length >= MAX_VISIBLE_WINDOWS) {
        const oldest = visibleWindows.reduce((a, b) => (a.zIndex < b.zIndex ? a : b));
        updatedWindows = updatedWindows.map((w) => (w.id === oldest.id ? { ...w, isMinimized: true } : w));
      }

      const newTopZ = s.topZ + 1;

      if (existing) {
        // Already exists — focus and unminimize
        updatedWindows = updatedWindows.map((w) =>
          w.id === appId ? { ...w, isOpen: true, isMinimized: false, zIndex: newTopZ } : w,
        );
      } else {
        // Create new
        const offset = s.windows.length * OFFSET_STEP;
        updatedWindows = [
          ...updatedWindows,
          {
            id: appId,
            appId,
            title,
            isOpen: true,
            position: { x: 80 + offset, y: 60 + offset },
            size: { ...DEFAULT_SIZE },
            zIndex: newTopZ,
            isMinimized: false,
            isMaximized: false,
          },
        ];
      }

      const updatedOpened = new Set(s.openedThisRound);
      updatedOpened.add(appId);
      shouldPlay = isNewlyVisible;
      return { topZ: newTopZ, windows: updatedWindows, openedThisRound: updatedOpened };
    });
    if (shouldPlay) soundManager.play("pop");
  },

  closeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, isOpen: false } : w)),
    })),

  focusWindow: (id) =>
    set((s) => {
      const newTopZ = s.topZ + 1;
      const updatedOpened = new Set(s.openedThisRound);
      updatedOpened.add(id); // id === appId in this codebase
      return {
        topZ: newTopZ,
        windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: newTopZ } : w)),
        openedThisRound: updatedOpened,
      };
    }),

  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position: { x, y } } : w)),
    })),

  resizeWindow: (id, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size: { width, height } } : w)),
    })),

  moveResizeWindow: (id, x, y, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position: { x, y }, size: { width, height } } : w)),
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              isMaximized: true,
              preMaximize: { position: { ...w.position }, size: { ...w.size } },
              position: { x: 0, y: 0 },
              size: { width: window.innerWidth, height: window.innerHeight - MENUBAR_H - DOCK_H },
            }
          : w,
      ),
    })),

  restoreWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              isMaximized: false,
              position: w.preMaximize ? { ...w.preMaximize.position } : { x: 80, y: 60 },
              size: w.preMaximize ? { ...w.preMaximize.size } : { ...DEFAULT_SIZE },
              preMaximize: undefined,
            }
          : w,
      ),
    })),

  resetRoundActivity: () => set({ openedThisRound: new Set<string>() }),
}));
