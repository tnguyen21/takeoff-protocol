# Project Status

Last updated: 2026-03-17

---

## Overall

The core game loop is **functional end-to-end**: lobby → 5 rounds of briefing/intel/deliberation/decision/resolution → composite endings. The codebase is ~15K LOC across server/client/shared with 1337 passing tests (0 failures). Deployment infra (Dockerfile + fly.toml) is configured. All known bugs are fixed.

**Ready for first playtest.** The blocking items are: push to remote, deploy to Fly.io, schedule humans.

**Not yet done:** First real playtest, production deployment, generation quality validation with real API calls, external role mechanical depth, monitoring/observability improvements.

---

## What Works

- **Phase state machine** — full 5-round loop with timer management, GM controls, pause/extend/jump
- **17 client apps** — all implemented with rich UX (Slack, Signal, Bloomberg, W&B, Security, Intel, Military, arXiv, News, Email, Memo, Twitter, GameState, Briefing, Compute, Substack, Sheets)
- **Desktop window manager** — draggable, resizable, z-ordered windows with dock + menubar + notifications
- **Fog-of-war** — corrected noise formula, faction-based hash seeding, comprehensive property tests
- **Decision/resolution engine** — effects with conditional multipliers, canonical clamping via `STATE_VARIABLE_RANGES`
- **9 ending arcs** — all resolvers implemented, thresholds tuned via 10K-trial Monte Carlo simulation, full branch coverage in tests
- **Content generation** — briefing + app content + NPC trigger + **decision generation** via Claude API, with retry/validation/fallback to pre-authored content
- **Decision templates** — 104 templates covering all 5 rounds, all 8 faction/role types, with hard/soft constraint validation and distinctness checks
- **Logging** — buffered JSONL per-room, envelope validation, graceful shutdown on SIGINT/SIGTERM
- **Dev tools** — URL bootstrap (`?dev=1&round=3&phase=intel&faction=openbrain&role=ob_cto&botMode=all_roles`), GM state sliders, jump-to-phase, fog inspector, endings preview
- **Bot system** — fills empty seats with auto-submitting bots for solo testing
- **Simulation harness** — Monte Carlo with hawk/dove/chaotic/random heuristics, 10K-trial reports, percentile analysis
- **Reconnection** — full state replay on rejoin (messages, content, phase, decisions)

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
| `ROUND_DECISIONS` triplicated across 3 files | Single export in `content/decisions/rounds.ts` | (earlier) |
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
| `analyze-bias.ts` referenced `decisions.collective` | Now checks `.team` with `.collective` fallback | (earlier) |
| `globalMediaCycle` typed as `number` | Tightened to `MediaCycle` union type (`0\|1\|2\|3\|4\|5`) | 86ee23d |
| `resolveOpenSource` dead branch | Removed redundant `if` (both paths returned 3) | 7df3c48 |
| `resolveAiRace` undocumented tie-break | Added comment documenting China parity priority | 1b22db3 |
| `SCALING_GUIDE` no fallback for out-of-range | Added `getScalingGuide()` helper with clamping | 4611654 |
| `negotiation-pulse` CSS class undefined | Already defined in index.css lines 22-34 | (was false positive) |
| UIStore `openWindow`/`focusWindow` race | Refactored to `set(s => ...)` pattern | 7df3c48 |
| Dead `notifications` field in UIStore | Removed field and interface | 7df3c48 |
| Faction display maps scattered | Already consolidated in `constants/factions.ts` | (was false positive) |
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

**Status: Decision generation implemented. Briefing/NPC generation implemented. Real API quality untested.**

What exists:
- Full generation pipeline: briefing + content (news/twitter/slack/email/memo/signal) + NPC triggers + **decisions**
- 104 decision templates across all 5 rounds, all 8 faction/role types
- Decision validation: hard constraints (3 options, 5-8 effects, no-free-lunch), soft constraints (variable scope, effect bounds), distinctness checks
- Prompt system with faction voices, app voices, round arc templates
- Validation: item budgets, classification distribution, schema conformance
- Retry with error feedback, fallback to pre-authored content
- Kill switches: `GEN_ENABLED`, `GEN_BRIEFINGS_ENABLED`, `GEN_NPC_ENABLED`, `GEN_DECISIONS_ENABLED`, per-room toggle
- Provider abstraction (Anthropic Claude, with mock for tests)
- 3,500+ lines of generation tests

