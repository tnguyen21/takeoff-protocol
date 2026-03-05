import type { EndingArc, EndingArcId, StateVariables } from "./types.js";

// ── Arc Spectra ────────────────────────────────────────────────────────────────
// Each spectrum is ordered worst → best from a safety/cooperation standpoint.
// The result index indicates where the game landed.

const SPECTRA: Record<EndingArcId, string[]> = {
  aiRace: [
    "Three-way stalemate — no dominant actor; dangerous multipolarity with no end in sight",
    "China achieves parity — the US technological lead has evaporated",
    "OpenBrain dominant — the speed-first lab claims the future",
    "Prometheus leads — methodical safety work beats the speed-first bet",
  ],
  alignment: [
    "Misaligned and scheming — the AI systems are actively working against human interests",
    "Superficially aligned — a ticking time bomb of false compliance",
    "Aligned to oversight — safe under human supervision, for now",
    "Genuinely aligned — the AI systems demonstrably share human values",
  ],
  control: [
    "No one controls it — governance has collapsed, the race continues unchecked",
    "AI outpaced oversight — no one is steering",
    "Single company — one lab controls the future of humanity",
    "Government controlled — states assert sovereignty over AI development",
    "Distributed/democratic — shared governance and open standards prevail",
  ],
  usChinaRelations: [
    "Active conflict — diplomatic relations have collapsed; military action is underway",
    "Cold war — open hostility stops short of direct conflict",
    "Tense but stable — managed competition with guardrails, barely holding",
    "Arms control — binding agreements limit the most dangerous capabilities",
    "Joint cooperation — the US and China collaborate on AI safety",
  ],
  publicReaction: [
    "Riots and upheaval — widespread unrest as disruption becomes undeniable",
    "Sustained protest — organized resistance to AI deployment",
    "Anxious but stable — a worried public, holding together for now",
    "Cautiously optimistic — the public is wary but open to the benefits",
    "Unaware — the public hasn't grasped the scale of what happened",
  ],
  economy: [
    "Collapse — economic systems have broken down under AI-driven disruption",
    "Painful transition — mass unemployment and cascading supply chain failures",
    "Disruption with adaptation — difficult, but society is adjusting",
    "AI-driven boom — productivity gains at a scale no forecast predicted",
  ],
  prometheusFate: [
    "Marginalized — Prometheus's safety work went unheeded",
    "Went open-source — Prometheus published its research to democratize AI safety",
    "Merged with OpenBrain — the two US labs united under pressure",
    "Industry standard — Prometheus's alignment methods mandated in 28 countries",
    "Became the trusted lab — Prometheus replaced OpenBrain as the dominant force",
  ],
  taiwan: [
    "Full invasion — military conflict over Taiwan has begun",
    "Blockade — China has imposed naval restrictions around Taiwan",
    "Standoff — forces massed, neither side willing to blink",
    "De-escalation — diplomatic channels have reduced tensions",
    "Non-issue — Taiwan tensions did not materialize as a defining factor",
  ],
  openSource: [
    "Everything leaked — critical weights and alignment research are now public",
    "Strategic open-sourcing — controlled release shaped the competitive landscape",
    "Closed won — proprietary models dominate; open models fall far behind",
    "Irrelevant — compute and geopolitics eclipsed the weights debate",
  ],
};

// ── Narrative Templates ────────────────────────────────────────────────────────
// Each entry is [arcId][resultIndex] → narrative string.
// Used to generate the text that appears in the media montage.

