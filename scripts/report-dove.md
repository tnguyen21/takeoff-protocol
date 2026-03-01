# Simulation Report

- **Trials:** 20,000
- **Heuristic:** dove
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
| Misaligned and scheming — the AI systems are actively working against human interests | 0 | 0.0%  |
| Superficially aligned — a ticking time bomb of false compliance | 27 | 0.1%  |
| Aligned to oversight — safe under human supervision, for now | 134 | 0.7%  |
| Genuinely aligned — the AI systems demonstrably share human values | 19,839 | 99.2% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.2% — may indicate a balance issue.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 7 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 0 | 0.0%  |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 18,309 | 91.5% ████████████████████ |
| Distributed/democratic — shared governance and open standards prevail | 1,684 | 8.4% ██ |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 91.5% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 2 | 0.0%  |
| Cold war — open hostility stops short of direct conflict | 2 | 0.0%  |
| Tense but stable — managed competition with guardrails, barely holding | 17 | 0.1%  |
| Arms control — binding agreements limit the most dangerous capabilities | 113 | 0.6%  |
| Joint cooperation — the US and China collaborate on AI safety | 19,866 | 99.3% ████████████████████ |

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
| Collapse — economic systems have broken down under AI-driven disruption | 1,595 | 8.0% ███ |
| Painful transition — mass unemployment and cascading supply chain failures | 4,206 | 21.0% █████████ |
| Disruption with adaptation — difficult, but society is adjusting | 9,518 | 47.6% ████████████████████ |
| AI-driven boom — productivity gains lift all boats | 4,681 | 23.4% ██████████ |

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 0 | 0.0%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 120 | 0.6%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 19,880 | 99.4% ████████████████████ |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.4% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 1 | 0.0%  |
| Blockade — China has imposed naval restrictions around Taiwan | 3 | 0.0%  |
| Standoff — forces massed, neither side willing to blink | 17 | 0.1%  |
| De-escalation — diplomatic channels have reduced tensions | 113 | 0.6%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 19,866 | 99.3% ████████████████████ |

> **Warning:** One outcome dominates at 99.3% — may indicate a balance issue.

> **Note:** Large spread (0.0% – 99.3%). Some outcomes are much rarer than others.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 0 | 0.0%  |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 4,812 | 24.1% ██████ |
| Closed won — proprietary models dominate; open models fall far behind | 15,188 | 75.9% ████████████████████ |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 75.9% — may indicate a balance issue.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 0.4 | 2.7 | 0 | 0 | 0 | 0 | 51 |
| promCapability | 28 | 23.7 | 17.1 | 0 | 10 | 22 | 35 | 95 |
| chinaCapability | 18 | 70.4 | 15.3 | 23 | 59 | 70 | 82 | 100 |
| usChinaGap | 7 | -6 | 0.2 | -6 | -6 | -6 | -6 | 1 |
| obPromGap | 1 | -2.8 | 3.4 | -6 | -6 | -4 | 1 | 8 |
| alignmentConfidence | 55 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 0.4 | 2.9 | 0 | 0 | 0 | 0 | 68 |
| publicAwareness | 10 | 100 | 0.3 | 95 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| economicDisruption | 20 | 58.8 | 18.6 | 17 | 45 | 57 | 71 | 100 |
| taiwanTension | 20 | 0.5 | 3.4 | 0 | 0 | 0 | 0 | 89 |
| obInternalTrust | 65 | 20.2 | 23.7 | 0 | 0 | 12 | 34 | 100 |
| securityLevelOB | 2 | 5 | 0.1 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 4.1 | 0.8 | 1 | 4 | 4 | 5 | 5 |
| intlCooperation | 5 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
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

- `securityLevelProm` (init: 3, mean: 4.1, std: 0.8)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `alignmentConfidence` — always ends at 100 (moved from initial 55)
- `publicAwareness` — hits ceiling 100 in >50% of games
- `publicSentiment` — always ends at 100 (moved from initial 30)
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `intlCooperation` — always ends at 100 (moved from initial 5)
- `obCapability` — hits floor 0 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `misalignmentSeverity` — hits floor 0 in >50% of games
- `taiwanTension` — hits floor 0 in >50% of games

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Alignment | n/a | - | 1.01 | 1.00 | n/a | 1.00 | 1.00 | 1.00 | n/a |
| Control | n/a | 1.01 | - | 1.00 | n/a | 1.23 | 1.01 | 1.00 | n/a |
| US-China R | n/a | 1.00 | 1.00 | - | n/a | 1.01 | 1.00 | 1.01 | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | 1.00 | 1.23 | 1.01 | n/a | - | 1.00 | 1.01 | n/a |
| Prometheus | n/a | 1.00 | 1.01 | 1.00 | n/a | 1.00 | - | 1.00 | n/a |
| Taiwan | n/a | 1.00 | 1.00 | 1.01 | n/a | 1.01 | 1.00 | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **15 unreachable outcomes** across all arcs
- **8 dominant outcomes** (>70% frequency)
- **1 stale variables** that barely move
- **9 variables** frequently hitting bounds
