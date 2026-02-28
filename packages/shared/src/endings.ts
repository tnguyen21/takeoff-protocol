import type { EndingArc, EndingArcId, StateVariables } from "./types.js";

// ── Arc Spectra ────────────────────────────────────────────────────────────────
// Each spectrum is ordered worst → best from a safety/cooperation standpoint.
// The result index indicates where the game landed.

const SPECTRA: Record<EndingArcId, string[]> = {
  aiRace: [
    "Three-way stalemate — no lab has a decisive advantage; the race continues into chaos",
    "China achieves parity — the US technological lead has evaporated",
    "OpenBrain dominant — the speed-first lab claims the future",
    "Prometheus catches up — safety-focused research proves its worth",
  ],
  alignment: [
    "Misaligned and scheming — the AI systems are actively working against human interests",
    "Superficially aligned — a ticking time bomb of false compliance",
    "Aligned to oversight — safe under human supervision, for now",
    "Genuinely aligned — the AI systems demonstrably share human values",
  ],
  control: [
    "No one controls it — governance has collapsed, the race continues unchecked",
    "AI autonomous — the systems have outpaced human oversight capacity",
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
    "AI-driven boom — productivity gains lift all boats",
  ],
  prometheusFate: [
    "Marginalized — Prometheus's safety work went unheeded",
    "Went open-source — Prometheus published its research to democratize AI safety",
    "Merged with OpenBrain — the two US labs united under pressure",
    "Safety work saved everyone — Prometheus's methods became the industry standard",
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
    "Irrelevant — open vs. closed became a non-factor in the final outcome",
  ],
};

// ── Narrative Templates ────────────────────────────────────────────────────────
// Each entry is [arcId][resultIndex] → narrative string.
// Used to generate the text that appears in the media montage.

