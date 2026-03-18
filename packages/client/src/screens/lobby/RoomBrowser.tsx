import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/game.js";

interface RoomInfo {
  code: string;
  playerCount: number;
  phase: string;
  round: number;
}

export function RoomBrowser() {
  const { createRoom, joinRoom, lobbyError, clearLobbyError } = useGameStore();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [maxRooms, setMaxRooms] = useState(5);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        setMaxRooms(data.maxRooms);
      }
    } catch {
      // ignore fetch errors
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  const atCap = rooms.length >= maxRooms;

  return (
    <div className="bg-neutral-900 rounded-xl p-8 w-96 shadow-2xl border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Rooms</h2>
        <button
          onClick={() => { setLoading(true); fetchRooms(); }}
          className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
        >
          Refresh
        </button>
      </div>

      {lobbyError && (
        <div className="bg-red-950/50 border border-red-900/50 rounded-lg px-3 py-2 mb-4">
          <p className="text-red-400 text-sm">{lobbyError}</p>
        </div>
      )}

      {/* Room list */}
      {loading ? (
        <p className="text-neutral-600 text-sm mb-4">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="text-neutral-600 text-sm mb-4">No active rooms — create one to get started</p>
      ) : (
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {rooms.map((room) => (
            <div key={room.code} className="flex items-center justify-between bg-neutral-800 rounded-lg px-3 py-2">
              <div>
                <span className="text-white font-mono text-sm font-semibold tracking-wider">{room.code}</span>
                <span className="text-neutral-500 text-xs ml-2">{room.playerCount} player{room.playerCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${room.phase === "lobby" ? "bg-green-900/50 text-green-400" : "bg-neutral-700 text-neutral-400"}`}>
                  {room.phase === "lobby" ? "Open" : `R${room.round} ${room.phase}`}
                </span>
                {room.phase === "lobby" && (
                  <button
                    onClick={async () => { clearLobbyError(); await joinRoom(room.code); }}
                    className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded px-2 py-1 transition-colors"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create room */}
      <button
        onClick={async () => { clearLobbyError(); await createRoom(); }}
        disabled={atCap}
        className="w-full bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg py-3 font-medium mb-4 transition-colors border border-neutral-600 hover:border-neutral-500 disabled:border-neutral-800"
      >
        {atCap ? `Server full (${maxRooms}/${maxRooms} rooms)` : "Create Room"} <span className="text-neutral-400 text-sm">{!atCap && "(Game Master)"}</span>
      </button>

      {/* Manual join */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-neutral-600 text-xs uppercase tracking-widest">or join by code</span>
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
          onClick={async () => { clearLobbyError(); await joinRoom(joinCode); }}
          disabled={joinCode.length !== 4}
          className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg px-6 py-3 font-medium transition-colors border border-neutral-600 hover:border-neutral-500 disabled:border-neutral-800"
        >
          Join
        </button>
      </div>
    </div>
  );
}
