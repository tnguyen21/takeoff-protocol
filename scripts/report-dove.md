# Simulation Report

- **Trials:** 10,000
- **Heuristic:** dove
- **Generated:** 2026-03-01 12:47

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 6,109 | 61.1% ████████████████████ |
| China achieves parity — the US technological lead has evaporated | 3,879 | 38.8% █████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 0 | 0.0%  |
| Prometheus catches up — safety-focused research proves its worth | 12 | 0.1%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 0 | 0.0%  |
| Superficially aligned — a ticking time bomb of false compliance | 0 | 0.0%  |
| Aligned to oversight — safe under human supervision, for now | 2 | 0.0%  |
| Genuinely aligned — the AI systems demonstrably share human values | 9,998 | 100.0% ████████████████████ |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 0 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 0 | 0.0%  |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 10,000 | 100.0% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 4 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 0 | 0.0%  |
| Cold war — open hostility stops short of direct conflict | 0 | 0.0%  |
| Tense but stable — managed competition with guardrails, barely holding | 6 | 0.1%  |
| Arms control — binding agreements limit the most dangerous capabilities | 155 | 1.6%  |
| Joint cooperation — the US and China collaborate on AI safety | 9,839 | 98.4% ████████████████████ |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 98.4% — may indicate a balance issue.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 0 | 0.0%  |
| Sustained protest — organized resistance to AI deployment | 0 | 0.0%  |
| Anxious but stable — a worried public, holding together for now | 5,990 | 59.9% ████████████████████ |
| Cautiously optimistic — the public is wary but open to the benefits | 4,010 | 40.1% █████████████ |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 10,000 trials.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 0 | 0.0%  |
| Painful transition — mass unemployment and cascading supply chain failures | 0 | 0.0%  |
| Disruption with adaptation — difficult, but society is adjusting | 3,299 | 33.0% ██████████ |
| AI-driven boom — productivity gains lift all boats | 6,701 | 67.0% ████████████████████ |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 0 | 0.0%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 8,449 | 84.5% ████████████████████ |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 1,551 | 15.5% ████ |