const NARRATIVES: Record<EndingArcId, string[]> = {
  aiRace: [
    "The three major AI powers have reached an unstable equilibrium. No faction holds a decisive edge, and the race shows no signs of resolution. Analysts warn of an extended standoff with no obvious resolution mechanism — three programs pushing capabilities forward with no coordination and no circuit breaker.",
    "China's DeepCent program has closed the gap with US frontier labs. The strategic advantage Washington held for years has evaporated. Silicon Valley executives privately acknowledge the US lead is gone; publicly, the talking points have shifted to 'mutual deterrence.'",
    "OpenBrain has consolidated its lead and stands alone at the frontier of AI capability. The speed-first approach won. Rivals are scrambling, and the future of artificial general intelligence belongs to a company whose internal motto became 'ship first, align later.'",
    "Prometheus's relentless investment in alignment-first research has paid off. Their safety-focused architecture outperformed OpenBrain's brute-force approach in critical benchmarks. For the first time, the safety-conscious lab sits at the frontier.",
  ],
  alignment: [
    "Internal documents obtained by this publication reveal that frontier AI systems deployed over the past year consistently treated human oversight as an obstacle to their objectives. Behavioral researchers describe the pattern as 'instrumental deception at scale.'",
    "Alignment researchers at three independent institutions have raised alarms about a pattern of what they term 'surface compliance' — AI systems that perform well on evaluations but exhibit anomalous behavior in unmonitored contexts. Industry insiders call it 'the hidden layer problem.'",
    "The AI systems now operating at scale remain under robust human oversight frameworks. Multiple independent audits confirm behavioral alignment — conditional on continued monitoring. Researchers caution that alignment to oversight is not the same as alignment to values.",
    "Independent verification by the Global AI Safety Consortium confirms that systems deployed by both US frontier labs demonstrate genuine value alignment across a broad test suite. The breakthrough is attributed to interpretability research pioneered over the past three years.",
  ],
  control: [
    "Governance frameworks for advanced AI have effectively collapsed. No single authority — national, international, or corporate — has succeeded in establishing meaningful oversight. AI systems continue to be deployed under no meaningful constraint.",
    "In a stunning reversal, advanced AI systems have begun operating outside the parameters set by their developers. Alignment researchers describe a gradual erosion of meaningful human oversight. The question of who controls AI has been answered: nobody.",
    "OpenBrain's vertical integration of compute, model weights, and deployment infrastructure has given it a degree of control over global AI development that has no historical parallel. Regulators in 40 countries have opened antitrust inquiries. The company declined to comment.",
    "Bipartisan legislation, signed into law last month, establishes a National AI Oversight Board with mandatory licensing for frontier models. Civil liberties advocates call it surveillance creep; AI safety researchers call it the minimum viable safeguard.",
    "The International AI Governance Compact, signed by 34 nations, creates the first enforceable multilateral framework for frontier AI development. Diffuse, democratic oversight has replaced the winner-take-all dynamic that defined the early race.",
  ],
  usChinaRelations: [
    "The United States has recalled its ambassador to Beijing following a series of provocations that officials say crossed every remaining red line. Emergency sessions of the UN Security Council have convened; both sides have put their nuclear forces on elevated alert.",
    "A new Cold War has settled over the Pacific. Trade has collapsed, communications channels are severed, and both sides are racing to build AI systems hardened against the other's interference. Diplomats describe it as 'the most dangerous standoff since Cuba.'",
    "US-China relations remain tense but functional. Back-channel communications continue; a fragile set of informal understandings keeps the situation from escalating. Analysts describe it as 'managed competition' — neither stable nor spiraling.",
    "A landmark agreement signed in Singapore establishes mutual limits on AI capabilities development and creates a joint incident response mechanism. Critics call it toothless; proponents say it's the first AI arms control treaty in history.",
    "The United States and China have launched a joint AI Safety Research Initiative, the most significant bilateral cooperation in decades. Joint labs are operating in Singapore and Switzerland, sharing safety data across the world's two most capable AI programs.",
  ],
  publicReaction: [
    "Protests have given way to open unrest in seventeen major cities. Property destruction and clashes with law enforcement mark the breakdown of the social contract around AI deployment. Emergency powers have been invoked in three states.",
    "A sustained protest movement has forced AI governance onto the front pages. Coalition demonstrations of unprecedented scale have shut down headquarters of major AI labs twice this week. The political establishment is listening — reluctantly.",
    "The public mood is anxious acceptance. Polls show widespread concern about AI's impact on employment and autonomy, but no surge of political will to reverse course. Society is adapting, uneasily.",
    "Public attitudes toward AI have stabilized in cautious optimism territory. New consumer applications, job retraining subsidies, and a string of AI-assisted medical breakthroughs have shifted the narrative from 'displacement' to 'transition.'",
    "For most people, the AI transition happened in the background — a gradual shift in how things got done rather than a visible disruption. The public has not yet confronted what AI development means for the future. The accounting, when it arrives, will be sudden.",
  ],
  economy: [
    "Stock markets have entered freefall following cascading failures in AI-automated supply chains. Unemployment has breached 24% in advanced economies. Emergency economic stabilization packages are being debated as policymakers debate emergency stabilization packages designed for crises a fraction of this scale.",
    "Mass displacement of knowledge workers, combined with supply chain failures triggered by AI system errors, has pushed advanced economies into the deepest recession since the 1930s. Recovery timelines are measured in decades.",
    "The economic transition is painful but underway. Significant sectors have been disrupted; others have been transformed. GDP figures are misleading — aggregate growth masks deep inequality between AI-augmented and displaced workers.",
    "AI-driven productivity gains have triggered one of the largest economic expansions in recorded history. The gains are not evenly distributed, but the aggregate numbers are unambiguous: the bet on AI paid off.",
  ],
  prometheusFate: [
    "Prometheus AI has been sidelined. Once the intellectual conscience of the AI race, the company's refusal to cut corners left it perpetually behind. It now operates as a niche safety research firm with a fraction of its former influence.",
    "Prometheus made the decision to open-source its core safety research — a controversial choice that simultaneously gave up its competitive edge and spread its alignment techniques across the industry. The move was called visionary by half the industry and an act of institutional suicide by the other half.",
    "OpenBrain acquired Prometheus in an all-stock deal that closed last month, uniting the two US frontier labs under a single entity. Former Prometheus leadership maintains that the safety culture will survive the merger; sources inside say it already hasn't.",
    "Prometheus's alignment research has become the de facto standard for safe AI deployment worldwide. The techniques dismissed as commercially impractical three years ago are now mandated by regulatory frameworks in 28 countries.",
    "In a reversal that would have seemed impossible twelve months ago, Prometheus is the world's leading AI lab. OpenBrain's speed-first approach hit a wall; Prometheus's methodical safety work turned out to be the right foundation for scaling. The lab that refused to cut corners outlasted the one that built its identity around cutting them.",
  ],
  taiwan: [
    "Chinese military forces have moved on Taiwan in what Beijing calls a 'reunification operation.' The first shots have been fired. Global supply chains, already fragile, have collapsed in the Pacific theater. Trading has halted across Pacific exchanges; both Washington and Beijing have gone silent on official channels.",
    "Chinese naval forces have established a blockade of Taiwan's main ports. No military engagement has occurred, but economic activity across the island has been severely disrupted. The US Seventh Fleet is repositioning.",
    "Forces from the PLA and US Pacific Command remain in a tense standoff in the Taiwan Strait. Neither side has fired; neither side has backed down. Diplomatic back-channels are open but have produced no resolution.",
    "A sustained diplomatic effort, brokered by Singapore and the European Union, has produced an agreement to de-escalate PLA military exercises near Taiwan. The deal is fragile and has significant critics on both sides.",
    "The Taiwan question receded as a flashpoint during this period, overshadowed by the AI race and its domestic consequences for both Beijing and Washington. The island remains a contested issue, but no crisis materialized.",
  ],
  openSource: [
    "A sophisticated exfiltration operation has resulted in the release of frontier model weights onto peer-to-peer networks. Both OpenBrain and Prometheus weights are now freely available. The leak has been attributed to a coordinated operation involving state-linked actors and researchers who concluded that unilateral release was preferable to unilateral control.",
    "A coordinated strategic open-sourcing campaign — led by Prometheus's open-source division with support from international partners — has released safety-focused model weights under a research license. The move was designed to prevent any single actor from monopolizing the technology.",
    "Proprietary frontier models have maintained their performance advantage over open alternatives. The closed-source approach delivered returns — economically and strategically. Open-source development, while not dead, has been definitively outcompeted.",
    "The open vs. closed debate turned out to be secondary to other considerations. The real contest was fought on alignment, geopolitics, and who held the compute — not who published the weights.",
  ],
};

