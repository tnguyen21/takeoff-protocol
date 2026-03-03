# Solo Dev NPC Autoplay (Random Decisions)

## Goal

Enable reliable solo playtesting by filling unoccupied roles with dev-only bot players that always make random decisions.

This is for iteration speed, not realism:
- one human can run full rounds/phases end-to-end
- decision and resolution flows always progress
- no dependency on multiple browser tabs/humans

## Scope

In scope (v1):
- dev-only synthetic players ("bots") for missing roles
- random individual decision submission
- random team vote submission
- random leader team lock submission
- works with existing room/game/phase pipeline

Out of scope (v1):
- intelligent strategy
- cross-faction DM behavior
- app activity simulation
- production enablement

## Current Architecture Constraints

Relevant existing behavior:
- Decision options are emitted per player in `emitDecisions()` (`packages/server/src/game.ts`).
- Decisions are recorded by socket id via `decision:submit` and `decision:leader-submit` handlers (`packages/server/src/events.ts`).
- Resolution already tolerates inaction, but solo testing is better when choices are made.
- Dev bootstrap already exists (`dev:bootstrap`) and bypasses lobby (`packages/server/src/events.ts`).

Important constraint:
- Current submit handlers rely on `socket.id`. Bots have no real socket, so bot submissions should be server-side writes to `room.decisions`, `room.teamVotes`, and `room.teamDecisions` instead of fake socket events.

## Design

### 1) Bot Identity Model

Add dev-only synthetic players to `room.players`:
- `id`: deterministic bot id format, e.g. `__bot_openbrain_ob_cto`
- `name`: e.g. `BOT OB CTO`
- `connected`: `true` (so lobby/GM views treat them as present)
- normal `faction`, `role`, `isLeader`

Rule:
- keep exactly one human player (current dev user) plus bots for all other required roles in selected factions

### 2) Bot Lifecycle

Create bots in dev bootstrap flow:
- on `dev:bootstrap`, after inserting human player, add bots for remaining roles
- optional mode:
  - `all_roles`: fill every role across all factions
  - `minimum_table`: fill required non-optional roles only

Cleanup:
- on room teardown (existing room lifecycle), no special handling needed

### 3) Decision Autoplay Behavior

Trigger point:
- when phase enters `decision` (same place `emitDecisions` runs)

Behavior per bot:
1. Read round decisions (`ROUND_DECISIONS[room.round - 1]`)
2. Find bot's individual decision by role
3. Pick one random option id and set `room.decisions[bot.id]`
4. Find team decision by faction
5. Pick one random option id and set `room.teamVotes[faction][bot.id]`
6. If bot is leader for faction, pick random team option id and set `room.teamDecisions[faction]`

Timing:
- add jitter per bot (e.g. 200ms to 2200ms) so submissions are staggered
- leader lock delay should be slightly later than team votes (e.g. +500ms)

### 4) Determinism Option

Default random:
- `Math.random()`

Optional seeded mode (recommended):
- env/config seed for reproducible playtests
- deterministic PRNG helper used by bot choice function

### 5) Dev-Only Guardrails

Hard gates:
- only active when `NODE_ENV !== "production"`
- behind explicit flag, e.g. `DEV_BOT_AUTOPLAY=1`

Kill switch:
- runtime toggle event (optional), e.g. `gm:set-bot-autoplay` for quick on/off in session

## Proposed Server Changes

### New file

`packages/server/src/devBots.ts`

Responsibilities:
- create bot players for a room (`seedBotsForRoom`)
- schedule decision-phase autoplay (`scheduleBotDecisionSubmissions`)
- random option pick helpers (`pickRandomOptionId`)

### Touch points

`packages/server/src/events.ts`
- extend `dev:bootstrap` payload to accept bot mode flags
- call `seedBotsForRoom()` after inserting human player

`packages/server/src/game.ts`
- when entering `decision`, after `emitDecisions()`, call `scheduleBotDecisionSubmissions()` in dev mode

No client protocol changes required.

## Minimal API Sketch

```ts
// packages/server/src/devBots.ts
export interface DevBotOptions {
  mode: "all_roles" | "minimum_table";
  seed?: number;
  submitJitterMs?: [number, number];
  leaderExtraDelayMs?: number;
}

export function seedBotsForRoom(room: GameRoom, humanPlayerId: string, opts: DevBotOptions): void;

export function scheduleBotDecisionSubmissions(
  io: Server,
  room: GameRoom,
  opts: DevBotOptions,
): void;
```

## Data/Rules for Role Filling

Use `FACTIONS` config from shared constants:
- `minimum_table` fills non-optional roles only
- `all_roles` fills every role

Leader mapping remains current:
- `ob_ceo`, `prom_ceo`, `china_director`
- external has no leader; no leader lock there

## Test Plan

Unit tests:
- bot seeding adds expected role coverage
- bot ids are unique and stable
- random pick always selects valid option ids
- leader bot sets `teamDecisions` for leader factions

Integration tests:
- `dev:bootstrap` + bots + decision phase results in non-empty `room.decisions`
- no crashes when round has missing role decision mapping
- bots do not run in production mode

Regression tests:
- existing multiplayer decision flow unchanged when bots disabled
- timer/phase flow unchanged

## Observability

Add concise logs:
- `[dev-bot] seeded N bots (mode=...)`
- `[dev-bot] submitted individual role=... option=...`
- `[dev-bot] voted faction=... option=...`
- `[dev-bot] leader-locked faction=... option=...`

Optional GM debug event:
- `gm:bot-status` -> counts by faction, autoplay enabled, last submissions

## Rollout Plan

1. Add bot seeding in `dev:bootstrap` (no autoplay yet)
2. Add decision-phase autoplay writes
3. Add jitter + optional seed mode
4. Add tests and logs

## Risks and Mitigations

Risk: bots overwrite human leader team lock.
- Mitigation: never create bot for a role occupied by human.

Risk: bots submit outside decision phase.
- Mitigation: phase guard inside autoplay scheduler.

Risk: stale bot timers after phase jump.
- Mitigation: cancel pending bot timeouts on phase change/jump.

Risk: confusion with existing "NPC message" system.
- Mitigation: name feature "dev bots" in code/docs; keep NPC persona system untouched.

## Acceptance Criteria

- Solo developer can run from `dev:bootstrap` and complete round decisions without manual second players.
- Each decision phase has bot submissions across missing roles/factions.
- Feature is fully disabled outside dev mode or when flag is off.
- Existing non-dev gameplay remains unchanged.
