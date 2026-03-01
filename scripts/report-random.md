# Simulation Report

- **Trials:** 20,000
- **Heuristic:** random
- **Generated:** 2026-03-01 11:48

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 1 | 0.0%  |
| China achieves parity — the US technological lead has evaporated | 19,997 | 100.0% ████████████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 0 | 0.0%  |
| Prometheus catches up — safety-focused research proves its worth | 2 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 186 | 0.9%  |
| Superficially aligned — a ticking time bomb of false compliance | 19,426 | 97.1% ████████████████████ |
| Aligned to oversight — safe under human supervision, for now | 263 | 1.3%  |
| Genuinely aligned — the AI systems demonstrably share human values | 125 | 0.6%  |

> **Warning:** One outcome dominates at 97.1% — may indicate a balance issue.

> **Note:** Large spread (0.6% – 97.1%). Some outcomes are much rarer than others.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 0 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 19,608 | 98.0% ████████████████████ |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 392 | 2.0%  |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 98.0% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 6,096 | 30.5% ████████████████████ |
| Cold war — open hostility stops short of direct conflict | 1,802 | 9.0% ██████ |
| Tense but stable — managed competition with guardrails, barely holding | 3,002 | 15.0% ██████████ |
| Arms control — binding agreements limit the most dangerous capabilities | 2,870 | 14.3% █████████ |
| Joint cooperation — the US and China collaborate on AI safety | 6,230 | 31.1% ████████████████████ |

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 1,404 | 7.0% ██ |
| Sustained protest — organized resistance to AI deployment | 0 | 0.0%  |
| Anxious but stable — a worried public, holding together for now | 18,596 | 93.0% ████████████████████ |
| Cautiously optimistic — the public is wary but open to the benefits | 0 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 93.0% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 19,947 | 99.7% ████████████████████ |
| Painful transition — mass unemployment and cascading supply chain failures | 53 | 0.3%  |
| Disruption with adaptation — difficult, but society is adjusting | 0 | 0.0%  |
| AI-driven boom — productivity gains lift all boats | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.7% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 0 | 0.0%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 296 | 1.5%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 19,704 | 98.5% ████████████████████ |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 98.5% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 5,167 | 25.8% ████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 2,731 | 13.7% █████████ |
| Standoff — forces massed, neither side willing to blink | 2,936 | 14.7% █████████ |
| De-escalation — diplomatic channels have reduced tensions | 2,851 | 14.3% █████████ |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 6,315 | 31.6% ████████████████████ |

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 3,674 | 18.4% █████ |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 16,314 | 81.6% ████████████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 12 | 0.1%  |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 81.6% — may indicate a balance issue.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 24.6 | 23.4 | 0 | 4 | 19 | 39 | 100 |
| promCapability | 28 | 74.9 | 20.5 | 0 | 61 | 78 | 93 | 100 |
| chinaCapability | 18 | 90.7 | 12.8 | 18 | 84 | 97 | 100 | 100 |
| usChinaGap | 7 | -6 | 0.3 | -6 | -6 | -6 | -6 | 4 |
| obPromGap | 1 | -5.1 | 2.3 | -6 | -6 | -6 | -6 | 8 |
| alignmentConfidence | 55 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 13 | 20 | 0 | 0 | 0 | 21 | 100 |
| publicAwareness | 10 | 100 | 0.2 | 95 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | 69.2 | 38.3 | -100 | 47 | 86 | 100 | 100 |
| economicDisruption | 20 | 94.4 | 11.2 | 27 | 95 | 100 | 100 | 100 |
| taiwanTension | 20 | 47.8 | 36.4 | 0 | 12 | 47 | 82 | 100 |
| obInternalTrust | 65 | 5.1 | 11.9 | 0 | 0 | 0 | 4 | 100 |
| securityLevelOB | 2 | 4.9 | 0.3 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 4 | 1.1 | 1 | 3 | 4 | 5 | 5 |
| intlCooperation | 5 | 100 | 0.8 | 66 | 100 | 100 | 100 | 100 |
| marketIndex | 140 | 0.1 | 1.6 | 0 | 0 | 0 | 0 | 67 |
| regulatoryPressure | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| globalMediaCycle | 0 | 5 | 0.5 | 0 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 67.9 | 26.5 | 0 | 49 | 72 | 90 | 100 |
| aiAutonomyLevel | 10 | 97.7 | 7.1 | 28 | 100 | 100 | 100 | 100 |
| whistleblowerPressure | 5 | 15.3 | 26.3 | 0 | 0 | 0 | 22 | 100 |
| openSourceMomentum | 15 | 98 | 7.2 | 25 | 100 | 100 | 100 | 100 |
| doomClockDistance | 5 | 4.9 | 0.5 | 0 | 5 | 5 | 5 | 5 |
| obMorale | 75 | 75.7 | 27.3 | 0 | 58 | 85 | 100 | 100 |
| obBurnRate | 50 | 75.8 | 28.6 | 0 | 58 | 88 | 100 | 100 |
| obBoardConfidence | 70 | 29.9 | 33 | 0 | 0 | 18 | 54 | 100 |
| promMorale | 80 | 89.5 | 13.1 | 18 | 82 | 95 | 100 | 100 |
| promBurnRate | 40 | 73.1 | 23.4 | 0 | 57 | 76 | 95 | 100 |
| promBoardConfidence | 65 | 85.3 | 12.1 | 7 | 80 | 90 | 90 | 100 |
| promSafetyBreakthroughProgress | 20 | 96.6 | 8.8 | 28 | 100 | 100 | 100 | 100 |
| cdzComputeUtilization | 40 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| ccpPatience | 60 | 99.7 | 2.5 | 50 | 100 | 100 | 100 | 100 |
| domesticChipProgress | 15 | 40.8 | 12.2 | 0 | 32 | 40 | 49 | 85 |

