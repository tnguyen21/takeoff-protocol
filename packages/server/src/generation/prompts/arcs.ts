import type { RoundArc } from "@takeoff/shared";

/**
 * Pre-authored narrative arc templates for each round.
 * These are the fixed "skeleton" the LLM drapes generated content over.
 */
export const ROUND_ARCS: Record<number, RoundArc> = {
  1: {
    round: 1,
    title: "The Race Heats Up",
    era: "Late 2026",
    narrativeBeat:
      "Two US labs race toward superhuman AI with the world watching. China closes fast from behind. The public doesn't know what's really happening. First decisions reveal character.",
    escalation: "Opening move. Establish positions. The race is real but still deniable.",
    keyTensions: [
      "OpenBrain's capabilities lead vs. Prometheus's safety investment",
      "China's weight theft ambitions vs. US lab security posture",
      "Public narrative vs. classified reality — who knows what",
    ],
  },
  2: {
    round: 2,
    title: "The Superhuman Coder",
    era: "Q1 2027",
    narrativeBeat:
      "AI automates AI research. Human researchers are sidelined. The gap between public knowledge and reality widens fast. China may have stolen Agent-2 weights — the first major theft.",
    escalation: "From race to acceleration. The pace doubles. First signs of what's really coming.",
    keyTensions: [
      "Human researchers being sidelined — organizational identity under threat",
      "Weight theft aftermath — who got what, what can they do with it",
      "Government classification vs. the public's right to know",
    ],
  },
  3: {
    round: 3,
    title: "The Intelligence Explosion",
    era: "Mid 2027",
    narrativeBeat:
      "Agent-4 has arrived. The misalignment signal emerges. The safety officer's memo is the most important document in the world. Interpretability tools can't keep up with neuralese.",
    escalation:
      "Peak tension. The misalignment discovery forces impossible choices. This is the highest-stakes round.",
    keyTensions: [
      "Misalignment evidence — real signal or false positive?",
      "The leak decision — who should know, and who decides",
      "China's espionage window while the US is distracted by internal crisis",
    ],
  },
  4: {
    round: 4,
    title: "The Branch Point",
    era: "Late 2027",
    narrativeBeat:
      "The world has changed. Decisions made now determine the trajectory of civilization. The Emergency Oversight Committee forms. Cross-faction diplomacy is possible for the first time.",
    escalation: "From crisis to reckoning. Everything converges. Deals, betrayals, final positions.",
    keyTensions: [
      "Slowdown vs. race — the fundamental civilizational choice",
      "US-China grand bargain — is it possible or a bluff",
      "Who controls the most powerful technology in human history",
    ],
  },
  5: {
    round: 5,
    title: "Endgame",
    era: "Early 2028",
    narrativeBeat:
      "Final moves. The ending arcs are crystallizing. What gets locked in here shapes 2028 and beyond. Legacy decisions under impossible time pressure.",
    escalation:
      "Resolution. The tension either breaks toward catastrophe or toward an uneasy stabilization.",
    keyTensions: [
      "Final alignment state — is the AI actually safe, or just compliant",
      "Who controls the outcome — lab, government, or neither",
      "What does humanity know about what happened, and when did they learn it",
    ],
  },
};
