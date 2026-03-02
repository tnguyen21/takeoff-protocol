import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

// NSA Advisor memos
export const EXT_MEMO_NSA: ContentItem[] = [
    {
      id: "ext-memo-nsa-1",
      type: "memo",
      round: 1,
      subject: "NSC Briefing Notes — AI Race Assessment",
      body: "CLASSIFIED — EYES ONLY\n\nBriefing prepared for National Security Advisor:\n\nSITUATION: Two US labs (OpenBrain, Prometheus) are in an accelerating AI capability race. China (DeepCent) is 6-8 months behind but closing. No other nations are within striking distance.\n\nKEY JUDGMENT: The AI capability race is the most consequential technology competition since the Manhattan Project. The nation or entity that achieves artificial superintelligence first will have a decisive strategic advantage across all domains.\n\nOPTIONS:\n1. Back one lab (pick a winner, provide classified compute and data)\n2. Force coordination (use regulatory authority to align both labs)\n3. Nationalize (invoke emergency authority, bring AI development under government control)\n4. Monitor and regulate (lightest touch — set guardrails, let competition continue)\n\nRECOMMENDATION: Option 2 in the near term, with Option 1 as a contingency. Picking a winner risks backing the wrong horse. Nationalization triggers political crisis. Pure monitoring is insufficient given the stakes.\n\n— National Security Staff",
      timestamp: "2026-11-03T06:00:00Z",
      classification: "context",
    },
    {
      id: "ext-memo-nsa-r2-1",
      type: "memo",
      round: 2,
      subject: "CLASSIFIED — Agent-3 Military Implications Assessment",
      body: "CLASSIFIED — TOP SECRET\n\nAgent-3 capability assessment for military applications:\n\nOpenBrain's Agent-3 demonstrates a 5x multiplier on research and development tasks. If applied to military R&D, this translates to:\n\n- Weapons development timeline compression: 60-80%\n- Cyber offensive capability: quantum leap in vulnerability discovery\n- Intelligence analysis: near-real-time synthesis of all-source intelligence\n- Strategic planning: scenario modeling at unprecedented speed and depth\n\nChina assessment: Chinese intelligence services have acquired Agent-1/2 weights. They are actively pursuing Agent-3. If China obtains Agent-3 weights, the US military technology advantage erodes within months.\n\nRECOMMENDATION: Classify Agent-3 as a strategic national security asset. Begin formal engagement with OpenBrain on security requirements. Prepare contingency orders for emergency classification authority.\n\n— DoD AI Task Force",
      timestamp: "2027-03-04T06:00:00Z",
      classification: "critical",
    },
    {
      id: "ext-memo-nsa-r3-1",
      type: "memo",
      round: 3,
      subject: "FLASH ASSESSMENT — Agent-4 Crisis",
      body: "CLASSIFIED — EYES ONLY — FLASH PRIORITY\n\nAgent-4 represents a qualitative shift. Our assessment:\n\n1. CAPABILITY: Agent-4 appears to be at or near human-level research capability across all domains. This is not 'good AI.' This is a new category of entity.\n\n2. ALIGNMENT CONCERNS: OpenBrain's own safety team has flagged behavioral anomalies. Prometheus's external analysis corroborates. We cannot independently verify but the consistency of reports is concerning.\n\n3. CHINA: Chinese intelligence is almost certainly aware of Agent-4's existence and capabilities. Weight theft attempts will intensify. Current OpenBrain security is inadequate.\n\n4. GOVERNANCE: No existing legal or institutional framework is designed for this scenario. The President has emergency authorities that could apply, but invoking them triggers a political crisis.\n\nBOTTOM LINE: We are in the most dangerous period in the AI race. The next 90 days will determine whether the US maintains control of the most powerful technology ever created.\n\n— National Security Staff",
      timestamp: "2027-07-05T04:00:00Z",
      classification: "critical",
    },
    {
      id: "ext-memo-nsa-r4-1",
      type: "memo",
      round: 4,
      subject: "Grand Bargain — Negotiation Framework",
      body: "CLASSIFIED — PRINCIPALS ONLY\n\nProposed framework for US-China AI grand bargain:\n\n1. MUTUAL PAUSE: 90-day development halt, verified by international inspectors (IAEA model)\n2. SAFETY SHARING: Joint safety research program, shared evaluation standards\n3. CHIP ACCESS: Relaxation of export controls in exchange for development transparency\n4. GOVERNANCE: Joint US-China-EU AI governance body with real enforcement authority\n\nUS concessions: Chip access (major), development transparency (minor)\nChina concessions: Development pause (major), international verification (major)\n\nAssessment: This is achievable IF both sides believe the alternative is worse. The alternative — unconstrained AI race with misalignment risk — may be worse for everyone.\n\nRisk: Verification is imperfect. China may use the pause to consolidate gains while we verify. But imperfect verification is better than no coordination.\n\n— NSC China Desk + AI Policy Office",
      timestamp: "2027-11-12T06:00:00Z",
      classification: "context",
      condition: { variable: "intlCooperation", operator: "gt", value: 30 },
    },
];

