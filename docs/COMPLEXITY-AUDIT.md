# Complexity Audit

Date: 2026-03-17

---

## TL;DR

The codebase is **~30K LOC** across 3 packages. **~21K of that is static content data** (pre-authored game text in TypeScript arrays). Actual logic is ~9K LOC. The architecture is sound but has accumulated some complexity debt. Tests are plentiful (1,337) but only ~36% are meaningfully catching bugs — the rest are marginal or tautological.

---

## LOC Breakdown

| Package | Source LOC | Test LOC | What It Is |
|---------|-----------|----------|------------|
| **shared** | 1,137 | ~1,100 | Types, constants, resolution, fog, endings |
| **server (logic)** | 7,600 | ~13,400 | Game loop, events, generation pipeline, logger |
| **server (content)** | 21,408 | — | Static game data: briefings, decisions, app content, NPC |
| **client** | 9,200 | ~2,400 | React UI: stores, screens, 17 apps, desktop WM |
| **Total** | **39,345** | **~16,900** | |
| **Total (logic only)** | **~17,937** | | Excluding static content |

**Key insight:** 81% of the server package is static content data — TypeScript arrays of game text. This isn't complexity; it's content. The actual logic surface is ~18K LOC.

---

## Package Assessments

### shared (1,137 LOC) — Clean

5 files. Well-organized. Types, game constants, resolution engine, fog-of-war, ending arc resolvers.

**Issues found:**
- **Dead exports in constants.ts:** `SCALING_GUIDE`, `getScalingGuide()`, `LEADER_ROLES`, `ScalingGuideEntry`, `FactionConfig` — all defined, none imported anywhere.
- **Dead type exports in types.ts:** `OpenBrainRole`, `PrometheusRole`, `ChinaRole`, `ExternalRole`, `EndingArcId`, `MediaCycle` — individual role union members exported but never imported standalone.
- **Questionable logic in endings.ts:** `resolveAlignment()` has `if (s.alignmentConfidence >= 25 || s.misalignmentSeverity <= 60) return 1` — the OR makes this almost always true given value ranges (0-100). Likely should be AND.
- **Magic thresholds:** Ending arc resolvers have numeric thresholds (65, 70, 80, 85) with no inline rationale.

**Verdict:** Low complexity. Delete the dead exports. Check the alignment OR condition.

---

### server — logic (7,600 LOC) — Moderate Complexity, 2 Hot Spots

**Good:**
- Generation pipeline (orchestrator → generators → provider → validation) is well-structured
- Logger system is appropriately scoped (not over-engineered)
- Content loader is clean (114 LOC, data-driven filtering)
- Room management is simple
- No circular dependencies

**Hot spots:**

1. **`game.ts` — `checkThresholds()` (358 LOC)**
   The worst function in the codebase. 8 threshold handlers copy-pasted with the same pattern: check fired set → check state → mutate state → create notification → inject news → log. Should be a declarative data structure + loop. ~100 LOC reduction possible.

2. **`events.ts` — `registerGameEvents()` (830 LOC)**
   40+ socket.on() handlers in one function. Each handler repeats the same room/code validation boilerplate (~15 times). Extract a `requireRoom(socket)` helper. Not urgent but noisy.

**Dead code:**
- `STATE_LABELS` in game.ts (40 LOC) — exported but never imported anywhere
- `buildNarrative()` — exported but only called internally from `emitResolution()`

**Generation pipeline — over-engineered?**
Partially. The 4 generators (briefing, content, npc, decisions) follow identical patterns: prompt builder → provider call → validation → retry. Could extract a common `generateWithRetry<T>()` wrapper to eliminate ~400 LOC of duplication. But each has domain-specific schemas and validation, so the current separation is defensible.

**Verdict:** Two functions need refactoring (checkThresholds, requireRoom extraction). Generation pipeline is fine — structured repetition, not accidental complexity.

---

### server — content (21,408 LOC) — Data, Not Code

53 TypeScript files containing zero computation. Pure static arrays of game text registered via `registerContent()`.

