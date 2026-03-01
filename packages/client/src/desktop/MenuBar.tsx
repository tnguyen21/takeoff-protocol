import { useEffect, useState } from "react";
import { useGameStore } from "../stores/game.js";
import { useSoundEffects } from "../sounds/index.js";
import { Volume2, VolumeX } from "lucide-react";

const ROUND_NAMES: Record<number, string> = {
  1: "The Race Heats Up",
  2: "The Superhuman Coder",
  3: "The Intelligence Explosion",
  4: "The Branch Point",
  5: "Endgame",
};

const ROUND_DATES: Record<number, string> = {
  1: "Nov 2026",
  2: "Mar 2027",
  3: "Jul 2027",
  4: "Nov 2027",
  5: "Feb 2028",
};

export function MenuBar() {
  const { phase, round, timer, selectedFaction } = useGameStore();
  const { muted, toggleMute } = useSoundEffects();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!timer.endsAt || timer.pausedAt) {
      if (timer.pausedAt) setTimeLeft("PAUSED");
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, timer.endsAt - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 200);

    return () => clearInterval(interval);
  }, [timer]);

  const factionLabel =
    selectedFaction === "openbrain"
      ? "OpenBrain"
      : selectedFaction === "prometheus"
        ? "Prometheus"
        : selectedFaction === "china"
          ? "China"
          : "External";

  return (
    <div
      className="w-full flex items-center justify-between select-none"
      style={{
        height: "var(--menubar-height)",
        background: "rgba(24, 24, 26, 0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        paddingInline: "12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      {/* Left side: Apple logo + faction */}
      <div className="flex items-center gap-3">
        <span
          style={{
            fontSize: "16px",
            lineHeight: 1,
            color: "rgba(255,255,255,0.9)",
            marginTop: "-1px",
          }}
          aria-hidden="true"
        >
          {"\uF8FF"}
        </span>
        <span style={{ color: "rgba(255,255,255,0.90)", fontWeight: 600 }}>
          {factionLabel}
        </span>
        {phase && phase !== "lobby" && (
          <>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </span>
          </>
        )}
      </div>

      {/* Right side: round info + timer + mute */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMute}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: muted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            padding: "2px",
            borderRadius: "4px",
            transition: "color 0.15s",
          }}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        {round > 0 && (
          <>
            <span
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "12px",
              }}
            >
              {ROUND_DATES[round]}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.30)",
                fontSize: "11px",
              }}
            >
              R{round}: {ROUND_NAMES[round]}
            </span>
          </>
        )}
        {timeLeft && (
          <span
            style={{
              fontFamily: "'SF Mono', 'Menlo', 'Monaco', monospace",
              fontSize: "12px",
              color: "rgba(255,255,255,0.85)",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "5px",
              padding: "1px 7px",
              border: "1px solid rgba(255,255,255,0.10)",
              letterSpacing: "0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {timeLeft}
          </span>
        )}
      </div>
    </div>
  );
}
