# Game Logging & Analytics Design

## Problem

We have no structured logging. All server output is `console.log` with ad-hoc formatting. After a test game, we can't answer basic questions:

- How long did players spend in each app?
- Which decisions were most popular? Did leaders override their team's votes?
- How much did players chat? Who talked to whom?
- What was the state trajectory across rounds?
- Did players even read their primary app content?
- Which NPC triggers actually fired? Did they change behavior?

We need a logging system that captures everything needed to replay and analyze a game session, so we can tune content, balance decisions, and fix UX problems based on real player data.

## What to Log

### Event Envelope (required on every event)

Every event should use a consistent envelope so downstream analysis does not need per-event special cases.

```json
{
  "eventId": "evt_01HV...",
  "schemaVersion": 1,
  "sessionId": "ABCD_2026-03-03T12-34-56-789Z",
  "serverTime": 1709500000000,
  "event": "phase.changed",
  "round": 1,
  "phase": "briefing",
  "actorId": "player_42",
  "data": {}
}
```

Required envelope fields:

- `eventId`: unique ID for dedupe/idempotency
- `schemaVersion`: top-level event schema version
- `sessionId`: stable per game session (not just room code)
- `serverTime`: canonical server timestamp in ms
- `event`: event name
- `round`, `phase`: included when applicable, otherwise `null`
- `actorId`: player/NPC/GM/system actor when applicable, otherwise `null`
- `data`: event-specific payload

### Identity Semantics

- `playerId` must be stable for a participant across reconnects and the full game.
- `socketId` should be logged separately for transport/debugging only.
- `actorId` in the envelope should reference stable identity (`playerId`, `npcId`, `gmId`, or `system`).
- Avoid using socket IDs as primary identities in analytics events.

### Event Categories

**Lobby & Meta**
| Event | Key Fields |
|-------|-----------|
| `room.created` | code, gmName, timestamp |
| `player.joined` | playerId, name, code |
| `player.role_selected` | playerId, faction, role |
| `player.disconnected` | playerId, round, phase |
| `player.reconnected` | playerId, oldSocketId, newSocketId |
| `game.started` | code, playerCount, roster (name→faction→role), settings |
| `game.ended` | code, duration, finalState, arcs |

**Phase Flow**
| Event | Key Fields |
|-------|-----------|
| `phase.changed` | round, phase, duration, timestamp |
| `phase.paused` | round, phase, remainingMs |
| `phase.resumed` | round, phase, remainingMs |
| `phase.extended` | round, phase, extendCount, newDuration |
| `phase.gm_advanced` | round, phase (the phase being skipped) |

**Player Activity**
| Event | Key Fields |
|-------|-----------|
| `app.opened` | playerId, appId, round, phase, timestamp |
| `app.closed` | playerId, appId, durationMs, round, phase |
| `app.focused` | playerId, appId, timestamp |
| `activity.report` | playerId, appsOpened[], round, missedPrimary? |
| `activity.penalty` | playerId, role, primaryApp, variable, delta |

**Communication**
| Event | Key Fields |
|-------|-----------|
| `message.sent` | from, to (null=team), faction, contentLength, round, phase |
| `message.npc` | npcId, targetPlayerId, targetFaction, round, phase |

Message content logging is optional. For now, default to metadata logging and enable full transcripts only when explicitly needed for debugging.

**Decisions**
| Event | Key Fields |
|-------|-----------|
| `decision.individual_submitted` | playerId, role, decisionId, optionId, round, timeRemainingMs |
| `decision.team_vote` | playerId, faction, decisionId, optionId, round |
| `decision.team_locked` | faction, decisionId, optionId, round, leaderOverride? |
| `decision.inaction` | playerId, round (timer expired, no submission) |

**State**
| Event | Key Fields |
|-------|-----------|
| `state.snapshot` | round, phase, fullState (28 vars) |
| `state.delta` | round, changes: { variable, before, after, cause }[] |
| `state.gm_override` | variable, oldValue, newValue, gmId |

**Triggers**
| Event | Key Fields |
|-------|-----------|
| `threshold.fired` | thresholdId, round, phase, triggerVariable, triggerValue |
| `npc_trigger.fired` | triggerId, npcId, targetFaction, round, phase, wasCondition? |

**Publishing**
| Event | Key Fields |
|-------|-----------|
| `publish.submitted` | playerId, role, type (article/leak/research), title, round |

---

## Approaches

### Option A: JSONL file per game (recommended for now)

Each game session writes to `logs/{roomCode}_{timestamp}.jsonl`. One JSON object per line, one event per line.

