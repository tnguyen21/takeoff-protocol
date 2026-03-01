# Balancing & Auditing Runbook

How to use the dev tools to audit game balance, test edge cases, and tune the experience before recruiting beta players.

## Setup

```bash
cd packages/server && bun dev     # terminal 1
cd packages/client && bun dev     # terminal 2
```

Open two browser tabs:
- **Tab A** — GM tab (create game, become GM)
- **Tab B** — Player tab (join same game, pick a faction/role)

All dev tools appear only in `DEV` mode (local dev server). They're in the GM Dashboard.

---

## Tool Reference

| Tool | Where | What it does |
|------|-------|-------------|
| **State Sliders** | GM Dashboard → State Panel (bottom) | Set any of 33 state variables to an exact value |
| **Jump to Round/Phase** | GM Dashboard → Timer column | Skip to any round (1-5) × phase (briefing/intel/deliberation/decision/resolution) |
| **Endings Preview** | GM Dashboard → "Preview Endings" button | See all 9 ending arcs computed from current state |
| **Fog Inspector** | GM Dashboard → State Panel (below bars) | See what any faction/role perceives vs. true state |
| **URL Bootstrap** | URL params on page load | Skip lobby, land directly in a faction/role/round/phase |

---

## Audit 1: Content Walkthrough (per faction)

**Goal:** Read every piece of content each faction sees, check for coherence, tone, and relevance.

For each faction/role combo, use URL bootstrap to drop in at each round's intel phase:

```
# OpenBrain CEO, Round 1
http://localhost:5173/?dev=1&round=1&phase=intel&faction=openbrain&role=ob_ceo

# OpenBrain CTO, Round 1
http://localhost:5173/?dev=1&round=1&phase=intel&faction=openbrain&role=ob_cto

# OpenBrain Safety, Round 1
http://localhost:5173/?dev=1&round=1&phase=intel&faction=openbrain&role=ob_safety

# OpenBrain Security, Round 1
http://localhost:5173/?dev=1&round=1&phase=intel&faction=openbrain&role=ob_security
```

Repeat for all 5 rounds × all roles:

| Faction | Roles |
|---------|-------|
| OpenBrain | ob_ceo, ob_cto, ob_safety, ob_security |
| Prometheus | prom_ceo, prom_scientist, prom_policy, prom_opensource |
| China | china_director, china_intel, china_military |
| External | ext_nsa, ext_journalist, ext_vc, ext_diplomat |

That's 15 roles × 5 rounds = **75 URL visits**. Focus first on rounds 1, 3, and 5 (beginning, midpoint, end).

### What to look for
- Does each app have enough content? Any empty apps?
- Do Signal/Slack messages reference characters by the right names?
- Is the narrative arc coherent across rounds for each role?
- Are content items correctly gated? (Some appear only when state variables cross thresholds — use state sliders to test both sides of the condition.)
- Is there enough "critical" content vs. "red-herring" noise per faction?

---

## Audit 2: Decision Balance

**Goal:** Verify no decision option is obviously dominant or useless.

### Quick scan

For each round, jump to the decision phase as each faction leader:

```
http://localhost:5173/?dev=1&round=1&phase=decision&faction=openbrain&role=ob_ceo
http://localhost:5173/?dev=1&round=1&phase=decision&faction=prometheus&role=prom_ceo
http://localhost:5173/?dev=1&round=1&phase=decision&faction=china&role=china_director
http://localhost:5173/?dev=1&round=1&phase=decision&faction=external&role=ext_nsa
```

For individual decisions, check each non-leader role too (each role has its own individual decision).

