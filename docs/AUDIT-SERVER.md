# Server Package Audit — Findings

## Files Audited
- `src/index.ts`, `src/game.ts` (1174 lines), `src/rooms.ts`, `src/events.ts` (834 lines), `src/devBots.ts`
- `src/content/loader.ts`, `index.ts`, `npc/index.ts`, `npcPersonas.ts`
- `src/generation/orchestrator.ts`, `cache.ts`, `context.ts`, `config.ts`
- `src/logger/index.ts`, `registry.ts`

---

## Priority Table

| Priority | Finding | Location |
|---|---|---|
| HIGH | Double `advancePhase` from timer + GM manual advance (race condition) | `game.ts:95–106`, `events.ts:152` |
| HIGH | Activity penalty delta not clamped | `game.ts:503` |
| HIGH | `replayPlayerState` skips generated briefing/content (reconnection bug) | `game.ts:1141–1158` |
| HIGH | `history[last].stateAfter` records pre-penalty state | `game.ts:237–243` |
| MEDIUM | `ROUND_DECISIONS` triplicated | `game.ts`, `devBots.ts`, `context.ts` |
| MEDIUM | Decision option IDs not validated on submit | `events.ts:381` |
| MEDIUM | `extendUses` + `phaseTimers` Maps never cleaned up | `events.ts:9`, `game.ts:20` |
| MEDIUM | `checkThresholds` is a 350-line monolith | `game.ts:581–936` |
| MEDIUM | `updateStoryBible` appears to be dead code (~70 lines) | `context.ts:243` |
| LOW | `isLeader` derivation triplicated | `rooms.ts:92`, `events.ts:732,757` |
| LOW | `STATE_BOUNDS` rebuilt in handler on every call | `events.ts:194` |
| LOW | `getNpcPersona` is O(n) linear scan | `npcPersonas.ts:368` |
| LOW | GM duplicate messages when also a player | `events.ts:482` |
| LOW | `tweet:send` ID not UUID | `events.ts:635` |
| LOW | DMs to bot socket IDs silently dropped | `events.ts:323` |

---

## 1. Dead Code / Unnecessary Complexity

**1.1 Triplicated `ROUND_DECISIONS` array**
Defined identically in `game.ts:23–29`, `devBots.ts:18–24`, and `generation/context.ts:53–59`. Must be changed in all three places simultaneously. Needs a single canonical export from `@takeoff/shared` or a server-level constant.

**1.2 Five individual round decision imports in `game.ts` only used to populate local array**
`game.ts:11–15` imports `ROUND1_DECISIONS` through `ROUND5_DECISIONS` individually. They are never referenced directly — they only feed the local `ROUND_DECISIONS` array at lines 23–29. If a single unified import existed, these five lines vanish.

**1.3 `STATE_BOUNDS` rebuilt inside the `gm:set-state` handler on every call**
`events.ts:194–231`: large constant object created fresh inside the Socket.IO event handler. Move to module level.

**1.4 `STATE_LABELS` in `game.ts` only consumed by `emitResolution`**
`game.ts:431–470`: 40-entry map used in one private function. Consider moving to `@takeoff/shared` or inline it.

**1.5 `isLeader` derivation triplicated**
`rooms.ts:92`, `events.ts:732`, `events.ts:757` all contain `["ob_ceo", "prom_ceo", "china_director"].includes(role)`. Should be a shared helper.

**1.6 `buildNarrative` exported but has no external callers**
`game.ts:938` exports `buildNarrative`. It is only called from the private `emitResolution`. Either unexport it or confirm tests are the intended consumer.

**1.7 `getNpcPersona` is O(n) linear scan on every call**
`npcPersonas.ts:368` uses `Array.find` over 40+ personas. A `Map<string, NpcPersona>` keyed by `id` would be O(1).

**1.8 `extendUses` Map (`events.ts:9`) never cleaned up**
Keys accumulate forever across sessions. No pruning on room end.

---

## 2. Refactoring Opportunities

**2.1 GM authorization boilerplate repeated 9+ times in `events.ts`**
The three-line `code / room / gmId` guard appears at lines 154–156, 163–165, 191–193, 257–261, 277–281, 302–309, 357–361, etc. Extract into `requireGMRoom(socket): GameRoom | null`.

**2.2 `game:phase` emit duplicated in 6 call sites**
`startGame`, `startTutorial`, `endTutorial`, `advancePhase` (×2), `jumpToPhase` all emit the same `{ phase, round, timer }` shape. Extract `emitPhase(io, room)`.

**2.3 `replayPlayerState` skips generated briefings**
`game.ts:1151–1158` calls only `getBriefing`, not `getGeneratedBriefing`. Reconnecting players see pre-authored briefings even when the room has generated content. `emitBriefing` has the correct fallback logic. Consolidate into a shared `emitBriefingTo(socket, room)` helper.

**2.4 `replayPlayerState` skips generated content overlay**
`game.ts:1141–1147` calls `getContentForPlayer` directly, bypassing the generated-content merge at `emitContent:398–416`. Reconnected players get only pre-authored content. Extract a `getEffectiveContent()` helper shared by both paths.