```jsonl
{"eventId":"evt_1","schemaVersion":1,"sessionId":"ABCD_2026-03-03T12-34-56-789Z","serverTime":1709500000000,"event":"room.created","round":null,"phase":null,"actorId":"system","data":{"code":"ABCD","gmName":"Alice"}}
{"eventId":"evt_2","schemaVersion":1,"sessionId":"ABCD_2026-03-03T12-34-56-789Z","serverTime":1709500015000,"event":"player.joined","round":null,"phase":null,"actorId":"player_123","data":{"playerId":"player_123","name":"Bob","code":"ABCD","socketId":"sock_123"}}
{"eventId":"evt_3","schemaVersion":1,"sessionId":"ABCD_2026-03-03T12-34-56-789Z","serverTime":1709500120000,"event":"phase.changed","round":1,"phase":"briefing","actorId":"system","data":{"duration":180}}
{"eventId":"evt_4","schemaVersion":1,"sessionId":"ABCD_2026-03-03T12-34-56-789Z","serverTime":1709500300000,"event":"app.opened","round":1,"phase":"intel","actorId":"player_123","data":{"playerId":"player_123","appId":"slack"}}
{"eventId":"evt_5","schemaVersion":1,"sessionId":"ABCD_2026-03-03T12-34-56-789Z","serverTime":1709500450000,"event":"decision.individual_submitted","round":1,"phase":"intel","actorId":"player_123","data":{"playerId":"player_123","role":"ob_cto","optionId":"cautious_scaling","timeRemainingMs":45000}}
```

**Pros:**

- Zero dependencies. Just `Bun.write()` with append.
- Human-readable. `cat` the file, pipe to `jq`, grep for events.
- Trivially parseable. Each line is self-contained JSON.
- No schema migrations. Add fields freely.
- Easy to version control example logs for test fixtures.

**Cons:**

- No indexing. Queries over many games require reading all files.
- No aggregation without a script.
- File I/O on every event (mitigated by buffered writes).

**Implementation sketch:**

```typescript
// packages/server/src/logger.ts
import { appendFile, mkdir } from "fs/promises";

interface GameEvent {
  eventId: string;
  schemaVersion: number;
  sessionId: string;
  serverTime: number;
  event: string;
  round: number | null;
  phase: string | null;
  actorId: string | null;
  data: unknown;
}

class GameLogger {
  private path: string;
  private buffer: string[] = [];
  private readonly maxBufferSize = 1000;
  private flushing = false;
  private flushInterval: Timer;

  constructor(roomCode: string) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    this.path = `logs/${roomCode}_${ts}.jsonl`;
    mkdir("logs", { recursive: true });
    // flush buffer every 2s
    this.flushInterval = setInterval(() => this.flush(), 2000);
  }

  log(
    event: string,
    data: unknown,
    ctx?: { round?: number; phase?: string; actorId?: string },
  ) {
    const line = JSON.stringify({
      eventId: crypto.randomUUID(),
      schemaVersion: 1,
      sessionId: this.path,
      serverTime: Date.now(),
      event,
      round: ctx?.round ?? null,
      phase: ctx?.phase ?? null,
      actorId: ctx?.actorId ?? null,
      data,
    });
    this.buffer.push(line);
    if (this.buffer.length >= this.maxBufferSize) {
      void this.flush();
    }
  }

  private async flush() {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;
    const batch = this.buffer.join("\n") + "\n";
    this.buffer = [];
    try {
      await appendFile(this.path, batch);
    } catch (error) {
      // Requeue on failure so events are not dropped silently.
      this.buffer.unshift(...batch.trimEnd().split("\n"));
      console.error("[logger] flush failed", error);
    } finally {
      this.flushing = false;
    }
  }

  async close() {
    clearInterval(this.flushInterval);
    await this.flush();
  }
}
```

Usage: create a `GameLogger` instance per room, pass it into event handlers, call `logger.log("decision.individual_submitted", { ... }, { round, phase, actorId })` at each instrumentation point.

Reliability notes:

- Flush on process termination paths (`SIGINT`, `SIGTERM`) and on room cleanup/game end.
- Never drop events silently; surface flush failures and retry when possible.
- Keep event names canonical and versioned through `schemaVersion`.

---

### Option B: SQLite per-game database

Each game writes to `logs/{roomCode}_{timestamp}.db`. Structured tables for events, players, decisions, state snapshots.

```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  event TEXT NOT NULL,
  data JSON,
  player_id TEXT,
  round INTEGER,
  phase TEXT
);

CREATE TABLE state_snapshots (
  round INTEGER,
  phase TEXT,
  state JSON,
  PRIMARY KEY (round, phase)
);

CREATE TABLE decisions (
  round INTEGER,
  player_id TEXT,
  role TEXT,
  decision_type TEXT, -- 'individual' | 'team_vote' | 'team_locked'
  option_id TEXT,
  time_remaining_ms INTEGER,
  PRIMARY KEY (round, player_id, decision_type)
);
```

