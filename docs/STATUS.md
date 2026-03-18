# Project Status

Last updated: 2026-03-18

---

## Overall

The core game loop is **functional end-to-end**: lobby → 5 rounds of briefing/intel/deliberation/decision/resolution → composite endings. The codebase is **~23K source LOC** across server/client/shared with **1,169 passing tests** (0 failures). LLM generation is the sole content path (pre-authored content removed). Deployment infra (Dockerfile + fly.toml) is configured. All known bugs are fixed.

**Ready for first playtest.** The blocking items are: deploy to Fly.io, schedule humans.

**Not yet done:** First real playtest, production deployment, generation quality validation with real API calls, external role mechanical depth, monitoring/observability improvements.

---

## What Works

- **Phase state machine** — full 5-round loop with timer management, GM controls, pause/extend/jump
- **17 client apps** — all implemented with rich UX (Slack, Signal, Bloomberg, W&B, Security, Intel, Military, arXiv, News, Email, Memo, Twitter, GameState, Briefing, Compute, Substack, Sheets)
- **Desktop window manager** — draggable, resizable, z-ordered windows with dock + menubar + notifications
- **Fog-of-war** — corrected noise formula, faction-based hash seeding, comprehensive property tests
- **Decision/resolution engine** — effects with conditional multipliers, canonical clamping via `STATE_VARIABLE_RANGES`
- **9 ending arcs** — all resolvers implemented, thresholds tuned via 10K-trial Monte Carlo simulation, full branch coverage in tests
- **Content generation** — briefing + app content + NPC trigger + decision generation via Claude API, with retry/validation. LLM generation is the sole content path (no pre-authored fallback).
- **Decision templates** — 104 templates covering all 5 rounds, all 8 faction/role types, with hard/soft constraint validation and distinctness checks
- **Logging** — buffered JSONL per-room, envelope validation, graceful shutdown on SIGINT/SIGTERM
- **Dev tools** — URL bootstrap (`?dev=1&round=3&phase=intel&faction=openbrain&role=ob_cto&botMode=all_roles`), GM state sliders, jump-to-phase, fog inspector, endings preview
- **Bot system** — fills empty seats with auto-submitting bots for solo testing
- **Simulation harness** — Monte Carlo with hawk/dove/chaotic/random heuristics, 10K-trial reports, percentile analysis
- **Reconnection** — full state replay on rejoin (messages, content, phase, decisions)
- **Threshold system** — declarative `THRESHOLD_REGISTRY` with 8 thresholds, single dispatch loop
- **Event handler helpers** — `getSocketRoom()`/`getGmRoom()` eliminate validation boilerplate
- **Dead code detection** — `bun run knip` configured and passing clean

---

## Bugs

### Server

No known server bugs.

### Client

No known client bugs.

### Shared

No known shared bugs.

---

## Bugs Fixed

