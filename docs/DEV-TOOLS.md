# Dev Tools — Design & Approach

The game has 5 rounds × 5 phases = 25 phase transitions minimum. Playing through all of them to test a UI tweak or check balance on round 4 decisions is untenable. This doc outlines the tools we need to iterate fast.

## Problem Statement

1. **No way to jump to a specific round/phase** — have to play through sequentially
2. **No way to set state variables** — can't test "what if chinaCapability is 80?"
3. **No way to preview endings** — have to complete all 5 rounds to see arc outcomes
4. **No way to test content conditions** — items gated on state thresholds are invisible unless you know the threshold
5. **No way to simulate decisions** — can't see what effect a decision option has without selecting it in a real game
6. **No fog inspector** — can't see what each faction actually perceives vs. true state

## Approach: GM Dev Panel + URL State Bootstrapping

Two complementary tools, both leveraging the existing architecture.

---

### Tool 1: State Editor (GM Dashboard Extension)

Extend the existing GM dashboard with a dev mode panel. The GM already has unfogged state and phase controls.

**Features:**

#### 1a. State Variable Sliders

Direct manipulation of all 14 state variables during a live game.

```
[ obCapability      ]===[====]=========  42  [set]
[ chinaCapability   ]=======[=]========  71  [set]
[ publicSentiment   ]====[-35]==========      [set]
```

Implementation: new socket event `gm:set-state` that patches `room.state` and re-emits fog views to all players. Server-side:

```ts
socket.on("gm:set-state", ({ variable, value }) => {
  room.state[variable] = clamp(value, bounds[variable]);
  emitStateViews(io, room);
});
```

This is ~15 lines of server code + a slider UI in the GM dashboard.

#### 1b. Jump to Round/Phase

Skip directly to any round × phase combination. Server-side:

```ts
socket.on("gm:jump", ({ round, phase }) => {
  room.round = round;
  room.phase = phase;
  room.decisions = {};
  room.teamDecisions = {};
  room.teamVotes = {};
  // Re-emit everything for the new round/phase
  emitPhaseContent(io, room);
});
```

The GM dashboard gets a dropdown: `Round [1-5] × Phase [briefing|intel|deliberation|decision|resolution]`.

#### 1c. Endings Preview

Button in GM dashboard: "Preview Endings". Calls `computeEndingArcs(room.state)` with current state and shows the `NarrativeArcTable` inline — no need to actually reach round 5.

Implementation: pure client-side. Import `computeEndingArcs` from shared, call it with `gmRawState`, render. Zero server changes.

#### 1d. Fog Inspector

Dropdown: "View as [faction/role]". Calls `computeFogView(room.state, faction, role, room.round)` client-side and shows the resulting `StateView` alongside the true state. Lets the GM see exactly what each player sees.

Also pure client-side — `computeFogView` is already in shared.

---

### Tool 2: URL Bootstrap (Solo Testing)

For solo dev testing without needing multiple browser tabs or a second player.

**URL format:**
```
localhost:5173/?dev=1&round=3&phase=intel&faction=openbrain&role=ob_cto&state=obCap:80,chinaCap:60,pubAware:50
```

**What it does:**
1. Auto-creates a room
2. Auto-assigns the specified faction/role (skip lobby)
3. Jumps to the specified round/phase
4. Overrides state variables from the `state` query param
5. Loads appropriate content and decisions for that round

This lets you do: "I want to see what the OB CTO's W&B chart looks like when obCapability is 80 in round 3" — paste a URL, see it.

**Implementation:** A `useDevMode` hook that reads URL params on mount and orchestrates the setup via the existing socket events. Needs a server-side `dev:bootstrap` event that combines create + join + role-select + jump.

---

### Tool 3: Decision Simulator (Deferred)

A standalone page that lets you:
- Pick any round's decisions
- Select options
- See the resulting state deltas
- Compare multiple option combinations side-by-side

This is useful for balance work but lower priority than tools 1 and 2. It can be fully client-side since `resolveDecisions` is in the shared package.

---

## Implementation Priority

