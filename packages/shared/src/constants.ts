import type { AppId, Faction, Role, StateVariables } from "./types.js";

// ── State Variable Ranges ──

/**
 * Canonical clamping ranges for every StateVariables key.
 * Used by clampState(), server GM validation, and client bar rendering.
 *
 * Note: usChinaGap and obPromGap use [-8, 16] (asymmetric by design —
 * gap cannot be as negative as positive).
 */
export const STATE_VARIABLE_RANGES: Readonly<Record<keyof StateVariables, [number, number]>> = {
  obCapability: [0, 100],
  promCapability: [0, 100],
  chinaCapability: [0, 100],
  usChinaGap: [-8, 16],
  obPromGap: [-8, 16],
  alignmentConfidence: [0, 100],
  misalignmentSeverity: [0, 100],
  publicAwareness: [0, 100],
  publicSentiment: [-100, 100],
  economicDisruption: [0, 100],
  taiwanTension: [0, 100],
  obInternalTrust: [0, 100],
  securityLevelOB: [1, 5],
  securityLevelProm: [1, 5],
  intlCooperation: [0, 100],
  marketIndex: [0, 200],
  regulatoryPressure: [0, 100],
  globalMediaCycle: [0, 5],
  chinaWeightTheftProgress: [0, 100],
  aiAutonomyLevel: [0, 100],
  whistleblowerPressure: [0, 100],
  openSourceMomentum: [0, 100],
  doomClockDistance: [0, 5],
  obMorale: [0, 100],
  obBurnRate: [0, 100],
  obBoardConfidence: [0, 100],
  promMorale: [0, 100],
  promBurnRate: [0, 100],
  promBoardConfidence: [0, 100],
  promSafetyBreakthroughProgress: [0, 100],
  cdzComputeUtilization: [0, 100],
  ccpPatience: [0, 100],
  domesticChipProgress: [0, 100],
};

// ── Faction Metadata ──

interface FactionConfig {
  id: Faction;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  apps: AppId[];
  roles: RoleConfig[];
}

export interface RoleConfig {
  id: Role;
  label: string;
  description: string;
  goals: string[];
  isLeader: boolean;
  optional: boolean;
  primaryApps: AppId[];
}

