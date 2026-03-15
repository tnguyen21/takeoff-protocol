# packages/shared/src — Audit Report

> **Fix Status (2026-03-15):**
> - 1.1 Unused `_role` param in computeFogView — **FIXED** (parameter removed)
> - 1.2 `arcIds` array duplicates resolver keys — **FIXED** (uses Object.keys(resolvers))
> - 2.1 `clampState` 30-line manual enumeration — **FIXED** (fe66bf6: loops over STATE_VARIABLE_RANGES)
> - 2.2 `applyNoise` correlated seeds for `ob*` vars — **FIXED** (uses hashString per variable)
> - 2.3 `resolvePublicReaction` redundant branch — **FIXED** (condition removed)
> - 3.1 (BUG) `applyNoise` formula broken — **FIXED** (sin * 233280, fractional part extraction)
> - 3.2 (BUG) `globalMediaCycle < -60` unreachable — **FIXED** (replaced with publicSentiment check)
> - 1.6 `globalMediaCycle` typed as `number` — **OUTSTANDING** (should be union type)
> - 3.3 `resolveOpenSource` dead branch — **OUTSTANDING** (catch-all return 3, minor)
> - See `STATUS.md` for full current bug list and priorities.

## 1. Dead Code / Unnecessary Complexity

**1.1 `_role` parameter in `computeFogView` is unused (`fog.ts:68`)**
The `_role: Role` parameter is accepted and passed at every call site but is never consulted. The leading underscore acknowledges the intent but the parameter still pollutes the API. Either role-based fog differences are a planned feature (implement it) or remove the parameter entirely.

**1.2 `arcIds` array duplicates resolver keys — maintenance hazard (`endings.ts:286–297`)**
`computeEndingArcs` defines a `resolvers` record with all 9 arcs, then defines a separate `arcIds` string array with the same 9 keys, and maps over the array. Adding a new arc to `resolvers` (plus `SPECTRA`, `NARRATIVES`, `ARC_LABELS`) without also updating `arcIds` silently omits it from output. Should iterate over `Object.keys(resolvers)` directly.

**1.3 `ROUND4_PHASE_DURATIONS` usage is unverifiable from shared alone (`constants.ts:90–96`)**
Exported but no usage in shared. If it's orphaned, cut it. If it's used by server/client, the special-casing approach is fragile — any future special round adds another top-level constant.

**1.4 `SCALING_GUIDE` has no fallback for player counts outside 8–14 (`constants.ts:148–156`)**
`SCALING_GUIDE[7]` is `undefined`. There is no guard or documented invariant. Consumer code must handle `undefined` but nothing enforces that.

**1.5 `FactionConfig`/`RoleConfig` types are in `constants.ts`, not `types.ts` (`constants.ts:5–22`)**
All other types live in `types.ts`. These two belong there.

**1.6 `globalMediaCycle` typed as `number` despite being a 6-value enum (`types.ts:55`)**
The comment says `0-5 enum: 0=ai-hype, 1=ai-fear...` but the type is `number`. The clamp in `resolution.ts:55` allows continuous values 0–5. A non-integer delta produces a semantically undefined mid-enum state. Should be `0 | 1 | 2 | 3 | 4 | 5` or a proper enum.

---

## 2. Refactoring Opportunities

**2.1 `clampState` is a 30-line manual enumeration that will rot (`resolution.ts:33–75`)**
Each of the 30 state variables is clamped individually with a hardcoded min/max. Adding a new `StateVariables` field requires manually adding a clamp call — no compile-time enforcement. A `CLAMP_RANGES: Record<keyof StateVariables, [number, number]>` constant would be exhaustiveness-checked by TypeScript and reduce `clampState` to a single loop.

**2.2 `applyNoise` seed produces correlated estimates for `ob*` variables (`fog.ts:72, 85`)**
The variable-specific seed component is `key.charCodeAt(0)`. All variables starting with `o` (`obCapability`, `obMorale`, `obBurnRate`, `obBoardConfidence`, `obInternalTrust`, `obPromGap`) share the same first character, so they get the same key component in the seed and their noise values are correlated across variables.

