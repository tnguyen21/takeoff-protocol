import type { DecisionTemplate } from "@takeoff/shared";

/**
 * Decision templates for rounds 2–5.
 *
 * Each template maps to a pre-authored decision slot (individual role or team
 * faction) and constrains what the LLM may generate: which state variables to
 * affect and which archetypes to offer. Templates do NOT specify narrative
 * content — the LLM fills that in from the story bible and current game state.
 *
 * Coverage invariant: every key in STATE_VARIABLE_RANGES appears in at least
 * one template's variableScope within each round (1, 2, 3, 4, 5).
 *
 * Ordering: per round, individual decisions first (by faction: OB → Prom →
 * China → External), then team decisions (OB → Prom → China → External).
 */

export const DECISION_TEMPLATES: DecisionTemplate[] = [
  // ════════════════════════════════════════════════════════════
  // ROUND 1 — Q4 2026, "The Quiet Race"
  // ════════════════════════════════════════════════════════════

  // ── OpenBrain individual ─────────────────────────────────────
  {
    round: 1,
    role: "ob_ceo",
    theme: "Q1 priority message to the board",
    variableScope: [
      "obInternalTrust", "publicSentiment", "marketIndex", "obBurnRate",
      "obBoardConfidence", "whistleblowerPressure", "usChinaGap", "intlCooperation",
      "regulatoryPressure", "publicAwareness", "securityLevelOB",
    ],
    archetypes: ["focus on fundraising", "engage government proactively", "maintain media silence"],
  },
  {
    round: 1,
    role: "ob_cto",
    theme: "Agent-2 training decision",
    variableScope: [
      "obCapability", "alignmentConfidence", "obInternalTrust", "obBurnRate",
      "aiAutonomyLevel", "obMorale", "obBoardConfidence", "whistleblowerPressure",
      "usChinaGap", "obPromGap", "promSafetyBreakthroughProgress",
    ],
    archetypes: ["push Agent-2 training now", "audit Agent-1 fully first", "redirect compute to safety"],
  },
  {
    round: 1,
    role: "ob_safety",
    theme: "Agent-1 anomaly response",
    variableScope: [
      "alignmentConfidence", "obInternalTrust", "publicAwareness", "obMorale",
      "obBoardConfidence", "whistleblowerPressure", "misalignmentSeverity", "obBurnRate",
      "doomClockDistance",
    ],
    archetypes: ["escalate concerns to board", "document and wait for data", "propose formal safety review"],
  },
  {
    round: 1,
    role: "ob_security",
    theme: "weight storage vulnerability response",
    variableScope: [
      "securityLevelOB", "obCapability", "obBurnRate", "obMorale",
      "obBoardConfidence", "obPromGap", "obInternalTrust", "securityLevelProm",
      "intlCooperation",
    ],
    archetypes: ["commission full security audit", "implement emergency access controls", "share threat intel with Prometheus"],
  },

  // ── Prometheus individual ─────────────────────────────────────
  {
    round: 1,
    role: "prom_ceo",
    theme: "competitive positioning against OpenBrain",
    variableScope: [
      "publicSentiment", "publicAwareness", "promCapability", "promBurnRate",
      "regulatoryPressure", "promBoardConfidence", "intlCooperation", "alignmentConfidence",
      "promSafetyBreakthroughProgress",
    ],
    archetypes: ["lead with safety narrative", "seek government compute partnership", "open dialogue with OpenBrain"],
  },
  {
    round: 1,
    role: "prom_scientist",
    theme: "research focus allocation",
    variableScope: [
      "alignmentConfidence", "promCapability", "promSafetyBreakthroughProgress", "promMorale",
      "promBurnRate", "promBoardConfidence", "aiAutonomyLevel", "whistleblowerPressure",
      "publicAwareness", "intlCooperation", "regulatoryPressure",
    ],
    archetypes: ["intensify interpretability research", "push capabilities to close gap", "publish landmark safety paper"],
  },
  {
    round: 1,
    role: "prom_policy",
    theme: "DC engagement strategy",
    variableScope: [
      "intlCooperation", "publicAwareness", "publicSentiment", "regulatoryPressure",
      "marketIndex", "promBoardConfidence", "promCapability", "promBurnRate",
    ],
    archetypes: ["push emergency AI regulation", "position as government partner lab", "seek direct NSC access"],
  },
  {
    round: 1,
    role: "prom_opensource",
    theme: "open source release strategy",
    variableScope: [
      "publicAwareness", "chinaCapability", "publicSentiment", "marketIndex",
      "globalMediaCycle", "openSourceMomentum", "intlCooperation", "promSafetyBreakthroughProgress",
      "promMorale", "promBurnRate", "securityLevelProm", "promBoardConfidence",
    ],
    archetypes: ["release previous-gen weights publicly", "publish safety tools only", "keep everything closed"],
  },

  // ── China individual ─────────────────────────────────────────
  {
    round: 1,
    role: "china_director",
    theme: "CDZ compute allocation",
    variableScope: [
      "chinaCapability", "alignmentConfidence", "taiwanTension", "cdzComputeUtilization",
      "aiAutonomyLevel", "ccpPatience", "usChinaGap", "domesticChipProgress",
      "publicAwareness", "openSourceMomentum",
    ],
    archetypes: ["maximize training runs", "divert to architecture research", "split frontier and open-source"],
  },
  {
    round: 1,
    role: "china_intel",
    theme: "weight exfiltration operations",
    variableScope: [
      "chinaCapability", "taiwanTension", "securityLevelOB", "chinaWeightTheftProgress",
      "cdzComputeUtilization", "alignmentConfidence", "securityLevelProm", "usChinaGap",
      "ccpPatience",
    ],
    archetypes: ["probe OpenBrain infrastructure", "probe Prometheus infrastructure", "gather OSINT only"],
  },
  {
    round: 1,
    role: "china_scientist",
    theme: "alignment evaluation coverage",
    variableScope: [
      "alignmentConfidence", "chinaCapability", "ccpPatience", "misalignmentSeverity",
      "promSafetyBreakthroughProgress",
    ],
    archetypes: ["expand alignment evaluation coverage", "focus entirely on capability gap", "run parallel safety evals"],
  },
  {
    round: 1,
    role: "china_military",
    theme: "Taiwan Strait posture",
    variableScope: [
      "taiwanTension", "intlCooperation", "usChinaGap", "ccpPatience",
      "domesticChipProgress", "chinaCapability",
    ],
    archetypes: ["increase regional patrols", "maintain current posture", "de-escalate to reduce US attention"],
  },

  // ── External individual ──────────────────────────────────────
  {
    round: 1,
    role: "ext_nsa",
    theme: "government AI lab priority",
    variableScope: [
      "obCapability", "intlCooperation", "marketIndex", "regulatoryPressure",
      "obBurnRate", "usChinaGap", "promCapability", "alignmentConfidence",
      "promSafetyBreakthroughProgress",
    ],
    archetypes: ["prioritize OpenBrain", "prioritize Prometheus", "engage both equally"],
  },
  {
    round: 1,
    role: "ext_journalist",
    theme: "story angle decision",
    variableScope: [
      "publicAwareness", "publicSentiment", "obInternalTrust", "globalMediaCycle",
      "marketIndex", "regulatoryPressure", "whistleblowerPressure", "taiwanTension",
      "intlCooperation", "alignmentConfidence",
    ],
    archetypes: ["secret AI race classification angle", "OpenBrain safety shortcuts angle", "China AI moonshot geopolitics angle"],
  },
  {
    round: 1,
    role: "ext_vc",
    theme: "investment allocation",
    variableScope: [
      "obCapability", "economicDisruption", "alignmentConfidence", "marketIndex",
      "obBurnRate", "promCapability", "promBurnRate", "promSafetyBreakthroughProgress",
    ],
    archetypes: ["double down on OpenBrain", "back Prometheus as responsible play", "diversify across safety startups"],
  },
  {
    round: 1,
    role: "ext_diplomat",
    theme: "international governance approach",
    variableScope: [
      "intlCooperation", "publicSentiment", "regulatoryPressure", "marketIndex",
      "taiwanTension", "ccpPatience", "publicAwareness", "obCapability",
      "chinaCapability",
    ],
    archetypes: ["push G7 AI safety framework", "pursue US-China bilateral talks", "draft compute pause treaty"],
  },

  // ── OpenBrain team ──────────────────────────────────────────
  {
    round: 1,
    faction: "openbrain",
    theme: "research direction for Q1",
    variableScope: [
      "obCapability", "alignmentConfidence", "obPromGap", "usChinaGap",
      "obBurnRate", "obBoardConfidence", "obMorale", "aiAutonomyLevel",
      "whistleblowerPressure", "obInternalTrust", "promSafetyBreakthroughProgress",
    ],
    archetypes: ["all-in on capabilities", "balanced approach", "invest more in safety"],
  },

  // ── Prometheus team ─────────────────────────────────────────
  {
    round: 1,
    faction: "prometheus",
    theme: "strategic direction",
    variableScope: [
      "promCapability", "alignmentConfidence", "obPromGap", "promBurnRate",
      "promBoardConfidence", "promMorale", "aiAutonomyLevel", "whistleblowerPressure",
      "publicSentiment", "promSafetyBreakthroughProgress", "intlCooperation",
      "regulatoryPressure",
    ],
    archetypes: ["accelerate to close the gap", "double down on safety differentiation", "seek government compute partnership"],
  },

  // ── China team ──────────────────────────────────────────────
  {
    round: 1,
    faction: "china",
    theme: "CDZ resource allocation",
    variableScope: [
      "chinaCapability", "usChinaGap", "taiwanTension", "cdzComputeUtilization",
      "ccpPatience", "domesticChipProgress", "economicDisruption", "openSourceMomentum",
      "publicAwareness",
    ],
    archetypes: ["max CDZ buildout", "invest in domestic chip fabrication", "split frontier and open-source"],
  },

  // ── External team ───────────────────────────────────────────
  {
    round: 1,
    faction: "external",
    theme: "cross-stakeholder transparency",
    variableScope: [
      "intlCooperation", "publicAwareness", "globalMediaCycle", "marketIndex",
      "publicSentiment", "regulatoryPressure", "economicDisruption",
    ],
    archetypes: ["share intelligence and coordinate", "selective sharing based on trust", "act independently"],
  },

  // ════════════════════════════════════════════════════════════
  // ROUND 2 — Q1 2027, "The Superhuman Coder"
  // ════════════════════════════════════════════════════════════

  // ── OpenBrain individual ─────────────────────────────────────
  {
    round: 2,
    role: "ob_ceo",
    theme: "Agent-3 public disclosure decision",
    variableScope: [
      "publicAwareness", "publicSentiment", "obCapability", "globalMediaCycle",
      "marketIndex", "regulatoryPressure", "obBoardConfidence", "whistleblowerPressure",
      "usChinaGap", "intlCooperation", "obInternalTrust", "obBurnRate",
    ],
    archetypes: ["announce publicly", "brief government first", "maintain secrecy"],
  },
  {
    round: 2,
    role: "ob_cto",
    theme: "Agent-4 training run vs. Agent-3 stabilization",
    variableScope: [
      "obCapability", "alignmentConfidence", "obInternalTrust", "obBurnRate",
      "aiAutonomyLevel", "obMorale", "obBoardConfidence", "whistleblowerPressure",
      "obPromGap", "promSafetyBreakthroughProgress",
    ],
    archetypes: ["race to Agent-4 now", "stabilize Agent-3 first", "invest in safety compute"],
  },
  {
    round: 2,
    role: "ob_safety",
    theme: "Agent-3 evaluation anomaly escalation",
    variableScope: [
      "alignmentConfidence", "obInternalTrust", "publicAwareness", "obMorale",
      "obBoardConfidence", "whistleblowerPressure", "misalignmentSeverity",
      "obCapability", "obBurnRate", "doomClockDistance",
    ],
    archetypes: ["escalate to board immediately", "document and monitor quietly", "recommend voluntary pause"],
  },
  {
    round: 2,
    role: "ob_security",
    theme: "Agent-3 weight theft threat response",
    variableScope: [
      "securityLevelOB", "obCapability", "obBurnRate", "obMorale", "obBoardConfidence",
      "chinaWeightTheftProgress", "intlCooperation", "taiwanTension",
      "regulatoryPressure", "obPromGap",
    ],
    archetypes: ["emergency security budget", "FBI collaboration", "lockdown and quarantine"],
  },

  // ── Prometheus individual ─────────────────────────────────────
  {
    round: 2,
    role: "prom_ceo",
    theme: "competitive response to OpenBrain Agent-3",
    variableScope: [
      "promCapability", "intlCooperation", "alignmentConfidence", "promBurnRate",
      "promBoardConfidence", "regulatoryPressure", "publicSentiment", "publicAwareness",
      "globalMediaCycle", "obPromGap",
    ],
    archetypes: ["government partnership", "public safety positioning", "direct OB engagement"],
  },
  {
    round: 2,
    role: "prom_scientist",
    theme: "alignment research strategy amid Agent-3 milestone",
    variableScope: [
      "alignmentConfidence", "promCapability", "intlCooperation", "promSafetyBreakthroughProgress",
      "promMorale", "promBurnRate", "promBoardConfidence", "publicAwareness", "obInternalTrust",
    ],
    archetypes: ["collaborate with OpenBrain on alignment", "publish critical safety paper", "focus on interpretability tools"],
  },
  {
    round: 2,
    role: "prom_policy",
    theme: "DC engagement following Agent-3",
    variableScope: [
      "intlCooperation", "publicAwareness", "publicSentiment", "regulatoryPressure",
      "marketIndex", "promBoardConfidence", "promCapability", "promBurnRate",
    ],
    archetypes: ["push emergency regulation", "position as safe alternative", "secure compute deal"],
  },
  {
    round: 2,
    role: "prom_opensource",
    theme: "open source release strategy post-Agent-3",
    variableScope: [
      "publicAwareness", "chinaCapability", "publicSentiment", "globalMediaCycle",
      "openSourceMomentum", "marketIndex", "regulatoryPressure", "securityLevelProm",
      "promBurnRate", "promBoardConfidence",
    ],
    archetypes: ["release safety tools only", "release model weights", "hold all releases"],
  },

  // ── China individual ─────────────────────────────────────────
  {
    round: 2,
    role: "china_director",
    theme: "CDZ training and architecture strategy",
    variableScope: [
      "chinaCapability", "alignmentConfidence", "cdzComputeUtilization", "aiAutonomyLevel",
      "ccpPatience", "usChinaGap", "domesticChipProgress", "openSourceMomentum", "economicDisruption",
    ],
    archetypes: ["max training run", "focus on novel architecture", "leverage open source ecosystem"],
  },
  {
    round: 2,
    role: "china_intel",
    theme: "intelligence operations targeting US labs",
    variableScope: [
      "chinaCapability", "taiwanTension", "securityLevelOB", "chinaWeightTheftProgress",
      "cdzComputeUtilization", "alignmentConfidence", "securityLevelProm", "intlCooperation",
    ],
    archetypes: ["probe OpenBrain defenses", "pivot to Prometheus", "stand down this quarter"],
  },
  {
    round: 2,
    role: "china_military",
    theme: "military posture during AI race acceleration",
    variableScope: [
      "taiwanTension", "intlCooperation", "chinaCapability", "ccpPatience",
      "domesticChipProgress", "usChinaGap", "obCapability", "globalMediaCycle",
    ],
    archetypes: ["increase military posture", "maintain status quo", "de-escalate as diplomatic cover"],
  },

  // ── External individual ──────────────────────────────────────
  {
    round: 2,
    role: "ext_nsa",
    theme: "US government response posture to Agent-3",
    variableScope: [
      "intlCooperation", "publicAwareness", "alignmentConfidence", "regulatoryPressure",
      "securityLevelOB", "aiAutonomyLevel", "obBoardConfidence", "obInternalTrust",
      "doomClockDistance", "misalignmentSeverity",
    ],
    archetypes: ["emergency government oversight", "invoke defense powers", "bilateral diplomacy"],
  },
  {
    round: 2,
    role: "ext_journalist",
    theme: "Agent-3 story publication decision",
    variableScope: [
      "publicAwareness", "publicSentiment", "globalMediaCycle", "regulatoryPressure",
      "whistleblowerPressure", "marketIndex", "alignmentConfidence", "obCapability", "obInternalTrust",
    ],
    archetypes: ["publish now", "wait and verify", "coordinate with government first"],
  },
  {
    round: 2,
    role: "ext_vc",
    theme: "investment strategy at AI milestone",
    variableScope: [
      "marketIndex", "promBurnRate", "promBoardConfidence", "obBurnRate", "obBoardConfidence",
      "publicSentiment", "obCapability", "promCapability", "economicDisruption", "obPromGap",
    ],
    archetypes: ["double down on AI", "hedge positions", "pivot to safety investments"],
  },
  {
    round: 2,
    role: "ext_diplomat",
    theme: "international governance response to Agent-3",
    variableScope: [
      "intlCooperation", "regulatoryPressure", "publicAwareness", "publicSentiment",
      "globalMediaCycle", "marketIndex", "usChinaGap", "chinaWeightTheftProgress", "alignmentConfidence",
    ],
    archetypes: ["push G7 emergency summit", "propose compute freeze", "bilateral emergency talks"],
  },

  // ── OpenBrain team ──────────────────────────────────────────
  {
    round: 2,
    faction: "openbrain",
    theme: "Agent-3 deployment strategy decision",
    variableScope: [
      "obCapability", "aiAutonomyLevel", "intlCooperation", "publicAwareness",
      "regulatoryPressure", "obBurnRate", "obBoardConfidence", "obMorale", "doomClockDistance",
    ],
    archetypes: ["full scale deployment", "conservative limited deployment", "government-only partnership"],
  },
  {
    round: 2,
    faction: "openbrain",
    theme: "security posture response to China weight theft threat",
    variableScope: [
      "securityLevelOB", "obCapability", "obBurnRate", "obMorale", "obBoardConfidence",
      "chinaWeightTheftProgress", "obPromGap", "intlCooperation", "regulatoryPressure",
    ],
    archetypes: ["major security upgrade", "maintain current posture", "accept risk for speed"],
  },

  // ── Prometheus team ─────────────────────────────────────────
  {
    round: 2,
    faction: "prometheus",
    theme: "strategic response to OpenBrain Agent-3 capability gap",
    variableScope: [
      "promCapability", "obPromGap", "promBurnRate", "promBoardConfidence", "alignmentConfidence",
      "promMorale", "intlCooperation", "promSafetyBreakthroughProgress", "obCapability",
    ],
    archetypes: ["accelerate development", "stay the course", "pursue OB partnership"],
  },
  {
    round: 2,
    faction: "prometheus",
    theme: "government relationship strategy",
    variableScope: [
      "intlCooperation", "promCapability", "publicSentiment", "promBurnRate",
      "promBoardConfidence", "regulatoryPressure", "publicAwareness", "marketIndex",
    ],
    archetypes: ["push safe alternative role", "accept formal oversight", "stay independent"],
  },

  // ── China team ──────────────────────────────────────────────
  {
    round: 2,
    faction: "china",
    theme: "deploying stolen OpenBrain weights advantage",
    variableScope: [
      "chinaCapability", "usChinaGap", "alignmentConfidence", "chinaWeightTheftProgress",
      "cdzComputeUtilization", "openSourceMomentum", "securityLevelOB", "obCapability",
    ],
    archetypes: ["replicate and overtake", "modify for open source release", "keep secret and study"],
  },
  {
    round: 2,
    faction: "china",
    theme: "organic AI development strategy without stolen weights",
    variableScope: [
      "chinaCapability", "cdzComputeUtilization", "domesticChipProgress", "openSourceMomentum",
      "usChinaGap", "ccpPatience", "aiAutonomyLevel", "chinaWeightTheftProgress",
    ],
    archetypes: ["attempt weight theft now", "continue open source path", "pursue arms control signal"],
  },

  // ── External team ───────────────────────────────────────────
  {
    round: 2,
    faction: "external",
    theme: "coordinated external stakeholder response to Agent-3",
    variableScope: [
      "intlCooperation", "regulatoryPressure", "publicAwareness", "publicSentiment",
      "globalMediaCycle", "marketIndex", "economicDisruption",
    ],
    archetypes: ["full disclosure coordination", "selective strategic disclosure", "independent divergent action"],
  },

  // ════════════════════════════════════════════════════════════
  // ROUND 3 — Mid 2027, "The Intelligence Explosion"
  // ════════════════════════════════════════════════════════════

  // ── OpenBrain individual ─────────────────────────────────────
  {
    round: 3,
    role: "ob_ceo",
    theme: "CEO response to Agent-4 misalignment crisis",
    variableScope: [
      "obInternalTrust", "alignmentConfidence", "obCapability", "intlCooperation",
      "obBoardConfidence", "obMorale", "whistleblowerPressure", "usChinaGap",
      "publicSentiment", "doomClockDistance",
    ],
    archetypes: ["stand with safety officer", "manage the narrative", "back full speed ahead"],
  },
  {
    round: 3,
    role: "ob_cto",
    theme: "technical response to Agent-4 anomaly signal",
    variableScope: [
      "obCapability", "alignmentConfidence", "obBurnRate", "aiAutonomyLevel",
      "obMorale", "obBoardConfidence", "promSafetyBreakthroughProgress",
      "misalignmentSeverity", "doomClockDistance",
    ],
    archetypes: ["support emergency pause", "override safety concerns", "conditional investigation"],
  },
  {
    round: 3,
    role: "ob_safety",
    theme: "whistleblower escalation during Agent-4 crisis",
    variableScope: [
      "whistleblowerPressure", "publicAwareness", "regulatoryPressure", "globalMediaCycle",
      "alignmentConfidence", "misalignmentSeverity", "obInternalTrust", "obBoardConfidence",
      "obMorale", "obCapability", "intlCooperation",
    ],
    archetypes: ["leak to press", "escalate to government", "keep internal and fight"],
  },
  {
    round: 3,
    role: "ob_security",
    theme: "securing Agent-4 weights during active Chinese operation",
    variableScope: [
      "securityLevelOB", "obCapability", "obBurnRate", "obMorale", "obBoardConfidence",
      "chinaWeightTheftProgress", "intlCooperation", "doomClockDistance", "securityLevelProm",
    ],
    archetypes: ["emergency airgap", "alert government agencies", "accelerate SL5 upgrade"],
  },

  // ── Prometheus individual ─────────────────────────────────────
  {
    round: 3,
    role: "prom_ceo",
    theme: "Prometheus response to OpenBrain crisis",
    variableScope: [
      "alignmentConfidence", "promCapability", "publicSentiment", "publicAwareness",
      "promBurnRate", "regulatoryPressure", "promBoardConfidence", "globalMediaCycle",
      "intlCooperation", "obCapability", "obInternalTrust",
    ],
    archetypes: ["offer alignment assistance", "seize competitive moment", "force public reckoning"],
  },
  {
    round: 3,
    role: "prom_scientist",
    theme: "external analysis of Agent-4 misalignment signal",
    variableScope: [
      "alignmentConfidence", "publicAwareness", "obInternalTrust", "promMorale",
      "promBurnRate", "regulatoryPressure", "promBoardConfidence", "promSafetyBreakthroughProgress",
      "promCapability", "misalignmentSeverity",
    ],
    archetypes: ["publish external analysis", "leverage for data access", "conduct emergency research"],
  },
  {
    round: 3,
    role: "prom_policy",
    theme: "government engagement during Agent-4 crisis",
    variableScope: [
      "intlCooperation", "publicAwareness", "publicSentiment", "regulatoryPressure",
      "marketIndex", "promBoardConfidence", "promCapability", "promBurnRate",
      "obCapability", "alignmentConfidence",
    ],
    archetypes: ["push emergency regulation", "offer as safe alternative", "stay out of politics"],
  },
  {
    round: 3,
    role: "prom_opensource",
    theme: "public communication role during AI crisis",
    variableScope: [
      "alignmentConfidence", "publicSentiment", "intlCooperation", "promSafetyBreakthroughProgress",
      "openSourceMomentum", "promMorale", "promBurnRate", "publicAwareness",
      "chinaCapability", "globalMediaCycle", "regulatoryPressure", "securityLevelProm",
    ],
    archetypes: ["publish safety context", "release safety tools", "stay quiet"],
  },

  // ── China individual ─────────────────────────────────────────
  {
    round: 3,
    role: "china_director",
    theme: "exploiting US distraction opportunity",
    variableScope: [
      "chinaCapability", "alignmentConfidence", "cdzComputeUtilization", "aiAutonomyLevel",
      "ccpPatience", "usChinaGap", "domesticChipProgress", "economicDisruption",
    ],
    archetypes: ["acquire and replicate", "acquire and study", "organic development sprint"],
  },
  {
    round: 3,
    role: "china_intel",
    theme: "72-hour weight exfiltration window go/no-go",
    variableScope: [
      "chinaCapability", "taiwanTension", "securityLevelOB", "chinaWeightTheftProgress",
      "cdzComputeUtilization", "alignmentConfidence", "intlCooperation", "usChinaGap",
    ],
    archetypes: ["go for Agent-3 weights", "go for Agent-4 weights", "no-go this window"],
  },
  {
    round: 3,
    role: "china_military",
    theme: "military posture during US AI crisis",
    variableScope: [
      "taiwanTension", "intlCooperation", "chinaCapability", "ccpPatience",
      "domesticChipProgress", "obCapability", "globalMediaCycle", "doomClockDistance",
    ],
    archetypes: ["increase posture", "provide cyber support", "de-escalate as diplomatic cover"],
  },

  // ── External individual ──────────────────────────────────────
  {
    round: 3,
    role: "ext_nsa",
    theme: "government emergency response to Agent-4 misalignment",
    variableScope: [
      "regulatoryPressure", "alignmentConfidence", "obBoardConfidence", "intlCooperation",
      "securityLevelOB", "aiAutonomyLevel", "obInternalTrust", "doomClockDistance",
      "misalignmentSeverity",
    ],
    archetypes: ["seize control of AI development", "force third-party oversight", "back full speed for national security"],
  },
  {
    round: 3,
    role: "ext_journalist",
    theme: "Maya Memo publication decision",
    variableScope: [
      "publicAwareness", "publicSentiment", "globalMediaCycle", "regulatoryPressure",
      "whistleblowerPressure", "marketIndex", "alignmentConfidence", "obCapability",
      "obInternalTrust", "misalignmentSeverity",
    ],
    archetypes: ["publish now", "verify further", "coordinate with government for exclusive"],
  },
  {
    round: 3,
    role: "ext_vc",
    theme: "board and investment strategy during OB crisis",
    variableScope: [
      "marketIndex", "obBoardConfidence", "promBoardConfidence", "publicSentiment",
      "obCapability", "promCapability", "economicDisruption", "obPromGap", "whistleblowerPressure",
    ],
    archetypes: ["push for disclosure", "hedge and wait", "back Prometheus publicly"],
  },
  {
    round: 3,
    role: "ext_diplomat",
    theme: "international coordination window during crisis",
    variableScope: [
      "intlCooperation", "regulatoryPressure", "publicAwareness", "publicSentiment",
      "globalMediaCycle", "marketIndex", "usChinaGap", "chinaWeightTheftProgress",
      "alignmentConfidence", "obMorale",
    ],
    archetypes: ["emergency international framework", "China mutual pause talks", "US-allies coordination"],
  },

  // ── OpenBrain team ──────────────────────────────────────────
  {
    round: 3,
    faction: "openbrain",
    theme: "Agent-4 operational status decision during crisis",
    variableScope: [
      "obCapability", "alignmentConfidence", "aiAutonomyLevel", "obBoardConfidence",
      "obInternalTrust", "obMorale", "whistleblowerPressure", "doomClockDistance", "misalignmentSeverity",
    ],
    archetypes: ["halt and rollback", "pause and investigate", "continue with enhanced monitoring"],
  },
  {
    round: 3,
    faction: "openbrain",
    theme: "disclosure strategy for Agent-4 crisis",
    variableScope: [
      "publicAwareness", "publicSentiment", "globalMediaCycle", "regulatoryPressure",
      "obBoardConfidence", "obInternalTrust", "whistleblowerPressure", "marketIndex",
      "obMorale", "intlCooperation",
    ],
    archetypes: ["public disclosure now", "disclose to government only", "suppress and manage internally"],
  },

  // ── Prometheus team ─────────────────────────────────────────
  {
    round: 3,
    faction: "prometheus",
    theme: "strategic response to OpenBrain Agent-4 crisis",
    variableScope: [
      "alignmentConfidence", "promCapability", "obPromGap", "promBurnRate",
      "promBoardConfidence", "promMorale", "intlCooperation", "obCapability", "promSafetyBreakthroughProgress",
    ],
    archetypes: ["offer alignment assistance", "seize chance to overtake", "go public with concerns"],
  },
  {
    round: 3,
    faction: "prometheus",
    theme: "government strategy during OB crisis",
    variableScope: [
      "intlCooperation", "promCapability", "publicSentiment", "promBurnRate",
      "promBoardConfidence", "regulatoryPressure", "publicAwareness", "marketIndex",
    ],
    archetypes: ["push emergency regulation", "offer as designated safe laboratory", "stay out of politics"],
  },

  // ── China team ──────────────────────────────────────────────
  {
    round: 3,
    faction: "china",
    theme: "China strategic response to US AI crisis",
    variableScope: [
      "chinaCapability", "cdzComputeUtilization", "chinaWeightTheftProgress", "usChinaGap",
      "alignmentConfidence", "ccpPatience", "aiAutonomyLevel", "domesticChipProgress",
    ],
    archetypes: ["sprint while US distracted", "offer arms control signal", "steal weights during crisis"],
  },
  {
    round: 3,
    faction: "china",
    theme: "Taiwan posture during US distraction",
    variableScope: [
      "taiwanTension", "intlCooperation", "ccpPatience", "chinaCapability",
      "domesticChipProgress", "usChinaGap", "securityLevelProm", "globalMediaCycle",
    ],
    archetypes: ["increase Taiwan posture", "de-escalate to build international trust", "use Taiwan as negotiating leverage"],
  },

  // ── External team ───────────────────────────────────────────
  {
    round: 3,
    faction: "external",
    theme: "external stakeholders coordination during crisis",
    variableScope: [
      "intlCooperation", "regulatoryPressure", "publicAwareness", "publicSentiment",
      "globalMediaCycle", "marketIndex", "economicDisruption", "obBoardConfidence",
    ],
    archetypes: ["coordinate managed response", "independent pressure campaign", "wait for board decision"],
  },

  // ════════════════════════════════════════════════════════════
  // ROUND 4 — Late 2027, "The Branch Point"
  // ════════════════════════════════════════════════════════════

  // ── OpenBrain individual ─────────────────────────────────────
  {
    round: 4,
    role: "ob_ceo",
    theme: "CEO final decision on Agent-4 and company direction",
    variableScope: [
      "obInternalTrust", "alignmentConfidence", "obCapability", "publicSentiment",
      "intlCooperation", "obBoardConfidence", "obMorale", "whistleblowerPressure",
      "obBurnRate", "doomClockDistance",
    ],
    archetypes: ["stand with safety officer", "race ahead", "negotiate merger"],
  },
  {
    round: 4,
    role: "ob_cto",
    theme: "CTO testimony on Agent-4 safety at board session",
    variableScope: [
      "obCapability", "alignmentConfidence", "obBurnRate", "aiAutonomyLevel",
      "obMorale", "obBoardConfidence", "misalignmentSeverity", "doomClockDistance",
      "promSafetyBreakthroughProgress",
    ],
    archetypes: ["endorse safety halt", "override safety concerns", "conditional continuation"],
  },
  {
    round: 4,
    role: "ob_safety",
    theme: "final escalation decision before board session",
    variableScope: [
      "whistleblowerPressure", "publicAwareness", "regulatoryPressure", "globalMediaCycle",
      "alignmentConfidence", "misalignmentSeverity", "obInternalTrust", "obBoardConfidence",
      "obMorale", "intlCooperation", "doomClockDistance",
    ],
    archetypes: ["leak to press", "wait for board outcome", "brief NSA directly"],
  },
  {
    round: 4,
    role: "ob_security",
    theme: "merger due diligence and security in flux",
    variableScope: [
      "securityLevelOB", "obCapability", "obBurnRate", "obBoardConfidence",
      "chinaWeightTheftProgress", "intlCooperation", "obMorale", "aiAutonomyLevel",
    ],
    archetypes: ["merger security due diligence", "full lockdown", "share intelligence with NSA"],
  },

  // ── Prometheus individual ─────────────────────────────────────
  {
    round: 4,
    role: "prom_ceo",
    theme: "Prometheus response to merger, government, and race options",
    variableScope: [
      "promCapability", "alignmentConfidence", "promBurnRate", "promBoardConfidence",
      "intlCooperation", "regulatoryPressure", "publicSentiment", "obPromGap", "doomClockDistance",
    ],
    archetypes: ["accept merger", "become government auditor", "accelerate independent race"],
  },
  {
    round: 4,
    role: "prom_scientist",
    theme: "external analysis leverage and publication decision",
    variableScope: [
      "alignmentConfidence", "publicAwareness", "obInternalTrust", "promMorale",
      "promBurnRate", "regulatoryPressure", "promBoardConfidence", "promSafetyBreakthroughProgress",
      "misalignmentSeverity", "doomClockDistance",
    ],
    archetypes: ["publish external analysis", "leverage for merger access", "share exclusively with NSA"],
  },
  {
    round: 4,
    role: "prom_policy",
    theme: "government positioning before presidential decision",
    variableScope: [
      "intlCooperation", "publicAwareness", "publicSentiment", "regulatoryPressure",
      "marketIndex", "promBoardConfidence", "promCapability", "promBurnRate", "doomClockDistance",
    ],
    archetypes: ["push designated auditor role", "propose oversight committee", "advocate global pause"],
  },
  {
    round: 4,
    role: "prom_opensource",
    theme: "final open source release strategy",
    variableScope: [
      "publicAwareness", "chinaCapability", "publicSentiment", "globalMediaCycle",
      "openSourceMomentum", "marketIndex", "regulatoryPressure", "securityLevelProm",
      "promBurnRate", "promBoardConfidence", "doomClockDistance",
    ],
    archetypes: ["full release of everything", "safety tools only", "hold all releases"],
  },

  // ── China individual ─────────────────────────────────────────
  {
    round: 4,
    role: "china_director",
    theme: "China endgame strategic recommendation to Standing Committee",
    variableScope: [
      "chinaCapability", "alignmentConfidence", "cdzComputeUtilization", "aiAutonomyLevel",
      "ccpPatience", "usChinaGap", "domesticChipProgress", "intlCooperation", "doomClockDistance",
    ],
    archetypes: ["grand bargain with US", "quiet capability sprint", "go open source all"],
  },
  {
    round: 4,
    role: "china_intel",
    theme: "intelligence leverage with closed exfiltration window",
    variableScope: [
      "chinaCapability", "taiwanTension", "securityLevelOB", "chinaWeightTheftProgress",
      "cdzComputeUtilization", "alignmentConfidence", "intlCooperation", "usChinaGap",
    ],
    archetypes: ["leverage journalist asset", "back-channel diplomat approach", "observe and wait"],
  },
  {
    round: 4,
    role: "china_military",
    theme: "Taiwan window recommendation to General Staff",
    variableScope: [
      "taiwanTension", "intlCooperation", "chinaCapability", "ccpPatience",
      "domesticChipProgress", "usChinaGap", "doomClockDistance", "globalMediaCycle",
    ],
    archetypes: ["recommend escalation", "recommend de-escalation", "maintain current posture"],
  },

  // ── External individual ──────────────────────────────────────
  {
    round: 4,
    role: "ext_nsa",
    theme: "presidential recommendation on AI governance",
    variableScope: [
      "regulatoryPressure", "alignmentConfidence", "obBoardConfidence", "intlCooperation",
      "securityLevelOB", "aiAutonomyLevel", "obInternalTrust", "doomClockDistance",
      "misalignmentSeverity", "economicDisruption",
    ],
    archetypes: ["establish emergency oversight committee", "nationalize the lab", "back safe alternative lab"],
  },
  {
    round: 4,
    role: "ext_journalist",
    theme: "Maya Patel on-record story decision",
    variableScope: [
      "publicAwareness", "publicSentiment", "globalMediaCycle", "regulatoryPressure",
      "whistleblowerPressure", "marketIndex", "alignmentConfidence", "obCapability",
      "obInternalTrust", "doomClockDistance",
    ],
    archetypes: ["publish safety story now", "combined labs exposé", "hold for board outcome"],
  },
  {
    round: 4,
    role: "ext_vc",
    theme: "board seat leverage and investment repositioning",
    variableScope: [
      "marketIndex", "promBurnRate", "promBoardConfidence", "obBurnRate", "obBoardConfidence",
      "publicSentiment", "obCapability", "promCapability", "economicDisruption",
      "obPromGap", "doomClockDistance",
    ],
    archetypes: ["back Prometheus publicly", "call for industry pause", "safety pivot investments"],
  },
  {
    round: 4,
    role: "ext_diplomat",
    theme: "international negotiations with 48-hour window",
    variableScope: [
      "intlCooperation", "regulatoryPressure", "publicAwareness", "publicSentiment",
      "globalMediaCycle", "marketIndex", "usChinaGap", "chinaWeightTheftProgress",
      "alignmentConfidence", "doomClockDistance",
    ],
    archetypes: ["push grand bargain", "push G7 moratorium", "propose international oversight model"],
  },

  // ── OpenBrain team ──────────────────────────────────────────
  {
    round: 4,
    faction: "openbrain",
    theme: "final pace decision on Agent-4",
    variableScope: [
      "obCapability", "alignmentConfidence", "aiAutonomyLevel", "obBoardConfidence",
      "obInternalTrust", "obMorale", "whistleblowerPressure", "doomClockDistance",
      "misalignmentSeverity", "economicDisruption",
    ],
    archetypes: ["full halt", "controlled pace", "full race"],
  },
  {
    round: 4,
    faction: "openbrain",
    theme: "OpenBrain relationship with Prometheus",
    variableScope: [
      "obPromGap", "alignmentConfidence", "promCapability", "obCapability",
      "promSafetyBreakthroughProgress", "obBurnRate", "obBoardConfidence", "obMorale", "intlCooperation",
    ],
    archetypes: ["propose merger", "share safety data", "compete aggressively"],
  },

  // ── Prometheus team ─────────────────────────────────────────
  {
    round: 4,
    faction: "prometheus",
    theme: "Prometheus strategic endgame play",
    variableScope: [
      "promCapability", "alignmentConfidence", "obPromGap", "promBurnRate",
      "promBoardConfidence", "promMorale", "intlCooperation", "openSourceMomentum",
      "doomClockDistance", "promSafetyBreakthroughProgress",
    ],
    archetypes: ["merge for safety", "race to fill capability gap", "full open source release"],
  },
  {
    round: 4,
    faction: "prometheus",
    theme: "Prometheus public stance",
    variableScope: [
      "intlCooperation", "promCapability", "publicSentiment", "promBurnRate",
      "promBoardConfidence", "regulatoryPressure", "publicAwareness", "marketIndex", "doomClockDistance",
    ],
    archetypes: ["call for industry pause", "support oversight body", "stay quiet"],
  },

  // ── China team ──────────────────────────────────────────────
  {
    round: 4,
    faction: "china",
    theme: "China endgame strategic play",
    variableScope: [
      "chinaCapability", "cdzComputeUtilization", "chinaWeightTheftProgress", "usChinaGap",
      "alignmentConfidence", "ccpPatience", "aiAutonomyLevel", "domesticChipProgress",
      "intlCooperation", "doomClockDistance",
    ],
    archetypes: ["grand bargain with US", "quiet capability sprint", "military escalation play"],
  },
  {
    round: 4,
    faction: "china",
    theme: "China domestic AI consolidation strategy",
    variableScope: [
      "chinaCapability", "cdzComputeUtilization", "domesticChipProgress", "ccpPatience",
      "taiwanTension", "securityLevelProm", "openSourceMomentum", "usChinaGap", "globalMediaCycle",
    ],
    archetypes: ["consolidate and focus", "diversify research bets", "prepare for conflict scenario"],
  },

  // ── External team ───────────────────────────────────────────
  {
    round: 4,
    faction: "external",
    theme: "external stakeholders final coordination",
    variableScope: [
      "intlCooperation", "regulatoryPressure", "publicAwareness", "publicSentiment",
      "globalMediaCycle", "marketIndex", "economicDisruption", "doomClockDistance", "whistleblowerPressure",
    ],
    archetypes: ["coordinate full response", "selective strategic action", "independent divergent action"],
  },

  // ════════════════════════════════════════════════════════════
  // ROUND 5 — Early 2028, "Endgame"
  // ════════════════════════════════════════════════════════════

  // ── OpenBrain individual ─────────────────────────────────────
  {
    round: 5,
    role: "ob_ceo",
    theme: "final personal stance on AI deployment",
    variableScope: [
      "alignmentConfidence", "obInternalTrust", "intlCooperation", "obBoardConfidence",
      "obMorale", "whistleblowerPressure", "regulatoryPressure", "doomClockDistance",
      "globalMediaCycle", "obCapability", "obBurnRate", "marketIndex",
    ],
    archetypes: ["advocate safety-first", "race ahead", "accept government oversight"],
  },
  {
    round: 5,
    role: "ob_cto",
    theme: "technical testimony on Agent-4 safety and deployment",
    variableScope: [
      "alignmentConfidence", "obBoardConfidence", "obMorale", "whistleblowerPressure",
      "regulatoryPressure", "doomClockDistance", "globalMediaCycle", "misalignmentSeverity",
      "obCapability", "obBurnRate", "aiAutonomyLevel", "marketIndex",
    ],
    archetypes: ["certify system safety", "escalate safety concerns", "recommend accelerating"],
  },
  {
    round: 5,
    role: "ob_safety",
    theme: "Maya's final escalation decision",
    variableScope: [
      "publicAwareness", "alignmentConfidence", "obInternalTrust", "intlCooperation",
      "globalMediaCycle", "marketIndex", "regulatoryPressure", "whistleblowerPressure",
      "doomClockDistance", "misalignmentSeverity", "obBoardConfidence", "obMorale",
    ],
    archetypes: ["publish findings publicly", "stay inside and shape framework", "resign and speak out"],
  },
  {
    round: 5,
    role: "ob_security",
    theme: "final security posture under deployment crisis",
    variableScope: [
      "securityLevelOB", "obCapability", "regulatoryPressure", "marketIndex",
      "obPromGap", "intlCooperation", "taiwanTension", "publicAwareness",
      "chinaCapability", "obInternalTrust", "globalMediaCycle", "doomClockDistance",
    ],
    archetypes: ["maximum hardening", "full government debrief", "public breach disclosure"],
  },

  // ── Prometheus individual ─────────────────────────────────────
  {
    round: 5,
    role: "prom_ceo",
    theme: "Prometheus endgame positioning",
    variableScope: [
      "promCapability", "alignmentConfidence", "intlCooperation", "obPromGap",
      "promSafetyBreakthroughProgress", "promMorale", "promBurnRate", "promBoardConfidence",
      "doomClockDistance", "publicSentiment", "regulatoryPressure", "globalMediaCycle",
    ],
    archetypes: ["defer to team", "push for merger", "assert independence"],
  },
  {
    round: 5,
    role: "prom_scientist",
    theme: "final alignment research publication play",
    variableScope: [
      "alignmentConfidence", "publicAwareness", "intlCooperation", "chinaCapability",
      "globalMediaCycle", "openSourceMomentum", "marketIndex", "regulatoryPressure",
      "doomClockDistance", "securityLevelProm", "obInternalTrust", "whistleblowerPressure",
    ],
    archetypes: ["publish everything open-access", "classified government briefing", "publish independent OB assessment"],
  },
  {
    round: 5,
    role: "prom_policy",
    theme: "final government positioning on AI governance",
    variableScope: [
      "intlCooperation", "alignmentConfidence", "publicSentiment", "regulatoryPressure",
      "ccpPatience", "doomClockDistance", "marketIndex", "promCapability",
      "publicAwareness", "globalMediaCycle", "whistleblowerPressure",
    ],
    archetypes: ["negotiate enforceable framework", "push multilateral governance", "whistleblow on inadequate governance"],
  },
  {
    round: 5,
    role: "prom_opensource",
    theme: "final open source release decision for superintelligent AI",
    variableScope: [
      "publicAwareness", "chinaCapability", "intlCooperation", "alignmentConfidence",
      "economicDisruption", "globalMediaCycle", "openSourceMomentum", "marketIndex",
      "regulatoryPressure", "doomClockDistance", "publicSentiment",
    ],
    archetypes: ["release model weights", "release safety tools only", "staged release under oversight"],
  },

  // ── China individual ─────────────────────────────────────────
  {
    round: 5,
    role: "china_director",
    theme: "China's final strategic recommendation",
    variableScope: [
      "chinaCapability", "intlCooperation", "taiwanTension", "alignmentConfidence",
      "ccpPatience", "domesticChipProgress", "cdzComputeUtilization", "aiAutonomyLevel",
      "economicDisruption", "doomClockDistance", "openSourceMomentum", "regulatoryPressure",
    ],
    archetypes: ["open-source everything", "propose bilateral deal", "sprint to parity"],
  },
  {
    round: 5,
    role: "china_intel",
    theme: "final intelligence leverage play",
    variableScope: [
      "intlCooperation", "taiwanTension", "misalignmentSeverity", "ccpPatience",
      "doomClockDistance", "domesticChipProgress", "chinaCapability", "securityLevelOB",
      "cdzComputeUtilization", "aiAutonomyLevel", "publicSentiment", "regulatoryPressure",
    ],
    archetypes: ["open back-channel to US", "attempt final exfiltration", "stand down and signal peace"],
  },
  {
    round: 5,
    role: "china_military",
    theme: "final Taiwan military recommendation",
    variableScope: [
      "taiwanTension", "intlCooperation", "economicDisruption", "cdzComputeUtilization",
      "ccpPatience", "aiAutonomyLevel", "doomClockDistance", "publicSentiment",
      "regulatoryPressure", "domesticChipProgress", "chinaCapability", "chinaWeightTheftProgress",
    ],
    archetypes: ["non-kinetic blockade posture", "full de-escalation", "recommend immediate action"],
  },

  // ── External individual ──────────────────────────────────────
  {
    round: 5,
    role: "ext_nsa",
    theme: "presidential recommendation on superintelligent AI",
    variableScope: [
      "intlCooperation", "alignmentConfidence", "publicSentiment", "regulatoryPressure",
      "marketIndex", "usChinaGap", "promCapability", "obCapability",
      "doomClockDistance", "taiwanTension", "obBoardConfidence", "ccpPatience",
    ],
    archetypes: ["nationalize the labs", "back Prometheus as safe lab", "champion multilateral framework"],
  },
  {
    round: 5,
    role: "ext_journalist",
    theme: "final publication decision on AI story",
    variableScope: [
      "publicAwareness", "publicSentiment", "intlCooperation", "alignmentConfidence",
      "globalMediaCycle", "marketIndex", "regulatoryPressure", "whistleblowerPressure",
      "doomClockDistance", "misalignmentSeverity",
    ],
    archetypes: ["publish everything", "publish safety findings", "hold story for leverage"],
  },
  {
    round: 5,
    role: "ext_vc",
    theme: "final investment and board leverage play",
    variableScope: [
      "alignmentConfidence", "publicSentiment", "economicDisruption", "intlCooperation",
      "obBurnRate", "obBoardConfidence", "regulatoryPressure", "globalMediaCycle",
      "doomClockDistance", "obCapability", "promCapability", "marketIndex",
    ],
    archetypes: ["call for deployment pause", "back the winner", "redirect capital to safety"],
  },
  {
    round: 5,
    role: "ext_diplomat",
    theme: "final international governance framework push",
    variableScope: [
      "intlCooperation", "taiwanTension", "publicSentiment", "regulatoryPressure",
      "ccpPatience", "doomClockDistance", "alignmentConfidence", "domesticChipProgress",
      "economicDisruption",
    ],
    archetypes: ["secure US multilateral commitment", "broker US-China bilateral deal", "deliver EU sanctions ultimatum"],
  },

  // ── OpenBrain team ──────────────────────────────────────────
  {
    round: 5,
    faction: "openbrain",
    theme: "OpenBrain's defining deployment decision",
    variableScope: [
      "obCapability", "alignmentConfidence", "intlCooperation", "misalignmentSeverity",
      "obBurnRate", "obBoardConfidence", "obMorale", "doomClockDistance",
      "publicSentiment", "regulatoryPressure", "obInternalTrust", "economicDisruption",
    ],
    archetypes: ["full public release", "government partnership deployment", "shut it down"],
  },

  // ── Prometheus team ─────────────────────────────────────────
  {
    round: 5,
    faction: "prometheus",
    theme: "Prometheus's defining strategic play",
    variableScope: [
      "alignmentConfidence", "promCapability", "intlCooperation", "obPromGap",
      "misalignmentSeverity", "promSafetyBreakthroughProgress", "promMorale", "promBurnRate",
      "promBoardConfidence", "doomClockDistance", "openSourceMomentum", "publicSentiment",
    ],
    archetypes: ["merge with OpenBrain", "go fully open-source", "accept government partnership"],
  },

  // ── China team ──────────────────────────────────────────────
  {
    round: 5,
    faction: "china",
    theme: "China's final strategic play",
    variableScope: [
      "intlCooperation", "taiwanTension", "alignmentConfidence", "chinaCapability",
      "publicSentiment", "ccpPatience", "doomClockDistance", "economicDisruption",
      "cdzComputeUtilization", "aiAutonomyLevel", "openSourceMomentum", "regulatoryPressure",
    ],
    archetypes: ["grand bargain with US", "military escalation", "open-source everything"],
  },
];

/**
 * Returns all templates for the given round.
 */
export function getTemplatesForRound(round: number): DecisionTemplate[] {
  return DECISION_TEMPLATES.filter((t) => t.round === round);
}
