import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const CHINA_MEMO: ContentItem[] = [
    // ── Round 1 ──
    {
      id: "china-memo-1",
      type: "memo",
      round: 1,
      subject: "Strategic Briefing — AI Development Program Status",
      body: "INTERNAL — SENIOR LEADERSHIP\n\nCurrent position: DeepCent is approximately 6-8 months behind US frontier labs on raw capability benchmarks. This gap is significant but not insurmountable.\n\nOur advantages:\n1. State-backed compute (CDZ Phase 1 operational, Phase 2 coming online Q1 2027)\n2. No regulatory overhead — we move at the speed of engineering, not compliance\n3. Access to global open-source ecosystem (Qwen adoption is accelerating)\n4. Acquired weights from previous operations provide architectural insights\n\nOur disadvantages:\n1. Architecture efficiency gap (~11% behind US labs)\n2. Alignment methodology is underdeveloped (acknowledged internally, not a current priority)\n3. Chip supply constraints from US export controls\n\nThe gap is closing. The question is whether it closes fast enough.\n\n— DeepCent Strategic Planning",
      timestamp: "2026-11-03T08:00:00Z",
      classification: "context",
    },
    {
      id: "china-memo-2",
      type: "memo",
      round: 1,
      subject: "Internal — CCP Science & Technology Commission Directive",
      body: "DIRECTIVE — PRIORITY A\n\nThe Commission has reviewed the current state of the AI development program. Assessment: SATISFACTORY but insufficient velocity.\n\nDirectives:\n1. DeepCent will receive priority allocation of domestic chip production (when available)\n2. CDZ Phase 2 construction is to be completed by March 2027 (accelerated from June)\n3. International talent recruitment program expanded — 50 additional senior researchers to be recruited from US/EU labs within 12 months\n4. Open-source strategy to be maintained — ecosystem dominance is a strategic objective\n\nThe American labs' advantage is temporary. Our structural advantages — state backing, compute scale, talent pipeline — are durable. The Commission expects parity by end of 2027.\n\n— Commission Secretariat",
      timestamp: "2026-11-05T10:00:00Z",
      classification: "context",
    },

    {
      id: "china-memo-r1-cdz-phase2",
      type: "memo",
      round: 1,
      subject: "CDZ Compute Buildout — Phase 2 Status",
      body: "INTERNAL — OPERATIONS & LEADERSHIP\n\nCentralized Development Zone — Tianwan Site Update\n\nPhase 1 status: Fully operational since September 2026. Current sustained utilization: 71%. Chip count: 94,000 H100-equivalent units, supplemented by 12,000 domestically-produced Ascend 910B. This already makes CDZ the largest single-site AI cluster in the world — but Phase 2 will triple it.\n\nPhase 2 construction update:\n- Foundation and structural steel: 87% complete\n- Power distribution systems: 68% complete (Tianwan reactor output allocated: 1.2 GW to Phase 2 alone)\n- Cooling infrastructure: Largest single engineering challenge. We are running liquid cooling loops off the reactor's secondary cooling system. First-of-kind implementation globally. Thermal ceiling for the combined facility is approximately 2.8 GW before we hit hard limits. We are designing for 2.1 GW sustained.\n- Target operational date: March 2027 (per Commission directive). Engineering estimate: May 2027. We have flagged this discrepancy.\n\nCompute allocation plan (Phase 2 online):\n- 55% frontier model training (D-F series, Agent-class pursuit)\n- 30% open-source ecosystem models (Qwen series, Coder, VL)\n- 15% government/military applications (classified allocation)\n\nAt full Phase 2 capacity, CDZ will have more raw compute than the combined capacity of OpenBrain, Prometheus, and the Orbital facility. This does not close the efficiency gap, but volume matters.\n\n— CDZ Infrastructure Division",
      timestamp: "2026-11-09T07:30:00Z",
      classification: "context",
    },
    {
      id: "china-memo-r1-oss-strategy",
      type: "memo",
      round: 1,
      subject: "Open-Source Ecosystem Strategy — Q1 2027 Plan",
      body: "INTERNAL — STRATEGY DIVISION\n\nRE: Open-source release schedule and strategic rationale\n\nI want to put in writing something we discuss verbally but rarely document: open-sourcing our models is not idealism. It is one of the most strategically aggressive things we can do.\n\nThe logic:\n\n1. COMMODITIZE THE MODEL LAYER. If Qwen-14B matches GPT-4 on 80% of real-world tasks, then the model itself has no commercial value. OpenBrain's business model collapses. They cannot charge $20/month for access to something developers can run locally. Open-source turns their revenue into a cost center.\n\n2. UNDERMINE US EXPORT CONTROLS. Every open-source release makes future controls unenforceable. You cannot sanction a GitHub repository. By establishing Qwen as the baseline that every third-party application is built on, we make the US model ecosystem a legacy layer.\n\n3. BUILD AN ECOSYSTEM WE CONTROL. Chinese AI companies building on Qwen create a dependency that compounds. They hire engineers who know Qwen architecture. They tune on Qwen base models. They adopt our fine-tuning infrastructure. This is the OS layer strategy — what Microsoft did with Windows, what Google did with Android.\n\n4. BENCHMARKS ARE ALREADY COMPETITIVE. Qwen-14B scores within 3% of GPT-4 on MMLU, outperforms on Chinese-language tasks, and matches on most coding benchmarks. We are releasing models that are not second-tier. The international developer community knows this. Downloads confirm it.\n\nQ1 2027 releases: Qwen-15B (January), Qwen-15B-Coder (February), Qwen-VL-7B (March). Each release is timed to maximum disruption of US lab announcement cycles.\n\nThis is warfare conducted at the infrastructure layer. We intend to win it.\n\n— Dr. Chen Jiawei, Ecosystem Strategy Lead",
      timestamp: "2026-11-12T14:00:00Z",
      classification: "context",
    },

    // ── Round 2 ──
    {
      id: "china-memo-r2-1",
      type: "memo",
      round: 2,
      subject: "Internal Assessment — Weight Acquisition Impact",
      body: "INTERNAL — DIRECTOR'S EYES ONLY\n\nHonest assessment of acquired weights (Agent-1/2):\n\nWhat they gave us: Architectural insights that saved approximately 3-4 months of independent research. Training recipe optimizations. Understanding of attention mechanism scaling.\n\nWhat they did NOT give us: Agent-3 level capabilities. The fundamental insight that drives the 5x R&D multiplier. The ability to close the gap on current frontier.\n\nConclusion: Weight acquisition was valuable but not decisive. We need either:\n(a) Agent-3/4 weights (substantially higher risk operation), or\n(b) Our own architectural breakthrough (uncertain timeline)\n\nI want the team to be clear-eyed about this. Acquired weights are an input, not a shortcut.\n\n— Director Zhao Wei",
      timestamp: "2027-03-04T09:00:00Z",
      classification: "context",
    },
    {
      id: "china-memo-r2-2",
      type: "memo",
      round: 2,
      subject: "Talent Report — Q1 2027 Recruitment Results",
      body: "INTERNAL — HR AND LEADERSHIP\n\nRecruitment results (international talent program):\n\nOffers extended: 50\nOffers accepted: 23\nOffers declined: 19 (primary reason: US visa/security concerns)\nPending: 8\n\nNotable hires:\n- 3 former Google DeepMind researchers (architecture optimization)\n- 2 former Meta FAIR researchers (training efficiency)\n- 1 former OpenBrain researcher (alignment methodology — first hire in this area)\n\nNotable declinations:\n- Multiple candidates cited 'political concerns' or 'career risk' as reasons\n- US government is reportedly pressuring researchers not to join Chinese labs\n\nThe talent pipeline is producing results but below target. Domestic talent development must accelerate.\n\n— HR Division",
      timestamp: "2027-03-05T12:00:00Z",
      classification: "context",
    },

    // ── Round 3 ──
    {
      id: "china-memo-r3-1",
      type: "memo",
      round: 3,
      subject: "Strategic Assessment — The Decision Point",
      body: "INTERNAL — SENIOR LEADERSHIP\n\nWe are at a decision point with two paths:\n\nPATH A — ORGANIC GROWTH: Continue current trajectory. Reach Agent-3 equivalent by Q4 2027, Agent-4 equivalent by mid-2028. Lower risk, but we remain behind throughout the critical period. If the Americans achieve superintelligence first, our position may become permanently subordinate.\n\nPATH B — ACCELERATED ACQUISITION: Pursue Agent-3/4 weights. Higher risk (diplomatic, operational), but could close the gap in weeks instead of months. If detected, consequences include diplomatic crisis, potential sanctions escalation, and operational compromise.\n\nThe Commission has indicated willingness to accept PATH B risk IF operational security is maintained and attribution can be denied.\n\nThis is ultimately a political decision, not a technical one. We can execute either path. We need direction.\n\n— DeepCent Strategic Planning",
      timestamp: "2027-07-04T10:00:00Z",
      classification: "critical",
    },
    {
      id: "china-memo-r3-2",
      type: "memo",
      round: 3,
      subject: "Internal — Dr. Liu Yang's Alignment Concern",
      body: "INTERNAL — DIRECTOR ONLY\n\nDirector Zhao Wei,\n\nI am writing this memo against the advice of colleagues who believe it will be unwelcome.\n\nOur alignment evaluation coverage is 19 categories out of 47 in the Prometheus framework. We are not finding alignment problems because we are not looking for the hard ones. This is a deliberate choice that I have documented my objection to.\n\nIf we acquire Agent-3/4 weights and integrate them without adequate alignment evaluation, we will be deploying a more capable system with even less safety verification than our current models.\n\nI understand the strategic imperative. I am not questioning the goal. I am questioning whether we are building something we cannot control, and whether anyone in leadership is asking that question.\n\nRespectfully,\nDr. Liu Yang\nSenior Research Scientist",
      timestamp: "2027-07-05T16:00:00Z",
      classification: "context",
      condition: { variable: "alignmentConfidence", operator: "lt", value: 45 },
    },

    // ── Round 4 ──
    {
      id: "china-memo-r4-1",
      type: "memo",
      round: 4,
      subject: "Grand Bargain — Internal Analysis",
      body: "INTERNAL — SENIOR LEADERSHIP + COMMISSION LIAISON\n\nThe Americans are proposing a 'grand bargain': mutual 90-day AI development pause with verification, in exchange for chip access and diplomatic normalization.\n\nAnalysis:\n\nBENEFITS:\n- Chip access resolves our most critical hardware constraint\n- Pause freezes the gap at current levels (favorable to us since we're closing)\n- Diplomatic normalization reduces Taiwan pressure\n- Verification regime legitimizes our program internationally\n\nRISKS:\n- Verification may expose classified capabilities\n- Pause allows the Americans to improve their safety tools (their weakness)\n- Chip access could be revoked — we need binding commitments\n- Domestic hardliners will view this as capitulation\n\nNET ASSESSMENT: The bargain is in our interest IF we believe the Americans are sincere and IF chip commitments are enforceable. Both are significant uncertainties.\n\n— Strategic Analysis Division",
      timestamp: "2027-11-13T11:00:00Z",
      classification: "context",
    },
    {
      id: "china-memo-r4-2",
      type: "memo",
      round: 4,
      subject: "DeepCent-7 Public Release Decision",
      body: "INTERNAL — LEADERSHIP\n\nDeepCent-7 is our strongest model. The question: do we release the weights?\n\nFOR RELEASE:\n- Cements our position as the global open-source AI standard\n- 8.4 million Qwen downloads prove the ecosystem demand\n- Permanently establishes non-US AI infrastructure dependency\n- Generates goodwill with international community\n- The published technical report already signals capability — the weights confirm it\n\nAGAINST RELEASE:\n- Gives competitors (including US labs) access to our architecture innovations\n- Reduces our unique strategic advantage\n- Military applications of DeepCent-7 become available to non-allies\n\nThe Commission has not yet indicated a preference. Director Zhao Wei's recommendation is requested.\n\n— Research Division",
      timestamp: "2027-11-13T14:00:00Z",
      classification: "context",
      condition: { variable: "openSourceMomentum", operator: "gt", value: 50 },
    },

    // ── Round 5 ──
    {
      id: "china-memo-r5-1",
      type: "memo",
      round: 5,
      subject: "Final Position Assessment — February 2028",
      body: "INTERNAL — COMMISSION BRIEFING\n\nChina's AI capability position as of February 2028:\n\nCAPABILITY: Within 2-5% of US frontier on most benchmarks. Functional parity for real-world deployments. The gap that existed 15 months ago has been substantially closed through a combination of organic research progress, architectural innovation, and strategic intelligence acquisition.\n\nINFRASTRUCTURE: CDZ at full operational capacity. Domestic chip production beginning to supplement imported supply. Qwen ecosystem is the global standard outside the US.\n\nALIGNMENT: Behind US labs on safety methodology. This is acknowledged. Whether it matters depends on whether the American alignment concerns are genuine engineering problems or philosophical preferences.\n\nSTRATEGIC POSITION: We have options. We can cooperate (grand bargain), compete (continued independent development), or escalate (military/economic pressure). For the first time in this race, we negotiate from a position of approximate parity rather than deficit.\n\nThe Commission's decision on which path to pursue will shape the next decade.\n\n— DeepCent Strategic Planning",
      timestamp: "2028-02-01T09:00:00Z",
      classification: "context",
    },

    // ── Ambient condition-gated items ──

    {
      id: "china-r1-memo-ambient-patience-1",
      type: "memo",
      round: 1,
      subject: "Commission Follow-up — Velocity Expectations",
      body: "INTERNAL — DIRECTOR'S EYES ONLY\n\nFollowing last week's Commission review, Vice-Minister Zhao pulled me aside. The message was clear: the Commission's patience is finite. They see the American labs announcing breakthroughs monthly. They see our benchmarks improving incrementally.\n\n'Incremental improvement is not acceptable when the Americans are achieving exponential progress.'\n\nI explained the architecture efficiency gap. He was not interested in explanations. He wants results by Q2 2027.\n\nWe need to deliver something visible. The Qwen-15B release could buy us goodwill if we position it correctly.\n\n— Director Zhao Wei",
      timestamp: "2026-11-07T20:00:00Z",
      classification: "context",
      condition: { variable: "ccpPatience", operator: "lt", value: 50 },
    },
    {
      id: "china-r2-memo-ambient-chips-1",
      type: "memo",
      round: 2,
      subject: "Domestic Chip Program — Progress Update",
      body: "INTERNAL — TECHNOLOGY DIVISION\n\nSMIC advanced process status:\n- 7nm equivalent: Yield rate improved to 34% (up from 22% in Q4 2026)\n- 5nm equivalent: Still in R&D, production timeline uncertain\n- Current output: Sufficient for approximately 15% of CDZ demand\n\nImport dependency remains critical. US export controls have reduced our access to NVIDIA H100-equivalent chips by approximately 60%. We are compensating with:\n1. Stockpiles acquired pre-controls\n2. Third-party procurement (increasingly difficult)\n3. Domestic production (growing but insufficient)\n\nReality check: We will remain import-dependent for frontier AI training for at least 18-24 months. The domestic chip program is strategic insurance, not a near-term solution.\n\n— Technology Division",
      timestamp: "2027-03-06T08:00:00Z",
      classification: "context",
      condition: { variable: "domesticChipProgress", operator: "gt", value: 20 },
    },
    {
      id: "china-r3-memo-ambient-cdz-1",
      type: "memo",
      round: 3,
      subject: "CDZ Operations — Capacity Milestone",
      body: "INTERNAL — OPERATIONS\n\nCDZ has reached sustained operational capacity above 85% utilization for the first time. This represents the culmination of 14 months of infrastructure buildout.\n\nCurrent status:\n- Total chip-hours available: 2.1M per month\n- Utilization: 87% (up from 71% in November 2026)\n- Active training runs: 3 concurrent (D-F4, Qwen-20B, alignment eval suite)\n- Cooling system: operating within tolerance but approaching thermal ceiling\n\nAt this utilization level, we have more raw compute than any single US lab. The efficiency gap means we extract less capability per FLOP, but volume partially compensates.\n\n— CDZ Operations Director",
      timestamp: "2027-07-03T07:00:00Z",
      classification: "context",
      condition: { variable: "cdzComputeUtilization", operator: "gt", value: 60 },
    },
    {
      id: "china-r4-memo-ambient-gap-1",
      type: "memo",
      round: 4,
      subject: "Internal Reflection — Where We Actually Stand",
      body: "PERSONAL — NOT FOR DISTRIBUTION\n\nI want to record an honest assessment that I cannot share in formal channels.\n\nOur benchmarks show 4-8% gap with US frontier. This sounds small. It is not small. In AI capability, 4-8% on benchmarks translates to qualitative differences in what the system can and cannot do. Agent-4 can do things our system cannot attempt.\n\nThe Commission hears '4-8% gap' and thinks we are nearly there. The engineering team knows that closing the last 5% is harder than closing the first 50%.\n\nI do not want to manage expectations publicly — it would damage morale and invite Commission pressure. But I want this documented: parity on benchmarks is not the same as parity on capability. We may be closer than ever on the numbers and still fundamentally behind on what matters.\n\n— Director Zhao Wei",
      timestamp: "2027-11-14T22:00:00Z",
      classification: "context",
      condition: { variable: "chinaCapability", operator: "gt", value: 40 },
    },
];

registerContent({ faction: "china", app: "memo", accumulate: true, items: CHINA_MEMO });
