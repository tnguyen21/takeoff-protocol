# External Faction Roles: Audit & Enhancement Plan

Last updated: 2026-03-05

## Overview

The External faction (NSA Advisor, Tech Journalist, VC/Investor, International Diplomat) has rich thematic content but shallow mechanics. All four roles share a core problem: they receive excellent intelligence/briefings but have limited ability to act on it. Their decisions move state variables modestly without creating visible, cascading consequences for other factions.

This document captures the current state, gaps, and proposed enhancements for each role.

---

## 1. US National Security Advisor (ext_nsa)

### Current State
- **Primary apps**: briefing, signal
- **Content**: Classified PDBs, interagency coordination memos, lab comparative assessments, China threat briefings. Content quality is excellent — realistic intelligence assessments that escalate appropriately across rounds.
- **Decisions**: 1 individual decision in Round 1 ("which lab gets priority?"). No individual decisions in Rounds 2-5. One shared faction decision in Round 4.

### Strengths
- Best intelligence content in the game — classified briefings feel authentic
- Asymmetric information advantage (knows things other roles don't)
- Positioned at the intersection of lab competition and national security

### Gaps

**No agency after Round 1.** The NSA receives brilliant classified assessments in Rounds 2-5 but has no decisions to act on them. By the time Agent-4 crisis hits in Round 3, the NSA is briefed on the disaster but has no button to press.

**No direct enforcement mechanics.** NSA has no mechanism to:
- Invoke emergency powers (DPA Section 4501/4511 is discussed in briefings but never a decision)
- Force security upgrades at labs
- Negotiate directly with China
- Brief or withhold from Congressional leadership
- Deploy FBI counterintelligence teams

**No cross-faction negotiation.** NSA receives China back-channel offers (Round 4) but cannot respond, counter-offer, or set conditions.

**No relationship mechanics.** Unlike the journalist who has named sources, NSA interacts purely through institutional channels. No personal relationships with lab CEOs or foreign counterparts.

### Proposed Enhancements

#### New Individual Decisions

**Round 2: Weight Theft Response**
> "You have intelligence on China's weight theft operation timeline. How do you respond?"
>
> A) Alert OpenBrain immediately
>    - securityLevelOB +1, chinaWeightTheftProgress -10, obMorale -2 (fear)
>
> B) Monitor without revealing source (collect more intel)
>    - chinaWeightTheftProgress +20, taiwanTension +2
>
> C) Coordinate FBI counter-operation (slow China without revealing capability)
>    - chinaWeightTheftProgress -15, securityLevelOB +1, regulatoryPressure +2

**Round 3: Emergency Powers Recommendation**
> "Agent-4 alignment concerns are confirmed. The President needs your recommendation on emergency powers."
>
> A) Recommend DPA nationalization (Section 4511)
>    - obCapability -10, regulatoryPressure +8, marketIndex -15, doomClockDistance -3
>
> B) Recommend binding oversight committee (Section 4501)
>    - obCapability -3, regulatoryPressure +5, marketIndex -5, alignmentConfidence +2
>
> C) Recommend containment + monitoring (no emergency invocation)
>    - whistleblowerPressure +10, doomClockDistance -5

**Round 5: Strategic Posture**
> "Both labs are at board meetings today. Which path do you advocate?"
>
> A) Nationalization — long-term safety, short-term chaos
> B) Preferred partner (Prometheus) — regulatory complexity
> C) Multilateral framework (with China) — diplomatically ambitious
> D) Laissez-faire with monitoring — market-friendly, safety-risky

#### New Content
- Signal messages from lab CEOs seeking guidance during crisis
- China Foreign Ministry back-channel messages via intermediary
- Congressional leadership demanding briefings (creates tension: classify or share?)
- FBI CI Director with real-time operational updates on weight theft

#### State Variable Connections
NSA decisions should directly affect:
- `securityLevelOB` / `securityLevelProm` (security directives)
- `regulatoryPressure` (government oversight posture)
- `taiwanTension` (diplomatic/military signaling)
- `chinaWeightTheftProgress` (counter-intelligence operations)
- `doomClockDistance` (emergency power invocation)

---

## 2. Tech Journalist (ext_journalist)

### Current State
- **Primary apps**: signal, substack, twitter
- **Content**: Named source network (Atlas at OB, Meridian at Prometheus, Ledger at NSC), active investigations pipeline, story drafts, editor pressure, source protection dilemmas. Narratively the richest external role.
- **Decisions**: Story angle choices each round (publish now vs. wait, which frame to lead with). 3-4 options per round across all 5 rounds.