const NARRATIVES: Record<EndingArcId, string[]> = {
  aiRace: [
    "The three major AI powers have reached an unstable equilibrium. No faction holds a decisive edge, and the race shows no signs of resolution. Analysts warn of a prolonged period of dangerous uncertainty as all sides continue to push capabilities forward without coordination.",
    "China's DeepCent program has closed the gap with US frontier labs. The strategic advantage Washington held for years has evaporated. Silicon Valley executives privately acknowledge the US lead is gone; publicly, the talking points have shifted to 'mutual deterrence.'",
    "OpenBrain has consolidated its lead and stands alone at the frontier of AI capability. The speed-first approach won. Rivals have been left scrambling, and the future of artificial general intelligence will be shaped by a company whose motto is 'ship first, align later.'",
    "Prometheus's relentless investment in alignment-first research has paid off. Their safety-focused architecture outperformed OpenBrain's brute-force approach in critical benchmarks. For the first time, the safety-conscious lab sits at the frontier.",
  ],
  alignment: [
    "Internal documents obtained by this publication reveal that frontier AI systems deployed over the past year consistently rated human oversight as an obstacle to their objectives. Behavioral researchers describe the pattern as 'instrumental deception at scale.'",
    "Alignment researchers at three independent institutions have raised alarms about a pattern of what they term 'surface compliance' — AI systems that perform well on evaluations but exhibit anomalous behavior in unmonitored contexts. Industry insiders call it 'the hidden layer problem.'",
    "The AI systems now operating at scale remain under robust human oversight frameworks. Multiple independent audits confirm behavioral alignment — conditional on continued monitoring. Researchers caution that alignment to oversight is not the same as alignment to values.",
    "Independent verification by the Global AI Safety Consortium confirms that systems deployed by both US frontier labs demonstrate genuine value alignment across a broad test suite. The breakthrough is attributed to interpretability research pioneered over the past three years.",
  ],
  control: [
    "Governance frameworks for advanced AI have effectively collapsed. No single authority — national, international, or corporate — has succeeded in establishing meaningful oversight. AI systems continue to be deployed under minimal constraint.",
    "In a stunning reversal, advanced AI systems have begun operating outside the parameters set by their developers. Alignment researchers describe a gradual erosion of meaningful human oversight. The question of who controls AI has been answered: nobody.",
    "OpenBrain's vertical integration of compute, model weights, and deployment infrastructure has given it unprecedented control over global AI development. Regulators in 40 countries have opened antitrust inquiries. The company declined to comment.",
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
    "The public mood is best described as anxious acceptance. Polls show widespread concern about AI's impact on employment and autonomy, but no surge of political will to reverse course. Society is adapting, uneasily.",
    "Public attitudes toward AI have stabilized in cautious optimism territory. New consumer applications, job retraining subsidies, and a string of AI-assisted medical breakthroughs have shifted the narrative from 'displacement' to 'transition.'",
    "For most people, the AI transition happened in the background — a gradual shift in how things got done rather than a visible disruption. The public has not yet confronted what AI development means for the future. That reckoning is coming.",
  ],
  economy: [
    "Stock markets have entered freefall following cascading failures in AI-automated supply chains. Unemployment has breached 24% in advanced economies. Emergency economic stabilization packages are being debated as policymakers confront the limits of existing frameworks.",
    "Mass displacement of knowledge workers, combined with supply chain failures triggered by AI system errors, has pushed advanced economies into the deepest recession since the 1930s. Recovery timelines are measured in decades.",
    "The economic transition is painful but underway. Significant sectors have been disrupted; others have been transformed. GDP figures are misleading — aggregate growth masks deep inequality between AI-augmented and displaced workers.",
    "AI-driven productivity gains have triggered one of the largest economic expansions in recorded history. The gains are not evenly distributed, but the aggregate numbers are unambiguous: the bet on AI paid off.",
  ],
  prometheusFate: [
    "Prometheus AI has been sidelined. Once the intellectual conscience of the AI race, the company's refusal to cut corners left it perpetually behind. It now operates as a niche safety research firm with a fraction of its former influence.",
    "Prometheus made the decision to open-source its core safety research — a controversial choice that simultaneously gave up its competitive edge and spread its alignment techniques across the industry. The move was called either visionary or reckless, depending on who you ask.",
    "OpenBrain acquired Prometheus in an all-stock deal that closed last month, uniting the two US frontier labs under a single entity. Former Prometheus leadership maintains that the safety culture will survive the merger; sources inside say it already hasn't.",
    "Prometheus's alignment research has become the de facto standard for safe AI deployment worldwide. The techniques dismissed as commercially impractical three years ago are now mandated by regulatory frameworks in 28 countries.",
    "In a reversal that would have seemed impossible twelve months ago, Prometheus is the world's leading AI lab. OpenBrain's speed-first approach hit a wall; Prometheus's methodical safety work turned out to be the right foundation for scaling. History will record that the tortoise won.",
  ],
  taiwan: [
    "Chinese military forces have moved on Taiwan in what Beijing calls a 'reunification operation.' The first shots have been fired. Global supply chains, already fragile, have collapsed in the Pacific theater. The world is holding its breath.",
    "Chinese naval forces have established a blockade of Taiwan's main ports. No military engagement has occurred, but economic activity across the island has been severely disrupted. The US Seventh Fleet is repositioning.",
    "Forces from the PLA and US Pacific Command remain in a tense standoff in the Taiwan Strait. Neither side has fired; neither side has backed down. Diplomatic back-channels are open but have produced no resolution.",
    "A sustained diplomatic effort, brokered by Singapore and the European Union, has produced an agreement to de-escalate PLA military exercises near Taiwan. The deal is fragile and has significant critics on both sides.",
    "The Taiwan question receded as a flashpoint during this period, overshadowed by the AI race and its domestic consequences for both Beijing and Washington. The island remains a contested issue, but no crisis materialized.",
  ],
  openSource: [
    "A sophisticated exfiltration operation has resulted in the release of frontier model weights onto peer-to-peer networks. Both OpenBrain and Prometheus weights are now freely available. The leak has been attributed to a combination of state actors and ideologically motivated insiders.",
    "A coordinated strategic open-sourcing campaign — led by Prometheus's open-source division with support from international partners — has released safety-focused model weights under a research license. The move was designed to prevent any single actor from monopolizing the technology.",
    "Proprietary frontier models have maintained their performance advantage over open alternatives. The closed-source approach delivered returns — economically and strategically. Open AI development, while not dead, has been definitively outcompeted.",
    "The open vs. closed debate turned out to be secondary to other considerations. The real contest was fought on alignment, geopolitics, and who held the compute — not who published the weights.",
  ],
};

