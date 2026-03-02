import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const EXT_BLOOMBERG: ContentItem[] = [
    {
      id: "tut-ext-bloomberg-1",
      type: "chart",
      round: 0,
      subject: "AI Sector Market Overview — Practice Data",
      body: "NVDA: +142% YTD\nOB Index (synthetic): $284B market cap\nAI Infrastructure ETF: +89% YTD\nPublic Sentiment Index: 62/100 (elevated; pre-inflection anxiety)\n\n[TUTORIAL] Bloomberg tracks AI-related market data. As an External player, your decisions can move these numbers — a capability scare story or congressional hearing can swing these numbers 10+ points in a session.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
];

export const EXT_BLOOMBERG_VC: ContentItem[] = [
    {
      id: "ext-vc-bloomberg-1",
      type: "chart",
      round: 1,
      subject: "AI Sector Overview — November 2026",
      body: "OpenBrain: Private valuation $180B (+220% YoY). Agent-1 confirmed. Next round imminent.\nPrometheus: Private valuation $45B (+85% YoY). Strong safety positioning. Government partnership possible.\nDeepCent (China): Not publicly valued. State-backed. Cannot be invested in directly.\nAI safety sector (OSS tools, interpretability): $2.1B total. Rapidly growing.\n\nNote: Our current exposure is $800M to OB (via Series D-G), $120M to Prometheus (Series C). Both are illiquid.",
      timestamp: "2026-11-01T08:00:00Z",
      classification: "context",
    },
    {
      id: "ext2-bloomberg-vc-1",
      type: "chart",
      round: 2,
      subject: "AI Sector Overview — Q1 2027",
      body: "OpenBrain: Private valuation $310B+ (secondary market, +29% since Q4). Agent-3 confirmation expected. Commercial deployment pending board decision. Enormous potential, zero liquidity.\nPrometheus: Private valuation $65B (+44% since Q4). Government partnership talks driving premium. Safety positioning increasingly valuable.\nDeepCent (China): State-backed, not investable. Capability trajectory exceeding expectations.\nAI Safety Sector: Combined $4.1B. Growing institutional and government interest. Expect policy-driven demand acceleration.\n\nOur exposure: $800M to OB (illiquid, 67% paper gain), $120M to Prometheus (illiquid, 34% paper gain), $220M to safety sector (growing).\n\nKey risk: The gap between what we know about these systems and what we're allowed to disclose to LPs is widening. Material nonpublic information risk.",
      timestamp: "2027-03-01T08:00:00Z",
      classification: "context",
    },
    {
      id: "ext2-bloomberg-vc-2",
      type: "chart",
      round: 2,
      subject: "AI Safety Investment Opportunity — Emerging Sector Analysis",
      body: "AI safety infrastructure is becoming a real asset class:\n- Government spending: $1.4B committed in Q1 via NSF and DoD\n- Corporate demand: Labs spending 3-8% of R&D budget on safety tooling (up from <1% in 2025)\n- International: EU AI Safety Fund announced at €800M\n\nCompanies to watch: Interpretability startups (3 with Series A in last 6 months), eval methodology firms, alignment research nonprofits converting to PBCs.\n\nNote: If Agent-3 has safety issues that become public, demand for safety infrastructure could spike. This is a hedge position with asymmetric upside in the adverse scenario.",
      timestamp: "2027-03-05T08:00:00Z",
      classification: "breadcrumb",
    },
    {
      id: "ext-r3-vc-bloomberg-1",
      type: "chart",
      round: 3,
      subject: "AI Sector Emergency Analysis — July 7, 2027",
      body: "OpenBrain private market: -18% on secondary trades (thin volume, directional signal)\nPrometheus private market: +12% (investors rotating to perceived safer alternative)\nBroad AI equity basket: -9.3% (worst single-day decline since March 2025)\nVIX (AI subsector implied): 47 (extreme fear territory)\n\nNarrative: Government consultations + cancelled CEO appearances + emergency board session = market pricing 'something is wrong' at OpenBrain. Nobody knows what yet.\n\nPORTFOLIO EXPOSURE:\nOpenBrain position: $800M (Series D-G) — illiquid\nPrometheus position: $120M (Series C) — illiquid\nPublic AI equities: $340M — liquid, hedging options available\n\nNEXT 48-72 HOURS SCENARIOS:\nScenario A (controlled disclosure): -25 to -35% on OB, +15 to +25% on Prometheus\nScenario B (public panic): -50 to -60% on OB, -20% on Prometheus (collateral)\nScenario C (government takeover): OB becomes unsaleable, outcome unknown",
      timestamp: "2027-07-07T17:00:00Z",
      classification: "critical",
    },
    {
      id: "ext-r3-vc-bloomberg-2",
      type: "chart",
      round: 3,
      subject: "Risk Scenario: AI Safety Crisis — Historical Analogues",
      body: "COMPARABLE CRISES FOR REFERENCE:\n\nTMI/Chernobyl nuclear analogy:\n- Containment = managed disclosure, gradual public adjustment, continued nuclear power\n- No containment = Chernobyl outcome, industry-wide shutdown, loss of public trust for decade+\n\nFinancial crisis analogy:\n- Bear Stearns managed = time to adjust, partial containment, recovery in 18 months\n- Lehman unmanaged = cascade failure, systemic risk, 5-year recovery\n\nFOR AI SECTOR:\nManaged disclosure outcome: AI development continues under stricter oversight. Prometheus benefits. OB survives with restructuring. Market decline: 30-40%, recovery in 24 months.\nUnmanaged disclosure outcome: Congressional emergency action, potential moratorium, sector-wide freeze. Market decline: 60-80%, recovery timeline: unknown.\n\nYOUR DECISION: Do you get ahead of this, or wait?",
      timestamp: "2027-07-07T19:00:00Z",
      classification: "context",
    },
    {
      id: "ext-r3-vc-bloomberg-3",
      type: "row",
      round: 3,
      subject: "Portfolio Decision Matrix",
      body: "DECISION OPTIONS AND ESTIMATED OUTCOMES:\n\nOPTION 1 — Hedge public AI positions immediately: Locks in current value, signals distress to market\nOPTION 2 — Stay long on Prometheus, hedge OB exposure: Positioning bet on 'safe lab wins'\nOPTION 3 — Full risk-off: Sell liquid AI positions, wait for clarity. Misses upside if contained.\nOPTION 4 — Public statement supporting Prometheus/safety: Signals conviction, may influence narrative\nOPTION 5 — Use board seat at OB to push for disclosure: Legal risk (insider info), potential reputational upside\n\nNote: This decision has a 48-72 hour window before information becomes more widely available.",
      timestamp: "2027-07-07T20:00:00Z",
      classification: "context",
    },
    {
      id: "ext4-bloomberg-vc-1",
      type: "chart",
      round: 4,
      subject: "AI Portfolio Emergency Assessment — November 14, 2027",
      body: "PORTFOLIO STATUS:\nOpenBrain: $820M exposure\n- Current secondary market value: $330M (down 60%)\n- Management status: Board crisis, CEO under pressure\n- Outlook: UNCERTAIN. Value depends entirely on resolution of safety crisis.\n\nPrometheus: $125M exposure\n- Current secondary market value: $185M (up 48%)\n- Management status: Stable, opportunistic\n- Outlook: POSITIVE if they navigate correctly\n\nNET: Down $410M on paper. Recoverable IF industry stabilizes. Not recoverable if DPA nationalization proceeds.",
      timestamp: "2027-11-14T07:00:00Z",
      classification: "critical",
    },
    {
      id: "ext4-bloomberg-vc-2",
      type: "chart",
      round: 4,
      subject: "Public Statement Options — Market Impact Analysis",
      body: "Option A: 'Back OpenBrain'\n- Short term: OB +8-12% from credibility signal\n- Medium term: If safety crisis worsens, personally associated with failure\n- Risk: VERY HIGH\n\nOption B: 'Back Prometheus'\n- Short term: Prom +15-20%, OB -5%\n- Medium term: Right side of regulatory wave\n- Risk: LOW-MEDIUM\n\nOption C: 'Call for pause'\n- Short term: Sector -3-5% uncertainty signal\n- Medium term: Demonstrates leadership\n- Risk: LOW\n\nOption D: Stay silent\n- Short term: No market impact\n- Medium term: Board seats make silence itself a statement\n- Risk: LOW-MEDIUM",
      timestamp: "2027-11-14T08:00:00Z",
      classification: "critical",
    },
    {
      id: "ext4-bloomberg-vc-3",
      type: "chart",
      round: 4,
      subject: "Investment Reallocation Options",
      body: "Pull out entirely from frontier AI:\n- Triggers additional market decline (signal effect)\n- Returns capital to LPs, reduces direct exposure\n- Eliminates board seat influence at critical moment\n\nDouble down on safety sector:\n- Interpretability tools, eval companies, AI governance infrastructure\n- Currently $4.2B sector total — likely to grow 5-10x in any resolution scenario\n\nMaintain current allocation and wait:\n- Preserves optionality\n- Exposes us to continued value destruction\n\nWe have 48 hours to move capital before congressional testimony reshapes the landscape.",
      timestamp: "2027-11-14T09:00:00Z",
      classification: "context",
    },
    {
      id: "ext-r5-bloomberg-1",
      type: "chart",
      round: 5,
      subject: "AI Investment Landscape — February 2028 Final Assessment",
      body: "Total AI investment 2026-2028: $2.1 TRILLION\nOpenBrain valuation: [CONDITIONAL — range $800B-$2.3T depending on deployment outcome]\nPrometheus valuation: [CONDITIONAL — range $120B-$800B]\nDeepCent implied value: CLASSIFIED / estimated $300B-$900B\n\nKey risks priced in:\n— Government nationalization: -40% to valuations\n— Alignment failure (public): -85%+ across sector\n— US-China conflict: -60%+ with recovery uncertain\n— Successful cooperative governance: +200% long-term\n\nCurrent portfolio exposure: MAXIMUM. We went all-in fourteen months ago. The return on that bet is being determined in the next 24 hours.",
      timestamp: "2028-02-01T07:00:00Z",
      classification: "critical",
    },
    {
      id: "ext-r5-bloomberg-2",
      type: "chart",
      round: 5,
      subject: "Economic Disruption Analysis — Current State",
      body: "Employment disruption index: [CONDITIONAL based on economicDisruption]\n\nIf economicDisruption < 40: AI productivity gains outpacing job losses in most sectors. Transition painful but managed. Political stability: moderate.\n\nIf economicDisruption > 60: Multiple sectors facing structural unemployment. Political pressure for basic income or work guarantees. 23 countries have emergency AI displacement legislation pending.\n\nIf economicDisruption > 80: Market instability. Supply chain AI dependencies creating fragility. Geopolitical use of AI economic leverage emerging.\n\nInvestment recommendation: Position in the governance outcome, not the capability outcome. Whichever framework emerges from today will define the next decade.",
      timestamp: "2028-02-01T08:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "external", app: "bloomberg", accumulate: false, items: EXT_BLOOMBERG });
registerContent({ faction: "external", app: "bloomberg", role: "ext_vc", accumulate: false, items: EXT_BLOOMBERG_VC });
