import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../stores/game.js";

const ROUND_NAMES: Record<number, { name: string; date: string }> = {
  1: { name: "The Race Heats Up", date: "November 2026" },
  2: { name: "The Superhuman Coder", date: "Q1 2027" },
  3: { name: "The Intelligence Explosion", date: "Mid 2027" },
  4: { name: "The Misalignment Discovery", date: "Late 2027" },
  5: { name: "Endgame", date: "Early 2028" },
};

const FALLBACK_BRIEFING = `It's November 2026. The AI race is real and everyone who matters knows it.

OpenBrain has just finished training Agent-1 — a powerful coding and research agent. Internally, it's giving them a 50% R&D speedup. They haven't released it publicly. Their culture is velocity: ship fast, figure out alignment later. Their CEO has been on a media tour talking about "the glorious future."

Prometheus has a model of comparable raw capability, but they've invested heavily in alignment and interpretability instead of pure capabilities. Their responsible scaling policy means they won't deploy until safety evals pass. Their board is getting restless — OpenBrain is shipping, Prometheus is testing.

China's DeepCent has been quietly building the world's largest centralized cluster at the Tianwan nuclear plant. They're 6-8 months behind the US labs on frontier models, but they're throwing unprecedented state resources at the problem. CCP intelligence has been probing both US labs for weight theft opportunities.

The US government has begun classifying frontier AI progress. A small circle in the NSC knows how fast things are moving. Export controls are tightening. The public discourse is still mostly about chatbots and job displacement — nobody outside the inner circle grasps what's coming.

Markets are frothy. AI stocks are up 200% YoY. Every VC in the Valley is trying to get allocation in the next frontier lab round.`;

const REVEAL_DURATION_MS = 5000; // total time to reveal all paragraphs

export function Briefing() {
  const { round, briefingText } = useGameStore();
  const meta = ROUND_NAMES[round] ?? { name: "Unknown Round", date: "" };
  const text = briefingText ?? FALLBACK_BRIEFING;

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  const [revealedCount, setRevealedCount] = useState(0);
  const [fullyRevealed, setFullyRevealed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset state when briefing appears
    setRevealedCount(0);
    setFullyRevealed(false);

    if (paragraphs.length === 0) {
      setFullyRevealed(true);
      return;
    }

    const perParagraph = REVEAL_DURATION_MS / paragraphs.length;

    // Reveal first paragraph immediately
    setRevealedCount(1);

    let count = 1;
    intervalRef.current = setInterval(() => {
      count++;
      setRevealedCount(count);
      if (count >= paragraphs.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        // Small delay after last paragraph before showing "waiting" indicator
        setTimeout(() => setFullyRevealed(true), 400);
      }
    }, perParagraph);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
      }}
    >
      <div
        className="flex flex-col gap-6 px-8 py-10"
        style={{ maxWidth: "700px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}
      >
        {/* Round header */}
        <div className="flex flex-col gap-1">
          <div
            className="text-xs font-mono uppercase tracking-[0.25em]"
            style={{ color: "rgba(156, 163, 175, 0.7)" }}
          >
            {meta.date}
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#f9fafb", letterSpacing: "-0.02em" }}
          >
            <span style={{ color: "rgba(156, 163, 175, 0.5)" }}>
              ROUND {round}:{" "}
            </span>
            {meta.name}
          </h1>
          <div
            className="mt-2"
            style={{
              height: "1px",
              background: "linear-gradient(90deg, rgba(99,102,241,0.6) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Briefing paragraphs */}
        <div className="flex flex-col gap-4">
          {paragraphs.map((para, idx) => (
            <p
              key={idx}
              className="text-sm leading-relaxed"
              style={{
                color: idx < revealedCount ? "rgba(209, 213, 219, 0.92)" : "transparent",
                transition: "color 0.6s ease, opacity 0.6s ease",
                opacity: idx < revealedCount ? 1 : 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Waiting indicator */}
        <div
          className="flex items-center gap-2 text-xs font-mono"
          style={{
            color: "rgba(107, 114, 128, 0.8)",
            opacity: fullyRevealed ? 1 : 0,
            transition: "opacity 0.8s ease",
            marginTop: "0.5rem",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: "rgba(99, 102, 241, 0.7)",
              animation: fullyRevealed ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
            }}
          />
          waiting for GM to advance...
        </div>
      </div>
    </div>
  );
}
