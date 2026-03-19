# Project Status

Last updated: 2026-03-19

---

## Overall

The core game loop is **functional end-to-end**: lobby → 5 rounds of briefing/intel/deliberation/decision/resolution → composite endings. The codebase is **~23K source LOC** across server/client/shared with **1,143 passing tests** (0 failures, 47 test files). LLM generation is the sole content path (no pre-authored fallback by design). **Deployed to Fly.io** with password gate, room cap (max 5), and GitHub Actions CI/CD.

**Ready for first playtest.** The blocking item is: schedule humans.

**Not yet done:** First real playtest, generation quality validation with real API calls, external role mechanical depth.

---

## What Works

- **Phase state machine** — full 5-round loop with timer management, GM controls, pause/extend/jump
- **17 client apps** — all implemented with rich UX (Slack, Signal, Bloomberg, W&B, Security, Intel, Military, arXiv, News, Email, Memo, Twitter, GameState, Briefing, Compute, Substack, Sheets)
- **Desktop window manager** — draggable, resizable, z-ordered windows with dock + menubar + notifications
- **Fog-of-war** — corrected noise formula, faction-based hash seeding, comprehensive property tests
- **Decision/resolution engine** — effects with conditional multipliers, canonical clamping via `STATE_VARIABLE_RANGES`
- **9 ending arcs** — all resolvers implemented, thresholds tuned via 10K-trial Monte Carlo simulation, full branch coverage in tests
- **Content generation** — briefing + app content + NPC trigger + decision generation via Claude API, with retry/validation, fog-safety validation, generation metrics in JSONL, client degradation toast. Model selection: Sonnet for briefings/decisions, Haiku for content/NPC. No pre-authored fallback by design.
- **Decision templates** — 104 templates covering all 5 rounds, all 8 faction/role types, with hard/soft constraint validation and distinctness checks
- **Logging** — buffered JSONL per-room, envelope validation, graceful shutdown on SIGINT/SIGTERM, generation metrics, `scripts/analyze-game.ts` for post-game analysis
- **Dev tools** — URL bootstrap (`?dev=1&round=3&phase=intel&faction=openbrain&role=ob_cto&botMode=all_roles`), GM state sliders, jump-to-phase, fog inspector, endings preview
- **Bot system** — fills empty seats with auto-submitting bots for solo testing
- **Simulation harness** — Monte Carlo with hawk/dove/chaotic/random heuristics, 10K-trial reports, percentile analysis
- **Reconnection** — full state replay on rejoin (messages, content, phase, decisions)
- **Threshold system** — declarative `THRESHOLD_REGISTRY` with 8 thresholds, single dispatch loop
- **Event handler helpers** — `getSocketRoom()`/`getGmRoom()` eliminate validation boilerplate
- **Dead code detection** — `bun run knip` configured and passing clean
- **Production deployment** — Fly.io (sjc), password gate, room cap (5), HMAC cookie auth, rate limiting, GitHub Actions auto-deploy on push to main
- **Deploy tooling** — `scripts/deploy.sh` (pre-flight + deploy + health check), `scripts/fly-setup.sh` (first-time bootstrap)

---

## Bugs

No known bugs (server, client, or shared).

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
| Production 404 on all routes | `process.env["NODE_ENV"]` bracket notation prevents bun build dead-code elimination | 6e9b1f1 |
| Blank page after password auth (wrong MIME types) | Explicit MIME type map in static serving middleware (Hono/node-server strips Bun.file auto-detection) | 6e9b1f1 |

---

## Features Needing Work

### Content Generation

**Status: Full pipeline implemented. LLM generation is the sole content path. Real API quality untested.**

Design principles:
- **Skeleton + flesh** — narrative skeleton (5-round arc, thresholds, endings) is pre-authored; LLM generates the flesh (messages, headlines, decisions) reactive to game state
- **State is source of truth** — LLM reads `StateVariables`, `RoundHistory[]`, `firedThresholds`; never invents state
- **Structured output** — typed JSON matching existing schemas, validated server-side, no client protocol changes
- **No free lunches** — every decision option must have >= 2 positive and >= 2 negative effects, enforced by validation
- **No fallback by design** — if API is down, content is simply missing; degradation toast notifies players

What's fixed (pre-authored, all rounds): Round 1 content, state variable definitions, fog-of-war rules, threshold events, ending arc resolvers, phase structure, activity penalties.

What's generated (Rounds 2-5): briefings, app content (all apps), decisions (template-constrained), NPC messages. Pipeline triggers during resolution of round R-1, caches in `room.generatedRounds[R]`.

