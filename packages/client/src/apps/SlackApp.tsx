import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AppProps } from "./types.js";
import { useMessagesStore } from "../stores/messages.js";
import { useGameStore } from "../stores/game.js";
import { socket } from "../socket.js";

const CHANNELS = ["#general", "#research", "#alignment", "#safety", "#announcements", "#ops", "#random"];

function initials(name: string): string {
  return name
    .split(/[\s_]/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const SlackApp = React.memo(function SlackApp(_: AppProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, markRead } = useMessagesStore();
  const { playerId, lobbyPlayers } = useGameStore();

  // Determine current player's faction
  const me = lobbyPlayers.find((p) => p.id === playerId);
  const myFaction = me?.faction ?? null;

  // Filter to team chat messages for my faction
  const teamMessages = messages.filter(
    (m) => m.isTeamChat && (myFaction === null || m.faction === myFaction)
  );

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [teamMessages.length]);

  // Mark read when app is open
  useEffect(() => {
    markRead("slack");
  }, [markRead, teamMessages.length]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    socket.emit("message:send", { to: null, content: text });
    setInput("");
    inputRef.current?.focus();
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex h-full bg-[#1a1d21] text-white text-sm font-sans">
      {/* Sidebar */}
      <div className="w-48 bg-[#3f0f40] flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-white/10">
          <div className="font-bold text-white text-sm">OpenBrain</div>
          <div className="text-green-400 text-xs flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Active
          </div>
        </div>

        <div className="px-2 py-2 space-y-0.5 overflow-y-auto flex-1">
          <div className="text-[#c9b9c9] text-xs font-semibold px-2 py-1 uppercase tracking-wide">Channels</div>
          {CHANNELS.map((ch) => (
            <div
              key={ch}
              className={`px-2 py-1 rounded cursor-pointer text-[#c9b9c9] hover:bg-white/10 text-xs ${ch === "#general" ? "bg-white/20 text-white font-semibold" : ""}`}
            >
              {ch}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-9 border-b border-white/10 flex items-center px-4 bg-[#1a1d21] shrink-0">
          <span className="font-semibold text-white">#general</span>
          <span className="text-neutral-500 ml-2 text-xs">· team chat</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {teamMessages.length === 0 && (
            <div className="text-neutral-600 text-xs text-center pt-8">No messages yet. Say hello!</div>
          )}
          {teamMessages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="w-8 h-8 rounded bg-purple-700 flex items-center justify-center text-xs font-bold shrink-0 text-white">
                {initials(m.fromName)}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-semibold text-xs ${m.from === playerId ? "text-yellow-300" : "text-white"}`}>
                    {m.fromName}
                  </span>
                  <span className="text-neutral-500 text-xs">{formatTime(m.timestamp)}</span>
                </div>
                <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-2 border-t border-white/10 shrink-0">
          <div className="flex gap-2 items-center bg-[#2c2f33] rounded border border-white/10 px-3 py-1.5">
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-xs text-neutral-200 placeholder-neutral-500 outline-none"
              placeholder="Message #general"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="text-neutral-500 hover:text-white disabled:opacity-30 transition-colors text-xs px-1"
            >
              ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
