# Deployment Runbook: Fly.io

First deployment guide for Takeoff Protocol. Run these steps once to go from zero to production.

---

## Prerequisites

- Docker installed locally (for build verification)
- An Anthropic API key (from https://console.anthropic.com) if using LLM generation
- A Fly.io account (https://fly.io)

---

## 1. Install Fly CLI

```bash
# macOS (Homebrew)
brew install flyctl

# Or via install script
curl -L https://fly.io/install.sh | sh

# Verify
fly version
```

## 2. Authenticate

```bash
fly auth login
# Opens browser for OAuth. Follow the prompts.
```

## 3. Verify the Docker Build Locally

Before deploying, confirm the image builds and runs:

```bash
docker build -t takeoff:latest .
docker run --rm -p 8080:8080 takeoff:latest
# Visit http://localhost:8080 — should serve the client SPA
# Ctrl-C to stop
```

The Dockerfile is a two-stage build on `oven/bun:1`:
- **Build stage**: installs all deps, runs `bun run build` (compiles server TS, builds client Vite bundle)
- **Runtime stage**: copies `dist/`, `client-dist/`, `node_modules/`, `packages/shared/`; runs `bun run dist/index.js` on port 8080

## 4. Launch the App on Fly.io

Since `fly.toml` already exists, Fly will detect it:

```bash
fly launch
```

When prompted:
- **App name**: `takeoff-protocol` (or accept the name in fly.toml)
- **Region**: `sjc` (San Jose — matches fly.toml)
- **Deploy now?**: No (we need to set up the volume and secrets first)

If `fly launch` tries to overwrite `fly.toml` or `Dockerfile`, decline — the existing ones are correct.

## 5. Create the Persistent Volume

Game logs are written to `/data/logs` as JSONL files. This mount persists across deploys.

```bash
fly volumes create game_logs --region sjc --size 3
# 3 GB is sufficient for 100+ games (~30MB per game)
```

Verify:
```bash
fly volumes list
```

The mount is already configured in `fly.toml`:
```toml
[mounts]
  source = "game_logs"
  destination = "/data/logs"
```

## 6. Set Secrets

Secrets are injected as environment variables at runtime. They're encrypted at rest and never visible in logs.

### Site password (recommended)

Gate the site behind a shared passphrase to prevent unauthorized access and token waste. When set, unauthenticated requests get a password page. Valid password sets an HMAC-signed HttpOnly cookie (24h TTL). Rate limited to 5 attempts per IP per minute.

```bash
fly secrets set SITE_PASSWORD="your-playtest-passphrase"
```

Changing the password invalidates all existing cookies (HMAC key rotates). To disable the gate, unset the secret:

```bash
fly secrets unset SITE_PASSWORD
```

### Required (if using LLM generation)

```bash
fly secrets set ANTHROPIC_API_KEY="sk-ant-api03-YOUR-KEY-HERE"
```

### Generation control

For the first playtest, you may want generation **off** (uses pre-authored fallback content) to isolate testing from API issues:

```bash
# Generation OFF (safe default for first deploy)
fly secrets set GEN_ENABLED=false
```

Or to enable generation:

```bash
# Generation ON
fly secrets set \
  GEN_ENABLED=true \
  GEN_BRIEFINGS_ENABLED=true \
  GEN_NPC_ENABLED=true \
  GEN_PROVIDER=anthropic \
  GEN_BRIEFING_MODEL=claude-sonnet-4-5-20250514 \
  GEN_CONTENT_MODEL=claude-haiku-4-5-20251001 \
  GEN_TIMEOUT_MS=30000
```

### Already set in fly.toml (don't need secrets)

These are non-sensitive and already in `fly.toml` `[env]`:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Enables static serving, disables dev CORS |
| `LOG_DIR` | `/data/logs` | Points to persistent volume mount |
| `PORT` | `8080` | Matches Dockerfile EXPOSE and fly.toml internal_port |

### Full environment variable reference

| Variable | Default | Required | Purpose |
|----------|---------|----------|---------|
| `PORT` | `8080` (docker) / `3001` (dev) | No | HTTP/WebSocket listen port |
| `NODE_ENV` | `production` | No | Environment mode |
| `LOG_DIR` | `logs` | No | JSONL game log directory |
| `LOG_ENABLED` | `true` | No | Set `false` to disable logging |
| `GEN_ENABLED` | `false` | No | Master switch for all LLM generation |
| `GEN_BRIEFINGS_ENABLED` | `false` | No | Generate round briefings |
| `GEN_NPC_ENABLED` | `false` | No | Generate NPC trigger messages |
| `GEN_PROVIDER` | `anthropic` | No | `anthropic` or `mock` |
| `GEN_BRIEFING_MODEL` | `claude-sonnet-4-5-20250514` | No | Model for briefings |
| `GEN_CONTENT_MODEL` | `claude-haiku-4-5-20251001` | No | Model for app content |
| `GEN_TIMEOUT_MS` | `30000` | No | Generation request timeout (ms) |
| `ANTHROPIC_API_KEY` | — | If `GEN_ENABLED=true` | Anthropic API key |
| `SITE_PASSWORD` | _(unset)_ | No | Shared passphrase for site-wide access gate. Unset = no auth. |
| `MAX_CONCURRENT_ROOMS` | `5` | No | Max simultaneous rooms (limits LLM cost runaway) |

## 7. Deploy

```bash
fly deploy
```

This builds the Docker image (remote builder by default), pushes it, and starts the Machine.

If the remote build hangs (known Bun issue), fall back to local build:

```bash
fly deploy --local-only
```

## 8. Verify Deployment

### Health check

```bash
curl https://takeoff-protocol.fly.dev/api/health
# Expected: {"status":"ok","rooms":0}
```

### App status

```bash
fly status
```

### Live logs

```bash
fly logs
```

### Browser test

1. Open `https://takeoff-protocol.fly.dev`
2. Create a room (GM flow)
3. Open browser DevTools → Network tab → filter `socket.io`
4. Confirm WebSocket connection upgrades from polling to `ws`
5. Open a second browser/incognito → join the room as a player
6. Verify real-time state sync (chat messages, phase transitions)

## 9. WebSocket Notes

WebSockets work out of the box on Fly.io with no special config. The current setup:

- `force_https = true` in fly.toml automatically upgrades to WSS
- Socket.IO negotiates HTTP → WebSocket upgrade through Fly's proxy
- CORS is disabled in production (client and server are same-origin)

**Scaling caveat**: The current architecture is **single-machine**. If you scale to multiple Machines, Socket.IO requires sticky sessions or a Redis adapter (`@socket.io/redis-adapter`). For the first playtest, stick to 1 Machine.

The fly.toml concurrency settings:

```toml
# Already configured — connection-based (not request-based) for WebSockets
auto_stop_machines = "stop"
auto_start_machines = true
min_machines_running = 0
```

For a playtest, consider setting `min_machines_running = 1` to avoid cold-start latency:

```bash
# Edit fly.toml or:
fly scale count 1 --region sjc
```

## 10. Accessing Game Logs

Game logs are persisted as JSONL on the mounted volume:

```bash
# SSH into the Machine
fly ssh console

# List log files
ls /data/logs/
# Format: <room_code>_<timestamp>.jsonl

# Read a specific game's log
cat /data/logs/ABCD_2026-03-15T20:00:00.000Z.jsonl | head -20

# Download logs locally
fly ssh sftp get /data/logs/ABCD_*.jsonl ./local-logs/
```

Logs flush on SIGTERM/SIGINT (graceful shutdown), so no data loss on redeploy.

## 11. Scaling (If Needed Later)

```bash
# Check current scale
fly scale show

# Increase memory (current: 512MB)
fly scale memory 1024

# Upgrade VM (current: shared-cpu-1x)
fly scale vm shared-cpu-2x

# Add a region
fly scale count 1 --region iad
```

Current config (`shared-cpu-1x`, 512MB) handles ~1-2 concurrent games (14-28 players). For larger events, bump to `shared-cpu-2x` + 1024MB.

## 12. Custom Domain (Optional)

```bash
# Allocate IPs
fly ips allocate-v6          # Free
fly ips allocate-v4          # $2/month (needed for some DNS setups)
fly ips list                 # Note the IPs

# Add your domain
fly certs add play.yourdomain.com

# Check what DNS records to set
fly certs check play.yourdomain.com
```

Then at your DNS provider, add a CNAME:
```
CNAME  play  takeoff-protocol.fly.dev
```

SSL is provisioned automatically via Let's Encrypt once DNS propagates.

## 13. Redeploying

After code changes, just:

```bash
fly deploy
```

Fly does rolling deploys by default — the old Machine stays up until the new one passes health checks.

## 14. Teardown

If you need to remove everything:

```bash
fly apps destroy takeoff-protocol
# This destroys the app, all Machines, and all volumes. Irreversible.
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Deploy hangs during `bun install` | Use `fly deploy --local-only` |
| Health check fails | `fly logs` — look for startup errors |
| WebSocket won't connect | Check browser console; ensure HTTPS (not HTTP) |
| Generation not working | `fly secrets list` — confirm `ANTHROPIC_API_KEY` is set; check `fly logs` for API errors |
| Logs directory empty | Verify volume mount: `fly ssh console` → `ls /data/logs/` → check `LOG_DIR` env |
| Cold start too slow | Set `min_machines_running = 1` in fly.toml |
| Machine keeps stopping | Check `auto_stop_machines` in fly.toml; ensure health check passes |
| Password gate not showing | Confirm `SITE_PASSWORD` is set: `fly secrets list` |
| "Too many attempts" on password | Rate limit: 5 attempts/IP/min. Wait 60s or redeploy to reset. |
| Can't create rooms | Room cap hit. Check `/api/rooms` or increase `MAX_CONCURRENT_ROOMS`. |

---

## Quick Reference

```bash
fly status                    # App overview
fly logs                      # Live logs
fly ssh console               # SSH into Machine
fly secrets list              # List secret names
fly secrets set KEY=VALUE     # Set a secret (restarts Machine)
fly deploy                    # Deploy latest code
fly scale show                # Current VM config
fly doctor                    # Diagnose common issues
```
