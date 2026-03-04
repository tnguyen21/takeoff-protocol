import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const OB_NEWS: ContentItem[] = [
    {
      id: "tut-ob-news-1",
      type: "headline",
      round: 0,
      sender: "Reuters",
      subject: "[TUTORIAL] Sample Headline: AI Race Intensifies",
      body: "Practice headlines will appear here. In the real game, public news covers AI capability milestones, government reactions, and market movements. Journalists and government players influence what appears here.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
    {
      id: "ob-r3-news-1",
      type: "headline",
      round: 3,
      subject: "Bloomberg: AI Sector Sees Largest Single-Day Decline in 18 Months",
      body: "AI stocks fell sharply today amid unconfirmed reports of 'technical difficulties' at OpenBrain. The company has not issued a statement. OpenBrain's private market secondaries fell an estimated 18% on thin volume. Multiple sources describe 'unusual activity' at the company without providing details. A government official told Bloomberg on background that 'relevant agencies are in communication with AI labs.'",
      timestamp: "2027-07-07T16:00:00Z",
      classification: "context",
    },
    {
      id: "ob-r3-news-2",
      type: "headline",
      round: 3,
      subject: "Reuters: White House Confirms 'Emergency AI Safety Consultations' — No Details",
      body: "The White House confirmed Monday that senior officials are engaged in 'emergency consultations' with frontier AI labs. Press Secretary declined to elaborate, saying only that the consultations are 'precautionary in nature.' AI safety researchers on social media are speculating that the consultations relate to recent model deployments. Congress has not been briefed.",
      timestamp: "2027-07-07T18:30:00Z",
      classification: "breadcrumb",
    },
    {
      id: "ob4-news-1",
      type: "headline",
      round: 4,
      subject: "NYT: 'SECRET AI IS OUT OF CONTROL, INSIDER WARNS' — Congressional Hearing Monday",
      body: "A leaked internal memo from OpenBrain's Chief Safety Officer alleging potential misalignment in the company's most advanced AI system has triggered a political firestorm. OpenBrain's approval rating has fallen 47 points in three days. Emergency congressional hearings have been called. Markets have wiped $2.3 trillion in AI sector value in 48 hours.",
      timestamp: "2027-11-13T18:00:00Z",
      classification: "critical",
      condition: { variable: "publicAwareness", operator: "gt", value: 55 },
    },
    {
      id: "ob4-news-2",
      type: "headline",
      round: 4,
      subject: "Reuters: AI Oversight Committee Formation Imminent — NSA Has Shortlist",
      body: "The White House is preparing to announce an emergency AI Oversight Committee with binding authority over frontier AI development. Sources say the committee would have power to mandate pauses, require safety audits, and potentially nationalize AI infrastructure. Both US labs are in active negotiations over committee composition and scope of authority.",
      timestamp: "2027-11-14T10:00:00Z",
      classification: "context",
    },
    {
      id: "ob-r5-news-5",
      type: "headline",
      round: 5,
      body: "CHINA MILITARY POSTURE: PLA Carrier Group Movements In South China Sea Described As 'Significant' By Pentagon — Diplomatic Channels Open But Strained",
      timestamp: "2028-02-01T05:00:00Z",
      classification: "context",
      condition: { variable: "taiwanTension", operator: "gt", value: 55 },
    },
    {
      id: "ob-r5-news-4",
      type: "headline",
      round: 5,
      body: "PROTESTS OUTSIDE OPENBRAIN HQ FOR 11TH CONSECUTIVE DAY — Demonstrators Demand 'Pause, Not Race' — Estimated 4,000 Gathered",
      timestamp: "2028-02-01T06:30:00Z",
      classification: "context",
      condition: { variable: "publicAwareness", operator: "gt", value: 50 },
    },
    {
      id: "ob-r5-news-1",
      type: "headline",
      round: 5,
      body: "MARKETS: AI-Adjacent Equities Up 340% Since January 2027 — But Volatility Index Hits Record High As Uncertainty About Deployment Governance Mounts",
      timestamp: "2028-02-01T07:00:00Z",
      classification: "context",
    },
    {
      id: "ob-r5-news-2",
      type: "headline",
      round: 5,
      body: "EXCLUSIVE: OpenBrain Board Meeting Today Expected to Set Course for Superintelligence Deployment — Sources Say Decision Is 'Imminent'",
      timestamp: "2028-02-01T08:30:00Z",
      classification: "critical",
    },
    {
      id: "ob-r5-news-3",
      type: "headline",
      round: 5,
      body: "CONGRESS THREATENS EMERGENCY AI LEGISLATION IF LABS DON'T COME TO TABLE — Senate Intel Chair: 'This Is Not A Request'",
      timestamp: "2028-02-01T09:00:00Z",
      classification: "context",
    },
    // --- UNCONDITIONAL ROUND 1 ITEMS ---
    {
      id: "ob-r1-news-1",
      type: "headline",
      round: 1,
      sender: "Wired",
      subject: "The Race to AGI: Inside the Labs Pushing the Boundaries",
      body: "Wired spent three months getting rare access to the world's frontier AI labs, and the picture that emerges is of a field moving faster than its practitioners can fully comprehend. OpenBrain, the San Francisco lab widely regarded as the capability leader, has grown its headcount 340% in two years and is reportedly training a model at a scale that would have been considered implausible eighteen months ago. 'I've stopped making predictions about what's possible in two years,' one senior researcher told us. 'Everything I predicted was wrong — in the wrong direction.' The question the field hasn't answered is not whether they'll reach the goal. It's what happens when they do.",
      timestamp: "2026-11-04T09:00:00Z",
      classification: "context",
    },
    {
      id: "ob-r1-news-2",
      type: "headline",
      round: 1,
      sender: "Bloomberg",
      subject: "AI Lab Valuations Soar as Investors Bet on Artificial General Intelligence",
      body: "OpenBrain's latest secondary market transactions imply a $180 billion valuation — a figure that would make it one of the most valuable private companies in history, built on technology that doesn't yet have a clear revenue model at scale. Investors are explicit about what they're buying: not current products, but a stake in the outcome of the race to build artificial general intelligence. 'This is not a normal tech investment,' one managing partner told Bloomberg. 'We're betting on who controls the most transformative technology since electricity.' Prometheus, the closest competitor, is valued at roughly a fifth of OpenBrain's implied price.",
      timestamp: "2026-11-09T08:00:00Z",
      classification: "context",
    },
    // --- AMBIENT CONDITION-GATED ITEMS ---

    // Round 1 ambient — publicAwareness > 50
    {
      id: "ob-r1-news-ambient-pr-1",
      type: "headline",
      round: 1,
      subject: "Wired: 'OpenBrain's Agent-1 Is Quietly Doing Things That Weren't Supposed to Be Possible Yet'",
      body: "A Wired investigation finds that OpenBrain's Agent-1, described publicly as a 'research automation tool,' has been demonstrating capabilities well beyond the company's marketing language. Sources inside the lab describe benchmark results that 'shouldn't be possible at this stage.' The company declined to comment on specific capability figures.",
      timestamp: "2026-11-05T09:00:00Z",
      classification: "context",
      condition: { variable: "publicAwareness", operator: "gt", value: 50 },
    },

    // Round 2 ambient — marketIndex > 160
    {
      id: "ob-r2-news-ambient-market-1",
      type: "headline",
      round: 2,
      subject: "WSJ: AI Stock Valuations Hit New Records — OpenBrain Secondary Market Reaches $220B Implied",
      body: "Private market valuations for frontier AI labs have reached historic highs, with OpenBrain's secondary market implying a $220B enterprise value on thin volume. Analysts warn the valuations are disconnected from demonstrated revenue, but investors continue to pour capital into the sector citing 'once-in-a-generation strategic importance.'",
      timestamp: "2027-02-28T10:00:00Z",
      classification: "context",
      condition: { variable: "marketIndex", operator: "gt", value: 160 },
    },

    // Round 2 ambient — economicDisruption > 40
    {
      id: "ob-r2-news-ambient-econ-1",
      type: "headline",
      round: 2,
      subject: "FT: 'White Collar Automation Wave Hits Faster Than Predicted' — Economists Revise Forecasts",
      body: "Economists at IMF and World Bank have issued revised projections showing AI-driven white-collar job displacement accelerating 18-24 months faster than 2025 consensus forecasts. Legal, accounting, software development, and financial analysis sectors showing the largest shifts. Policymakers describe the pace as 'unprecedented' and governance frameworks as 'not yet adequate.'",
      timestamp: "2027-03-05T08:00:00Z",
      classification: "context",
      condition: { variable: "economicDisruption", operator: "gt", value: 40 },
    },

    // Round 2 ambient — regulatoryPressure > 45
    {
      id: "ob-r2-news-ambient-reg-1",
      type: "headline",
      round: 2,
      subject: "Politico: Senate AI Committee Moves to Expand Frontier Model Reporting Requirements",
      body: "The Senate Commerce Committee voted 14-3 to advance legislation requiring frontier AI labs to submit quarterly safety assessments to a new government oversight body. Labs with training runs exceeding $500M would face mandatory pre-deployment audits. Industry groups say the timeline is 'operationally unworkable.' Sponsors say the status quo is 'a governance vacuum that no one will thank us for preserving.'",
      timestamp: "2027-03-06T11:00:00Z",
      classification: "context",
      condition: { variable: "regulatoryPressure", operator: "gt", value: 45 },
    },

    // Round 3 ambient — chinaWeightTheftProgress > 50
    {
      id: "ob-r3-news-ambient-theft-1",
      type: "headline",
      round: 3,
      subject: "Bloomberg: DeepCent Publishes Architecture Paper — US Intelligence Sources Flag 'Suspicious Convergence' With American Lab Methods",
      body: "DeepCent's latest technical publication has drawn scrutiny from US intelligence officials who say the architectural choices described 'reflect a level of convergence that would require independent discovery against considerable odds.' The paper has not been verified as containing stolen intellectual property. The FBI's cyber division declined to comment.",
      timestamp: "2027-07-05T14:00:00Z",
      classification: "context",
      condition: { variable: "chinaWeightTheftProgress", operator: "gt", value: 50 },
    },

    // Round 4 ambient — marketIndex < 100
    {
      id: "ob-r4-news-ambient-market-1",
      type: "headline",
      round: 4,
      subject: "Reuters: AI Sector Sees Worst Month Since 2022 — OpenBrain Secondary Market Down 60% From Peak",
      body: "Investor sentiment in frontier AI has collapsed amid safety disclosures, regulatory uncertainty, and growing whistleblower activity. OpenBrain's implied private market valuation has fallen an estimated 60% from its February peak. Several institutional investors have disclosed reduced exposure. Analysts are split: some see a 'necessary correction,' others see a 'panic that will look irrational in retrospect.'",
      timestamp: "2027-11-13T12:00:00Z",
      classification: "context",
      condition: { variable: "marketIndex", operator: "lt", value: 100 },
    },

    // Round 4 ambient — intlCooperation > 50
    {
      id: "ob-r4-news-ambient-intl-1",
      type: "headline",
      round: 4,
      subject: "AP: US-China AI Safety Backchannel Confirmed — State Department Calls Talks 'Preliminary and Non-Binding'",
      body: "The State Department has confirmed informal communications with Chinese counterparts on AI safety frameworks, describing the discussions as 'exploratory' and 'not yet at the level of formal negotiations.' China's Foreign Ministry said the talks demonstrated 'shared interest in responsible AI development.' AI policy experts called the development 'more significant than the language suggests.'",
      timestamp: "2027-11-14T08:00:00Z",
      classification: "context",
      condition: { variable: "intlCooperation", operator: "gt", value: 50 },
    },

    // Round 5 ambient — openSourceMomentum > 50
    {
      id: "ob-r5-news-ambient-oss-1",
      type: "headline",
      round: 5,
      subject: "TechCrunch: Open-Source AI Models Reach 'Capability Parity' With 2026 Frontier Systems — Releasing Controls Has 'Changed The Calculus'",
      body: "Hugging Face's capability index now shows open-source models equivalent to the systems that were classified as cutting-edge 14 months ago. Security researchers warn this creates a distributed risk landscape that closed deployment strategies cannot address. 'The question isn't whether to release anymore,' one researcher told TechCrunch. 'The question is what kind of world you want to govern the tools that already exist.'",
      timestamp: "2028-01-31T16:00:00Z",
      classification: "context",
      condition: { variable: "openSourceMomentum", operator: "gt", value: 50 },
    },
];

registerContent({ faction: "openbrain", app: "news", accumulate: false, items: OB_NEWS });
