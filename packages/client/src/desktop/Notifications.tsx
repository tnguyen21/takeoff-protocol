import { useEffect, useRef } from "react";
import { useNotificationsStore, type ToastNotification } from "../stores/notifications.js";
import { useUIStore } from "../stores/ui.js";
import { AppIcon } from "../apps/icons.js";
import { soundManager } from "../sounds/index.js";
import { formatTimestamp } from "../utils.js";

const MENUBAR_HEIGHT = 28;
const AUTO_DISMISS_MS = 5000;
const TOAST_GAP = 10;
const TOAST_HEIGHT = 76; // approximate height of each toast for stacking

function Toast({ notif, index }: { notif: ToastNotification; index: number }) {
  const { dismissNotification } = useNotificationsStore();
  const { openWindow } = useUIStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    soundManager.play("notification-chime");
    timerRef.current = setTimeout(() => {
      dismissNotification(notif.id);
    }, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notif.id, dismissNotification]);


  const top = MENUBAR_HEIGHT + 8 + index * (TOAST_HEIGHT + TOAST_GAP);

  const handleClick = () => {
    dismissNotification(notif.id);
    if (notif.onClick) {
      notif.onClick();
    } else {
      openWindow(notif.appId, notif.appId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="absolute right-3 w-80 bg-[rgba(28,28,32,0.88)] backdrop-blur-[24px] backdrop-saturate-[180%] border border-white/10 rounded-[13px] py-3 px-[14px] cursor-pointer z-[9000] flex items-start gap-[10px]"
      style={{
        top: `${top}px`,
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)",
        animation: "toast-slide-in 0.28s cubic-bezier(0.34,1.2,0.64,1) both",
      }}
    >
      {/* App icon */}
      <div className="w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center shrink-0 border border-white/[0.08]">
        <AppIcon appId={notif.appId} size={18} color="rgba(255,255,255,0.75)" />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[13px] font-semibold text-white/[0.92] overflow-hidden text-ellipsis whitespace-nowrap">
            {notif.title}
          </span>
          <span className="text-[11px] text-white/35 shrink-0 tabular-nums">
            {formatTimestamp(notif.timestamp)}
          </span>
        </div>
        <p
          className="mt-0.5 text-xs text-white/55 overflow-hidden leading-[1.4]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {notif.body}
        </p>
      </div>
    </div>
  );
}

export function Notifications() {
  const { visible } = useNotificationsStore();

  return (
    <>
      {visible.map((notif, index) => (
        <Toast key={notif.id} notif={notif} index={index} />
      ))}
    </>
  );
}
