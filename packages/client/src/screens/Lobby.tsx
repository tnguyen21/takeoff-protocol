import { useState } from "react";
import { useGameStore } from "../stores/game.js";
import { FactionGrid, PlayerList } from "./lobby/index.js";

export function Lobby() {
  const {
    roomCode,
    isGM,
    playerName,
    lobbyPlayers,
    selectedFaction,
    selectedRole,
    setPlayerName,
    createRoom,
    joinRoom,
    startGame,
    startTutorial,
    gmGenerationEnabled,
    gmSetGeneration,
    devFillBots,
  } = useGameStore();

  const [joinCode, setJoinCode] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);

  // ── Step 1: Name entry ──
  if (!playerName) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Takeoff Protocol</h1>
          <p className="text-neutral-400 text-base">AI 2027 Tabletop Exercise — Will humanity survive the intelligence explosion?</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-8 w-96 shadow-2xl border border-neutral-800">
          <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">Your Name</label>
          <input
            type="text"
            placeholder="e.g. Alex Chen"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nameInput.trim() && setPlayerName(nameInput.trim())}
            className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 mb-4 outline-none border border-neutral-700 focus:border-neutral-500 transition-colors placeholder:text-neutral-600"
            autoFocus
          />
          <button
            onClick={() => nameInput.trim() && setPlayerName(nameInput.trim())}
            disabled={!nameInput.trim()}
            className="w-full bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg py-3 font-medium transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Create or join room ──
  if (!roomCode) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Takeoff Protocol</h1>
          <p className="text-neutral-400 text-base">AI 2027 Tabletop Exercise — Will humanity survive the intelligence explosion?</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-8 w-96 shadow-2xl border border-neutral-800">
          <p className="text-neutral-300 font-medium mb-6">
            Welcome, <span className="text-white">{playerName}</span>
          </p>

          <button
            onClick={async () => { await createRoom(); }}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg py-3 font-medium mb-4 transition-colors border border-neutral-600 hover:border-neutral-500"
          >
            Create Room <span className="text-neutral-400 text-sm">(Game Master)</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-neutral-600 text-xs uppercase tracking-widest">or join</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ROOM"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="flex-1 bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-neutral-500 transition-colors tracking-[0.3em] text-center font-mono text-lg placeholder:text-neutral-700 placeholder:tracking-normal"
            />
            <button
              onClick={async () => { await joinRoom(joinCode); }}
              disabled={joinCode.length !== 4}
              className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg px-6 py-3 font-medium transition-colors border border-neutral-600 hover:border-neutral-500 disabled:border-neutral-800"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Room lobby — role selection ──
  const MIN_PLAYERS = 8;
  const allPlayersHaveRoles = lobbyPlayers.length > 0 && lobbyPlayers.every(p => p.faction !== null && p.role !== null);
  const canStart = isGM && allPlayersHaveRoles && (lobbyPlayers.length >= MIN_PLAYERS || allowOverride);

  return (
    <div className="h-screen w-screen bg-neutral-950 flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="border-b border-neutral-800/80 px-8 py-4 flex items-center justify-between bg-neutral-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Takeoff Protocol</h1>
          <p className="text-neutral-500 text-xs mt-0.5">AI 2027 Tabletop Exercise — Will humanity survive the intelligence explosion?</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-neutral-600 text-xs uppercase tracking-widest mb-0.5">Players</p>
            <p className="text-neutral-300 font-mono text-lg font-semibold">
              {lobbyPlayers.length}
              <span className="text-neutral-600 text-sm">/{MIN_PLAYERS} min</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-neutral-600 text-xs uppercase tracking-widest mb-0.5">Room Code</p>
            <p className="text-white font-mono text-2xl font-bold tracking-[0.2em]">{roomCode}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-7xl mx-auto w-full">

        {/* Role selection intro */}
        <div className="mb-5">
          {!isGM ? (
            <p className="text-neutral-400 text-sm">
              Choose your faction and role. You will inhabit this person's laptop for the 2-hour exercise.
              {selectedRole && <span className="text-neutral-300 ml-2">Your role is saved — you can change it until the game starts.</span>}
            </p>
          ) : (
            <p className="text-neutral-400 text-sm">
              Game Master view — monitor player role selection below.
            </p>
          )}
        </div>

        <FactionGrid />

        <PlayerList />

        {/* AI Generation toggle */}
        {isGM && (
          <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold mb-1">AI Generation</h3>
                <p className="text-neutral-500 text-sm">
                  {gmGenerationEnabled
                    ? "Briefings, content, and NPC messages will be AI-generated based on game state"
                    : "Using pre-authored content only"}
                </p>
              </div>
              <button
                onClick={() => gmSetGeneration(!gmGenerationEnabled)}
                className="flex-shrink-0"
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "12px",
                  border: "none",
                  background: gmGenerationEnabled ? "#06b6d4" : "#374151",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: "3px",
                  left: gmGenerationEnabled ? "23px" : "3px",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>
        )}

        {/* GM start game panel */}
        {isGM && (
          <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold mb-1">Start Exercise</h3>
                <p className="text-neutral-500 text-sm">
                  {!allPlayersHaveRoles && lobbyPlayers.length > 0
                    ? `${lobbyPlayers.filter(p => !p.faction || !p.role).length} player(s) still need to select a role`
                    : lobbyPlayers.length < MIN_PLAYERS && !allowOverride
                      ? `Waiting for ${MIN_PLAYERS - lobbyPlayers.length} more player${MIN_PLAYERS - lobbyPlayers.length !== 1 ? "s" : ""} (${lobbyPlayers.length}/${MIN_PLAYERS})`
                      : `${lobbyPlayers.length} player${lobbyPlayers.length !== 1 ? "s" : ""} ready`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {lobbyPlayers.length < MIN_PLAYERS && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowOverride}
                      onChange={(e) => setAllowOverride(e.target.checked)}
                      className="w-4 h-4 rounded accent-neutral-400"
                    />
                    <span className="text-neutral-500 text-sm">Override minimum</span>
                  </label>
                )}
                <button
                  onClick={startTutorial}
                  disabled={!canStart}
                  className="bg-yellow-800 hover:bg-yellow-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg px-6 py-3 font-semibold transition-colors border border-yellow-700 hover:border-yellow-600 disabled:border-neutral-700"
                  title="Walk players through the desktop UI before Round 1"
                >
                  Start Tutorial
                </button>
                <button
                  onClick={startGame}
                  disabled={!canStart}
                  className="bg-green-700 hover:bg-green-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg px-8 py-3 font-semibold transition-colors border border-green-600 hover:border-green-500 disabled:border-neutral-700"
                >
                  Start Game →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dev Tools — only visible in local dev mode */}
        {import.meta.env.DEV && isGM && (
          <div className="border border-yellow-900/50 rounded-xl p-5 bg-yellow-950/20 mt-4">
            <h3 className="text-yellow-400 font-semibold mb-1 text-sm">Dev Tools</h3>
            <p className="text-neutral-500 text-xs mb-3">Fill empty roles with bots for solo playtesting</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const res = await devFillBots();
                  if (res.ok) {
                    setTimeout(() => startGame(), 300);
                  }
                }}
                className="bg-yellow-900/60 hover:bg-yellow-800/60 text-yellow-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-yellow-800/60 hover:border-yellow-700/60"
              >
                Start as GM + Bots
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