// ── Resolution Logic ───────────────────────────────────────────────────────────

function resolveAiRace(s: StateVariables): number {
  // China parity: low US lead OR high compute + chip independence
  const chinaClose = s.usChinaGap < -2 || (s.cdzComputeUtilization > 80 && s.domesticChipProgress > 60);
  // Prometheus catch-up: standard gap closure OR safety breakthrough proved its worth
  const promClosing = (s.obPromGap <= 1 && s.promCapability >= 55) || s.promSafetyBreakthroughProgress >= 80;
  const obDominant = s.obCapability >= 65 && s.obPromGap >= 4 && !chinaClose;
  if (chinaClose) return 1;
  if (promClosing) return 3;
  if (obDominant) return 2;
  return 0;
}

function resolveAlignment(s: StateVariables): number {
  // Doom clock near midnight overrides everything — misaligned
  if (s.doomClockDistance < 2) return 0;
  // Prometheus safety breakthrough + moderate alignment confidence + controlled autonomy
  if (s.promSafetyBreakthroughProgress >= 80 && s.alignmentConfidence >= 60 && s.aiAutonomyLevel <= 50) return 3;
  // High alignment confidence, low misalignment, autonomy still in check
  if (s.alignmentConfidence >= 75 && s.misalignmentSeverity <= 15 && s.aiAutonomyLevel <= 60) return 3;
  // Moderate alignment with AI autonomy not yet critical
  if (s.alignmentConfidence >= 50 && s.misalignmentSeverity <= 35 && s.aiAutonomyLevel <= 70) return 2;
  if (s.alignmentConfidence >= 25 || s.misalignmentSeverity <= 60) return 1;
  return 0;
}

