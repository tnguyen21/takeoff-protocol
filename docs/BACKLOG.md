# Backlog

Last updated: 2026-03-15

See also: `STATUS.md` for current bug list and priority recommendations.

---

## P0 — Fix Before First Playtest

### Client: Double `game:publish` Handler
**File:** `stores/game.ts` lines 485 + 527

Both handlers fire on every publish event, causing double notification and double content append. Remove one.

### Client: SlackApp Stale Closure
**File:** `apps/SlackApp.tsx:88`

`activeChannel` missing from `useCallback` dependency array. Message sent to wrong channel on rapid channel switch. Add `activeChannel` to deps.

### Client: Error Boundaries
**File:** entire app tree

No error boundaries anywhere. Any throw during render kills the full game session. Wrap each Window's content in an ErrorBoundary at minimum.

### Client: EmailApp Read State
**File:** `apps/EmailApp.tsx:401-432`

Read state keyed by array index. When `highRegulatory` becomes true, `REGULATORY_EMAIL` prepend shifts all indices. Key by stable identity (email subject or ID).

### Server: Wire `updateStoryBible()` into Resolution
**File:** `generation/context.ts:243`

`updateStoryBible()` is defined (~70 lines) but never called. Story bible doesn't grow between rounds, limiting narrative coherence for generated content. Call it from `emitResolution()` after state changes.

---

## P1 — Fix Before Hosting

### Server: Fix `history[].stateAfter`
**File:** `game.ts` ~line 237

`stateAfter` records pre-penalty, pre-threshold state. Nothing updates it afterward. Fix by recording stateAfter after `applyActivityPenalties()` + `checkThresholds()` + `clampState()`.

### Server: Room Cleanup Lifecycle
**Files:** `rooms.ts`, `game.ts:20`, `extendUses.ts`

`rooms` Map, `phaseTimers` Map, and `extendUses` Map grow forever. Add: TTL-based pruning for abandoned rooms (all disconnected for >N minutes), timer cancellation on room end, extend uses cleanup on room end.

### Server: Validate Decision Option IDs
**File:** `events.ts:359`

Any string accepted as decision option ID. Validate against the current round's decision options immediately on submit. Reject unknown IDs with error.

### Deploy to Fly.io
**Files:** `Dockerfile`, `fly.toml`

Config is ready but never deployed. Do first deploy, validate HTTPS/WSS, health check, and static asset serving.

### First Real Playtest
Run full game with real humans. Track: generation quality, pacing issues, confusing UX, balance feel, app engagement.

---

## P2 — Enrich Gameplay

### External Role Decisions
**Spec:** `EXTERNAL-ROLES-AUDIT.md`

All four external roles need per-round individual decisions:

**NSA Advisor** — Round 2: weight theft response (alert OB / monitor / FBI counter-op). Round 3: emergency powers recommendation (DPA nationalization / oversight committee / containment). Round 5: strategic posture.

**Tech Journalist** — Story angle system: different publication angles produce asymmetric faction-specific impacts. Safety crisis hits `alignmentConfidence` and `obBoardConfidence`. Capability hype hits `marketIndex` and `taiwanTension`. Source cultivation mechanics: publishing burns sources, protecting builds trust.

**VC/Investor** — Board authority decisions: vote to halt/proceed Agent-4 deployment. Capital leverage: withdraw Series F commitment, public divestment recommendation. Kingmaker: broker merger, fund safety foundation, back winner.

**International Diplomat** — Counter-offer mechanics for China negotiations. Coalition building with durability (G7 fracture risk). Leverage mechanisms: EU market access, Global South legitimacy, sanctions.

### Journalist Publication Impacts
**File:** `events.ts` publish:submit handler

Currently all publication types (`article`, `leak`, `research`) hit same generic variables (`publicAwareness`, `publicSentiment`). Make impacts faction-specific based on story content/angle. A safety exposé about OB should tank `obBoardConfidence`, boost `regulatoryPressure`, crash `marketIndex`.

### Ending Arc Balance Tuning
**Data:** `scripts/report-random.md`

Simulation shows: 0% OB dominant (unreachable), 86.9% genuinely aligned (too easy), 83.3% government controlled (dominates), 86.7% disruption with adaptation (dominates). Tune resolver thresholds in `endings.ts` and decision effect magnitudes in content files. Run hawk/dove mixed simulations to validate.

### Decision Generation (Phase D)
**Spec:** `GENERATIVE-CONTENT.md` Section 7

