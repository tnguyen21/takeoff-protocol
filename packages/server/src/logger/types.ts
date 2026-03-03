export interface GameEventEnvelope {
  eventId: string;
  schemaVersion: number;
  sessionId: string;
  serverTime: number;
  event: string;
  round: number | null;
  phase: string | null;
  actorId: string | null;
  data: unknown;
}

export interface EventContext {
  round?: number;
  phase?: string;
  actorId?: string;
}

export const EVENT_NAMES = {
  ROOM_CREATED: "room.created",
  PLAYER_JOINED: "player.joined",
  PLAYER_ROLE_SELECTED: "player.role_selected",
  PLAYER_DISCONNECTED: "player.disconnected",
  PLAYER_RECONNECTED: "player.reconnected",
  GAME_STARTED: "game.started",
  GAME_ENDED: "game.ended",
  PHASE_CHANGED: "phase.changed",
  PHASE_PAUSED: "phase.paused",
  PHASE_RESUMED: "phase.resumed",
  PHASE_EXTENDED: "phase.extended",
  PHASE_GM_ADVANCED: "phase.gm_advanced",
  ACTIVITY_REPORT: "activity.report",
  ACTIVITY_PENALTY: "activity.penalty",
  MESSAGE_SENT: "message.sent",
  MESSAGE_NPC: "message.npc",
  DECISION_INDIVIDUAL_SUBMITTED: "decision.individual_submitted",
  DECISION_TEAM_VOTE: "decision.team_vote",
  DECISION_TEAM_LOCKED: "decision.team_locked",
  DECISION_INACTION: "decision.inaction",
  STATE_SNAPSHOT: "state.snapshot",
  STATE_DELTA: "state.delta",
  STATE_GM_OVERRIDE: "state.gm_override",
  THRESHOLD_FIRED: "threshold.fired",
  NPC_TRIGGER_FIRED: "npc_trigger.fired",
  PUBLISH_SUBMITTED: "publish.submitted",
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];
