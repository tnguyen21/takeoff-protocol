import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AppProps } from "./types.js";
import { useMessagesStore } from "../stores/messages.js";
import { useNotificationsStore } from "../stores/notifications.js";
import { useGameStore } from "../stores/game.js";
import { socket } from "../socket.js";
import { soundManager } from "../sounds/index.js";
import { SLACK_CHANNELS, assignChannelToMessage, getChannelMessages, computeUnreadCounts } from "./slackUtils.js";

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


export const SlackApp = React.memo(function SlackApp({ content }: AppProps) {
  const [input, setInput] = useState("");
  const [activeChannel, setActiveChannel] = useState("#general");
  // Channels the user has visited (starts with only #general seen)
  const [seenChannels, setSeenChannels] = useState<Set<string>>(() => new Set(["#general"]));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, markRead } = useMessagesStore();
  const { playerId, lobbyPlayers } = useGameStore();

  // Determine current player's faction
  const me = lobbyPlayers.find((p) => p.id === playerId);
  const myFaction = me?.faction ?? null;

  // Filter to team chat messages for my faction — always shown in #general
  const teamMessages = messages.filter(
    (m) => m.isTeamChat && (myFaction === null || m.faction === myFaction)
  );

  // Intel messages from game content (pre-scripted, grouped by channel)
  const intelMessages = content.filter((i) => i.type === "message");

  // Messages for the active channel
  const channelIntelMessages = getChannelMessages(intelMessages, activeChannel);
  // Filter team messages by channel (missing channel defaults to '#general')
  const channelTeamMessages = teamMessages.filter(
    (m) => (m.channel ?? "#general") === activeChannel
  );

  // Unread counts per channel (intel + player messages)
  const unreadCounts = computeUnreadCounts(intelMessages, seenChannels, activeChannel, teamMessages);

  // Handle channel click
  const handleChannelClick = useCallback((ch: string) => {
    setActiveChannel(ch);
    setSeenChannels((prev) => {
      const next = new Set(prev);
      next.add(ch);
      return next;
    });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelTeamMessages.length, channelIntelMessages.length]);

  // Mark read and dismiss toasts when app is open
  useEffect(() => {
    markRead("slack");
    useNotificationsStore.getState().dismissByApp("slack");
  }, [markRead, teamMessages.length]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    soundManager.play("message-send");
    socket.emit("message:send", { to: null, content: text, channel: activeChannel });
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

  const hasAnyMessages = channelIntelMessages.length > 0 || channelTeamMessages.length > 0;


  return (
    <div className="flex h-full bg-[#1a1d21] text-white text-sm font-sans">
      {/* Sidebar */}
      <div className="w-52 bg-[#3f0f40] flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-white/10">
          <div className="font-bold text-white text-sm">OpenBrain</div>
          <div className="text-green-400 text-xs flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Active
          </div>
        </div>

        <div className="px-2 py-2 overflow-y-auto flex-1 space-y-3">
          {/* Channels section */}
          <div>
            <div className="text-[#c9b9c9] text-[10px] font-semibold px-2 py-1 uppercase tracking-wide">Channels</div>
            <div className="space-y-0.5">
              {SLACK_CHANNELS.map((ch) => {
                const isActive = ch === activeChannel;
                const unread = unreadCounts[ch] ?? 0;
                return (
                  <div
                    key={ch}
                    onClick={() => handleChannelClick(ch)}
                    className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-xs transition-colors ${
                      isActive
                        ? "bg-white/20 text-white font-semibold"
                        : unread > 0
                        ? "text-white font-semibold hover:bg-white/10"
                        : "text-[#c9b9c9] hover:bg-white/10"
                    }`}
                  >
                    <span>{ch}</span>
                    {unread > 0 && !isActive && (
                      <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-9 border-b border-white/10 flex items-center px-4 bg-[#1a1d21] shrink-0">
          <span className="font-semibold text-white">{activeChannel}</span>
          <span className="text-neutral-500 ml-2 text-xs">
            {activeChannel === "#general" ? "· team chat" : `· ${channelIntelMessages.length} messages`}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {!hasAnyMessages && (
            <div className="text-neutral-600 text-xs text-center pt-8">
              {activeChannel === "#general" ? "No messages yet. Say hello!" : `No messages in ${activeChannel}`}
            </div>
          )}

          {/* Intel messages */}
          {channelIntelMessages.map((m) => (
            <div
              key={m.id}
              className="relative flex gap-3 group"
            >
              <div className="w-8 h-8 rounded bg-blue-800 flex items-center justify-center text-xs font-bold shrink-0 text-white">
                {initials(m.sender ?? "?")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-xs text-blue-300">{m.sender ?? "System"}</span>
                  <span className="text-neutral-500 text-xs">{m.timestamp}</span>
                  {m.channel && assignChannelToMessage(m) !== "#general" && (
                    <span className="text-neutral-600 text-[10px]">· {assignChannelToMessage(m)}</span>
                  )}
                </div>
                <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">{m.body}</p>
              </div>
            </div>
          ))}

          {/* Live team chat messages (always in #general) */}
          {channelTeamMessages.map((m) => (
            <div
              key={m.id}
              className="relative flex gap-3 group"
            >
              <div className="w-8 h-8 rounded bg-purple-700 flex items-center justify-center text-xs font-bold shrink-0 text-white">
                {initials(m.fromName)}
              </div>
              <div className="flex-1 min-w-0">
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
              placeholder={`Message ${activeChannel}`}
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
