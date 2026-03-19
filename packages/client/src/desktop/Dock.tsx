import { useState } from "react";
import { useUIStore, type WindowState } from "../stores/ui.js";
import { useMessagesStore } from "../stores/messages.js";
import { useNotificationsStore } from "../stores/notifications.js";
import { useGameStore } from "../stores/game.js";
import { AppIcon } from "../apps/icons.js";
import { FACTIONS } from "@takeoff/shared";

const ICON_DISPLAY_SIZE = 24;

export function Dock() {
  const { windows, openWindow, minimizeWindow, openedThisRound } = useUIStore();
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
      // Clear unread badge and toasts when opening slack or signal
      if (w.appId === "slack" || w.appId === "signal") {
        markRead(w.appId);
        useNotificationsStore.getState().dismissByApp(w.appId);
      }
    }
  };

  return (
    <div className="absolute left-0 right-0 flex justify-center bottom-2 pointer-events-none z-[5000]">
      <div
        className="flex items-center gap-1 px-[10px] py-[6px] bg-[rgba(28,28,30,0.68)] backdrop-blur-[40px] backdrop-saturate-[180%] rounded-[14px] border border-white/[0.14] pointer-events-auto"
        style={{
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
        }}
      >
        {windows.map((w) => {
          const unread = unreadCounts[w.appId] ?? 0;

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
              className={`relative w-11 h-11 shrink-0 flex items-center justify-center rounded-[10px] border-none cursor-pointer transition-[background,color] duration-150 ${isSignalPulsing ? "negotiation-pulse" : ""}`}
              style={{
                background: isHovered
                  ? "rgba(255,255,255,0.18)"
                  : w.isOpen && !w.isMinimized
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.04)",
                color: isHovered || (w.isOpen && !w.isMinimized)
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.50)",
              }}
            >
              <AppIcon appId={w.appId} size={ICON_DISPLAY_SIZE} />

              {/* Tooltip */}
              {isHovered && (
                <span
                  className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white/90 bg-[rgba(30,30,32,0.85)] backdrop-blur-[12px] py-1 px-[10px] rounded-[6px] border border-white/[0.12] pointer-events-none"
                  style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                >
                  {w.title}
                </span>
              )}

              {/* Unread badge */}
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff3b30] text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-[3px]">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}

              {/* Primary app nudge dot */}
              {needsAttention && (
                <span
                  className="dock-primary-dot absolute -top-1 -left-1 w-2 h-2 rounded-full bg-amber-500 border-[1.5px] border-black/50 pointer-events-none"
                />
              )}

              {/* Open indicator dot */}
              {w.isOpen && !w.isMinimized && (
                <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