### Strengths
- Unique information access — only role with sources inside multiple factions
- Genuine ethical dilemmas (timing, source protection, public interest)
- Strong emotional texture (family strain, rival reporters, editor deadlines)
- Strategic timing power (can delay or accelerate crises)

### Gaps

**Publication system is generic.** The real-time publication mechanic (via Socket.IO) applies fixed state deltas regardless of story content:
- `article`: publicAwareness +15, publicSentiment +10
- `leak`: publicAwareness +25, publicSentiment -10
- `research`: publicAwareness +15, publicSentiment +5

No differentiation based on story angle. A safety expose and a puff piece about compute infrastructure hit the same variables the same way.

**No faction-specific publication impact.** Publishing about OB safety failures should:
- Tank OB-specific variables (obBoardConfidence, obInternalTrust, obMorale)
- Boost Prometheus positioning (promBoardConfidence)
- Spike regulatoryPressure
- Crash marketIndex

Currently, all publications affect only generic public variables.

**No source cultivation or burnout mechanics.** Sources are narrative texture in memos but have no game mechanics:
- No system to cultivate sources over time
- No risk of burning sources by publishing
- No information trading ("I sit on this story if you give me X")
- No consequence when a source is identified

**No feedback loop.** Publication is one-way: journalist publishes, state updates, no faction response. Missing:
- Lab CEOs issuing responses
- Government launching investigations
- Market panic triggering board emergency sessions
- Sources going silent or escalating after publication

### Proposed Enhancements

#### Story Angle System
Different angles should produce asymmetric impacts:

| Angle | Primary Impact | Secondary Impact |
|-------|---------------|-----------------|
| Safety crisis | alignmentConfidence -5, regulatoryPressure +5 | obBoardConfidence -3 |
| Corporate malfeasance | obInternalTrust -5, obBoardConfidence -3 | whistleblowerPressure -5 (others feel safe) |
| Capability hype | marketIndex +8, publicSentiment +5 | taiwanTension +3 (China alarmed) |
| Geopolitics/China | publicAwareness +5, taiwanTension +4 | intlCooperation -3 |
| Government incompetence | regulatoryPressure -3, publicSentiment -5 | intlCooperation -2 |

#### Source Mechanics
- Publishing with a named source: higher credibility, bigger state impact, but source faces retaliation (future messages dry up)
- Publishing anonymously: lower impact, source protected, but editor pushes for named sources
- Source trust accumulates — protecting a source in Round 2 unlocks exclusive intel in Round 4

#### Real-Time Publishing
- Journalist can publish during deliberation phases, not just during decision windows
- Publishing mid-round creates immediate pressure on faction decisions that haven't locked yet
- Creates strategic timing: "If I publish before the board call, they'll be forced to respond"

#### State Variable Connections
Publication should directly affect:
- `marketIndex` (market-moving stories)
- `obBoardConfidence` / `promBoardConfidence` (stories about specific labs)
- `regulatoryPressure` (exposing safety gaps triggers government response)
- `whistleblowerPressure` (publishing protects or endangers future sources)
- `publicAwareness` / `publicSentiment` (already connected, but should vary by angle)

---

## 3. Major VC / Investor (ext_vc)

### Current State
- **Primary apps**: bloomberg, email, signal
- **Content**: Portfolio analysis (board seats at both labs, $920M+ exposure), Bloomberg financial data across 5 rounds, investment committee memos, tail risk analyses. Content correctly portrays someone with real structural power.
- **Decisions**: Portfolio allocation choices each round (deploy capital, hedge, back specific lab, public statement).

### Strengths
- Unique structural position — board seats at BOTH labs
- Genuine moral conflict (maximize returns vs. prevent catastrophe)
- Financial data app (Bloomberg) gives analytical depth
- Round 3-4 decisions have the most market impact of any role

### Gaps

**Board seats are narrative, not mechanical.** The VC has board seats at both labs but:
- No decision that directly blocks lab actions ("I vote against Agent-4 deployment")
- No voting mechanic where the VC's vote actually determines outcomes
- No ability to threaten resignation or hostile proxy fight
- No enforcement — "use your board seat to push for disclosure" has no guarantee of effect

**Capital decisions don't directly pressure labs.** "Deploy $1B more" adds 2 obCapability and reduces burn by 4. But there's no decision to WITHDRAW commitment, which should:
- Spike obBurnRate by 10+
- Force lab to seek alternative capital
- Signal other investors to follow suit
- Create board crisis

