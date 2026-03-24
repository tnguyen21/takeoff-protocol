import { useRef, useEffect } from "react";
import type { Faction } from "@takeoff/shared";
import { FACTION_COLORS } from "../../constants/factions.js";
import { formatTimestamp } from "./shared.js";
import { useGameStore } from "../../stores/game.js";
import { useMessagesStore } from "../../stores/messages.js";

export function MessageFeed() {
  const { phase, gmDecisionStatus, lobbyPlayers } = useGameStore();
  const { messages } = useMessagesStore();
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll message feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="col-start-3 row-span-2 bg-surface flex flex-col overflow-hidden">
      <div className="pt-5 px-4 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="text-text-muted text-[10px] font-semibold uppercase tracking-widest">
          All Messages
        </div>
        {phase === "decision" && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="text-text-secondary text-[11px]">
              Decisions submitted:{" "}
              <strong className="text-text-primary">{gmDecisionStatus.length}</strong>
              {" / "}
              <strong className="text-text-primary">{lobbyPlayers.length}</strong>
            </div>
          </div>
        )}
      </div>

      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto py-3 px-4 flex flex-col gap-2"
      >
        {messages.length === 0 ? (
          <div className="text-gray-600 text-xs italic text-center mt-5">
            No messages yet
          </div>
        ) : (
          messages.map((msg) => {
            const factionColor =
              msg.faction && msg.faction in FACTION_COLORS
                ? FACTION_COLORS[msg.faction as Faction]
                : "#9ca3af";
            return (
              <div
                key={msg.id}
                className="py-2 px-2.5 rounded-md bg-white/[0.03] border border-border-subtle text-xs"
              >
                <div className="flex items-center gap-1.5 mb-[3px]">
                  <span className="text-gray-600 text-[10px] font-mono">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                  <span className="font-bold text-[11px]" style={{ color: factionColor }}>
                    {msg.fromName}
                  </span>
                  <span className="text-gray-600 text-[10px]">
                    → {msg.isTeamChat ? "team chat" : "DM"}
                  </span>
                </div>
                <div className="text-gray-300 leading-[1.4]">{msg.content}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
