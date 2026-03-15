# Tests & Scripts — Audit Report

> **Fix Status (2026-03-15):**
> - events.test.ts shadow testing — **FIXED** (complete rewrite, now tests real handlers via registerGameEvents)
> - activity.test.ts tests local copy — **FIXED** (now imports real applyActivityPenalties)
> - Fog noise test gap (no value-range assertion) — **FIXED** (property test: estimates within confidence bounds)
> - computeEndingArcs test gaps — **FIXED** (41 new tests covering all 9 resolver branches)
> - Clamping bounds inconsistency — **FIXED** (canonical STATE_VARIABLE_RANGES)
> - analyze-bias.ts `decisions.collective` bug — **FIXED** (checks .team with .collective fallback)
> - emitResolution not exported — **OUTSTANDING** (covered indirectly through integration tests)
> - Migration scripts not archived — **OUTSTANDING** (still in scripts/, no tests, no dry-run)
> - Current: 751 pass, 2 skip, 0 fail across 22 test files.
> - See `STATUS.md` for full current state.

## Overall Verdict

The test suite has a **fundamental structural problem**: the most critical tests don't actually test the production code. Shadow-testing and inline reimplementations dominate, meaning large portions of the server could be completely rewritten and the tests would still pass green. The shared package tests are the best in the suite. The scripts are a maintenance hazard.

---

## 1. Test Quality — File by File

### `events.test.ts` — Shadow Testing Failure

**This is the most severe problem in the test suite.**

Every handler test (`gm:send-npc-message`, `tweet:send`, `message:send`, `dev:fill-bots`) reimplements the handler logic as a local function inside the test, then tests that local copy. The actual handlers in `events.ts` are never called. If someone rewrites a handler in `events.ts`, these tests will still pass.

The logging invariant tests (lines 311–459) are even worse: they call `spy.log(...)` directly and assert that `spy.calls` contains what was just logged. **These tests cannot fail under any circumstances.** They are testing that a spy records what you tell it to record.

Key handlers with **zero effective coverage**:
- `decision:submit` (events.ts:372–419) — applies decision effects to game state, the core mechanic
- `decision:leader-submit` (events.ts:421–435)
- `publish:submit` (events.ts:488–619) — applies state effects, triggers ending arc computation
- `room:rejoin` (events.ts:38–90) — reconnection flow
- `gm:pause`, `gm:extend` — timer mutation logic

### `activity.test.ts` — Tests a Copy, Not Production

`PRIMARY_APP_PENALTIES` and `applyActivityPenalties` are **redefined inline** in the test file (lines 16–39) instead of being imported from `game.ts`. If `game.ts` changes its penalty table, these tests will pass silently. The test is asserting the behavior of its own local copy.

### `game.test.ts` — Partial Coverage

`emitResolution` is not exported from `game.ts` so it has no direct tests. The resolution engine (applying decisions, computing state transitions) is the core game mechanic and is covered only indirectly through integration paths that are themselves shadow-tested in `events.test.ts`.

### `rooms.test.ts` — Good

Imports real production code. Message filtering and role selection logic are meaningfully tested.

Gaps:
- `selectRole` duplicate-prevention logic (rooms.ts:81–85) — no test
- No test for the reconnection/rejoin path

### `devBots.test.ts` — Good

Seeds and scheduling tested with real imported functions. Meaningful assertions.

### `shared/index.test.ts` — Best in Suite (with caveats)

See `AUDIT-SHARED.md` for detailed analysis. The NPC type tests (lines 50–144) are compiler-level checks that provide no runtime value. The `computeFogView` tests critically fail to assert that the noised value is different from the true value, which would catch the broken noise formula (bug documented in AUDIT-SHARED.md).

### `analyze-game.test.ts` — Good

Imports real production code with behavioral assertions. Solid.

---

## 2. Coverage Gaps — Critical Paths Untested

| Code Path | File | Why It Matters |
|-----------|------|----------------|
| `decision:submit` handler | events.ts:372–419 | Core mechanic: applies effects to game state |
| `publish:submit` handler | events.ts:488–619 | Triggers ending arc computation |
| `emitResolution` | game.ts | Resolution engine; non-exported, no coverage |
| `room:rejoin` | events.ts:38–90 | Reconnection correctness |
| `gm:pause` / `gm:extend` | events.ts | Timer mutation |
| `clampState` exhaustiveness | resolution.ts | Any new state variable will be unclamped |
| `fog.ts` noise formula correctness | fog.ts:56–59 | Formula is broken; no test catches it |
| `computeEndingArcs` edge cases | endings.ts | See AUDIT-SHARED.md |

---

## 3. Clamping Bounds Inconsistency (Bug — Not Caught by Tests)

`resolution.ts` clamps `usChinaGap` to `[-8, 16]` (line 39), but the GM panel in `events.ts` uses `[-24, 24]` (line 198). Similarly, `doomClockDistance` clamps to `[0, 5]` in resolution but the GM allows `[0, 10]`. These silently contradict each other. No test catches this because the GM panel handlers are shadow-tested.

---

## 4. Script Quality

### `analyze-bias.ts` — Silent Bug

Line 27 references `decisions.collective` but the data structure uses `decisions.team`. Team decisions are silently skipped in the bias analysis. Any output from this script is incorrect.

### `scale-deltas.ts` and `fix-directional-bias.ts` — Dangerous to Re-run

These scripts mutate TypeScript source files via regex:
- No dry-run mode
- No test coverage (ironic)
- Fragile pattern matching (magic 100-char offset in `zeroOutEffect`, hardcoded indentation strings)
- Re-running them on already-processed files would double-apply transformations

These are one-shot migration scripts. They should be clearly marked as such and ideally deleted or archived after their single intended run.

### `fix-gap-bias.ts`, `targeted-rebalance.ts` — Same concerns as above

Manual numeric tuning scripts that modify content data files. No validation of output, no tests.

### `simulate.ts` — Useful

The simulation harness is a legitimate tool for game balance work. The analyze-game pipeline built on top of it is the right approach.

---

## 5. Recommendations (Priority Order)

1. **Fix `events.test.ts`** — rewrite handler tests to actually register handlers via the real `registerEvents` function with a mock socket/room, then emit events and assert on state changes.
2. **Fix `activity.test.ts`** — import `applyActivityPenalties` from `game.ts` directly.
3. **Add test for fog noise** — assert that `computeFogView` returns values that differ from true values, and that they fall within the confidence interval.
4. **Export and test `emitResolution`** or wrap it in an integration test that exercises the full decision→state→resolution pipeline.
5. **Mark or delete migration scripts** — `scale-deltas.ts`, `fix-directional-bias.ts`, `fix-gap-bias.ts` should be labeled clearly as one-shot tools or removed.
6. **Fix `analyze-bias.ts` bug** — `decisions.collective` → `decisions.team`.