> **Warning:** 3 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 84.5% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 0 | 0.0%  |
| Blockade — China has imposed naval restrictions around Taiwan | 0 | 0.0%  |
| Standoff — forces massed, neither side willing to blink | 6 | 0.1%  |
| De-escalation — diplomatic channels have reduced tensions | 155 | 1.6%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 9,839 | 98.4% ████████████████████ |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 98.4% — may indicate a balance issue.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 7,868 | 78.7% ████████████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 2,132 | 21.3% █████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 78.7% — may indicate a balance issue.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 0.3 | 1.5 | 0 | 0 | 0 | 0 | 26 |
| promCapability | 28 | 22.2 | 10.5 | 0 | 15 | 22 | 29 | 66 |
| chinaCapability | 18 | 41.9 | 9.3 | 15 | 35 | 41 | 48 | 80 |
| usChinaGap | 7 | -0.7 | 3.8 | -6 | -4 | -2 | 2 | 12 |
| obPromGap | 1 | 0.2 | 4 | -6 | -3 | 0 | 3 | 12 |
| alignmentConfidence | 55 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 0.1 | 0.8 | 0 | 0 | 0 | 0 | 17 |
| publicAwareness | 10 | 91.5 | 8.5 | 53 | 86 | 93 | 100 | 100 |
| publicSentiment | 30 | 100 | 0.4 | 81 | 100 | 100 | 100 | 100 |
| economicDisruption | 20 | 25.5 | 4.8 | 13 | 22 | 25 | 29 | 46 |
| taiwanTension | 20 | 1.5 | 4.8 | 0 | 0 | 0 | 0 | 49 |
| obInternalTrust | 65 | 84.9 | 10.2 | 34 | 78 | 86 | 93 | 100 |
| securityLevelOB | 2 | 5 | 0.1 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 4.6 | 0.7 | 1 | 4 | 5 | 5 | 5 |
| intlCooperation | 5 | 100 | 0.2 | 83 | 100 | 100 | 100 | 100 |
| marketIndex | 140 | 95.1 | 13.1 | 45 | 86 | 95 | 104 | 144 |
| regulatoryPressure | 10 | 81.3 | 14 | 21 | 72 | 82 | 93 | 100 |
| globalMediaCycle | 0 | 3.9 | 2 | 0 | 3 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 8.3 | 7.1 | 0 | 2 | 8 | 12 | 44 |
| aiAutonomyLevel | 10 | 18.7 | 4.6 | 10 | 15 | 18 | 22 | 39 |
| whistleblowerPressure | 5 | 0.1 | 0.7 | 0 | 0 | 0 | 0 | 19 |
| openSourceMomentum | 15 | 44.3 | 6.5 | 19 | 40 | 45 | 49 | 68 |
| doomClockDistance | 5 | 5 | 0 | 5 | 5 | 5 | 5 | 5 |
| obMorale | 75 | 99.6 | 2.1 | 71 | 100 | 100 | 100 | 100 |
| obBurnRate | 50 | 44.8 | 15.7 | 0 | 34 | 44 | 56 | 100 |
| obBoardConfidence | 70 | 1.2 | 4.1 | 0 | 0 | 0 | 0 | 58 |
| promMorale | 80 | 98.5 | 3.1 | 71 | 98 | 100 | 100 | 100 |
| promBurnRate | 40 | 59.3 | 10.2 | 17 | 53 | 60 | 66 | 100 |
| promBoardConfidence | 65 | 65 | 10.6 | 27 | 58 | 65 | 72 | 100 |
| promSafetyBreakthroughProgress | 20 | 52.5 | 5.8 | 31 | 48 | 52 | 56 | 74 |
| cdzComputeUtilization | 40 | 64.4 | 5.1 | 52 | 61 | 64 | 68 | 86 |
| ccpPatience | 60 | 52.5 | 10.1 | 21 | 45 | 52 | 59 | 100 |
| domesticChipProgress | 15 | 22.5 | 5 | 6 | 19 | 22 | 26 | 42 |

## Balance Flags

### Unwired Variables (no decisions affect them)

These variables never change from their initial value. No decision effects reference them.

- `doomClockDistance` (stuck at 5)

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `misalignmentSeverity` (init: 0, mean: 0.1, std: 0.8)
- `securityLevelProm` (init: 3, mean: 4.6, std: 0.7)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `alignmentConfidence` — always ends at 100 (moved from initial 55)
- `publicSentiment` — hits ceiling 100 in >50% of games
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `securityLevelProm` — hits ceiling 5 in >50% of games
- `intlCooperation` — hits ceiling 100 in >50% of games
- `globalMediaCycle` — hits ceiling 5 in >50% of games
- `obMorale` — hits ceiling 100 in >50% of games
- `promMorale` — hits ceiling 100 in >50% of games
- `obCapability` — hits floor 0 in >50% of games
- `misalignmentSeverity` — hits floor 0 in >50% of games
- `taiwanTension` — hits floor 0 in >50% of games
- `whistleblowerPressure` — hits floor 0 in >50% of games
- `obBoardConfidence` — hits floor 0 in >50% of games

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | 1.00 | n/a | 1.02 | n/a | 0.99 | 6.45 | 1.02 | n/a |
| Alignment | 1.00 | - | n/a | 1.00 | n/a | 1.00 | 1.00 | 1.00 | n/a |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | 1.02 | 1.00 | n/a | - | n/a | 1.01 | 1.00 | 1.02 | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | 0.99 | 1.00 | n/a | 1.01 | n/a | - | 1.02 | 1.01 | n/a |
| Prometheus | 6.45 | 1.00 | n/a | 1.00 | n/a | 1.02 | - | 1.00 | n/a |
| Taiwan | 1.02 | 1.00 | n/a | 1.02 | n/a | 1.01 | 1.00 | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **21 unreachable outcomes** across all arcs
- **6 dominant outcomes** (>70% frequency)
- **2 stale variables** that barely move
- **13 variables** frequently hitting bounds