| Bug | Fix | Commit |
|-----|-----|--------|
| Double `game:publish` handler (client) | Removed duplicate handler | (earlier) |
| SlackApp `sendMessage` stale closure | Added `activeChannel` to deps | (earlier) |
| EmailApp read state keyed by array index | Keyed by stable `email.id` | (earlier) |
| No error boundaries in client | Per-window `ErrorBoundary` wrapping Window children | 1b39d28 |
| `updateStoryBible()` never called | Implemented and wired into `emitResolution()` | a38ceee |
| `formatTime` duplicated in Decision/GMDashboard | Extracted to `utils.ts` | (earlier) |
| `STATE_LABELS` duplicated in Ending/GMDashboard | Extracted to `constants/labels.ts` | (earlier) |
| `replayPlayerState` skips generated briefings | Extracted `getBriefingTextForPlayer` helper; both paths unified | 23e50bf |
| `history[].stateAfter` invariant untested | Verified correct; added regression tests locking post-mutation capture | 58b89a5 |
| No room cleanup lifecycle | TTL pruning for abandoned rooms, timer/extendUses cleanup | 10588f5 |
| Decision auto-submit stale closure | Replaced closure-captured values with refs | 8da6a92 |
| Decision option IDs not validated on submit | Already validated at events.ts:359-360 (was stale bug report) | N/A |
| `getContentForPlayer` duplicate app entries | Dedup by app name, merge items | b170ccd |
| GM duplicate messages when also a player | Guard skips echo when GM is in sending faction | 1dceadc |
| `tweet:send` ID not UUID-safe | Already used `crypto.randomUUID()`; added `tweet_` prefix | 58016b6 |
| DMs to bot socket IDs silently fail | Returns error to sender for `__bot_` targets | 56b9de5 |
| No input length guards on player messages | Truncation: chat 2000, tweet 280, publish title 200 / content 5000 | 7cf69a6 |
| Race: double `advancePhase` from timer + GM manual advance | `clearPhaseTimer()` called before manual advance | a31da4e |
| Activity penalty delta not clamped | `clampState()` called after `applyActivityPenalties()` | 5c49f1c |
| `clampState` was 30-line manual enumeration | Refactored to loop over canonical `STATE_VARIABLE_RANGES` | fe66bf6 |
| Fog noise formula broken (sin % 233280 no-op) | Fixed to `sin(...) * 233280`, fractional part extraction | (earlier) |
| Fog seed correlated for `ob*` variables | Uses `hashString(faction)` instead of `charCodeAt(0)` | (earlier) |
| `_role` parameter unused in `computeFogView` | Removed from API | (earlier) |
| `arcIds` array duplicated resolver keys | Uses `Object.keys(resolvers)` directly | (earlier) |
| `globalMediaCycle < -60` unreachable branch in endings | Replaced with `publicSentiment` check | (earlier) |
| `resolvePublicReaction` redundant branch | Removed duplicate condition | (earlier) |
| Shadow testing in events.test.ts | Complete rewrite to test real handlers | (earlier) |
| activity.test.ts tested local copy | Now imports real `applyActivityPenalties` | (earlier) |
| Clamping bounds inconsistency (GM vs resolution) | Both use canonical `STATE_VARIABLE_RANGES` | fe66bf6 |
| `globalMediaCycle` typed as `number` | Tightened to `MediaCycle` union type (`0\|1\|2\|3\|4\|5`) | 86ee23d |
| `resolveOpenSource` dead branch | Removed redundant `if` (both paths returned 3) | 7df3c48 |
| `resolveAlignment` OR made misaligned unreachable | Changed `\|\|` to `&&` with adjusted thresholds (conf>=10, sev<=65) | a966084 |
| Dead exports in shared | Removed `export` keywords | 8e43ad3 |
| UIStore `openWindow`/`focusWindow` race | Refactored to `set(s => ...)` pattern | 7df3c48 |
| Dead `notifications` field in UIStore | Removed field and interface | 7df3c48 |
| Desktop subscribes to entire game store | Replaced with 5 individual Zustand selectors | 340a11c |
| `getContentForApp` per-window per-render | Memoized `contentByApp` map via `useMemo` | 340a11c |
| PublishNotificationBanner auto-dismiss | Timer logic verified correct; added 9 confirming tests | bee3f64 |
| SignalApp O(n²) contact sort | Pre-computed `lastTimestampByPlayer` map | 164c213 |
| SignalApp unread counts in render body | Wrapped in `useMemo` with proper deps | 164c213 |
| `Ending.tsx` passthrough wrapper | Renamed `DebriefScreen` → `Ending`, removed alias | d9cc35a |
| Inline `<style>` injected on every render | Moved 5 animation keyframes to index.css | 19a8bda |
| MemoApp page lookup by mutable title | Switched to stable ID-based page selection | f34a92a |
| Suppressed `exhaustive-deps` ESLint warnings | Added explanatory comments documenting why safe | 8627b17 |

---

## Features Needing Work

### Content Generation

**Status: Full pipeline implemented. LLM generation is the sole content path. Real API quality untested.**

