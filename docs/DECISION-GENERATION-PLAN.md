# Decision Generation (Phase D) — Implementation Plan

Last updated: 2026-03-16

---

## Context

The game currently uses **pre-authored decisions** for all 5 rounds — static `RoundDecisions` objects in `packages/server/src/content/decisions/round1-5.ts`. Each round has individual decisions (per role) and team decisions (per faction), each with exactly 3 options and 5-8 state effects per option.

Phase D introduces **LLM-generated decisions** using the same template-constrained approach proven by the existing briefing/content/NPC generation pipeline. The LLM generates narrative framing and specific effects, but within tight structural guardrails enforced by deterministic validation.

### Why before balance tuning?

Generated decisions produce a *range* of possible effect distributions rather than fixed deltas. Tuning ending arc thresholds against static decisions would be invalidated once generation is live. The right order:

1. Decision generation pipeline
2. Updated simulation with generated/variable decisions
3. Balance tuning against realistic distributions
4. (Parallel) Publication impact rework

### What exists

The generation infrastructure is mature:

| Component | Status |
|-----------|--------|
| Provider abstraction (Anthropic + Mock) | Complete |
| Context builder (story bible, state, history) | Complete |
| Validation framework (briefings, content, NPC) | Complete — no decision validation yet |
| Retry-once with error feedback | Complete |
| Per-round caching | Complete |
| Orchestrator with config kill switches | Complete |
| Graceful fallback to pre-authored content | Complete |
| Structured output via tool_use | Complete |

Decision generation slots into this infrastructure following the same patterns.

---

## Design: Template + Reframe

Rather than fully generating decisions from scratch (risky — degenerate strategies, orphan variables, faction bias), Phase D uses a **hybrid approach**:

### Decision Templates

Pre-authored templates define *structure* without narrative content:

```typescript
interface DecisionTemplate {
  round: number;
  role?: Role;                              // individual decision
  faction?: Faction;                        // team decision
  theme: string;                            // e.g., "deployment strategy"
  variableScope: (keyof StateVariables)[];  // which variables this decision touches
  archetypes: [string, string, string];     // e.g., ["aggressive", "balanced", "cautious"]
}
```

Templates ensure:
- Every important state variable is touched by at least one decision per round
- Decision space covers the design goals (hawk/dove/moderate archetypes)
- No single variable is over-represented or orphaned

### LLM Generation

Given template + story bible + current state + decision history, the LLM generates:
- `prompt`: narrative setup referencing what actually happened in the game
- Three `options` with `label`, `description`, `effects[]`
- Effects must stay within the template's `variableScope`

### Deterministic Validation

Hard constraints checked mechanically (no LLM judgment):
- Exactly 3 options per decision
- 5-8 effects per option
- |delta| <= 8 for any single effect
- No-free-lunch: each option has >= 2 positive AND >= 2 negative effects
- All effect variables exist in `STATE_VARIABLE_RANGES`
- All effect variables are within the template's `variableScope`
- Distinctness: no two options > 60% same-sign on shared variables

If validation fails: retry once with error feedback. If retry fails: fall back to pre-authored decisions for that round.

---

## Implementation Plan

### Tier 1 — Foundation (parallel, no dependencies)

#### Issue 1: Decision Validation Function

**Goal:** `validateDecisions()` in `packages/server/src/generation/validate.ts`

**Constraints to enforce:**
- Exactly 3 options per decision
- 5-8 effects per option
- |delta| <= 8 per effect
- No-free-lunch: >= 2 positive deltas AND >= 2 negative deltas per option
- All `effect.variable` values exist in `STATE_VARIABLE_RANGES`
- If templates provided: all effect variables within template's `variableScope`
- Distinctness: for any pair of options, < 60% of shared variables have same-sign deltas
- Conditional multipliers (if present): multiplier in [0.5, 3.0], referenced variable exists

**Returns:** `ValidationResult` (same shape as existing validators — `{ valid, errors, warnings }`)

**Files:**
- `packages/server/src/generation/validate.ts` — add `validateDecisions()`
- `packages/server/src/generation/validate.test.ts` — comprehensive tests

**Tests:**
- Valid decision set passes
- Each constraint violation produces specific error message
- Edge cases: exactly 2 positive / 2 negative (boundary), empty effects, duplicate variables in one option
- Conditional multiplier edge cases

---

#### Issue 2: Decision Cache + Config Extensions

**Goal:** Extend existing cache and config to support decisions.

**Config additions (`generation/config.ts`):**
- `decisionsEnabled: boolean` — reads `GEN_DECISIONS_ENABLED` env var (default `false`)
- `decisionModel: string` — reads `GEN_DECISION_MODEL` env var (default: same as briefing model, Sonnet-class)