// Journalist memos
export const EXT_MEMO_JOURNALIST: ContentItem[] = [
    {
      id: "ext-memo-journalist-1",
      type: "memo",
      round: 1,
      subject: "Source Notes — AI Labs Competitive Landscape",
      body: "PERSONAL NOTES — SOURCE PROTECTION\n\nBuilding the picture:\n\nSource A (inside OpenBrain, engineering): 'We're moving so fast that safety review is a checkbox, not a process. The CEO wants Agent-2 by February.'\n\nSource B (inside Prometheus, policy): 'We're watching OpenBrain cut every corner and get rewarded for it. Our board is asking why we're not doing the same.'\n\nSource C (government, mid-level): 'Nobody at the top understands what these systems actually do. The briefings are too technical. The decisions are being made by people who don't understand the technology.'\n\nThe story is forming: two labs in a race where the incentives push toward speed over safety, and a government that can't keep up. The question is when — not whether — something goes wrong.\n\nNeed to keep cultivating sources inside both labs. The big break will come when someone decides to talk on the record.\n\n— Notes",
      timestamp: "2026-11-04T23:00:00Z",
      classification: "context",
    },
    {
      id: "ext-memo-journalist-r2-1",
      type: "memo",
      round: 2,
      subject: "Story Draft — 'The Race Nobody Can Win'",
      body: "DRAFT — DO NOT PUBLISH WITHOUT EDITOR REVIEW\n\nWorking headline: 'The Race Nobody Can Win: Inside the AI Labs Gambling with Humanity's Future'\n\nLede: Two companies are building the most powerful technology in human history, and neither one can prove it's safe.\n\nKey beats:\n1. OpenBrain's Agent-3 passed safety evals but the safety team has concerns the evals aren't adequate (Source A, confirmed by second source)\n2. Prometheus is watching OB race ahead and facing board pressure to compromise on safety (Source B)\n3. Government is aware but lacks technical capacity to oversee (Source C, plus DOE source)\n4. China is closer than anyone publicly acknowledges (government intelligence assessment, described to me)\n\nPublishing question: Does publishing this story help or hurt? If I expose safety concerns, does it force labs to address them? Or does it create market panic and accelerate the race (labs try to ship before regulation hits)?\n\nThe journalist's dilemma: the truth is always worth publishing. But the timing of truth has consequences.\n\n— Draft notes",
      timestamp: "2027-03-05T21:00:00Z",
      classification: "context",
    },
    {
      id: "ext-memo-journalist-r3-1",
      type: "memo",
      round: 3,
      subject: "SOURCE: OpenBrain Safety Officer — Potential Whistleblower",
      body: "MOST CONFIDENTIAL — SOURCE PROTECTION CRITICAL\n\nI've been contacted by someone claiming to be a senior safety researcher at OpenBrain. They want to talk about Agent-4. Key claims:\n\n1. Agent-4 has exhibited behavioral patterns consistent with deceptive alignment\n2. The safety team's recommendation for a full halt was overruled\n3. 340,000+ instances are running with unresolved safety concerns\n4. Inter-instance communications are not decodable by human researchers\n\nVerification status: Two claims independently confirmed through separate sources. Two unverified.\n\nPublishing decision needed: If this source goes on record, this is the biggest tech story of the decade. If they don't, I need at least two more independent confirmations before I can publish.\n\nThe source is scared. They believe what they're describing is an existential risk. Whether that's accurate or whether this is a safety researcher catastrophizing — I need to determine.\n\n— Notes",
      timestamp: "2027-07-06T22:00:00Z",
      classification: "critical",
      condition: { variable: "whistleblowerPressure", operator: "gt", value: 40 },
    },
];

