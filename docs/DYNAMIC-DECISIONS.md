# Dynamic Decision Generation

> **Status:** Future exploration (post-v1). Not planned for initial playtests.

## Problem

The current decision system uses 120 handcrafted templates — fixed archetypes, fixed variable scopes, fixed per round. The LLM fills in narrative and specific deltas, but the strategic structure is predetermined.

This means Round 1's choices don't meaningfully shape Round 5's decision *space*. State variables shift (±8 per effect, 5-8 effects per option), and the LLM wraps different narrative around those numbers, but the same 3 archetypes appear regardless of game trajectory. A catastrophic game and a utopian game present the same strategic framings to the same roles.

Decisions chain only through:
- Cumulative state drift (small nudges compound over 100 decision points)
- Threshold events (large permanent state changes when variables cross thresholds)
- Story bible narrative context (LLM sees what happened, writes accordingly)

None of these change the *structure* of future decisions — only the flavor text.

## Design Goal

Replace static templates with LLM-generated decision structures that branch based on game state. A player who tanks alignment confidence in Round 2 should face a fundamentally different Round 4 decision than one who invested in safety — different archetypes, different variable scopes, different strategic axes.

## Approaches

### A. Arc-First Generation

Generate a "decision arc" per role before Round 1. The arc is a branching plan:

```
ob_ceo arc:
  R1: "Board priority" — fundraising / government engagement / stealth
  R2:
    IF publicAwareness > 60: "Accountability crisis" — transparency / deflect / resign CTO
    IF publicAwareness <= 60: "Agent-3 deployment" — announce / stealth deploy / delay
  R3:
    IF alignmentConfidence < 40: "Board revolt" — defend record / negotiate terms / step down
    IF alignmentConfidence >= 40: "Expansion gambit" — acquire rival / internationalize / consolidate
  R4-5: [branches continue]
```

The arc replaces templates as scaffolding. Each round, the LLM picks the active branch based on current state, then generates specific options within that framing.

**Tradeoffs:**
- Maintains authorial structure while enabling genuine branching
- Combinatorial blowup: 2 branches/round x 5 rounds = 32 leaf nodes per role, 16 roles = 512 leaf nodes
- Arc quality depends heavily on the pre-game generation prompt
- Arcs are generated without knowing player behavior — generic until Round 1 completes

### B. Fully Reactive (No Templates)

Each round, the LLM gets state + history + story bible and generates all decisions from scratch. No templates, no arcs. The prompt specifies only mechanical constraints:

```
Generate 20 decisions for Round 3.

Constraints:
- 1 individual per role (external roles get 2, no team)
- 1 team per non-external faction
- Effects bounded ±8, 5-8 per option, ≥2 positive ≥2 negative
- Every state variable covered by ≥2 decisions this round
- No two same-faction decisions share >60% variable overlap

Context: [state, history, story bible]

For each decision, explain WHY this role faces THIS decision RIGHT NOW.
```

**Tradeoffs:**
- Maximum responsiveness — decisions genuinely shaped by prior rounds
- Hardest to control — LLM chases drama (capability races, doom clock) over quieter variables (morale, burn rate)
- No template invariant tests — need output validation instead
- Higher latency (one massive call vs. parallelized per-template calls)
- Risk of narrative repetition or thematic drift

### C. Hybrid: Scaffolded Arcs with Reactive Fill (Recommended)

Keep lightweight scaffolding but make it dynamic.

**Phase 1 — Pre-game arc generation:**

```typescript
interface RoleArc {
  role: Role;
  throughline: string;             // "CEO navigating speed vs. safety"
  escalationCurve: string[];       // per-round narrative beat
  keyVariables: (keyof StateVariables)[];
  inflectionPoints: {
    condition: StateCondition;
    narrativeShift: string;        // "board loses confidence, decisions pivot to survival"
  }[];
}

interface FactionArc {
  faction: Faction;
  teamThroughline: string;
  teamInflectionPoints: {
    condition: StateCondition;
    narrativeShift: string;
  }[];
}
```

