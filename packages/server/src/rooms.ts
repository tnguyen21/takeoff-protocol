import { INITIAL_STATE } from "@takeoff/shared";
import type { Faction, GameMessage, GamePhase, GameRoom, Player, Role, StateVariables } from "@takeoff/shared";

export const rooms = new Map<string, GameRoom>();

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
  };

  rooms.set(code, room);
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
    influenceTokens: 2,
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
  player.isLeader = ["ob_ceo", "prom_ceo", "china_director"].includes(role);

  return true;
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function spendToken(room: GameRoom, playerId: string): boolean {
  const player = room.players[playerId];
  if (!player || player.influenceTokens <= 0) return false;
  player.influenceTokens--;
  return true;
}

export function awardToken(room: GameRoom, playerId: string): boolean {
  const player = room.players[playerId];
  if (!player) return false;
  player.influenceTokens++;
  return true;
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