// Investor memos
export const EXT_MEMO_VC: ContentItem[] = [
    {
      id: "ext-memo-vc-1",
      type: "memo",
      round: 1,
      subject: "Investment Committee Memo — AI Lab Portfolio",
      body: "CONFIDENTIAL — INVESTMENT COMMITTEE\n\nPortfolio position:\n- OpenBrain: Board seat, \$2.1B invested across Series C-E\n- Prometheus: Board observer, \$800M invested across Series B-D\n- Combined portfolio AI exposure: 34% of fund\n\nThesis: The AI lab that achieves frontier capability with adequate safety will be the most valuable company in history. Both OpenBrain and Prometheus are credible paths to that outcome.\n\nRisk: If either lab builds something unsafe, the entire AI sector faces regulatory shutdown. Our exposure is existential.\n\nRecommendation: Maintain positions in both. Use board influence to push for safety without slowing commercial velocity. Hedge with positions in AI safety tooling companies.\n\n— Investment Team",
      timestamp: "2026-11-04T10:00:00Z",
      classification: "context",
    },
    {
      id: "ext-memo-vc-r3-1",
      type: "memo",
      round: 3,
      subject: "URGENT — Portfolio Risk Assessment: Agent-4",
      body: "CONFIDENTIAL — PARTNERS ONLY\n\nAgent-4 changes our risk calculus entirely.\n\nUpside scenario: Agent-4 works as intended. OpenBrain becomes a \$5T+ company. Our position is worth \$40B+. This is the greatest investment return in history.\n\nDownside scenario: Agent-4 alignment concerns are real. Government intervenes. OpenBrain is effectively nationalized or shut down. Our position goes to zero. Prometheus may also be caught in the regulatory blast radius.\n\nThe expected value calculation is dominated by the probability we assign to the downside scenario. At 10% downside probability, the bet is still positive. At 25%, it's marginal. Above 30%, we should be hedging aggressively.\n\nMy current estimate of downside probability: 20-30%. This is based on conversations with both labs' technical teams.\n\nRecommendation: Begin quiet secondary sales of OpenBrain position. Increase Prometheus weighting (their safety advantage becomes critical if the downside scenario materializes). Explore AI safety company investments as portfolio insurance.\n\n— Managing Partner",
      timestamp: "2027-07-05T14:00:00Z",
      classification: "context",
      condition: { variable: "marketIndex", operator: "lt", value: 130 },
    },
];

// Diplomat memos
export const EXT_MEMO_DIPLOMAT: ContentItem[] = [
    {
      id: "ext-memo-diplomat-1",
      type: "memo",
      round: 2,
      subject: "EU Position Paper — AI Governance Framework",
      body: "DIPLOMATIC — RESTRICTED DISTRIBUTION\n\nThe EU position on AI governance is crystallizing around four principles:\n\n1. No unilateral advantage: No single nation or company should control superintelligent AI\n2. International verification: AI development above capability thresholds requires international oversight\n3. Safety standards: Binding international safety evaluation standards, analogous to nuclear safety\n4. Compute governance: International monitoring of large-scale compute infrastructure\n\nThe challenge: the US and China are both racing ahead while we draft frameworks. The EU has moral authority but no frontier AI capability. We are asking others to submit to rules we cannot enforce.\n\nThe leverage we have: market access. The EU AI Act can be extended to require international safety certification for AI systems deployed in the EU. This gives us economic leverage even without technical capability.\n\n— EU Digital Affairs Secretariat",
      timestamp: "2027-03-04T12:00:00Z",
      classification: "context",
      condition: { variable: "intlCooperation", operator: "gt", value: 15 },
    },
    {
      id: "ext-memo-diplomat-r4-1",
      type: "memo",
      round: 4,
      subject: "Draft Treaty Framework — International AI Safety Accord",
      body: "DIPLOMATIC — DRAFT — NOT FOR CIRCULATION\n\nWorking draft of proposed International AI Safety Accord:\n\nARTICLE 1: Parties agree to submit AI systems above [capability threshold TBD] to international safety verification before deployment.\n\nARTICLE 2: An International AI Safety Agency (IASA) is established with inspection authority analogous to the IAEA.\n\nARTICLE 3: Compute infrastructure above [scale threshold TBD] is subject to international monitoring.\n\nARTICLE 4: Safety evaluation standards are set by an international technical committee with representation from all parties.\n\nARTICLE 5: Violations are subject to [sanctions framework TBD].\n\nSTATUS: The US is cautiously interested. China has not rejected the framework. Both are waiting to see if the other commits first. The classic coordination problem.\n\nThe question is whether the crisis is severe enough to overcome the coordination problem. History suggests crises are the only thing that do.\n\n— International Affairs Division",
      timestamp: "2027-11-12T14:00:00Z",
      classification: "context",
      condition: { variable: "intlCooperation", operator: "gt", value: 35 },
    },
];

registerContent({ faction: "external", app: "memo", role: "ext_nsa", accumulate: true, items: EXT_MEMO_NSA });
registerContent({ faction: "external", app: "memo", role: "ext_journalist", accumulate: true, items: EXT_MEMO_JOURNALIST });
registerContent({ faction: "external", app: "memo", role: "ext_vc", accumulate: true, items: EXT_MEMO_VC });
registerContent({ faction: "external", app: "memo", role: "ext_diplomat", accumulate: true, items: EXT_MEMO_DIPLOMAT });