What exists:
- Full generation pipeline: briefing + content (news/twitter/slack/email/memo/signal) + NPC triggers + decisions
- 104 decision templates across all 5 rounds, all 8 faction/role types
- Decision validation: hard constraints (3 options, 5-8 effects, no-free-lunch), soft constraints (variable scope, effect bounds), distinctness checks
- Prompt system with faction voices, app voices, round arc templates (3-layer: static system prompt + story bible + round-specific instructions)
- Retry with error feedback (max 2 attempts per artifact)
- Kill switches: `GEN_ENABLED`, `GEN_BRIEFINGS_ENABLED`, `GEN_NPC_ENABLED`, `GEN_DECISIONS_ENABLED`, per-room toggle
- Provider abstraction (Anthropic Claude, with mock for tests). Model selection: Sonnet for briefings/decisions, Haiku for content/NPC.
- Generation is idempotent per room-round (can't re-trigger same round)
- Fog-safety validation — heuristic scan of generated content for leaked hidden state values
- Generation metrics emitted to JSONL game logger (started/success/failure/validation events)
- Client degradation toast — notifies players via macOS-style notification when generation partially fails
- Story bible — accumulates narrative events across rounds, provides LLM "memory" of what happened

What's missing:
- **No live playtesting** — prompt quality, latency, and cost are untested with real API calls

### External Role Balancing

**Status: Rich content, shallow mechanics. Full audit in EXTERNAL-ROLES-AUDIT.md.**

All four external roles (NSA, Journalist, VC, Diplomat) have individual decisions in all 5 rounds and thematic content, but limited mechanical depth:

- **NSA Advisor** — Needs weight theft response options (R2), emergency powers recommendation (R3), strategic posture (R5)
- **Tech Journalist** — ~~Publication impacts are generic~~ — `getPublicationEffects()` implements full angle × target × role matrix (commit `5bf08b9`): safety/hype/geopolitics angles, openbrain/prometheus/china/general targets, journalist ×2 amplifier. Remaining gaps: source cultivation (publishing burns sources, protecting builds trust), feedback loops (faction responses to publications), real-time publishing during deliberation phases.
- **VC/Investor** — Needs board authority decisions (halt/proceed Agent-4), capital leverage (withdraw funding), kingmaker mechanics (broker merger, fund safety)
- **International Diplomat** — Needs counter-offer mechanics for China negotiations, coalition building with durability, leverage mechanisms (EU market access, sanctions)
- **Cross-role interactions** — NSA directs security upgrades, VC pulls funding to pressure labs, diplomat leaks to journalist, journalist tips off NSA

### Diagnostics & Logging

**Status: Complete.** Buffered JSONL per-room, envelope validation, graceful shutdown. All 22 spec'd event types emitting (`room.created`, `player.*`, `game.*`, `phase.*`, `decision.*`, `state.*`, `threshold.fired`, `npc_trigger.fired`, `publish.submitted`, `message.*`, `activity.*`, `generation.*`). Post-game analysis via `scripts/analyze-game.ts`.

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

## Weekend Plan

### P0 — Playtest Prep
1. Smoke test on Fly.io: create room, join 2-3 browsers, advance through phases
2. Run first full playtest with real humans (`GEN_ENABLED=false`)
3. Second playtest with `GEN_ENABLED=true` + `ANTHROPIC_API_KEY` set

### ~~P1 — Before Enabling Generation~~ ✅
~~4. Add concurrent request throttle~~ — Global semaphore (max 5, configurable via `GEN_MAX_CONCURRENT`) in `provider.ts`

### ~~P2 — Logging~~ ✅
~~5. Logger event coverage sweep~~ — All 22 event types already emitting. STATUS was stale.

### P3 — Gameplay
6. External role mechanical depth (see External Role Balancing section above)
7. Journalist publication impacts — faction-specific by story angle
8. Further tune AI Race (stalemate 63.8%) and Open Source (irrelevant 58.1%) arcs

---

## Backlog (GitHub Issues)

| # | Issue |
|---|-------|
| [#1](https://github.com/nwyin/takeoff-protocol/issues/1) | Resolution narrative generation |
| [#2](https://github.com/nwyin/takeoff-protocol/issues/2) | Decision generation v2 with Monte Carlo validation |
| [#3](https://github.com/nwyin/takeoff-protocol/issues/3) | Token usage logging |
| [#4](https://github.com/nwyin/takeoff-protocol/issues/4) | Expand /api/health endpoint |
| [#5](https://github.com/nwyin/takeoff-protocol/issues/5) | GM dashboard: threshold/NPC event visibility |
| [#6](https://github.com/nwyin/takeoff-protocol/issues/6) | Simulation harness: support generated decisions |
| [#7](https://github.com/nwyin/takeoff-protocol/issues/7) | Complete Tailwind migration |
| [#8](https://github.com/nwyin/takeoff-protocol/issues/8) | WandBApp content integration |
| [#9](https://github.com/nwyin/takeoff-protocol/issues/9) | Client component test coverage |
| [#10](https://github.com/nwyin/takeoff-protocol/issues/10) | Server refactoring |
| [#11](https://github.com/nwyin/takeoff-protocol/issues/11) | Client UX gaps (negotiation-pulse CSS, faction maps) |

### Future (Post-Launch)
- Twitter faction bubble system (per-faction algorithmic feed)
- Slack real-time conversational NPCs (LLM-powered, respond to player messages)
- Game replay from JSONL logs (debrief visualizations, "what if" replays)
- Streaming content delivery — progressive content during intel phase instead of batch
