# Simulation Report

- **Trials:** 10,000
- **Heuristic:** hawk
- **Generated:** 2026-03-01 12:47

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 81 | 0.8%  |
| China achieves parity — the US technological lead has evaporated | 7,944 | 79.4% ████████████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 20 | 0.2%  |
| Prometheus catches up — safety-focused research proves its worth | 1,955 | 19.6% █████ |

> **Warning:** One outcome dominates at 79.4% — may indicate a balance issue.

> **Note:** Large spread (0.2% – 79.4%). Some outcomes are much rarer than others.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 5,555 | 55.5% ████████████████████ |
| Superficially aligned — a ticking time bomb of false compliance | 4,290 | 42.9% ███████████████ |
| Aligned to oversight — safe under human supervision, for now | 149 | 1.5% █ |
| Genuinely aligned — the AI systems demonstrably share human values | 6 | 0.1%  |

> **Note:** Large spread (0.1% – 55.5%). Some outcomes are much rarer than others.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 0 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 4,033 | 40.3% ██████████████ |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 5,967 | 59.7% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 10,000 trials.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 7,246 | 72.5% ████████████████████ |
| Cold war — open hostility stops short of direct conflict | 2,721 | 27.2% ████████ |
| Tense but stable — managed competition with guardrails, barely holding | 31 | 0.3%  |
| Arms control — binding agreements limit the most dangerous capabilities | 2 | 0.0%  |
| Joint cooperation — the US and China collaborate on AI safety | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 72.5% — may indicate a balance issue.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 7,704 | 77.0% ████████████████████ |
| Sustained protest — organized resistance to AI deployment | 1,842 | 18.4% █████ |
| Anxious but stable — a worried public, holding together for now | 447 | 4.5% █ |
| Cautiously optimistic — the public is wary but open to the benefits | 7 | 0.1%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 77.0% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 93 | 0.9%  |
| Painful transition — mass unemployment and cascading supply chain failures | 7,744 | 77.4% ████████████████████ |
| Disruption with adaptation — difficult, but society is adjusting | 2,163 | 21.6% ██████ |
| AI-driven boom — productivity gains lift all boats | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 77.4% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 294 | 2.9% █ |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 1 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 0 | 0.0%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 9,705 | 97.0% ████████████████████ |

> **Warning:** 2 outcome(s) never occurred in 10,000 trials.

> **Warning:** One outcome dominates at 97.0% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 6,360 | 63.6% ████████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 2,742 | 27.4% █████████ |
| Standoff — forces massed, neither side willing to blink | 890 | 8.9% ███ |
| De-escalation — diplomatic channels have reduced tensions | 2 | 0.0%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 6 | 0.1%  |

> **Note:** Large spread (0.0% – 63.6%). Some outcomes are much rarer than others.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 502 | 5.0% ██ |
| Closed won — proprietary models dominate; open models fall far behind | 5,127 | 51.3% ████████████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 4,371 | 43.7% █████████████████ |