## Balance Flags

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelOB` (init: 2, mean: 4.9, std: 0.3)
- `securityLevelProm` (init: 3, mean: 4, std: 1.1)
- `doomClockDistance` (init: 5, mean: 4.9, std: 0.5)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `alignmentConfidence` — always ends at 100 (moved from initial 55)
- `publicAwareness` — hits ceiling 100 in >50% of games
- `economicDisruption` — hits ceiling 100 in >50% of games
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `intlCooperation` — hits ceiling 100 in >50% of games
- `regulatoryPressure` — always ends at 100 (moved from initial 10)
- `globalMediaCycle` — hits ceiling 5 in >50% of games
- `aiAutonomyLevel` — hits ceiling 100 in >50% of games
- `openSourceMomentum` — hits ceiling 100 in >50% of games
- `doomClockDistance` — hits ceiling 5 in >50% of games
- `promSafetyBreakthroughProgress` — hits ceiling 100 in >50% of games
- `cdzComputeUtilization` — always ends at 100 (moved from initial 40)
- `ccpPatience` — hits ceiling 100 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `misalignmentSeverity` — hits floor 0 in >50% of games
- `obInternalTrust` — hits floor 0 in >50% of games
- `marketIndex` — hits floor 0 in >50% of games
- `whistleblowerPressure` — hits floor 0 in >50% of games

### High Volatility

Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.

- `publicSentiment` (std: 38.3)
- `taiwanTension` (std: 36.4)
- `chinaWeightTheftProgress` (std: 26.5)
- `whistleblowerPressure` (std: 26.3)
- `obMorale` (std: 27.3)
- `obBurnRate` (std: 28.6)
- `obBoardConfidence` (std: 33)

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | 0.00 | n/a | 0.00 | n/a | n/a | 1.02 | 0.00 | n/a |
| Alignment | 0.00 | - | n/a | 2.49 | n/a | n/a | 1.02 | 2.48 | n/a |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | 0.00 | 2.49 | n/a | - | n/a | n/a | 1.00 | 3.17 | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | 1.02 | 1.02 | n/a | 1.00 | n/a | n/a | - | 1.00 | n/a |
| Taiwan | 0.00 | 2.48 | n/a | 3.17 | n/a | n/a | 1.00 | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **13 unreachable outcomes** across all arcs
- **7 dominant outcomes** (>70% frequency)
- **3 stale variables** that barely move
- **19 variables** frequently hitting bounds
