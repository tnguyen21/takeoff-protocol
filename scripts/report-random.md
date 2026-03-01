# Simulation Report

- **Trials:** 10,000
- **Heuristic:** random
- **Generated:** 2026-03-01 12:47

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 1,979 | 19.8% ███████ |
| China achieves parity — the US technological lead has evaporated | 5,989 | 59.9% ████████████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 0 | 0.0%  |
| Prometheus catches up — safety-focused research proves its worth | 2,032 | 20.3% ███████ |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 128 | 1.3%  |
| Superficially aligned — a ticking time bomb of false compliance | 54 | 0.5%  |
| Aligned to oversight — safe under human supervision, for now | 1,126 | 11.3% ███ |
| Genuinely aligned — the AI systems demonstrably share human values | 8,692 | 86.9% ████████████████████ |

> **Warning:** One outcome dominates at 86.9% — may indicate a balance issue.

> **Note:** Large spread (0.5% – 86.9%). Some outcomes are much rarer than others.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 5 | 0.1%  |
| AI autonomous — the systems have outpaced human oversight capacity | 0 | 0.0%  |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 8,331 | 83.3% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 1,664 | 16.6% ████ |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 83.3% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 157 | 1.6% █ |
| Cold war — open hostility stops short of direct conflict | 645 | 6.5% ████ |
| Tense but stable — managed competition with guardrails, barely holding | 2,418 | 24.2% █████████████ |
| Arms control — binding agreements limit the most dangerous capabilities | 3,669 | 36.7% ████████████████████ |
| Joint cooperation — the US and China collaborate on AI safety | 3,111 | 31.1% █████████████████ |

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 50 | 0.5%  |
| Sustained protest — organized resistance to AI deployment | 13 | 0.1%  |
| Anxious but stable — a worried public, holding together for now | 5,053 | 50.5% ████████████████████ |
| Cautiously optimistic — the public is wary but open to the benefits | 4,884 | 48.8% ███████████████████ |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 1 | 0.0%  |
| Painful transition — mass unemployment and cascading supply chain failures | 1,123 | 11.2% ███ |
| Disruption with adaptation — difficult, but society is adjusting | 8,670 | 86.7% ████████████████████ |
| AI-driven boom — productivity gains lift all boats | 206 | 2.1%  |

> **Warning:** One outcome dominates at 86.7% — may indicate a balance issue.