What's missing:
- **Resolution narrative generation** — described in GENERATIVE-CONTENT.md Phase C. Current resolution narrative is a generic template (~4 sentences), not LLM-generated reactive prose.
- **No live playtesting** — prompt quality, latency, and cost are untested with real API calls.
- **Decision quality validation** — no Monte Carlo simulation check before emitting generated decisions (structural validation only, no balance check).
- **GM preview/edit** — open question whether GM should see generated content before emission.
- **Generation metrics not in game logs** — latency, token usage, validation failures, fallback rates not captured by the logging system (only logged to stdout).

### External Role Balancing

**Status: Rich content, shallow mechanics. Full audit in EXTERNAL-ROLES-AUDIT.md.**

All four external roles (NSA, Journalist, VC, Diplomat) have individual decisions in all 5 rounds and thematic content, but limited mechanical depth:

**NSA Advisor:**
- Has individual decisions all 5 rounds (basic: recommend policy, allocate attention)
- No emergency powers, security directives, or cross-faction enforcement mechanics
- Proposed: weight theft response decisions, emergency powers invocation, lab security directives

**Tech Journalist:**
- Publication impacts are generic (all story types hit same variables: publicAwareness, publicSentiment)
- No source cultivation/burnout, no faction-specific publication effects, no feedback loop
- Proposed: Story angle system with asymmetric faction impacts, source mechanics

**VC/Investor:**
- Board seats are narrative only — no voting, blocking, or resignation mechanics
- No capital withdrawal decisions, kingmaker options, or market manipulation
- Proposed: Board authority decisions, capital leverage, merger brokering

**International Diplomat:**
- Pre-built decision menus, not actual negotiations
- No coalition-building, failure risk, or leverage mechanisms
- Proposed: Counter-offer mechanics, coalition durability, EU/Global South leverage

**Cross-role interactions:** None implemented. NSA can't direct labs. VC can't block lab actions. Journalist publications don't cascade to specific factions. Diplomat can't leak to journalist.

### Hosting & Deployment

**Status: Config ready, no actual deployment.**

What exists:
- Dockerfile: multi-stage build, properly structured
- fly.toml: sjc region, 512MB RAM, auto-scale 0→N, persistent log volume, force_https
- Health check endpoint: `/api/health` (returns room count only)

What's missing:
- No actual Fly.io deployment done
- No load testing (14 concurrent WebSocket connections with real-time state)
- No reconnection testing under real network conditions
- No cross-browser testing
- No mobile considerations documented (presumably desktop-only)
- WSS/HTTPS not validated in practice

### Diagnostics & Logging

**Status: Logger implemented with structured JSONL. Significant observability gaps.**

What exists:
- JSONL per-room logging with envelope validation (sessionId, serverTime, eventId, schemaVersion)
- Events: phase changes, decisions, state deltas/snapshots, thresholds, NPC triggers, messages, activity, penalties, GM overrides
- `scripts/analyze-game.ts` (per-game summary) — tested with fixtures
- Graceful shutdown: flushes on SIGINT/SIGTERM and room cleanup
- Generation metrics logged to stdout (start/success/failure/fallback per artifact)

What's missing:
- **Generation metrics not in JSONL** — token usage, cost, retry counts, cache hit rates only on stdout
- **No error events in JSONL** — exceptions go to stderr, not queryable/replayable
- **Health endpoint minimal** — only room count; no memory, socket count, generation status, logger health
- **GM has no generation visibility** — can't see if generation is pending/ready/failed for current round
- **GM has no NPC/threshold log** — threshold.fired and npc_trigger.fired events exist but aren't surfaced in GM dashboard
- **Client activity basic** — which apps opened per phase, no dwell time, no focus tracking, no interaction events
- **No `compare-games.ts`** (cross-session analysis)
- **No replay capability** from JSONL logs (events replayable, UI state not)
- **No socket health tracking** — no disconnect reason, reconnection frequency, connection latency
- **No phase transition latency** — no measurement of time from advancePhase to client receipt

