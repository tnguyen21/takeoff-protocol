# Complexity Audit

Date: 2026-03-17 (updated 2026-03-18)

---

## TL;DR

The codebase is **~23K source LOC** across 3 packages. The architecture is sound with two server hot spots worth refactoring. Tests are plentiful (1,169) but many are marginal or tautological.

---

## LOC Breakdown

| Package | Source LOC | Test LOC | What It Is |
|---------|-----------|----------|------------|
| **shared** | 1,153 | ~1,100 | Types, constants, resolution, fog, endings |
| **server** | 7,341 | ~11,845 | Game loop, events, generation pipeline, logger |
| **client** | 14,362 | ~4,160 | React UI: stores, screens, 17 apps, desktop WM |
| **Total** | **~22,856** | **~17,105** | |

---

## Package Assessments

### shared (1,153 LOC) — Clean

5 files. Well-organized. Types, game constants, resolution engine, fog-of-war, ending arc resolvers.

**Minor issues:**
- **Magic thresholds:** Ending arc resolvers have numeric thresholds (65, 70, 80, 85) with no inline rationale.

**Verdict:** Low complexity. No action needed.

---

### server (7,341 LOC) — Moderate Complexity, 2 Hot Spots

**Good:**
- Generation pipeline (orchestrator → generators → provider → validation) is well-structured
- Logger system is appropriately scoped (not over-engineered)
- Room management is simple
- No circular dependencies
- Dead code is clean (`bun run knip` passes)

**Hot spots:**

1. **`game.ts` — `checkThresholds()` (358 LOC)**
   The worst function in the codebase. 8 threshold handlers copy-pasted with the same pattern: check fired set → check state → mutate state → create notification → inject news → log. Should be a declarative data structure + loop. ~100 LOC reduction possible.

2. **`events.ts` — `registerGameEvents()` (848 LOC)**
   40+ socket.on() handlers in one function. Each handler repeats the same room/code validation boilerplate (~15 times). Extract a `requireRoom(socket)` helper. Not urgent but noisy.

**Generation pipeline — over-engineered?**
Partially. The 4 generators (briefing, content, npc, decisions) follow identical patterns: prompt builder → provider call → validation → retry. Could extract a common `generateWithRetry<T>()` wrapper to eliminate ~400 LOC of duplication. But each has domain-specific schemas and validation, so the current separation is defensible.

**Verdict:** Two functions need refactoring (checkThresholds, requireRoom extraction). Generation pipeline is fine — structured repetition, not accidental complexity.

---

### client (14,362 LOC) — Fine

**Good:**
- 4 Zustand stores with clear separation (game, messages, notifications, ui)
- 17 app components all pull their weight — none are trivial wrappers
- Desktop window manager (Window, MenuBar, Dock, Notifications) is appropriately complex
- Socket integration is clean (all listeners in stores, not scattered)
- GM dashboard split into `screens/gm/` module (7 files)

**Minor issues:**

1. **`Decision.tsx` (499 LOC)** — Inline RadioGroup component (56 LOC), leader vs. non-leader UI fork, multiple useRef for stale closure avoidance, heavy inline styles. Could extract RadioGroup + split leader/non-leader views.

2. **`Lobby.tsx` (398 LOC)** — Three-step wizard (name → room → role) crammed into one component with early-exit conditionals and deeply nested JSX (87 lines in the faction grid alone).

3. **`wandbUtils.ts` (769 LOC)** — Static chart data, transform functions, and type definitions all in one file. Should split into data/transforms/types.

4. **Mixed styling** — Some components use Tailwind classes, others use inline `style={{}}` objects. No consistent approach.

5. **`game.ts` store (569 LOC)** — 30+ state fields, 19 socket listeners, module-level mutable state for sequencing. Getting large but not yet unmanageable. Socket listeners could move to a separate module.

**Verdict:** At the edge of acceptable — refactor only if actively working in those files.

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
4. **npc.test.ts (generation)** — Trigger uniqueness, structural validity, round window filtering.
5. **rooms.test.ts** — Reconnect replay: NPC privacy, faction scoping, DM delivery.

### Most Wasteful Tests

1. **devBots.test.ts** — 60% waste. Tests bot ID determinism (tautological: same input → same output), string formatting regex, `pickRandomOption()` tested 4 times for a 5-line function.
2. **npcPersonas.test.ts** — 55% waste. Tests that `NPC_PERSONAS` mirrors `NPC_IDS` — if they're built from the same source, this is guaranteed.
3. **provider.test.ts** — Tests that MockProvider returns what you gave it. The purpose of a mock IS to return your data.
4. **cache.test.ts** — Tests "empty cache returns undefined" three different ways.
5. **config.test.ts** — Tests `"true"` → `true` and `"false"` → `false` env var parsing.

### Critical Test Gaps

1. **Concurrent decision submission** — Server handles simultaneous submits from different players but never tested.
2. **Generation error orchestration** — Individual generator retry is tested, but partial artifact failure (briefing fails, content succeeds → status should be "failed") is not.
3. **Desktop window manager** — Drag, resize, z-order, auto-minimize — all untested.

---

## Complexity Verdict

### What's Actually Complex (and should be)

- **9 ending arc resolvers** — Multi-variable conditional logic. Tuned via simulation. Inherently complex.
- **Fog-of-war matrix** — 33 state variables × 4 factions × accuracy levels. Core mechanic.
- **Decision resolution engine** — Effects with conditional multipliers, clamping, history tracking. Can't simplify.
- **Generation pipeline** — LLM calls with retry, validation, caching. Justified complexity.
- **Desktop window manager** — Simulates macOS. Drag, resize, z-order, minimize/maximize. It is what it is.

### What's Complex and Shouldn't Be

| Problem | Size | Fix | Effort |
|---------|------|-----|--------|
| `checkThresholds()` monolith | 358 LOC | Declarative threshold registry + loop | 2h |
| Repeated room validation in events.ts | ~15 instances | Extract `requireRoom()` helper | 1h |
| `Decision.tsx` inline RadioGroup | 56 LOC | Extract to component | 30m |
| Mixed Tailwind/inline styles | Scattered | Standardize on Tailwind | 4h |
| `wandbUtils.ts` blob | 769 LOC | Split data/transforms/types | 1h |

### What Looks Complex but Isn't

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

### Do Soon (High ROI Refactors)

1. **Refactor `checkThresholds()`** to declarative registry — eliminates 358 LOC monolith.
2. **Extract `requireRoom()` helper** in events.ts — removes 15× boilerplate.

### Don't Do (Traps)

- **Don't add more tests for trivial utilities** — The wasteful tests already prove this doesn't help.
- **Don't split the 17 app components** — They're appropriately scoped.
- **Don't abstract the generation pipeline further** — 4 generators sharing a pattern is fine; a generic wrapper adds indirection without real benefit.