> **Note:** Large spread (0.0% – 86.7%). Some outcomes are much rarer than others.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 67 | 0.7%  |
| Went open-source — Prometheus published its research to democratize AI safety | 150 | 1.5%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 1,794 | 17.9% ████ |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 7,989 | 79.9% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 79.9% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 83 | 0.8%  |
| Blockade — China has imposed naval restrictions around Taiwan | 682 | 6.8% ████ |
| Standoff — forces massed, neither side willing to blink | 2,294 | 22.9% █████████████ |
| De-escalation — diplomatic channels have reduced tensions | 3,526 | 35.3% ████████████████████ |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 3,415 | 34.2% ███████████████████ |

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 5,447 | 54.5% ████████████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 4,494 | 44.9% █████████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 59 | 0.6%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 22.3 | 13.9 | 0 | 12 | 22 | 32 | 83 |
| promCapability | 28 | 58.3 | 12.7 | 11 | 50 | 58 | 67 | 100 |
| chinaCapability | 18 | 65.1 | 11.2 | 25 | 57 | 65 | 73 | 100 |
| usChinaGap | 7 | -2.7 | 3.3 | -6 | -4 | -4 | -2 | 12 |
| obPromGap | 1 | -2.1 | 4.1 | -6 | -6 | -3 | 1 | 12 |
| alignmentConfidence | 55 | 94.1 | 10 | 36 | 91 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 3.9 | 6.9 | 0 | 0 | 0 | 5 | 50 |
| publicAwareness | 10 | 87.9 | 11.1 | 38 | 80 | 90 | 99 | 100 |
| publicSentiment | 30 | 59.8 | 22.7 | -26 | 44 | 60 | 76 | 100 |
| economicDisruption | 20 | 41.2 | 6.9 | 17 | 36 | 41 | 46 | 72 |
| taiwanTension | 20 | 30.2 | 20.1 | 0 | 15 | 29 | 44 | 100 |
| obInternalTrust | 65 | 67.9 | 14 | 15 | 58 | 68 | 77.3 | 100 |
| securityLevelOB | 2 | 4.9 | 0.3 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 4 | 1.1 | 1 | 3 | 4 | 5 | 5 |
| intlCooperation | 5 | 75.6 | 18.6 | 5 | 63 | 77 | 91 | 100 |
| marketIndex | 140 | 97.9 | 17.2 | 40 | 86 | 98 | 110 | 165 |
| regulatoryPressure | 10 | 79.4 | 16 | 6 | 68 | 81 | 93 | 100 |
| globalMediaCycle | 0 | 4.9 | 0.8 | 0 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 21.7 | 10.9 | 0 | 14 | 21 | 29 | 59 |
| aiAutonomyLevel | 10 | 39.5 | 7.2 | 15 | 35 | 39 | 44 | 66 |
| whistleblowerPressure | 5 | 7.8 | 13 | 0 | 0 | 0 | 12 | 90 |
| openSourceMomentum | 15 | 37.7 | 8.5 | 10 | 32 | 38 | 44 | 69 |
| doomClockDistance | 5 | 4.9 | 0.6 | 0 | 5 | 5 | 5 | 5 |
| obMorale | 75 | 80.7 | 15.7 | 5 | 70 | 82 | 95 | 100 |
| obBurnRate | 50 | 79.4 | 16.9 | 7 | 68 | 81 | 94 | 100 |
| obBoardConfidence | 70 | 44.6 | 21.8 | 0 | 29 | 44 | 60 | 100 |
| promMorale | 80 | 89.5 | 8.9 | 53 | 84 | 91 | 97 | 100 |
| promBurnRate | 40 | 56.9 | 13.3 | 0 | 48 | 57 | 66 | 99 |
| promBoardConfidence | 65 | 79.9 | 11.9 | 31 | 72 | 81 | 90 | 100 |
| promSafetyBreakthroughProgress | 20 | 44.3 | 6.5 | 22 | 40 | 44 | 49 | 67 |
| cdzComputeUtilization | 40 | 77.6 | 6.3 | 55 | 73 | 78 | 82 | 99 |
| ccpPatience | 60 | 68.4 | 12.5 | 23 | 60 | 69 | 77 | 100 |
| domesticChipProgress | 15 | 29.2 | 6.2 | 6 | 25 | 29 | 33 | 51 |

## Balance Flags

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelOB` (init: 2, mean: 4.9, std: 0.3)
- `securityLevelProm` (init: 3, mean: 4, std: 1.1)
- `doomClockDistance` (init: 5, mean: 4.9, std: 0.6)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `alignmentConfidence` — hits ceiling 100 in >50% of games
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `globalMediaCycle` — hits ceiling 5 in >50% of games
- `doomClockDistance` — hits ceiling 5 in >50% of games
- `misalignmentSeverity` — hits floor 0 in >50% of games
- `whistleblowerPressure` — hits floor 0 in >50% of games

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | 1.01 | 0.95 | 1.05 | n/a | 0.93 | 1.25 | 1.05 | 1.00 |
| Alignment | 1.01 | - | 0.97 | 1.04 | n/a | 1.06 | 1.00 | 1.01 | 0.78 |
| Control | 0.95 | 0.97 | - | 1.28 | n/a | 0.82 | 1.04 | 1.29 | 0.00 |
| US-China R | 1.05 | 1.04 | 1.28 | - | n/a | 1.90 | 1.00 | 2.93 | 0.00 |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | 0.93 | 1.06 | 0.82 | 1.90 | n/a | - | 1.00 | 1.82 | 0.00 |
| Prometheus | 1.25 | 1.00 | 1.04 | 1.00 | n/a | 1.00 | - | 1.00 | 1.15 |
| Taiwan | 1.05 | 1.01 | 1.29 | 2.93 | n/a | 1.82 | 1.00 | - | 0.05 |
| Open Sourc | 1.00 | 0.78 | 0.00 | 0.00 | n/a | 0.00 | 1.15 | 0.05 | - |

## Summary

- **9 ending arcs** analyzed
- **6 unreachable outcomes** across all arcs
- **4 dominant outcomes** (>70% frequency)
- **3 stale variables** that barely move
- **6 variables** frequently hitting bounds
