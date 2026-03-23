// ── Session persistence (survives page refresh) ──

export const SESSION_KEY = "takeoff:session";

export interface StoredSession {
  roomCode: string;
  playerName: string;
  playerId: string; // original socket ID (used as identifier for rejoin)
  isGM: boolean;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(data: StoredSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (e.g. private browsing with storage blocked)
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
