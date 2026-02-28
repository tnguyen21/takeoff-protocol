import { create } from "zustand";
import type { Faction, GamePhase, Player, Role, StateView } from "@takeoff/shared";
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

  // Actions
  setPlayerName: (name: string) => void;
  createRoom: () => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  selectRole: (faction: Faction, role: Role) => Promise<boolean>;
  startGame: () => void;
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

  setPlayerName: (name) => set({ playerName: name }),

  createRoom: () =>
    new Promise((resolve) => {
      socket.connect();
      socket.emit("room:create", { gmName: get().playerName ?? "GM" }, (res: { ok: boolean; code?: string }) => {
        if (res.ok && res.code) {
          set({ roomCode: res.code, isGM: true, playerId: socket.id });
          resolve(res.code);
        } else {
          resolve(null);
        }
      });
    }),

  joinRoom: (code) =>
    new Promise((resolve) => {
      socket.connect();
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
  });
});

socket.on("game:state", (data: { view: StateView }) => {
  useGameStore.setState({ stateView: data.view });
});
