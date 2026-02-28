import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AppProps } from "./types.js";
import { useMessagesStore } from "../stores/messages.js";
import { useGameStore } from "../stores/game.js";
import { socket } from "../socket.js";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  return name
    .split(/[\s_]/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const SignalApp = React.memo(function SignalApp({ content }: AppProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, markRead } = useMessagesStore();
  const { playerId, lobbyPlayers } = useGameStore();

  const me = lobbyPlayers.find((p) => p.id === playerId);

  // Players from other factions (cross-faction DM targets)
  const otherPlayers = lobbyPlayers.filter(
    (p) => p.id !== playerId && (!me || p.faction !== me.faction)
  );

  // DM conversation: messages where (from === me && to === selected) or (from === selected && to === me)
  const dmMessages = selectedPlayerId
    ? messages.filter(
        (m) =>
          !m.isTeamChat &&
          ((m.from === playerId && m.to === selectedPlayerId) ||
            (m.from === selectedPlayerId && m.to === playerId))
      )
    : [];

  // Unread count per player (DMs to me that aren't in active convo)
  const unreadPerPlayer: Record<string, number> = {};
  for (const m of messages) {
    if (!m.isTeamChat && m.to === playerId && m.from !== selectedPlayerId) {
      unreadPerPlayer[m.from] = (unreadPerPlayer[m.from] ?? 0) + 1;
    }
  }

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages.length]);

  // Mark signal read when open
  useEffect(() => {
    markRead("signal");
  }, [markRead, dmMessages.length]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !selectedPlayerId) return;
    socket.emit("message:send", { to: selectedPlayerId, content: text });
    setInput("");
    inputRef.current?.focus();
  }, [input, selectedPlayerId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const selectedPlayer = otherPlayers.find((p) => p.id === selectedPlayerId);

  // Intel content: pre-scripted messages shown in a special "Intel Feed" contact
  const intelMessages = content.filter((i) => i.type === "message");
  const INTEL_CONTACT_ID = "__intel__";
  const isIntelSelected = selectedPlayerId === INTEL_CONTACT_ID;

  return (
    <div className="flex h-full bg-[#1b1b1b] text-white text-sm">
      {/* Sidebar */}
      <div className="w-52 bg-[#1b1b1b] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10">
          <div className="bg-[#2a2a2a] rounded px-2 py-1.5 text-neutral-500 text-xs">Contacts</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {/* Intel Feed contact */}
          {intelMessages.length > 0 && (
            <div
              onClick={() => setSelectedPlayerId(INTEL_CONTACT_ID)}
              className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-white/5 hover:bg-white/5 ${isIntelSelected ? "bg-white/10" : ""}`}
            >
              <div className="w-9 h-9 rounded-full bg-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                📡
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-xs truncate text-amber-300">Intel Feed</span>
                  <div className="w-4 h-4 rounded-full bg-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0 ml-1">
                    {intelMessages.length}
                  </div>
                </div>
                <p className="text-neutral-400 text-xs truncate mt-0.5">
                  {intelMessages[intelMessages.length - 1]?.body.slice(0, 40)}
                </p>
              </div>
            </div>
          )}
          {otherPlayers.length === 0 && intelMessages.length === 0 && (
            <div className="text-neutral-600 text-xs text-center px-3 pt-8">
              No contacts from other factions yet.
            </div>
          )}
          {otherPlayers.map((p) => {
            const unread = unreadPerPlayer[p.id] ?? 0;
            const isActive = p.id === selectedPlayerId;
            // Preview: last message in convo
            const lastMsg = messages
              .filter(
                (m) =>
                  !m.isTeamChat &&
                  ((m.from === playerId && m.to === p.id) || (m.from === p.id && m.to === playerId))
              )
              .at(-1);
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-white/5 hover:bg-white/5 ${isActive ? "bg-white/10" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-xs truncate">{p.name}</span>
                    {lastMsg && (
                      <span className="text-neutral-500 text-[10px] shrink-0 ml-1">{formatTime(lastMsg.timestamp)}</span>
                    )}
                  </div>
                  <p className="text-neutral-400 text-xs truncate mt-0.5">
                    {lastMsg ? lastMsg.content : `· ${p.faction}`}
                  </p>
                </div>
                {unread > 0 && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {unread}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat pane */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Intel Feed view */}
        {isIntelSelected ? (
          <>
            <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
              <span className="text-amber-300 mr-2">📡</span>
              <span className="font-semibold text-sm text-amber-300">Intel Feed</span>
              <span className="text-neutral-500 text-xs ml-2">· encrypted intercepts</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {intelMessages.map((m) => (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed bg-amber-900/30 text-amber-100 border border-amber-800/40 rounded-bl-sm">
                    {m.sender && <p className="text-amber-400 font-semibold text-[10px] mb-1">{m.sender}</p>}
                    <p>{m.body}</p>
                    <p className="text-amber-700 text-[10px] mt-1">{m.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : !selectedPlayer ? (
          <div className="flex-1 flex items-center justify-center text-neutral-600 text-xs">
            Select a contact to start a DM
          </div>
        ) : (
          <>
            <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold mr-2">
                {initials(selectedPlayer.name)}
              </div>
              <span className="font-semibold text-sm">{selectedPlayer.name}</span>
              <span className="text-neutral-500 text-xs ml-2">· {selectedPlayer.faction}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {dmMessages.length === 0 && (
                <div className="text-neutral-600 text-xs text-center pt-8">No messages yet.</div>
              )}
              {dmMessages.map((m) => {
                const sent = m.from === playerId;
                return (
                  <div key={m.id} className={`flex ${sent ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        sent ? "bg-blue-600 text-white rounded-br-sm" : "bg-[#2a2a2a] text-neutral-200 rounded-bl-sm"
                      }`}
                    >
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${sent ? "text-blue-200" : "text-neutral-500"}`}>
                        {formatTime(m.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-2 border-t border-white/10 flex gap-2 shrink-0">
              <input
                ref={inputRef}
                className="flex-1 bg-[#2a2a2a] rounded-full px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 border border-white/10 outline-none"
                placeholder={`Message ${selectedPlayer.name}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm disabled:opacity-40 transition-opacity"
              >
                ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
