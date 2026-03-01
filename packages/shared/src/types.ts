// ── Factions & Roles ──

export type Faction = "openbrain" | "prometheus" | "china" | "external";

export type OpenBrainRole = "ob_ceo" | "ob_cto" | "ob_safety" | "ob_security";
export type PrometheusRole = "prom_ceo" | "prom_scientist" | "prom_policy" | "prom_opensource";
export type ChinaRole = "china_director" | "china_intel" | "china_military";
export type ExternalRole = "ext_nsa" | "ext_journalist" | "ext_vc" | "ext_diplomat";
export type Role = OpenBrainRole | PrometheusRole | ChinaRole | ExternalRole;

// ── Game Phases ──

export type GamePhase =
  | "lobby"
  | "briefing"
  | "intel"
  | "deliberation"
  | "decision"
  | "resolution"
  | "ending";

// ── Players ──

export interface Player {
  id: string;
  name: string;
  faction: Faction | null;
  role: Role | null;
  isLeader: boolean;
  influenceTokens: number;
  connected: boolean;
}

// ── State Variables ──

export interface StateVariables {
  obCapability: number;        // Agent level (100-scale, maps to Agent 1-5)
  promCapability: number;
  chinaCapability: number;
  usChinaGap: number;          // months, positive = US ahead
  obPromGap: number;           // months, positive = OB ahead
  alignmentConfidence: number; // 0-100
  misalignmentSeverity: number; // 0-100
  publicAwareness: number;     // 0-100
  publicSentiment: number;     // -100 to +100
  economicDisruption: number;  // 0-100
  taiwanTension: number;       // 0-100
  obInternalTrust: number;     // 0-100
  securityLevelOB: number;     // 1-5 (SL1-SL5)
  securityLevelProm: number;   // 1-5
  intlCooperation: number;     // 0-100
}

// ── Fog of War ──

export type Accuracy = "exact" | "estimate" | "hidden";

export interface FogVariable {
  value: number;
  accuracy: Accuracy;
  confidence?: number; // ±N for estimates
}

export type StateView = {
  [K in keyof StateVariables]: FogVariable;
};

// ── Decisions ──

export interface StateEffect {
  variable: keyof StateVariables;
  delta: number;
  condition?: {
    variable: keyof StateVariables;
    threshold: number;
    operator: "gt" | "lt" | "eq";
    multiplier: number;
  };
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  effects: StateEffect[];
}

export interface IndividualDecision {
  role: Role;
  prompt: string;
  options: DecisionOption[];
}

export interface TeamDecision {
  faction: Faction;
  prompt: string;
  options: DecisionOption[];
}

export interface RoundDecisions {
  round: number;
  individual: IndividualDecision[];
  team: TeamDecision[];
}

// ── Content ──

export type AppId =
  | "slack"
  | "signal"
  | "wandb"
  | "news"
  | "twitter"
  | "email"
  | "sheets"
  | "gamestate"
  | "security"
  | "bloomberg"
  | "briefing"
  | "wechat"
  | "intel"
  | "military"
  | "arxiv"
  | "substack"
  | "memo"
  | "compute";

export type ContentItemType =
  | "message"
  | "headline"
  | "memo"
  | "chart"
  | "tweet"
  | "document"
  | "row"; // spreadsheet row

export type ContentClassification =
  | "critical"
  | "context"
  | "red-herring"
  | "breadcrumb";

export interface ContentCondition {
  variable: keyof StateVariables;
  operator: "gt" | "lt" | "eq";
  value: number;
}

export interface ContentItem {
  id: string;
  type: ContentItemType;
  sender?: string;
  channel?: string;
  subject?: string;
  body: string;
  timestamp: string;
  classification?: ContentClassification;
  condition?: ContentCondition;
}

export interface AppContent {
  faction: Faction;
  role?: Role;
  app: AppId;
  items: ContentItem[];
}

export interface RoundContent {
  round: number;
  briefing: {
    common: string;
    factionVariants?: Partial<Record<Faction, string>>;
  };
  apps: AppContent[];
}

// ── Messages (DM / Team Chat) ──

export interface GameMessage {
  id: string;
  from: string;       // player id
  fromName: string;
  to: string | null;   // player id (DM) or null (team chat)
  faction: Faction;    // sender's faction
  content: string;
  timestamp: number;
  isTeamChat: boolean;
}

// ── Publications ──

export type PublicationType = "article" | "leak" | "research";

export interface Publication {
  id: string;
  type: PublicationType;
  title: string;
  content: string;
  source: string;
  publishedBy: Role;
  publishedAt: number;
}

// ── Notifications ──

export interface GameNotification {
  id: string;
  summary: string;
  from: string;
  timestamp: number;
}

// ── Room & Game ──

export interface GameRoom {
  code: string;
  phase: GamePhase;
  round: number;
  timer: { endsAt: number; pausedAt?: number };
  players: Record<string, Player>;
  gmId: string | null;
  state: StateVariables;
  decisions: Record<string, string>; // playerId → chosen optionId
  teamDecisions: Record<string, string>; // faction → chosen optionId
  teamVotes: Record<string, Record<string, string>>; // faction → { playerId → optionId }
  history: RoundHistory[];
  publications: Publication[];
  messages: GameMessage[]; // all messages for replay on reconnect
  playerActivity?: Record<string, string[]>; // playerId → list of AppId strings opened this round
}

export interface RoundHistory {
  round: number;
  decisions: Record<string, string>;
  teamDecisions: Record<string, string>;
  stateBefore: StateVariables;
  stateAfter: StateVariables;
}

// ── Resolution ──

export interface StateDelta {
  variable: keyof StateVariables;
  label: string;
  oldValue: number;
  newValue: number;
  delta: number;
  accuracy: Accuracy;
}

export interface ResolutionData {
  narrative: string;
  stateDeltas: StateDelta[];
  teamDecisions: Record<string, { optionId: string; label: string }>;
}

// ── Ending Arcs ──

export type EndingArcId =
  | "aiRace"
  | "alignment"
  | "control"
  | "usChinaRelations"
  | "publicReaction"
  | "economy"
  | "prometheusFate"
  | "taiwan"
  | "openSource";

export interface EndingArc {
  id: EndingArcId;
  label: string;
  spectrum: string[];   // ordered outcomes from worst to best
  result: number;        // index into spectrum
  narrative: string;     // generated text for this arc
}
