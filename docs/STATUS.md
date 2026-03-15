# Project Status

Last updated: 2026-03-15

---

## Overall

The core game loop is **functional end-to-end**: lobby → 5 rounds of briefing/intel/deliberation/decision/resolution → composite endings. The codebase is ~15K LOC across server/client/shared with 1189 passing tests (0 failures). Deployment infra (Dockerfile + fly.toml) is configured. All P0 bugs are fixed.

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

| Priority | Bug | Location | Notes |
|----------|-----|----------|-------|
| HIGH | `replayPlayerState` skips generated content on reconnect | game.ts | Calls `getBriefing`/`getContentForPlayer` directly, bypassing generated-content merge. Reconnecting players see pre-authored content while others see generated. Partially fixed (uses `getMergedContentForPlayer`) but generated briefings still not replayed. |
| HIGH | `history[].stateAfter` records pre-penalty state | game.ts ~line 237 | Comment says "will be updated by resolution" but nothing updates it. Misleading for generation context and analysis. |
| MEDIUM | Decision option IDs not validated on submit | events.ts:359 | Any string accepted and written to `room.decisions`. Only caught in `emitResolution`. |
| MEDIUM | No room cleanup lifecycle | rooms.ts, game.ts:20, extendUses.ts | `rooms` Map, `phaseTimers` Map, and `extendUses` Map grow forever. Abandoned rooms never pruned. |
| MEDIUM | `getContentForPlayer` doesn't dedup by app | content/loader.ts | Two registrations for the same `(faction, app)` pair produce duplicate content blocks. |
| LOW | GM receives duplicate messages if also a player | events.ts:482 | Unconditional GM echo in team chat. |
| LOW | `tweet:send` ID not UUID-safe | events.ts:635 | Uses `Date.now()` + 4-char socket suffix. Collision risk under concurrent sends. |
| LOW | DMs to bot socket IDs silently fail | events.ts:296 | Socket.IO no-ops. No error returned. |
| LOW | No input length guards on player messages | events.ts | `message:send` and `publish:submit` content is unlimited. Low risk for closed audience. |

### Client

| Priority | Bug | Location | Notes |
|----------|-----|----------|-------|
| MEDIUM | Desktop subscribes to entire game store | screens/Desktop.tsx:37 | No selector — re-renders on every state change (GM decision status, timer ticks, etc). |
| MEDIUM | `getContentForApp` called per-window per-render | screens/Desktop.tsx:82-83 | Filters entire content array for every visible window on every render. Memoize a `contentByApp` map. |
| MEDIUM | Decision auto-submit stale closure | screens/Decision.tsx:135-139 | `handleSubmit` captures choice values at creation time. Timer fire after selection change submits stale values. |
| MEDIUM | `negotiation-pulse` CSS class applied but never defined | desktop/Dock.tsx:95 | Signal icon produces no visual effect during Round 4 negotiation. Only `dock-pulse` is defined. |
| MEDIUM | PublishNotificationBanner — only oldest notification auto-dismisses | components/PublishNotificationBanner.tsx:12-21 | Notifications 2 and 3 linger past 6-second target. |
| MEDIUM | SignalApp O(n²) contact sort | apps/SignalApp.tsx:340-349 | Sort comparator calls `messages.filter(...)` twice per comparison. Pre-compute last timestamp per contact. |
| MEDIUM | SignalApp unread counts in render body | apps/SignalApp.tsx:151-167 | Computed via loops on every render including every keystroke. Needs `useMemo`. |
| MEDIUM | UIStore `openWindow`/`focusWindow` read `get()` outside updater | stores/ui.ts:113-135 | Race if two calls happen in same microtask. Use `set(s => ...)` pattern. |
| LOW | WandBApp ignores `content` prop | apps/WandBApp.tsx:129 | Renders fully static data regardless of server content. |
| LOW | Dead `notifications` field in UIStore | stores/ui.ts:20 | Shadows browser global. Actual system in `stores/notifications.ts`. |
| LOW | `Ending.tsx` passthrough wrapper | screens/Ending.tsx:295-297 | Returns `<DebriefScreen />` with no logic. Dead indirection. |
| LOW | Inline `<style>` injected on every render | Dock.tsx, MenuBar.tsx, Notifications.tsx, NewsApp.tsx | CSS animations as inline `<style>` elements. Move to global stylesheet. |
| LOW | Faction display maps scattered | Lobby, Resolution, MenuBar, GMDashboard | 5 slightly different versions of faction-to-display mapping. Consolidate. |
| LOW | MemoApp page lookup by mutable title | apps/MemoApp.tsx:238 | `allPages.find(p => p.title === effectiveTitle)` — if title changes between content deliveries, selected page changes silently. |
| LOW | Suppressed `exhaustive-deps` ESLint warnings | Briefing.tsx:68, Resolution.tsx:114 | Behavior is correct today but conceals dependency chain from future readers. |

### Shared

| Priority | Bug | Location | Notes |
|----------|-----|----------|-------|
| LOW | `globalMediaCycle` typed as `number` | types.ts:55 | Should be `0 \| 1 \| 2 \| 3 \| 4 \| 5` or a proper enum. Allows fractional mid-enum states. |
| LOW | `resolveOpenSource` dead branch | endings.ts:255-256 | Explicit `if` condition and fallthrough both return 3. The `if` is dead code. |
| LOW | `resolveAiRace` undocumented tie-break | endings.ts:143-146 | `chinaClose` checked before `promClosing` with no mutual exclusion guard. If both true, China parity silently wins. |
| LOW | `SCALING_GUIDE` no fallback for out-of-range | constants.ts:148-156 | `SCALING_GUIDE[7]` is undefined. No guard or documented invariant. |

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
- 1189 pass, 2 skip, 0 fail across 40 test files
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
1. Fix `replayPlayerState` to use generated briefings/content on reconnect
2. Fix `history[].stateAfter` to record post-penalty state
3. Add room cleanup lifecycle (TTL pruning for rooms, timers, extendUses)
4. Validate decision option IDs on submit
5. Deploy to Fly.io and smoke test
6. Run at least one full playtest with real humans

### P2 — Enrich Gameplay
7. Add external role individual decisions (NSA R2-5, VC board authority, diplomat negotiation)
8. Make journalist publication impacts faction-specific (story angle system)
9. Tune ending arc thresholds (alignment too easy, OB dominant unreachable)
10. Implement decision generation (Phase D from GENERATIVE-CONTENT.md)

### P3 — Polish
11. Desktop performance (Zustand selectors, memoize contentByApp)
12. Fix `negotiation-pulse` CSS, notification timer, inline style cleanup
13. Add client dwell-time tracking for activity reports
14. Build `compare-games.ts` analysis script
15. Twitter faction bubble system
16. Real-time NPC responses (Slack Option B)
