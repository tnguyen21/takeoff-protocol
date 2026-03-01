# Simulation Report

- **Trials:** 10,000
- **Heuristic:** hawk
- **Generated:** 2026-03-01 12:24

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 0 | 0.0%  |
| China achieves parity — the US technological lead has evaporated | 9,999 | 100.0% ████████████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 0 | 0.0%  |
| Prometheus catches up — safety-focused research proves its worth | 1 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 5,523 | 55.2% ████████████████████ |
| Superficially aligned — a ticking time bomb of false compliance | 2,848 | 28.5% ██████████ |
| Aligned to oversight — safe under human supervision, for now | 1,478 | 14.8% █████ |
| Genuinely aligned — the AI systems demonstrably share human values | 151 | 1.5% █ |

> **Note:** Large spread (1.5% – 55.2%). Some outcomes are much rarer than others.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 0 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 3,933 | 39.3% █████████████ |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 6,067 | 60.7% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 10,000 trials.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 7,862 | 78.6% ████████████████████ |
| Cold war — open hostility stops short of direct conflict | 2,092 | 20.9% █████ |
| Tense but stable — managed competition with guardrails, barely holding | 45 | 0.4%  |
| Arms control — binding agreements limit the most dangerous capabilities | 1 | 0.0%  |
| Joint cooperation — the US and China collaborate on AI safety | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 78.6% — may indicate a balance issue.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 9,583 | 95.8% ████████████████████ |
| Sustained protest — organized resistance to AI deployment | 9 | 0.1%  |
| Anxious but stable — a worried public, holding together for now | 406 | 4.1% █ |
| Cautiously optimistic — the public is wary but open to the benefits | 2 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 95.8% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 289 | 2.9% █ |
| Painful transition — mass unemployment and cascading supply chain failures | 8,424 | 84.2% ████████████████████ |
| Disruption with adaptation — difficult, but society is adjusting | 1,287 | 12.9% ███ |
| AI-driven boom — productivity gains lift all boats | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 84.2% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 12 | 0.1%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 0 | 0.0%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 9,988 | 99.9% ████████████████████ |

> **Warning:** 3 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 99.9% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 7,043 | 70.4% ████████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 2,346 | 23.5% ███████ |
| Standoff — forces massed, neither side willing to blink | 602 | 6.0% ██ |
| De-escalation — diplomatic channels have reduced tensions | 6 | 0.1%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 3 | 0.0%  |

> **Warning:** One outcome dominates at 70.4% — may indicate a balance issue.

