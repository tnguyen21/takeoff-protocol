# Project Status

Last updated: 2026-03-15

---

## Overall

The core game loop is **functional end-to-end**: lobby → 5 rounds of briefing/intel/deliberation/decision/resolution → composite endings. The codebase is ~15K LOC across server/client/shared with 1242 passing tests (0 failures). Deployment infra (Dockerfile + fly.toml) is configured. All known bugs are fixed.

**Not yet done:** First real playtest, production deployment, generation quality validation, external role balancing.

---

## What Works

- **Phase state machine** — full 5-round loop with timer management, GM controls, pause/extend/jump
- **17 client apps** — all implemented with rich UX (Slack, Signal, Bloomberg, W&B, Security, Intel, Military, arXiv, News, Email, Memo, Twitter, GameState, Briefing, Compute, Substack, Sheets)
- **Desktop window manager** — draggable, resizable, z-ordered windows with dock + menubar + notifications
- **Fog-of-war** — corrected noise formula, faction-based hash seeding, comprehensive property tests
- **Decision/resolution engine** — effects with conditional multipliers, canonical clamping via `STATE_VARIABLE_RANGES`
- **9 ending arcs** — all resolvers implemented, full branch coverage in tests
- **Content generation** — briefing + app content + NPC trigger generation via Claude API, with retry/validation/fallback to pre-authored content
- **Logging** — buffered JSONL per-room, envelope validation, graceful shutdown on SIGINT/SIGTERM
- **Dev tools** — URL bootstrap (`?dev=1&round=3&phase=intel&faction=openbrain&role=ob_cto&botMode=all_roles`), GM state sliders, jump-to-phase, fog inspector, endings preview
- **Bot system** — fills empty seats with auto-submitting bots for solo testing
- **Simulation harness** — Monte Carlo with hawk/dove/chaotic/random heuristics, 10K-trial reports
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

**Status: Infrastructure complete. Content quality untested in live play.**

What exists:
- Full generation pipeline: briefing + content (news/twitter/slack/email/memo/signal) + NPC triggers
- Prompt system with faction voices, app voices, round arc templates
- Validation: item budgets, classification distribution, schema conformance
- Retry with error feedback, fallback to pre-authored content
- Kill switches: `GEN_ENABLED`, `GEN_BRIEFINGS_ENABLED`, `GEN_NPC_ENABLED`, per-room toggle
- Provider abstraction (Anthropic Claude, with mock for tests)
- 3,000+ lines of generation tests

What's missing:
- **Decision generation** — Phase D in GENERATIVE-CONTENT.md. Template-constrained generation with Monte Carlo validation. Not started.
- **Resolution narrative generation** — described in design, not implemented.
- **No live playtesting** — prompt quality, latency, and cost are untested with real API calls.
- **GM preview/edit** — open question whether GM should see generated content before emission.
- **Generation metrics not in game logs** — latency, validation failures, fallback rates not captured by the logging system.

### External Role Balancing

**Status: Rich content, shallow mechanics. Full audit in EXTERNAL-ROLES-AUDIT.md.**

All four external roles (NSA, Journalist, VC, Diplomat) have excellent thematic content but limited agency:

**NSA Advisor:**
- No individual decisions after Round 1
- No emergency powers, security directives, or cross-faction negotiation mechanics
- Proposed: Rounds 2-5 decisions (weight theft response, emergency powers, strategic posture)

**Tech Journalist:**
- Publication impacts are generic (all story types hit same variables same way)
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
- Health check endpoint: `/api/health` (returns room count)

What's missing:
- No actual Fly.io deployment done
- No load testing (14 concurrent WebSocket connections with real-time state)
- No reconnection testing under real network conditions
- No cross-browser testing
- No mobile considerations documented (presumably desktop-only)
- WSS/HTTPS not validated in practice

### Diagnostics & Logging

**Status: Logger implemented, analysis tools partially built.**

What exists:
- JSONL per-room logging with envelope validation
- Events: phase changes, decisions, state deltas, thresholds, NPC triggers, messages, activity, penalties
- `scripts/analyze-game.ts` (per-game summary) — tested with fixtures
- Graceful shutdown: flushes on SIGINT/SIGTERM and room cleanup

What's missing:
- Client activity reporting is basic (which apps opened, not dwell time or focus tracking)
- No `compare-games.ts` (cross-session analysis)
- Generation metrics not integrated into game logs
- No real-time GM visibility into structured logs during a game
- No replay capability from JSONL logs

### Game Balance

**Status: Simulation reveals concerning outcome distributions.**

From 10,000 random-heuristic trials:

| Arc | Issue |
|-----|-------|
| AI Race | 0% OB dominant — **outcome is unreachable** |
| Alignment | 86.9% genuinely aligned — **dominates, too easy** |
| Control | 83.3% government controlled — **dominates** |
| Economy | 86.7% disruption with adaptation — **dominates** |
| US-China | Well-distributed (1.6%-36.7%) |
| Public Reaction | Healthy balance (50.5% anxious, 48.8% optimistic) |
| Taiwan | Well-distributed |
| Open Source | Distributed |

Missing:
- No hawk/dove mixed-heuristic simulation reports (most realistic scenario)
- Balance tuning scripts (`scale-deltas.ts`, `fix-directional-bias.ts`, `fix-gap-bias.ts`) are one-shot tools with no tests — fragile to re-run
- Ending arc threshold values need tuning based on simulation + playtesting

---

## Test Quality

### Fixed (from AUDIT-TESTS.md)
- `events.test.ts` shadow testing → complete rewrite, now tests real handlers via `registerGameEvents`
- `activity.test.ts` local copy → now imports real `applyActivityPenalties`
- Clamping bounds inconsistency → canonical `STATE_VARIABLE_RANGES`
- Fog noise tests → property test verifying estimates within confidence bounds
- Ending arc tests → 41 new tests covering all 9 resolver branches

### Current Coverage
- 1242 pass, 2 skip, 0 fail across 40 test files
- Server: events, game, rooms, devBots, activity, decision-cycle, reconnect, cleanup, updateStoryBible + generation suite (3,000+ lines) + logger suite (400+ lines)
- Client: ErrorBoundary component tests + utility tests across all apps
- Shared: resolution, fog, endings with property tests
- Scripts: analyze-game tested with fixtures

### Remaining Gaps
- `emitResolution` not exported from `game.ts` — no direct unit tests, covered indirectly
- No end-to-end tests (real browser + server)

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

### P0 — Fix Before First Playtest
All P0 items are fixed. See "Bugs Fixed" table.

### P1 — Fix Before Hosting
All P1 code bugs are fixed. Remaining:
1. Deploy to Fly.io and smoke test
2. Run at least one full playtest with real humans

### P2 — Enrich Gameplay
7. Add external role individual decisions (NSA R2-5, VC board authority, diplomat negotiation)
8. Make journalist publication impacts faction-specific (story angle system)
9. Tune ending arc thresholds (alignment too easy, OB dominant unreachable)
10. Implement decision generation (Phase D from GENERATIVE-CONTENT.md)

### P3 — Polish
11. Add client dwell-time tracking for activity reports
12. Build `compare-games.ts` analysis script
13. Twitter faction bubble system
14. Real-time NPC responses (Slack Option B)
15. WandBApp content integration (currently static data in most tabs)