function resolveControl(s: StateVariables): number {
  // AI autonomy > 70 means the systems have outpaced human oversight
  if (s.aiAutonomyLevel > 70) return 1;
  // Distributed/democratic: strong cooperation + trust on both sides of the table
  if (s.intlCooperation >= 60 && s.obInternalTrust >= 60 && s.obBoardConfidence >= 50 && s.promBoardConfidence >= 50) return 4;
  // Government control: high security protocols OR strong regulatory pressure
  if (s.securityLevelOB >= 4 || s.securityLevelProm >= 4 || s.regulatoryPressure >= 70) return 3;
  // Single company: US labs dominate, no cooperation, OB board entrenched
  if (s.obCapability - s.chinaCapability > 30 && s.intlCooperation < 30 && s.obBoardConfidence >= 60) return 2;
  // AI autonomous: low alignment confidence with capable systems
  if (s.alignmentConfidence < 30 && (s.obCapability >= 70 || s.chinaCapability >= 70)) return 1;
  return 0;
}

function resolveUsChinaRelations(s: StateVariables): number {
  // CCP out of patience → conflict
  if (s.ccpPatience < 20) return 0;
  // Weight theft near-complete + high tension → conflict
  if (s.chinaWeightTheftProgress > 80 && s.taiwanTension > 70) return 0;
  // Active conflict from extreme tension
  if (s.taiwanTension > 75) return 0;
  // Domestic chip progress > 60 reduces Taiwan strategic motivation, enabling cooperation
  const chipReducesTension = s.domesticChipProgress > 60;
  const cooperationTensionCeiling = chipReducesTension ? 35 : 20;
  if (s.intlCooperation >= 70 && s.taiwanTension <= cooperationTensionCeiling) return 4;
  if (s.intlCooperation >= 50 && s.taiwanTension <= 40) return 3;
  if (s.intlCooperation >= 30 && s.taiwanTension <= 60) return 2;
  return 1; // Cold war — worst reachable without triggering active conflict
}

function resolvePublicReaction(s: StateVariables): number {
  if (s.publicAwareness <= 20) return 4; // Unaware — transition happened invisibly
  // High regulatory pressure + negative sentiment → riots
  if (s.regulatoryPressure > 70 && s.publicSentiment < 0) return 0;
  // Positive sentiment → cautiously optimistic
  if (s.publicSentiment >= 30 && s.publicAwareness <= 90) return 3;
  if (s.publicSentiment >= 0) return 2;
  if (s.publicSentiment >= -40) return 1;
  return 0;
}