export const FACTIONS: FactionConfig[] = [
  {
    id: "openbrain",
    name: "OpenBrain",
    minPlayers: 2,
    maxPlayers: 4,
    apps: ["slack", "wandb", "sheets", "signal", "memo", "security", "email", "twitter", "news", "arxiv", "gamestate"],
    roles: [
      { id: "ob_ceo", label: "CEO", description: "Moves fast, breaks things. Accountable to board and government. Believes speed is safety — if we don't build it, China will.", goals: ["Maintain OpenBrain's capability lead at all costs", "Ship product before Prometheus or China catches up", "Keep board and government confident in your leadership", "If there's no coalition: YOU should be the one controlling AGI"], isLeader: true, optional: false, primaryApps: ["signal", "sheets", "email"] },
      { id: "ob_cto", label: "CTO / Head of Research", description: "The builder. Obsessed with capabilities. Thinks alignment concerns are overblown. Wants Agent-4 yesterday.", goals: ["Push the frontier on AI capabilities", "Maximize R&D speed and compute efficiency", "Prove that safety concerns are unnecessarily slowing progress", "Be the architect of the first true AGI"], isLeader: false, optional: false, primaryApps: ["wandb", "slack", "sheets"] },
      { id: "ob_safety", label: "Chief Safety Officer", description: "The conscience. Hired to do alignment work but constantly deprioritized. Has seen warning signs others dismiss.", goals: ["Prevent catastrophic misalignment", "Convince leadership to take safety seriously", "Gather evidence of risks without being sidelined", "Decide when to escalate internally — or leak"], isLeader: false, optional: false, primaryApps: ["slack", "memo", "wandb"] },
      { id: "ob_security", label: "Security Lead", description: "Knows the weight theft vulnerabilities. Wants resources but can't get them because capabilities is always the priority.", goals: ["Protect OpenBrain's model weights from theft", "Prevent espionage by China and competitors", "Secure adequate resources for security"], isLeader: false, optional: true, primaryApps: ["security", "slack"] },
    ],
  },
  {
    id: "prometheus",
    name: "Prometheus",
    minPlayers: 2,
    maxPlayers: 4,
    apps: ["slack", "wandb", "arxiv", "signal", "substack", "email", "memo", "twitter", "news", "gamestate"],
    roles: [
      { id: "prom_ceo", label: "CEO", description: "Principled but frustrated. Watching OpenBrain cut corners and get rewarded. Facing board pressure to move faster.", goals: ["Close the capability gap with OpenBrain responsibly", "Position Prometheus as the 'safe' choice for government", "Maintain your principles without becoming irrelevant", "If there's no coalition: Prometheus should lead the AI transition"], isLeader: true, optional: false, primaryApps: ["signal", "sheets", "email"] },
      { id: "prom_scientist", label: "Chief Scientist", description: "Believes safety IS the path to better AI. Has novel alignment approaches that might work — if given time and compute.", goals: ["Solve the alignment problem before it's too late", "Prove that safety research leads to better models", "Decide whether to share breakthroughs or keep them proprietary", "Make Prometheus the lab that builds SAFE AGI"], isLeader: false, optional: false, primaryApps: ["wandb", "arxiv", "slack"] },
      { id: "prom_policy", label: "Head of Policy", description: "The bridge to DC. Positioning Prometheus as the 'responsible' choice. Wants government to constrain OpenBrain.", goals: ["Get government to favor Prometheus over OpenBrain", "Push for regulation that hinders reckless competitors", "Build alliances with safety-conscious policymakers", "Use policy as a weapon in the capability race"], isLeader: false, optional: false, primaryApps: ["email", "signal", "news"] },
      { id: "prom_opensource", label: "Head of Open Source", description: "Believes democratizing AI is both morally right and strategically smart. Tension: open-sourcing helps China too.", goals: ["Democratize AI access to prevent concentrated power", "Use open source to undermine OpenBrain's moat", "Decide how much to release without helping China too much", "Make Prometheus the hero of the AI story"], isLeader: false, optional: true, primaryApps: ["substack", "twitter"] },
    ],
  },
  {
    id: "china",
    name: "China (DeepCent + CCP)",
    minPlayers: 2,
    maxPlayers: 4,
    apps: ["slack", "signal", "compute", "intel", "military", "wandb", "memo", "news", "twitter", "arxiv", "gamestate"],
    roles: [
      { id: "china_director", label: "DeepCent Director", description: "Brilliant engineer. Can do more with less. Has stolen weights and a massive CDZ. Playing a different game than US labs.", goals: ["Close the gap with US frontier models", "Leverage stolen weights and state resources effectively", "Decide when to go open-source vs. keep capabilities secret", "Ensure China — not the US — leads the AI era"], isLeader: true, optional: false, primaryApps: ["compute", "signal", "wandb"] },
      { id: "china_intel", label: "CCP Intelligence Chief", description: "Evaluate whether to steal Agent-3/4 weights — the prize that could leapfrog everything.", goals: ["Acquire US AI capabilities through espionage", "Assess the risk/reward of weight theft operations", "Maintain plausible deniability for China's progress", "Give China the decisive edge through intelligence superiority"], isLeader: false, optional: false, primaryApps: ["intel", "signal"] },
      { id: "china_military", label: "Military Strategist", description: "Taiwan is always on the table. Cyber is always active. Evaluates kinetic and non-kinetic options.", goals: ["Prepare for Taiwan contingency scenarios", "Use military posture to influence AI negotiations", "Ensure AI advantage translates to geopolitical dominance", "Be ready if the US tries to cut off China's chip supply"], isLeader: false, optional: true, primaryApps: ["military", "signal"] },
      { id: "china_scientist", label: "DeepCent Chief Scientist", description: "Dr. Liu Yang. Runs DeepCent's alignment and capability research. Caught between scientific integrity and political pressure.", goals: ["Close alignment evaluation gaps before they become crises", "Balance capability progress with safety assurance", "Keep Beijing's trust while doing rigorous science", "Decide how much to mirror Western safety methodology"], isLeader: false, optional: true, primaryApps: ["wandb", "slack", "signal"] },
    ],
  },
  {
    id: "external",
    name: "External Stakeholders",
    minPlayers: 2,
    maxPlayers: 4,
    apps: ["signal", "email", "memo", "news", "twitter", "arxiv", "gamestate"],
    roles: [
      { id: "ext_nsa", label: "US National Security Advisor", description: "Sees AI as the new Manhattan Project. Deciding which lab to back, whether to invoke emergency powers, how to handle China.", goals: ["Ensure US dominance in AI over China at all costs", "Decide which lab to back — or force them to merge", "Manage the Taiwan flashpoint while racing for AGI", "Control the most powerful technology in history"], isLeader: false, optional: false, primaryApps: ["briefing", "signal"] },
      { id: "ext_journalist", label: "Tech Journalist", description: "Has sources inside both labs and the government. The only person who can force information public. Publishing changes the game.", goals: ["Communicate the truth about the AI race to the public", "Cultivate sources and decide what to publish when", "Balance public interest against market/political stability", "Be the one who broke the story — whatever it is"], isLeader: false, optional: false, primaryApps: ["signal", "substack", "twitter"] },
      { id: "ext_vc", label: "Major VC / Investor", description: "Board seats at both labs. Controls capital flows. Wants returns but also doesn't want the world to end.", goals: ["Maximize returns while managing existential risk", "Back the winning lab — or hedge across both", "Use board influence to shape strategy", "Come out on top, financially and reputationally"], isLeader: false, optional: true, primaryApps: ["bloomberg", "email", "signal"] },
      { id: "ext_diplomat", label: "International Diplomat", description: "Represents EU/allies. Pushing for treaties, multilateral safety standards, compute governance. No one listens until the crisis hits.", goals: ["Build international consensus on AI safety", "Prevent unilateral dominance by any single nation or lab", "Advocate for pause treaties and compute governance", "Be the voice of cooperation in a race to the finish"], isLeader: false, optional: true, primaryApps: ["email", "news", "signal"] },
    ],
  },
];

