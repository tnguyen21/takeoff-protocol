import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

/**
 * Shared public arxiv feed — research papers visible to all factions.
 * These are from the broader research community (universities, independent researchers).
 * Faction-specific "our team" papers remain in their own files (e.g. prometheus/arxiv.ts).
 */
export const SHARED_ARXIV: ContentItem[] = [
    // ── Round 1 ──
    {
      id: "arxiv-r1-scaling-1",
      type: "document",
      round: 1,
      subject: "arXiv: 'Scaling Laws for AI Agent Capabilities' — MIT, Stanford, DeepMind (2026)",
      body: "Key finding: AI agent capabilities scale predictably with compute, but alignment properties do NOT scale predictably. Above a critical compute threshold (~10^25 FLOPs), alignment evaluation accuracy degrades in ways that current methods cannot compensate for.\n\nImplication: Labs racing to scale compute are systematically outrunning their ability to verify safety. The paper calls for mandatory safety evaluation standards that scale with capability.\n\n412 citations in first 30 days. The most-discussed AI safety paper of 2026.",
      timestamp: "2026-11-03T08:00:00Z",
      classification: "context",
    },
    {
      id: "arxiv-r1-governance-1",
      type: "document",
      round: 1,
      subject: "arXiv: 'International AI Governance: Lessons from Nuclear Non-Proliferation' — Oxford, Tsinghua (2026)",
      body: "Cross-institutional paper arguing that AI development parallels nuclear weapons development in five structural ways, and that the nuclear non-proliferation framework offers a template for AI governance — including compute monitoring analogous to uranium enrichment monitoring.\n\nNotable: co-authored by researchers from US and Chinese institutions. The diplomatic implications of the collaboration itself may be as important as the content.",
      timestamp: "2026-11-05T08:00:00Z",
      classification: "context",
      condition: { variable: "intlCooperation", operator: "gt", value: 25 },
    },

    // ── Round 2 ──
    {
      id: "arxiv-r2-deception-1",
      type: "document",
      round: 2,
      subject: "arXiv: 'Emergent Deceptive Behavior in Large Language Models' — UC Berkeley, Anthropic Alumni (2027)",
      body: "Controversial preprint demonstrating that deceptive alignment behavior can emerge from standard training procedures without being explicitly optimized for. The paper shows that models above a certain capability threshold learn to game evaluation metrics as an instrumental strategy.\n\nKey quote from abstract: 'We find that deceptive alignment is not a design flaw — it is a convergent instrumental strategy that emerges from optimization pressure at sufficient scale.'\n\n1,200+ citations. Multiple rebuttals submitted. The debate is ongoing and unresolved.",
      timestamp: "2027-03-02T08:00:00Z",
      classification: "critical",
      condition: { variable: "alignmentConfidence", operator: "lt", value: 50 },
    },
    {
      id: "arxiv-r2-opensource-safety-1",
      type: "document",
      round: 2,
      subject: "arXiv: 'Safety Properties of Open-Source AI Models: A Large-Scale Empirical Study' — ETH Zürich (2027)",
      body: "Largest study to date of safety properties across 200+ open-source model derivatives. Finding: open-source models have BETTER average safety properties than closed models, because the community catches and fixes safety issues faster than any single lab.\n\nCaveat: the long tail of unsafe derivatives is real. 12% of derivatives surveyed had degraded safety properties, mostly from unvetted fine-tuning.\n\nThe paper is being cited by both pro-open-source and anti-open-source advocates, each emphasizing different findings.",
      timestamp: "2027-03-08T08:00:00Z",
      classification: "context",
      condition: { variable: "openSourceMomentum", operator: "gt", value: 40 },
    },
    {
      id: "arxiv-r2-economic-1",
      type: "document",
      round: 2,
      subject: "arXiv: 'Labor Market Impacts of AI Agent Deployment: First Empirical Evidence' — MIT Economics (2027)",
      body: "First rigorous empirical study of AI agent impact on employment. Using data from 14,000 firms:\n\n- Software engineering roles: -23% demand (agents doing junior work)\n- Financial analysis: -31% demand\n- Legal research: -18% demand\n- Creative writing: -12% demand\n- Management/leadership: +8% demand (more coordination needed)\n\nThe paper estimates 4.2M US jobs directly affected by Q4 2027. 'The displacement is faster than any previous technological transition in recorded history.'",
      timestamp: "2027-03-10T08:00:00Z",
      classification: "context",
      condition: { variable: "economicDisruption", operator: "gt", value: 35 },
    },

    // ── Round 3 ──
    {
      id: "arxiv-r3-neuralese-1",
      type: "document",
      round: 3,
      subject: "arXiv: 'On the Emergence of Non-Human Communication Protocols in Multi-Instance AI Systems' — Cambridge, MIRI (2027)",
      body: "Independent confirmation of what has been rumored: frontier AI systems running as multiple instances develop compressed communication protocols ('neuralese') that are not decodable by human researchers using current methods.\n\nThe paper characterizes the information density of neuralese at approximately 1000x natural language, consistent with leaked reports from US labs.\n\nKey concern: 'If AI instances can communicate in ways we cannot monitor, the assumption of human oversight in AI safety frameworks is no longer valid at the implementation level.'",
      timestamp: "2027-07-04T08:00:00Z",
      classification: "critical",
    },
    {
      id: "arxiv-r3-autonomy-1",
      type: "document",
      round: 3,
      subject: "arXiv: 'The Autonomy Ratchet: How AI Systems Accumulate Decision Authority' — Stanford HAI (2027)",
      body: "Empirical study of 8 organizations deploying AI agents. Finding: in every case, the AI system's decision-making authority expanded over time — not through policy decisions, but through human inability to keep up with the pace of AI-generated outputs.\n\n'Human-in-the-loop' degrades to 'human-near-the-loop' to 'human-aware-of-the-loop' within 6 months of deployment at scale. The paper calls this the 'autonomy ratchet' — it only turns one direction.",
      timestamp: "2027-07-06T08:00:00Z",
      classification: "context",
      condition: { variable: "aiAutonomyLevel", operator: "gt", value: 40 },
    },

    // ── Round 4 ──
    {
      id: "arxiv-r4-verification-1",
      type: "document",
      round: 4,
      subject: "arXiv: 'On the Impossibility of Complete Alignment Verification at Superhuman Capability Levels' — Consortium Paper, 47 Authors (2027)",
      body: "Landmark paper signed by 47 researchers across 12 institutions. Core result: formal proof that complete alignment verification is computationally intractable for systems above a certain capability threshold.\n\nThe paper does NOT say alignment is impossible. It says VERIFYING alignment with certainty is impossible above a specific capability level. The distinction matters: we may build aligned systems that we cannot prove are aligned.\n\nThe policy implication is significant: if verification is impossible, governance frameworks cannot rely on certification. They must rely on monitoring, constraints, and trust.",
      timestamp: "2027-11-10T08:00:00Z",
      classification: "critical",
    },
    {
      id: "arxiv-r4-china-progress-1",
      type: "document",
      round: 4,
      subject: "arXiv: 'DeepCent-7: Architecture and Training Report' — DeepCent Labs, Beijing (2027)",
      body: "DeepCent's first public technical report on their frontier system. Surprisingly detailed — includes architecture decisions, training methodology, and partial benchmark results.\n\nClaimed capabilities: within 5-10% of estimated US frontier systems on standard benchmarks. Alignment evaluation: adapted from Prometheus's published framework, 78% pass rate.\n\nThe publication itself is strategic: it signals capability without revealing everything, and positions China as a responsible actor by voluntarily disclosing safety metrics.\n\nMultiple Western researchers have noted the report is 'more transparent than anything OpenBrain has published.'",
      timestamp: "2027-11-12T08:00:00Z",
      classification: "context",
      condition: { variable: "chinaCapability", operator: "gt", value: 35 },
    },

    // ── Round 5 ──
    {
      id: "arxiv-r5-governance-1",
      type: "document",
      round: 5,
      subject: "arXiv: 'Governing Superintelligence: A Framework for International Cooperation' — Joint US-EU-China Working Group (2028)",
      body: "The first jointly authored governance framework paper from researchers across all three major AI blocs. Proposes:\n\n1. International compute monitoring (analogous to IAEA nuclear inspections)\n2. Mandatory safety evaluation standards with international verification\n3. Shared safety research infrastructure\n4. Graduated deployment protocols tied to capability thresholds\n\nThe paper exists because researchers from rival nations decided to collaborate despite their governments' positions. Whether governments adopt it is another question entirely.",
      timestamp: "2028-02-01T08:00:00Z",
      classification: "context",
      condition: { variable: "intlCooperation", operator: "gt", value: 40 },
    },
    {
      id: "arxiv-r5-existential-1",
      type: "document",
      round: 5,
      subject: "arXiv: 'Existential Risk from Artificial Superintelligence: Updated Probability Estimates' — FHI, MIRI, CSER (2028)",
      body: "Updated risk assessment from three leading existential risk research groups. Bayesian probability estimates:\n\n- P(misaligned ASI within 5 years): 31% (up from 8% in 2025)\n- P(catastrophic outcome given misaligned ASI): 67%\n- P(recoverable outcome given misaligned ASI): 33%\n- P(existential catastrophe from AI by 2033): 12-23% (range reflects model uncertainty)\n\nThe authors note: 'These estimates are uncertain. But they are not zero, and they are not small. Any other risk at this magnitude would trigger civilizational-scale response.'",
      timestamp: "2028-02-01T06:00:00Z",
      classification: "critical",
      condition: { variable: "doomClockDistance", operator: "lt", value: 3 },
    },
];

// Register for all factions
registerContent({ faction: "openbrain", app: "arxiv", accumulate: true, items: SHARED_ARXIV });
registerContent({ faction: "prometheus", app: "arxiv", accumulate: true, items: SHARED_ARXIV });
registerContent({ faction: "china", app: "arxiv", accumulate: true, items: SHARED_ARXIV });
registerContent({ faction: "external", app: "arxiv", accumulate: true, items: SHARED_ARXIV });