What exists:
- Full generation pipeline: briefing + content (news/twitter/slack/email/memo/signal) + NPC triggers + decisions
- 104 decision templates across all 5 rounds, all 8 faction/role types
- Decision validation: hard constraints (3 options, 5-8 effects, no-free-lunch), soft constraints (variable scope, effect bounds), distinctness checks
- Prompt system with faction voices, app voices, round arc templates
- Retry with error feedback (max 2 attempts per artifact)
- Kill switches: `GEN_ENABLED`, `GEN_BRIEFINGS_ENABLED`, `GEN_NPC_ENABLED`, `GEN_DECISIONS_ENABLED`, per-room toggle
- Provider abstraction (Anthropic Claude, with mock for tests)
- Generation is idempotent per room-round (can't re-trigger same round)

What's missing:
- **No cost controls** — no concurrent request throttling, no per-room budget, no daily spend cap. ~14 API calls/round/room, ~$6.64/round. 100 concurrent rooms = $3,300+.
- **Resolution narrative generation** — described in GENERATIVE-CONTENT.md Phase C. Current resolution narrative is a generic template, not LLM-generated.
- **No live playtesting** — prompt quality, latency, and cost are untested with real API calls.
- **Generation metrics not in game logs** — latency, token usage, validation failures only logged to stdout.

### External Role Balancing

**Status: Rich content, shallow mechanics. Full audit in EXTERNAL-ROLES-AUDIT.md.**

All four external roles (NSA, Journalist, VC, Diplomat) have individual decisions in all 5 rounds and thematic content, but limited mechanical depth. See EXTERNAL-ROLES-AUDIT.md for detailed proposals.

### Hosting & Deployment

**Status: Config ready, pre-flight audit complete, no actual deployment.**

What exists:
- Dockerfile: multi-stage build, client assets served by server in production
- fly.toml: sjc region, 512MB RAM, auto-scale 0→N, persistent log volume, force_https
- Health check endpoint: `/api/health` (returns room count)
- Graceful shutdown: flushes JSONL loggers on SIGTERM, clears room pruning
- Room TTL cleanup: 30-min TTL, 5-min prune interval
- Dev-only code properly gated behind NODE_ENV checks

Pre-deploy checklist:
- [ ] `fly volumes create game_logs --region sjc --size 3`
- [ ] `fly secrets set ANTHROPIC_API_KEY=sk-ant-...` (or `GEN_ENABLED=false` for first playtest)
- [ ] Set `min_machines_running = 1` for playtest (avoids 30-60s cold start)
- [ ] `fly deploy`
- [ ] Verify: `curl https://takeoff-protocol.fly.dev/api/health`
- [ ] Test WebSocket connection in browser

What's missing:
- No actual Fly.io deployment done
- No load testing (14 concurrent WebSocket connections)
- No reconnection testing under real network conditions

### Diagnostics & Logging

**Status: Logger implemented with structured JSONL. Significant observability gaps.**

What exists:
- JSONL per-room logging with envelope validation
- Events: phase changes, decisions, state deltas/snapshots, thresholds, NPC triggers, messages, activity, penalties, GM overrides
- Graceful shutdown: flushes on SIGINT/SIGTERM and room cleanup
- Generation metrics logged to stdout (start/success/failure per artifact)

What's missing:
- **Generation metrics not in JSONL** — token usage, cost, retry counts only on stdout
- **Health endpoint minimal** — only room count; no memory, socket count, generation status
- **GM has no generation visibility** — can't see if generation is pending/ready/failed
- **No cost instrumentation** — no tracking of actual API spend

### Game Balance

**Status: Significantly improved after threshold tuning. Two arcs still skewed.**

From 10,000 random-heuristic trials (with generated decision templates):

| Arc | Distribution | Status |
|-----|-------------|--------|
| AI Race | 63.8% stalemate, rest distributed | Stalemate dominates |
| Alignment | Max outcome 43% (superficial) | Well-distributed after OR→AND fix |
| Control | Max outcome 53.6% (government) | Slightly high |
| Economy | Max outcome 45.7% | Acceptable |
| US-China | Max outcome 45.1% | Well-distributed |
| Public Reaction | Max outcome 42.8% | Healthy |
| Taiwan | Distributed | Healthy |
| Open Source | 58.1% irrelevant | Skewed — needs tuning |
| Prometheus | Distributed | Healthy |

---

## Test Quality

### Current Coverage
- 1,169 pass, 2 skip, 0 fail across 46 test files
- Server (667 tests): events, game, rooms, devBots, activity, decision-cycle, reconnect, cleanup, updateStoryBible + generation suite + logger suite + decision submission edge cases
- Client (411 tests): ErrorBoundary, Decision, PublishNotificationBanner component tests + utility tests across all 13 app modules + store tests (game, messages, notifications, UI) + GM ControlsPanel export tests
- Shared (91 tests): resolution, fog, endings with property tests

### Coverage Gaps

**Critical (high risk, no tests):**
- **Client socket integration (`socket.ts`)** — reconnection retry logic on client side untested

**High (moderate risk):**
- **Client screens** (`Desktop.tsx`, `Lobby.tsx`, `Ending.tsx`, `Resolution.tsx`, `screens/gm/`, `Briefing.tsx`) — no component render tests
- **Generation error paths** — timeout/parse/validation failures tested in isolation but not in full orchestration flow

**Medium (lower risk):**
- **17 app components** (EmailApp, SlackApp, etc.) — only utility functions tested, not React components
- **Simulation harness** — no tests for Monte Carlo or sampler logic itself

**Structural:**
- No end-to-end tests (real browser + server)

---

## Refactoring Opportunities

These are not bugs but would improve maintainability:

| Item | Location | Impact |
|------|----------|--------|
| ~~`checkThresholds` is a 350-line monolith~~ | ~~game.ts~~ | Done — declarative `THRESHOLD_REGISTRY` + loop |
| ~~GM authorization guard repeated 9+ times~~ | ~~events.ts~~ | Done — `getSocketRoom()`/`getGmRoom()` helpers |
| `game:phase` emit duplicated in 6 call sites | game.ts | Extract `emitPhase(io, room)` |
| `isLeader` derivation triplicated | rooms.ts, events.ts | Shared helper using `isLeaderRole()` |
| ~~`GMDashboard.tsx` is 700+ lines~~ | ~~screens/GMDashboard.tsx~~ | Done — split into `screens/gm/` module |
| Mixed inline styles and Tailwind (335 instances) | All client components | Design token setup + migration in progress (hive issues) |
| Socket listeners not teardown-friendly | stores/game.ts, stores/messages.ts | Fine for single-session, blocks future leave-room flows |
| `initializeStoryBible` side-effect in `buildGenerationContext` | generation/context.ts | Surprising mutation in a read-like function |
| `injectNewsContent` and `publish:submit` near-duplicate | events.ts | Both build ContentItem + Publication + emit `game:publish` |

---

## Priority Recommendations

### P0 — Deploy & Playtest
All code bugs are fixed. Next steps:
1. Deploy to Fly.io with `GEN_ENABLED=false` (isolate game loop from API issues)
2. Smoke test: create room, join 2-3 browsers, advance through phases
3. Run first full playtest with real humans (generation off — use placeholder content)
4. Second playtest with `GEN_ENABLED=true` + `ANTHROPIC_API_KEY` set

### P1 — Generation Cost Controls
Before enabling generation in production:
5. Add concurrent request throttle (max 5 simultaneous Anthropic API calls)
6. Add per-room generation budget or max room count cap
7. Add token usage logging from Anthropic response metadata
8. Add generation status visibility to GM dashboard (pending/ready/failed)

### P2 — Monitoring & Observability
9. Generation metrics in JSONL (token usage, cost, retry counts)
10. Expand `/api/health` (memory, socket count, generation pipeline status)
11. Surface threshold/NPC trigger events in GM dashboard
12. Structured error events in JSONL

### P3 — Gameplay Enrichment
13. Resolution narrative generation (Phase C — LLM-generated reactive prose)
14. External role mechanical depth (NSA emergency powers, journalist impact system, VC board authority, diplomat negotiations)
15. Further tune AI Race (stalemate 63.8%) and Open Source (irrelevant 58.1%) arcs

### P4 — Polish
16. Inline style → Tailwind migration (in progress via hive)
17. Client component refactors: RadioGroup, wandbUtils split, Lobby FactionGrid (in progress via hive)
18. Add client screen component tests
19. Twitter faction bubble system