- **320 pre-authored decision options** across 5 rounds (5,383 LOC)
- **104 decision templates** for LLM generation (1,228 LOC)
- **~16K LOC** of app content (Slack messages, emails, news, memos, etc.)
- 4 factions × 8 app types × 5 rounds = repetitive structure

**Could this be JSON/YAML?** Yes. The TypeScript wrapper gives type safety and allows `registerContent()` calls, but the data itself is pure structured text. Migration to JSON + a loader would cut ~30-40% LOC and improve content editing ergonomics. Not urgent — the current approach works.

**Verdict:** This isn't complexity. It's content volume. Ignore for complexity concerns.

---

### client (9,200 LOC) — One Bad File, Otherwise Fine

**Good:**
- 4 Zustand stores with clear separation (game, messages, notifications, ui)
- 17 app components all pull their weight — none are trivial wrappers
- Desktop window manager (Window, MenuBar, Dock, Notifications) is appropriately complex
- Socket integration is clean (all listeners in stores, not scattered)
- No dead code found

**Problems:**

1. **`GMDashboard.tsx` (1,292 LOC)** — Largest file in the entire codebase. 10+ inline sub-components: timer control, state inspection, decision status, activity tracking, ending arc visualization. Needs to be split into a `screens/gm/` module with 5-7 files.

2. **`Decision.tsx` (499 LOC)** — Inline RadioGroup component (56 LOC), leader vs. non-leader UI fork, multiple useRef for stale closure avoidance, heavy inline styles. Could extract RadioGroup + split leader/non-leader views.

3. **`Lobby.tsx` (398 LOC)** — Three-step wizard (name → room → role) crammed into one component with early-exit conditionals and deeply nested JSX (87 lines in the faction grid alone).

4. **`wandbUtils.ts` (769 LOC)** — Static chart data, transform functions, and type definitions all in one file. Should split into data/transforms/types.

5. **Mixed styling** — Some components use Tailwind classes, others use inline `style={{}}` objects. No consistent approach.

6. **`game.ts` store (569 LOC)** — 30+ state fields, 19 socket listeners, module-level mutable state for sequencing. Getting large but not yet unmanageable. Socket listeners could move to a separate module.

**Verdict:** Split GMDashboard. The rest is at the edge of acceptable — refactor only if actively working in those files.

---

## Test Quality Audit

### The Numbers

| Category | Tests | % | Description |
|----------|-------|---|-------------|
| **VALUABLE** | ~480 | 36% | Tests real contracts, would catch regressions |
| **MARGINAL** | ~420 | 31% | Tests something, unlikely to catch real bugs |
| **WASTEFUL** | ~290 | 22% | Tautological, tests implementation details |
| **GAPS** | ~147 items | 11% | Important behaviors with no tests |

### Most Valuable Tests

1. **decision-cycle.test.ts** — Full integration: submission → resolution → fog → penalties → history. The best test file.
2. **activity.test.ts** — Precise penalty logic testing with boundary clamping.
3. **index.test.ts (shared)** — Resolution, immutability, clamping, fog-of-war property tests.
4. **npc.test.ts** — Trigger uniqueness, structural validity, round window filtering.
5. **rooms.test.ts** — Reconnect replay: NPC privacy, faction scoping, DM delivery.

### Most Wasteful Tests

1. **devBots.test.ts** — 60% waste. Tests bot ID determinism (tautological: same input → same output), string formatting regex, `pickRandomOption()` tested 4 times for a 5-line function.
2. **npcPersonas.test.ts** — 55% waste. Tests that `NPC_PERSONAS` mirrors `NPC_IDS` — if they're built from the same source, this is guaranteed.
3. **provider.test.ts** — Tests that MockProvider returns what you gave it. The purpose of a mock IS to return your data.
4. **cache.test.ts** — Tests "empty cache returns undefined" three different ways.
5. **config.test.ts** — Tests `"true"` → `true` and `"false"` → `false` env var parsing.
6. **Client utility tests** (emailUtils, gameStateUtils, slackUtils, twitterUtils, substackUtils) — Many test trivial functions: `toggleLike({liked:false})` returns `{liked:true}`, `getBarColor(60)` returns `"green-500"`. These are lookup table inversions, not behavior tests.

