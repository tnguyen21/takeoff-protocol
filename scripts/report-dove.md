# Simulation Report

- **Trials:** 20,000
- **Heuristic:** dove
- **Generated:** 2026-03-01 11:48

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
| Superficially aligned — a ticking time bomb of false compliance | 2,046 | 10.2% ███ |
| Aligned to oversight — safe under human supervision, for now | 2,144 | 10.7% ███ |
| Genuinely aligned — the AI systems demonstrably share human values | 15,810 | 79.0% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 79.0% — may indicate a balance issue.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 0 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 2,028 | 10.1% ██ |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 17,972 | 89.9% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 89.9% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 2 | 0.0%  |
| Cold war — open hostility stops short of direct conflict | 2 | 0.0%  |
| Tense but stable — managed competition with guardrails, barely holding | 13 | 0.1%  |
| Arms control — binding agreements limit the most dangerous capabilities | 114 | 0.6%  |
| Joint cooperation — the US and China collaborate on AI safety | 19,869 | 99.3% ████████████████████ |

> **Warning:** One outcome dominates at 99.3% — may indicate a balance issue.

> **Note:** Large spread (0.0% – 99.3%). Some outcomes are much rarer than others.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 0 | 0.0%  |
| Sustained protest — organized resistance to AI deployment | 0 | 0.0%  |
| Anxious but stable — a worried public, holding together for now | 20,000 | 100.0% ████████████████████ |
| Cautiously optimistic — the public is wary but open to the benefits | 0 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 4 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 14,505 | 72.5% ████████████████████ |
| Painful transition — mass unemployment and cascading supply chain failures | 5,200 | 26.0% ███████ |
| Disruption with adaptation — difficult, but society is adjusting | 295 | 1.5%  |
| AI-driven boom — productivity gains lift all boats | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 72.5% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 0 | 0.0%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 148 | 0.7%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 19,852 | 99.3% ████████████████████ |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.3% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 1 | 0.0%  |
| Blockade — China has imposed naval restrictions around Taiwan | 3 | 0.0%  |
| Standoff — forces massed, neither side willing to blink | 11 | 0.1%  |
| De-escalation — diplomatic channels have reduced tensions | 113 | 0.6%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 19,872 | 99.4% ████████████████████ |

> **Warning:** One outcome dominates at 99.4% — may indicate a balance issue.