### Game Balance

**Status: Significantly improved after threshold tuning. Two arcs still skewed.**

From 10,000 random-heuristic trials (with generated decision templates):

| Arc | Distribution | Status |
|-----|-------------|--------|
| AI Race | 63.8% stalemate, rest distributed | Stalemate dominates — structural (pre-authored decisions narrow) |
| Alignment | Max outcome 44.0% | Well-distributed after tuning |
| Control | Max outcome 53.6% (government) | Slightly high — structural ceiling (securityLevelOB caps at 5) |
| Economy | Max outcome 45.7% | Acceptable after tuning |
| US-China | Max outcome 45.1% | Well-distributed after tuning |
| Public Reaction | Max outcome 42.8% | Healthy |
| Taiwan | Distributed | Healthy |
| Open Source | 58.1% irrelevant | Skewed — needs tuning |
| Prometheus | Distributed | Healthy |

Hawk/dove heuristic simulations confirm strategic play produces dramatically different outcomes (e.g., US-China: hawk 94.2% cold war vs dove 0.2%).

Remaining concerns:
- AI Race stalemate at 63.8% — may need pre-authored decision effect adjustments
- Open Source irrelevant at 58.1% — threshold tuning or effect changes needed
- Control government at 53.6% — close to acceptable; structural limitation from securityLevelOB ceiling
- No hawk/dove mixed-heuristic simulation (most realistic scenario)

---

## Test Quality

### Fixed (from AUDIT-TESTS.md)
- `events.test.ts` shadow testing → complete rewrite, now tests real handlers via `registerGameEvents`
- `activity.test.ts` local copy → now imports real `applyActivityPenalties`
- Clamping bounds inconsistency → canonical `STATE_VARIABLE_RANGES`
- Fog noise tests → property test verifying estimates within confidence bounds
- Ending arc tests → 41 new tests covering all 9 resolver branches

### Current Coverage
- 1337 pass, 2 skip, 0 fail across 44 test files
- Server (905 tests): events, game, rooms, devBots, activity, decision-cycle, reconnect, cleanup, updateStoryBible + generation suite (3,500+ lines: validate, decisions, orchestrator, context, briefing, cache, provider, config, content, npc) + logger suite (400+ lines)
- Client (340 tests): ErrorBoundary, Decision, PublishNotificationBanner component tests + utility tests across all 13 app modules + UI store
- Shared (92 tests): resolution, fog, endings with property tests

### Coverage Gaps

**Critical (high risk, no tests):**
- **Client stores: `game.ts`, `messages.ts`, `notifications.ts`** — all game state mutations (submitDecision, phase changes, session persistence, reconnection state) are untested
- **Client socket integration (`socket.ts`)** — reconnection retry logic on client side untested
- **Concurrent decision submission** — no test for race between two simultaneous `decision:submit` calls

**High (moderate risk):**
- **Desktop window manager** (`Window.tsx`, `MenuBar.tsx`, `Dock.tsx`) — drag, resize, z-order, bounds checking all untested
- **Client screens** (`Desktop.tsx`, `Lobby.tsx`, `Ending.tsx`, `Resolution.tsx`, `GMDashboard.tsx`, `Briefing.tsx`) — no component tests
- **Generation error paths** — timeout/parse/validation failures tested in isolation but not in full orchestration flow
- **`emitResolution`** — not exported from `game.ts`, no direct unit tests, covered indirectly via advancePhase

**Medium (lower risk):**
- **17 app components** (EmailApp, SlackApp, etc.) — only utility functions tested, not React components
- **`fog.ts` edge cases** — `applyNoise` and `hashString` only integration-tested, no unit tests
- **`activityPenalties.ts` edge cases** — unknown roles, empty activity, round=0 not tested
- **Simulation harness** — no tests for Monte Carlo or sampler logic itself
- **51 content data files** — static data, lower risk but no schema validation at file level

