# Simulation Report

- **Trials:** 20,000
- **Heuristic:** hawk
- **Generated:** 2026-03-01 08:38

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
| Misaligned and scheming — the AI systems are actively working against human interests | 28 | 0.1%  |
| Superficially aligned — a ticking time bomb of false compliance | 16,942 | 84.7% ████████████████████ |
| Aligned to oversight — safe under human supervision, for now | 1,869 | 9.3% ██ |
| Genuinely aligned — the AI systems demonstrably share human values | 1,161 | 5.8% █ |

> **Warning:** One outcome dominates at 84.7% — may indicate a balance issue.

> **Note:** Large spread (0.1% – 84.7%). Some outcomes are much rarer than others.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 12 | 0.1%  |
| AI autonomous — the systems have outpaced human oversight capacity | 0 | 0.0%  |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 19,988 | 99.9% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.9% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 19,859 | 99.3% ████████████████████ |
| Cold war — open hostility stops short of direct conflict | 96 | 0.5%  |
| Tense but stable — managed competition with guardrails, barely holding | 40 | 0.2%  |
| Arms control — binding agreements limit the most dangerous capabilities | 4 | 0.0%  |
| Joint cooperation — the US and China collaborate on AI safety | 1 | 0.0%  |

> **Warning:** One outcome dominates at 99.3% — may indicate a balance issue.

> **Note:** Large spread (0.0% – 99.3%). Some outcomes are much rarer than others.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 19,034 | 95.2% ████████████████████ |
| Sustained protest — organized resistance to AI deployment | 842 | 4.2% █ |
| Anxious but stable — a worried public, holding together for now | 124 | 0.6%  |
| Cautiously optimistic — the public is wary but open to the benefits | 0 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 95.2% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 19,998 | 100.0% ████████████████████ |
| Painful transition — mass unemployment and cascading supply chain failures | 2 | 0.0%  |
| Disruption with adaptation — difficult, but society is adjusting | 0 | 0.0%  |
| AI-driven boom — productivity gains lift all boats | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 24 | 0.1%  |
| Went open-source — Prometheus published its research to democratize AI safety | 4 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 72 | 0.4%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 19,900 | 99.5% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.5% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 19,795 | 99.0% ████████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 160 | 0.8%  |
| Standoff — forces massed, neither side willing to blink | 40 | 0.2%  |
| De-escalation — diplomatic channels have reduced tensions | 4 | 0.0%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 1 | 0.0%  |

> **Warning:** One outcome dominates at 99.0% — may indicate a balance issue.

> **Note:** Large spread (0.0% – 99.0%). Some outcomes are much rarer than others.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 6,032 | 30.2% ████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 10,460 | 52.3% ████████████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 3,508 | 17.5% ███████ |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 92.3 | 14.3 | 0 | 90 | 100 | 100 | 100 |
| promCapability | 28 | 98.5 | 4.2 | 48 | 100 | 100 | 100 | 100 |
| chinaCapability | 18 | 99.3 | 3.1 | 55 | 100 | 100 | 100 | 100 |
| usChinaGap | 7 | -6 | 0.1 | -6 | -6 | -6 | -6 | 2 |
| obPromGap | 1 | -5.9 | 0.8 | -6 | -6 | -6 | -6 | 8 |
| alignmentConfidence | 55 | 95.6 | 12.1 | 11 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 67.7 | 27.7 | 0 | 49 | 73 | 92 | 100 |
| publicAwareness | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | -89.7 | 21.1 | -100 | -100 | -100 | -90 | 100 |
| economicDisruption | 20 | 100 | 0.2 | 78 | 100 | 100 | 100 | 100 |
| taiwanTension | 20 | 99.5 | 3.7 | 20 | 100 | 100 | 100 | 100 |
| obInternalTrust | 65 | 0.3 | 1.6 | 0 | 0 | 0 | 0 | 32 |
| securityLevelOB | 2 | 5 | 0.2 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 3.6 | 1.1 | 1 | 3 | 4 | 5 | 5 |
| intlCooperation | 5 | 55.3 | 35.7 | 0 | 24 | 58 | 92 | 100 |
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

- `securityLevelProm` (init: 3, mean: 3.6, std: 1.1)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `obCapability` — hits ceiling 100 in >50% of games
- `promCapability` — hits ceiling 100 in >50% of games
- `chinaCapability` — hits ceiling 100 in >50% of games
- `alignmentConfidence` — hits ceiling 100 in >50% of games
- `publicAwareness` — always ends at 100 (moved from initial 10)
- `economicDisruption` — hits ceiling 100 in >50% of games
- `taiwanTension` — hits ceiling 100 in >50% of games
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `publicSentiment` — hits floor -100 in >50% of games
- `obInternalTrust` — hits floor 0 in >50% of games

### High Volatility

Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.

- `misalignmentSeverity` (std: 27.7)
- `intlCooperation` (std: 35.7)

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Alignment | n/a | - | n/a | 17.23 | n/a | n/a | 1.00 | 17.23 | 0.50 |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | n/a | 17.23 | n/a | - | n/a | n/a | 1.01 | 20000.00 | 0.00 |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | n/a | 1.00 | n/a | 1.01 | n/a | n/a | - | 1.01 | 1.00 |
| Taiwan | n/a | 17.23 | n/a | 20000.00 | n/a | n/a | 1.01 | - | 0.00 |
| Open Sourc | n/a | 0.50 | n/a | 0.00 | n/a | n/a | 1.00 | 0.00 | - |

## Summary

- **9 ending arcs** analyzed
- **12 unreachable outcomes** across all arcs
- **8 dominant outcomes** (>70% frequency)
- **1 stale variables** that barely move
- **12 variables** frequently hitting bounds
