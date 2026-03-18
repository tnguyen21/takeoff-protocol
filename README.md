# Takeoff Protocol

An online multiplayer tabletop exercise based on the [AI 2027](https://ai-2027.com) scenario. 8–14 players plus a game master inhabit a simulated macOS desktop — Slack, Signal, internal dashboards — piecing together a geopolitical AI crisis with incomplete information and time pressure. See [docs/DESIGN.md](docs/DESIGN.md) for the full design.

## Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- Node.js 18+

## Getting Started

```sh
bun install

bun run dev:server   # game server on :3001
bun run dev:client   # Vite dev server on :5173
```

Or start both together:

```sh
bun run dev
```

And with reactive content:

```
GEN_ENABLED=true GEN_BRIEFINGS_ENABLED=true GEN_CONTENT_APPS=news,twitter ANTHROPIC_API_KEY=sk-... bun run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

```
packages/
  shared/   # @takeoff/shared — types, constants, game logic (fog-of-war, state resolution)
  server/   # @takeoff/server — Hono + Socket.io game server
  client/   # @takeoff/client — React SPA (simulated macOS desktop)
```

## Testing

```sh
bun run test        # all packages
bun run typecheck   # typecheck all packages
```

Per-package:

```sh
cd packages/shared && bun test
cd packages/server && bun test
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SITE_PASSWORD` | _(unset)_ | Shared passphrase to gate access. When unset, no auth is required. |
| `MAX_CONCURRENT_ROOMS` | `5` | Maximum simultaneous rooms. Limits LLM generation costs. |

When `SITE_PASSWORD` is set, unauthenticated users see a password page. A valid password sets an HMAC-signed HttpOnly cookie (24h TTL). Rate limited to 5 attempts per IP per minute.

```sh
# Local dev with auth enabled
SITE_PASSWORD="playtest-2027" bun run dev
```

## Playing

1. Open `http://localhost:5173`, enter your name, click **Create Room**
2. Share the room code with other players
3. Players join at the same URL using the room code
4. GM clicks **Start Game** once everyone has joined

## LAN Hosting (Beta Playtests)

To host for players on the same wifi network:

```sh
bun run dev --host
```

This binds Vite to `0.0.0.0` so other machines can connect. Find your local IP:

```sh
ipconfig getifaddr en0
```

Share `http://<your-ip>:5173` with players. Socket connections proxy through Vite to the game server automatically.