// ── Leader Roles ──

const LEADER_ROLES: readonly Role[] = FACTIONS.flatMap(f => f.roles).filter(r => r.isLeader).map(r => r.id);

export function isLeaderRole(role: Role): boolean {
  return LEADER_ROLES.includes(role);
}

// ── Phase Durations (seconds) ──

export const PHASE_DURATIONS: Record<string, number> = {
  briefing: 120,
  intel: 300,
  deliberation: 300,
  decision: 300,
  resolution: 180,
};

// Round 4 has a special structure with cross-faction negotiation
export const ROUND4_PHASE_DURATIONS: Record<string, number> = {
  briefing: 180,
  intel: 300,
  deliberation: 420, // 7 min for cross-faction negotiation
  decision: 300,
  resolution: 300,
};

// ── Initial State ──

export const INITIAL_STATE: StateVariables = {
  obCapability: 30,           // Agent-1 level
  promCapability: 28,         // Comparable to Agent-1
  chinaCapability: 18,        // ~6mo behind
  usChinaGap: 7,              // months
  obPromGap: 1,               // months (OB slightly ahead)
  alignmentConfidence: 55,
  misalignmentSeverity: 0,    // not yet relevant
  publicAwareness: 10,
  publicSentiment: 30,        // mildly positive (AI hype)
  economicDisruption: 20,
  taiwanTension: 20,
  obInternalTrust: 65,
  securityLevelOB: 2,         // SL2-3
  securityLevelProm: 3,
  intlCooperation: 5,

  // ── Tier 1: Public-Facing ──
  marketIndex: 140,
  regulatoryPressure: 10,
  globalMediaCycle: 0,        // ai-hype

  // ── Tier 2: Hidden Engine ──
  chinaWeightTheftProgress: 0,
  aiAutonomyLevel: 10,
  whistleblowerPressure: 5,
  openSourceMomentum: 15,
  doomClockDistance: 5,       // safe at start

  // ── Tier 3: Per-Faction Internal ──
  obMorale: 75,
  obBurnRate: 50,
  obBoardConfidence: 70,
  promMorale: 80,
  promBurnRate: 40,
  promBoardConfidence: 65,
  promSafetyBreakthroughProgress: 20,
  cdzComputeUtilization: 40,
  ccpPatience: 60,
  domesticChipProgress: 15,
};

// ── Round Count ──

export const TOTAL_ROUNDS = 5;

// ── Scaling Guide ──

type ScalingGuideEntry = Record<Faction, number>;

export const SCALING_GUIDE: Record<number, ScalingGuideEntry> = {
  8:  { openbrain: 2, prometheus: 2, china: 2, external: 2 },
  9:  { openbrain: 2, prometheus: 2, china: 2, external: 3 },
  10: { openbrain: 3, prometheus: 3, china: 2, external: 2 },
  11: { openbrain: 3, prometheus: 3, china: 2, external: 3 },
  12: { openbrain: 3, prometheus: 3, china: 3, external: 3 },
  13: { openbrain: 4, prometheus: 3, china: 3, external: 3 },
  14: { openbrain: 4, prometheus: 3, china: 3, external: 4 },
};

/**
 * Safe accessor for SCALING_GUIDE. Clamps out-of-range player counts to [8, 14]
 * so callers never receive undefined.
 */
export function getScalingGuide(playerCount: number): ScalingGuideEntry {
  const entry = SCALING_GUIDE[playerCount];
  if (!entry) {
    const clamped = Math.min(14, Math.max(8, playerCount));
    return SCALING_GUIDE[clamped]!;
  }
  return entry;
}