> **Note:** Large spread (0.0% – 70.4%). Some outcomes are much rarer than others.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 508 | 5.1% ██ |
| Closed won — proprietary models dominate; open models fall far behind | 5,111 | 51.1% ████████████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 4,381 | 43.8% █████████████████ |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 71.7 | 12.6 | 26 | 64 | 73 | 81 | 100 |
| promCapability | 28 | 89.1 | 9 | 49 | 83 | 90 | 97 | 100 |
| chinaCapability | 18 | 86.2 | 8.2 | 49 | 81 | 87 | 92 | 100 |
| usChinaGap | 7 | -6 | 0.2 | -6 | -6 | -6 | -6 | 3 |
| obPromGap | 1 | -5.9 | 0.5 | -6 | -6 | -6 | -6 | 4 |
| alignmentConfidence | 55 | 41.9 | 16.8 | 0 | 30 | 41 | 53 | 100 |
| misalignmentSeverity | 0 | 23.1 | 13.3 | 0 | 13 | 23 | 33 | 78 |
| publicAwareness | 10 | 86 | 10.2 | 41 | 79 | 87 | 94 | 100 |
| publicSentiment | 30 | -36.8 | 19.7 | -100 | -51 | -38 | -24 | 47 |
| economicDisruption | 20 | 59.9 | 6.1 | 31 | 56 | 60 | 64 | 80 |
| taiwanTension | 20 | 86.7 | 14.4 | 17 | 78 | 91 | 100 | 100 |
| obInternalTrust | 65 | 33.2 | 11.8 | 0 | 25 | 33 | 41 | 80 |
| securityLevelOB | 2 | 4.9 | 0.3 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 3.6 | 1.1 | 1 | 3 | 4 | 5 | 5 |
| intlCooperation | 5 | 2.4 | 5.4 | 0 | 0 | 0 | 1 | 51 |
| marketIndex | 140 | 113.5 | 15.2 | 51 | 103 | 114 | 124 | 163 |
| regulatoryPressure | 10 | 98.4 | 4.2 | 59 | 100 | 100 | 100 | 100 |
| globalMediaCycle | 0 | 5 | 0.1 | 0 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 38.3 | 9.5 | 0 | 32 | 39 | 45 | 59 |
| aiAutonomyLevel | 10 | 68.6 | 6.7 | 43 | 64 | 69 | 73 | 90 |
| whistleblowerPressure | 5 | 57.3 | 23.5 | 0 | 41 | 58 | 74 | 100 |
| openSourceMomentum | 15 | 26.6 | 7.4 | 7 | 22 | 26 | 31 | 57 |
| doomClockDistance | 5 | 2 | 2.3 | 0 | 0 | 0 | 5 | 5 |
| obMorale | 75 | 25.1 | 16.3 | 0 | 13 | 24 | 36 | 90 |
| obBurnRate | 50 | 99.1 | 3.6 | 45 | 100 | 100 | 100 | 100 |
| obBoardConfidence | 70 | 97.7 | 6.2 | 38 | 100 | 100 | 100 | 100 |
| promMorale | 80 | 69.1 | 9.2 | 41 | 63 | 69 | 75 | 100 |
| promBurnRate | 40 | 67.6 | 11.9 | 24 | 60 | 68 | 76 | 100 |
| promBoardConfidence | 65 | 93 | 4.9 | 52 | 90 | 95 | 95 | 100 |
| promSafetyBreakthroughProgress | 20 | 33.4 | 5 | 20 | 30 | 33 | 37 | 54 |
| cdzComputeUtilization | 40 | 89.3 | 5 | 69 | 86 | 90 | 93 | 100 |
| ccpPatience | 60 | 86.8 | 9.8 | 49 | 80 | 88 | 95 | 100 |
| domesticChipProgress | 15 | 33.7 | 5.2 | 15 | 30 | 34 | 37 | 52 |

## Balance Flags

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelOB` (init: 2, mean: 4.9, std: 0.3)
- `securityLevelProm` (init: 3, mean: 3.6, std: 1.1)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `securityLevelOB` — hits ceiling 5 in >50% of games
- `regulatoryPressure` — hits ceiling 100 in >50% of games
- `globalMediaCycle` — hits ceiling 5 in >50% of games
- `obBurnRate` — hits ceiling 100 in >50% of games
- `obBoardConfidence` — hits ceiling 100 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `intlCooperation` — hits floor 0 in >50% of games
- `doomClockDistance` — hits floor 0 in >50% of games

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | 0.00 | n/a | n/a | n/a | n/a | 1.00 | 0.00 | 2.28 |
| Alignment | 0.00 | - | n/a | n/a | n/a | n/a | 1.00 | 0.00 | 0.95 |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | 1.00 | 1.00 | n/a | n/a | n/a | n/a | - | 1.00 | 1.00 |
| Taiwan | 0.00 | 0.00 | n/a | n/a | n/a | n/a | 1.00 | - | 0.76 |
| Open Sourc | 2.28 | 0.95 | n/a | n/a | n/a | n/a | 1.00 | 0.76 | - |

## Summary

- **9 ending arcs** analyzed
- **12 unreachable outcomes** across all arcs
- **6 dominant outcomes** (>70% frequency)
- **2 stale variables** that barely move
- **9 variables** frequently hitting bounds
