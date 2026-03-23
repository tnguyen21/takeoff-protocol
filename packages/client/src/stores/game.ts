import { create } from "zustand";
import type { AppContent, EndingArc, Faction, GameNotification, GamePhase, IndividualDecision, Player, PlayerTweet, Publication, PublicationAngle, PublicationTarget, PublicationType, ResolutionData, Role, RoundHistory, StateVariables, StateView, TeamDecision } from "@takeoff/shared";
import { socket } from "../socket.js";
import { loadSession, saveSession, clearSession } from "./session.js";

export interface LobbyPlayer {
  id: string;
  name: string;
  faction: Faction | null;
  role: Role | null;
  connected: boolean;
}

interface GameStore {
  // Connection
  connected: boolean;
  reconnecting: boolean; // true while attempting to rejoin after disconnect
  roomCode: string | null;
  isGM: boolean;
  playerId: string | null;
  playerName: string | null;

  // Lobby
  lobbyPlayers: LobbyPlayer[];
  selectedFaction: Faction | null;
  selectedRole: Role | null;

  // Game
  phase: GamePhase | null;
  round: number;
  timer: { endsAt: number; pausedAt?: number };
  stateView: StateView | null;
  content: AppContent[];
  playerTweets: PlayerTweet[];
  briefingText: string | null;

  // Decisions
  decisions: { individual: IndividualDecision | null; individual2: IndividualDecision | null; team: TeamDecision | null } | null;
  decisionSubmitted: boolean;
  teamVotes: Record<string, string>; // playerId → optionId (leader only)
  teamLocked: boolean; // true after leader submits final team decision

  // Resolution
  resolution: ResolutionData | null;

  // Round state history (accumulated per-round fog-filtered state views)
  stateHistory: Record<number, StateView>;

  // GM-specific
  gmRawState: StateVariables | null; // true unfogged state (GM only)
  gmDecisionStatus: string[]; // player IDs that have submitted (GM only)
  gmExtendUsesRemaining: number; // 2 initially, decrements on extend (GM only)
  gmPlayerActivity: Record<string, string[]>; // playerId → opened app IDs (GM only)
  gmTimerOverrides: Partial<Record<GamePhase, number>>; // GM-set phase durations in seconds
  gmGenerationEnabled: boolean | null; // null = not configured (use env default)

  // Ending
  endingArcs: EndingArc[];
  endingHistory: RoundHistory[];
  endingFinalState: StateVariables | null;
  endingPlayers: Record<string, Player>;

  // Publications & Notifications
  publications: Publication[];
  notifications: GameNotification[];

  // Lobby errors
  lobbyError: string | null;
  clearLobbyError: () => void;

  // Actions
  setPlayerName: (name: string) => void;
  publishArticle: (payload: { type: PublicationType; title: string; content: string; source: string; angle?: PublicationAngle; targetFaction?: PublicationTarget }) => void;
  generatePublicationDraft: (payload: { angle: PublicationAngle; targetFaction: PublicationTarget }) => Promise<{ ok: boolean; title?: string; body?: string; error?: string }>;
  dismissNotification: (id: string) => void;
  createRoom: () => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  rejoinRoom: (code: string, oldPlayerId: string) => void;
  selectRole: (faction: Faction, role: Role) => Promise<boolean>;
  startGame: () => void;
  startTutorial: () => void;
  endTutorial: () => void;
  submitDecision: (individual: string, individual2?: string, teamVote?: string) => void;
  submitLeaderDecision: (teamDecision: string) => void;
  gmAdvance: () => void;
  gmPause: () => void;
  gmExtend: () => void;
  gmEndGame: () => void;
  gmSetState: (variable: keyof StateVariables, value: number) => void;
  gmJump: (round: number, phase: string) => void;
  gmSetTimers: (overrides: Partial<Record<GamePhase, number>>) => void;
  gmSetGeneration: (enabled: boolean) => void;
  devFillBots: () => Promise<{ ok: boolean; error?: string }>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  reconnecting: false,
  roomCode: null,
  isGM: false,
  playerId: null,
  playerName: null,
  lobbyPlayers: [],
  selectedFaction: null,
  selectedRole: null,
  phase: null,
  round: 0,
  timer: { endsAt: 0 },
  stateView: null,
  content: [],
  playerTweets: [],
  decisions: null,
  decisionSubmitted: false,
  teamVotes: {},
  teamLocked: false,
  resolution: null,
  briefingText: null,
  stateHistory: {},
  gmRawState: null,
  gmDecisionStatus: [],
  gmExtendUsesRemaining: 2,
  gmPlayerActivity: {},
  gmTimerOverrides: {},
  gmGenerationEnabled: null,
  endingArcs: [],
  endingHistory: [],
  endingFinalState: null,
  endingPlayers: {},
  publications: [],
  notifications: [],
  lobbyError: null,

