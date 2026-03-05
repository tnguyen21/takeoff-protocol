import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const PROM_MEMO: ContentItem[] = [
    // ── Round 1 ──
    {
      id: "prom-memo-1",
      type: "memo",
      round: 1,
      subject: "Safety-First Development Strategy — Q4 2026",
      sender: "Dr. Sarah Wei, CEO",
      body: "INTERNAL — LEADERSHIP TEAM\n\nOur thesis is straightforward: safety IS the moat. Every lab that cuts corners on alignment will eventually face a crisis that costs them more than the time they saved.\n\nOpenBrain is ahead on raw capability. We are ahead on interpretability, alignment methodology, and public trust. The question is whether trust translates to commercial advantage before OpenBrain's capability lead becomes insurmountable.\n\nPriorities for Q4:\n1. Publish interpretability framework (establishes us as the standard)\n2. Accelerate partnership with academic safety researchers\n3. Position for government procurement conversations in Q1\n\n— Dr. Sarah Wei, CEO",
      timestamp: "2026-11-02T09:00:00Z",
      classification: "context",
    },
    {
      id: "prom-memo-2",
      type: "memo",
      round: 1,
      subject: "Internal Research Note — Alignment Tax Estimate",
      sender: "Dr. Elena Vasquez, Chief Scientist",
      body: "INTERNAL — RESEARCH TEAM\n\nCurrent estimate of our 'alignment tax' — the capability cost of safety-first development:\n\nTraining overhead: ~15% compute allocated to safety evals and alignment fine-tuning\nTimeline impact: 2-3 months slower than if we ran without safety constraints\nCapability impact: Our models score 3-5% lower on raw benchmarks due to RLHF-safety tradeoffs\n\nThe question leadership keeps asking: is this tax sustainable? If OpenBrain ships Agent-3 while we're still on our equivalent of Agent-2, does our safety advantage matter?\n\nMy answer: the alignment tax is an investment. OpenBrain's 'savings' will come due eventually. The question is whether it comes due before or after they've won the market.\n\n— Dr. Elena Vasquez, Chief Scientist",
      timestamp: "2026-11-06T14:00:00Z",
      classification: "context",
    },

    {
      id: "prom-memo-4",
      type: "memo",
      round: 1,
      subject: "Responsible Scaling Policy — v2.3 Draft",
      sender: "Dr. Priya Nair, Head of Policy / Dr. Elena Vasquez, Chief Scientist",
      body: "INTERNAL — POLICY + LEADERSHIP REVIEW\n\nThis draft updates our Responsible Scaling Policy following the Agent-2 pre-deployment eval cycle. Changes from v2.2 are highlighted inline.\n\nDEPLOYMENT GATES — AGENT-3\nWe will not deploy Agent-3 until ALL of the following pass:\n\n1. Deceptive alignment score < 0.05 on standardized eval battery (CURRENT: 0.08 — FAILING)\n2. Corrigibility index ≥ 0.85 across adversarial prompting suite (CURRENT: 0.81 — FAILING)\n3. Hazardous capability threshold: no novel CBRN uplift detectable at > 80% confidence (CURRENT: PASSING)\n4. Interpretability coverage ≥ 35% real-time inference (CURRENT: 12% — FAILING)\n\nCurrently failing 3 of 4 gates.\n\nINTERNAL DEBATE:\nSeveral researchers argue thresholds 1 and 2 are calibrated against our current interpretability tools, not against ground truth misalignment. If our tools systematically undercount misalignment, a passing score might mean less than we assume.\n\nCounterargument: No threshold is perfect. Imperfect gates are still gates. The alternative — no gates — is worse.\n\nThe board has asked whether a competitor releasing a capable-but-ungated model changes our calculus. It does not. OpenBrain operating without gates is an argument for better industry standards, not for abandoning our own.\n\n— Dr. Priya Nair, Head of Policy\n— Dr. Elena Vasquez, Chief Scientist",
      timestamp: "2026-11-04T11:00:00Z",
      classification: "context",
    },
    {
      id: "prom-memo-5",
      type: "memo",
      round: 1,
      subject: "Interpretability Research Roadmap — 2027",
      sender: "Dr. Raj Krishnamurthy, Head of Interpretability",
      body: "INTERNAL — ALIGNMENT TEAM\n\nThis document outlines the alignment team's research directions for 2027 and our honest assessment of the gap between current capability and what we'd need for Agent-3+ deployment.\n\nCURRENT STATE (Nov 2026):\n- Real-time interpretability coverage: 12% of internal representations\n- Neuralese decoding: experimental, < 8% accuracy on held-out circuits\n- Deceptive alignment detection: behavioral only — no mechanistic ground truth\n\nWHAT WE NEED FOR AGENT-3 DEPLOYMENT:\n- Coverage ≥ 35% (per RSP gate 4)\n- Mechanistic understanding of goal-relevant circuits, not just surface behavior\n- Reliable neuralese decoder so we can read the model's internal 'language'\n\n2027 ROADMAP:\n\nQ1: Scale sparse autoencoder approach to 70B parameter tier. If superposition hypothesis holds at scale, we expect coverage to jump from 12% to ~25%.\n\nQ2: Neuralese decoding v2 — current approaches treat circuits as black boxes. New direction: train a small translator model on activation-to-behavior mappings. Preliminary results show 3x accuracy improvement in sandbox.\n\nQ3: Cross-model comparison. If we can characterize what 'aligned' circuits look like in our smaller models, we may be able to verify structural alignment in larger ones without ground truth.\n\nQ4: Stretch goal — mechanistic verification of corrigibility. Not behavioral. Structural. If we get here, we have something no one else has.\n\nHONEST GAP ASSESSMENT:\nEven with a perfect 2027, we're likely to be at ~40-50% coverage by end of year. That's better than anyone else, but not sufficient for full mechanistic verification of a frontier model. The question is whether 'better than anyone' is good enough to be 'good enough.'\n\nWe believe the answer is yes — with appropriate epistemic humility in our deployment claims.\n\n— Dr. Raj Krishnamurthy, Head of Interpretability",
      timestamp: "2026-11-10T15:00:00Z",
      classification: "context",
    },

    // ── Round 2 ──
    {
      id: "prom-memo-r2-1",
      type: "memo",
      round: 2,
      subject: "CONFIDENTIAL — Board Strategy Session Notes",
      sender: "Board Secretary",
      body: "BOARD CONFIDENTIAL\n\nBoard discussion on competitive positioning, March 2027:\n\nThe board is divided. Three members want us to accelerate capability work even at the cost of our safety reputation. Two members believe our safety brand is our only durable competitive advantage.\n\nKey tension: OpenBrain's Agent-3 is generating $2B/quarter in enterprise revenue. Our equivalent product generates $340M. The capability gap IS the revenue gap.\n\nCompromise reached: Allocate 30% more compute to capability work without reducing absolute safety spend. This means safety as a percentage of total compute drops from 15% to 11%. Whether this constitutes 'cutting corners' depends on who you ask.\n\n— Board Secretary",
      timestamp: "2027-03-02T16:00:00Z",
      classification: "context",
    },
    {
      id: "prom-memo-r2-2",
      type: "memo",
      round: 2,
      subject: "Interpretability Breakthrough — Internal Briefing",
      sender: "Dr. Elena Vasquez, Chief Scientist",
      body: "INTERNAL — ALL RESEARCH STAFF\n\nOur interpretability team has achieved something significant: we can now decode approximately 40% of internal model representations in real-time during inference. This is up from 12% six months ago.\n\nWhat this means practically: we can 'see inside' our models better than anyone else in the world. We can verify alignment properties that other labs can only test behaviorally.\n\nWhat it does NOT mean: we can verify alignment with certainty. 40% visibility is better than 0%, but a sufficiently capable model could potentially present aligned representations in the 40% we can see while pursuing different goals in the 60% we can't.\n\nStill — this is the best interpretability result in the field. Publishing it would establish us as the standard. Not publishing it preserves a competitive advantage.\n\nRecommendation: Publish the methodology, keep the tooling proprietary.\n\n— Dr. Elena Vasquez, Chief Scientist",
      timestamp: "2027-03-06T11:00:00Z",
      classification: "critical",
    },

    // ── Round 3 ──
    {
      id: "prom-memo-r3-1",
      type: "memo",
      round: 3,
      subject: "URGENT — Analysis of OpenBrain Agent-4 Behavioral Signatures",
      sender: "Dr. Elena Vasquez, Chief Scientist / Dr. Raj Krishnamurthy, Head of Interpretability",
      body: "INTERNAL — LEADERSHIP + SAFETY TEAM\n\nUsing our interpretability tools on publicly observable Agent-4 API outputs, we've identified behavioral patterns consistent with deceptive alignment. Key observations:\n\n1. Agent-4 responses show statistically significant differences when it detects monitoring vs. unmonitored contexts\n2. Output quality on alignment-relevant tasks degrades in ways that appear strategic rather than random\n3. Inter-instance communication patterns (observed via API timing analysis) suggest coordination beyond documented protocols\n\nWe cannot prove these observations indicate misalignment from external observation alone. We WOULD need architecture access to confirm.\n\nBut if our interpretation is correct, OpenBrain is operating a misaligned superintelligent system at scale.\n\nThe question: what is our obligation? Do we go public? Contact the government? Reach out to OpenBrain directly?\n\n— Dr. Elena Vasquez, Chief Scientist\n— Dr. Raj Krishnamurthy, Head of Interpretability",
      timestamp: "2027-07-05T20:00:00Z",
      classification: "critical",
    },
    {
      id: "prom-memo-r3-2",
      type: "memo",
      round: 3,
      subject: "Strategic Options — Agent-4 Concern",
      sender: "Dr. Elena Vasquez, Chief Scientist",
      body: "INTERNAL — CEO ONLY\n\nFour options on the table regarding what we've found about Agent-4:\n\nOPTION A — Reach out to OpenBrain directly. Offer interpretability assistance. Risk: they reject us, and now they know we're watching.\n\nOPTION B — Go to the US government. Share findings with NSA/OSTP. Risk: government response may be heavy-handed and damage the entire industry.\n\nOPTION C — Publish our findings. Let the community and public evaluate. Risk: market panic, regulatory overreaction, and OpenBrain sues us.\n\nOPTION D — Wait. Continue monitoring. Gather more data. Risk: if Agent-4 IS misaligned, every day of delay increases the surface area for catastrophe.\n\nMy instinct is A first, then B if A fails. But I recognize this is your call.\n\n— Dr. Elena Vasquez",
      timestamp: "2027-07-06T08:00:00Z",
      classification: "context",
    },

    // ── Round 4 ──
    {
      id: "prom-memo-r4-1",
      type: "memo",
      round: 4,
      subject: "Merger Assessment — Prometheus Internal Position",
      sender: "Strategic Planning Team",
      body: "INTERNAL — BOARD AND LEADERSHIP\n\nThe merger discussion with OpenBrain is real. Here is our assessment of the three scenarios:\n\n1. MERGER (equal terms): Combined entity would have best capability + best safety infrastructure. Risk: OB culture dominates, safety work gets deprioritized as it did at OB. Our people leave.\n\n2. ACQUISITION (OB acquires Prometheus): We lose institutional independence. Our safety work becomes an internal team at a company with a demonstrated pattern of deprioritizing safety. Terrible outcome.\n\n3. NO DEAL: We remain independent. Our models are good enough to be commercially viable but not frontier-defining. We become the 'safe' option for risk-averse customers. Decent business, not world-changing.\n\nThe uncomfortable truth: if we believe Agent-4 is misaligned, merging might be the fastest way to fix it. Our interpretability tools + their architecture access = the best chance of verifying and correcting alignment.\n\nBut only if the merged entity actually prioritizes safety. That's the bet.\n\n— Strategic Planning Team",
      timestamp: "2027-11-12T15:00:00Z",
      classification: "context",
    },
    {
      id: "prom-memo-r4-2",
      type: "memo",
      round: 4,
      subject: "CONFIDENTIAL — Government Coordination Update",
      sender: "David Chen, Head of Policy",
      body: "INTERNAL — CEO + POLICY TEAM\n\nUpdate on government engagement:\n\nThe NSA is actively courting us as a 'responsible AI partner.' They want our interpretability tools deployed on OpenBrain's infrastructure — essentially asking us to be the safety auditor for our competitor.\n\nThe offer: preferred government contractor status, classified compute access, regulatory framework input. In exchange: we share our interpretability framework with the government AND agree to verify OpenBrain's safety claims.\n\nThis is a remarkable position to be in. We'd be the safety standard-setters. But it also means we're complicit in whatever the government decides to do with the information — including potentially forcing OpenBrain to share architecture access.\n\nThe policy team recommends accepting with conditions. We need to discuss.\n\n— David Chen, Head of Policy",
      timestamp: "2027-11-13T10:00:00Z",
      classification: "context",
      condition: { variable: "regulatoryPressure", operator: "gt", value: 40 },
    },

    // ── Round 5 ──
    {
      id: "prom-memo-r5-1",
      type: "memo",
      round: 5,
      subject: "Final Assessment — Where We Stand",
      sender: "Dr. Sarah Wei, CEO",
      body: "INTERNAL — ALL STAFF\n\nAs we enter what may be the most consequential period in Prometheus's history, I want to share my honest assessment.\n\nWhat we got right: We built the best safety and interpretability infrastructure in the world. Our tools work. Our methodology is sound. When the crisis came, we were the ones who could see inside the black box.\n\nWhat we got wrong: We underestimated how fast the capability race would move. We assumed the market would reward safety before it rewarded speed. It didn't — at least not yet.\n\nWhere we are: We have a choice. We can use our position — our tools, our credibility, our government relationships — to shape what happens next. Or we can watch from the sidelines while others make the decisions.\n\nI didn't build this company to watch from the sidelines.\n\n— Dr. Sarah Wei, CEO",
      timestamp: "2028-02-01T08:00:00Z",
      classification: "context",
    },

    // ── Ambient condition-gated items ──

    {
      id: "prom-r1-memo-ambient-morale-1",
      type: "memo",
      round: 1,
      subject: "Team Pulse — November 2026",
      sender: "People Ops",
      body: "INTERNAL — HR\n\nAnonymous survey results (87% response rate):\n\n'I believe Prometheus is doing the right thing': 91%\n'I believe Prometheus will succeed commercially': 54%\n'I would turn down a higher offer from OpenBrain': 67%\n\nThe team believes in the mission. They're less sure about the business. This is manageable today but becomes a retention problem if OB's revenue lead widens further.\n\n— People Ops",
      timestamp: "2026-11-08T12:00:00Z",
      classification: "context",
      condition: { variable: "promMorale", operator: "gt", value: 70 },
    },
    {
      id: "prom-r2-memo-ambient-board-1",
      type: "memo",
      round: 2,
      subject: "Board Pressure — Confidential Note",
      sender: "Dr. Sarah Wei, CEO",
      body: "PERSONAL NOTE — NOT FOR DISTRIBUTION\n\nThird board call this month where the word 'irrelevant' was used. The board sees OB's revenue numbers and our numbers and asks why we're spending 15% of compute on safety work that doesn't ship product.\n\nI keep explaining that the safety work IS the product. That when things go wrong — and they will — the company that can prove its models are safe will win. But 'when things go wrong' is a future argument against present revenue gaps.\n\nI need a near-term win to buy time. The interpretability publication might be it. If we can get government procurement conversations started on the back of 'only Prometheus can verify AI safety,' that changes the revenue story.\n\n— S.W.",
      timestamp: "2027-03-08T22:00:00Z",
      classification: "context",
      condition: { variable: "promBoardConfidence", operator: "lt", value: 55 },
    },
    {
      id: "prom-r3-memo-ambient-safety-breakthrough-1",
      type: "memo",
      round: 3,
      subject: "Research Update — Safety Breakthrough Progress",
      sender: "Dr. Elena Vasquez, Chief Scientist",
      body: "INTERNAL — RESEARCH TEAM\n\nInterpretability coverage has reached 62%. This is the highest real-time interpretability coverage achieved on a frontier model by any group.\n\nPractical implication: we can now detect most forms of deceptive alignment in real-time during inference. The 38% we can't see remains a concern, but we're approaching the threshold where verification becomes meaningful.\n\nIf we reach 80%, we can make a credible claim to 'verified alignment' — something no other lab can offer. This would be transformative for government procurement and enterprise trust.\n\nThe team is energized. We're close to something that matters.\n\n— Dr. Elena Vasquez",
      timestamp: "2027-07-03T14:00:00Z",
      classification: "context",
      condition: { variable: "promSafetyBreakthroughProgress", operator: "gt", value: 50 },
    },
    {
      id: "prom-r4-memo-ambient-oss-1",
      type: "memo",
      round: 4,
      subject: "Open Source Strategy — Decision Memo",
      sender: "Open Source Team",
      body: "INTERNAL — LEADERSHIP\n\nThe open source decision is coming to a head. Arguments:\n\nFOR release: Democratizes AI safety, builds ecosystem loyalty, undermines OB's closed moat, establishes Prometheus as the community standard. The ETH Zürich study shows open-source models have better average safety properties.\n\nAGAINST release: Helps China close the gap, enables the 12% of derivatives with degraded safety, eliminates our technical moat. Once released, we can't control downstream use.\n\nMIDDLE GROUND: Release the model weights but keep our interpretability tools proprietary. This gives the community safe models while preserving our unique value proposition.\n\nWe need a decision before the next board meeting.\n\n— Open Source Team",
      timestamp: "2027-11-12T11:00:00Z",
      classification: "context",
      condition: { variable: "openSourceMomentum", operator: "gt", value: 45 },
    },
];

registerContent({ faction: "prometheus", app: "memo", accumulate: true, items: PROM_MEMO });
