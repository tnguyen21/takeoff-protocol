import { useGameStore } from "../../stores/game.js";
import { useMessagesStore } from "../../stores/messages.js";
import { Header } from "./Header.js";
import { ControlsPanel } from "./ControlsPanel.js";
import { StatePanel } from "./StatePanel.js";
import { PlayerRoster } from "./PlayerRoster.js";
import { MessageFeed } from "./MessageFeed.js";

export function GMDashboard() {
  const {
    roomCode,
    phase,
    round,
    timer,
    lobbyPlayers,
    gmRawState,
    gmDecisionStatus,
    gmExtendUsesRemaining,
    gmPlayerActivity,
    gmTimerOverrides,
    gmAdvance,
    gmPause,
    gmExtend,
    gmEndGame,
    gmSetState,
    gmSetTimers,
    endTutorial,
  } = useGameStore();

  const { messages } = useMessagesStore();

  const connectedCount = lobbyPlayers.filter((p) => p.connected).length;

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden text-text-primary"
      style={{ background: "linear-gradient(160deg, #0a0a14 0%, #0d1117 50%, #060912 100%)" }}
    >
      <Header
        roomCode={roomCode}
        round={round}
        phase={phase}
        connectedCount={connectedCount}
        totalPlayers={lobbyPlayers.length}
      />

      <div className="flex-1 grid grid-cols-[300px_1fr_280px] grid-rows-[auto_1fr] gap-px bg-white/[0.06] overflow-hidden">
        {/* Left column: Controls + Players */}
        <div className="col-start-1 row-span-2 bg-surface py-6 px-5 flex flex-col gap-5 border-r border-white/[0.06] overflow-auto">
          <ControlsPanel
            round={round}
            phase={phase}
            timer={timer}
            gmRawState={gmRawState}
            gmExtendUsesRemaining={gmExtendUsesRemaining}
            gmTimerOverrides={gmTimerOverrides}
            gmAdvance={gmAdvance}
            gmPause={gmPause}
            gmExtend={gmExtend}
            gmEndGame={gmEndGame}
            gmSetTimers={gmSetTimers}
            endTutorial={endTutorial}
          />
          <PlayerRoster
            lobbyPlayers={lobbyPlayers}
            phase={phase}
            roomCode={roomCode}
            gmDecisionStatus={gmDecisionStatus}
            gmPlayerActivity={gmPlayerActivity}
          />
        </div>

        <StatePanel
          gmRawState={gmRawState}
          round={round}
          gmSetState={gmSetState}
        />

        <MessageFeed
          messages={messages}
          phase={phase}
          gmDecisionStatus={gmDecisionStatus}
          lobbyPlayers={lobbyPlayers}
        />
      </div>
    </div>
  );
}
