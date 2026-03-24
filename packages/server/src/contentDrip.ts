/**
 * Content drip scheduler — trickles content items to players over the
 * first 75% of the intel phase instead of dumping everything at once.
 */
import type { Server } from "socket.io";
import type { AppContent, ContentItem, Faction, GameRoom } from "@takeoff/shared";
import { getGeneratedContent, getGeneratedSharedContent } from "./generation/cache.js";
import { emitContentBatch, emitHistoricalContent, getPhaseDuration } from "./game.js";
import { getRoom } from "./rooms.js";

const ALL_FACTIONS: Faction[] = ["openbrain", "prometheus", "china", "external"];
const DRIP_WINDOW_RATIO = 0.75;
const WAVE_INTERVAL_MS = 30_000;
const INITIAL_BATCH_RATIO = 0.7;

interface DripState {
  round: number;
  /** Item IDs already emitted (for dedup) */
  emittedIds: Set<string>;
  /** Pre-planned waves: waveIndex → faction → AppContent[] */
  waves: Map<number, Map<Faction, AppContent[]>>;
  /** Late-arriving content waiting for next wave */
  pending: Map<Faction, AppContent[]>;
  waveTimer: ReturnType<typeof setTimeout> | null;
  nextWaveIndex: number;
  totalWaves: number;
  /** Absolute timestamps for each wave */
  waveTimestamps: number[];
  paused: boolean;
  pausedRemainingMs: number;
  flushed: boolean;
  io: Server;
}

const dripStates = new Map<string, DripState>();

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Start dripping content for the current round. Call at intel phase entry.
 * Sends historical content immediately, then drips current-round content.
 */
export function startDrip(io: Server, room: GameRoom): void {
  clearDrip(room.code);

  // 1. Emit prior-round content immediately (history catch-up)
  emitHistoricalContent(io, room);

  // 2. Compute drip window
  const phaseDurationMs = getPhaseDuration(room, "intel");
  const dripWindowMs = phaseDurationMs * DRIP_WINDOW_RATIO;
  const totalWaves = Math.max(2, Math.floor(dripWindowMs / WAVE_INTERVAL_MS));

  const now = Date.now();
  const waveTimestamps: number[] = [];
  for (let i = 0; i < totalWaves; i++) {
    waveTimestamps.push(now + i * WAVE_INTERVAL_MS);
  }

  // 3. Gather current-round content from cache
  const allItems = new Map<Faction, { items: ContentItem[]; content: AppContent[] }>();
  for (const faction of ALL_FACTIONS) {
    const factionContent = getGeneratedContent(room, room.round, faction) ?? [];
    const shared = (getGeneratedSharedContent(room, room.round) ?? []).map((ac) => ({
      ...ac,
      faction,
    }));
    const combined = [...factionContent, ...shared];
    const items = combined.flatMap((ac) => ac.items);
    allItems.set(faction, { items, content: combined });
  }

  // 4. Partition items into waves
  const waves = new Map<number, Map<Faction, AppContent[]>>();
  for (let i = 0; i < totalWaves; i++) {
    waves.set(i, new Map());
  }

  const emittedIds = new Set<string>();

  for (const [faction, { items, content }] of allItems) {
    if (items.length === 0) continue;

    const initialCount = Math.max(1, Math.ceil(items.length * INITIAL_BATCH_RATIO));
    const initialItems = items.slice(0, initialCount);
    const remainingItems = items.slice(initialCount);

    // Wave 0: initial batch
    waves.get(0)!.set(faction, groupItemsByApp(faction, initialItems, content));

    // Distribute remaining across waves 1..N-1
    if (remainingItems.length > 0 && totalWaves > 1) {
      const perWave = Math.ceil(remainingItems.length / (totalWaves - 1));
      for (let w = 1; w < totalWaves; w++) {
        const start = (w - 1) * perWave;
        const chunk = remainingItems.slice(start, start + perWave);
        if (chunk.length > 0) {
          waves.get(w)!.set(faction, groupItemsByApp(faction, chunk, content));
        }
      }
    }
  }

  // 5. Create state
  const state: DripState = {
    round: room.round,
    emittedIds,
    waves,
    pending: new Map(),
    waveTimer: null,
    nextWaveIndex: 0,
    totalWaves,
    waveTimestamps,
    paused: false,
    pausedRemainingMs: 0,
    flushed: false,
    io,
  };
  dripStates.set(room.code, state);

  // 6. Emit wave 0 immediately
  emitWave(room.code, state, 0);

  // 7. Schedule next wave
  state.nextWaveIndex = 1;
  scheduleNextWave(room.code, state);
}

/**
 * Enqueue late-arriving content into the drip. If drip is active, items
 * join the next wave. If drip is flushed/inactive, emits immediately.
 */
export function enqueueDrip(roomCode: string, faction: Faction, content: AppContent[]): void {
  const state = dripStates.get(roomCode);
  if (!state) return; // No active drip — content is cached, will be picked up by startDrip

  // Filter already-emitted items
  const filtered = content
    .map((ac) => ({
      ...ac,
      items: ac.items.filter((item) => !state.emittedIds.has(item.id)),
    }))
    .filter((ac) => ac.items.length > 0);

  if (filtered.length === 0) return;

  // If drip already flushed, emit immediately
  if (state.flushed) {
    const room = getRoom(roomCode);
    if (room) {
      for (const ac of filtered) {
        for (const item of ac.items) state.emittedIds.add(item.id);
      }
      emitContentBatch(state.io, room, faction, filtered);
    }
    return;
  }

  // Otherwise queue for next wave
  const existing = state.pending.get(faction) ?? [];
  state.pending.set(faction, [...existing, ...filtered]);
}

