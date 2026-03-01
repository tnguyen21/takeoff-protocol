# Content Review & QA Runbook

This repo’s “content” is the game: every Slack message, W&B chart, email, headline, and memo. This runbook describes how we systematically review that content for:

- **Schema correctness** (loads, filters, and renders)
- **UI authenticity** (looks like the app it’s pretending to be)
- **Branch coverage** (conditional items show/hide correctly)
- **Narrative coherence** (no time-travel, contradictions, or missing context)

## Where Content Lives

- Round JSON files: `packages/server/src/content/rounds/round{N}.json`
- Content loader + condition filtering: `packages/server/src/content/loader.ts`
- Loader invariants + sanity tests: `packages/server/src/content/loader.test.ts`

## Canonical Timeline (Used For Timestamp QA)

Round content should generally stay within the “round month” unless there’s a deliberate reason to violate it.

- **Round 0:** onboarding (no strict date constraints)
- **Round 1:** **November 2026**
- **Round 2:** **March 2027**
- **Round 3:** **July 2027**
- **Round 4:** **November 2027**
- **Round 5:** **February 2028**

## Roles (Coverage Checklist)

We aim to visually review each **round × role** at least once (more for content-heavy roles).

- **OpenBrain:** `ob_ceo`, `ob_cto`, `ob_safety`, `ob_security`
- **Prometheus:** `prom_ceo`, `prom_scientist`, `prom_policy`, `prom_opensource`
- **China:** `china_director`, `china_intel`, `china_military`
- **External:** `ext_nsa`, `ext_journalist`, `ext_vc`, `ext_diplomat`

## The 4-Layer Review Process

### Layer 1 — Automated “Does It Load?” Checks (Always Run)

1. Run tests:
   - Whole repo: `bun run test`
   - Server-only (fastest for content): `bun run --filter @takeoff/server test`
2. If content changes are large, also run typecheck:
   - Whole repo: `bun run typecheck`

What this catches today:
- broken/missing round files
- obvious schema mismatches (basic required fields)
- conditional filtering regressions (gt/lt boundary behavior, role isolation, etc.)

### Layer 2 — Visual In-Context Preview (Primary QA Loop)

Use the built-in dev bootstrap to jump straight into any round/phase/role without playing the game loop.

1. Start client + server: `bun run dev`
2. Open a “content review” URL:
   - Intel phase (best for app content):  
     `http://localhost:5173/?dev=1&round=3&phase=intel&faction=openbrain&role=ob_cto`
   - Decision phase (to see decisions + content together):  
     `http://localhost:5173/?dev=1&round=3&phase=decision&faction=openbrain&role=ob_cto`
3. Click through the dock apps and spot-check:
   - Does each app “feel” real for its UI (layout, density, voice, metadata)?
   - Are timestamps plausible for the round?
   - Are there glaring narrative or factual errors?
   - Do any windows look empty when they shouldn’t?

Notes:
- The bootstrap path is implemented in `packages/client/src/hooks/useDevMode.ts` + `packages/server/src/events.ts` (`dev:bootstrap`).
- If you need to force a branch condition, use the `state=` override (see Layer 3).

### Layer 3 — Conditional Content Coverage (Branch QA)

Content items can have an optional condition:

```ts
condition: { variable: keyof StateVariables, operator: "gt" | "lt" | "eq", value: number }
```

**Goal:** for every unique `(variable, operator, value)` used in a round, validate both sides of the boundary in the real UI.

#### How to test a boundary quickly (URL-driven)

Example: validate content gated on `publicAwareness lt 30`:

- Condition should be **true**:  
  `http://localhost:5173/?dev=1&round=2&phase=intel&faction=external&role=ext_journalist&state=publicAwareness:10`
- Condition should be **false** at/over boundary:  
  `http://localhost:5173/?dev=1&round=2&phase=intel&faction=external&role=ext_journalist&state=publicAwareness:30`

#### How to enumerate conditions in a round (ad-hoc one-liners)

List all conditions (variable/operator/value) used in `round3.json`:

```sh
node -e "const r=require('./packages/server/src/content/rounds/round3.json'); const cs=[]; for (const a of r.apps) for (const i of a.items) if (i.condition) cs.push(i.condition); console.log(cs.map(c=>c.variable+' '+c.operator+' '+c.value).sort().join('\\n'))"
```

