# Complexity Audit

Date: 2026-03-17 (updated 2026-03-18, 2026-03-18b)

---

## TL;DR

The codebase is **~23K source LOC** across 3 packages. The architecture is sound. Tests are plentiful (1,183) but many are marginal or tautological. Most refactoring items from the original audit have been addressed: RadioGroup extracted, wandbUtils split, Lobby decomposed, Tailwind migration ~60% complete. New auth module added (password gate + room cap). Deployment runbook exists.

---

## LOC Breakdown

| Package | Source LOC | Test LOC | Tests | What It Is |
|---------|-----------|----------|-------|------------|
| **shared** | 1,153 | ~1,113 | 91 | Types, constants, resolution, fog, endings |
| **server** | 7,746 | ~11,790 | 681 | Game loop, events, generation pipeline, auth, logger |
| **client** | 13,802 | ~4,160 | 411 | React UI: stores, screens, 17 apps, desktop WM |
| **Total** | **~22,701** | **~17,063** | **1,183** | |

---

## Package Assessments

### shared (1,153 LOC) — Clean

5 files. Well-organized. Types, game constants, resolution engine, fog-of-war, ending arc resolvers.

**Minor issues:**
- **Magic thresholds:** Ending arc resolvers have numeric thresholds (65, 70, 80, 85) with no inline rationale.

**Verdict:** Low complexity. No action needed.

---

### server (7,746 LOC) — Clean

**Good:**
- Generation pipeline (orchestrator → generators → provider → validation) is well-structured
- Logger system is appropriately scoped (not over-engineered)
- Room management is simple with room cap enforcement
- No circular dependencies
- Dead code is clean (`bun run knip` passes)
- `checkThresholds()` uses a declarative `THRESHOLD_REGISTRY` + loop (8 thresholds)
- `events.ts` uses `getSocketRoom()`/`getGmRoom()` helpers — no repeated validation boilerplate
- Auth module (`auth.ts`, ~130 LOC) is self-contained: HMAC cookies, rate limiting, gate page HTML — no external deps

**Known bug:** Generation config models (`GEN_BRIEFING_MODEL`, `GEN_CONTENT_MODEL`, `GEN_DECISION_MODEL`) are read in `config.ts` but never threaded through to `provider.generate()` calls — everything hits the Haiku default in `provider.ts:85`. Fix in progress (hive issue w-20136bafb91f).

**Verdict:** No action needed beyond the model wiring bug. Generation pipeline has structured repetition (4 generators sharing a pattern) but each has domain-specific schemas, so current separation is defensible.

---

### client (13,802 LOC) — Fine

**Good:**
- 4 Zustand stores with clear separation (game, messages, notifications, ui)
- 17 app components all pull their weight — none are trivial wrappers
- Desktop window manager (Window, MenuBar, Dock, Notifications) is appropriately complex
- Socket integration is clean (all listeners in stores, not scattered)
- GM dashboard split into `screens/gm/` module (7 files)
- Lobby decomposed into `screens/lobby/` module (FactionGrid, PlayerList, RoomBrowser)
- RadioGroup extracted to `components/RadioGroup.tsx`
- wandbUtils split into `apps/wandb/` module (artifacts, runs, sweeps, transforms, types)
- Auth gate: `PasswordGate.tsx` + `RoomBrowser.tsx` (~170 LOC combined)

**Resolved since last audit:**
- ~~`Decision.tsx` (499 LOC) inline RadioGroup~~ → RadioGroup extracted, Decision.tsx now 314 LOC
- ~~`Lobby.tsx` (398 LOC) monolithic wizard~~ → FactionGrid/PlayerList/RoomBrowser extracted, Lobby.tsx now 217 LOC
- ~~`wandbUtils.ts` (769 LOC) blob~~ → Split into `apps/wandb/` with 6 focused modules

**Remaining issues:**

1. **Mixed styling** — ~60% Tailwind adoption (41 files), ~25 files still use inline `style={{}}`. Desktop chrome (Window, Dock, MenuBar, Notifications) and several game screens (Decision, Ending, Resolution, Briefing) still have inline styles. Apps are mixed.

2. **`game.ts` store (577 LOC)** — 30+ state fields, 19 socket listeners, module-level mutable state for sequencing. Getting large but not yet unmanageable. Socket listeners could move to a separate module.

**Verdict:** Improved since last audit. Remaining styling migration is the main cleanup item.

---

## Test Quality Audit

### The Numbers (1,183 tests across 47 files)

| Category | Tests | % | Description |
|----------|-------|---|-------------|
| **VALUABLE** | ~500 | 37% | Tests real contracts, would catch regressions |
| **MARGINAL** | ~420 | 31% | Tests something, unlikely to catch real bugs |
| **WASTEFUL** | ~290 | 21% | Tautological, tests implementation details |
| **GAPS** | ~145 items | 11% | Important behaviors with no tests |

New valuable tests since last audit: auth cookie round-trip/expiry/HMAC tampering (14 tests), room cap enforcement (2 tests).

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
| Mixed Tailwind/inline styles | ~25 files | Finish migration (desktop chrome, game screens) | 2-3h |

### What Looks Complex but Isn't

- **17 client apps** — Each is a self-contained content viewer. No unnecessary abstraction.
- **4 Zustand stores** — Right tool, right granularity. `game.ts` is large but not tangled.
- **Logger system** — Buffer, validate, flush. Exactly as complex as it needs to be.

### What's Missing (Not a Complexity Problem)

- No end-to-end tests
- No monitoring/observability in production
- No live playtest validation of LLM generation quality
- Generation model config not wired through (bug — fix in progress)

---

## Recommendations

### Don't Do (Traps)

- **Don't add more tests for trivial utilities** — The wasteful tests already prove this doesn't help.
- **Don't split the 17 app components** — They're appropriately scoped.
- **Don't abstract the generation pipeline further** — 4 generators sharing a pattern is fine; a generic wrapper adds indirection without real benefit.
