import { useState } from "react";
import { useGameStore } from "../stores/game.js";
import { FACTIONS } from "@takeoff/shared";
import type { Faction } from "@takeoff/shared";
import { FACTION_IDENTITIES, FACTION_SHORT_NAMES, FACTION_THEMES } from "../constants/factions.js";

export function Lobby() {
  const {
    roomCode,
    isGM,
    playerName,
    playerId,
    lobbyPlayers,
    selectedFaction,
    selectedRole,
    setPlayerName,
    createRoom,
    joinRoom,
    selectRole,
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

        {/* 4-column faction grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {FACTIONS.map((faction) => {
            const theme = FACTION_THEMES[faction.id];
            const factionPlayers = lobbyPlayers.filter((p) => p.faction === faction.id);
            const isFactionSelected = selectedFaction === faction.id;

            return (
              <div
                key={faction.id}
                className={`rounded-xl border flex flex-col transition-colors ${
                  isFactionSelected && !isGM
                    ? `${theme.cardBorderSelected} ${theme.cardBg}`
                    : `${theme.cardBorder} bg-neutral-900/40`
                }`}
              >
                {/* Faction header */}
                <div className="p-4 border-b border-neutral-800/60">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-base ${theme.headerText}`}>
                      {FACTION_SHORT_NAMES[faction.id]}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${theme.countBg} ${theme.countText}`}>
                      {factionPlayers.length}/{faction.maxPlayers}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-xs leading-relaxed">
                    {FACTION_IDENTITIES[faction.id]}
                  </p>
                </div>

                {/* Roles */}
                <div className="p-2 flex flex-col gap-1 flex-1">
                  {faction.roles.map((role) => {
                    const takenBy = lobbyPlayers.find(
                      (p) => p.faction === faction.id && p.role === role.id && p.id !== playerId,
                    );
                    const isTaken = !!takenBy;
                    const isSelected = selectedFaction === faction.id && selectedRole === role.id;

                    return (
                      <button
                        key={role.id}
                        onClick={async () => {
                          if (!isGM && !isTaken) {
                            await selectRole(faction.id, role.id);
                          }
                        }}
                        disabled={isGM || isTaken}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? theme.roleSelectedBg
                            : isTaken
                              ? "bg-neutral-800/30 cursor-not-allowed"
                              : isGM
                                ? "bg-neutral-800/20 cursor-default"
                                : `bg-neutral-800/40 ${theme.roleHover} cursor-pointer`
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {role.isLeader && (
                            <span className={`text-xs ${isSelected ? "text-white/80" : theme.badgeText}`} title="Faction leader">
                              ★
                            </span>
                          )}
                          <span className={`font-medium text-xs ${isTaken ? "text-neutral-600" : isSelected ? "text-white" : "text-neutral-200"}`}>
                            {role.label}
                          </span>
                          {role.optional && !isTaken && (
                            <span className={`text-xs ml-auto ${isSelected ? "text-white/50" : "text-neutral-600"}`}>opt</span>
                          )}
                        </div>
                        {isTaken ? (
                          <p className="text-neutral-600 text-xs">
                            taken by {takenBy.name}
                          </p>
                        ) : (
                          <p className={`text-xs leading-relaxed ${isSelected ? "text-white/70" : "text-neutral-500"}`}>
                            {role.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Player list */}
        <div className="border-t border-neutral-800/60 pt-5 mb-6">
          <h3 className="text-neutral-500 text-xs uppercase tracking-widest mb-3">
            Connected Players ({lobbyPlayers.length})
          </h3>
          {lobbyPlayers.length === 0 ? (
            <p className="text-neutral-700 text-sm italic">No players yet — share the room code.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lobbyPlayers.map((p) => {
                const theme = p.faction ? FACTION_THEMES[p.faction] : null;
                const factionRole = p.faction && p.role
                  ? FACTIONS.find((f) => f.id === p.faction)?.roles.find((r) => r.id === p.role)
                  : null;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                      theme ? `${theme.cardBorder} ${theme.cardBg}` : "border-neutral-800 bg-neutral-900/40"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.connected ? (theme?.dot ?? "bg-neutral-400") : "bg-neutral-700"}`} />
                    <span className="text-neutral-200 font-medium">{p.name}</span>
                    {factionRole && theme && (
                      <span className={`text-xs ${theme.badgeText}`}>
                        {factionRole.label}
                      </span>
                    )}
                    {!factionRole && p.faction && theme && (
                      <span className={`text-xs ${theme.badgeText}`}>
                        {FACTION_SHORT_NAMES[p.faction]}
                      </span>
                    )}
                    {!p.faction && (
                      <span className="text-xs text-neutral-600">no role selected</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
