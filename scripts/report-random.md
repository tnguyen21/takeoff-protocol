# Simulation Report

- **Trials:** 20,000
- **Heuristic:** random
- **Generated:** 2026-03-01 08:38

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 0 | 0.0%  |
| China achieves parity — the US technological lead has evaporated | 19,998 | 100.0% ████████████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 0 | 0.0%  |
| Prometheus catches up — safety-focused research proves its worth | 2 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 0 | 0.0%  |
| Superficially aligned — a ticking time bomb of false compliance | 2,867 | 14.3% ████ |
| Aligned to oversight — safe under human supervision, for now | 3,067 | 15.3% ████ |
| Genuinely aligned — the AI systems demonstrably share human values | 14,066 | 70.3% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 70.3% — may indicate a balance issue.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 27 | 0.1%  |
| AI autonomous — the systems have outpaced human oversight capacity | 0 | 0.0%  |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 19,778 | 98.9% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 195 | 1.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 98.9% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 5,737 | 28.7% ██████████████████ |
| Cold war — open hostility stops short of direct conflict | 2,064 | 10.3% ███████ |
| Tense but stable — managed competition with guardrails, barely holding | 3,026 | 15.1% ██████████ |
| Arms control — binding agreements limit the most dangerous capabilities | 2,924 | 14.6% █████████ |
| Joint cooperation — the US and China collaborate on AI safety | 6,249 | 31.2% ████████████████████ |

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 265 | 1.3%  |
| Sustained protest — organized resistance to AI deployment | 1,034 | 5.2% █ |
| Anxious but stable — a worried public, holding together for now | 18,701 | 93.5% ████████████████████ |
| Cautiously optimistic — the public is wary but open to the benefits | 0 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 93.5% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 16,250 | 81.3% ████████████████████ |
| Painful transition — mass unemployment and cascading supply chain failures | 2,724 | 13.6% ███ |
| Disruption with adaptation — difficult, but society is adjusting | 970 | 4.9% █ |
| AI-driven boom — productivity gains lift all boats | 56 | 0.3%  |

> **Warning:** One outcome dominates at 81.3% — may indicate a balance issue.

> **Note:** Large spread (0.3% – 81.3%). Some outcomes are much rarer than others.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 0 | 0.0%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 368 | 1.8%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 19,632 | 98.2% ████████████████████ |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 98.2% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 5,096 | 25.5% ████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 2,705 | 13.5% █████████ |
| Standoff — forces massed, neither side willing to blink | 3,026 | 15.1% ██████████ |
| De-escalation — diplomatic channels have reduced tensions | 2,924 | 14.6% █████████ |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 6,249 | 31.2% ████████████████████ |

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 6,277 | 31.4% █████████ |
| Closed won — proprietary models dominate; open models fall far behind | 13,723 | 68.6% ████████████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 24.4 | 23.3 | 0 | 3 | 19 | 39 | 100 |
| promCapability | 28 | 74.8 | 20.8 | 0 | 61 | 77 | 93 | 100 |
| chinaCapability | 18 | 89.9 | 13.1 | 27 | 83 | 96 | 100 | 100 |
| usChinaGap | 7 | -6 | 0.3 | -6 | -6 | -6 | -6 | 6 |
| obPromGap | 1 | -5.1 | 2.3 | -6 | -6 | -6 | -6 | 8 |
| alignmentConfidence | 55 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 13.1 | 19.9 | 0 | 0 | 0 | 21 | 100 |
| publicAwareness | 10 | 100 | 0.2 | 95 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | 69.5 | 37.8 | -100 | 48 | 86 | 100 | 100 |
| economicDisruption | 20 | 94.5 | 11.1 | 23 | 95 | 100 | 100 | 100 |
| taiwanTension | 20 | 47.4 | 36.4 | 0 | 12 | 46 | 81 | 100 |
| obInternalTrust | 65 | 5 | 12 | 0 | 0 | 0 | 3 | 100 |
| securityLevelOB | 2 | 5 | 0.2 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 4 | 1.1 | 1 | 3 | 4 | 5 | 5 |
| intlCooperation | 5 | 100 | 0.7 | 55 | 100 | 100 | 100 | 100 |
| marketIndex | 140 | 140 | 0 | 140 | 140 | 140 | 140 | 140 |
| regulatoryPressure | 10 | 10 | 0 | 10 | 10 | 10 | 10 | 10 |
| globalMediaCycle | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| chinaWeightTheftProgress | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| aiAutonomyLevel | 10 | 10 | 0 | 10 | 10 | 10 | 10 | 10 |
| whistleblowerPressure | 5 | 5 | 0 | 5 | 5 | 5 | 5 | 5 |
| openSourceMomentum | 15 | 15 | 0 | 15 | 15 | 15 | 15 | 15 |
| doomClockDistance | 5 | 5 | 0 | 5 | 5 | 5 | 5 | 5 |
| obMorale | 75 | 75 | 0 | 75 | 75 | 75 | 75 | 75 |
| obBurnRate | 50 | 50 | 0 | 50 | 50 | 50 | 50 | 50 |
| obBoardConfidence | 70 | 70 | 0 | 70 | 70 | 70 | 70 | 70 |
| promMorale | 80 | 80 | 0 | 80 | 80 | 80 | 80 | 80 |
| promBurnRate | 40 | 40 | 0 | 40 | 40 | 40 | 40 | 40 |
| promBoardConfidence | 65 | 65 | 0 | 65 | 65 | 65 | 65 | 65 |
| promSafetyBreakthroughProgress | 20 | 20 | 0 | 20 | 20 | 20 | 20 | 20 |
| cdzComputeUtilization | 40 | 40 | 0 | 40 | 40 | 40 | 40 | 40 |
| ccpPatience | 60 | 60 | 0 | 60 | 60 | 60 | 60 | 60 |
| domesticChipProgress | 15 | 15 | 0 | 15 | 15 | 15 | 15 | 15 |