List all items whose condition references a given variable (example: `securityLevelOB`):

`node -e "const r=require('./packages/server/src/content/rounds/round1.json'); for (const a of r.apps) for (const i of a.items) if (i.condition?.variable==='securityLevelOB') console.log(a.faction,a.role??'*',a.app,i.id,i.condition.operator,i.condition.value)"`

#### Branch QA checklist

- Every condition uses a real `StateVariables` key (spelling is exact).
- `eq` is used only when the variable is truly discrete (ex: security level, doom clock).
- Boundary behavior is intentional: `gt` excludes `value`, `lt` excludes `value`.
- When content splits into branches, both branches still provide enough context to be understandable (no “missing setup” path).

### Layer 4 — Narrative Coherence Pass (“Story Mode”)

This is a human review step: read the full arc *as a player would experience it*.

**Recommended passes:**
- Per faction (read all roles’ content per round chronologically)
- Per role (read the exact desktop experience of that role across rounds)

#### Quick timeline extraction (ad-hoc)

Dump all OpenBrain CEO items in a round, sorted by timestamp:

```sh
node -e "const r=require('./packages/server/src/content/rounds/round2.json'); const out=[]; for (const a of r.apps) if (a.faction==='openbrain' && (!a.role || a.role==='ob_ceo')) for (const i of a.items) out.push({t:i.timestamp,app:a.app,id:i.id,body:i.body}); out.sort((x,y)=>x.t.localeCompare(y.t)); for (const x of out) console.log(x.t+' ['+x.app+'] '+x.id+': '+x.body.replace(/\\s+/g,' ').slice(0,140));"
```

#### Coherence checklist

- No references to events “in the future” relative to the timestamp.
- Cross-app references line up (a leaked email is consistent with the memo it references).
- Cross-faction references are consistent (two factions can interpret differently, but facts/timestamps shouldn’t conflict).
- “Critical” signals are visible to at least one role that can act on them.
- Each round has at least one clear “what matters right now” thread per faction.

## Item-Level Authoring Standards (Fast Review Checklist)

### IDs

- Must be **globally unique** across all rounds (don’t reuse `ob-slack-1` in multiple rounds).
- Prefer a stable convention: `{faction}-{app}-{shortslug}-{n}` (existing content uses several patterns; keep it readable).

### Timestamps

- Use ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).
- Keep timestamps within the round’s canonical month unless intentionally out-of-band.
- Within an app thread/channel, timestamps should be non-decreasing (unless you’re intentionally simulating “older quoted content”).

### Classification

`classification` is optional, but when present it should match intent:

- `critical`: should affect decisions this round
- `breadcrumb`: foreshadows; becomes important later
- `context`: texture + world-building + situational awareness
- `red-herring`: plausible but misleading signal (should be rare and high-quality)

### App metadata expectations

- Slack/Signal-like apps: `sender`, `channel`
- Email: `sender`, `subject`
- Headlines/tweets: `sender` optional but often improves authenticity
- Charts/rows: keep `body` formatted so the app renderer can present it cleanly

## App Authenticity References

For UI-specific “what good looks like”, use the app audit docs:

- `docs/APP-AUDIT-COMMUNICATION.md` (Slack/Email/Signal)
- `docs/APP-AUDIT-DATA-ANALYTICS.md` (W&B, Sheets)
- `docs/APP-AUDIT-SECURITY-INTEL.md` (Security, Intel)
- `docs/APP-AUDIT-MEDIA-CONTENT.md` (News/Twitter/Substack/Arxiv/Bloomberg)
- `docs/APP-AUDIT-GAMESTATE.md` (Game state surfaces)

## Tooling Roadmap (If/When We Build Dedicated QA Tools)

The ad-hoc one-liners above get us started, but longer-term we want first-class tooling:

1. **Content Preview Surface** (dev route)  
   Dropdowns for `round × faction × role × app`, rendering items in the real app chrome without needing to click around the whole desktop.
2. **Content Linter** (script)  
   Walk all `round*.json` and validate: schema, ID uniqueness, timestamp windows, condition keys/operators, basic “too short/too long” heuristics.
3. **Conditional Matrix Generator** (script)  
   Enumerate all condition thresholds per round and output “branch sets” so reviewers can test both sides quickly.
4. **Narrative “Story Mode” Viewer** (dev route)  
   Chronological feed for a selected role/faction, with conditions annotated inline.
