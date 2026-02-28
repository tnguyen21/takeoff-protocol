import { useState } from "react";
import { useGameStore } from "../stores/game.js";
import { FACTIONS } from "@takeoff/shared";

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
    selectRole,
    startGame,
  } = useGameStore();

  const [joinCode, setJoinCode] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Step 1: Enter name
  if (!playerName) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-xl p-8 w-96 shadow-2xl border border-neutral-800">
          <h1 className="text-2xl font-bold text-white mb-1">Takeoff Protocol</h1>
          <p className="text-neutral-400 text-sm mb-6">AI 2027 Tabletop Exercise</p>
          <input
            type="text"
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nameInput.trim() && setPlayerName(nameInput.trim())}
            className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 mb-4 outline-none border border-neutral-700 focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={() => nameInput.trim() && setPlayerName(nameInput.trim())}
            disabled={!nameInput.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white rounded-lg py-3 font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Create or join room
  if (!roomCode) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-xl p-8 w-96 shadow-2xl border border-neutral-800">
          <h1 className="text-xl font-bold text-white mb-6">Welcome, {playerName}</h1>

          <button
            onClick={async () => { await createRoom(); }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 font-medium mb-4 transition-colors"
          >
            Create Room (GM)
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-neutral-700" />
            <span className="text-neutral-500 text-sm">or</span>
            <div className="flex-1 h-px bg-neutral-700" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="flex-1 bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-blue-500 tracking-widest text-center font-mono text-lg"
            />
            <button
              onClick={async () => { await joinRoom(joinCode); }}
              disabled={joinCode.length !== 4}
              className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 text-white rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Room lobby — role selection
  return (
    <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center">
      <div className="bg-neutral-900 rounded-xl p-8 w-[720px] shadow-2xl border border-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Room: {roomCode}</h1>
          <span className="text-neutral-400 text-sm">
            {lobbyPlayers.length} player{lobbyPlayers.length !== 1 ? "s" : ""} joined
          </span>
        </div>

        {!isGM && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {FACTIONS.map((faction) => (
              <div
                key={faction.id}
                className={`rounded-lg border p-4 ${
                  selectedFaction === faction.id
                    ? "border-blue-500 bg-blue-950/30"
                    : "border-neutral-700 bg-neutral-800/50"
                }`}
              >
                <h3 className="text-white font-semibold mb-2">{faction.name}</h3>
                <div className="space-y-1">
                  {faction.roles.map((role) => {
                    const taken = lobbyPlayers.some(
                      (p) => p.faction === faction.id && p.role === role.id && p.id !== useGameStore.getState().playerId,
                    );
                    const isSelected = selectedFaction === faction.id && selectedRole === role.id;

                    return (
                      <button
                        key={role.id}
                        onClick={async () => { await selectRole(faction.id, role.id); }}
                        disabled={taken}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : taken
                              ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        }`}
                      >
                        <span className="font-medium">{role.label}</span>
                        {role.optional && <span className="text-neutral-500 ml-1">(opt)</span>}
                        {taken && <span className="text-neutral-600 ml-1">— taken</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player list */}
        <div className="border-t border-neutral-800 pt-4 mb-4">
          <h3 className="text-neutral-400 text-sm mb-2">Players</h3>
          <div className="flex flex-wrap gap-2">
            {lobbyPlayers.map((p) => (
              <span
                key={p.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  p.connected ? "bg-neutral-800 text-neutral-300" : "bg-neutral-900 text-neutral-600"
                }`}
              >
                {p.name}
                {p.faction !== "external" && (
                  <span className="text-neutral-500 ml-1">({p.faction})</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {isGM && (
          <button
            onClick={startGame}
            disabled={lobbyPlayers.length < 2}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white rounded-lg py-3 font-medium transition-colors"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}