## Balance Flags

### Unwired Variables (no decisions affect them)

These variables never change from their initial value. No decision effects reference them.

- `marketIndex` (stuck at 140)
- `regulatoryPressure` (stuck at 10)
- `globalMediaCycle` (stuck at 0)
- `chinaWeightTheftProgress` (stuck at 0)
- `aiAutonomyLevel` (stuck at 10)
- `whistleblowerPressure` (stuck at 5)
- `openSourceMomentum` (stuck at 15)
- `doomClockDistance` (stuck at 5)
- `obMorale` (stuck at 75)
- `obBurnRate` (stuck at 50)
- `obBoardConfidence` (stuck at 70)
- `promMorale` (stuck at 80)
- `promBurnRate` (stuck at 40)
- `promBoardConfidence` (stuck at 65)
- `promSafetyBreakthroughProgress` (stuck at 20)
- `cdzComputeUtilization` (stuck at 40)
- `ccpPatience` (stuck at 60)
- `domesticChipProgress` (stuck at 15)

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelProm` (init: 3, mean: 4, std: 1.1)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `alignmentConfidence` — always ends at 100 (moved from initial 55)
- `publicAwareness` — hits ceiling 100 in >50% of games
- `economicDisruption` — hits ceiling 100 in >50% of games
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `intlCooperation` — hits ceiling 100 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `misalignmentSeverity` — hits floor 0 in >50% of games
- `obInternalTrust` — hits floor 0 in >50% of games

### High Volatility

Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.

- `publicSentiment` (std: 37.8)
- `taiwanTension` (std: 36.4)

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | 0.71 | 0.00 | 1.60 | n/a | 0.00 | 1.02 | 1.60 | n/a |
| Alignment | 0.71 | - | 1.40 | 0.99 | n/a | 1.09 | 1.01 | 0.99 | n/a |
| Control | 0.00 | 1.40 | - | 1.10 | n/a | 0.00 | 1.02 | 1.10 | n/a |
| US-China R | 1.60 | 0.99 | 1.10 | - | n/a | 2.46 | 1.00 | 3.20 | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | 0.00 | 1.09 | 0.00 | 2.46 | n/a | - | 1.02 | 2.46 | n/a |
| Prometheus | 1.02 | 1.01 | 1.02 | 1.00 | n/a | 1.02 | - | 1.00 | n/a |
| Taiwan | 1.60 | 0.99 | 1.10 | 3.20 | n/a | 2.46 | 1.00 | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **12 unreachable outcomes** across all arcs
- **6 dominant outcomes** (>70% frequency)
- **1 stale variables** that barely move
- **9 variables** frequently hitting bounds