**2.5 `checkThresholds` is a 350-line monolith (`game.ts:581–936`)**
8 threshold conditions with 30–40 lines each, no abstraction. Convert to a descriptor array with a dispatch loop, modeled on how NPC triggers already work.

**2.6 `injectNewsContent` and the `publish:submit` emission block are near-duplicates**
Both build `ContentItem`, `Publication`, `AppContent` and emit `game:publish`. Factor into a shared helper.

**2.7 `dev:bootstrap` handler has duplicated player-object construction**
`events.ts:727–735` and `events.ts:752–761` build identical `Player` objects. Extract a local `makeDevPlayer(socketId, faction, role): Player`.

**2.8 `getContentForPlayer` does not dedup by `app`**
`loader.ts:59–90` appends all matching registry entries without checking for duplicate `(faction, app)` pairs. Two registrations for the same app produce two blocks in the response.

**2.9 `getGenerationConfig()` reads `process.env` on every call**
`orchestrator.ts:52` calls this per-trigger. Cache at module init unless live-reading is intentional.

---

## 3. Potential Bugs

**3.1 (HIGH) Race: `advancePhase` callable twice for same phase**
`syncPhaseTimer` sets a `setTimeout` → `advancePhase`. The GM can also trigger `advancePhase` via `gm:advance`. If the timer fires milliseconds after a manual advance, the room advances two phases. Fix: capture `expectedRound`/`expectedPhase` in the timer closure and no-op if they don't match current room state.

**3.2 (HIGH) Activity penalties not clamped (`game.ts:503`)**
```ts
(room.state[penalty.variable] as number) = current + penalty.delta;
```
No `Math.max`/`Math.min`. A variable at 0 goes to -3, -6, etc. `gm:set-state` clamps; this code path does not.

**3.3 (HIGH) `replayPlayerState` uses pre-authored briefing and content even with generated versions**
A reconnecting player gets stale pre-authored content. See §2.3 and §2.4 — listed as a bug because the reconnecting player's view diverges from all other players.

**3.4 (HIGH) `history[last].stateAfter` not updated after penalties and threshold mutations**
`game.ts:237–243` saves history with comment `// will be updated by resolution`. Nothing updates this field after `applyActivityPenalties` or `checkThresholds` run. History records show pre-penalty state as the "after" value.

**3.5 (MEDIUM) DMs to bot socket IDs silently drop**
`io.to("__bot_openbrain_ob_ceo")` emits to a non-existent socket. Socket.IO silently no-ops. The `gm:send-npc-message` handler at `events.ts:323` does not reject bot socket IDs.

**3.6 (MEDIUM) Decision option IDs not validated on submit**
`events.ts:381`: any string is accepted as an `individual` decision and written to `room.decisions`. The string is only validated against round decisions in `emitResolution`. Garbage values persist in `room.decisions` and appear in `gm:decision-status`.

**3.7 (MEDIUM) `phaseTimers` Map not cleaned up on abandoned rooms**
`game.ts:20`: `phaseTimers` holds a live `setTimeout` for every active room. If a room is abandoned (all players disconnect without a proper ending), the timer fires indefinitely, calling `advancePhase` on a room with no connected players. The entry is never pruned.

**3.8 (LOW) GM receives duplicate messages if also a player**
`events.ts:482`: GM echo `io.to(room.gmId)` is unconditional. If GM is also a player in the same faction, they receive two copies of every team-chat message.

**3.9 (LOW) `tweet:send` ID is not UUID-safe**
`events.ts:635`: `` id: `tweet_${Date.now()}_${socket.id.slice(-4)}` `` — millisecond + 4-char suffix can collide under concurrent sends. Use `crypto.randomUUID()`.

**3.10 (LOW) `initializeStoryBible` called as side-effect inside `buildGenerationContext`**
`context.ts:138`: `buildGenerationContext` mutates `room.storyBible` if not set. Surprising for a read-like function. Move initialization to an explicit call at room creation.

**3.11 (LOW) `updateStoryBible` defined but never called**
`context.ts:243`: ~70 lines of story-bible update logic. If dead, delete it. If it's supposed to run from `emitResolution`, it's a missing integration.

---

## 4. Overall Observations

**Architecture boundary leak:** `game.ts` directly emits Socket.IO events. If game logic were kept pure (return data, don't emit), unit testing without mocking `io` would be trivial. This is the root cause of why `events.test.ts` has to shadow-test everything (see `AUDIT-TESTS.md`).

**No room cleanup lifecycle:** The `rooms` Map grows forever. Disconnection marks `connected: false` but never prunes stale rooms. `extendUses` and `phaseTimers` accumulate with no expiry. Add a cleanup on game end or a TTL-based pruning job.

**No input length guards on player messages:** `message:send` content is unlimited. `publish:submit` title/content are unlimited. Low risk for a closed-audience exercise but worth noting.

**`@hono/node-server` + Socket.IO uses `as any` (`index.ts:26`):** Works now, silently breaks if Hono's server shape changes.