/** Emit all remaining items immediately. Call at phase transitions. */
export function flushDrip(io: Server, room: GameRoom): void {
  const state = dripStates.get(room.code);
  if (!state || state.flushed) return;

  state.flushed = true;
  if (state.waveTimer) {
    clearTimeout(state.waveTimer);
    state.waveTimer = null;
  }

  // Emit all remaining planned waves
  for (let w = state.nextWaveIndex; w < state.totalWaves; w++) {
    emitWave(room.code, state, w);
  }

  // Drain any remaining pending items
  for (const faction of ALL_FACTIONS) {
    const pending = state.pending.get(faction) ?? [];
    if (pending.length === 0) continue;
    const filtered = pending
      .map((ac) => ({
        ...ac,
        items: ac.items.filter((item) => !state.emittedIds.has(item.id)),
      }))
      .filter((ac) => ac.items.length > 0);
    if (filtered.length > 0) {
      for (const ac of filtered) {
        for (const item of ac.items) state.emittedIds.add(item.id);
      }
      emitContentBatch(io, room, faction, filtered);
    }
    state.pending.set(faction, []);
  }
}

/** Pause the drip timer (GM pause). */
export function pauseDrip(roomCode: string): void {
  const state = dripStates.get(roomCode);
  if (!state || state.paused || state.flushed) return;

  state.paused = true;
  if (state.waveTimer) {
    clearTimeout(state.waveTimer);
    state.waveTimer = null;
  }
  if (state.nextWaveIndex < state.totalWaves) {
    state.pausedRemainingMs = Math.max(0, state.waveTimestamps[state.nextWaveIndex] - Date.now());
  }
}

/** Resume the drip timer (GM resume). */
export function resumeDrip(roomCode: string): void {
  const state = dripStates.get(roomCode);
  if (!state || !state.paused || state.flushed) return;

  state.paused = false;

  // Shift remaining wave timestamps forward by the paused duration
  const shift = Date.now() - (state.waveTimestamps[state.nextWaveIndex] - state.pausedRemainingMs);
  for (let i = state.nextWaveIndex; i < state.totalWaves; i++) {
    state.waveTimestamps[i] += shift;
  }

  scheduleNextWave(roomCode, state);
}

/** Cancel timers and remove state. Call on game end / room cleanup. */
export function clearDrip(roomCode: string): void {
  const state = dripStates.get(roomCode);
  if (!state) return;
  if (state.waveTimer) {
    clearTimeout(state.waveTimer);
  }
  dripStates.delete(roomCode);
}

// ── Internals ────────────────────────────────────────────────────────────────

function emitWave(roomCode: string, state: DripState, waveIndex: number): void {
  const room = getRoom(roomCode);
  if (!room) return;

  const waveContent = state.waves.get(waveIndex);

  for (const faction of ALL_FACTIONS) {
    const planned = waveContent?.get(faction) ?? [];
    const pendingForFaction = state.pending.get(faction) ?? [];
    state.pending.set(faction, []); // drain

    const combined = [...planned, ...pendingForFaction];

    // Filter already-emitted
    const filtered = combined
      .map((ac) => ({
        ...ac,
        items: ac.items.filter((item) => !state.emittedIds.has(item.id)),
      }))
      .filter((ac) => ac.items.length > 0);

    if (filtered.length > 0) {
      for (const ac of filtered) {
        for (const item of ac.items) state.emittedIds.add(item.id);
      }
      emitContentBatch(state.io, room, faction, filtered);
    }
  }
}

function scheduleNextWave(roomCode: string, state: DripState): void {
  if (state.flushed || state.nextWaveIndex >= state.totalWaves) return;

  const delayMs = Math.max(0, state.waveTimestamps[state.nextWaveIndex] - Date.now());
  state.waveTimer = setTimeout(() => {
    if (state.paused || state.flushed) return;
    emitWave(roomCode, state, state.nextWaveIndex);
    state.nextWaveIndex++;
    scheduleNextWave(roomCode, state);
  }, delayMs);
}

/**
 * Regroup flat items back into AppContent arrays, preserving app groupings
 * from the original content structure.
 */
function groupItemsByApp(faction: Faction, items: ContentItem[], originalContent: AppContent[]): AppContent[] {
  // Build a lookup: item ID → app
  const itemAppMap = new Map<string, string>();
  for (const ac of originalContent) {
    for (const item of ac.items) {
      itemAppMap.set(item.id, ac.app);
    }
  }

  const appMap = new Map<string, ContentItem[]>();
  for (const item of items) {
    const app = itemAppMap.get(item.id) ?? "news";
    if (!appMap.has(app)) appMap.set(app, []);
    appMap.get(app)!.push(item);
  }

  return Array.from(appMap.entries()).map(([app, appItems]) => ({
    faction,
    app: app as AppContent["app"],
    items: appItems,
  }));
}
