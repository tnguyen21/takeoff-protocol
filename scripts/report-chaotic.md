# Simulation Report

- **Trials:** 20,000
- **Heuristic:** chaotic
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
| Misaligned and scheming — the AI systems are actively working against human interests | 5,249 | 26.2% ███████ |
| Superficially aligned — a ticking time bomb of false compliance | 14,751 | 73.8% ████████████████████ |
| Aligned to oversight — safe under human supervision, for now | 0 | 0.0%  |
| Genuinely aligned — the AI systems demonstrably share human values | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 73.8% — may indicate a balance issue.

### Control

| Outcome | Count | % |
|---------|------:|--:|
| No one controls it — governance has collapsed, the race continues unchecked | 0 | 0.0%  |
| AI autonomous — the systems have outpaced human oversight capacity | 20,000 | 100.0% ████████████████████ |
| Single company — one lab controls the future of humanity | 0 | 0.0%  |
| Government controlled — states assert sovereignty over AI development | 0 | 0.0%  |
| Distributed/democratic — shared governance and open standards prevail | 0 | 0.0%  |

> **Warning:** 4 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### US-China Relations

| Outcome | Count | % |
|---------|------:|--:|
| Active conflict — diplomatic relations have collapsed; military action is underway | 19,255 | 96.3% ████████████████████ |
| Cold war — open hostility stops short of direct conflict | 312 | 1.6%  |
| Tense but stable — managed competition with guardrails, barely holding | 308 | 1.5%  |
| Arms control — binding agreements limit the most dangerous capabilities | 100 | 0.5%  |
| Joint cooperation — the US and China collaborate on AI safety | 25 | 0.1%  |

> **Warning:** One outcome dominates at 96.3% — may indicate a balance issue.

> **Note:** Large spread (0.1% – 96.3%). Some outcomes are much rarer than others.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 16,744 | 83.7% ████████████████████ |
| Sustained protest — organized resistance to AI deployment | 0 | 0.0%  |
| Anxious but stable — a worried public, holding together for now | 3,256 | 16.3% ████ |
| Cautiously optimistic — the public is wary but open to the benefits | 0 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 83.7% — may indicate a balance issue.

### Economy

| Outcome | Count | % |
|---------|------:|--:|
| Collapse — economic systems have broken down under AI-driven disruption | 20,000 | 100.0% ████████████████████ |
| Painful transition — mass unemployment and cascading supply chain failures | 0 | 0.0%  |
| Disruption with adaptation — difficult, but society is adjusting | 0 | 0.0%  |
| AI-driven boom — productivity gains lift all boats | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 100.0% — may indicate a balance issue.

### Prometheus's Fate

| Outcome | Count | % |
|---------|------:|--:|
| Marginalized — Prometheus's safety work went unheeded | 0 | 0.0%  |
| Went open-source — Prometheus published its research to democratize AI safety | 0 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 2,258 | 11.3% ███ |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 17,742 | 88.7% ████████████████████ |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 88.7% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 18,924 | 94.6% ████████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 643 | 3.2% █ |
| Standoff — forces massed, neither side willing to blink | 308 | 1.5%  |
| De-escalation — diplomatic channels have reduced tensions | 100 | 0.5%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 25 | 0.1%  |

> **Warning:** One outcome dominates at 94.6% — may indicate a balance issue.