**No kingmaker mechanics.** The VC is positioned to broker mergers, force cooperation, or abandon a lab entirely. None of these are available as decisions:
- No "I broker OB-Prometheus merger" option
- No "I fund both labs equally ONLY IF they accept shared governance" option
- No "I coordinate with other VCs for collective pressure" option

**No market manipulation mechanics.** Public statements move `marketIndex` but the VC can't:
- Quietly dump secondary shares (triggering forced selling)
- File SEC disclosure about material safety concerns
- Fund independent safety audits and publish results
- Coordinate institutional investor pressure

### Proposed Enhancements

#### Board Authority Decisions

**Round 3: Board Crisis**
> "OpenBrain's board is meeting to discuss Agent-4. You have a seat. What do you do?"
>
> A) Vote to halt Agent-4 deployment
>    - obCapability -5, alignmentConfidence +3, obBoardConfidence -5, marketIndex -8
>
> B) Abstain but demand independent safety audit before next deployment
>    - regulatoryPressure +3, alignmentConfidence +2, obBoardConfidence +0
>
> C) Vote to proceed (protect your investment)
>    - obCapability +2, marketIndex +3, doomClockDistance -2

#### Capital Leverage Decisions

**Round 4: Funding Pressure**
> "You control $920M in illiquid lab positions. How do you use that leverage?"
>
> A) Withdraw Series F commitment from OB unless they accept safety governance
>    - obBurnRate +12, obBoardConfidence -8, regulatoryPressure +3
>
> B) Publicly recommend all VCs divest until oversight is established
>    - marketIndex -12, obBurnRate +8, promBurnRate +5, economicDisruption +5
>
> C) Quietly increase Prometheus position, signal confidence in safety-first approach
>    - promBoardConfidence +5, promBurnRate -3, marketIndex +3

#### Kingmaker Decisions

**Round 5: Consolidation**
> "Both labs are in crisis. You have the relationships and capital to shape the outcome."
>
> A) Broker OB-Prometheus merger (combined safety + capability)
>    - alignmentConfidence +4, obCapability +3, promCapability +3, marketIndex +10
>
> B) Fund independent safety research foundation ($500M commitment)
>    - alignmentConfidence +5, publicSentiment +5, obBurnRate +0, doomClockDistance +3
>
> C) Back the winning horse — all-in on whichever lab has the lead
>    - marketIndex +8, doomClockDistance -3

#### State Variable Connections
VC decisions should directly affect:
- `obBurnRate` / `promBurnRate` (funding/defunding)
- `obBoardConfidence` / `promBoardConfidence` (board votes, governance demands)
- `marketIndex` (public statements, portfolio moves)
- `economicDisruption` (market-moving decisions)
- `doomClockDistance` (indirect through governance pressure)

---

## 4. International Diplomat (ext_diplomat)

### Current State
- **Primary apps**: email, news, signal
- **Content**: EU position papers, allied nations assessment, draft treaty frameworks, diplomatic cables, back-channel China offers. Positioned as the multilateral bridge-builder.
- **Decisions**: Governance framework choices each round (G7 coordination, US-China bilateral, compute pause treaty, grand bargain).

### Strengths
- Unique leverage over `intlCooperation` and `taiwanTension` — no other role can move these as effectively
- Round 4 grand bargain is genuinely consequential (capability slowdown for both US and China)
- Realistic portrayal of multilateral diplomacy challenges
- Good progression: tone-setting (R1) to crisis response (R3) to negotiation (R4) to endgame (R5)

### Gaps

**No actual negotiation mechanics.** The diplomat receives offers but can't counter-offer. Choices are pre-built menus, not negotiations:
- No "Accept China's terms but demand stricter verification" option
- No "Propose 180-day pause instead of 90-day" option
- No risk of negotiation failure (China walks, G7 fractures)