| Tool | Effort | Impact | Priority |
|------|--------|--------|----------|
| 1a. State sliders | Small (1 event + UI) | High — test any scenario | **P0** |
| 1b. Jump to round/phase | Small (1 event + UI) | High — skip 20min of phases | **P0** |
| 1c. Endings preview | Tiny (client-only) | Medium — balance endings | **P1** |
| 1d. Fog inspector | Tiny (client-only) | Medium — debug visibility | **P1** |
| 2. URL bootstrap | Medium (hook + server event) | High — solo testing workflow | **P1** |
| 3. Decision simulator | Medium (new page) | Medium — balance work | **P2** |

## Architecture Notes

- All state computation (`resolveDecisions`, `computeFogView`, `computeEndingArcs`) lives in `@takeoff/shared` — already importable from both client and server. This means tools 1c, 1d, and 3 need zero server changes.
- The GM already has the true unfogged state in `gmRawState`. We just need UI to manipulate it.
- Gate all dev tools behind a `DEV` flag (`import.meta.env.DEV` on client, `process.env.NODE_ENV !== 'production'` on server) so they never ship to players.
- The `gm:set-state` and `gm:jump` events should only be accepted from the GM socket and only when `NODE_ENV !== 'production'`.

## State Variable Reference

For quick reference when building sliders and testing:

| Variable | Initial | Range | Direction |
|----------|---------|-------|-----------|
| obCapability | 30 | 0-100 | higher = more capable |
| promCapability | 28 | 0-100 | higher = more capable |
| chinaCapability | 18 | 0-100 | higher = more capable |
| usChinaGap | 7 | unbounded (months) | positive = US leads |
| obPromGap | 1 | unbounded (months) | positive = OB leads |
| alignmentConfidence | 55 | 0-100 | higher = more confident |
| misalignmentSeverity | 0 | 0-100 | higher = worse |
| publicAwareness | 10 | 0-100 | higher = more aware |
| publicSentiment | 30 | -100 to 100 | positive = pro-AI |
| economicDisruption | 20 | 0-100 | higher = worse |
| taiwanTension | 20 | 0-100 | higher = worse |
| obInternalTrust | 65 | 0-100 | higher = healthier |
| securityLevelOB | 2 | 1-5 discrete | higher = more secure |
| securityLevelProm | 3 | 1-5 discrete | higher = more secure |
| intlCooperation | 5 | 0-100 | higher = more cooperative |

## Ending Arcs (9 total)

Each arc resolves to one of 3-5 outcomes based on final state:

1. **AI Race** — who won, by how much
2. **Alignment** — was AI aligned, superficially or genuinely
3. **Control** — who controls AI (nobody / company / government / distributed)
4. **US-China Relations** — conflict to cooperation spectrum
5. **Public Reaction** — riots to blissful ignorance
6. **Economy** — collapse to boom
7. **Prometheus Fate** — marginalized to dominant
8. **Taiwan** — invasion to non-issue
9. **Open Source** — leaked weights to irrelevant debate

Preview these from the GM dashboard using `computeEndingArcs(currentState)` to check balance as you tune state variables.

---

## Tool 4: Monte Carlo Outcome Simulator

A headless Bun script that runs thousands of games with configurable player heuristics and reports the distribution of ending arc outcomes. No server, no sockets, no UI — pure computation.

### Core Idea

The entire game engine is deterministic and side-effect-free:
- `INITIAL_STATE` → starting state
- `resolveDecisions(state, chosenOptions)` → next state (pure function, returns new object)
- `computeEndingArcs(finalState)` → 9 ending arcs with outcome indices

Decisions for all 5 rounds live in static TypeScript files. A simulation run is:

```
for each trial:
  state = INITIAL_STATE
  for round 1..5:
    options = pickDecisions(roundDecisions, heuristic, state)
    state = resolveDecisions(state, options)
  arcs = computeEndingArcs(state)
  record(arcs)
print distribution
```

### Heuristics

Each heuristic is a function `(options: DecisionOption[], state: StateVariables) → DecisionOption` that picks one option from a decision. Examples:

- **random** — uniform random pick. Baseline.
- **hawkish** — maximize capability variables, minimize cooperation. Pick the option whose effects increase `obCapability`/`chinaCapability` the most or decrease `intlCooperation`/`alignmentConfidence`.
- **dovish** — maximize alignment/cooperation. Pick options that increase `alignmentConfidence`, `intlCooperation`, `publicSentiment`.
- **chaotic** — weighted random favoring options with larger absolute effect magnitudes.
- **greedy-{variable}** — pick the option that maximizes delta on a specific variable. Useful for stress-testing: "what if everyone optimizes for capability?"
- **mixed** — assign different heuristics per faction (e.g., OB=hawkish, Prom=dovish, China=hawkish, External=random). Most realistic.

### Files Touched

All imports, zero new production code:

| Import | From | Purpose |
|--------|------|---------|
| `INITIAL_STATE` | `@takeoff/shared` | Starting state |
| `resolveDecisions` | `@takeoff/shared` | Apply decisions to state |
| `computeEndingArcs` | `@takeoff/shared` | Compute 9 ending arcs |
| `ROUND1_DECISIONS` | `server/content/decisions/round1` | Round 1 decision trees |
| `ROUND2_DECISIONS` | `server/content/decisions/round2` | Round 2 decision trees |
| `ROUND3_DECISIONS` | `server/content/decisions/round3` | Round 3 decision trees |
| `ROUND4_DECISIONS` | `server/content/decisions/round4` | Round 4 decision trees |
| `ROUND5_DECISIONS` | `server/content/decisions/round5` | Round 5 decision trees |

The script itself lives at `scripts/simulate.ts` — not part of any package, just a standalone Bun script.

### Decision Structure

Each round has two layers of decisions:

1. **Individual decisions** — one per role (up to 16 roles across 4 factions). Each has 3 options with `StateEffect[]` arrays.
2. **Team decisions** — one per faction (4 total). Each has 3 options. In a real game, the faction leader picks after team vote.

Effects are additive deltas with optional conditional multipliers:
```ts
{ variable: "obCapability", delta: 5 }                    // simple
{ variable: "obCapability", delta: 5, condition: {         // conditional
    variable: "taiwanTension", threshold: 60,
    operator: "lt", multiplier: 1.5                        // 5 * 1.5 = 7.5 if tension < 60
  }
}
```

State is clamped after all effects: capabilities 0-100, gaps -6 to 12, sentiment -100 to 100, security 1-5.

### Output Format

```
$ bun scripts/simulate.ts --trials 10000 --heuristic mixed

Takeoff Protocol — 10,000 simulated games (heuristic: mixed)

Arc                  | Outcome Distribution
---------------------+------------------------------------------
AI Race              | stalemate: 12%  china-parity: 34%  ob-dominant: 41%  prom-catches-up: 13%
Alignment            | misaligned: 8%   superficial: 45%   oversight: 38%   genuine: 9%
Control              | none: 5%   autonomous: 15%   single-co: 32%   government: 28%   distributed: 20%
US-China Relations   | conflict: 3%   cold-war: 22%   tense: 48%   arms-ctrl: 19%   cooperation: 8%
...

Final State Distributions (mean ± std):
  obCapability:        62.3 ± 14.1
  chinaCapability:     41.7 ± 18.3
  alignmentConfidence: 48.2 ± 21.0
  ...
```

### Architecture Notes

- **No server needed** — `resolveDecisions` and `computeEndingArcs` are pure functions in `@takeoff/shared`. The script imports them directly.
- **Activity penalties optional** — can model them by randomly omitting primary app opens per role. The penalty logic is simple: if player didn't open their app, apply -3 (or +2 for ext_vc) to the mapped variable. Defined in `PRIMARY_APP_PENALTIES` in `server/game.ts`, easy to inline.
- **Faction-level heuristics** — assign different strategies per faction to model realistic play patterns. OB and China players tend hawkish, Prom tends dovish, External is mixed.
- **Sweep mode** — run the simulator across all heuristic combinations to find which faction strategies dominate. Produces a payoff matrix.
- **Sensitivity analysis** — perturb one decision at a time, measure outcome shift. Identifies which decisions matter most for balance tuning.
