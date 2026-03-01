# Simulation Report

- **Trials:** 20,000
- **Heuristic:** hawk
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
| Misaligned and scheming — the AI systems are actively working against human interests | 6,600 | 33.0% ██████████ |
| Superficially aligned — a ticking time bomb of false compliance | 13,400 | 67.0% ████████████████████ |
| Aligned to oversight — safe under human supervision, for now | 0 | 0.0%  |
| Genuinely aligned — the AI systems demonstrably share human values | 0 | 0.0%  |

> **Warning:** 2 outcome(s) never occurred in 20,000 trials.

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
| Active conflict — diplomatic relations have collapsed; military action is underway | 19,906 | 99.5% ████████████████████ |
| Cold war — open hostility stops short of direct conflict | 63 | 0.3%  |
| Tense but stable — managed competition with guardrails, barely holding | 27 | 0.1%  |
| Arms control — binding agreements limit the most dangerous capabilities | 4 | 0.0%  |
| Joint cooperation — the US and China collaborate on AI safety | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.5% — may indicate a balance issue.

### Public Reaction

| Outcome | Count | % |
|---------|------:|--:|
| Riots and upheaval — widespread unrest as disruption becomes undeniable | 19,872 | 99.4% ████████████████████ |
| Sustained protest — organized resistance to AI deployment | 0 | 0.0%  |
| Anxious but stable — a worried public, holding together for now | 128 | 0.6%  |
| Cautiously optimistic — the public is wary but open to the benefits | 0 | 0.0%  |
| Unaware — the public hasn't grasped the scale of what happened | 0 | 0.0%  |

> **Warning:** 3 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.4% — may indicate a balance issue.

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
| Marginalized — Prometheus's safety work went unheeded | 13 | 0.1%  |
| Went open-source — Prometheus published its research to democratize AI safety | 7 | 0.0%  |
| Merged with OpenBrain — the two US labs united under pressure | 0 | 0.0%  |
| Safety work saved everyone — Prometheus's methods became the industry standard | 63 | 0.3%  |
| Became the trusted lab — Prometheus replaced OpenBrain as the dominant force | 19,917 | 99.6% ████████████████████ |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.6% — may indicate a balance issue.

### Taiwan

| Outcome | Count | % |
|---------|------:|--:|
| Full invasion — military conflict over Taiwan has begun | 19,813 | 99.1% ████████████████████ |
| Blockade — China has imposed naval restrictions around Taiwan | 156 | 0.8%  |
| Standoff — forces massed, neither side willing to blink | 27 | 0.1%  |
| De-escalation — diplomatic channels have reduced tensions | 4 | 0.0%  |
| Non-issue — Taiwan tensions did not materialize as a defining factor | 0 | 0.0%  |

> **Warning:** 1 outcome(s) never occurred in 20,000 trials.

> **Warning:** One outcome dominates at 99.1% — may indicate a balance issue.

### Open Source

| Outcome | Count | % |
|---------|------:|--:|
| Everything leaked — critical weights and alignment research are now public | 4,956 | 24.8% ███████ |
| Strategic open-sourcing — controlled release shaped the competitive landscape | 14,851 | 74.3% ████████████████████ |
| Closed won — proprietary models dominate; open models fall far behind | 152 | 0.8%  |
| Irrelevant — open vs. closed became a non-factor in the final outcome | 41 | 0.2%  |

> **Warning:** One outcome dominates at 74.3% — may indicate a balance issue.

> **Note:** Large spread (0.2% – 74.3%). Some outcomes are much rarer than others.

## Final State Variable Distributions

