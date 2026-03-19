import { INITIAL_STATE, isLeaderRole } from "@takeoff/shared";
import type { Faction, GameMessage, GameRoom, Player, Role } from "@takeoff/shared";
import { createLoggerForRoom } from "./logger/registry.js";

export const MAX_CONCURRENT_ROOMS = parseInt(process.env.MAX_CONCURRENT_ROOMS || "5", 10);

export const rooms = new Map<string, GameRoom>();
export const roomCreatedAt = new Map<string, number>();
/**
 * Tracks the timestamp (ms) when a room's last player disconnected.
 * Cleared when any player reconnects. Used by pruneAbandonedRooms to
 * enforce the TTL before removing fully-abandoned rooms.
 */
export const allDisconnectedAt = new Map<string, number>();

/** Record that all players in a room are now disconnected. */
export function recordAllDisconnected(code: string): void {
  allDisconnectedAt.set(code, Date.now());
}

/** Clear the all-disconnected timestamp (called when any player reconnects). */
export function clearAllDisconnected(code: string): void {
  allDisconnectedAt.delete(code);
}

/** Remove a room and its disconnect timestamp from the maps. */
export function deleteRoom(code: string): void {
  rooms.delete(code);
  allDisconnectedAt.delete(code);
  roomCreatedAt.delete(code);
}

export function isAtRoomCap(): boolean {
  return rooms.size >= MAX_CONCURRENT_ROOMS;
}

/**
 * Remove rooms that have been fully abandoned (all players disconnected)
 * for longer than ttlMs milliseconds.
 * Returns the list of room codes that were pruned.
 * Rooms with any connected player are never pruned (INV-3).
 */
export function pruneAbandonedRooms(ttlMs: number): string[] {
  const now = Date.now();
  const pruned: string[] = [];
  for (const [code, room] of rooms.entries()) {
    const disconnectedSince = allDisconnectedAt.get(code);
    if (!disconnectedSince) continue; // has connected players or was never abandoned
    // Double-check: re-verify all players are still disconnected
    const allStillDisconnected = Object.values(room.players).every((p) => !p.connected);
    if (!allStillDisconnected) {
      allDisconnectedAt.delete(code);
      continue;
    }
    if (now - disconnectedSince >= ttlMs) {
      pruned.push(code);
    }
  }
  return pruned;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(gmSocketId: string): GameRoom {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room: GameRoom = {
    code,
    phase: "lobby",
    round: 0,
    timer: { endsAt: 0 },
    players: {},
    gmId: gmSocketId,
    state: { ...INITIAL_STATE },
    decisions: {},
    teamDecisions: {},
    teamVotes: {},
    history: [],
    publications: [],
    messages: [],
    storyBible: undefined,
    generatedRounds: {},
    generationStatus: {},
  };

  rooms.set(code, room);
  roomCreatedAt.set(code, Date.now());
  createLoggerForRoom(code, { logDir: process.env.LOG_DIR || "logs" });
  return room;
}

export function joinRoom(
  code: string,
  socketId: string,
  name: string,
): { room: GameRoom; player: Player } | null {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.phase !== "lobby") return null;

  const player: Player = {
    id: socketId,
    name,
    faction: null,
    role: null,
    isLeader: false,
    connected: true,
  };

  room.players[socketId] = player;
  return { room, player };
}

export function selectRole(
  code: string,
  socketId: string,
  faction: Faction,
  role: Role,
): boolean {
  const room = rooms.get(code);
  if (!room || room.phase !== "lobby") return false;

  const player = room.players[socketId];
  if (!player) return false;

  // Check if role is already taken
  for (const p of Object.values(room.players)) {
    if (p.id !== socketId && p.faction === faction && p.role === role) {
      return false;
    }
  }

  player.faction = faction;
  player.role = role;

  // Determine if this role is a leader
  // Leaders: ob_ceo, prom_ceo, china_director (external has no single leader)
  player.isLeader = isLeaderRole(role);

  return true;
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code.toUpperCase());
}


export function getLobbyState(room: GameRoom) {
  return {
    code: room.code,
    phase: room.phase,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      faction: p.faction,
      role: p.role,
      connected: p.connected,
    })),
    gmId: room.gmId,
  };
}

/**
 * Reassign a player (or GM) from their old socket ID to a new one on reconnect.
 * Returns the updated room and player, plus the old socket ID that was replaced.
 */
export function rejoinRoom(
  code: string,
  newSocketId: string,
  oldSocketId: string,
): { room: GameRoom; player: Player | null; isGM: boolean } | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  // GM rejoin
  if (room.gmId === oldSocketId) {
    room.gmId = newSocketId;
    return { room, player: null, isGM: true };
  }

  // Player rejoin
  const player = room.players[oldSocketId];
  if (!player) return null;

  delete room.players[oldSocketId];
  player.id = newSocketId;
  player.connected = true;
  room.players[newSocketId] = player;

  return { room, player, isGM: false };
}

/**
 * Return all messages a player should see: their faction's team chats + their DMs.
 * Pass the player's faction and their OLD socket ID (messages are stored by socket ID at send time).
 */
export function getPlayerMessages(room: GameRoom, faction: Faction, playerId: string): GameMessage[] {
  return room.messages.filter(
    (msg) =>
      (msg.isTeamChat && msg.faction === faction) ||
      (!msg.isTeamChat && (msg.to === playerId || msg.from === playerId)),
  );
}
