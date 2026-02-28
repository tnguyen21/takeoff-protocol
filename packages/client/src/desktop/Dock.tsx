import { useRef, useState } from "react";
import { useUIStore, type WindowState } from "../stores/ui.js";
import { useMessagesStore } from "../stores/messages.js";

const APP_ICONS: Record<string, string> = {
  slack: "#",
  signal: "◆",
  wandb: "▲",
  news: "◉",
  twitter: "𝕏",
  email: "✉",
  sheets: "▦",
  gamestate: "◎",
  security: "⛨",
  bloomberg: "$",
  briefing: "◼",
  wechat: "◇",
  intel: "◈",
  military: "★",
  arxiv: "α",
  substack: "▣",
  memo: "▤",
  compute: "▥",
};

const ICON_SIZE = 52;
const ICON_GAP = 6;
const MAX_SCALE = 1.6;
const MAG_RADIUS = 100; // px from center to full fall-off

function getIconScale(mouseX: number | null, iconCenter: number): number {
  if (mouseX === null) return 1;
  const dist = Math.abs(mouseX - iconCenter);
  if (dist >= MAG_RADIUS) return 1;
  // Smooth cosine fall-off
  return 1 + (MAX_SCALE - 1) * Math.pow(1 - dist / MAG_RADIUS, 2);
}

export function Dock() {
  const { windows, openWindow, focusWindow, minimizeWindow } = useUIStore();
  const unreadCounts = useMessagesStore((s) => s.unreadCounts);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const handleClick = (w: WindowState) => {
    if (w.isOpen && !w.isMinimized) {
      minimizeWindow(w.id);
    } else {
      openWindow(w.appId, w.title);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dockRef.current) return;
    const rect = dockRef.current.getBoundingClientRect();
    setMouseX(e.clientX - rect.left);
  };

  const handleMouseLeave = () => setMouseX(null);

  return (
    <div
      className="absolute left-0 right-0 flex justify-center"
      style={{ bottom: "8px", pointerEvents: "none" }}
    >
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: `${ICON_GAP}px`,
          padding: "8px 12px",
          background: "rgba(28, 28, 30, 0.68)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
          pointerEvents: "all",
        }}
      >
        {windows.map((w, index) => {
          // Compute center of this icon within the dock content area
          const iconCenter = index * (ICON_SIZE + ICON_GAP) + ICON_SIZE / 2;
          const scale = getIconScale(mouseX, iconCenter);
          const unread = unreadCounts[w.appId] ?? 0;

          return (
            <button
              key={w.id}
              onClick={() => handleClick(w)}
              title={w.title}
              style={{
                position: "relative",
                width: `${ICON_SIZE}px`,
                height: `${ICON_SIZE}px`,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                transform: `scale(${scale})`,
                transformOrigin: "bottom center",
                transition: mouseX === null ? "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" : "transform 0.08s ease-out",
                background: w.isOpen
                  ? "rgba(255,255,255,0.16)"
                  : "rgba(255,255,255,0.06)",
                color: w.isOpen ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                willChange: "transform",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = w.isOpen
                  ? "rgba(255,255,255,0.22)"
                  : "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.95)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = w.isOpen
                  ? "rgba(255,255,255,0.16)"
                  : "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = w.isOpen
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.55)";
              }}
            >
              {APP_ICONS[w.appId] ?? "□"}

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

              {/* Open indicator dot */}
              {w.isOpen && (
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
  );
}
