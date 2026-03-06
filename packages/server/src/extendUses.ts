// Tracks GM extend uses per room phase: `${code}:${round}:${phase}` → count (max 2)
export const extendUses = new Map<string, number>();

/**
 * Remove all extendUses entries for the given room code.
 * Call this on game end or when the last player disconnects to prevent unbounded Map growth.
 */
export function cleanupRoom(code: string): void {
  for (const key of extendUses.keys()) {
    if (key.startsWith(`${code}:`)) extendUses.delete(key);
  }
}