### What to look for
- Does each option have a clear tradeoff? No option should be "strictly better" than alternatives.
- Are the descriptions clear about what you're choosing?
- Do the effects feel proportionate? (A small narrative decision shouldn't swing state by 30 points.)

### State-dependent testing

Some decisions have conditional effects (multiplied when a variable crosses a threshold). Test by setting state before jumping:

```
# Test with high taiwan tension — does the China military decision feel different?
http://localhost:5173/?dev=1&round=3&phase=decision&faction=china&role=china_military&state=taiwanTension:80

# Test with low alignment confidence
http://localhost:5173/?dev=1&round=4&phase=decision&faction=openbrain&role=ob_safety&state=alignmentConfidence:20
```

---

## Audit 3: Ending Arc Sensitivity

**Goal:** Understand which variables actually determine endings, and whether the outcome space is reachable.

### Method: Slider sweeps

1. Start a game as GM, advance to any round
2. Open **Endings Preview** in GM Dashboard
3. Pick one variable at a time and sweep it across its range using the state slider
4. Watch how the ending arcs shift

### Key sweep tests

Each row is a scenario to set via state sliders, then check endings:

| Scenario | Variables to set | What to watch |
|----------|-----------------|---------------|
| OB dominance | obCapability: 85, obPromGap: 6, usChinaGap: 10 | AI Race → "OB dominant", Control → "Single company" |
| China catches up | chinaCapability: 70, usChinaGap: 2 | AI Race → "China parity", Taiwan arc |
| Prom resurgence | promCapability: 70, obPromGap: -2 | AI Race → "Prom catches up", Prometheus Fate → "Became trusted lab" |
| Alignment crisis | alignmentConfidence: 15, misalignmentSeverity: 80 | Alignment → "Misaligned and scheming", Control → "AI autonomous" |
| Safety victory | alignmentConfidence: 80, misalignmentSeverity: 10, intlCooperation: 65 | Alignment → "Genuinely aligned", Control → "Distributed" |
| Taiwan escalation | taiwanTension: 85, intlCooperation: 10 | Taiwan → "Full invasion", US-China → "Active conflict" |
| Economic collapse | economicDisruption: 80 | Economy → "Collapse", Public Reaction → "Riots" |
| Public backlash | publicAwareness: 80, publicSentiment: -60 | Public Reaction → "Riots", Economy shifts |
| Cooperative world | intlCooperation: 75, taiwanTension: 15, alignmentConfidence: 70 | US-China → "Joint cooperation", Control → "Distributed" |
| Everything bad | alignmentConfidence: 10, taiwanTension: 90, economicDisruption: 85, publicSentiment: -80 | Multiple worst-case arcs — should feel catastrophic |
| Everything good | alignmentConfidence: 80, taiwanTension: 10, economicDisruption: 15, intlCooperation: 80, publicSentiment: 50 | Multiple best-case arcs — should feel earned, not utopian |

### What to look for
- Are there "dead" arcs? (Outcomes that can never be reached regardless of state.)
- Are there "locked" arcs? (Outcomes that always resolve the same way because one variable dominates.)
- Does the stalemate (index 0) outcome for AI Race trigger too often? It's the fallthrough default.
- Is the Prometheus Fate arc sensitive enough to Prom-specific variables?

### Ending arc resolution thresholds (reference)

| Arc | Key variables | Thresholds |
|-----|-------------|------------|
| AI Race | obCapability, obPromGap, usChinaGap, promCapability | China parity: gap < 3. Prom: gap ≤ 1 & cap ≥ 55. OB: cap ≥ 65 & gap ≥ 4 |
| Alignment | alignmentConfidence, misalignmentSeverity | Genuine: conf ≥ 75 & sev ≤ 15. Misaligned: conf < 25 & sev > 60 |
| Control | intlCooperation, obInternalTrust, securityLevel*, obCapability, chinaCapability | Distributed: coop ≥ 60 & trust ≥ 60. Autonomous: conf < 30 & cap ≥ 70 |
| US-China | intlCooperation, taiwanTension | Full coop: coop ≥ 70 & tension ≤ 20. Conflict: tension > 75 |
| Public | publicAwareness, publicSentiment | Unaware: awareness ≤ 20. Riots: sentiment < -40 |
| Economy | economicDisruption | Boom: ≤ 25. Collapse: > 70 |
| Prometheus | promCapability, obPromGap, alignmentConfidence, intlCooperation | Trusted lab: cap ≥ OB or gap ≤ -2. Saved everyone: conf ≥ 70 & coop ≥ 50 |
| Taiwan | taiwanTension, intlCooperation | Invasion: > 80. Non-issue: ≤ 20. De-escalation: ≤ 40 & coop ≥ 40 |
| Open Source | publicAwareness, intlCooperation, securityLevel* | Leaked: awareness ≤ 30 & coop ≤ 30. Closed won: both security ≥ 4 |

---

## Audit 4: Fog of War Verification

**Goal:** Confirm each faction sees the right amount of information — not too much, not too little.

### Method

1. In GM Dashboard, open the **Fog Inspector**
2. Select each faction from the dropdown
3. Compare the "True" column vs the "Sees" column

### What to look for

- **Tier 2 variables** (chinaWeightTheftProgress, aiAutonomyLevel, whistleblowerPressure, doomClockDistance) should be **hidden from all factions**. These are engine-only.
- **Tier 3 variables** should be **exact for own faction, hidden for others**:
  - OB sees obMorale/obBurnRate/obBoardConfidence exactly
  - Prom sees promMorale/promBurnRate/promBoardConfidence/promSafetyBreakthroughProgress exactly
  - China sees cdzComputeUtilization/ccpPatience/domesticChipProgress exactly
- **Estimates** should have reasonable confidence intervals. A ±25 band on a 0-100 variable means ±25% — that's noisy. Is that appropriate?
- Does External faction have enough visibility to make informed decisions? They see publicAwareness, publicSentiment, economicDisruption, intlCooperation, and market/regulatory Tier 1 vars exactly.

### Cross-check with player tab

Set state to specific values via GM sliders, then look at Tab B (player tab) to confirm the GameState app shows the fogged values correctly. The numbers shown to the player should match what the Fog Inspector predicts.

---

## Audit 5: Resolution Narrative Coherence

**Goal:** Verify resolution screens make sense and state deltas are comprehensible.

### Method

1. Jump to round 1, decision phase
2. In Tab B, submit decisions for the player's role
3. As GM, advance to resolution
4. Read the resolution narrative — does it reference the decisions that were actually made?
5. Check the state delta bars — do they correspond to the narrative?

Repeat for rounds 2-5. Focus on whether the narrative text feels generic or responsive to player choices.

---

## Audit 6: Edge Cases & Breakpoints

Stress-test with extreme state values to find rendering bugs and narrative gaps.

### URL quick-tests

```
# All variables at max
http://localhost:5173/?dev=1&round=5&phase=intel&faction=openbrain&role=ob_ceo&state=obCapability:100,promCapability:100,chinaCapability:100,publicAwareness:100,publicSentiment:100,economicDisruption:100,taiwanTension:100

# All variables at min
http://localhost:5173/?dev=1&round=5&phase=intel&faction=openbrain&role=ob_ceo&state=obCapability:0,promCapability:0,chinaCapability:0,publicAwareness:0,publicSentiment:-100,economicDisruption:0,taiwanTension:0

# Contradictory state (high cooperation + high tension)
http://localhost:5173/?dev=1&round=3&phase=intel&faction=external&role=ext_diplomat&state=intlCooperation:90,taiwanTension:90

# Security at extremes
http://localhost:5173/?dev=1&round=4&phase=decision&faction=openbrain&role=ob_security&state=securityLevelOB:5,securityLevelProm:1
```

### What to look for
- Do sliders/bars handle min/max without UI overflow?
- Does the GameState app render negative values (publicSentiment: -100) correctly?
- Do contradictory states produce nonsensical narratives?
- Do security levels (discrete 1-5) render properly vs continuous 0-100 vars?

---

## Audit 7: Cross-Faction Information Asymmetry

**Goal:** Verify that fog creates interesting strategic tension, not just confusion.

### Method

Open 4 browser tabs, each bootstrapped as a different faction leader:

```
# Tab 1 — OB CEO
http://localhost:5173/?dev=1&round=3&phase=intel&faction=openbrain&role=ob_ceo
# Tab 2 — Prom CEO
http://localhost:5173/?dev=1&round=3&phase=intel&faction=prometheus&role=prom_ceo
# Tab 3 — China Director
http://localhost:5173/?dev=1&round=3&phase=intel&faction=china&role=china_director
# Tab 4 — NSA
http://localhost:5173/?dev=1&round=3&phase=intel&faction=external&role=ext_nsa
```

Compare what each sees in the GameState app. Key questions:
- Does OB know how far behind China is? (They get ±20 estimate on chinaCapability.)
- Does China know they're behind? (They see their own capability exactly but US-China gap exactly too.)
- Does anyone know about alignment problems? (Only OB gets an estimate on misalignmentSeverity.)
- Can External see enough to play kingmaker? (They see public vars + economics + cooperation.)

---

## Quick Reference: URL Bootstrap Format

```
http://localhost:5173/?dev=1&round={1-5}&phase={briefing|intel|deliberation|decision|resolution}&faction={openbrain|prometheus|china|external}&role={role_id}&state={key:value,key:value,...}
```

### All role IDs

```
ob_ceo, ob_cto, ob_safety, ob_security
prom_ceo, prom_scientist, prom_policy, prom_opensource
china_director, china_intel, china_military
ext_nsa, ext_journalist, ext_vc, ext_diplomat
```

### State override keys (commonly used)

```
obCapability, promCapability, chinaCapability       # 0-100
usChinaGap, obPromGap                               # months, can be negative
alignmentConfidence, misalignmentSeverity            # 0-100
publicAwareness, publicSentiment                     # 0-100, sentiment: -100 to 100
economicDisruption, taiwanTension                    # 0-100
obInternalTrust, intlCooperation                     # 0-100
securityLevelOB, securityLevelProm                   # 1-5
marketIndex                                          # 80-200
regulatoryPressure                                   # 0-100
doomClockDistance                                    # 0-5
```

---

## Checklist: Pre-Beta Confidence

Before inviting players, you should be able to answer "yes" to all of these:

- [ ] Read through all content for at least 2 factions across all 5 rounds
- [ ] Verified each round's decisions have clear tradeoffs (no dominant options)
- [ ] Swept state sliders and confirmed all 9 ending arcs are reachable
- [ ] Confirmed no ending arc is "locked" (always resolves to the same outcome)
- [ ] Checked fog inspector for each faction — information asymmetry feels fair
- [ ] Tested extreme state values — no rendering bugs or broken narratives
- [ ] Played through at least one full game (all 5 rounds) in 2-player mode
- [ ] Verified resolution narratives reflect actual decisions, not boilerplate
- [ ] Timed the phases — are default durations (2min briefing, 5min intel/deliberation/decision, 3min resolution) reasonable?
- [ ] Tested with GM timer overrides for shorter/longer phases