**No coalition-building mechanics.** The diplomat is literally a coalition-builder but:
- No mechanism to lock in G7/EU support
- No risk of coalition fracture (France sides with China, Germany demands different terms)
- No sequencing requirements (can't close China deal without G7 unity first)

**Limited leverage mechanisms.** The diplomat's power comes from soft levers that aren't mechanically represented:
- EU market access ($400B leverage) — not a decision option
- Global South legitimacy — not represented at all
- Sanctions threats — mentioned but not actionable

**Low personal stakes.** Other roles face career/conscience dilemmas. The diplomat's personal content is mostly flavor (family, therapist, mentor). Missing:
- Home government demanding loyalty vs. global interest
- Career at risk if they negotiate against their government's position
- Direct conflict with NSA over who controls the China relationship

### Proposed Enhancements

#### Negotiation Mechanics

**Round 3: China Back-Channel**
> "China has made preliminary contact through an intermediary. How do you engage?"
>
> A) Formal response: propose multilateral framework including China
>    - intlCooperation +3, ccpPatience +3, taiwanTension -2
>
> B) Informal back-channel: explore bilateral terms directly
>    - intlCooperation +2, taiwanTension -4, regulatoryPressure -1 (US may feel bypassed)
>
> C) Share China's offer with NSA — let government decide
>    - intlCooperation +1, regulatoryPressure +2 (NSA uses it as leverage)

**Round 4: Grand Bargain Terms**
> "China offers: 90-day pause, IAEA verification, chip access. You can negotiate."
>
> A) Accept as-is
>    - intlCooperation +5, taiwanTension -7, usChinaGap unchanged
>
> B) Counter: 180-day pause, stricter verification, no chip access
>    - intlCooperation +3, taiwanTension -4, ccpPatience -5 (they may walk)
>
> C) Accept pause, reject chip access
>    - intlCooperation +4, taiwanTension -5, ccpPatience -2

#### Coalition Building
- Round 2 decision: invest diplomatic capital in G7 unity vs. bilateral US-China
- Coalition has durability score — if diplomat doesn't maintain it, allies defect
- France may side with China if EU sovereignty concerns aren't addressed
- Global South bloc can fracture legitimacy if excluded from framework

#### Leverage Mechanisms
- Decision to threaten EU AI sanctions (market access for 450M consumers)
- Decision to invoke Global South support (legitimacy argument)
- Decision to coordinate with NSA vs. operate independently
- Decision to leak negotiation progress to friendly journalist (shifts public opinion)

#### State Variable Connections
Diplomat decisions should directly affect:
- `intlCooperation` (primary lever, already connected)
- `taiwanTension` (bilateral/multilateral engagement)
- `ccpPatience` (negotiation approach)
- `regulatoryPressure` (international standards create domestic pressure)
- `doomClockDistance` (successful governance framework reduces risk)

---

## Cross-Role Interaction Map

These interactions between external roles should exist but currently don't:

| Interaction | Mechanic |
|-------------|----------|
| NSA directs labs to upgrade security | Decision that directly moves securityLevelOB/Prom |
| Journalist publishes, markets crash | Publication angle determines which faction variables get hit |
| VC pulls funding, lab scrambles | Capital withdrawal directly increases burn rate |
| Diplomat negotiates with China | Counter-offer mechanics with failure risk |
| Journalist tips off NSA about source | Information trading between external roles |
| VC briefs NSC on portfolio risk | Investor perspective feeds policy decisions |
| Diplomat leaks to journalist | Diplomatic media strategy shifts public framing |
| NSA responds to journalist leak | Decision: prosecute source vs. let it run |
| VC threatens board resignation | Forces lab CEO to respond in their next decision |
| Diplomat builds coalition, VC funds it | Multi-role coordination amplifies impact |

---

## Implementation Priority

### Tier 1: High Impact, Moderate Effort
1. **Add 1-2 individual decisions per round for each external role** — biggest gap. NSA/Journalist/VC/Diplomat all need per-round agency.
2. **Make publication impacts faction-specific** — journalist story angle should hit specific faction variables, not generic publicAwareness.
3. **Add cross-faction consequence chains** — VC pulls funding -> OB burn rate spikes -> OB CEO forced to respond next round.

### Tier 2: High Impact, High Effort
4. **Negotiation mechanics for diplomat** — counter-offers, coalition fracture risk, treaty evolution across rounds.
5. **Board voting mechanics for VC** — actual votes on lab decisions with binding outcomes.
6. **Source cultivation for journalist** — publishing burns sources, protecting them builds trust for later exclusives.

### Tier 3: Enrichment
7. **NSA intelligence that's sometimes wrong** — decisions based on stale/incorrect intel create dramatic reversals.
8. **Coalition durability for diplomat** — G7 unity as a resource that must be maintained, not assumed.
9. **Market manipulation mechanics for VC** — secondary sales, SEC filings, coordinated investor pressure.
10. **Real-time publishing for journalist** — publish during deliberation phases to disrupt live faction decisions.
