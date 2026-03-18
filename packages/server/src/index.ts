import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { join, extname } from "node:path";
import { Server as SocketIOServer } from "socket.io";
import { registerGameEvents } from "./events.js";
import { rooms, pruneAbandonedRooms, deleteRoom, MAX_CONCURRENT_ROOMS } from "./rooms.js";
import { closeAllLoggers, closeLoggerForRoom } from "./logger/registry.js";
import { clearPhaseTimer } from "./game.js";
import { cleanupRoom } from "./extendUses.js";
import {
  isAuthEnabled,
  checkPassword,
  generateAuthCookie,
  validateAuthCookie,
  parseCookieHeader,
  checkRateLimit,
  recordAttempt,
  getClientIp,
  getGatePageHtml,
} from "./auth.js";

const app = new Hono();

app.get("/api/health", (c) => c.json({ status: "ok", rooms: rooms.size }));

// ── Auth routes (exempt from middleware) ──

app.post("/api/auth", async (c) => {
  if (!isAuthEnabled()) return c.redirect("/");

  const ip = getClientIp(c.req.raw.headers);
  if (!checkRateLimit(ip).allowed) {
    return c.html(getGatePageHtml("Too many attempts — try again in a minute"), 429);
  }

  const body = await c.req.parseBody();
  const password = typeof body.password === "string" ? body.password : "";

  recordAttempt(ip);

  if (!checkPassword(password)) {
    return c.html(getGatePageHtml("Wrong passphrase"), 401);
  }

  const cookie = generateAuthCookie();
  c.header("Set-Cookie", `site_auth=${cookie}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`);
  return c.redirect("/");
});

app.get("/api/auth/check", (c) => {
  if (!isAuthEnabled()) return c.json({ authenticated: true });

  const cookies = parseCookieHeader(c.req.header("cookie"));
  if (cookies.site_auth && validateAuthCookie(cookies.site_auth)) {
    return c.json({ authenticated: true });
  }
  return c.json({ authenticated: false }, 401);
});

app.get("/api/rooms", (c) => {
  if (isAuthEnabled()) {
    const cookies = parseCookieHeader(c.req.header("cookie"));
    if (!cookies.site_auth || !validateAuthCookie(cookies.site_auth)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  const roomList = Array.from(rooms.values()).map((r) => ({
    code: r.code,
    playerCount: Object.keys(r.players).length,
    phase: r.phase,
    round: r.round,
  }));
  return c.json({ rooms: roomList, maxRooms: MAX_CONCURRENT_ROOMS });
});

const isProduction = process.env["NODE_ENV"] === "production";

if (isProduction) {
  // Auth middleware for production (before static serving)
  if (isAuthEnabled()) {
    app.use("/*", async (c, next) => {
      const path = new URL(c.req.url).pathname;
      // Exempt paths
      if (path === "/api/health" || path === "/api/auth" || path === "/api/auth/check" || path === "/api/rooms") {
        return next();
      }

      const cookies = parseCookieHeader(c.req.header("cookie"));
      if (cookies.site_auth && validateAuthCookie(cookies.site_auth)) {
        return next();
      }

      return c.html(getGatePageHtml(), 401);
    });
  }

  // Serve built client assets (Bun-native, no adapter needed)
  // In Docker, CWD is /app and client assets are at /app/client-dist.
  // Locally, fall back to packages/client/dist relative to repo root.
  const candidates = [
    join(process.cwd(), "client-dist"),
    join(process.cwd(), "packages", "client", "dist"),
  ];
  const clientDir = candidates.find((d) => {
    try { return Bun.file(join(d, "index.html")).size > 0; } catch { return false; }
  }) ?? candidates[0];

  const MIME_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ico": "image/x-icon",
  };

  app.use("/*", async (c, next) => {
    const reqPath = new URL(c.req.url).pathname;
    if (reqPath.startsWith("/api/") || reqPath.startsWith("/socket.io")) return next();

    const filePath = join(clientDir, reqPath);
    const file = Bun.file(filePath);
    if (await file.exists() && file.size > 0) {
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
      return new Response(file, { headers: { "content-type": contentType } });
    }
    return next();
  });

  // SPA fallback: serve index.html for non-asset routes
  app.get("*", async (c) => {
    const indexFile = Bun.file(join(clientDir, "index.html"));
    if (await indexFile.exists()) {
      return new Response(indexFile, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return c.text("Client assets not found", 500);
  });
}

const port = parseInt(process.env.PORT || "3001");

const server = serve({ fetch: app.fetch, port });

const io = new SocketIOServer(server as any, {
  ...(isProduction
    ? {}
    : {
        cors: {
          origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
          methods: ["GET", "POST"],
          credentials: true,
        },
      }),
});

// Socket.IO auth middleware
if (isAuthEnabled()) {
  io.use((socket, next) => {
    const cookies = parseCookieHeader(socket.handshake.headers.cookie);
    if (cookies.site_auth && validateAuthCookie(cookies.site_auth)) {
      return next();
    }
    next(new Error("Unauthorized"));
  });
}

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);
  registerGameEvents(io, socket);
  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

console.log(`[server] listening on http://localhost:${port}`);

// ── Periodic room pruning ──
const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PRUNE_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

const pruneInterval = setInterval(() => {
  const pruned = pruneAbandonedRooms(ROOM_TTL_MS);
  for (const code of pruned) {
    const room = rooms.get(code);
    if (room) clearPhaseTimer(room);
    cleanupRoom(code);
    void closeLoggerForRoom(code);
    deleteRoom(code);
    console.log(`[prune] removed abandoned room ${code}`);
  }
}, PRUNE_INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`[server] ${signal} received, flushing loggers...`);
  clearInterval(pruneInterval);
  await closeAllLoggers();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