  clearLobbyError: () => set({ lobbyError: null }),

  setPlayerName: (name) => set({ playerName: name }),

  publishArticle: ({ type, title, content, source, angle, targetFaction }) => {
    socket.emit("publish:submit", { type, title, content, source, angle, targetFaction });
  },

  generatePublicationDraft: ({ angle, targetFaction }) =>
    new Promise((resolve) => {
      socket.emit(
        "publish:draft-generate",
        { angle, targetFaction },
        (res: { ok: boolean; title?: string; body?: string; error?: string }) => {
          resolve(res);
        },
      );
    }),

  dismissNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },

  createRoom: () =>
    new Promise((resolve) => {
      const doCreate = () => {
        const gmName = get().playerName ?? "GM";
        socket.emit("room:create", { gmName }, (res: { ok: boolean; code?: string; error?: string }) => {
          if (res.ok && res.code) {
            set({ roomCode: res.code, isGM: true, playerId: socket.id, playerTweets: [] });
            saveSession({ roomCode: res.code, playerName: gmName, playerId: socket.id!, isGM: true });
            resolve(res.code);
          } else {
            set({ lobbyError: res.error || "Failed to create room" });
            resolve(null);
          }
        });
      };
      if (socket.connected) {
        doCreate();
      } else {
        socket.connect();
        socket.once("connect", doCreate);
      }
    }),

  joinRoom: (code) =>
    new Promise((resolve) => {
      const doJoin = () => {
        const name = get().playerName ?? "Player";
        socket.emit(
          "room:join",
          { code, name },
          (res: { ok: boolean; player?: Player }) => {
            if (res.ok) {
              set({ roomCode: code.toUpperCase(), playerId: socket.id, playerTweets: [] });
              saveSession({ roomCode: code.toUpperCase(), playerName: name, playerId: socket.id!, isGM: false });
              resolve(true);
            } else {
              resolve(false);
            }
          },
        );
      };
      if (socket.connected) {
        doJoin();
      } else {
        socket.connect();
        socket.once("connect", doJoin);
      }
    }),

  rejoinRoom: (code, oldPlayerId) => {
    socket.emit(
      "room:rejoin",
      { code, playerId: oldPlayerId },
      (res: { ok: boolean; player?: { faction: Faction | null; role: Role | null; isLeader: boolean } }) => {
        if (res.ok) {
          const updates: Partial<GameStore> = {
            reconnecting: false,
            playerId: socket.id,
          };
          if (res.player) {
            updates.selectedFaction = res.player.faction;
            updates.selectedRole = res.player.role;
          }
          set(updates);
          // Update persisted session with new socket ID
          const state = get();
          if (state.roomCode && state.playerName) {
            saveSession({ roomCode: state.roomCode, playerName: state.playerName, playerId: socket.id!, isGM: state.isGM });
          }
        } else {
          // Rejoin failed — clear session so we don't loop
          set({ reconnecting: false });
          clearSession();
        }
      },
    );
  },

  selectRole: (faction, role) =>
    new Promise((resolve) => {
      socket.emit("room:select-role", { faction, role }, (res: { ok: boolean }) => {
        if (res.ok) {
          set({ selectedFaction: faction, selectedRole: role });
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }),

  startGame: () => {
    socket.emit("game:start", {}, () => {});
  },

  startTutorial: () => {
    socket.emit("gm:start-tutorial", {}, () => {});
  },

  endTutorial: () => {
    socket.emit("gm:end-tutorial");
  },

  submitDecision: (individual, individual2, teamVote) => {
    socket.emit("decision:submit", { individual, individual2, teamVote });
    set({ decisionSubmitted: true });
  },

  submitLeaderDecision: (teamDecision) => {
    socket.emit("decision:leader-submit", { teamDecision });
    set({ teamLocked: true });
  },

  gmAdvance: () => {
    socket.emit("gm:advance");
  },

  gmPause: () => {
    socket.emit("gm:pause");
  },

  gmExtend: () => {
    socket.emit("gm:extend");
  },

  gmEndGame: () => {
    socket.emit("gm:end-game");
  },

  gmSetState: (variable, value) => {
    socket.emit("gm:set-state", { variable, value });
  },

  gmJump: (round, phase) => {
    socket.emit("gm:jump", { round, phase });
  },

  gmSetTimers: (overrides) => {
    socket.emit("gm:set-timers", overrides);
  },

  gmSetGeneration: (enabled) => {
    socket.emit("gm:set-generation", { enabled });
  },

  devFillBots: () =>
    new Promise((resolve) => {
      socket.emit("dev:fill-bots", (res: { ok: boolean; error?: string }) => {
        resolve(res);
      });
    }),
}));

// Side-effect import: registers all socket listeners when the store is imported
import "./gameListeners.js";