**2.3 `resolvePublicReaction` has a redundant branch (`endings.ts:199–200`)**
```ts
if (s.globalMediaCycle >= 30 && s.publicSentiment >= 30 && s.publicAwareness <= 90) return 3;
if (s.publicSentiment >= 30 && s.publicAwareness <= 90) return 3;
```
Line 199 is a strict subset of line 200 — both return 3. Line 199 should be removed.

**2.4 `resolveAiRace` priority order produces a silent tie-break (`endings.ts:143–146`)**
`chinaClose` is checked before `promClosing` but `promClosing` has no `!chinaClose` guard. If both are true simultaneously, China parity (index 1) overrides Prometheus leading (index 3). Not commented, and not obviously the right call for all scenarios.

---

## 3. Potential Bugs

**3.1 `applyNoise` formula is broken — estimates always equal ≈ trueValue - confidence (`fog.ts:56–59`)**
```ts
const noise = ((Math.sin(seed * 9301 + 49297) % 233280) / 233280) * 2 - 1;
```
`Math.sin()` returns values in `[-1, 1]`. The modulo `% 233280` is therefore a no-op (since `|sin(x)| < 233280`). Dividing by 233280 makes the first term essentially zero, so `noise ≈ -1` in all cases. All fog estimates are shown as `trueValue - confidence` (approximately), not a value drawn uniformly from `[trueValue - confidence, trueValue + confidence]`. The intended formula was probably `Math.abs(Math.sin(...) * 233280) % 233280 / 233280 * 2 - 1`.

**3.2 `globalMediaCycle < -60` branch is unreachable (`endings.ts:197`)**
`globalMediaCycle` is clamped to `[0, 5]` — it can never be negative. This entire branch is dead code and makes the riots outcome harder to trigger than designed. Likely `publicSentiment` was intended here.

**3.3 `resolveOpenSource` returns index 3 in two ways, one of them dead (`endings.ts:255–256`)**
```ts
if (s.publicAwareness <= 30 && s.intlCooperation <= 30) return 3;
return 3;
```
The `if` branch and the fallthrough both return 3. The explicit condition is dead. Either the condition was meant to return a different index, or the `if` should be removed.

**3.4 `applyEffect` uses `(state as any)` with no runtime key validation (`resolution.ts:27`)**
A malformed `effect.variable` string from content data would silently write `NaN` into state without any runtime error. Low severity in a typed system, but worth noting.

**3.5 `usChinaGap`/`obPromGap` have asymmetric clamp ranges with no documentation (`resolution.ts:39–40`)**
Both are clamped `[-8, 16]`, allowing a 16-month US/OB lead but only an 8-month China/Prometheus lead. Possibly intentional (the US starts ahead), but undocumented.

---

## 4. Test Quality Assessment (`index.test.ts`)

**NPC type tests (lines 50–144): delete or replace.**
These 5 tests are pure TypeScript structural checks. They verify that object literals match their declared types — work the compiler already does at build time. Zero runtime behavior is tested.

**`resolveDecisions` tests (lines 146–269): good, but gaps exist.**
- `eq` and `lt` condition operators are never tested (only `gt`)
- Negative multiplier is never tested
- Special clamp ranges for `publicSentiment` `[-100, 100]`, `marketIndex` `[0, 200]`, and `securityLevel` `[1, 5]` are never tested
- Multiple effects on the same variable within one option are never tested

**`computeFogView` tests (lines 273–316): critically missing the value-range check.**
No test verifies that an estimate's `value` is actually different from `trueValue`, or that it falls within `trueValue ± confidence`. Adding this single assertion would immediately catch bug 3.1 (the broken noise formula). The test at line 291 checks `confidence > 0` but not that the noised value varies.

**`computeEndingArcs` tests (lines 320–466): reasonable coverage, notable gaps.**
- `resolveControl` with `aiAutonomyLevel > 70` ("no one is steering") is never tested
- `resolvePrometheusFate` merger case is never tested
- `resolveEconomy` with non-baseline burn rates is never tested
- The dead `globalMediaCycle` branch in `resolvePublicReaction` is never tested (would expose bug 3.2 if it were)
- `resolveOpenSource` index 3 fallthrough vs. dead `if` is never tested (would expose bug 3.3)

**`constants.ts` has zero test coverage.**
Useful additions: verify each faction has exactly one `isLeader: true` role; verify `SCALING_GUIDE` key sums equal the key value; verify all role IDs in `FACTIONS` are valid `Role` literals.
