import type { AppId, Faction, Role, StateVariables } from "./types.js";

// ── Faction Metadata ──

export interface FactionConfig {
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
    apps: ["slack", "wandb", "sheets", "signal", "memo", "security", "email", "twitter", "news", "gamestate"],
    roles: [
      { id: "ob_ceo", label: "CEO", description: "Moves fast, breaks things. Accountable to board and government.", isLeader: true, optional: false, primaryApps: ["signal", "sheets", "email"] },
      { id: "ob_cto", label: "CTO / Head of Research", description: "The builder. Obsessed with capabilities.", isLeader: false, optional: false, primaryApps: ["wandb", "slack", "sheets"] },
      { id: "ob_safety", label: "Chief Safety Officer", description: "The conscience. Has seen warning signs others dismiss.", isLeader: false, optional: false, primaryApps: ["slack", "memo", "wandb"] },
      { id: "ob_security", label: "Security Lead", description: "Knows the weight theft vulnerabilities.", isLeader: false, optional: true, primaryApps: ["security", "slack"] },
    ],
  },
  {
    id: "prometheus",
    name: "Prometheus",
    minPlayers: 2,
    maxPlayers: 4,
    apps: ["slack", "wandb", "arxiv", "signal", "substack", "email", "twitter", "news", "gamestate"],
    roles: [
      { id: "prom_ceo", label: "CEO", description: "Principled but frustrated. Watching OpenBrain cut corners.", isLeader: true, optional: false, primaryApps: ["signal", "sheets", "email"] },
      { id: "prom_scientist", label: "Chief Scientist", description: "Believes safety IS the path to better AI.", isLeader: false, optional: false, primaryApps: ["wandb", "arxiv", "slack"] },
      { id: "prom_policy", label: "Head of Policy", description: "The bridge to DC. Positioning Prometheus as responsible.", isLeader: false, optional: false, primaryApps: ["email", "signal", "news"] },
      { id: "prom_opensource", label: "Head of Open Source", description: "Believes democratizing AI is morally right and strategically smart.", isLeader: false, optional: true, primaryApps: ["substack", "twitter"] },
    ],
  },
  {
    id: "china",
    name: "China (DeepCent + CCP)",
    minPlayers: 2,
    maxPlayers: 3,
    apps: ["signal", "compute", "intel", "military", "wandb", "news", "gamestate"],
    roles: [
      { id: "china_director", label: "DeepCent Director", description: "Brilliant engineer. Can do more with less.", isLeader: true, optional: false, primaryApps: ["compute", "signal", "wandb"] },
      { id: "china_intel", label: "CCP Intelligence Chief", description: "The spymaster. Eyes on both US labs.", isLeader: false, optional: false, primaryApps: ["intel", "signal"] },
      { id: "china_military", label: "Military Strategist", description: "Taiwan is always on the table.", isLeader: false, optional: true, primaryApps: ["military", "signal"] },
    ],
  },
  {
    id: "external",
    name: "External Stakeholders",
    minPlayers: 2,
    maxPlayers: 4,
    apps: ["signal", "email", "news", "twitter", "gamestate"],
    roles: [
      { id: "ext_nsa", label: "US National Security Advisor", description: "Sees AI as the new Manhattan Project.", isLeader: false, optional: false, primaryApps: ["briefing", "signal"] },
      { id: "ext_journalist", label: "Tech Journalist", description: "Has sources inside both labs. Can force info public.", isLeader: false, optional: false, primaryApps: ["signal", "substack", "twitter"] },
      { id: "ext_vc", label: "Major VC / Investor", description: "Board seats at both labs. Controls capital flows.", isLeader: false, optional: true, primaryApps: ["bloomberg", "email", "signal"] },
      { id: "ext_diplomat", label: "International Diplomat", description: "Pushing for treaties and multilateral safety standards.", isLeader: false, optional: true, primaryApps: ["email", "news", "signal"] },
    ],
  },
];

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
};

// ── Round Count ──

export const TOTAL_ROUNDS = 5;

// ── Scaling Guide ──

export const SCALING_GUIDE: Record<number, Record<Faction, number>> = {
  8:  { openbrain: 2, prometheus: 2, china: 2, external: 2 },
  9:  { openbrain: 2, prometheus: 2, china: 2, external: 3 },
  10: { openbrain: 3, prometheus: 3, china: 2, external: 2 },
  11: { openbrain: 3, prometheus: 3, china: 2, external: 3 },
  12: { openbrain: 3, prometheus: 3, china: 3, external: 3 },
  13: { openbrain: 4, prometheus: 3, china: 3, external: 3 },
  14: { openbrain: 4, prometheus: 3, china: 3, external: 4 },
};
