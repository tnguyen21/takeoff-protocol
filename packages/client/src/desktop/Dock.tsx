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

export function Dock() {
  const { windows, openWindow, focusWindow, minimizeWindow } = useUIStore();
  const unreadCounts = useMessagesStore((s) => s.unreadCounts);

  const handleClick = (w: WindowState) => {
    if (w.isOpen && !w.isMinimized) {
      minimizeWindow(w.id);
    } else {
      openWindow(w.appId, w.title);
    }
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 backdrop-blur-md bg-black/30 border-t border-white/10"
      style={{ height: "var(--dock-height)" }}
    >
      {windows.map((w) => {
        const unread = unreadCounts[w.appId] ?? 0;
        return (
          <button
            key={w.id}
            onClick={() => handleClick(w)}
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95 ${
              w.isOpen
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
            title={w.title}
          >
            {APP_ICONS[w.appId] ?? "□"}

            {/* Unread badge */}
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-semibold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}

            {/* Open indicator dot */}
            {w.isOpen && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-white/60" />
            )}
          </button>
        );
      })}
    </div>
  );
}
