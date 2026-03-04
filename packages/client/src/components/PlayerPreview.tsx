import { useState, useEffect, useCallback } from "react";
import {
  FACTIONS,
  computeFogView,
  type AppContent,
  type AppId,
  type Faction,
  type Role,
  type StateVariables,
  type StateView,
} from "@takeoff/shared";
import { APP_COMPONENTS } from "../apps/index.js";
import { getContentForApp } from "../stores/game.js";
import { socket } from "../socket.js";

const FACTION_COLORS: Record<string, string> = {
  openbrain: "#8b5cf6",
  prometheus: "#06b6d4",
  china: "#ef4444",
  external: "#f59e0b",
};

// Messaging apps are live-only — not previewable via gm:preview-content
const LIVE_ONLY_APPS: AppId[] = ["slack", "signal"];

interface PlayerPreviewProps {
  faction: Faction;
  role: Role;
  playerName: string;
  round: number;
  gmRawState: StateVariables;
  onClose: () => void;
}

export function PlayerPreview({ faction, role, playerName, round, gmRawState, onClose }: PlayerPreviewProps) {
  const factionConfig = FACTIONS.find((f) => f.id === faction);
  const roleConfig = factionConfig?.roles.find((r) => r.id === role);
  const factionApps: AppId[] = factionConfig?.apps ?? [];

  const [activeApp, setActiveApp] = useState<AppId>(factionApps[0] ?? "slack");
  const [content, setContent] = useState<AppContent[]>([]);
  const [loading, setLoading] = useState(true);

  const fogView: StateView = computeFogView(gmRawState, faction, role, round);

  // Fetch preview content from server
  useEffect(() => {
    setLoading(true);
    socket.emit(
      "gm:preview-content",
      { faction, role },
      (res: { ok: boolean; content?: AppContent[]; error?: string }) => {
        if (res.ok && res.content) {
          setContent(res.content);
        }
        setLoading(false);
      },
    );
  }, [faction, role]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const factionColor = FACTION_COLORS[faction] ?? "#6b7280";
  const isLiveOnly = LIVE_ONLY_APPS.includes(activeApp);
  const AppComponent = APP_COMPONENTS[activeApp];
  const appContent = getContentForApp(content, activeApp);

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* Panel — stop propagation so clicking inside doesn't close */}
      <div
        style={{
          width: "92vw",
          maxWidth: "1400px",
          height: "88vh",
          background: "#0d1117",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 20px",
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          {/* Faction badge */}
          <div
            style={{
              padding: "3px 10px",
              borderRadius: "6px",
              background: `${factionColor}22`,
              border: `1px solid ${factionColor}55`,
              color: factionColor,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {factionConfig?.name ?? faction}
          </div>

          {/* Player name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#e5e7eb" }}>{playerName}</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>{roleConfig?.label ?? role}</div>
          </div>

          {/* Preview label */}
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#4b5563",
              flexShrink: 0,
            }}
          >
            GM Preview
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              color: "#6b7280",
              fontSize: "16px",
              lineHeight: 1,
              padding: "4px 8px",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e5e7eb";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6b7280";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body: tab bar + content + sidebar */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Tab bar (vertical, left) */}
          <div
            style={{
              width: "120px",
              flexShrink: 0,
              background: "rgba(255,255,255,0.02)",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              padding: "8px 6px",
              gap: "2px",
              overflowY: "auto",
            }}
          >
            {factionApps.map((appId) => {
              const isActive = appId === activeApp;
              const isLive = LIVE_ONLY_APPS.includes(appId);
              return (
                <button
                  key={appId}
                  onClick={() => setActiveApp(appId)}
                  style={{
                    background: isActive ? `${factionColor}22` : "transparent",
                    border: isActive ? `1px solid ${factionColor}44` : "1px solid transparent",
                    borderRadius: "6px",
                    color: isActive ? factionColor : "#6b7280",
                    fontSize: "11px",
                    fontWeight: isActive ? 700 : 400,
                    padding: "6px 8px",
                    textAlign: "left",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                  }}
                  title={isLive ? `${appId} — live only` : appId}
                >
                  {appId}
                  {isLive && (
                    <span style={{ fontSize: "9px", color: "#4b5563", marginLeft: "4px" }}>●</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {loading ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4b5563",
                  fontSize: "13px",
                }}
              >
                Loading content…
              </div>
            ) : isLiveOnly ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4b5563",
                  fontSize: "13px",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "24px" }}>💬</span>
                <span>Live messaging — not previewable</span>
              </div>
            ) : (
              <AppComponent content={appContent} />
            )}
          </div>

          {/* Right sidebar: fogged state */}
          <div
            style={{
              width: "220px",
              flexShrink: 0,
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
              overflow: "auto",
              padding: "12px 10px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "#4b5563",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Fog View — {roleConfig?.label ?? role}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {(Object.entries(fogView) as [keyof StateVariables, StateView[keyof StateVariables]][]).map(
                ([key, fogVar]) => {
                  let valueText: string;
                  let valueColor: string;
                  let bgColor: string;

                  if (fogVar.accuracy === "exact") {
                    valueText = String(fogVar.value);
                    valueColor = "#34d399";
                    bgColor = "rgba(52,211,153,0.08)";
                  } else if (fogVar.accuracy === "estimate") {
                    valueText = `~${fogVar.value}`;
                    valueColor = "#f59e0b";
                    bgColor = "rgba(245,158,11,0.08)";
                  } else {
                    valueText = "HIDDEN";
                    valueColor = "#374151";
                    bgColor = "transparent";
                  }

                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        background: bgColor,
                      }}
                    >
                      <span style={{ fontSize: "9px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "4px" }}>
                        {key}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: valueColor,
                          flexShrink: 0,
                        }}
                      >
                        {valueText}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
