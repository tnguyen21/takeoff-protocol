import { PHASE_LABELS } from "./shared.js";

interface HeaderProps {
  roomCode: string | null;
  round: number;
  phase: string | null;
  connectedCount: number;
  totalPlayers: number;
}

export function Header({ roomCode, round, phase, connectedCount, totalPlayers }: HeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        padding: "12px 24px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    >
      {/* GM badge */}
      <div
        style={{
          padding: "3px 10px",
          borderRadius: "6px",
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.4)",
          color: "#f87171",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        GM
      </div>

      {/* Room code */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#6b7280", fontSize: "12px" }}>Room</span>
        <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 700, letterSpacing: "0.15em", color: "#e5e7eb" }}>
          {roomCode ?? "—"}
        </span>
      </div>

      <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />

      {/* Round + Phase */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#9ca3af", fontSize: "13px" }}>
          Round <strong style={{ color: "#e5e7eb" }}>{round === 0 ? "Tutorial" : round}</strong>
        </span>
        <span
          style={{
            padding: "2px 10px",
            borderRadius: "20px",
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.35)",
            color: "#c4b5fd",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {PHASE_LABELS[phase ?? ""] ?? phase ?? "—"}
        </span>
        {round === 0 && (
          <span
            style={{
              padding: "2px 10px",
              borderRadius: "20px",
              background: "rgba(234,179,8,0.15)",
              border: "1px solid rgba(234,179,8,0.4)",
              color: "#fbbf24",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            TUTORIAL MODE
          </span>
        )}
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: connectedCount > 0 ? "#34d399" : "#6b7280",
          }}
        />
        <span style={{ color: "#9ca3af", fontSize: "12px" }}>
          {connectedCount} / {totalPlayers} connected
        </span>
      </div>
    </div>
  );
}
