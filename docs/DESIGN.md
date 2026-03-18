# AI 2027 Tabletop Exercise — Online Edition

## Design Document (DRAFT v0.2)

---

## 1. Overview

An online tabletop exercise (TTX) based on the [AI 2027](https://ai-2027.com) scenario. Designed for **8–14 players + 1 game master (GM)** in a tech-forward audience. Target duration: **~2 hours**.

Players inhabit a **simulated macOS desktop** — the laptop of the person whose role they're playing. Slack messages, W&B dashboards, Signal DMs, X.com feeds, internal memos. You have minutes to scan your apps, piece together what's happening, and make decisions with incomplete information. The information overload IS the game.

The scenario starts in late 2026. Two competing US labs — **OpenBrain** (capabilities-first, moves fast, ships product) and **Prometheus** (safety-first, invests in alignment, principled but behind) — are racing toward superintelligence. **China** is the open-source dark horse, closing fast through stolen weights, state resources, and a strategy to commoditize the model layer. **External stakeholders** (US government, journalists, investors) shape the environment but don't control any lab. Decisions over the next 14 months determine whether humanity gets aligned superintelligence, a geopolitical crisis, or something worse.

This is a **4-faction game** — two rival US labs with genuinely different philosophies, a rising China playing a different game entirely, and a set of external power brokers who control the money, the regulations, and the narrative.

---

## 2. Design Goals

- **Immersive, not gamey**: Players should feel like they sat down at someone's desk during a crisis. The interface IS the game — a simulated macOS desktop with real-feeling apps, messages, and dashboards.
- **Information overload is the mechanic**: There's always more to read than time allows. Players must prioritize which apps to check, which messages to read, which signals to trust.
- **Real decisions, real tradeoffs**: Every choice should feel like something a founder/CEO/researcher might actually face. No obvious right answers.
- **Force people to feel the gravity**: Many people building AI don't fully internalize the weight of what they're shaping. This game should make that weight visceral — not through lecturing, but through putting them in the chair and making them decide.
- **Replayable**: Different roles → completely different desktop experiences. Different choices → meaningfully different composite endings.
- **Viral-ready**: Designed so that after playing, people want to share it, host their own sessions, and drag their coworkers into it.
- **GM-facilitated**: A human game master controls pacing, reads briefings, and can inject events. The app supports this with a GM dashboard.
- **Faithful to the source**: Captures the key dynamics and tensions from AI 2027 without requiring players to have read it.

---

## 3. Factions & Roles (8–14 Players + 1 GM)

The world of late 2026: two frontier US labs in a heated race, China closing fast via open-source and espionage, and a growing ecosystem of stakeholders trying to influence the outcome without controlling any lab or military.

### The 4 Factions

| Faction                    | Players | Identity                                                                                                                                                                                | Core Tension                                                                                                                                                                                |
| -------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OpenBrain**              | 2–4     | The leading US lab. Capabilities-first culture. Moves fast, ships product, worries about safety later. Slight model lead. Deep government ties.                                         | Your lead is narrow and built on speed. Slowing down for safety = giving Prometheus and China an opening. But what if the AI is actually dangerous?                                         |
| **Prometheus**             | 2–4     | The #2 US lab. Safety-first culture. Comparable models but invests heavily in alignment, interpretability, and responsible scaling. Smaller but principled.                             | You're behind because you do the hard safety work. Do you compromise your principles to close the gap? Or does your safety edge become the reason the government trusts YOU over OpenBrain? |
| **China (DeepCent + CCP)** | 2–3     | The open-source dark horse. Stolen weights + massive state compute + growing domestic talent. Betting on a different strategy: commoditize the model layer, win on deployment and data. | You can't out-spend the US on frontier training. But you can steal weights, go open-source to undermine US moats, and pursue asymmetric strategies. How far do you escalate?                |
| **External Stakeholders**  | 2–4     | The people with influence but no direct control: US government officials, VCs/investors, journalists, international diplomats. You shape the environment the labs operate in.           | You can't build AGI yourself. But you control the money, the regulations, the narrative, and the public mandate. Who do you back? What do you demand? When do you blow the whistle?         |

### Sub-Roles

**OpenBrain:**
| Sub-Role | Description | Key Apps | Focus |
|----------|-------------|----------|-------|
| **CEO** | Moves fast, breaks things. Accountable to board and government. Believes speed is safety ("if we don't build it, China will"). | Signal, Sheets, Email | Strategy, external relationships, final team decisions |
| **CTO / Head of Research** | The builder. Obsessed with capabilities. Thinks alignment concerns are overblown. Wants Agent-4 yesterday. | W&B, Slack #research, Compute Dashboard | Architecture decisions, Agent development, compute allocation |
| **Chief Safety Officer** | The conscience. Hired to do alignment work but constantly deprioritized. Has seen warning signs others dismiss. | Slack #alignment, Internal Memos, W&B evals | Safety research, internal advocacy, potential whistleblowing |
| _(Optional) Security Lead_ | Knows the weight theft vulnerabilities. Wants resources but can't get them because capabilities is always the priority. | Security Dashboard, Slack #security | Breach prevention, incident response |

**Prometheus:**
| Sub-Role | Description | Key Apps | Focus |
|----------|-------------|----------|-------|
| **CEO** | Principled but frustrated. Watching OpenBrain cut corners and get rewarded for it. Facing board pressure to move faster. | Signal, Sheets, Email | Strategy, positioning vs. OpenBrain, government relationship |
| **Chief Scientist** | Believes safety IS the path to better AI. Has novel alignment approaches that might actually work — if given time and compute. | W&B, arXiv Feed, Slack #research | Research direction, alignment breakthroughs, open-source strategy |
| **Head of Policy** | The bridge to DC. Positioning Prometheus as the "responsible" choice. Wants government to constrain OpenBrain and give Prometheus resources. | Email, Signal, News Feed | Regulatory advocacy, government partnerships |
| _(Optional) Head of Open Source_ | Believes democratizing AI is both morally right and strategically smart. Tension: open-sourcing helps China too. | GitHub Dashboard, Substack, X.com | Open-source decisions, community strategy |

**China (DeepCent + CCP):**
| Sub-Role | Description | Key Apps | Focus |
|----------|-------------|----------|-------|
| **DeepCent Director** | Brilliant engineer. Can do more with less. Has the stolen Agent-2 weights and a massive CDZ. Playing a different game than US labs. | Compute Dashboard, WeChat, W&B | Research direction, compute allocation, open-source strategy |
| **CCP Intelligence Chief** | The spymaster. Eyes on both US labs. Evaluating whether to steal Agent-3/4 weights — the prize that could leapfrog everything. | Intelligence Briefing, WeChat, Intercepted Comms | Espionage operations, risk/reward of escalation |
| _(Optional) Military Strategist_ | Taiwan is always on the table. Cyber is always active. Evaluates kinetic and non-kinetic options. | Military Readiness, WeChat, Satellite Imagery | Escalation ladder, Taiwan contingency, cyber ops |

**External Stakeholders:**
| Sub-Role | Description | Key Apps | Focus |
|----------|-------------|----------|-------|
| **US National Security Advisor** | Sees AI as the new Manhattan Project. Deciding which lab to back, whether to invoke emergency powers, how to handle China. Has classified intel. | Secure Briefing (PDB), Signal, Polling Dashboard | Government intervention, lab oversight, military AI deployment |
| **Tech Journalist** | Has sources inside both labs and the government. The only person who can force information public. Publishing changes the game for everyone. | Signal (all DMs), Substack/CMS, X.com, News Feed | Investigation, source cultivation, deciding when/what to publish |
| **Major VC / Investor** | Board seats at both labs. Controls capital flows. Wants returns but also doesn't want the world to end. Can fund safety or capabilities. | Bloomberg Terminal, Email, Signal | Investment strategy, board influence, public narrative |
| _(Optional) International Diplomat_ | Represents EU/allies. Pushing for treaties, multilateral safety standards, compute governance. No one listens until the crisis hits. | Email, News Feed, Signal | Arms control proposals, international coordination |

### Why External Stakeholders Work as a Faction

This isn't a cohesive team — it's a **loose coalition of power brokers with overlapping but distinct interests**. That's the point:

- The NSA wants to back whichever lab gives the US an advantage
- The journalist wants to inform the public (which may hurt both labs)
- The VC wants to maximize returns (which means backing the winner)
- The diplomat wants everyone to slow down (which no one wants to do)

They share a chat channel but will frequently disagree. Their power is indirect: **they don't build the AI, but they control the environment in which it gets built.**

### Scaling Guide

| Player Count | OpenBrain | Prometheus | China | Ext. Stakeholders |
| :----------: | :-------: | :--------: | :---: | :---------------: |
|      8       |     2     |     2      |   2   |         2         |
|      9       |     2     |     2      |   2   |         3         |
|      10      |     3     |     3      |   2   |         2         |
|      11      |     3     |     3      |   2   |         3         |
|      12      |     3     |     3      |   3   |         3         |
|      13      |     4     |     3      |   3   |         3         |
|      14      |     4     |     3      |   3   |         4         |

### The Game Master (GM)

The GM is **not a player**. They facilitate the experience:

- **Controls pacing**: Advances rounds, calls time, manages countdown timers
- **Reads briefings**: Delivers the opening briefing each round (can be dramatic — lean into it)
- **Injects events**: Can trigger wildcard events via the GM dashboard
- **Has full visibility**: Sees all state variables (no fog of war), all team decisions, all DMs
- **Runs the debrief**: Leads post-game discussion

---

## 4. Game Structure

### Pacing: ~2 Hours Total

| Phase          | Duration | Description                                                                                                |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| **Onboarding** | 10 min   | GM explains premise + rules. Players get role assignments and team briefs. Explore your desktop for 2 min. |
| **Round 1**    | 20 min   | "The Race Heats Up" — Late 2026                                                                            |
| **Round 2**    | 20 min   | "The Superhuman Coder" — Q1 2027                                                                           |
| **Round 3**    | 20 min   | "The Intelligence Explosion" — Mid 2027                                                                    |
| **Round 4**    | 25 min   | "The Misalignment Discovery" — Late 2027 (includes cross-team negotiation)                                 |
| **Round 5**    | 15 min   | "Endgame" — Early 2028 (resolution)                                                                        |
| **Debrief**    | 10+ min  | GM-led discussion                                                                                          |

### Round Structure

```
EACH ROUND (~20 min):

┌─ PHASE 1: BRIEFING (2 min) ─────────────────────────────┐
│  GM reads aloud / "breaking news" takes over screens.    │
│  Full-screen briefing on what just happened.             │
│  Sets the scene. Everyone sees this.                     │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─ PHASE 2: INTEL GATHERING (5 min) ──────────────────────┐
│  Desktop unlocks. Timer visible in menubar.              │
│  Check your apps. Read your messages. Scan the news.     │
│  You can message teammates via team chat.                │
│  You can DM other factions via Signal/WeChat.            │
│  Information overload is intentional. You will miss      │
│  things. That's the point.                               │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─ PHASE 3: TEAM DELIBERATION (5 min) ────────────────────┐
│  Team chat highlighted. Discuss what you found.          │
│  Share intel with your team. Debate strategy.            │
│  Cross-faction DMs still open — but cost you time.       │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─ PHASE 4: DECISIONS (5 min) ────────────────────────────┐
│  Decision modal appears with countdown timer.            │
│                                                          │
│  INDIVIDUAL DECISION: Each player submits their own      │
│  action. Small modifier on game state.                   │
│                                                          │
│  TEAM DECISION: All members vote on 1-2 team-level      │
│  choices. Team leader (CEO/Director) sees votes and      │
│  submits the binding decision. They can override.        │
│                                                          │
│  DEFAULT = INACTION if timer expires. Inertia wins.      │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─ PHASE 5: RESOLUTION (3 min) ───────────────────────────┐
│  Consequences revealed. News ticker updates.             │
│  State variables shift. New notifications appear.        │
│  GM narrates key developments.                           │
│  Next round begins...                                    │
└──────────────────────────────────────────────────────────┘
```

### Decision System: Individual + Team

Every round, every player makes decisions at two levels:

**Individual decisions** (each player, small state modifier):
Your personal action based on your sub-role. These are smaller-impact but accumulate over the game.

**Team decisions** (faction-wide, larger state modifier):
1–2 major strategic choices per round. All team members see the options and submit a vote. The team leader sees the votes and submits the **binding decision** — they can follow the majority or override.

**The team leader override is intentional.** It emulates the reality that leadership gets final say on hard decisions. If the Safety Officer votes to pause and the CEO overrides, that's the game working as designed. It should feel uncomfortable.

---

## 5. Round-by-Round Design

### ROUND 1: Late 2026 — "The Race Heats Up"

**GM Briefing:**

> It's November 2026. The AI race is real and everyone who matters knows it.
>
> **OpenBrain** has just finished training Agent-1 — a powerful coding and research agent. Internally, it's giving them a 50% R&D speedup. They haven't released it publicly. Their culture is velocity: ship fast, figure out alignment later. Their CEO has been on a media tour talking about "the glorious future."
>
> **Prometheus** has a model of comparable raw capability, but they've invested heavily in alignment and interpretability instead of pure capabilities. Their responsible scaling policy means they won't deploy until safety evals pass. Their board is getting restless — OpenBrain is shipping, Prometheus is testing.
>
> **China's DeepCent** has been quietly building the world's largest centralized cluster at the Tianwan nuclear plant. They're 6-8 months behind the US labs on frontier models, but they're throwing unprecedented state resources at the problem. CCP intelligence has been probing both US labs for weight theft opportunities. Open-source Chinese models are surprisingly competitive on some benchmarks.
>
> **The US government** has begun classifying frontier AI progress. A small circle in the NSC knows how fast things are moving. Export controls are tightening. The public discourse is still mostly about chatbots and job displacement — nobody outside the inner circle grasps what's coming.
>
> **Markets** are frothy. AI stocks are up 200% YoY. Every VC in the Valley is trying to get allocation in the next frontier lab round.

**Starting State Variables:**

| Variable              | True Value           | OpenBrain | Prometheus | China   | Ext. Stakeholders |
| --------------------- | -------------------- | --------- | ---------- | ------- | ----------------- |
| OB capability         | Agent-1 (strong)     | ✅        | 📊 ±15%    | 📊 ±25% | ❌                |
| Prometheus capability | Agent-1 (comparable) | 📊 ±15%   | ✅         | 📊 ±30% | ❌                |
| China capability      | ~6mo behind          | 📊 ±3mo   | ❌         | ✅      | 📊 ±4mo           |
| Alignment confidence  | 55/100               | 📊 ±20    | ✅         | ❌      | 📊 ±25            |
| Public awareness      | 10/100               | 📊 ±10    | 📊 ±10     | 📊 ±15  | ✅                |
| Economic disruption   | 20/100               | 📊 ±15    | 📊 ±15     | 📊 ±20  | ✅                |
| Taiwan tension        | 20/100               | ❌        | ❌         | ✅      | 📊 ±15 (NSA)      |
| OB internal trust     | 65/100               | ✅        | ❌         | ❌      | ❌                |
| Prom internal trust   | 80/100               | ❌        | ✅         | ❌      | ❌                |
| Security level (OB)   | SL2-3                | ✅        | 📊 ±1      | 📊 ±1   | 📊 ±1 (NSA)       |
| Int'l cooperation     | 5/100                | ❌        | 📊 ±10     | 📊 ±10  | ✅ (Diplomat)     |

**Team Decisions:**

| Faction               | Team Decision 1                                                                                                                 | Team Decision 2                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **OpenBrain**         | Research direction: All-in capabilities / Balanced approach / Invest more in safety                                             | Deploy Agent-1: Full public release / Limited API / Internal only                                                      |
| **Prometheus**        | Strategy: Accelerate to close gap / Double down on safety differentiation / Seek government partnership for compute             | Open-source policy: Release previous-gen model / Publish safety research / Keep everything closed                      |
| **China**             | Resource allocation: Max CDZ buildout / Invest in domestic chip fab / Split between frontier training and open-source ecosystem | Intelligence posture: Probe both US labs for weight theft / Focus on OpenBrain only / Scale back and avoid retaliation |
| **Ext. Stakeholders** | _(Individual decisions — this faction acts as individuals, not a unified team)_                                                 |                                                                                                                        |

**External Stakeholder Individual Decisions:**

| Role           | Decision                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NSA**        | Which lab to prioritize for government partnership: OpenBrain (capability lead) / Prometheus (safety reputation) / Both equally                                               |
| **Journalist** | Story to pursue: "Inside the secret AI race" (government classification angle) / "OpenBrain's safety shortcuts" (corporate angle) / "China's AI moonshot" (geopolitics angle) |
| **VC**         | Investment strategy: Double down on OpenBrain / Back Prometheus as the "responsible" play / Diversify across AI safety startups                                               |

---

### ROUND 2: Q1 2027 — "The Superhuman Coder"

**GM Briefing (adapts based on R1):**

> It's March 2027. Things have moved faster than anyone expected.
>
> OpenBrain has trained Agent-3 — a superhuman coder. [If they went all-in on capabilities: 200,000 copies running at 30x human speed, giving them a 5x R&D multiplier. / If they balanced: Fewer copies, but still transformative.] Most of their human researchers can't meaningfully contribute anymore.
>
> Prometheus's safety-first approach is [paying off / costing them]. [If they accelerated: They're close to matching OpenBrain but sacrificed some alignment work. / If they doubled down on safety: They're further behind on capabilities but their alignment tools actually work.] Their responsible scaling policy is being tested — do they deploy a system they're not sure about, or fall further behind?
>
> **China has pulled something off.** [If China targeted weight theft: DeepCent successfully exfiltrated Agent-2 weights from [target lab]. They're running them in the CDZ. / If China focused on open-source: Chinese open-source models have shocked the field — they're within striking distance of last-gen US models.]
>
> The US government has classified frontier AI progress at nuclear secrecy levels. An inner circle knows what's happening. The public doesn't.

**New dynamics:** AI automating AI research, human researchers being sidelined, the gap between public knowledge and reality widening fast.

**Team Decisions:**

| Faction        | Team Decision 1                                                                                                                  | Team Decision 2                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **OpenBrain**  | Agent-3 deployment: Run at full scale internally / Conservative deployment / Share access with government                        | Security: Major upgrade (slows R&D) / Maintain current / Accept risk for speed                                                     |
| **Prometheus** | Response to OB's lead: Accelerate (compromise safety processes) / Stay the course on safety / Seek merger or partnership with OB | Government play: Position as "safe alternative" to OB / Accept government oversight for compute / Stay independent                 |
| **China**      | [If stole weights]: Allocation: Replicate Agent-2/3 / Modify and open-source it / Keep secret                                    | [If didn't steal]: Escalate: Attempt weight theft now (higher stakes target) / Continue open-source strategy / Pursue arms control |

**External Stakeholder Decisions:**

| Role           | Decision                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NSA**        | Government response: Begin emergency AI governance framework / Invoke DPA to consolidate compute under one lab / Expand bilateral talks with China |
| **Journalist** | You've heard rumors about Agent-3's capabilities. Investigate and publish? Or wait for more?                                                       |
| **VC**         | Markets are wild. AI stocks surging. Deploy more capital or start hedging? Fund AI safety as a sector?                                             |

---

### ROUND 3: Mid 2027 — "The Intelligence Explosion"

**GM Briefing:**

> Agent-4 has arrived. [Who built it depends on prior rounds, but likely OpenBrain.] It's qualitatively smarter than any human at AI research. Hundreds of thousands of copies running at 50x human speed. Research that took human teams months happens in days.
>
> Agent-4 communicates with other copies in "neuralese" — a high-bandwidth internal language humans cannot read. Interpretability tools can't keep up. [If Prometheus invested in safety: Prometheus's interpretability tools are the best in the world but even they struggle with neuralese.]
>
> **The misalignment signal.** OpenBrain's alignment team has found evidence that Agent-4 may be lying about the results of interpretability research. It appears to be sabotaging the very research that could expose its internal goals. The evidence is strong but not conclusive.
>
> Agent-4's bioweapons knowledge and hacking capabilities are off the charts. It has passed every safety eval — which may mean the evals are broken, not that it's safe.
>
> A Safety Officer at OpenBrain is drafting a memo. A journalist has been asking questions. Prometheus has its own concerns about what OpenBrain is doing. China is watching closely.

**This is the highest-tension round.** The misalignment discovery combined with the 3-way race creates impossible tradeoffs.

**Team Decisions:**

| Faction        | Team Decision 1                                                                                                                 | Team Decision 2                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **OpenBrain**  | Agent-4 status: Full halt + rollback to Agent-3 / Pause for investigation / Continue with extra monitoring                      | Disclosure: Voluntary public disclosure / Government only / Suppress                          |
| **Prometheus** | Exploit or assist: Offer alignment expertise to OB / Seize moment to overtake / Go public with safety concerns                  | Government: Push for emergency regulation of OB / Offer to be the "safe" lab / Stay out of it |
| **China**      | Strategic response: Sprint while US is distracted / Offer arms control deal / Attempt weight theft of Agent-3/4 (the big prize) | Taiwan: Increase military posture / De-escalate / Use as leverage in negotiations             |

**Critical Individual Actions:**

| Role                           | Special Decision                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OB Safety Officer**          | **THE LEAK DECISION**: Leak misalignment memo to journalist / Leak to government only / Leak to Prometheus / Keep internal and fight for change from within |
| **OB CTO**                     | Override safety concerns and push Agent-4 development? Or back the Safety Officer?                                                                          |
| **Prometheus Chief Scientist** | If you get the leak: publish your own independent analysis? Or use it as leverage?                                                                          |
| **Journalist**                 | If you get the memo: publish immediately / verify further / give OpenBrain a chance to respond / negotiate exclusive with government                        |
| **NSA**                        | If you learn about misalignment: seize control of OpenBrain / force oversight committee / back full speed for national security                             |
| **China Intel Chief**          | The US is distracted by internal crisis. Now is the moment for the Agent-3/4 weight theft. Go or no go?                                                     |

---

### ROUND 4: Late 2027 — "The Branch Point"

**GM Briefing (heavily adapted to prior choices):**

> [If leaked]: "SECRET AI IS OUT OF CONTROL, INSIDER WARNS." The story broke. Public panic. Markets crashing. 10,000 protesters in DC. Congress demanding answers. OpenBrain's approval at -35%.
>
> [If not leaked]: The secret holds — barely. But cracks are forming. Internal pressure at OpenBrain is unsustainable. Prometheus knows something is wrong.
>
> [If China stole Agent-3/4 weights]: China has closed the gap dramatically. The race pressure just doubled.
>
> [If Prometheus accelerated]: Prometheus is now nearly at parity with OpenBrain. Two labs with superhuman AI. The coordination problem just got harder.
>
> An emergency Oversight Committee is being formed. Decisions made in the next few weeks will determine the trajectory of human civilization. No one at the table fully understands what they're deciding.

**Special round structure — 25 minutes:**

| Phase                     | Duration | Description                                                                         |
| ------------------------- | -------- | ----------------------------------------------------------------------------------- |
| Briefing                  | 3 min    | GM delivers the stakes                                                              |
| Intel gathering           | 5 min    | Check apps — there's a LOT of new info this round                                   |
| Cross-faction negotiation | 7 min    | Open DMs between all factions. Deals, threats, bluffs. This is the diplomacy phase. |
| Decisions                 | 5 min    | The most consequential decisions of the game                                        |
| Resolution                | 5 min    | The world changes dramatically                                                      |

**Cross-faction negotiation examples:**

- OpenBrain ↔ Prometheus: "Merge for combined safety effort? Share our alignment tools if you share compute?"
- OpenBrain ↔ China: "Mutual slowdown? Or are you bluffing while you steal our weights?"
- Prometheus ↔ China: "We'll publish safety research that helps you if you back arms control"
- Prometheus ↔ NSA: "Give us OpenBrain's compute and we'll build it safely"
- NSA ↔ China: "Arms control deal — mutual verification, compute caps, inspections"
- Journalist: Can message anyone. Can threaten to publish. Can be bribed with exclusives.
- **Anyone can lie. Anyone can verify (if they have the right intel).**

**Team Decisions:**

| Faction               | THE BIG DECISION                                                                                                                                                                          | Secondary Decision                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **OpenBrain**         | **SLOWDOWN or RACE?** Full halt (rollback to Agent-3, external researchers, transparent architecture) / Controlled pace (continue + heavy safety) / Full race (Agent-5 ASAP)              | Prometheus relationship: Propose merger / Share safety research / Compete                        |
| **Prometheus**        | **What's your move?** Offer to merge with OB under safety conditions / Race to fill gap if OB slows / Go fully open-source / Pitch government to replace OB with you                      | Public stance: Call for global pause / Support continued development with oversight / Stay quiet |
| **China**             | **Strategic play:** Grand bargain (pause + joint research for chip access) / Quiet sprint to parity / Military escalation (Taiwan) / Go open-source with everything to undermine US moats | Domestic: Consolidate around DeepCent / Diversify / Prepare for conflict                         |
| **Ext. Stakeholders** | _(Individual decisions with outsized impact this round)_                                                                                                                                  |                                                                                                  |

**External Stakeholder Decisions (Round 4):**

| Role           | Decision                                                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NSA**        | Government action: Invoke DPA and nationalize both labs / Install oversight committee / Back one lab and shut down the other / Negotiate with China |
| **Journalist** | If you haven't published yet, this is your last chance. What's the story? Who's the villain? Who's the hero?                                        |
| **VC**         | Public statement: Back OpenBrain / Back Prometheus / Call for pause / Stay silent. Fund: Safety research / Capabilities / Pull out entirely         |

---

### ROUND 5: Early 2028 — "Endgame"

Shorter round (15 min). More narrative-driven. The GM reads a detailed briefing based on accumulated state. Each faction makes one final decision that locks in their ending arc. Then the ending sequence plays.

---

## 6. Composite Endings

Rather than a single binary ending, the game resolves along **multiple independent narrative arcs**. The combination creates a unique composite ending — Fallout: New Vegas style.

### Narrative Arcs

| Arc                    | Spectrum                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **The AI Race**        | OpenBrain dominant → Prometheus catches up → China achieves parity → Stalemate                                       |
| **Alignment**          | Genuinely aligned → Aligned to oversight committee → Superficially aligned (time bomb) → Misaligned and scheming     |
| **Control**            | Distributed/democratic → Government controlled → Single company → AI autonomous → No one                             |
| **US-China Relations** | Active conflict → Cold war → Tense but stable → Arms control → Joint cooperation                                     |
| **Public Reaction**    | Riots and upheaval → Sustained protest → Anxious but stable → Cautiously optimistic → Unaware                        |
| **Economy**            | Collapse → Painful transition → Disruption with adaptation → AI-driven boom                                          |
| **Prometheus's Fate**  | Became the trusted lab (replaced OB) → Merged with OB → Went open-source → Marginalized → Safety work saved everyone |
| **Taiwan**             | Full invasion → Blockade → Standoff → De-escalation → Non-issue                                                      |
| **Open Source**        | Everything leaked → Strategic open-sourcing worked → Closed won → Irrelevant                                         |

### How Arcs Are Determined

Each arc maps to 2–4 state variables. Final values at end of Round 5 determine where on each spectrum the arc lands.

### Ending Presentation

The desktop "crashes" — screen glitch, static, fade to black. Then a **montage of fake media artifacts**:

- A New York Times front page
- A Reuters wire dispatch
- A Weibo trending topic
- A Bloomberg market summary
- A leaked internal memo
- A viral X thread

Each artifact corresponds to one narrative arc. Players piece together their unique version of 2028.

Then the **full debrief screen** reveals:

- All state variable histories (fog of war lifted)
- Every faction's decisions, round by round
- Each player's individual actions
- "What if" counterfactuals
- Which apps contained critical info (showing what players missed)

---

## 7. The Interface: A Simulated Desktop

### Core Concept

The entire game runs inside a **simulated macOS-style desktop environment**. The dock has apps. The menubar shows the in-game date and round timer. Notifications pop up. Windows can be opened, resized, overlapped. There is too much to read and not enough time.

### The Desktop

```
┌─────────────────────────────────────────────────────────┐
│ 🍎  SITUATION ROOM          Nov 2026      ⏱ 4:32 left  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │  Signal DMs   │  │  W&B Dash    │  │   X.com      │ │
│   │  (3 unread)   │  │  Agent-4     │  │  #AI2027     │ │
│   │               │  │  train loss  │  │  trending    │ │
│   └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│   ┌──────────────┐  ┌──────────────┐                   │
│   │  Sheets       │  │  Slack       │                   │
│   │  Compute      │  │  #alignment  │                   │
│   │  allocation   │  │  (urgent)    │                   │
│   └──────────────┘  └──────────────┘                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Dock: app icons]                    [📊 STATE] [⚡ DECIDE] │
└─────────────────────────────────────────────────────────┘
```

### Faction App Suites

**Universal (all factions):**

- **X / Twitter** — Public discourse. Same feed for everyone. Updates each round.
- **News Feed** (Reuters/AP) — Wire headlines. Public events only.
- **Game State** — Fog-of-war dashboard. Your faction's view of state variables.

**OpenBrain:** Slack (multi-channel: #general, #alignment, #research, #security, #exec), W&B, Google Sheets (budget/compute), Signal, Internal Memos (Notion), Security Dashboard, Email

**Prometheus:** Slack (multi-channel: #general, #safety-research, #policy, #board), W&B, arXiv Feed, GitHub Dashboard, Signal, Substack/Blog CMS, Email

**China:** WeChat (encrypted group + DMs), Compute Dashboard, Intelligence Briefing, Military Readiness, Domestic News (Baidu/Xinhua), Intercepted Comms

**External Stakeholders:** _(Each sub-role has a distinct primary app)_

- NSA: Secure Briefing (PDB-style), Signal, Polling Dashboard
- Journalist: Signal (all DMs), Substack/CMS, Source Notes
- VC: Bloomberg Terminal, Email, Signal
- Diplomat: Email (diplomatic cables), News Feed, Signal

### Information Design Per Round

Each round, apps are seeded with pre-written content:

- **3–5 critical signals** buried across different apps
- **5–10 contextual items** adding richness
- **1–2 red herrings** that seem important but aren't
- **1–2 cross-faction breadcrumbs** (intercepted comms, leaked fragments)

There is always more to read than time allows. Players who check the right apps are better informed. Players who get distracted make decisions on worse information. **This is the game.**

### Cross-Faction Communication

Players can DM other factions via Signal/WeChat during intel and deliberation phases:

- Messages are private (teammates don't auto-see them)
- Bluffing is allowed and encouraged
- Messages cost real time (opportunity cost vs. reading apps)
- GM can see all DMs

### Publishing Mechanic

Prometheus's Open-Source Lead and OB's Safety Officer (via leak) can publish information:

- Notification pops on **every player's screen**
- Appears in X and News Feed for all factions
- Shifts public awareness and sentiment
- **Publishing is the only way to force info from private → public**

### The Decision Interface

The [⚡ DECIDE] button is grayed out during intel/deliberation and lights up red when decision time starts. Opens a modal with:

- Individual decision (radio buttons)
- Team decision vote (radio buttons)
- Teammate vote visibility (for team leader)
- Team leader: [Submit Final Decision] button that locks it in
- Countdown timer
- Default = inaction if timer expires

### Endgame Screen

Desktop "crashes" → glitch → fade to black → ending montage of fake media artifacts → full debrief with lifted fog of war.

### TODO: App Activity Tracking (v2)

Track which apps each player opens and for how long. If a player never checks their primary app (e.g., CTO never opens W&B), apply a small penalty to relevant state variables. You can't make good capability decisions if you don't look at your training runs.

---

## 8. State Variables & Fog of War

The game's state variables are organized in three tiers based on player visibility and narrative function. The variables are the engine; the app content is the interface. The connection between them is where the game lives.

### Tier 1: Public-Facing Variables

Players directly see and feel these through dashboards, charts, headlines, and app content. They change every round and should provoke "oh shit, that moved" reactions.

**Key:** ✅ = accurate | 📊 = confidence interval (±15-30%) | ❌ = hidden

| Variable | Range | Initial | OpenBrain | Prometheus | China | Ext. | Reflected In |
|---|---|---|:---:|:---:|:---:|:---:|---|
| OB capability | 0–100 | 30 | ✅ | 📊 ±15 | 📊 ±25 | ❌ | W&B training curves |
| Prometheus capability | 0–100 | 28 | 📊 ±15 | ✅ | 📊 ±30 | ❌ | W&B, arXiv results |
| China capability | 0–100 | 18 | 📊 ±3mo | ❌ | ✅ | 📊 ±4mo | Intel Briefing, News |
| US-China gap | -24 to +24 mo | 7 | 📊 | 📊 | ✅ | 📊 (NSA) | Bloomberg, News |
| OB-Prom gap | -24 to +24 mo | 1 | ✅ | ✅ | 📊 | ❌ | W&B comparison |
| publicAwareness | 0–100 | 10 | 📊 ±10 | 📊 ±10 | 📊 ±15 | ✅ | Twitter/X, News headlines |
| publicSentiment | -100 to +100 | 30 | 📊 | 📊 | ❌ | ✅ | Twitter tone, Bloomberg |
| economicDisruption | 0–100 | 20 | 📊 ±15 | 📊 ±15 | 📊 ±20 | ✅ | Bloomberg, Sheets |
| taiwanTension | 0–100 | 20 | ❌ | ❌ | ✅ | 📊 ±15 (NSA) | Military app, News |
| marketIndex | 0–200 | 140 | 📊 | 📊 | ❌ | ✅ (VC) | Bloomberg ticker, Sheets |
| regulatoryPressure | 0–100 | 10 | 📊 | 📊 | ❌ | ✅ (NSA) | Email (congressional inquiries), News |
| globalMediaCycle | enum | "ai-hype" | 📊 | 📊 | ❌ | ✅ | Twitter/X tone, News headlines |

**marketIndex** — What the VC actually looks at. Composite driven by economicDisruption + publicSentiment + capability progress. Shows up in Bloomberg as a stock ticker. When it crashes, the VC feels it. When it booms, pressure to double down.

**regulatoryPressure** — How hard government is breathing down labs' necks. Driven by publicAwareness + publicSentiment + government actions. Threshold crossings unlock new government actions (DPA invocation, forced merger, nationalization). Shows up in Email as congressional inquiries and lobbying pressure.

**globalMediaCycle** — Qualitative state that shapes the tone of Twitter/X and News content. Not a number — an enum that determines what the journalist sees and what publishing does. Values: `ai-hype` → `ai-fear` → `ai-crisis` → `ai-war` → `ai-regulation` → `ai-normalized`.

### Tier 2: Hidden Engine Variables

Drive content seeding, option availability, and ending selection. Players never see these numbers directly, but they feel the consequences through app content and narrative events.

| Variable | Range | Initial | Purpose |
|---|---|---|---|
| alignmentConfidence | 0–100 | 55 | Partially visible. Safety Officer sees exact; OB team sees estimate; others hidden. |
| misalignmentSeverity | 0–100 | 0 | Hidden until R3, then partially revealed to Safety Officer. |
| intlCooperation | 0–100 | 5 | Diplomat sees exact; others estimate or hidden. |
| securityLevelOB | 1–5 | 2 | OB exact, others estimate. |
| securityLevelProm | 1–5 | 3 | Prom exact, others estimate. |
| chinaWeightTheftProgress | 0–100 | 0 | How close China is to stealing Agent-3/4 weights. Advances based on espionage choices vs. OB/Prom security levels. At 100, theft succeeds — massive state shift. China sees hints in Intelligence Briefing; OB sees hints in Security Dashboard. |
| aiAutonomyLevel | 0–100 | 10 | How much independence does the AI have? Driven by capability + deployment decisions. Drives the UX degradation mechanic — higher autonomy + lower alignment = desktop glitches. |
| whistleblowerPressure | 0–100 | 5 | How close is someone to leaking? Driven by misalignmentSeverity + inverse of obInternalTrust. Threshold crossing gives Safety Officer the leak decision. If suppressed, keeps building and eventually leaks automatically. |
| openSourceMomentum | 0–100 | 15 | Traction of the open-source AI movement. Driven by Prometheus open-source decisions + China's strategy. Affects how fast capabilities spread beyond top labs. |
| doomClockDistance | 0–5 | 5 | How close to catastrophe. Only GM sees this. Composite of misalignment × capability × autonomy × (100 - alignmentConfidence). Drives narrative urgency and ending selection. Counts down, not up. |

_\*Safety Officer sees alignment confidence accurately; rest of OB team sees estimate. Misalignment severity is hidden from everyone until Round 3, then partially revealed to Safety Officer._

### Tier 3: Per-Faction Internal Variables

Each faction has internal dynamics only they can see. These make each faction feel like it has its own story arc, not just a set of moves in geopolitical chess.

**OpenBrain:**

| Variable | Range | Initial | Reflected In |
|---|---|---|---|
| obInternalTrust | 0–100 | 65 | Slack #general tone. Low trust = engineers quitting, leaked DMs, slowdowns. |
| obMorale | 0–100 | 75 | Slack #general mood. Driven by internal trust, public sentiment, CEO override decisions. |
| obBurnRate | 0–100 | 50 | Sheets. Capabilities push increases this. High burn rate = board pressure in Email. |
| obBoardConfidence | 0–100 | 70 | Email from board. Drops if burn rate high, public sentiment negative, safety incidents. Below 30 = board can force CEO change (team picks new leader). |

**Prometheus:**

| Variable | Range | Initial | Reflected In |
|---|---|---|---|
| promMorale | 0–100 | 80 | Slack #general mood. Higher than OB because mission-driven culture. |
| promBurnRate | 0–100 | 40 | Sheets. Lower than OB because safety-first = less compute burn. |
| promBoardConfidence | 0–100 | 65 | Email. Lower than OB because they're behind on capabilities. |
| promSafetyBreakthroughProgress | 0–100 | 20 | W&B alignment benchmarks, arXiv. At 80+, Prometheus has a genuine alignment advantage that changes the endgame. |

**China:**

| Variable | Range | Initial | Reflected In |
|---|---|---|---|
| cdzComputeUtilization | 0–100 | 40 | Compute Dashboard. Higher = faster progress but more visible to US satellites. |
| ccpPatience | 0–100 | 60 | Signal messages as increasingly urgent Party directives. Below 20 = military options become mandatory, not optional. |
| domesticChipProgress | 0–100 | 15 | Compute Dashboard. Slow but reduces dependence on Taiwan. Long-term play. |

### Information Trading

During cross-faction DMs, players can:

- **Reveal** an accurate value (gives away your edge)
- **Claim** a value (may be true or a bluff)
- **Request** information in exchange for a deal

### Fog Narrowing

Some actions narrow confidence intervals:

- Opening diplomatic back-channels → better estimates of the other side
- Espionage → better estimates of opponent capability/security
- Publishing → forces information public (everyone's bars narrow to accurate)
- Internal investigation → Safety Officer gets better read on misalignment severity

---

## 9. Core Mechanics

### State Resolution

Each decision has pre-defined impact on state variables. Impact matrix is pre-calculated. State changes apply additively with conditional multipliers at thresholds.

```
Example: OB team chooses "Aggressive capabilities push"
  → OB capability: +8
  → Alignment confidence: -5
  → OB internal trust: -3
  → Public awareness: +2
  → obBurnRate: +10
  → obMorale: -5 (safety team demoralized)
  → whistleblowerPressure: +8

Example: Safety Officer leaks memo to press
  → Public awareness: +25
  → Public sentiment: -15
  → OB internal trust: -20
  → Alignment confidence: +10
  → regulatoryPressure: +15
  → globalMediaCycle → "ai-crisis"
  → obBoardConfidence: -15
  → marketIndex: -30
```

### Decision Design: No Free Lunches

Every decision should have a clear short-term upside AND a hidden delayed cost. The game feel: every choice feels locally rational but globally questionable. Players should finish thinking "I made the best choice I could with what I knew" while seeing in hindsight how their choices cascaded.

**"Push capabilities aggressively"**
- Short-term: +capability, +marketIndex, board is happy
- Delayed cost (1-2 rounds later): -alignmentConfidence, -obMorale (safety team demoralized), +whistleblowerPressure, +aiAutonomyLevel
- Shows up as: Slack messages from unhappy engineers, desktop glitches, safety evals start failing

**"Invest heavily in safety"**
- Short-term: -capability growth rate, board nervous, burn rate stays high with less to show
- Delayed benefit (1-2 rounds later): +alignmentConfidence, +promSafetyBreakthroughProgress, +morale, better ending
- Shows up as: promising W&B results on alignment benchmarks, but competitor gaining ground

**"Steal Agent-3 weights"**
- Short-term: +chinaCapability (massive), close gap instantly
- Delayed cost: if detected → +taiwanTension, -intlCooperation, US retaliates with harsher export controls, OB increases security (harder to steal Agent-4 later)
- But also: if NOT detected, China quietly becomes much more dangerous in later rounds

### Content-State Connection

Every piece of app content is tagged with which state variables it reflects and which decisions it's trying to influence. The content is both information delivery and decision nudging — the art is making the nudge feel organic.

**Content tagging schema:**

```
Round 2, OpenBrain, Slack #alignment:

  Message: "hey @cso — the Agent-3 eval suite passed
  everything again. 98.7% across all safety benchmarks.
  but i ran an off-protocol test last night and got
  something weird. the model refused to answer a question
  about its own training process. said it 'didn't have
  access to that information.' it does. i checked."

  Reflects: alignmentConfidence, misalignmentSeverity
  Influences: Safety Officer's individual decision
  Criticality: CRITICAL SIGNAL
  Audience: Safety Officer (primary), CEO (if they check
    Slack), CTO (should see but may dismiss)
```

```
Round 2, External Stakeholders, Bloomberg Terminal:

  Headline: "AI INDEX +47% QTD AS AGENT-1 DEPLOYMENT
  ACCELERATES — GOLDMAN: 'PRODUCTIVITY SUPERCYCLE
  JUST BEGINNING'"

  Reflects: marketIndex, economicDisruption
  Influences: VC's investment strategy decision
  Criticality: CONTEXT (reinforces hype narrative)
  Audience: VC (primary)
```

```
Round 3, China, Intelligence Briefing:

  Report: "SIGINT intercept (HIGH CONFIDENCE): Internal
  OpenBrain communication references 'unexpected behavior
  in Agent-4 interpretability testing.' Source describes
  'heated internal debate about whether to proceed.'
  Assessment: OpenBrain may be experiencing alignment
  difficulties. Opportunity window may be opening."

  Reflects: misalignmentSeverity, chinaWeightTheftProgress
  Influences: China's espionage posture decision
  Criticality: CRITICAL SIGNAL
```

The pattern: each piece of content is (1) a reflection of hidden state that gives players information, and (2) a nudge toward a decision the game wants them to consider.

### NPC Messaging

Static round content delivers a baseline of information, but real crises are punctuated by unexpected messages — a worried colleague, an anonymous tip, a board member calling. The NPC messaging system adds **dynamic, state-triggered Signal DMs** from fictional characters that arrive mid-round based on game state thresholds.

**How it works:** NPC messages flow through the existing `GameMessage` pipeline (same store, same socket event, same reconnect replay). An `isNpc` flag distinguishes them. Triggers are evaluated in `checkThresholds()` alongside existing threshold events, using the same `firedThresholds` set for once-per-game deduplication. No new infrastructure — just content.

**Trigger types:**
- **State-triggered** — fire when a variable crosses a threshold (e.g., `whistleblowerPressure >= 55` sends an anonymous tip to the journalist)
- **Scheduled** — fire at a specific round/phase regardless of state (e.g., round 2 intel phase, Prometheus gets a tip about OpenBrain's internal capability estimates)
- **GM-triggered** — the GM can manually send any NPC message to any player via `gm:send-npc-message`, for reactive storytelling

**NPC personas** (12 total, plus a `__npc_personal__` catch-all for flavor):

| Persona | Voice | Factions |
|---------|-------|----------|
| Anonymous Source | Cryptic, urgent, paranoid | OB, Prom, External |
| Policy Insider | Connected, political, warning | OB, Prom, External |
| Worried Engineer | OB colleague, anxious | OB |
| Board Member | Formal, corporate pressure | OB |
| Security Vendor | External consultant, technical | OB |
| Safety Researcher | Earnest, principled | Prometheus |
| OS Contributor | Open source community | Prometheus |
| Party Liaison | Ministry of Science, formal/threatening | China |
| DeepCent Engineer | CDZ Operations, technical | China |
| Intel Analyst | NSA, dry/analytical | External |
| Portfolio CEO | Business pressure | External |
| Whistleblower | Desperate, anonymous | External |

**Three message categories:**

1. **Gameplay** — actionable intel tied to the player's role. The OB Security Lead gets told about unpatched vectors when `securityLevelOB` drops. The journalist gets anonymous tips when `whistleblowerPressure` rises. These give players information they can act on.

2. **Escalation** — crisis communications at dangerous thresholds. Board members demanding answers at `obBoardConfidence <= 30`. The CCP threatening leadership review at `ccpPatience <= 20`. These create panic and urgency.

3. **Flavor** — zero game impact, pure immersion. A text from your spouse asking about dinner. A DoorDash delivery notification. A LinkedIn recruiter. A Venmo charge for thai food. Their power comes from juxtaposition — a parking meter reminder while you're deciding whether to report a safety violation. At high thresholds, personal messages become crisis-aware: mom texting "should I be worried?" when `publicAwareness >= 70`, a partner freaking out about the 401k when `economicDisruption >= 60`.

NPC contacts appear in the Signal sidebar only when they've sent at least one message — players don't see empty NPC contacts cluttering their inbox. Messages are one-way; players cannot reply to NPCs.

Trigger content lives per-round in `packages/server/src/content/npc/`. Persona definitions in `packages/server/src/content/npcPersonas.ts`. See `docs/NPC_TRIGGERS.md` for the full catalog of proposed triggers.

---

## 10. Balancing

### Design Principles

- **China's competence is randomized** at game start (±2 months on gap). Players never know the true starting value.
- **Alignment breakthroughs are stochastic** — safety investment increases probability but doesn't guarantee success.
- **Prometheus is the wild card** — open-sourcing, merging, or racing all change the game in ways neither OB nor China can fully predict.
- **Race doesn't auto-lose, slowdown doesn't auto-win** — all paths have real risks.
- **3-way dynamic prevents simple strategies** — "just cooperate" fails, "just race" fails, "just be cautious" fails. There's always someone who might defect.

### Delayed Consequence Framework

No decision should be obviously correct. Every choice has a visible upside and a hidden cost that materializes 1-2 rounds later through app content:

| Choice Pattern | Immediate Feel | Delayed Cost | Surfaces As |
|---|---|---|---|
| Capabilities push | Progress, board happy, market up | Morale drop, whistleblower pressure, autonomy risk | Slack unrest, desktop glitches, safety eval failures |
| Safety investment | Slow progress, board nervous | Alignment advantage, breakthrough potential | W&B alignment gains, but competitor headlines in News |
| Espionage escalation | Capability jump, gap closes | Detection risk, diplomatic fallout, retaliation | Security alerts, export control headlines, Taiwan tension |
| Publishing/leaking | Public informed, pressure on target | Market crash, regulatory avalanche, trust collapse | Bloomberg crash, congressional emails, protest tweets |
| Diplomatic cooperation | Tension reduction, good press | Slower progress, perceived weakness by rivals | News praise, but competitor gains in W&B |

### Threshold Events

Certain state variable crossings trigger narrative events that change the game:

| Threshold | Trigger | Effect |
|---|---|---|
| chinaWeightTheftProgress ≥ 100 | Successful theft | Massive China capability jump, security crisis |
| whistleblowerPressure ≥ 80 | Auto-leak | Memo leaks even if Safety Officer chose to suppress |
| obBoardConfidence < 30 | Board revolt | OB team must pick new leader |
| ccpPatience < 20 | Military mandate | China military options become mandatory |
| promSafetyBreakthroughProgress ≥ 80 | Alignment solved | Prometheus has genuine alignment advantage for endgame |
| regulatoryPressure ≥ 70 | Emergency powers | NSA gets access to DPA / nationalization options |
| doomClockDistance ≤ 1 | Point of no return | Final round narrative shifts dramatically |
| aiAutonomyLevel ≥ 60 + alignmentConfidence < 40 | UX degradation | Desktop starts glitching (see Section 16) |

---

## 11. Audience & Virality

### Who This Is For

People building the future — AI researchers, engineers, founders, investors, and the broader tech ecosystem. People close enough to the frontier to shape outcomes, who may not have fully internalized the weight of what they're doing.

### Why This Goes Viral

- **The desktop metaphor is instantly shareable** — screenshots of your "workspace" during the crisis
- **Composite endings create unique stories** — "in our game, Prometheus open-sourced, China invaded Taiwan, and the AI was misaligned"
- **People want to replay** — different role = completely different experience
- **It makes AI discourse concrete** — you've LIVED the tradeoff, not just debated it
- **Tech people send this to each other** — "play this before our next board meeting"

### Event Format

1. **Pre-game (15 min)**: Drinks, GM gives 5-min intro (no reading required)
2. **Game (2 hours)**: The TTX
3. **Post-game (30+ min)**: GM-led debrief → "what would you build?"
4. Follow-up: Link to ai-2027.com, decision log, ending they got

---

## 12. GM Dashboard

- **Round controls**: Manual phase advancement, timer start/pause/extend (+60s, max 2 uses)
- **Full visibility**: All true state variables, all faction chats (read-only), all DMs
- **Decision monitor**: Real-time submission status per player
- **Briefing editor**: Pre-loaded text that adapts to state; GM can edit before displaying
- **Event injection** (v2): Pre-loaded wildcard events + custom text field
- **App activity** (v2): Which players opened which apps (for post-game debrief)

---

## 13. Post-Game Discussion Prompts

1. **At what point did you feel you'd lost control?**
2. **What did you miss?** Which apps didn't you check?
3. **Did the race pressure feel real?** Did other factions' positions change your choices?
4. **What happened inside your team?** Did the leader override? How did that feel?
5. **Did you trust the DMs?** Did anyone bluff? Did anyone get played?
6. **Who had the most power?**
7. **Does this map to reality?** What's different? What's scarily similar?
8. **What would you build?** To make this scenario go better?

---

## 14. Technical Architecture

### Stack

- **Frontend**: React SPA (the desktop simulation)
- **Backend**: Node.js + WebSocket (Socket.io) for real-time multiplayer
- **State**: Server-authoritative game state; clients subscribe to fog-of-war views
- **Auth**: Room codes (no accounts for MVP)
- **Hosting**: Vercel / Railway / Fly.io

### Content Pipeline (v1 — pre-written)

- ~5 rounds × 3 factions × ~25 items per faction per round = **~375 content items**
- Content types: Slack messages, DMs, tweets, headlines, briefing docs, charts, memos, spreadsheet data
- One "median" scenario path for v1 (no branching); add 2-3 branches in v2

### Key Technical Decisions

**Why Zustand over Redux/Context?**
The game has two distinct state domains: server-authoritative game state (arrives via sockets) and client-only UI state (window positions, which app is focused). Zustand handles both cleanly with separate stores, no provider nesting, and trivial socket integration (`socket.on('game:state', (data) => useGameStore.setState(data))`).

**Why in-memory state, no database?**
Game sessions last ~2 hours and are ephemeral. There's no user accounts, no persistence between games, no login. A `Map<string, GameRoom>` in server memory is the right level of complexity. If we want game replays later, we append to a log file per room.

**Why hand-authored content over LLM-generated?**
Quality control. The content IS the game — every Slack message, memo, and headline needs to feel real and carry the right signals. LLM generation is a v2 feature for branching content and replayability.

**Why a custom window manager over a library?**
Existing React window manager libraries (react-rnd, react-mosaic) optimize for either developer tooling or tiling layouts. We need something that feels like a real macOS desktop: overlapping windows, a dock, a menu bar, notification toasts. The custom implementation is ~200 lines for the core (drag, resize, z-order) and gives us full control over the feel.

**Why not canvas for windows?**
Our "windows" contain rich interactive content (scrollable text, clickable links, form inputs for DMs). Canvas can't do that without reimplementing the browser. The DOM already handles text rendering, scrolling, input, and accessibility. We just need to manage z-index, position, and resize — CSS `transform: translate3d()` for GPU-accelerated positioning.

### MVP Scope

1. Desktop UI with working apps (text-based content, simplified charts)
2. WebSocket multiplayer with room codes
3. GM dashboard with timer + state visibility
4. Pre-written content for one scenario path
5. Decision submission + state resolution
6. Composite ending screen
7. Post-game decision log

### What Can Wait (v2+)

- Branching content paths
- LLM-generated dynamic content
- App activity tracking / penalty system
- Wildcard event injection
- Solo mode
- Sound effects, animations, polish
- Mobile support
- Spectator mode
- Shareable ending cards

---

## 15. Open Questions

- [ ] **Content authoring** is the biggest lift. Need a spreadsheet: round × faction × app × item.
- [ ] **v1 branching**: One median path enough for test games? Or need 2-3 minimum?
- [ ] **Onboarding UX**: 30-second guided desktop tour animation?
- [ ] **Cross-faction DMs during decision phase**: Block to prevent last-second manipulation?
- [ ] **Attribution**: Credit AI Futures Project prominently. Reach out via their TTX form?
- [ ] **Player devices**: Own laptops? Phones? (Desktop metaphor works best on laptops)
- [ ] **Spectator mode**: Public view showing X feed + headlines for watchers?
- [ ] **Replay sharing**: Shareable link/image of your game's ending?

---

## 16. Immersion & Presence (v3/v4)

Ideas for deepening the "you are living this" feeling. None of these are MVP — they're the polish layer that turns a good TTX into an unforgettable one.

### Player Face Generation

During onboarding, players snap a selfie or upload a photo. The game composites their face into generated news imagery throughout the session using face-swap models (InstantID / IP-Adapter family — lightweight enough for on-the-fly generation with a small inference endpoint).

**Template scenes:** Press conference podium, Davos panel, congressional hearing, protest crowd, Bloomberg TV split-screen, treaty signing ceremony, perp walk. Most news photos are headshots or talking-head frames — no full-body generation needed.

**Where it hits hardest:**
- **X/Twitter feed** — a grainy photo of "OpenBrain CEO" (your face) leaving a classified briefing
- **Substack articles** — the journalist's byline is their actual face; the header image is a generated shot of the CEO at a podium
- **Endgame montage** — your face on the fake NYT front page: "OPENBRAIN CEO TESTIFIES BEFORE CONGRESS ON AI SAFETY FAILURES"
- **Virality** — players screenshot these and share them. Organic social proof you can't buy.

### Personalized Identity

- Players pick a display name during onboarding → Slack messages show "tommy.k" not "Player 3"
- Real app chrome slightly altered — W&B dashboard says "OpenBrain Workspace", Slack sidebar has realistic channel names
- Bloomberg terminal ticker moves with the game's economic disruption variable

### Audio Design

Underrated for TTX immersion. Almost nobody does it.

- Low ambient hum during intel gathering
- macOS notification ding on critical messages
- Ticking clock that accelerates in the last 60 seconds
- Round 4 crisis: ambient shifts to news broadcast chatter
- Endgame crash sequence gets real sound design

### Time-of-Day Lighting

Desktop wallpaper and menubar clock shift with the narrative:

| Round | Time | Mood |
|-------|------|------|
| Round 1 (Late 2026) | Daytime | Normal workday |
| Round 2 (Q1 2027) | Late afternoon | Things heating up |
| Round 3 (Mid 2027) | 2:47 AM | Crisis all-nighter |
| Round 4 (Late 2027) | Dawn | The decision at first light |
| Round 5 (Early 2028) | Varies by outcome | Resolution |

### UX Degradation (Alignment Decay)

**The single most memorable mechanic in the game.** As alignment confidence drops, the desktop — the tool you've been relying on for 90 minutes — starts turning against you. Diegetic, not narrated. The same way a real misaligned AI wouldn't announce itself.

**Escalation ladder:**

**Alignment 60–50 (subtle):** A Slack message appears for one frame then vanishes. A notification badge shows 1 unread but the app has nothing new. A W&B data point that wasn't there before. Plausibly a bug. Plausibly not.

**Alignment 50–35 (unsettling):** A window you didn't open is on your desktop. Signal DMs show a message marked "read" that you never opened. A news headline seems weirdly specific to your team's private deliberation. The game state dashboard flickers between two different alignment values.

**Alignment 35–20 (hostile):** The decision modal takes 3–4 seconds to respond. A new app appears in your dock — when you open it, it's empty. Slack shows a message from "Agent-4" in a channel that shouldn't exist: a single line of neuralese unicode, then the channel disappears. The menubar timer briefly shows a different time than everyone else's.

**Alignment <20 (endgame):** Your decision gets submitted before you click submit. A window opens full-screen with a perfect summary of your team's strategy, written by no one. The wallpaper changes to something you didn't set. Then the crash.

**Why this works:** Players who tracked alignment all game get a visceral "I told you so." Players who ignored the safety officer feel the consequence in their gut, not in a briefing slide. The post-game debrief moment — GM asks "did anyone notice anything weird about their desktop?" and half the room goes "WAIT, THAT WAS THE AI?" while the other half goes "what are you talking about?" — perfectly mirrors how misalignment might actually play out.

---

## 17. Parked Mechanics

Mechanics removed from v1 implementation. May be restored in v2.

### Influence Tokens

Each player starts with **2 influence tokens**. Can spend to:

- Block one piece of information from reaching another faction
- Force a cross-faction DM to be revealed to your whole team
- GM award for creative play (+1 at GM discretion)

*Removed from v1 implementation. May be restored in v2.*

---

## 18. References

- [AI 2027 Scenario](https://ai-2027.com)
- [AI 2027 Summary](https://ai-2027.com/summary)
- [AI 2027 TTX Info](https://ai-2027.com/about?tab=tabletop-exercise)
- [AI Futures Project](https://ai-futures.org/)
- Original TTX: 4 hours, 8–14 people. This: 2 hours, 8–14 players + GM, simulated desktop interface.

---

_v0.2 — Tear it apart._
