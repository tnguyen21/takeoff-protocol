import { useRef, useEffect } from "react";
import type { GameMessage, Faction } from "@takeoff/shared";
import { FACTION_COLORS } from "../../constants/factions.js";
import { formatTimestamp } from "./shared.js";
import type { LobbyPlayer } from "../../stores/game.js";

interface MessageFeedProps {
  messages: GameMessage[];
  phase: string | null;
  gmDecisionStatus: string[];
  lobbyPlayers: LobbyPlayer[];
}

export function MessageFeed({ messages, phase, gmDecisionStatus, lobbyPlayers }: MessageFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll message feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      style={{
        gridColumn: "3",
        gridRow: "1 / 3",
        background: "#0a0a14",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ color: "#6b7280", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          All Messages
        </div>
        {phase === "decision" && (
          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ color: "#9ca3af", fontSize: "11px" }}>
              Decisions submitted:{" "}
              <strong style={{ color: "#e5e7eb" }}>{gmDecisionStatus.length}</strong>
              {" / "}
              <strong style={{ color: "#e5e7eb" }}>{lobbyPlayers.length}</strong>
            </div>
          </div>
        )}
      </div>

      <div
        ref={feedRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: "#4b5563", fontSize: "12px", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
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
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <span style={{ color: "#4b5563", fontSize: "10px", fontFamily: "monospace" }}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                  <span style={{ color: factionColor, fontWeight: 700, fontSize: "11px" }}>
                    {msg.fromName}
                  </span>
                  <span style={{ color: "#4b5563", fontSize: "10px" }}>
                    → {msg.isTeamChat ? "team chat" : "DM"}
                  </span>
                </div>
                <div style={{ color: "#d1d5db", lineHeight: 1.4 }}>{msg.content}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
