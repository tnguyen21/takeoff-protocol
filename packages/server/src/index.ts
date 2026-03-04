import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Server as SocketIOServer } from "socket.io";
import { registerGameEvents } from "./events.js";
import { rooms } from "./rooms.js";
import { closeAllLoggers } from "./logger/registry.js";

const app = new Hono();

app.get("/api/health", (c) => c.json({ status: "ok", rooms: rooms.size }));

if (process.env.NODE_ENV === "production") {
  // Serve built client assets
  app.use("/*", serveStatic({ root: "./client-dist" }));
  // SPA fallback: serve index.html for non-asset routes
  app.get("*", serveStatic({ root: "./client-dist", path: "index.html" }));
}

const port = parseInt(process.env.PORT || "3001");

const server = serve({ fetch: app.fetch, port });

const isProduction = process.env.NODE_ENV === "production";

const io = new SocketIOServer(server as any, {
  ...(isProduction
    ? {}
    : {
        cors: {
          origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
          methods: ["GET", "POST"],
        },
      }),
});

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);
  registerGameEvents(io, socket);
  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

console.log(`[server] listening on http://localhost:${port}`);

async function shutdown(signal: string) {
  console.log(`[server] ${signal} received, flushing loggers...`);
  await closeAllLoggers();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