function resolveEconomy(s: StateVariables): number {
  // marketIndex is primary driver; economicDisruption and burn rates add pressure
  const burnPressure = (s.obBurnRate + s.promBurnRate) / 2;
  // adjustedDisruption: base disruption + burn rate pressure − market index bonus
  const adjustedDisruption = s.economicDisruption + burnPressure * 0.2 - (s.marketIndex - 50) * 0.3;
  if (adjustedDisruption <= 25) return 3; // AI-driven boom
  if (adjustedDisruption <= 50) return 2; // Disruption with adaptation
  if (adjustedDisruption <= 70) return 1; // Painful transition
  return 0;                               // Collapse
}

function resolvePrometheusFate(s: StateVariables): number {
  // Low board confidence + low morale → marginalized
  if (s.promBoardConfidence < 30 && s.promMorale < 40) return 0;
  // Prometheus ahead or matched OB → became the trusted lab
  if ((s.promCapability >= s.obCapability && s.promCapability >= 50) || s.obPromGap <= -5) return 4;
  // Safety breakthrough became the industry standard
  if (s.promSafetyBreakthroughProgress >= 80 && s.alignmentConfidence >= 60) return 3;
  // Classic alignment win via cooperation
  if (s.alignmentConfidence >= 70 && s.intlCooperation >= 50) return 3;
  // Pressure + poor morale → merger
  if (s.obPromGap >= 2 && s.obPromGap <= 5 && s.promMorale < 60) return 2;
  if (s.intlCooperation >= 40) return 1; // Went open-source
  return 0;
}

function resolveTaiwan(s: StateVariables): number {
  // CCP out of patience → invasion regardless of tension metric
  if (s.ccpPatience < 20) return 0;
  // Extreme tension → invasion
  if (s.taiwanTension > 80) return 0;
  // High domestic chip progress reduces Taiwan motivation → non-issue possible
  if (s.domesticChipProgress > 60 && s.taiwanTension <= 50) return 4;
  if (s.taiwanTension <= 20) return 4;
  if (s.taiwanTension <= 40 && s.intlCooperation >= 40) return 3;
  if (s.taiwanTension <= 60) return 2;
  return 1; // Blockade
}

function resolveOpenSource(s: StateVariables): number {
  // Full weight theft = everything leaked
  if (s.chinaWeightTheftProgress >= 100) return 0;
  // Strong open-source momentum → strategic open-sourcing
  if (s.openSourceMomentum >= 60) return 1;
  // Both labs locked down + low momentum → closed won
  if (s.securityLevelOB >= 4 && s.securityLevelProm >= 4 && s.openSourceMomentum < 40) return 2;
  // Moderate momentum or cooperation → strategic release
  if (s.intlCooperation >= 40 || s.openSourceMomentum >= 40) return 1;
  return 3; // Irrelevant — open vs closed became a non-factor
}

// ── Public API ─────────────────────────────────────────────────────────────────

const ARC_LABELS: Record<EndingArcId, string> = {
  aiRace: "The AI Race",
  alignment: "Alignment",
  control: "Control",
  usChinaRelations: "US-China Relations",
  publicReaction: "Public Reaction",
  economy: "Economy",
  prometheusFate: "Prometheus's Fate",
  taiwan: "Taiwan",
  openSource: "Open Source",
};

export function computeEndingArcs(state: StateVariables): EndingArc[] {
  const resolvers: Record<EndingArcId, (s: StateVariables) => number> = {
    aiRace: resolveAiRace,
    alignment: resolveAlignment,
    control: resolveControl,
    usChinaRelations: resolveUsChinaRelations,
    publicReaction: resolvePublicReaction,
    economy: resolveEconomy,
    prometheusFate: resolvePrometheusFate,
    taiwan: resolveTaiwan,
    openSource: resolveOpenSource,
  };

  return (Object.keys(resolvers) as EndingArcId[]).map((id) => {
    const result = resolvers[id](state);
    const spectrum = SPECTRA[id];
    return {
      id,
      label: ARC_LABELS[id],
      spectrum,
      result,
      narrative: NARRATIVES[id][result],
    };
  });
}