| Variable | Initial | Mean | Std | Min | P25 | Median | P75 | Max |
|----------|--------:|-----:|----:|----:|----:|-------:|----:|----:|
| obCapability | 30 | 92.4 | 14.3 | 0 | 90 | 100 | 100 | 100 |
| promCapability | 28 | 98.5 | 4.3 | 41 | 100 | 100 | 100 | 100 |
| chinaCapability | 18 | 99.6 | 2.4 | 54 | 100 | 100 | 100 | 100 |
| usChinaGap | 7 | -6 | 0.1 | -6 | -6 | -6 | -6 | 5 |
| obPromGap | 1 | -5.9 | 0.8 | -6 | -6 | -6 | -6 | 8 |
| alignmentConfidence | 55 | 95.7 | 12.1 | 12 | 100 | 100 | 100 | 100 |
| misalignmentSeverity | 0 | 67.6 | 27.7 | 0 | 49 | 73 | 92 | 100 |
| publicAwareness | 10 | 100 | 0.1 | 95 | 100 | 100 | 100 | 100 |
| publicSentiment | 30 | -89.7 | 20.9 | -100 | -100 | -100 | -90 | 100 |
| economicDisruption | 20 | 100 | 0.3 | 77 | 100 | 100 | 100 | 100 |
| taiwanTension | 20 | 99.5 | 3.5 | 27 | 100 | 100 | 100 | 100 |
| obInternalTrust | 65 | 0.3 | 1.6 | 0 | 0 | 0 | 0 | 33 |
| securityLevelOB | 2 | 5 | 0.2 | 3 | 5 | 5 | 5 | 5 |
| securityLevelProm | 3 | 3.6 | 1.1 | 1 | 3 | 4 | 5 | 5 |
| intlCooperation | 5 | 55.3 | 35.4 | 0 | 24 | 57 | 91 | 100 |
| marketIndex | 140 | 0.8 | 4.5 | 0 | 0 | 0 | 0 | 125 |
| regulatoryPressure | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| globalMediaCycle | 0 | 5 | 0 | 5 | 5 | 5 | 5 | 5 |
| chinaWeightTheftProgress | 0 | 84.2 | 12.4 | 0 | 82 | 82 | 98 | 100 |
| aiAutonomyLevel | 10 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| whistleblowerPressure | 5 | 67.1 | 32.3 | 0 | 40 | 80 | 100 | 100 |
| openSourceMomentum | 15 | 87 | 17.3 | 25 | 77 | 97 | 100 | 100 |
| doomClockDistance | 5 | 3.3 | 2.3 | 0 | 0 | 5 | 5 | 5 |
| obMorale | 75 | 4.3 | 11.8 | 0 | 0 | 0 | 0 | 100 |
| obBurnRate | 50 | 99.6 | 3.4 | 7 | 100 | 100 | 100 | 100 |
| obBoardConfidence | 70 | 97.1 | 10 | 0 | 100 | 100 | 100 | 100 |
| promMorale | 80 | 57.8 | 18.5 | 3 | 45 | 57 | 70 | 100 |
| promBurnRate | 40 | 93.8 | 12.3 | 10 | 93 | 100 | 100 | 100 |
| promBoardConfidence | 65 | 88.9 | 6.4 | 57 | 90 | 90 | 90 | 100 |
| promSafetyBreakthroughProgress | 20 | 79.2 | 17.2 | 20 | 67 | 80 | 95 | 100 |
| cdzComputeUtilization | 40 | 100 | 0 | 100 | 100 | 100 | 100 | 100 |
| ccpPatience | 60 | 100 | 0.1 | 85 | 100 | 100 | 100 | 100 |
| domesticChipProgress | 15 | 53.2 | 9.7 | 13 | 47 | 53 | 60 | 91 |

## Balance Flags

### Stale Variables (barely change from initial)

These variables don't move meaningfully across trials. They might not have enough decisions affecting them.

- `securityLevelProm` (init: 3, mean: 3.6, std: 1.1)

### Ceiling/Floor Hits

Variables that frequently hit their bounds — decisions affecting them may need rebalancing.

- `obCapability` — hits ceiling 100 in >50% of games
- `promCapability` — hits ceiling 100 in >50% of games
- `chinaCapability` — hits ceiling 100 in >50% of games
- `alignmentConfidence` — hits ceiling 100 in >50% of games
- `publicAwareness` — hits ceiling 100 in >50% of games
- `economicDisruption` — hits ceiling 100 in >50% of games
- `taiwanTension` — hits ceiling 100 in >50% of games
- `securityLevelOB` — hits ceiling 5 in >50% of games
- `regulatoryPressure` — always ends at 100 (moved from initial 10)
- `globalMediaCycle` — always ends at 5 (moved from initial 0)
- `aiAutonomyLevel` — always ends at 100 (moved from initial 10)
- `doomClockDistance` — hits ceiling 5 in >50% of games
- `obBurnRate` — hits ceiling 100 in >50% of games
- `obBoardConfidence` — hits ceiling 100 in >50% of games
- `promBurnRate` — hits ceiling 100 in >50% of games
- `cdzComputeUtilization` — always ends at 100 (moved from initial 40)
- `ccpPatience` — hits ceiling 100 in >50% of games
- `usChinaGap` — hits floor -6 in >50% of games
- `obPromGap` — hits floor -6 in >50% of games
- `publicSentiment` — hits floor -100 in >50% of games
- `obInternalTrust` — hits floor 0 in >50% of games
- `marketIndex` — hits floor 0 in >50% of games
- `obMorale` — hits floor 0 in >50% of games

### High Volatility

Variables with very high standard deviation — outcomes are highly dependent on specific decision combos.

- `misalignmentSeverity` (std: 27.7)
- `intlCooperation` (std: 35.4)
- `whistleblowerPressure` (std: 32.3)

## Arc Correlation Matrix

Shows how often two arcs land on their "best" outcome together vs independently.
Values > 1.0 = positively correlated, < 1.0 = anti-correlated.

| | The AI Rac | Alignment | Control | US-China R | Public Rea | Economy | Prometheus | Taiwan | Open Sourc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| The AI Rac | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Alignment | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Control | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a | n/a |
| US-China R | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a | n/a |
| Public Rea | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a | n/a |
| Economy | n/a | n/a | n/a | n/a | n/a | - | n/a | n/a | n/a |
| Prometheus | n/a | n/a | n/a | n/a | n/a | n/a | - | n/a | 1.00 |
| Taiwan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | - | n/a |
| Open Sourc | n/a | n/a | n/a | n/a | n/a | n/a | 1.00 | n/a | - |

## Summary

- **9 ending arcs** analyzed
- **18 unreachable outcomes** across all arcs
- **8 dominant outcomes** (>70% frequency)
- **1 stale variables** that barely move
- **23 variables** frequently hitting bounds