**Cache additions (`generation/cache.ts`):**
- `setGeneratedDecisions(room, round, decisions: RoundDecisions)`
- `getGeneratedDecisions(room, round): RoundDecisions | undefined`

**Type extension (`packages/shared/src/types.ts`):**
- Add `decisions?: RoundDecisions` to `GeneratedRoundArtifacts`

**Files:**
- `packages/server/src/generation/config.ts`
- `packages/server/src/generation/cache.ts`
- `packages/shared/src/types.ts`

**Tests:**
- Config reads env correctly, defaults work
- Cache set/get round-trip
- Cache returns undefined for missing round
- Status transitions respected

---

#### Issue 3: Decision Templates for Rounds 1-5

**Goal:** Author `DecisionTemplate[]` covering all decision slots across 5 rounds.

**Scope:** New file `packages/server/src/generation/templates/decisions.ts`

Each round has:
- ~4 individual decisions (one per external role, plus faction leaders)
- ~4 team decisions (one per faction)
- Total: ~8 decisions per round × 5 rounds = ~40 decision slots

Not all need templates — rounds 1 and 5 may keep pre-authored decisions (bookend rounds with fixed narrative weight). Templates are most valuable for rounds 2-4 where the game state diverges.

**Design principles:**
- Every Tier 1 (public) state variable appears in >= 2 templates per round
- Every Tier 2 (hidden) state variable appears in >= 1 template per round
- Archetypes map to hawk/dove/balanced play styles
- Variable scopes overlap enough to create interesting tradeoffs but not so much that all decisions feel the same
- Theme names are evocative enough to guide the LLM's narrative framing

**Example template:**
```typescript
{
  round: 3,
  role: "ext_nsa",
  theme: "emergency powers response to Agent-4 crisis",
  variableScope: [
    "regulatoryPressure", "obCapability", "alignmentConfidence",
    "obBoardConfidence", "intlCooperation", "securityLevelOB",
    "aiAutonomyLevel", "obInternalTrust"
  ],
  archetypes: ["seize control", "force oversight", "back full speed"]
}
```

**Validation (tests):**
- INV-1: Every state variable in `STATE_VARIABLE_RANGES` appears in at least one template's scope across each round (2-4)
- INV-2: No template has fewer than 4 or more than 12 variables in scope
- INV-3: Every round 2-4 has templates for all 4 factions (team) and all individual roles that have decisions

