import { useGameStore, type LobbyPlayer } from "./game.js";
import { loadSession, clearSession, saveSession } from "./session.js";
import { socket } from "../socket.js";
import { useNotificationsStore } from "./notifications.js";
import { soundManager } from "../sounds/index.js";
import { useUIStore } from "./ui.js";
import { appendPlayerTweet } from "./playerTweets.js";
import type { AppContent, EndingArc, GameNotification, GamePhase, IndividualDecision, Player, PlayerTweet, Publication, PublicationType, ResolutionData, RoundHistory, StateVariables, StateView, TeamDecision } from "@takeoff/shared";

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

// Global monotonic counter for ordering content + player messages
let _globalSeq = 0;
export function nextSeq(): number { return ++_globalSeq; }

// Preserve _seq for content items across game:content re-deliveries
const _contentSeqMap = new Map<string, number>();

socket.on("game:content", (data: { content: AppContent[] }) => {
  const stamped = data.content.map((appContent) => ({
    ...appContent,
    items: appContent.items.map((item) => {
      const existing = _contentSeqMap.get(item.id);
      if (existing !== undefined) return { ...item, _seq: existing };
      const seq = nextSeq();
      _contentSeqMap.set(item.id, seq);
      return { ...item, _seq: seq };
    }),
  }));
  useGameStore.setState({ content: stamped });
});

// Incremental content delivery — appends items as each generation tier resolves.
// The full game:content event at phase transition serves as the authoritative catch-up.
socket.on("game:content-batch", (data: { content: AppContent[] }) => {
  const stamped = data.content.map((appContent) => ({
    ...appContent,
    items: appContent.items.map((item) => {
      const existing = _contentSeqMap.get(item.id);
      if (existing !== undefined) return { ...item, _seq: existing };
      const seq = nextSeq();
      _contentSeqMap.set(item.id, seq);
      return { ...item, _seq: seq };
    }),
  }));
  useGameStore.setState((state) => {
    // Deduplicate: filter out items already present in state
    const existingIds = new Set(state.content.flatMap((ac) => ac.items.map((i) => i.id)));
    const deduped = stamped
      .map((ac) => ({ ...ac, items: ac.items.filter((i) => !existingIds.has(i.id)) }))
      .filter((ac) => ac.items.length > 0);
    if (deduped.length === 0) return state;
    return { content: [...state.content, ...deduped] };
  });
});

type GamePublishPayload =
  | { publication?: { type?: string; headline?: string; title?: string }; summary?: string }
  | { publication: Publication; newsContent: AppContent; twitterContent: AppContent; summary: string };

// Published content notification + content injection.
socket.on("game:publish", (data: GamePublishPayload) => {
  const pub = data.publication;
  if (pub) {
    const headline = (pub as any).headline ?? (pub as any).title ?? "New publication";
    const pubType = (pub as any).type as PublicationType | undefined;
    const typeLabel = pubType === "leak" ? "LEAK" : pubType === "research" ? "Research" : "BREAKING";
    useNotificationsStore.getState().addNotification({ appId: "news", title: `${typeLabel}: ${headline}`, body: data.summary ?? "" });
  }

  if ("newsContent" in data && "twitterContent" in data) {
    useGameStore.setState((state) => ({
      publications: [...state.publications, data.publication],
      content: [...state.content, data.newsContent, data.twitterContent],
    }));
  }
});

socket.on("game:decisions", (data: { individual: IndividualDecision | null; individual2: IndividualDecision | null; team: TeamDecision | null }) => {
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

socket.on("game:notification", (data: GameNotification) => {
  useGameStore.setState((state) => ({
    notifications: [...state.notifications, data],
  }));
});

socket.on("tweet:receive", (tweet: PlayerTweet) => {
  useGameStore.setState((state) => {
    const nextTweets = appendPlayerTweet(state.playerTweets, tweet);
    if (nextTweets === state.playerTweets) {
      return state;
    }
    return {
      playerTweets: nextTweets,
    };
  });
});

// Auto-connect on load if we have a stored session (page refresh / history navigation)
if (loadSession()) {
  socket.connect();
}

socket.on("game:generation-status", (data: { round: number; status: string; message: string }) => {
  if (data.status === "degraded") {
    useNotificationsStore.getState().addNotification({
      appId: "gamestate",
      title: "Content Generation",
      body: data.message,
    });
  }
});

socket.on("gm:activity", (data: { playerId: string; opened: string[] }) => {
  useGameStore.setState((s) => ({
    gmPlayerActivity: { ...s.gmPlayerActivity, [data.playerId]: data.opened },
  }));
});

socket.on("gm:timers-updated", (data: { timerOverrides: Partial<Record<GamePhase, number>> }) => {
  useGameStore.setState({ gmTimerOverrides: data.timerOverrides });
});