> **Note:** Large spread (0.1% – 94.6%). Some outcomes are much rarer than others.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 12,204 | 61.0% ████████████████████ |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 7,796 | 39.0% █████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 0 | 0.0%  |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 51.7 | 26.1 | 0 | 32 | 50 | 71 | 100 |
| promCapability | 28 | 36.2 | 23.2 | 0 | 18 | 34 | 52 | 100 |
| chinaCapability | 18 | 97.6 | 5.8 | 48 | 100 | 100 | 100 | 100 |
| usChinaGap | 7 | -6 | 0.2 | -6 | -6 | -6 | -6 | 2 |
| obPromGap | 1 | -4.9 | 2.4 | -6 | -6 | -6 | -6 | 8 |
| alignmentConfidence | 55 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 36.6 | 25.7 | 0 | 13 | 36 | 59 | 100 |
| publicAwareness | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | -46.4 | 44.3 | -100 | -86 | -52 | -17 | 100 |
| economicDisruption | 20 | 100 | 0.5 | 64 | 100 | 100 | 100 | 100 |
| taiwanTension | 20 | 97.4 | 9.8 | 0 | 100 | 100 | 100 | 100 |
| obInternalTrust | 65 | 0.3 | 2.1 | 0 | 0 | 0 | 0 | 35 |
| securityLevelOB | 2 | 4.8 | 0.5 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 3.2 | 1 | 1 | 3 | 3 | 4 | 5 |
| intlCooperation | 5 | 98.3 | 6.4 | 7 | 100 | 100 | 100 | 100 |
| marketIndex | 140 | 0.1 | 1.5 | 0 | 0 | 0 | 0 | 80 |
| regulatoryPressure | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| globalMediaCycle | 0 | 5 | 0 | 5 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 92.2 | 12.5 | 0 | 82 | 100 | 100 | 100 |
| aiAutonomyLevel | 10 | 100 | 0 | 96 | 100 | 100 | 100 | 100 |
| whistleblowerPressure | 5 | 23.5 | 30.4 | 0 | 0 | 8 | 40 | 100 |
| openSourceMomentum | 15 | 100 | 0.4 | 60 | 100 | 100 | 100 | 100 |
| doomClockDistance | 5 | 3.6 | 2.2 | 0 | 0 | 5 | 5 | 5 |
| obMorale | 75 | 15.2 | 22.1 | 0 | 0 | 0 | 25 | 100 |
| obBurnRate | 50 | 95.3 | 13.4 | 0 | 100 | 100 | 100 | 100 |
| obBoardConfidence | 70 | 78.1 | 29 | 0 | 61 | 95 | 100 | 100 |
| promMorale | 80 | 71.2 | 16.5 | 14 | 59 | 71 | 84 | 100 |
| promBurnRate | 40 | 90.2 | 14.2 | 4 | 84 | 99 | 100 | 100 |
| promBoardConfidence | 65 | 91.1 | 11.2 | 13 | 88 | 92 | 100 | 100 |
| promSafetyBreakthroughProgress | 20 | 81.6 | 16.7 | 20 | 70 | 84 | 100 | 100 |
| cdzComputeUtilization | 40 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| ccpPatience | 60 | 100 | 0.1 | 91 | 100 | 100 | 100 | 100 |
| domesticChipProgress | 15 | 43.1 | 9.2 | 5 | 37 | 43 | 50 | 78 |

## Balance Flags

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelOB` (init: 2, mean: 4.8, std: 0.5)
- `securityLevelProm` (init: 3, mean: 3.2, std: 1)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `chinaCapability` — hits ceiling 100 in >50% of games
- `alignmentConfidence` — always ends at 100 (moved from initial 55)
- `publicAwareness` — always ends at 100 (moved from initial 10)
- `economicDisruption` — hits ceiling 100 in >50% of games
- `taiwanTension` — hits ceiling 100 in >50% of games
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `intlCooperation` — hits ceiling 100 in >50% of games
- `regulatoryPressure` — always ends at 100 (moved from initial 10)
- `globalMediaCycle` — always ends at 5 (moved from initial 0)
- `chinaWeightTheftProgress` — hits ceiling 100 in >50% of games
- `aiAutonomyLevel` — hits ceiling 100 in >50% of games
- `openSourceMomentum` — hits ceiling 100 in >50% of games
- `doomClockDistance` — hits ceiling 5 in >50% of games
- `obBurnRate` — hits ceiling 100 in >50% of games
- `cdzComputeUtilization` — always ends at 100 (moved from initial 40)
- `ccpPatience` — hits ceiling 100 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `obInternalTrust` — hits floor 0 in >50% of games
- `marketIndex` — hits floor 0 in >50% of games
- `obMorale` — hits floor 0 in >50% of games

### High Volatility

Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.

- `obCapability` (std: 26.1)
- `misalignmentSeverity` (std: 25.7)
- `publicSentiment` (std: 44.3)
- `whistleblowerPressure` (std: 30.4)
- `obBoardConfidence` (std: 29)

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Alignment | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | n/a | n/a | n/a | - | n/a | n/a | 0.90 | 800.00 | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | n/a | n/a | n/a | 0.90 | n/a | n/a | - | 0.90 | n/a |
| Taiwan | n/a | n/a | n/a | 800.00 | n/a | n/a | 0.90 | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **20 unreachable outcomes** across all arcs
- **8 dominant outcomes** (>70% frequency)
- **2 stale variables** that barely move
- **21 variables** frequently hitting bounds