**Open question:** Should rounds 1 and 5 use templates or stay fully pre-authored? Round 1 sets the stage (may want tight narrative control). Round 5 is the climax (may want dramatic options that couldn't be generated reliably). Recommendation: start with rounds 2-4 only; add 1 and 5 later if generation quality is good.

---

### Tier 2 — Core Generation (depends on Tier 1)

#### Issue 4: Decision Generation Function + Schema + Prompt

**Goal:** `generateDecisions()` and `generateDecisionsWithRetry()` in `packages/server/src/generation/decisions.ts`

**Architecture (follows existing pattern from `briefing.ts`):**

```
buildDecisionPrompt(context, templates)
  → provider.generate<RoundDecisions>(schema, prompt)
  → validateDecisions(result, templates)
  → if invalid: retry with error feedback
  → if still invalid: return null (triggers fallback)
```

**System prompt** (`generation/prompts/system.ts` — add `DECISION_SYSTEM_PROMPT`):
- Explains the game's decision structure (3 options, effects, no-free-lunch)
- References the template's theme, variableScope, archetypes
- Provides variable descriptions and ranges
- Emphasizes: options must feel genuinely different, not just magnitude variations
- Includes one example of a well-formed decision

**JSON schema** (structured output via tool_use):
- Matches `RoundDecisions` shape: `{ round, individual[], team[] }`
- Each decision: `{ role/faction, prompt, options[3] }`
- Each option: `{ id, label, description, effects[] }`
- Each effect: `{ variable (enum of state var names), delta (integer), condition? }`

**Generation strategy per round:**
- Input: story bible, current state, decision history, template for this slot
- Generate individual and team decisions in parallel (separate LLM calls per decision, or batch per round)
- Each call generates one decision (role or faction) — simpler prompts, easier validation, independent retry

**Files:**
- `packages/server/src/generation/decisions.ts` — generation + retry logic
- `packages/server/src/generation/prompts/system.ts` — decision system prompt
- `packages/server/src/generation/decisions.test.ts` — tests with MockProvider

**Tests:**
- MockProvider returns valid decisions → accepted
- MockProvider returns invalid decisions → retry triggered → fallback on second failure
- Generated option IDs are unique and follow naming convention
- Effects respect template variableScope
- Provider error (timeout, parse) → graceful null return

---

### Tier 3 — Integration (depends on Tier 2)

#### Issue 5: Wire Decision Generation into Game Flow

**Goal:** Orchestrator triggers decision generation; `emitDecisions()` serves generated decisions with pre-authored fallback.

**Orchestrator changes (`generation/orchestrator.ts`):**
- Add decision generation to `triggerGeneration()` alongside briefing/content/NPC
- Gate on `config.decisionsEnabled`
- Generate decisions for round N during resolution of round N-1 (same timing as briefing generation)
- Log lifecycle events: start, success, failure, fallback

**Game flow changes (`game.ts`):**
- `emitDecisions()`: check `getGeneratedDecisions(room, round)` first
  - If available and valid: use generated decisions
  - If not available or failed: fall back to pre-authored `ROUND_DECISIONS[round]`
- Ensure generated decision option IDs don't collide with pre-authored IDs (prefix with `gen_`)

**Decision submission (`events.ts`):**
- No changes needed — `decision:submit` handler already validates option IDs against the emitted decisions, not against pre-authored content

**Files:**
- `packages/server/src/generation/orchestrator.ts`
- `packages/server/src/game.ts`

**Tests:**
- End-to-end with MockProvider: trigger generation → cache → emit → verify decisions match generated content
- Fallback path: generation disabled → pre-authored served
- Fallback path: generation fails → pre-authored served
- Kill switch: `GEN_DECISIONS_ENABLED=false` → generation never triggered

---

#### Issue 6: Update Simulation for Variable Decisions

**Goal:** Simulation framework can evaluate balance with generated decision distributions.

**Approach:** Rather than calling the LLM during simulation (expensive, slow), use **effect range sampling**:

1. From templates, derive per-option effect ranges based on constraints (delta in [-8, 8], no-free-lunch, 5-8 effects from variableScope)
2. For each simulated trial, sample random valid effect sets per decision option
3. Apply heuristic selection as before (hawk/dove/random/chaotic)
4. Report outcome distributions

This tests whether the *space of possible generated decisions* produces balanced outcomes, without requiring actual LLM calls.

**Alternative approach:** Run the real generation pipeline once to produce N decision sets (e.g., 50-100), then simulate with each set × M heuristic trials. More realistic but requires API calls.

**Files:**
- `scripts/simulate-core.ts` — accept variable decision sets
- `scripts/simulate-generated.ts` — new script for generated-decision simulation
- Update report generation to show distribution comparisons

**Output:** Side-by-side comparison of arc outcome distributions: pre-authored vs generated-range simulations. Identifies if generated decisions widen or narrow the outcome space.

---

## Environment Variables (New)

| Variable | Default | Purpose |
|----------|---------|---------|
| `GEN_DECISIONS_ENABLED` | `false` | Master switch for decision generation |
| `GEN_DECISION_MODEL` | (same as briefing model) | Model for decision generation (recommend Sonnet-class) |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Generated decisions feel generic/bland | Templates provide thematic grounding; system prompt emphasizes narrative specificity |
| Effect distributions break game balance | Validation enforces no-free-lunch + delta bounds; simulation validates before shipping |
| LLM ignores variableScope constraint | Validation rejects out-of-scope effects; retry with specific error |
| Latency too high for in-game generation | Generate during previous round's resolution phase (180s budget); fall back to pre-authored |
| Conditional multipliers create extreme swings | Cap multiplier range [0.5, 3.0]; validation enforces |
| All generated options feel the same | Distinctness check: < 60% same-sign overlap; archetypes guide differentiation |

---

## Open Questions

1. **Which rounds to generate?** Recommendation: rounds 2-4 only. Rounds 1 (opening) and 5 (climax) stay pre-authored for narrative control. Revisit after quality validation.

2. **Per-decision or per-round generation?** Per-decision (one LLM call per decision slot) is simpler to validate and retry. Per-round (one call for all decisions) is cheaper but harder to partially retry. Recommendation: per-decision.

3. **Model choice?** Briefings use Sonnet, content uses Haiku. Decisions need narrative quality AND mechanical correctness — probably Sonnet. Haiku may produce more validation failures.

4. **GM preview?** Should the GM see generated decisions before they're emitted to players? Adds latency but gives narrative control. Could be an opt-in toggle. Defer to post-v1.

5. **Template authoring depth?** Minimal templates (just variableScope + archetypes) vs rich templates (include narrative beats, faction tensions, specific plot hooks). Recommendation: start minimal, enrich if generation quality is low.

---

## Dependencies Graph

```
Issue 1 (Validation) ─────┐
Issue 2 (Cache/Config) ────┼──→ Issue 4 (Generation) ──→ Issue 5 (Game Wiring)
Issue 3 (Templates) ───────┘                          ──→ Issue 6 (Simulation)
```

Issues 1, 2, 3 can run in parallel. Issue 4 blocks on all three. Issues 5 and 6 block on 4.