**Pros:**

- Queryable out of the box. `SELECT * FROM decisions WHERE round=3`.
- Bun has native SQLite (`bun:sqlite`), zero deps.
- Aggregations are trivial: `SELECT option_id, COUNT(*) FROM decisions GROUP BY option_id`.
- Can query across games if we merge DBs.
- Indexed lookups are fast.

**Cons:**

- Schema design upfront. Migrations if we add event types.
- More code to maintain (insert statements, table creation).
- Slightly harder to inspect than `cat file.jsonl | jq`.
- Binary format, can't `grep` directly.

---

### Option C: Hybrid (JSONL events + SQLite summaries)

Log raw events as JSONL (Option A) for full replay capability. At game end, generate a SQLite summary database with aggregated stats for analysis.

**Pros:**

- Best of both worlds. Raw events for debugging, structured data for analysis.
- Can re-derive SQLite from JSONL if schema changes.

**Cons:**

- Two systems to maintain.
- Probably overkill until we have enough games to need aggregation.

---

## Recommendation

**Start with Option A (JSONL).** It's the fastest to implement, easiest to debug, and sufficient for our current needs (analyzing individual test games). We can always write a script to ingest JSONL into SQLite later when we need cross-game aggregation.

Design guardrails to include from day one:

- Strict event envelope with required fields
- Canonical event naming (single namespace)
- Runtime payload validation at emit points
- Stable identity semantics (`playerId` vs `socketId`)

## Logging Principles

### Goals

- Reconstruct a full session timeline for replay/debugging.
- Answer product questions without guessing (engagement, decision behavior, threshold impact).
- Keep instrumentation overhead low enough to stay invisible during live games.
- Make schema evolution explicit and safe over time.

### Non-goals (v1)

- Building a real-time analytics backend.
- Building a full replay UI.
- Cross-game OLAP-grade querying in production.

## Runtime Architecture

### Components

1. `GameLogger` (server): receives typed events and buffers JSONL writes.
2. Event emitters (server handlers): all socket/game transitions emit domain events.
3. Client activity collector: captures app focus/open/close and periodically reports to server.
4. Offline analyzers (`scripts/`): parse JSONL and produce summaries/comparisons.

### Data Flow

```
Socket/Game action
  -> logger.log(event, data, context)
  -> in-memory buffer
  -> periodic or threshold flush to JSONL
  -> post-game scripts consume JSONL
```

### Event Ordering + Idempotency

- Ordering: preserve append order within a file; use `serverTime` for timeline sorting.
- Idempotency: `eventId` allows dedupe if retries/re-emits happen.
- Causality hints: include a lightweight `cause` in `data` for derived events (`state.delta` from decision lock, threshold fire, GM override).

## Validation & Schema Evolution

### Validation Strategy

- Every event goes through an envelope validator before enqueue.
- Event-specific payload validators enforce required fields by event name.
- Invalid events are rejected and counted (with an internal error log), never written as malformed rows.

### Schema Versioning Rules

- `schemaVersion` increments only on breaking envelope/payload changes.
- Backward-compatible additions (new optional fields/events) keep current version.
- Analysis scripts must branch on `schemaVersion` for breaking transitions.

### Canonical Naming Rules

- Use dot namespaces: `<domain>.<action>` (`decision.team_vote`, `phase.changed`).
- Use past-tense actions for facts that happened (`*.submitted`, `*.fired`, `*.changed`).
- Avoid aliases/synonyms; one canonical name per semantic event.

## Reliability & Failure Handling

### Failure Modes

1. Disk append fails (permissions/full disk/transient IO).
2. Process exits with non-empty buffer.
3. Event storm creates unbounded memory growth.
4. Validator bug rejects too many events.

### Mitigations

- Buffered writes with max buffer size + interval-based flush.
- Requeue on failed flush, with bounded retry and error telemetry.
- Force flush on room close and process termination (`SIGINT`, `SIGTERM`).
- Optional backpressure policy:
  - `strict`: block emitters if buffer > threshold.
  - `best_effort`: drop low-priority events only (never drop state/decision/phase events).

### Priority Tiers

- `critical`: phase/decision/state/threshold/game end.
- `important`: activity reports, publish events, GM actions.
- `verbose`: app focus chatter, high-frequency UX events.

If dropping is required in emergencies, drop `verbose` first and emit `logger.drop_notice`.

## Analysis Surface (v1 Scripts)

### `scripts/analyze-game.ts`

Outputs per-session summary:

- Session metadata (duration, rounds reached, phase timings).
- Decision stats (submission rates, lock choices, override incidence).
- Activity stats (time per app, missed primary app, inactive players).
- Communication stats (volume by faction/player, DM vs team).
- State trajectory (`state.delta` timeline + round snapshots).
- Trigger report (thresholds/NPC triggers fired and when).

