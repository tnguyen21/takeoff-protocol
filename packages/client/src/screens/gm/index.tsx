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
    gmSetState,
    gmSetTimers,
    endTutorial,
  } = useGameStore();

  const { messages } = useMessagesStore();

  const connectedCount = lobbyPlayers.filter((p) => p.connected).length;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(160deg, #0a0a14 0%, #0d1117 50%, #060912 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#e5e7eb",
        overflow: "hidden",
      }}
    >
      <Header
        roomCode={roomCode}
        round={round}
        phase={phase}
        connectedCount={connectedCount}
        totalPlayers={lobbyPlayers.length}
      />

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "300px 1fr 280px",
          gridTemplateRows: "auto 1fr",
          gap: "1px",
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Left column: Controls + Players */}
        <div
          style={{
            gridColumn: "1",
            gridRow: "1 / 3",
            background: "#0a0a14",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            overflow: "auto",
          }}
        >
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
