import type { Server, Socket } from "socket.io";
import { registerRoomEvents } from "./room.js";
import { registerGmControlEvents } from "./gmControls.js";
import { registerPlayerActionEvents } from "./playerActions.js";
import { registerDevToolEvents } from "./devTools.js";
import { registerDisconnectHandler } from "./disconnect.js";

export function registerGameEvents(io: Server, socket: Socket) {
  registerRoomEvents(io, socket);
  registerGmControlEvents(io, socket);
  registerPlayerActionEvents(io, socket);
  registerDevToolEvents(io, socket);
  registerDisconnectHandler(io, socket);
}
