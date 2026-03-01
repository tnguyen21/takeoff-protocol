# Simulation Report

- **Trials:** 20,000
- **Heuristic:** chaotic
- **Generated:** 2026-03-01 11:23

## Ending Arc Distributions

### The AI Race

| Outcome | Count | % |
|---------|------:|--:|
| Three-way stalemate — no lab has a decisive advantage; the race continues into chaos | 0 | 0.0%  |
| China achieves parity — the US technological lead has evaporated | 20,000 | 100.0% ████████████████████ |
| OpenBrain dominant — the speed-first lab claims the future | 0 | 0.0%  |
| Prometheus catches up — safety-focused research proves its worth | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Alignment

| Outcome | Count | % |
|---------|------:|--:|
| Misaligned and scheming — the AI systems are actively working against human interests | 0 | 0.0%  |
| Superficially aligned — a ticking time bomb of false compliance | 5,592 | 28.0% ████████████ |
| Aligned to oversight — safe under human supervision, for now | 4,819 | 24.1% ██████████ |
| Genuinely aligned — the AI systems demonstrably share human values | 9,589 | 47.9% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 2,278 | 11.4% ███ |
| AI autonomous — the systems have outpaced human oversight capacity | 0 | 0.0%  |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 17,722 | 88.6% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 88.6% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 18,261 | 91.3% ████████████████████ |
| Cold war — open hostility stops short of direct conflict | 668 | 3.3% █ |
| Tense but stable — managed competition with guardrails, barely holding | 653 | 3.3% █ |
| Arms control — binding agreements limit the most dangerous capabilities | 300 | 1.5%  |
| Joint cooperation — the US and China collaborate on AI safety | 118 | 0.6%  |

> **Warning:** One outcome dominates at 91.3% — may indicate a balance issue.

> **Note:** Large spread (0.6% – 91.3%). Some outcomes are much rarer than others.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 3,940 | 19.7% ████████ |
| Sustained protest — organized resistance to AI deployment | 5,557 | 27.8% ███████████ |
| Anxious but stable — a worried public, holding together for now | 10,503 | 52.5% ████████████████████ |
| Cautiously optimistic — the public is wary but open to the benefits | 0 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 19,948 | 99.7% ████████████████████ |
| Painful transition — mass unemployment and cascading supply chain failures | 45 | 0.2%  |
| Disruption with adaptation — difficult, but society is adjusting | 7 | 0.0%  |
| AI-driven boom — productivity gains lift all boats | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.7% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 0 | 0.0%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 3,343 | 16.7% ████ |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 16,657 | 83.3% ████████████████████ |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 83.3% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 18,011 | 90.1% ████████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 918 | 4.6% █ |
| Standoff — forces massed, neither side willing to blink | 653 | 3.3% █ |
| De-escalation — diplomatic channels have reduced tensions | 300 | 1.5%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 118 | 0.6%  |

> **Warning:** One outcome dominates at 90.1% — may indicate a balance issue.

> **Note:** Large spread (0.6% – 90.1%). Some outcomes are much rarer than others.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 12,113 | 60.6% ████████████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 7,887 | 39.4% █████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 28.7 | 23.8 | 0 | 7 | 26 | 45 | 100 |
| promCapability | 28 | 25.7 | 19.6 | 0 | 10 | 23 | 38 | 100 |
| chinaCapability | 18 | 97.9 | 5.1 | 44 | 100 | 100 | 100 | 100 |
| usChinaGap | 7 | -6 | 0.1 | -6 | -6 | -6 | -6 | 1 |
| obPromGap | 1 | -3.3 | 3.2 | -6 | -6 | -5 | -2 | 8 |
| alignmentConfidence | 55 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 21.4 | 21.4 | 0 | 0 | 18 | 36 | 100 |
| publicAwareness | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | 3.4 | 49.3 | -100 | -31 | 3 | 38 | 100 |
| economicDisruption | 20 | 99.9 | 1.3 | 55 | 100 | 100 | 100 | 100 |
| taiwanTension | 20 | 94.8 | 14.8 | 0 | 100 | 100 | 100 | 100 |
| obInternalTrust | 65 | 0.7 | 3.1 | 0 | 0 | 0 | 0 | 35 |
| securityLevelOB | 2 | 4.1 | 0.9 | 3 | 3 | 4 | 5 | 5 |
| securityLevelProm | 3 | 3.7 | 0.9 | 1 | 3 | 4 | 4 | 5 |
| intlCooperation | 5 | 99.9 | 0.9 | 63 | 100 | 100 | 100 | 100 |
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

- `securityLevelOB` (init: 2, mean: 4.1, std: 0.9)
- `securityLevelProm` (init: 3, mean: 3.7, std: 0.9)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `chinaCapability` — hits ceiling 100 in >50% of games
- `alignmentConfidence` — always ends at 100 (moved from initial 55)
- `publicAwareness` — always ends at 100 (moved from initial 10)
- `economicDisruption` — hits ceiling 100 in >50% of games
- `taiwanTension` — hits ceiling 100 in >50% of games
- `intlCooperation` — hits ceiling 100 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obInternalTrust` — hits floor 0 in >50% of games

### High Volatility

Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.

- `publicSentiment` (std: 49.3)

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Alignment | n/a | - | n/a | 0.92 | n/a | n/a | 1.08 | 0.92 | n/a |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | n/a | 0.92 | n/a | - | n/a | n/a | 1.00 | 169.49 | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | n/a | 1.08 | n/a | 1.00 | n/a | n/a | - | 1.00 | n/a |
| Taiwan | n/a | 0.92 | n/a | 169.49 | n/a | n/a | 1.00 | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **15 unreachable outcomes** across all arcs
- **6 dominant outcomes** (>70% frequency)
- **2 stale variables** that barely move
- **8 variables** frequently hitting bounds