The LLM generates ~16 role arcs + ~4 faction arcs. These define *what each role cares about* and *where the story could go*, but not specific decisions.

**Phase 2 — Per-round decision generation:**

Each round, the LLM generates decisions using the arc as guidance + current state. The arc tells it the role's throughline and active inflection points. Specific archetypes, scopes, and themes emerge from the intersection of arc + state.

**Phase 3 — Mid-game arc revision:**

After Round 3 (the midpoint), regenerate arcs for Rounds 4-5. The story bible + 3 rounds of actual play give the LLM enough context to plan a satisfying conclusion. This prevents early arcs from forcing stale trajectories.

**Tradeoffs:**
- Decisions chain meaningfully: the *type* of decision changes based on prior play
- Arcs provide enough structure to maintain coverage and balance
- Mid-game revision prevents staleness without full reactivity's chaos
- Moderate complexity — arc generation is one upfront call, per-round generation parallels current system
- Testable: validate arcs cover all variables, validate per-round output against mechanical constraints

## Mechanical Constraints (Preserved Across All Approaches)

These rules exist to prevent degenerate game states. They stay regardless of how decisions are generated:

| Constraint | Current | Dynamic |
|------------|---------|---------|
| 3 options per decision | Enforced by template | Enforced by validation schema |
| Effects bounded ±8 | Enforced by validation | Same |
| 5-8 effects per option | Enforced by validation | Same |
| ≥2 positive, ≥2 negative per option | Enforced by validation | Same |
| Variable coverage (every var in ≥2 decisions/round) | Enforced by template scopes | Enforced by post-generation audit |
| State clamping to canonical ranges | Resolution logic | Same |
| Conditional multiplier cap (≤2x) | Validation | Same |

The key difference: coverage shifts from **input guarantee** (templates ensure it by construction) to **output validation** (check after generation, retry if coverage gaps exist).

## What Changes Architecturally

| Layer | Current | Dynamic |
|-------|---------|---------|
| `decisions.ts` templates | 120 handcrafted entries | Replaced by arc generation |
| `decisions.test.ts` | Count templates, check invariants | Validate arc structure, check coverage |
| `buildDecisionPrompt()` | Injects template archetypes + scope | Injects arc throughline + inflection state |
| Generation parallelism | 1 LLM call per template (highly parallel) | 1 call per role (same parallelism) |
| Pre-game cost | None | ~30s for arc generation (20 arcs) |
| Per-round cost | ~5s per decision, parallelized | Similar — arc guidance replaces template |
| Testing | Deterministic template counts | Property-based: coverage, balance, distinctiveness |

## Open Questions

1. **Arc quality.** Can an LLM generate good branching arcs without knowing the players? The pre-game arc has no behavioral signal. After Round 1, it has one data point. May need to start with templates for Round 1 and generate arcs after.

2. **Cross-role coherence.** Current templates are authored to create interesting faction-internal tensions (CEO vs. CTO, scientist vs. policy). Dynamic generation needs to preserve this — the arc prompt must understand faction dynamics, not just individual role arcs.

3. **Balance regression.** Templates were tuned for mechanical balance through playtesting. Dynamic decisions will need a validation + retry loop. How many retries before falling back to a static template?

4. **Latency budget.** Arc generation adds ~30s pre-game. Mid-game revision adds ~30s after Round 3. Per-round generation is similar to current. Is the total budget acceptable?

5. **Determinism for debugging.** Current system is reproducible given the same state + templates. Dynamic arcs introduce another source of variance. Need to log generated arcs for post-game analysis.

6. **Graceful degradation.** If arc generation fails or produces degenerate output, fall back to static templates for that role/round. The current template set becomes the safety net rather than the primary system.

## Migration Path

1. Keep current templates as the v1 system and playtest baseline
2. Implement arc generation as an opt-in mode (`generationMode: "dynamic"` on GameRoom)
3. Run both systems in parallel during playtests — compare decision quality, player engagement, mechanical balance
4. Gradually retire static templates as dynamic generation proves reliable
