import { useEffect, useRef } from "react";
import { useNotificationsStore, type ToastNotification } from "../stores/notifications.js";
import { useUIStore } from "../stores/ui.js";
import { AppIcon } from "../apps/icons.js";
import { soundManager } from "../sounds/index.js";

const MENUBAR_HEIGHT = 28;
const AUTO_DISMISS_MS = 5000;
const TOAST_GAP = 10;
const TOAST_HEIGHT = 76; // approximate height of each toast for stacking

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
      style={{
        position: "absolute",
        top: `${top}px`,
        right: "12px",
        width: "320px",
        background: "rgba(28, 28, 32, 0.88)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "13px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)",
        padding: "12px 14px",
        cursor: "pointer",
        zIndex: 9000,
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        animation: "toast-slide-in 0.28s cubic-bezier(0.34,1.2,0.64,1) both",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}
    >
      {/* App icon */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <AppIcon appId={notif.appId} size={18} color="rgba(255,255,255,0.75)" />
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {notif.title}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(notif.timestamp)}
          </span>
        </div>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "12px",
            color: "rgba(255,255,255,0.55)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: "1.4",
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
      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(calc(100% + 24px));
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      {visible.map((notif, index) => (
        <Toast key={notif.id} notif={notif} index={index} />
      ))}
    </>
  );
}