> **Warning:** 1 outcome(s) never occurred in 10,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 70.2 | 12.8 | 12 | 62 | 71 | 79 | 100 |
| promCapability | 28 | 89.7 | 8.7 | 47 | 84 | 91 | 97 | 100 |
| chinaCapability | 18 | 84.5 | 8.4 | 48 | 79 | 85 | 91 | 100 |
| usChinaGap | 7 | -4.1 | 2.3 | -6 | -6 | -4 | -4 | 12 |
| obPromGap | 1 | -4.8 | 2.3 | -6 | -6 | -6 | -5 | 12 |
| alignmentConfidence | 55 | 16.1 | 14.4 | 0 | 4 | 13 | 25 | 92 |
| misalignmentSeverity | 0 | 24.6 | 13.6 | 0 | 15 | 25 | 34 | 67 |
| publicAwareness | 10 | 85 | 10.6 | 43 | 78 | 86 | 94 | 100 |
| publicSentiment | 30 | -34.8 | 19.6 | -96 | -48 | -35 | -22 | 55 |
| economicDisruption | 20 | 58.6 | 6 | 32 | 55 | 59 | 63 | 78 |
| taiwanTension | 20 | 83.7 | 15.3 | 9 | 74 | 87 | 98 | 100 |
| obInternalTrust | 65 | 36.8 | 12.1 | 0 | 28 | 36 | 45 | 87 |
| securityLevelOB | 2 | 5 | 0.1 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 3.6 | 1.1 | 1 | 3 | 4 | 4 | 5 |
| intlCooperation | 5 | 2.2 | 5.1 | 0 | 0 | 0 | 1 | 61 |
| marketIndex | 140 | 117.6 | 15.4 | 65 | 107 | 118 | 128 | 169 |
| regulatoryPressure | 10 | 77.5 | 13.1 | 26 | 69 | 78 | 87 | 100 |
| globalMediaCycle | 0 | 5 | 0 | 5 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 35.9 | 9.4 | 0 | 30 | 37 | 43 | 59 |
| aiAutonomyLevel | 10 | 68.7 | 6.8 | 41 | 64 | 69 | 73 | 91 |
| whistleblowerPressure | 5 | 63.5 | 23 | 0 | 48 | 65 | 81 | 100 |
| openSourceMomentum | 15 | 26.7 | 7.5 | 7 | 22 | 26 | 32 | 56 |
| doomClockDistance | 5 | 2 | 2.3 | 0 | 0 | 0 | 5 | 5 |
| obMorale | 75 | 29.5 | 16.4 | 0 | 18 | 29 | 41 | 100 |
| obBurnRate | 50 | 99.6 | 2.3 | 51 | 100 | 100 | 100 | 100 |
| obBoardConfidence | 70 | 97.6 | 6.3 | 29 | 100 | 100 | 100 | 100 |
| promMorale | 80 | 69 | 9.2 | 41 | 63 | 69 | 75 | 100 |
| promBurnRate | 40 | 67.6 | 11.9 | 16 | 60 | 68 | 76 | 100 |
| promBoardConfidence | 65 | 93.1 | 5 | 56 | 90 | 95 | 95 | 100 |
| promSafetyBreakthroughProgress | 20 | 33.4 | 4.9 | 20 | 30 | 33 | 37 | 56 |
| cdzComputeUtilization | 40 | 89.3 | 5.1 | 67 | 86 | 90 | 93 | 100 |
| ccpPatience | 60 | 87.9 | 9.7 | 45 | 81 | 89 | 96 | 100 |
| domesticChipProgress | 15 | 33.8 | 5.1 | 16 | 30 | 34 | 37 | 53 |

## Balance Flags

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelProm` (init: 3, mean: 3.6, std: 1.1)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `securityLevelOB` — hits ceiling 5 in >50% of games
- `globalMediaCycle` — always ends at 5 (moved from initial 0)
- `obBurnRate` — hits ceiling 100 in >50% of games
- `obBoardConfidence` — hits ceiling 100 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `intlCooperation` — hits floor 0 in >50% of games
- `doomClockDistance` — hits floor 0 in >50% of games

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | 0.85 | n/a | n/a | n/a | n/a | 1.01 | 1.71 | 1.05 |
| Alignment | 0.85 | - | n/a | n/a | n/a | n/a | 1.03 | 0.00 | 0.76 |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | 1.01 | 1.03 | n/a | n/a | n/a | n/a | - | 1.03 | 1.00 |
| Taiwan | 1.71 | 0.00 | n/a | n/a | n/a | n/a | 1.03 | - | 1.14 |
| Open Sourc | 1.05 | 0.76 | n/a | n/a | n/a | n/a | 1.00 | 1.14 | - |

## Summary

- **9 ending arcs** analyzed
- **9 unreachable outcomes** across all arcs
- **5 dominant outcomes** (>70% frequency)
- **1 stale variables** that barely move
- **7 variables** frequently hitting bounds
