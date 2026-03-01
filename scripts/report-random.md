# Simulation Report

- **Trials:** 10,000
- **Heuristic:** random
- **Generated:** 2026-03-01 12:24

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 1 | 0.0%  |
| China achieves parity — the US technological lead has evaporated | 9,996 | 100.0% ████████████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 0 | 0.0%  |
| Prometheus catches up — safety-focused research proves its worth | 3 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 125 | 1.3%  |
| Superficially aligned — a ticking time bomb of false compliance | 48 | 0.5%  |
| Aligned to oversight — safe under human supervision, for now | 741 | 7.4% ██ |
| Genuinely aligned — the AI systems demonstrably share human values | 9,086 | 90.9% ████████████████████ |

> **Warning:** One outcome dominates at 90.9% — may indicate a balance issue.

> **Note:** Large spread (0.5% – 90.9%). Some outcomes are much rarer than others.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 0 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 0 | 0.0%  |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 8,401 | 84.0% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 1,599 | 16.0% ████ |

> **Warning:** 3 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 84.0% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 177 | 1.8% █ |
| Cold war — open hostility stops short of direct conflict | 665 | 6.7% ████ |
| Tense but stable — managed competition with guardrails, barely holding | 2,461 | 24.6% ██████████████ |
| Arms control — binding agreements limit the most dangerous capabilities | 3,627 | 36.3% ████████████████████ |
| Joint cooperation — the US and China collaborate on AI safety | 3,070 | 30.7% █████████████████ |

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 51 | 0.5%  |
| Sustained protest — organized resistance to AI deployment | 0 | 0.0%  |
| Anxious but stable — a worried public, holding together for now | 9,791 | 97.9% ████████████████████ |
| Cautiously optimistic — the public is wary but open to the benefits | 158 | 1.6%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 97.9% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 0 | 0.0%  |
| Painful transition — mass unemployment and cascading supply chain failures | 1,132 | 11.3% ███ |
| Disruption with adaptation — difficult, but society is adjusting | 8,619 | 86.2% ████████████████████ |
| AI-driven boom — productivity gains lift all boats | 249 | 2.5% █ |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 86.2% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 6 | 0.1%  |
| Went open-source — Prometheus published its research to democratize AI safety | 1 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 48 | 0.5%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 9,945 | 99.5% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 99.5% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 89 | 0.9% █ |
| Blockade — China has imposed naval restrictions around Taiwan | 709 | 7.1% ████ |
| Standoff — forces massed, neither side willing to blink | 2,390 | 23.9% ██████████████ |
| De-escalation — diplomatic channels have reduced tensions | 3,456 | 34.6% ████████████████████ |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 3,356 | 33.6% ███████████████████ |

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 5,479 | 54.8% ████████████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 4,444 | 44.4% ████████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 77 | 0.8%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 22 | 13.9 | 0 | 11 | 21 | 32 | 72 |
| promCapability | 28 | 58.2 | 12.8 | 11 | 50 | 58 | 67 | 100 |
| chinaCapability | 18 | 65.3 | 11.5 | 28 | 57 | 65 | 73 | 100 |
| usChinaGap | 7 | -5.9 | 0.6 | -6 | -6 | -6 | -6 | 5 |
| obPromGap | 1 | -4.9 | 2.1 | -6 | -6 | -6 | -5 | 6 |
| alignmentConfidence | 55 | 99.5 | 2.6 | 56 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 3.8 | 7 | 0 | 0 | 0 | 5 | 59 |
| publicAwareness | 10 | 87.8 | 11.2 | 43 | 80 | 90 | 99 | 100 |
| publicSentiment | 30 | 59.6 | 22.7 | -31 | 44 | 60 | 76 | 100 |
| economicDisruption | 20 | 41.2 | 6.9 | 20 | 36 | 41 | 46 | 68 |
| taiwanTension | 20 | 30.7 | 20.2 | 0 | 15 | 30 | 45 | 100 |
| obInternalTrust | 65 | 67.9 | 14 | 20 | 58 | 68 | 78 | 100 |
| securityLevelOB | 2 | 4.9 | 0.3 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 4 | 1.1 | 1 | 3 | 4 | 5 | 5 |
| intlCooperation | 5 | 75.4 | 18.8 | 0 | 62 | 77 | 91 | 100 |
| marketIndex | 140 | 97.7 | 17.1 | 42 | 86 | 98 | 109 | 162 |
| regulatoryPressure | 10 | 97.6 | 5.9 | 47 | 100 | 100 | 100 | 100 |
| globalMediaCycle | 0 | 4.9 | 0.8 | 0 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 21.7 | 10.9 | 0 | 14 | 21 | 29 | 59 |
| aiAutonomyLevel | 10 | 39.5 | 7.2 | 16 | 35 | 39 | 44 | 67 |
| whistleblowerPressure | 5 | 7.9 | 13.2 | 0 | 0 | 0 | 12 | 100 |
| openSourceMomentum | 15 | 37.6 | 8.5 | 7 | 32 | 38 | 43 | 69 |
| doomClockDistance | 5 | 4.9 | 0.6 | 0 | 5 | 5 | 5 | 5 |
| obMorale | 75 | 80.8 | 15.7 | 10 | 70 | 82 | 95 | 100 |
| obBurnRate | 50 | 78.9 | 17 | 10 | 68 | 81 | 94 | 100 |
| obBoardConfidence | 70 | 44.3 | 21.8 | 0 | 29 | 44 | 59 | 100 |
| promMorale | 80 | 89.5 | 8.9 | 51 | 83 | 91 | 97 | 100 |
| promBurnRate | 40 | 56.6 | 13.3 | 9 | 48 | 57 | 66 | 100 |
| promBoardConfidence | 65 | 80 | 11.8 | 30 | 72 | 81 | 90 | 100 |
| promSafetyBreakthroughProgress | 20 | 44.3 | 6.5 | 22 | 40 | 44 | 49 | 73 |
| cdzComputeUtilization | 40 | 77.8 | 6.5 | 56 | 73 | 78 | 82 | 100 |
| ccpPatience | 60 | 68.5 | 12.6 | 17 | 60 | 68 | 77 | 100 |
| domesticChipProgress | 15 | 29.2 | 6.2 | 4 | 25 | 29 | 33 | 57 |

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
- `regulatoryPressure` — hits ceiling 100 in >50% of games
- `globalMediaCycle` — hits ceiling 5 in >50% of games
- `doomClockDistance` — hits ceiling 5 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `misalignmentSeverity` — hits floor 0 in >50% of games
- `whistleblowerPressure` — hits floor 0 in >50% of games

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | 0.73 | 2.08 | 1.09 | n/a | 0.00 | 1.01 | 0.99 | 0.00 |
| Alignment | 0.73 | - | 0.97 | 1.02 | n/a | 1.05 | 1.00 | 1.01 | 0.86 |
| Control | 2.08 | 0.97 | - | 1.32 | n/a | 0.95 | 1.00 | 1.31 | 0.00 |
| US-China R | 1.09 | 1.02 | 1.32 | - | n/a | 1.84 | 1.00 | 2.98 | 0.00 |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | 0.00 | 1.05 | 0.95 | 1.84 | n/a | - | 1.00 | 1.75 | 0.00 |
| Prometheus | 1.01 | 1.00 | 1.00 | 1.00 | n/a | 1.00 | - | 1.00 | 0.98 |
| Taiwan | 0.99 | 1.01 | 1.31 | 2.98 | n/a | 1.75 | 1.00 | - | 0.00 |
| Open Sourc | 0.00 | 0.86 | 0.00 | 0.00 | n/a | 0.00 | 0.98 | 0.00 | - |

## Summary

- **9 ending arcs** analyzed
- **9 unreachable outcomes** across all arcs
- **6 dominant outcomes** (>70% frequency)
- **3 stale variables** that barely move
- **9 variables** frequently hitting bounds
