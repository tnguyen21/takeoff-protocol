import { useState } from "react";
import { useUIStore, type WindowState } from "../stores/ui.js";
import { useMessagesStore } from "../stores/messages.js";
import { useGameStore } from "../stores/game.js";
import { getAppIcon } from "../apps/icons.js";
import { FACTIONS } from "@takeoff/shared";

const ICON_SIZE = 44;
const ICON_GAP = 4;
const LUCIDE_SIZE = 24;

const PULSE_STYLE = `
@keyframes dock-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.dock-primary-dot {
  animation: dock-pulse 1.8s ease-in-out infinite;
}
`;

export function Dock() {
  const { windows, openWindow, focusWindow, minimizeWindow, openedThisRound } = useUIStore();
  const unreadCounts = useMessagesStore((s) => s.unreadCounts);
  const markRead = useMessagesStore((s) => s.markRead);
  const round = useGameStore((s) => s.round);
  const phase = useGameStore((s) => s.phase);
  const selectedFaction = useGameStore((s) => s.selectedFaction);
  const selectedRole = useGameStore((s) => s.selectedRole);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (phase === "briefing") return null;

  const isNegotiationPhase = round === 4 && phase === "deliberation";

  // Resolve primary apps for the current player's role
  const primaryApps = (() => {
    if (!selectedFaction || !selectedRole) return new Set<string>();
    const factionConfig = FACTIONS.find((f) => f.id === selectedFaction);
    const roleConfig = factionConfig?.roles.find((r) => r.id === selectedRole);
    return new Set(roleConfig?.primaryApps ?? []);
  })();

  const handleClick = (w: WindowState) => {
    if (w.isOpen && !w.isMinimized) {
      minimizeWindow(w.id);
    } else {
      openWindow(w.appId, w.title);
      // Clear unread badge when opening slack or signal
      if (w.appId === "slack" || w.appId === "signal") {
        markRead(w.appId);
      }
    }
  };

  return (
    <>
    <style>{PULSE_STYLE}</style>
    <div
      className="absolute left-0 right-0 flex justify-center"
      style={{ bottom: "8px", pointerEvents: "none", zIndex: 5000 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${ICON_GAP}px`,
          padding: "6px 10px",
          background: "rgba(28, 28, 30, 0.68)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
          pointerEvents: "all",
        }}
      >
        {windows.map((w) => {
          const unread = unreadCounts[w.appId] ?? 0;
          const IconComponent = getAppIcon(w.appId);
          const isHovered = hoveredId === w.id;
          const isPrimary = primaryApps.has(w.appId);
          const needsAttention = isPrimary && !openedThisRound.has(w.appId);

          const isSignalPulsing = isNegotiationPhase && w.appId === "signal";

          return (
            <button
              key={w.id}
              onClick={() => handleClick(w)}
              onMouseEnter={() => setHoveredId(w.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={isSignalPulsing ? "negotiation-pulse" : undefined}
              style={{
                position: "relative",
                width: `${ICON_SIZE}px`,
                height: `${ICON_SIZE}px`,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: isHovered
                  ? "rgba(255,255,255,0.18)"
                  : w.isOpen && !w.isMinimized
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.04)",
                color: isHovered || (w.isOpen && !w.isMinimized)
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.50)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {IconComponent ? (
                <IconComponent size={LUCIDE_SIZE} strokeWidth={1.5} />
              ) : (
                <span style={{ fontSize: "18px" }}>□</span>
              )}

              {/* Tooltip */}
              {isHovered && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    fontSize: "11px",
                    fontWeight: 500,
                    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    color: "rgba(255,255,255,0.9)",
                    background: "rgba(30, 30, 32, 0.85)",
                    backdropFilter: "blur(12px)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    pointerEvents: "none",
                  }}
                >
                  {w.title}
                </span>
              )}

              {/* Unread badge */}
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#ff3b30",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "999px",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}

              {/* Primary app nudge dot */}
              {needsAttention && (
                <span
                  className="dock-primary-dot"
                  style={{
                    position: "absolute",
                    top: "-4px",
                    left: "-4px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#f59e0b",
                    border: "1.5px solid rgba(0,0,0,0.5)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Open indicator dot */}
              {w.isOpen && !w.isMinimized && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "-5px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.70)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}