### `scripts/compare-games.ts`

Outputs cross-session diff:

- Decision distribution shifts by role/faction.
- Engagement deltas (app usage and chat volume).
- State progression deltas by round.
- Trigger frequency differences.

## Testing Strategy

### Unit Tests

- Envelope validator: accepts valid, rejects malformed.
- Event payload validators per domain.
- Buffer/flush behavior (interval + max-buffer flush).
- Retry/requeue behavior on append failure.

### Integration Tests

- Simulated game run writes expected canonical events in expected order.
- Reconnect path preserves stable `playerId`.
- Shutdown path flushes pending events.
- Content-off mode never writes raw message text.

### Golden Fixtures

- Store sanitized JSONL fixtures for 1-2 representative games.
- Validate analyzer output against fixture expectations.

## Implementation Plan

### Phase 1: Core logger + server-side instrumentation

1. Create `GameLogger` class in `packages/server/src/logger.ts`
2. Create logger instance per room in `createRoom()`, store on `GameRoom`
3. Define `GameEvent` envelope type + canonical event name constants
4. Add runtime payload validation (e.g. zod/typebox/manual guards) in logger wrapper
5. Instrument `events.ts` — add `room.logger.log(...)` calls at each socket handler
6. Instrument `game.ts` — log phase transitions, state snapshots, threshold fires
7. Close logger on game end/room cleanup and flush on process termination signals
8. Add `logs/` to `.gitignore`

### Phase 2: Client-side activity reporting (enhance existing)

The client already reports `activity:report` per phase. Enhance to report:

- Per-app open/close timestamps (not just "which apps were opened")
- Time spent in each app window
- Which app was focused when

This requires changes in `packages/client/src/stores/ui.ts` to track timestamps, and a richer payload on `activity:report`.

### Phase 3: Analysis tooling

Write scripts in `scripts/` to answer common questions from JSONL logs:

- `scripts/analyze-game.ts` — per-game summary (decisions, activity, chat volume, state trajectory)
- `scripts/compare-games.ts` — diff two game logs to see how balance changes affected outcomes

### Phase 4: Optional message content logging

Add a flag (env var or GM toggle) to include full message content in logs for debugging sessions. Default off.

Suggested flags:

- `LOG_MESSAGE_CONTENT=true|false` (default `false`)

## Detailed TODOs (File-by-File)

### Server (`packages/server`)

1. `src/logger/types.ts`

- Add `GameEventEnvelope`, `EventContext`, `EventName` union/constants.
- Add per-event payload interfaces for critical events first (phase/decision/state/activity/message).

2. `src/logger/validation.ts`

- Add envelope validator.
- Add payload validators keyed by `event`.
- Return structured validation errors for internal metrics.

3. `src/logger/index.ts`

- Implement `GameLogger` with:
  - in-memory buffer
  - interval + threshold flush
  - retries/requeue
  - close/shutdown hooks
  - optional priority-aware dropping policy

4. `src/rooms/createRoom.ts` (or equivalent)

- Create logger per room/session with deterministic `sessionId`.
- Attach logger to `GameRoom`.

5. `src/events.ts`

- Emit canonical events at each socket handler boundary:
  - join/reconnect/disconnect
  - messaging
  - activity reports
  - decisions and votes
  - publish submissions

6. `src/game.ts`

- Emit:
  - `phase.changed`, pause/resume/extend
  - `state.delta` and periodic `state.snapshot`
  - threshold and NPC trigger events
  - `game.started` and `game.ended`

7. `src/config.ts`

- Add logging env flags:
  - `LOG_ENABLED`
  - `LOG_MESSAGE_CONTENT`

### Client (`packages/client`)

1. `src/stores/ui.ts`

- Track app open/close/focus transitions with timestamps.
- Track cumulative per-app dwell time per phase.

2. Socket activity emitter path

- Send richer `activity:report` payload at phase boundary and/or heartbeat interval.
- Include monotonic client timestamps if useful for ordering diagnostics.

### Tooling (`scripts`)

1. `analyze-game.ts`

- Parse JSONL safely (ignore malformed lines with warnings).
- Produce stable, human-readable summary.

2. `compare-games.ts`

- Normalize sessions by round count where possible.
- Output key diffs plus confidence caveats for incomplete sessions.

### Tests

1. Server tests for logger and validators.
2. End-to-end simulated game log emission test.
3. Script tests against fixture logs.

### Rollout

1. Enable logging in local/dev first, run 3-5 test sessions.
2. Review log quality and missing fields; patch instrumentation gaps.
3. Enable in test/staging when instrumentation is stable.
4. Decide whether to add SQLite summary generation once log volume justifies it.