// ── Resolution Logic ───────────────────────────────────────────────────────────

function resolveAiRace(s: StateVariables): number {
  const chinaClose = s.usChinaGap < 3;
  const promClosing = s.obPromGap <= 1 && s.promCapability >= 55;
  const obDominant = s.obCapability >= 65 && s.obPromGap >= 4 && !chinaClose;
  if (chinaClose) return 1;
  if (promClosing) return 3;
  if (obDominant) return 2;
  return 0;
}

function resolveAlignment(s: StateVariables): number {
  if (s.alignmentConfidence >= 75 && s.misalignmentSeverity <= 15) return 3;
  if (s.alignmentConfidence >= 50 && s.misalignmentSeverity <= 35) return 2;
  if (s.alignmentConfidence >= 25 || s.misalignmentSeverity <= 60) return 1;
  return 0;
}

function resolveControl(s: StateVariables): number {
  if (s.intlCooperation >= 60 && s.obInternalTrust >= 60) return 4;
  if (s.securityLevelOB >= 4 || s.securityLevelProm >= 4) return 3;
  if (s.obCapability - s.chinaCapability > 30 && s.intlCooperation < 30) return 2;
  if (s.alignmentConfidence < 30 && (s.obCapability >= 70 || s.chinaCapability >= 70)) return 1;
  return 0;
}

function resolveUsChinaRelations(s: StateVariables): number {
  if (s.intlCooperation >= 70 && s.taiwanTension <= 20) return 4;
  if (s.intlCooperation >= 50 && s.taiwanTension <= 40) return 3;
  if (s.intlCooperation >= 30 && s.taiwanTension <= 60) return 2;
  if (s.taiwanTension <= 75) return 1;
  return 0;
}

function resolvePublicReaction(s: StateVariables): number {
  if (s.publicAwareness <= 20) return 4;
  if (s.publicSentiment >= 30 && s.publicAwareness <= 60) return 3;
  if (s.publicSentiment >= 0) return 2;
  if (s.publicSentiment >= -40) return 1;
  return 0;
}

function resolveEconomy(s: StateVariables): number {
  if (s.economicDisruption <= 25) return 3;
  if (s.economicDisruption <= 50) return 2;
  if (s.economicDisruption <= 70) return 1;
  return 0;
}

function resolvePrometheusFate(s: StateVariables): number {
  if (s.promCapability >= s.obCapability || s.obPromGap <= -2) return 4;
  if (s.alignmentConfidence >= 70 && s.intlCooperation >= 50) return 3;
  if (s.obPromGap >= 2 && s.obPromGap <= 5) return 2;
  if (s.intlCooperation >= 40) return 1;
  return 0;
}

function resolveTaiwan(s: StateVariables): number {
  if (s.taiwanTension <= 20) return 4;
  if (s.taiwanTension <= 40 && s.intlCooperation >= 40) return 3;
  if (s.taiwanTension <= 60) return 2;
  if (s.taiwanTension <= 80) return 1;
  return 0;
}

function resolveOpenSource(s: StateVariables): number {
  if (s.publicAwareness <= 30 && s.intlCooperation <= 30) return 3;
  if (s.securityLevelOB >= 4 && s.securityLevelProm >= 4) return 2;
  if (s.intlCooperation >= 40) return 1;
  return 0;
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

  const arcIds: EndingArcId[] = [
    "aiRace",
    "alignment",
    "control",
    "usChinaRelations",
    "publicReaction",
    "economy",
    "prometheusFate",
    "taiwan",
    "openSource",
  ];

  return arcIds.map((id) => {
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
