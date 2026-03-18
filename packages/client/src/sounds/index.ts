import { useState, useEffect } from "react";
import {
  playNotificationChime,
  playPop,
  playTimerWarning,
  playPhaseTransition,
  playSlackKnock,
  playMessageSend,
} from "./synthesized.js";

const MUTE_KEY = "takeoff:muted";

type SoundName =
  | "notification-chime"
  | "pop"
  | "timer-warning"
  | "phase-transition"
  | "slack-knock"
  | "message-send";

const SOUND_MAP: Record<SoundName, (ctx: AudioContext) => void> = {
  "notification-chime": playNotificationChime,
  "pop": playPop,
  "timer-warning": playTimerWarning,
  "phase-transition": playPhaseTransition,
  "slack-knock": playSlackKnock,
  "message-send": playMessageSend,
};

function loadMuted(): boolean {
  try {
    const v = localStorage.getItem(MUTE_KEY);
    if (v === null) return true; // muted by default
    return v === "true";
  } catch {
    return true;
  }
}

// Module-level singletons — shared across React and store code
let _ctx: AudioContext | null = null;
let _muted = loadMuted();
const _subscribers = new Set<(muted: boolean) => void>();

function getCtx(): AudioContext | null {
  if (_muted) return null;
  if (!_ctx) {
    try {
      _ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browsers suspend AudioContext until user gesture)
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

/** Central sound manager — callable from React components and Zustand stores. */
export const soundManager = {
  get muted(): boolean {
    return _muted;
  },

  setMuted(v: boolean): void {
    _muted = v;
    try {
      localStorage.setItem(MUTE_KEY, String(v));
    } catch {
      // ignore
    }
    _subscribers.forEach((cb) => cb(v));
  },

  toggleMute(): void {
    this.setMuted(!_muted);
  },

  play(sound: SoundName): void {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      SOUND_MAP[sound](ctx);
    } catch {
      // Swallow audio errors (autoplay policy, missing codec, etc.)
    }
  },

  /** Subscribe to mute state changes. Returns an unsubscribe function. */
  subscribe(cb: (muted: boolean) => void): () => void {
    _subscribers.add(cb);
    return () => {
      _subscribers.delete(cb);
    };
  },
};

/** React hook that exposes mute state and toggle. */
export function useSoundEffects(): { muted: boolean; toggleMute: () => void } {
  const [muted, setMuted] = useState(_muted);

  useEffect(() => {
    return soundManager.subscribe(setMuted);
  }, []);

  return {
    muted,
    toggleMute: () => soundManager.toggleMute(),
  };
}