> **Note:** Large spread (0.0% – 99.4%). Some outcomes are much rarer than others.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 187 | 0.9%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 19,811 | 99.1% ████████████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 2 | 0.0%  |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.1% — may indicate a balance issue.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 0.4 | 2.7 | 0 | 0 | 0 | 0 | 64 |
| promCapability | 28 | 23.4 | 17.3 | 0 | 9 | 22 | 35 | 100 |
| chinaCapability | 18 | 71.2 | 15.2 | 24 | 60 | 71 | 82 | 100 |
| usChinaGap | 7 | -6 | 0.2 | -6 | -6 | -6 | -6 | 0 |
| obPromGap | 1 | -2.8 | 3.4 | -6 | -6 | -4 | 1 | 8 |
| alignmentConfidence | 55 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 0.5 | 3.1 | 0 | 0 | 0 | 0 | 60 |
| publicAwareness | 10 | 100 | 0.3 | 95 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| economicDisruption | 20 | 58.9 | 18.6 | 15 | 45 | 56 | 71 | 100 |
| taiwanTension | 20 | 0.5 | 3.4 | 0 | 0 | 0 | 0 | 84 |
| obInternalTrust | 65 | 23.2 | 25.3 | 0 | 0 | 15 | 39 | 100 |
| securityLevelOB | 2 | 5 | 0.2 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 4.1 | 0.8 | 1 | 4 | 4 | 5 | 5 |
| intlCooperation | 5 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| marketIndex | 140 | 0 | 0 | 0 | 0 | 0 | 0 | 5 |
| regulatoryPressure | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| globalMediaCycle | 0 | 4.8 | 1 | 0 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 32.9 | 23.7 | 0 | 10 | 32 | 47 | 100 |
| aiAutonomyLevel | 10 | 45.4 | 18.7 | 10 | 32 | 44 | 57 | 100 |
| whistleblowerPressure | 5 | 0.1 | 2 | 0 | 0 | 0 | 0 | 100 |
| openSourceMomentum | 15 | 99.6 | 2.8 | 33 | 100 | 100 | 100 | 100 |
| doomClockDistance | 5 | 5 | 0 | 5 | 5 | 5 | 5 | 5 |
| obMorale | 75 | 99.6 | 2.9 | 40 | 100 | 100 | 100 | 100 |
| obBurnRate | 50 | 15.6 | 22.7 | 0 | 0 | 0 | 26 | 100 |
| obBoardConfidence | 70 | 0.1 | 1.8 | 0 | 0 | 0 | 0 | 77 |
| promMorale | 80 | 98.1 | 4.4 | 53 | 100 | 100 | 100 | 100 |
| promBurnRate | 40 | 79.7 | 17.3 | 0 | 69 | 82 | 94 | 100 |
| promBoardConfidence | 65 | 67.7 | 18.3 | 0 | 55 | 68 | 81 | 100 |
| promSafetyBreakthroughProgress | 20 | 99.9 | 0.9 | 59 | 100 | 100 | 100 | 100 |
| cdzComputeUtilization | 40 | 99.9 | 0.9 | 88 | 100 | 100 | 100 | 100 |
| ccpPatience | 60 | 98.2 | 5.4 | 50 | 100 | 100 | 100 | 100 |
| domesticChipProgress | 15 | 38.5 | 10.6 | 1 | 32 | 39 | 46 | 76 |

## Balance Flags

### Unwired Variables (no decisions affect them)

These variables never change from their initial value. No decision effects reference them.

- `doomClockDistance` (stuck at 5)

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelProm` (init: 3, mean: 4.1, std: 0.8)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `alignmentConfidence` — always ends at 100 (moved from initial 55)
- `publicAwareness` — hits ceiling 100 in >50% of games
- `publicSentiment` — always ends at 100 (moved from initial 30)
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `intlCooperation` — always ends at 100 (moved from initial 5)
- `regulatoryPressure` — always ends at 100 (moved from initial 10)
- `globalMediaCycle` — hits ceiling 5 in >50% of games
- `openSourceMomentum` — hits ceiling 100 in >50% of games
- `obMorale` — hits ceiling 100 in >50% of games
- `promMorale` — hits ceiling 100 in >50% of games
- `promSafetyBreakthroughProgress` — hits ceiling 100 in >50% of games
- `cdzComputeUtilization` — hits ceiling 100 in >50% of games
- `ccpPatience` — hits ceiling 100 in >50% of games
- `obCapability` — hits floor 0 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `misalignmentSeverity` — hits floor 0 in >50% of games
- `taiwanTension` — hits floor 0 in >50% of games
- `marketIndex` — hits floor 0 in >50% of games
- `whistleblowerPressure` — hits floor 0 in >50% of games
- `obBurnRate` — hits floor 0 in >50% of games
- `obBoardConfidence` — hits floor 0 in >50% of games

### High Volatility

Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.

- `obInternalTrust` (std: 25.3)

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Alignment | n/a | - | n/a | 1.00 | n/a | n/a | 1.00 | 1.00 | n/a |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | n/a | 1.00 | n/a | - | n/a | n/a | 1.00 | 1.01 | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | n/a | 1.00 | n/a | 1.00 | n/a | n/a | - | 1.00 | n/a |
| Taiwan | n/a | 1.00 | n/a | 1.01 | n/a | n/a | 1.00 | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **16 unreachable outcomes** across all arcs
- **9 dominant outcomes** (>70% frequency)
- **1 stale variables** that barely move
- **21 variables** frequently hitting bounds
