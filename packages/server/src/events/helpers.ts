import type { Socket } from "socket.io";
import type { GameRoom } from "@takeoff/shared";
import { getRoom } from "../rooms.js";

export function getSocketRoom(socket: Socket): GameRoom | null {
  const code = socket.data.roomCode;
  if (!code) return null;
  return getRoom(code) ?? null;
}

export function getGmRoom(socket: Socket): GameRoom | null {
  const room = getSocketRoom(socket);
  if (!room || room.gmId !== socket.id) return null;
  return room;
}