### Critical Test Gaps

1. **Client stores (game.ts, messages.ts, notifications.ts)** — All game state mutations untested. Session persistence, phase resets, reconnection state — zero coverage.
2. **Concurrent decision submission** — Server handles simultaneous submits from different players but never tested.
3. **Generation error orchestration** — Individual generator retry is tested, but partial artifact failure (briefing fails, content succeeds → status should be "failed") is not.
4. **Desktop window manager** — Drag, resize, z-order, auto-minimize — all untested.

---

## Complexity Verdict

### What's Actually Complex (and should be)

- **9 ending arc resolvers** — Multi-variable conditional logic. Tuned via simulation. Inherently complex.
- **Fog-of-war matrix** — 33 state variables × 4 factions × accuracy levels. Core mechanic.
- **Decision resolution engine** — Effects with conditional multipliers, clamping, history tracking. Can't simplify.
- **Generation pipeline** — LLM calls with retry, validation, fallback, caching. Justified complexity.
- **Desktop window manager** — Simulates macOS. Drag, resize, z-order, minimize/maximize. It is what it is.

### What's Complex and Shouldn't Be

| Problem | Size | Fix | Effort |
|---------|------|-----|--------|
| `checkThresholds()` monolith | 358 LOC | Declarative threshold registry + loop | 2h |
| `GMDashboard.tsx` god component | 1,292 LOC | Split into `screens/gm/` module | 3h |
| Repeated room validation in events.ts | ~15 instances | Extract `requireRoom()` helper | 1h |
| `Decision.tsx` inline RadioGroup | 56 LOC | Extract to component | 30m |
| Mixed Tailwind/inline styles | Scattered | Standardize on Tailwind | 4h |
| `wandbUtils.ts` blob | 769 LOC | Split data/transforms/types | 1h |

### What Looks Complex but Isn't

- **21K LOC of content** — It's data, not code. Ignore for complexity assessment.
- **17 client apps** — Each is a self-contained content viewer. No unnecessary abstraction.
- **4 Zustand stores** — Right tool, right granularity. `game.ts` is large but not tangled.
- **Logger system** — Buffer, validate, flush. Exactly as complex as it needs to be.

### What's Missing (Not a Complexity Problem)

- No end-to-end tests
- No monitoring/observability in production
- No live playtest validation of LLM generation quality
- No deployment done

---

## Recommendations

### Do Now (Before Next Feature Work)

1. **Delete dead exports from shared/constants.ts** — `SCALING_GUIDE`, `getScalingGuide`, `LEADER_ROLES`, `ScalingGuideEntry`, `FactionConfig`. Zero consumers.
2. **Delete `STATE_LABELS` from server/game.ts** — 40 LOC, never imported.
3. **Check `resolveAlignment` OR → AND** — The `||` on line 165 of endings.ts looks like a bug. Verify with simulation.

### Do Soon (High ROI Refactors)

4. **Split `GMDashboard.tsx`** into `screens/gm/` module — the single highest-impact refactor.
5. **Refactor `checkThresholds()`** to declarative registry — eliminates 358 LOC monolith.
6. **Extract `requireRoom()` helper** in events.ts — removes 15× boilerplate.

### Don't Do (Traps)

- **Don't migrate content to JSON/YAML** — TypeScript works fine. Migration effort >> benefit.
- **Don't add more tests for trivial utilities** — The ~290 wasteful tests already prove this doesn't help.
- **Don't split the 17 app components** — They're appropriately scoped.
- **Don't abstract the generation pipeline further** — 4 generators sharing a pattern is fine; a generic wrapper adds indirection without real benefit.
- **Don't over-test client stores** — Focus tests on the game.ts store (it matters) and skip notifications.ts (56 LOC of trivial queue logic).
