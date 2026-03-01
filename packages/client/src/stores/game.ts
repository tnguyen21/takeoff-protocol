import { create } from "zustand";
import type { AppContent, AppId, ContentItem, EndingArc, Faction, GameNotification, GamePhase, IndividualDecision, Player, Publication, PublicationType, ResolutionData, Role, RoundHistory, StateVariables, StateView, TeamDecision } from "@takeoff/shared";
import { socket } from "../socket.js";
import { useNotificationsStore } from "./notifications.js";
import { soundManager } from "../sounds/index.js";
import { useUIStore } from "./ui.js";

// ── Session persistence (survives page refresh) ──

const SESSION_KEY = "takeoff:session";

interface StoredSession {
  roomCode: string;
  playerName: string;
  playerId: string; // original socket ID (used as identifier for rejoin)
  isGM: boolean;
}

function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function saveSession(data: StoredSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (e.g. private browsing with storage blocked)
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

interface LobbyPlayer {
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
  briefingText: string | null;

  // Decisions
  decisions: { individual: IndividualDecision | null; team: TeamDecision | null } | null;
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

  // Ending
  endingArcs: EndingArc[];
  endingHistory: RoundHistory[];
  endingFinalState: StateVariables | null;
  endingPlayers: Record<string, Player>;

  // Publications & Notifications
  publications: Publication[];
  notifications: GameNotification[];

  // Actions
  setPlayerName: (name: string) => void;
  publishArticle: (payload: { type: PublicationType; title: string; content: string; source: string }) => void;
  dismissNotification: (id: string) => void;
  createRoom: () => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  rejoinRoom: (code: string, oldPlayerId: string) => void;
  selectRole: (faction: Faction, role: Role) => Promise<boolean>;
  startGame: () => void;
  submitDecision: (individual: string, teamVote?: string) => void;
  submitLeaderDecision: (teamDecision: string) => void;
  gmAdvance: () => void;
  gmPause: () => void;
  gmExtend: () => void;
  gmSetState: (variable: keyof StateVariables, value: number) => void;
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
  endingArcs: [],
  endingHistory: [],
  endingFinalState: null,
  endingPlayers: {},
  publications: [],
  notifications: [],

  setPlayerName: (name) => set({ playerName: name }),

  publishArticle: ({ type, title, content, source }) => {
    socket.emit("publish:submit", { type, title, content, source });
  },

  dismissNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },

  createRoom: () =>
    new Promise((resolve) => {
      const doCreate = () => {
        const gmName = get().playerName ?? "GM";
        socket.emit("room:create", { gmName }, (res: { ok: boolean; code?: string }) => {
          if (res.ok && res.code) {
            set({ roomCode: res.code, isGM: true, playerId: socket.id });
            saveSession({ roomCode: res.code, playerName: gmName, playerId: socket.id!, isGM: true });
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
        const name = get().playerName ?? "Player";
        socket.emit(
          "room:join",
          { code, name },
          (res: { ok: boolean; player?: Player }) => {
            if (res.ok) {
              set({ roomCode: code.toUpperCase(), playerId: socket.id });
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

  submitDecision: (individual, teamVote) => {
    socket.emit("decision:submit", { individual, teamVote });
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

  gmSetState: (variable, value) => {
    socket.emit("gm:set-state", { variable, value });
  },
}));

// ── Socket Listeners ──

socket.on("connect", () => {
  useGameStore.setState({ connected: true, playerId: socket.id });

  // Auto-rejoin if we have a stored session (handles page refresh or network reconnect)
  const state = useGameStore.getState();
  const session = loadSession();

  // Rejoin if we have a saved session AND either:
  // - we were reconnecting (network hiccup during active game), OR
  // - we have a room code (page refresh / socket reconnect during lobby or game)
  const shouldRejoin = session && (state.reconnecting || !!session.roomCode);

  if (shouldRejoin && session) {
    useGameStore.setState({
      reconnecting: true,
      playerName: session.playerName,
      roomCode: session.roomCode,
      isGM: session.isGM,
    });
    useGameStore.getState().rejoinRoom(session.roomCode, session.playerId);
  }
});

socket.on("disconnect", () => {
  const state = useGameStore.getState();
  // Reconnect whenever we're in a room (lobby or active game)
  const inRoom = state.roomCode !== null;
  useGameStore.setState({ connected: false, reconnecting: inRoom });
});

socket.on("room:state", (data: { players: LobbyPlayer[] }) => {
  const prev = useGameStore.getState().lobbyPlayers;
  useGameStore.setState({ lobbyPlayers: data.players });

  // Notify on join/disconnect during active game
  if (useGameStore.getState().phase && useGameStore.getState().phase !== "lobby") {
    for (const player of data.players) {
      const prevPlayer = prev.find((p) => p.id === player.id);
      if (prevPlayer && prevPlayer.connected && !player.connected) {
        useNotificationsStore.getState().addNotification({ appId: "gamestate", title: "Player Disconnected", body: `${player.name} has disconnected.` });
      } else if (prevPlayer && !prevPlayer.connected && player.connected) {
        useNotificationsStore.getState().addNotification({ appId: "gamestate", title: "Player Reconnected", body: `${player.name} has reconnected.` });
      } else if (!prevPlayer && player.connected) {
        useNotificationsStore.getState().addNotification({ appId: "gamestate", title: "Player Joined", body: `${player.name} has joined.` });
      }
    }
  }
});

// Timer warning intervals — cleared on each new phase
let _timerWarningInterval: ReturnType<typeof setInterval> | null = null;
let _warnedAt60 = false;
let _warnedAt30 = false;

socket.on("game:phase", (data: { phase: GamePhase; round: number; timer: { endsAt: number; pausedAt?: number } }) => {
  // Report current round activity to server before any reset
  const uiState = useUIStore.getState();
  socket.emit("activity:report", { opened: Array.from(uiState.openedThisRound) });

  // Reset activity tracking at the start of a new round (briefing phase)
  if (data.phase === "briefing") {
    uiState.resetRoundActivity();
  }

  useGameStore.setState({
    phase: data.phase,
    round: data.round,
    timer: data.timer,
    // Reset decision state on new phase
    decisionSubmitted: false,
    teamVotes: {},
    teamLocked: false,
    // Reset GM per-phase state
    gmExtendUsesRemaining: 2,
    gmDecisionStatus: [],
  });

  // Phase transition sound (skip lobby)
  if (data.phase !== "lobby") {
    soundManager.play("phase-transition");
  }

  // Phase transition notification (skip lobby)
  if (data.phase !== "lobby") {
    // Special notification for Round 4 cross-faction negotiation
    if (data.round === 4 && data.phase === "deliberation") {
      useNotificationsStore.getState().addNotification({
        appId: "signal",
        title: "Cross-Faction Negotiation Open",
        body: "Cross-faction negotiation is open — use Signal to message other factions. You have 7 minutes.",
      });
    } else {
      const phaseLabels: Record<string, string> = {
        briefing: "Briefing Phase",
        play: "Play Phase",
        decision: "Decision Phase",
        resolution: "Resolution Phase",
        deliberation: "Deliberation Phase",
      };
      const label = phaseLabels[data.phase] ?? data.phase;
      const hasTimer = data.timer.endsAt > Date.now();
      const body = hasTimer
        ? `${label} — ${Math.round((data.timer.endsAt - Date.now()) / 60000)} minutes remaining`
        : label;
      useNotificationsStore.getState().addNotification({ appId: "gamestate", title: label, body });
    }
  }

  // Set up timer warnings
  if (_timerWarningInterval) clearInterval(_timerWarningInterval);
  _warnedAt60 = false;
  _warnedAt30 = false;

  if (data.timer.endsAt > Date.now() && !data.timer.pausedAt) {
    _timerWarningInterval = setInterval(() => {
      const remaining = data.timer.endsAt - Date.now();
      if (!_warnedAt60 && remaining <= 60000 && remaining > 30000) {
        _warnedAt60 = true;
        soundManager.play("timer-warning");
        useNotificationsStore.getState().addNotification({ appId: "gamestate", title: "Time Warning", body: "60 seconds remaining in this phase." });
      }
      if (!_warnedAt30 && remaining <= 30000 && remaining > 0) {
        _warnedAt30 = true;
        soundManager.play("timer-warning");
        useNotificationsStore.getState().addNotification({ appId: "gamestate", title: "Time Warning", body: "30 seconds remaining in this phase." });
      }
      if (remaining <= 0) {
        if (_timerWarningInterval) clearInterval(_timerWarningInterval);
      }
    }, 1000);
  }
});

socket.on("game:state", (data: { view: StateView; isFull?: boolean }) => {
  const round = useGameStore.getState().round;
  useGameStore.setState((s) => ({
    ...(data.isFull ? { gmRawState: data.view as unknown as StateVariables } : {}),
    stateView: data.view,
    stateHistory: round > 0 ? { ...s.stateHistory, [round]: data.view } : s.stateHistory,
  }));
});

socket.on("game:content", (data: { content: AppContent[] }) => {
  useGameStore.setState({ content: data.content });
});

// Published content notification (server emits game:publish with article/research/leak metadata)
socket.on("game:publish", (data: { publication?: { type?: string; headline?: string; title?: string }; summary?: string }) => {
  const pub = data.publication;
  if (pub) {
    const headline = pub.headline ?? pub.title ?? "New publication";
    const type = pub.type === "leak" ? "LEAK" : pub.type === "research" ? "Research" : "BREAKING";
    useNotificationsStore.getState().addNotification({ appId: "news", title: `${type}: ${headline}`, body: data.summary ?? "" });
  }
});

socket.on("game:decisions", (data: { individual: IndividualDecision | null; team: TeamDecision | null }) => {
  useGameStore.setState({ decisions: data });
});

socket.on("decision:votes", (data: { faction: string; votes: Record<string, string> }) => {
  useGameStore.setState({ teamVotes: data.votes });
});

socket.on("game:briefing", (data: { text: string }) => {
  useGameStore.setState({ briefingText: data.text });
});

socket.on("game:resolution", (data: ResolutionData) => {
  useGameStore.setState({ resolution: data });
});

socket.on("gm:extend-ack", (data: { usesRemaining: number }) => {
  useGameStore.setState({ gmExtendUsesRemaining: data.usesRemaining });
});

socket.on("gm:decision-status", (data: { submitted: string[] }) => {
  useGameStore.setState({ gmDecisionStatus: data.submitted });
});

socket.on("game:ending", (data: { arcs: EndingArc[]; history: RoundHistory[]; finalState: StateVariables; players: Record<string, Player> }) => {
  useGameStore.setState({
    endingArcs: data.arcs,
    endingHistory: data.history,
    endingFinalState: data.finalState,
    endingPlayers: data.players,
  });
});

socket.on(
  "game:publish",
  (data: { publication: Publication; newsContent: AppContent; twitterContent: AppContent; summary: string }) => {
    useGameStore.setState((state) => ({
      publications: [...state.publications, data.publication],
      // Inject news and twitter content items into the content array
      content: [...state.content, data.newsContent, data.twitterContent],
    }));
  },
);

socket.on("game:notification", (data: GameNotification) => {
  useGameStore.setState((state) => ({
    notifications: [...state.notifications, data],
  }));
});

// Auto-connect on load if we have a stored session (page refresh / history navigation)
if (loadSession()) {
  socket.connect();
}

socket.on("gm:activity", (data: { playerId: string; opened: string[] }) => {
  useGameStore.setState((s) => ({
    gmPlayerActivity: { ...s.gmPlayerActivity, [data.playerId]: data.opened },
  }));
});

// ── Selectors ──

/** Filter the stored AppContent[] for a specific app, merging items from all matching entries. */
export function getContentForApp(content: AppContent[], appId: AppId): ContentItem[] {
  return content.filter((c) => c.app === appId).flatMap((c) => c.items);
}
