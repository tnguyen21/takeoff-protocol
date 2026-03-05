// ── Factions & Roles ──

export type Faction = "openbrain" | "prometheus" | "china" | "external";

export type OpenBrainRole = "ob_ceo" | "ob_cto" | "ob_safety" | "ob_security";
export type PrometheusRole = "prom_ceo" | "prom_scientist" | "prom_policy" | "prom_opensource";
export type ChinaRole = "china_director" | "china_intel" | "china_military" | "china_scientist";
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

  // ── Tier 1: Public-Facing ──
  marketIndex: number;           // 0-200, stock market proxy
  regulatoryPressure: number;    // 0-100
  globalMediaCycle: number;      // 0-5 enum: 0=ai-hype, 1=ai-fear, 2=ai-crisis, 3=ai-war, 4=ai-regulation, 5=ai-normalized

  // ── Tier 2: Hidden Engine ──
  chinaWeightTheftProgress: number; // 0-100
  aiAutonomyLevel: number;          // 0-100
  whistleblowerPressure: number;    // 0-100
  openSourceMomentum: number;       // 0-100
  doomClockDistance: number;        // 0-5, counts DOWN (5=safe, 0=catastrophe)

  // ── Tier 3: Per-Faction Internal ──
  // OpenBrain
  obMorale: number;              // 0-100
  obBurnRate: number;            // 0-100
  obBoardConfidence: number;     // 0-100
  // Prometheus
  promMorale: number;            // 0-100
  promBurnRate: number;          // 0-100
  promBoardConfidence: number;   // 0-100
  promSafetyBreakthroughProgress: number; // 0-100
  // China
  cdzComputeUtilization: number; // 0-100
  ccpPatience: number;           // 0-100
  domesticChipProgress: number;  // 0-100
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
  | "breadcrumb"
  | "flavor";

export interface ContentCondition {
  variable: keyof StateVariables;
  operator: "gt" | "lt" | "eq";
  value: number;
}

export interface ContentItem {
  id: string;
  type: ContentItemType;
  round: number;
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
  from: string;        // player id (or npcId for NPC messages)
  fromName: string;
  to: string | null;   // player id (DM) or null (team chat)
  faction: Faction;    // sender's faction (for NPC messages: the target player's faction)
  content: string;
  timestamp: number;
  isTeamChat: boolean;
  isNpc?: boolean;
  channel?: string;    // Slack channel name, e.g. '#research'. Defaults to '#general'. Only set for team chat.
}

// ── NPC Configuration ──

export interface NpcPersona {
  id: string;
  name: string;
  subtitle: string;
  avatarColor: string;
  factions: Faction[];
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
  timerOverrides?: Partial<Record<GamePhase, number>>; // GM-set durations in seconds, per phase
  generationEnabled?: boolean; // GM toggle: true=AI generation on, false=off, undefined=use env config
  firedThresholds?: Set<string>; // IDs of threshold events that have already fired (once-only)
  uiDegradationActive?: boolean;  // flagged by aiAutonomyLevel+alignmentConfidence threshold
  storyBible?: StoryBible; // initialized when generation starts; undefined until then
  generatedRounds?: Partial<Record<number, GeneratedRoundArtifacts>>; // cached LLM artifacts by round
  generationStatus?: Partial<Record<number, GenerationStatus>>; // per-round generation state
}

export interface RoundHistory {
  round: number;
  decisions: Record<string, string>;
  teamDecisions: Record<string, string>;
  stateBefore: StateVariables;
  stateAfter: StateVariables;
}

// ── Story Generation ──

export interface StoryEvent {
  round: number;
  phase: "decision" | "threshold" | "publication" | "message";
  summary: string;
  stateImpact: string;
  narrativeWeight: "major" | "minor";
}

export interface PlayerActionSummary {
  round: number;
  playerId: string;
  faction: Faction;
  role: Role;
  action: string;
  significance: string;
}

export interface RoundArc {
  round: number;
  title: string;
  era: string;
  narrativeBeat: string;
  escalation: string;
  keyTensions: string[];
}

export interface StoryBible {
  scenario: string;
  factions: { faction: Faction; identity: string; tension: string; characters: string[] }[];
  voiceGuides: Record<string, string>;
  roundArcs: RoundArc[];
  events: StoryEvent[];
  playerActions: PlayerActionSummary[];
  activeThreads: string[];
  toneShift: string;
}

// ── Generation Cache ──

export type GenerationStatus = "pending" | "ready" | "failed";

export interface GeneratedRoundArtifacts {
  briefing?: {
    common: string;
    factionVariants: Record<Faction, string>;
  };
  content?: Partial<Record<Faction, AppContent[]>>;
  npcTriggers?: NpcTrigger[];
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

// ── NPC Triggers ──

export interface NpcTriggerCondition {
  variable: keyof StateVariables;
  operator: "gte" | "lte" | "eq";
  value: number;
}

export interface NpcTriggerSchedule {
  round: number;
  phase: GamePhase;
}

export interface NpcTriggerTarget {
  faction?: Faction;
  role?: Role;
}

/**
 * A trigger that delivers an NPC message when a state condition is met
 * or at a specific round/phase. Server resolves `target` to socket IDs.
 */
export interface NpcTrigger {
  /** Unique identifier — also used to deduplicate once-per-game fires. */
  id: string;
  /** NPC persona ID (e.g. '__npc_anon__'). */
  npcId: string;
  /** Message text delivered to the target players. */
  content: string;
  /** State-variable threshold that activates this trigger. */
  condition?: NpcTriggerCondition;
  /** Fire unconditionally at the start of this round/phase. */
  schedule?: NpcTriggerSchedule;
  /**
   * Inclusive round range [start, end] in which this trigger is eligible to fire.
   * Used with condition-based triggers to restrict the active window.
   * E.g. [3, 5] means the trigger can fire in rounds 3, 4, or 5.
   */
  rounds?: [number, number];
  /** Resolved to socket IDs by the server. */
  target: NpcTriggerTarget;
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
