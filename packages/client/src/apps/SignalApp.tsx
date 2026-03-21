import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppProps } from "./types.js";
import { useMessagesStore } from "../stores/messages.js";
import { useNotificationsStore } from "../stores/notifications.js";
import { useGameStore } from "../stores/game.js";
import { socket } from "../socket.js";
import { soundManager } from "../sounds/index.js";
import {
  getReadReceiptStatus,
  hasDisappearingTimer,
  buildNpcContacts,
  buildContentContacts,
  isNpcId,
  isContentContactId,
} from "./signalUtils.js";

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

// ── Read-receipt checkmark renderer ─────────────────────────────────────────

function ReadReceipt({ status }: { status: "sent" | "delivered" | "read" }) {
  if (status === "sent") {
    return <span className="text-[9px] text-blue-300/50 ml-1">✓</span>;
  }
  if (status === "delivered") {
    return <span className="text-[9px] text-blue-300/50 ml-1">✓✓</span>;
  }
  // read
  return <span className="text-[9px] text-blue-300 ml-1">✓✓</span>;
}

// ── Typing indicator dots ────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#2a2a2a] rounded-2xl rounded-bl-sm px-3 py-2.5">
        <div className="flex gap-1 items-center">
          <span
            className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "800ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
            style={{ animationDelay: "150ms", animationDuration: "800ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
            style={{ animationDelay: "300ms", animationDuration: "800ms" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── E2E encrypted banner ─────────────────────────────────────────────────────

function EncryptedBanner() {
  return (
    <div className="flex justify-center py-3 px-4 shrink-0">
      <p className="text-center text-neutral-600 text-[10px] leading-snug max-w-[260px]">
        <span className="mr-1">🔒</span>
        Messages and calls are end-to-end encrypted. No one outside of this chat, not even Signal, can read or listen to them.
      </p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export const SignalApp = React.memo(function SignalApp({ content }: AppProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-contact read tracking: maps contact ID → message count at last view
  const readCountsRef = useRef<Record<string, number>>({});

  const { messages, markRead } = useMessagesStore();
  const { playerId, lobbyPlayers } = useGameStore();

  const me = lobbyPlayers.find((p) => p.id === playerId);

  // Players from other factions (cross-faction DM targets)
  const otherPlayers = lobbyPlayers.filter(
    (p) => p.id !== playerId && (!me || p.faction !== me.faction)
  );

  // NPC contacts derived from live store messages
  const npcContacts = playerId ? buildNpcContacts(messages, playerId) : [];

  // Content contacts from seeded signal items (grouped by sender)
  const contentContacts = useMemo(
    () => buildContentContacts(content),
    [content]
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

  // Total signal messages to this player (for notification clearing)
  const signalMessageCount = messages.filter((m) => !m.isTeamChat && m.to === playerId).length;

  // Track read state when a contact is selected
  useEffect(() => {
    if (!selectedPlayerId) return;

    const cc = contentContacts.find((c) => c.id === selectedPlayerId);
    if (cc) {
      readCountsRef.current[selectedPlayerId] = cc.messages.length;
      return;
    }

    const npc = npcContacts.find((c) => c.id === selectedPlayerId);
    if (npc) {
      readCountsRef.current[selectedPlayerId] = npc.messages.length;
      return;
    }

    // Real player — count messages from them to me
    const count = messages.filter(
      (m) => !m.isTeamChat && m.to === playerId && m.from === selectedPlayerId
    ).length;
    readCountsRef.current[selectedPlayerId] = count;
  }, [selectedPlayerId, messages, playerId, npcContacts, contentContacts]);

  // Unread counts for NPC + real player contacts (subtracting read counts)
  const unreadPerPlayer = useMemo(() => {
    const result: Record<string, number> = {};
    for (const m of messages) {
      if (!m.isTeamChat && m.to === playerId) {
        result[m.from] = (result[m.from] ?? 0) + 1;
      }
    }
    for (const id of Object.keys(result)) {
      const read = readCountsRef.current[id] ?? 0;
      result[id] = Math.max(0, result[id] - read);
    }
    return result;
  }, [messages, playerId, selectedPlayerId]);

  // Unread counts for content contacts
  const unreadPerContent = useMemo(() => {
    const result: Record<string, number> = {};
    for (const cc of contentContacts) {
      const read = readCountsRef.current[cc.id] ?? 0;
      result[cc.id] = Math.max(0, cc.messages.length - read);
    }
    return result;
  }, [contentContacts, selectedPlayerId]);

  // NPC contacts sorted by most recent message timestamp descending
  const sortedNpcContacts = useMemo(
    () => [...npcContacts].sort((a, b) => (b.messages.at(-1)?.timestamp ?? 0) - (a.messages.at(-1)?.timestamp ?? 0)),
    [npcContacts]
  );

  // Pre-compute last timestamp + last message per player in a single O(K) pass,
  // then sort real player contacts using O(1) lookups
  const { sortedOtherPlayers, lastMessageByPlayer } = useMemo(() => {
    const lastTimestampByPlayer = new Map<string, number>();
    const lastMsgByPlayer = new Map<string, (typeof messages)[number]>();
    for (const m of messages) {
      if (!m.isTeamChat && (m.from === playerId || m.to === playerId)) {
        const otherId = m.from === playerId ? m.to! : m.from;
        const ts = m.timestamp ?? 0;
        if (ts > (lastTimestampByPlayer.get(otherId) ?? 0)) {
          lastTimestampByPlayer.set(otherId, ts);
          lastMsgByPlayer.set(otherId, m);
        }
      }
    }
    const sorted = [...otherPlayers].sort(
      (a, b) => (lastTimestampByPlayer.get(b.id) ?? 0) - (lastTimestampByPlayer.get(a.id) ?? 0)
    );
    return { sortedOtherPlayers: sorted, lastMessageByPlayer: lastMsgByPlayer };
  }, [messages, playerId, otherPlayers]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages.length, showTyping]);

  // Mark signal read and dismiss toasts when open
  useEffect(() => {
    markRead("signal");
    useNotificationsStore.getState().dismissByApp("signal");
  }, [markRead, signalMessageCount]);

  // Update `now` every 5s so read-receipt statuses refresh
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  // Typing indicator: fires for any active conversation (real players, NPC, content contacts)
  const isNpcSelected = selectedPlayerId ? isNpcId(selectedPlayerId) : false;
  const isContentSelected = selectedPlayerId ? isContentContactId(selectedPlayerId) : false;
  const isRealDmActive = !!selectedPlayerId && !isNpcSelected && !isContentSelected;
  const isAnyContactActive = !!selectedPlayerId;

  useEffect(() => {
    if (!isAnyContactActive) {
      setShowTyping(false);
      return;
    }

    let cancelled = false;

    const cycle = () => {
      // Real players: longer gap (20-30s). NPC/content: faster (8-15s)
      const delay = isRealDmActive
        ? 20_000 + Math.random() * 10_000
        : 8_000 + Math.random() * 7_000;
      typingTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        setShowTyping(true);
        typingTimerRef.current = setTimeout(() => {
          if (cancelled) return;
          setShowTyping(false);
          cycle();
        }, 2_000 + Math.random() * 1_000);
      }, delay);
    };

    cycle();
    return () => {
      cancelled = true;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setShowTyping(false);
    };
  }, [isAnyContactActive, isRealDmActive]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !selectedPlayerId) return;
    soundManager.play("message-send");
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

  // Content contact selected — look up from content contacts
  const selectedContent = isContentSelected
    ? contentContacts.find((c) => c.id === selectedPlayerId)
    : null;

  // NPC contact selected — look up from live contacts
  const selectedNpc = isNpcSelected
    ? npcContacts.find((c) => c.id === selectedPlayerId)
    : null;

  return (
    <div className="flex h-full bg-[#1b1b1b] text-white text-sm">
      {/* Sidebar */}
      <div className="w-52 bg-[#1b1b1b] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10">
          <div className="bg-[#2a2a2a] rounded px-2 py-1.5 text-neutral-500 text-xs">Contacts</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {/* Content contacts (seeded signal items grouped by sender) */}
          {/* Kept in insertion order — seeded story content is already chronologically ordered */}
          {contentContacts.map((cc) => {
            const isActive = cc.id === selectedPlayerId;
            const lastMsg = cc.messages.at(-1);
            const unread = unreadPerContent[cc.id] ?? 0;
            return (
              <div
                key={cc.id}
                onClick={() => setSelectedPlayerId(cc.id)}
                className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-white/5 hover:bg-white/5 ${isActive ? "bg-white/10" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full ${cc.avatarColor} flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {initials(cc.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-xs truncate">{cc.name}</span>
                  </div>
                  <p className="text-neutral-400 text-xs truncate mt-0.5">
                    {lastMsg ? lastMsg.body.slice(0, 40) : cc.subtitle}
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

          {/* NPC contacts — sorted by most recent message timestamp descending */}
          {sortedNpcContacts.map((npc) => {
            const isActive = npc.id === selectedPlayerId;
            const lastMsg = npc.messages.at(-1);
            const unread = unreadPerPlayer[npc.id] ?? 0;
            return (
              <div
                key={npc.id}
                onClick={() => setSelectedPlayerId(npc.id)}
                className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-white/5 hover:bg-white/5 ${isActive ? "bg-white/10" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full ${npc.avatarColor} flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {initials(npc.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-xs truncate">{npc.name}</span>
                    {lastMsg && (
                      <span className="text-neutral-500 text-[10px] shrink-0 ml-1">
                        {formatTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-400 text-xs truncate mt-0.5">
                    {lastMsg ? lastMsg.content : npc.subtitle}
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

          {otherPlayers.length === 0 && contentContacts.length === 0 && npcContacts.length === 0 && (
            <div className="text-neutral-600 text-xs text-center px-3 pt-8">
              No contacts from other factions yet.
            </div>
          )}

          {/* Real player contacts — sorted by most recent message timestamp descending */}
          {sortedOtherPlayers.map((p) => {
            const unread = unreadPerPlayer[p.id] ?? 0;
            const isActive = p.id === selectedPlayerId;
            // Preview: last message in convo (pre-computed)
            const lastMsg = lastMessageByPlayer.get(p.id);
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
        {selectedContent ? (
          /* Content contact view — seeded signal messages */
          <>
            <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
              <div
                className={`w-7 h-7 rounded-full ${selectedContent.avatarColor} flex items-center justify-center text-xs font-bold mr-2`}
              >
                {initials(selectedContent.name)}
              </div>
              <span className="font-semibold text-sm">{selectedContent.name}</span>
              <span className="text-neutral-500 text-xs ml-2">{selectedContent.subtitle}</span>
            </div>

            <EncryptedBanner />

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {selectedContent.messages.map((m) => (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed bg-[#2a2a2a] text-neutral-200 rounded-bl-sm">
                    <p>{m.body}</p>
                    <p className="text-neutral-500 text-[10px] mt-1">{m.timestamp}</p>
                  </div>
                </div>
              ))}
              {showTyping && (
                <div className="flex items-center gap-2">
                  <TypingDots />
                  <span className="text-neutral-500 text-[10px]">{selectedContent.name}</span>
                </div>
              )}
            </div>

            {/* No compose input for content contacts — read only */}
            <div className="px-4 py-2 border-t border-white/10 flex gap-2 shrink-0">
              <div className="flex-1 bg-[#2a2a2a] rounded-full px-3 py-1.5 text-xs text-neutral-600 border border-white/10 select-none">
                Cannot reply to this contact
              </div>
            </div>
          </>
        ) : selectedNpc ? (
          /* NPC contact view — messages from live store, sorted ascending */
          <>
            <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
              <div
                className={`w-7 h-7 rounded-full ${selectedNpc.avatarColor} flex items-center justify-center text-xs font-bold mr-2`}
              >
                {initials(selectedNpc.name)}
              </div>
              <span className="font-semibold text-sm">{selectedNpc.name}</span>
              <span className="text-neutral-500 text-xs ml-2">{selectedNpc.subtitle}</span>
            </div>

            <EncryptedBanner />

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {selectedNpc.messages.map((m) => (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed bg-[#2a2a2a] text-neutral-200 rounded-bl-sm">
                    <p>
                      {m.content}
                      {hasDisappearingTimer(m.id) && (
                        <span className="ml-1.5 opacity-40" title="Disappears after viewing">⏱</span>
                      )}
                    </p>
                    <p className="text-neutral-500 text-[10px] mt-1">{formatTime(m.timestamp)}</p>
                  </div>
                </div>
              ))}
              {showTyping && (
                <div className="flex items-center gap-2">
                  <TypingDots />
                  <span className="text-neutral-500 text-[10px]">{selectedNpc.name}</span>
                </div>
              )}
            </div>

            {/* No compose input for NPC contacts — read only */}
            <div className="px-4 py-2 border-t border-white/10 flex gap-2 shrink-0">
              <div className="flex-1 bg-[#2a2a2a] rounded-full px-3 py-1.5 text-xs text-neutral-600 border border-white/10 select-none">
                Cannot reply to this contact
              </div>
            </div>
          </>
        ) : !selectedPlayer ? (
          <div className="flex-1 flex items-center justify-center text-neutral-600 text-xs">
            Select a contact to start a DM
          </div>
        ) : (
          /* Real player DM view */
          <>
            <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold mr-2">
                {initials(selectedPlayer.name)}
              </div>
              <span className="font-semibold text-sm">{selectedPlayer.name}</span>
              <span className="text-neutral-500 text-xs ml-2">· {selectedPlayer.faction}</span>
            </div>

            <EncryptedBanner />

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {dmMessages.length === 0 && (
                <div className="text-neutral-600 text-xs text-center pt-8">No messages yet.</div>
              )}
              {dmMessages.map((m) => {
                const sent = m.from === playerId;
                const receiptStatus = sent ? getReadReceiptStatus(m.timestamp, now) : null;
                return (
                  <div key={m.id} className={`flex ${sent ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        sent ? "bg-blue-600 text-white rounded-br-sm" : "bg-[#2a2a2a] text-neutral-200 rounded-bl-sm"
                      }`}
                    >
                      <p>
                        {m.content}
                        {!sent && hasDisappearingTimer(m.id) && (
                          <span className="ml-1.5 opacity-40" title="Disappears after viewing">⏱</span>
                        )}
                      </p>
                      <div className={`flex items-center gap-0.5 mt-1 ${sent ? "justify-end" : ""}`}>
                        <span className={`text-[10px] ${sent ? "text-blue-200" : "text-neutral-500"}`}>
                          {formatTime(m.timestamp)}
                        </span>
                        {sent && hasDisappearingTimer(m.id) && (
                          <span className="text-[9px] text-blue-200/50 ml-1" title="Disappears after viewing">⏱</span>
                        )}
                        {receiptStatus && <ReadReceipt status={receiptStatus} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {showTyping && <TypingDots />}
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