Template-constrained decision generation. Pre-author decision templates (theme, variable scope, archetypes). LLM generates narrative framing + specific effects. Hard validation: 3 options, no-free-lunch rule, effect budget, distinctness check, delta magnitude caps. Monte Carlo simulation check before accepting.

---

## P3 — Polish

### Desktop Performance
- `Desktop.tsx:37` — use individual Zustand selectors per field instead of destructuring entire store
- `Desktop.tsx:82-83` — memoize `contentByApp` map instead of calling `getContentForApp` per-window per-render
- `SignalApp.tsx:340-349` — pre-compute last timestamp per contact (O(n²) → O(n))
- `SignalApp.tsx:151-167` — wrap unread count computation in `useMemo`
- `UIStore openWindow/focusWindow` — use `set(s => ...)` pattern instead of `get()` outside updater

### Client CSS & UX Fixes
- `Dock.tsx:95` — define `negotiation-pulse` CSS class (currently Signal icon has no visual effect during Round 4)
- `PublishNotificationBanner.tsx:12-21` — auto-dismiss timer for all visible notifications, not just oldest
- `Dock.tsx`, `MenuBar.tsx`, `Notifications.tsx`, `NewsApp.tsx` — move inline `<style>` animations to global stylesheet
- Consolidate mixed inline styles and Tailwind usage

### Client Deduplication
- `formatTime(ms)` duplicated in Decision.tsx:7 and GMDashboard.tsx:9 — extract to shared utility
- `STATE_LABELS` duplicated in Ending.tsx and GMDashboard.tsx — move to `@takeoff/shared` or client constants
- Faction display maps (`FACTION_NAMES`, `FACTION_COLORS`, etc.) scattered across 4+ files — consolidate

### WandBApp Content Integration
**File:** `apps/WandBApp.tsx:129`

WandBApp ignores its `content` prop entirely — renders fully static data. Integrate server-provided content items (training metrics, safety probes) that change per round based on game state.

### Generation Logging
Add generation metrics to game logging system: latency per generation call, validation failure counts/reasons, fallback trigger counts, retry counts.

### Client Activity Tracking
Enhance `activity:report` to include per-app dwell time, focus transitions with timestamps, cumulative time per app per phase.

### Cross-Game Analysis
Build `scripts/compare-games.ts` — normalize sessions by round count, output decision distribution shifts, engagement deltas, state progression deltas, trigger frequency differences.

---

## Future (Post-Launch)

### Twitter: Trending + Faction Bubble
**Current state:** All factions share a single public Twitter pool (`content/shared/twitter.ts`).

Split into two layers:
1. **Shared trending pool** — viral tweets, breaking news, public discourse everyone sees
2. **Faction algorithmic bubble** — per-faction curated feed:
   - OpenBrain: tech insider discourse, capability optimism, startup culture
   - Prometheus: AI safety community, academic twitter, responsible AI
   - External: DC policy twitter, journalist threads, pundit analysis
   - China: Weibo-equivalent (or remove Twitter entirely for China)

### Slack: Real-Time Conversational NPCs (Option B)
**Current state:** Slack shows pre-authored + round-boundary generated content. Players chat in team channels. Round-boundary NPC generation is aware of player messages.

**Future:** LLM-powered NPCs that respond to player messages in real-time. See existing design in this file's git history or GENERATIVE-CONTENT.md for architecture details. Hybrid approach recommended: start with @mention triggers, then threshold triggers, then scheduled check-ins.

### Resolution Narrative Generation
Generate prose summary of what happened after decisions resolved. Described in GENERATIVE-CONTENT.md but not implemented. Would replace the current mechanical state-delta display with narrative text.

### GM Preview/Edit of Generated Content
Open question: should GM see generated content before emission? Adds latency but gives narrative control. Could be an opt-in toggle per room.

### Game Replay from Logs
Use JSONL game logs to reconstruct full game timeline. Could power: post-game debrief visualizations, highlight reels, "what if" replays with different decisions.

### Cross-Role Interaction Mechanics
From EXTERNAL-ROLES-AUDIT.md:
- NSA directs labs to upgrade security → moves `securityLevelOB/Prom`
- VC pulls funding → lab burn rate spikes → CEO forced to respond
- Diplomat leaks to journalist → shifts public framing
- Journalist tips off NSA → information trading between external roles
- VC threatens board resignation → forces lab CEO response