**Structural:**
- No end-to-end tests (real browser + server)
- `bun test` from repo root fails 36 client tests (happy-dom preload not picked up); `bun run test` works fine — confusing but not a real bug

---

## Refactoring Opportunities

These are not bugs but would improve maintainability:

| Item | Location | Impact |
|------|----------|--------|
| `checkThresholds` is a 350-line monolith (8 handlers) | game.ts:543-898 | Convert to descriptor array + dispatch loop |
| GM authorization guard repeated 9+ times | events.ts | Extract `requireGMRoom(socket)` helper |
| `game:phase` emit duplicated in 6 call sites | game.ts | Extract `emitPhase(io, room)` |
| `isLeader` derivation triplicated | rooms.ts:92, events.ts:732,757 | Shared helper using `isLeaderRole()` |
| `GMDashboard.tsx` is 700+ lines | screens/GMDashboard.tsx | Split into panel components |
| Mixed inline styles and Tailwind | Decision.tsx, Resolution.tsx, Briefing.tsx, Ending.tsx | Pick one approach |
| Socket listeners not teardown-friendly | stores/game.ts, stores/messages.ts | Fine for single-session, blocks future leave-room flows |
| `use-sound` dependency unused | client/package.json | Remove (custom `soundManager` used instead) |
| `initializeStoryBible` side-effect in `buildGenerationContext` | generation/context.ts | Surprising mutation in a read-like function. Move to explicit init at room creation. |
| `injectNewsContent` and `publish:submit` near-duplicate | events.ts | Both build ContentItem + Publication + emit `game:publish`. Factor into shared helper. |
| Migration scripts unarchived | scripts/ | `scale-deltas.ts`, `fix-directional-bias.ts`, `fix-gap-bias.ts`, `targeted-rebalance.ts` are one-shot tools with no tests. Delete or archive. |

---

## Priority Recommendations

### P0 — Deploy & Playtest
All code bugs are fixed. Next steps:
1. Push to remote (2 unpushed commits on main)
2. Deploy to Fly.io and smoke test
3. Run first full playtest with real humans

### P1 — Monitoring & Observability
4. Add generation metrics to JSONL (token usage, cost, retry counts, fallback rates)
5. Expand `/api/health` (memory, socket count, generation pipeline status, logger health)
6. Add generation status visibility to GM dashboard (pending/ready/failed per artifact)
7. Surface threshold/NPC trigger events in GM dashboard
8. Add structured error events to JSONL (categorized by component: generation/game/socket/logger)
9. Track socket health (disconnect reasons, reconnection frequency, latency)

### P2 — Gameplay Enrichment
10. Implement resolution narrative generation (Phase C — LLM-generated reactive prose)
11. Implement publisher impact system (story angle → faction-specific variable effects)
12. Add VC board authority mechanics (vote to block, capital withdrawal, merger brokering)
13. Add diplomat negotiation mechanics (counter-offers, coalition durability, failure risk)
14. Enhance NSA decisions (emergency powers, lab security directives, cross-faction enforcement)
15. Further tune AI Race (stalemate 63.8%) and Open Source (irrelevant 58.1%) arcs
16. Add decision generation quality checks (Monte Carlo simulation before emission)

### P3 — Testing Gaps
17. Test client stores (`game.ts`, `messages.ts`, `notifications.ts`) — session persistence, state mutations, reconnection
18. Test concurrent decision submission race conditions
19. Test generation error paths in full orchestration (timeout → retry → fallback flow)
20. Add desktop window manager tests (drag, resize, z-order, bounds)
21. Add client screen component tests (at least GMDashboard, Decision, Ending)
22. Fix root-level `bun test` to pick up client happy-dom preload

### P4 — Polish
23. Add client dwell-time tracking for activity reports
24. Build `compare-games.ts` analysis script
25. Twitter faction bubble system (per-faction tweet filtering)
26. Real-time content streaming (stagger emissions during intel phase)
27. WandBApp content integration (currently static data in most tabs)
28. Clean up stale local branches (`add-biome-linter`, `feat/full-round-templates-threshold-tuning`, `update-types-bun-1.3.10`)
29. Delete/archive one-shot migration scripts
