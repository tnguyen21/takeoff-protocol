import { create } from "zustand";
import type { AppContent, Faction, GamePhase, IndividualDecision, Player, Role, StateView, TeamDecision } from "@takeoff/shared";
import { socket } from "../socket.js";

interface LobbyPlayer {
  id: string;
  name: string;
  faction: Faction;
  role: Role;
  connected: boolean;
}

interface GameStore {
  // Connection
  connected: boolean;
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

  // Decisions
  decisions: { individual: IndividualDecision | null; team: TeamDecision | null } | null;
  decisionSubmitted: boolean;
  teamVotes: Record<string, string>; // playerId → optionId (leader only)
  teamLocked: boolean; // true after leader submits final team decision

  // Actions
  setPlayerName: (name: string) => void;
  createRoom: () => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  selectRole: (faction: Faction, role: Role) => Promise<boolean>;
  startGame: () => void;
  submitDecision: (individual: string, teamVote?: string) => void;
  submitLeaderDecision: (teamDecision: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
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
  decisions: null,
  decisionSubmitted: false,
  teamVotes: {},
  teamLocked: false,

  setPlayerName: (name) => set({ playerName: name }),

  createRoom: () =>
    new Promise((resolve) => {
      const doCreate = () => {
        socket.emit("room:create", { gmName: get().playerName ?? "GM" }, (res: { ok: boolean; code?: string }) => {
          if (res.ok && res.code) {
            set({ roomCode: res.code, isGM: true, playerId: socket.id });
            resolve(res.code);
          } else {
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
        socket.emit(
          "room:join",
          { code, name: get().playerName ?? "Player" },
          (res: { ok: boolean; player?: Player }) => {
            if (res.ok) {
              set({ roomCode: code.toUpperCase(), playerId: socket.id });
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

  submitDecision: (individual, teamVote) => {
    socket.emit("decision:submit", { individual, teamVote });
    set({ decisionSubmitted: true });
  },

  submitLeaderDecision: (teamDecision) => {
    socket.emit("decision:leader-submit", { teamDecision });
    set({ teamLocked: true });
  },
}));

// ── Socket Listeners ──

socket.on("connect", () => {
  useGameStore.setState({ connected: true, playerId: socket.id });
});

socket.on("disconnect", () => {
  useGameStore.setState({ connected: false });
});

socket.on("room:state", (data: { players: LobbyPlayer[] }) => {
  useGameStore.setState({ lobbyPlayers: data.players });
});

socket.on("game:phase", (data: { phase: GamePhase; round: number; timer: { endsAt: number; pausedAt?: number } }) => {
  useGameStore.setState({
    phase: data.phase,
    round: data.round,
    timer: data.timer,
    // Reset decision state on new phase
    decisionSubmitted: false,
    teamVotes: {},
    teamLocked: false,
  });
});

socket.on("game:state", (data: { view: StateView }) => {
  useGameStore.setState({ stateView: data.view });
});

socket.on("game:content", (data: { content: AppContent[] }) => {
  useGameStore.setState({ content: data.content });
});

socket.on("game:decisions", (data: { individual: IndividualDecision | null; team: TeamDecision | null }) => {
  useGameStore.setState({ decisions: data });
});

socket.on("decision:votes", (data: { faction: string; votes: Record<string, string> }) => {
  useGameStore.setState({ teamVotes: data.votes });

});
