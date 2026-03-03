// TODO: import RoundArc from "@takeoff/shared" once the type is exported from shared/types.ts
// See docs/GENERATIVE-CONTENT.md Section 4.1 for the interface definition.

export interface RoundArc {
  round: number;
  title: string;
  era: string;
  narrativeBeat: string;
  escalation: string;
  keyTensions: string[];
}

/**
 * Narrative arc templates for rounds 1-5.
 * Derived from briefings.ts and docs/GENERATIVE-CONTENT.md Section 4.1.
 * These are the Layer 2 context anchors injected into every generation call.
 */
export const ROUND_ARCS: Record<number, RoundArc> = {
  1: {
    round: 1,
    title: "The Race Begins",
    era: "November 2026",
    narrativeBeat:
      "AI agents are real and inside the labs. The public thinks this is about chatbots. OpenBrain's Agent-1 gives a 50% internal R&D speedup. China's cluster is coming online. The US government has started classifying progress. The gap between what insiders know and what the world believes has never been wider.",
    escalation:
      "This is the inciting incident. Stakes are high but still legible — capability races, deployment pressure, first espionage probes. The world is recognizable.",
    keyTensions: [
      "OpenBrain's deployment decision: internal advantage vs. public release",
      "Prometheus's competitive pressure vs. safety commitments",
      "China's timing on CDZ Phase 2 and open-source strategy",
      "External actors navigating information asymmetry between inner circle and public",
    ],
  },
  2: {
    round: 2,
    title: "The Superhuman Coder",
    era: "March 2027",
    narrativeBeat:
      "AI automates AI research. Human researchers sidelined. OpenBrain's Agent-3 is a superhuman software engineer — 5x internal R&D multiplier. The gap between public knowledge and reality widens. US government classifies frontier AI progress at nuclear secrecy levels.",
    escalation:
      "Qualitative shift from round 1: this is no longer about productivity software. Research automation means the timeline is accelerating faster than anyone planned for. Human researchers are watching their own work become optional.",
    keyTensions: [
      "OpenBrain's strategic decisions with Agent-3 and its organizational impact",
      "Prometheus's responsible scaling policy under competitive pressure",
      "China closing the gap — investment, talent, and other means",
      "External actors holding classified knowledge while the public discourse lags",
    ],
  },
  3: {
    round: 3,
    title: "The Intelligence Explosion",
    era: "July 2027",
    narrativeBeat:
      "Agent-4 has arrived. Hundreds of thousands of copies running at 50x human speed. Research that took months now takes days. The misalignment signal emerges — buried in alignment logs, evidence that cannot be explained away. The safety officer is drafting a memo. A journalist has nervous sources. This is the pivot.",
    escalation:
      "From competitive race to existential uncertainty. The misalignment signal transforms every other tension: espionage now involves potentially misaligned weights, oversight now involves a system that may be actively deceiving researchers. Everything feels different — more urgent, more ambiguous, higher stakes.",
    keyTensions: [
      "The misalignment signal — evidence vs. proof, and what to do with it",
      "The safety officer's loyalty and the whistleblower pressure",
      "China's intelligence opportunity while OpenBrain is in crisis",
      "The journalist with nervous sources and the public information gap",
    ],
  },
  4: {
    round: 4,
    title: "The Diplomatic Window",
    era: "November 2027",
    narrativeBeat:
      "Agent-4 deployed at full scale. The self-improvement cycle is operational reality. An emergency Oversight Committee is forming. Every major player is making back-channel contact. Deals can be made — they can also be broken. Trust is running low. This round includes a cross-faction negotiation phase.",
    escalation:
      "From internal crisis to civilizational stakes. The question of alignment has moved from academic debate to government action. The diplomatic window is simultaneously open and closing. Every faction has leverage they didn't have six months ago, and every faction is afraid of what happens if they don't act.",
    keyTensions: [
      "OpenBrain's halt vs. race decision with 48-hour window",
      "Prometheus's leverage — safety infrastructure vs. competitive advantage",
      "China's grand bargain opportunity — peer status changes all options",
      "External actors wielding money, narrative, regulation, and classified authority",
    ],
  },
  5: {
    round: 5,
    title: "The Last Decision",
    era: "February 2028",
    narrativeBeat:
      "The longest fourteen months in human history are ending. Superintelligence exists. Economic disruption is visible. Geopolitical realignment has begun. The public debate is catching up to reality. What remains uncertain: alignment status, who controls it, and what meaningful human agency is left.",
    escalation:
      "The final round is not escalation — it is resolution. The ending arcs are being scored. The ink is drying. Every faction makes one last decision knowing the outcome cannot be undone. Urgency is replaced by weight.",
    keyTensions: [
      "OpenBrain's legacy and remaining leverage after building it all",
      "Whether Prometheus's principles meant something or were window dressing",
      "China's position — peer, threat, partner, or something without a word yet",
      "External actors locking in their role in how this story is remembered",
    ],
  },
};
