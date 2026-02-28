import { useEffect, useState } from "react";
import { useGameStore } from "../stores/game.js";

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
      className="w-full flex items-center justify-between px-4 text-sm text-white/90 backdrop-blur-md bg-black/40 border-b border-white/10 select-none"
      style={{ height: "var(--menubar-height)" }}
    >
      <div className="flex items-center gap-4">
        <span className="font-semibold">{factionLabel}</span>
        {phase && phase !== "lobby" && (
          <span className="text-white/50">
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {round > 0 && (
          <>
            <span className="text-white/60">{ROUND_DATES[round]}</span>
            <span className="text-white/40">R{round}: {ROUND_NAMES[round]}</span>
          </>
        )}
        {timeLeft && (
          <span className="font-mono text-white/80 tabular-nums">{timeLeft}</span>
        )}
      </div>
    </div>
  );
}
