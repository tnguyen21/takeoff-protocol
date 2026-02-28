import { useEffect } from "react";
import { useGameStore } from "../stores/game.js";

/**
 * Renders a stack of transient notification banners when content is published.
 * Banners auto-dismiss after 6 seconds and can be manually closed.
 */
export function PublishNotificationBanner() {
  const { notifications, dismissNotification } = useGameStore();

  // Auto-dismiss notifications after 6 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const oldest = notifications[0];
    const elapsed = Date.now() - oldest.timestamp;
    const remaining = Math.max(0, 6000 - elapsed);
    const timer = setTimeout(() => {
      dismissNotification(oldest.id);
    }, remaining);
    return () => clearTimeout(timer);
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-8 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ marginTop: "var(--menubar-height, 28px)" }}>
      {notifications.slice(0, 3).map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto flex items-start gap-3 bg-neutral-900/95 border border-neutral-700 rounded-lg shadow-2xl px-4 py-3 min-w-64 max-w-80 backdrop-blur animate-in slide-in-from-right-4 duration-300"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Breaking</div>
            <div className="text-xs text-white font-medium leading-snug truncate">{notif.summary}</div>
            <div className="text-[10px] text-neutral-500 mt-1">via {notif.from}</div>
          </div>
          <button
            onClick={() => dismissNotification(notif.id)}
            className="text-neutral-600 hover:text-neutral-300 text-sm shrink-0 leading-none mt-0.5"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
