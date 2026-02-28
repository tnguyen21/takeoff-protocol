import { useState } from "react";
import { useGameStore } from "../stores/game.js";
import { useMessagesStore } from "../stores/messages.js";
import type { Faction } from "@takeoff/shared";

const FACTION_LABELS: Record<Faction, string> = {
  openbrain: "OpenBrain",
  prometheus: "Prometheus",
  china: "China",
  external: "External",
};

const FACTIONS: Faction[] = ["openbrain", "prometheus", "china", "external"];

export function TokenDisplay() {
  const { influenceTokens, spendToken, selectedFaction, content, phase } = useGameStore();
  const { messages } = useMessagesStore();
  const playerId = useGameStore((s) => s.playerId);

  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<"block_info" | "reveal_dm" | null>(null);

  // Block Info state
  const [blockTargetFaction, setBlockTargetFaction] = useState<Faction | "">("");
  const [blockContentId, setBlockContentId] = useState<string>("");

  // Reveal DM state
  const [revealMessageId, setRevealMessageId] = useState<string>("");

  // Only show during intel/deliberation phases
  if (!phase || phase === "lobby" || phase === "ending") return null;

  const disabled = influenceTokens <= 0;

  // Content items for block selection (flat list from all apps)
  const allContentItems = content.flatMap((c) => c.items);

  // Cross-faction DMs this player is party to
  const dmMessages = messages.filter(
    (m) => !m.isTeamChat && (m.from === playerId || m.to === playerId)
  );

  const handleClose = () => {
    setOpen(false);
    setActiveAction(null);
    setBlockTargetFaction("");
    setBlockContentId("");
    setRevealMessageId("");
  };

  const handleBlockInfo = () => {
    if (!blockTargetFaction || !blockContentId) return;
    spendToken("block_info", { targetFaction: blockTargetFaction as Faction, contentId: blockContentId });
    handleClose();
  };

  const handleRevealDM = () => {
    if (!revealMessageId) return;
    spendToken("reveal_dm", { messageId: revealMessageId });
    handleClose();
  };

  // Factions other than the player's own
  const otherFactions = FACTIONS.filter((f) => f !== selectedFaction);

  return (
    <>
      {/* Token indicator button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: disabled ? "rgba(80,80,80,0.25)" : "rgba(139,92,246,0.2)",
          border: `1px solid ${disabled ? "rgba(255,255,255,0.10)" : "rgba(139,92,246,0.50)"}`,
          borderRadius: "5px",
          padding: "1px 7px",
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          fontSize: "12px",
          color: disabled ? "rgba(255,255,255,0.35)" : "rgba(199,150,255,0.95)",
          fontWeight: 500,
          transition: "all 0.15s ease",
          letterSpacing: "0.01em",
        }}
        title={disabled ? "No influence tokens remaining" : `${influenceTokens} influence token${influenceTokens !== 1 ? "s" : ""} remaining`}
      >
        <span style={{ fontSize: "11px" }}>◆</span>
        <span>{influenceTokens}</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            style={{
              background: "rgba(18,18,28,0.97)",
              border: "1px solid rgba(139,92,246,0.30)",
              borderRadius: "12px",
              padding: "24px",
              width: "420px",
              maxWidth: "90vw",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              color: "rgba(255,255,255,0.90)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "rgba(199,150,255,0.9)", fontSize: "18px" }}>◆</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "15px" }}>Influence Tokens</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.40)", marginTop: "1px" }}>
                    {influenceTokens} remaining
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.40)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {disabled && !activeAction && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "13px", padding: "20px 0" }}>
                No influence tokens remaining.
              </div>
            )}

            {/* Action selection */}
            {!activeAction && !disabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <ActionButton
                  icon="🚫"
                  label="Block Information"
                  description="Prevent one content item from reaching another faction this round"
                  onClick={() => setActiveAction("block_info")}
                />
                <ActionButton
                  icon="📢"
                  label="Reveal DM"
                  description="Force a cross-faction DM to be revealed to your whole team"
                  onClick={() => setActiveAction("reveal_dm")}
                  disabled={dmMessages.length === 0}
                  disabledReason="No cross-faction DMs to reveal"
                />
              </div>
            )}

            {/* Block Info form */}
            {activeAction === "block_info" && (
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "rgba(199,150,255,0.9)" }}>
                  Block Information
                </div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.50)", marginBottom: "4px" }}>
                  Target faction
                </label>
                <select
                  value={blockTargetFaction}
                  onChange={(e) => setBlockTargetFaction(e.target.value as Faction)}
                  style={selectStyle}
                >
                  <option value="">Select faction…</option>
                  {otherFactions.map((f) => (
                    <option key={f} value={f}>{FACTION_LABELS[f]}</option>
                  ))}
                </select>

                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.50)", marginBottom: "4px", marginTop: "12px" }}>
                  Content item to block
                </label>
                <select
                  value={blockContentId}
                  onChange={(e) => setBlockContentId(e.target.value)}
                  style={selectStyle}
                  disabled={allContentItems.length === 0}
                >
                  <option value="">Select content…</option>
                  {allContentItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sender ? `[${item.sender}] ` : ""}{item.subject ?? item.body.slice(0, 60)}
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button onClick={() => setActiveAction(null)} style={cancelBtnStyle}>Back</button>
                  <button
                    onClick={handleBlockInfo}
                    disabled={!blockTargetFaction || !blockContentId}
                    style={confirmBtnStyle(!blockTargetFaction || !blockContentId)}
                  >
                    Spend Token
                  </button>
                </div>
              </div>
            )}

            {/* Reveal DM form */}
            {activeAction === "reveal_dm" && (
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "rgba(199,150,255,0.9)" }}>
                  Reveal DM to Team
                </div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.50)", marginBottom: "4px" }}>
                  Select DM to reveal
                </label>
                <select
                  value={revealMessageId}
                  onChange={(e) => setRevealMessageId(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select message…</option>
                  {dmMessages.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fromName}: {m.content.slice(0, 60)}
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button onClick={() => setActiveAction(null)} style={cancelBtnStyle}>Back</button>
                  <button
                    onClick={handleRevealDM}
                    disabled={!revealMessageId}
                    style={confirmBtnStyle(!revealMessageId)}
                  >
                    Spend Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({
  icon,
  label,
  description,
  onClick,
  disabled,
  disabledReason,
}: {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled && disabledReason ? disabledReason : undefined}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.10)",
        background: disabled ? "rgba(255,255,255,0.02)" : "rgba(139,92,246,0.08)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        textAlign: "left",
        width: "100%",
        transition: "background 0.15s ease",
        color: "inherit",
      }}
    >
      <span style={{ fontSize: "18px", lineHeight: 1.3 }}>{icon}</span>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.90)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{description}</div>
      </div>
    </button>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "6px",
  padding: "7px 10px",
  color: "rgba(255,255,255,0.85)",
  fontSize: "13px",
  outline: "none",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.60)",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
};

function confirmBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    flex: 2,
    padding: "8px",
    borderRadius: "6px",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.10)" : "rgba(139,92,246,0.60)"}`,
    background: disabled ? "rgba(255,255,255,0.04)" : "rgba(139,92,246,0.25)",
    color: disabled ? "rgba(255,255,255,0.25)" : "rgba(199,150,255,0.95)",
    fontSize: "13px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  };
}
