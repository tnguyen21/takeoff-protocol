import type { Faction } from "@takeoff/shared";

/**
 * Pre-authored Round 1 briefing — hand-tuned for tone-setting consistency.
 *
 * Round 1 sets the stage for the entire game. Generating it introduces
 * too much variance, so we lock it down here. Rounds 2-5 are generated
 * dynamically based on game state.
 */
export const ROUND_1_BRIEFING: {
  common: string;
  factionVariants: Record<Faction, string>;
} = {
  common: `It's November 2026. The AI race is real, and everyone who matters knows it.

OpenBrain has just finished training Agent-1 — a powerful coding and research agent that's giving them a 50% internal R&D speedup. They haven't released it publicly. Their culture is velocity: ship fast, figure out alignment later. Their CEO has been on a media tour talking about "the glorious future."

Prometheus has a model of comparable raw capability, but they've invested heavily in alignment and interpretability instead of pure speed. Their responsible scaling policy means they won't deploy until safety evals pass. Their board is getting restless — OpenBrain is shipping while Prometheus is testing.

China's DeepCent has been quietly building the world's largest centralized compute cluster at the Tianwan nuclear plant. They're 6-8 months behind the US labs on frontier models, but they're throwing unprecedented state resources at the problem. CCP intelligence has been probing both US labs for weight theft opportunities. Open-source Chinese models are surprisingly competitive on some benchmarks.

The US government has begun classifying frontier AI progress. A small circle in the NSC knows how fast things are moving. Export controls are tightening. The public discourse is still mostly about chatbots and job displacement — nobody outside the inner circle grasps what's coming.

Markets are frothy. AI stocks are up 200% year over year. Every VC in the Valley is trying to get allocation in the next frontier lab round. The money thinks this is a boom. The insiders know it might be something else entirely.`,

  factionVariants: {
    openbrain: `You built Agent-1. You know exactly how capable it is — and it's more capable than anyone outside this building realizes. Your CTO wants to start training Agent-2 immediately. Your Safety Officer is requesting a formal review that keeps getting deprioritized. Your government liaison is asking questions you're not ready to answer. The lead over Prometheus is real but narrow. The question is whether you push harder to widen it, or pause long enough to understand what you've built.`,

    prometheus: `You're behind on raw capabilities, and you've made your peace with that — mostly. Your Chief Scientist's interpretability work is genuinely unprecedented: you can see inside the model in ways OpenBrain cannot. But "we're more responsible" doesn't show up on benchmark leaderboards, and your board knows it. OpenBrain is shipping. You're testing. The gap is narrower than they think, but it's growing. This round, you decide whether your safety edge is a moat or just a slower path to the same destination.`,

    china: `Your third compute cluster came online eleven days ago. The Americans think you're 6-8 months behind. You're closer than that. The weight exfiltration probes against both US labs have produced fragments — not the full architecture, but enough to accelerate your timeline if you choose to use them. The question is whether to push that intelligence into active use now, which risks revealing what you have, or build quietly and let your cover hold. The window is not unlimited.`,

    external: `You don't build the models. You don't run the evals. But you control things the labs cannot function without: capital, legitimacy, regulation, and the story the public is told. Right now, that story is a comfortable fiction — and you're among the small group of people who knows it. The classified briefings contain language about capability timelines that hasn't appeared in any public document. The diplomatic back-channels are full of proposals nobody is ready to make official. You are not a bystander. The question is whether you use your leverage — and if so, for whom.`,
  },
};
