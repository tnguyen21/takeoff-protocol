import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../stores/game.js";
import type { EndingArc, RoundHistory, StateVariables } from "@takeoff/shared";

// ── Constants ──────────────────────────────────────────────────────────────────

const GLITCH_DURATION_MS = 2200;
const FADE_TO_BLACK_MS = 800;
const ARTIFACT_DISPLAY_MS = 3800;
const ARTIFACT_FADE_MS = 600;

const STATE_LABELS: Record<keyof StateVariables, string> = {
  obCapability: "OB Capability",
  promCapability: "Prom Capability",
  chinaCapability: "China Capability",
  usChinaGap: "US-China Gap (mo)",
  obPromGap: "OB-Prom Gap (mo)",
  alignmentConfidence: "Alignment Confidence",
  misalignmentSeverity: "Misalignment Severity",
  publicAwareness: "Public Awareness",
  publicSentiment: "Public Sentiment",
  economicDisruption: "Economic Disruption",
  taiwanTension: "Taiwan Tension",
  obInternalTrust: "OB Internal Trust",
  securityLevelOB: "Security Level (OB)",
  securityLevelProm: "Security Level (Prom)",
  intlCooperation: "Intl Cooperation",
};

const STATE_KEYS = Object.keys(STATE_LABELS) as (keyof StateVariables)[];

// Media artifact: which arc's narrative is used, and what publication format
interface MediaArtifact {
  outlet: string;
  outletType: "nyt" | "reuters" | "bloomberg" | "twitter";
  arcId: string;
  date: string;
}

const ARTIFACTS: MediaArtifact[] = [
  { outlet: "The New York Times", outletType: "nyt", arcId: "aiRace", date: "March 15, 2028" },
  { outlet: "Reuters", outletType: "reuters", arcId: "usChinaRelations", date: "March 17, 2028" },
  { outlet: "Bloomberg Markets", outletType: "bloomberg", arcId: "economy", date: "March 20, 2028" },
  { outlet: "X / Twitter", outletType: "twitter", arcId: "publicReaction", date: "March 22, 2028" },
];

// ── Glitch Screen ──────────────────────────────────────────────────────────────

function GlitchScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"glitch" | "fade">("glitch");

  useEffect(() => {
    const glitchTimer = setTimeout(() => {
      setPhase("fade");
    }, GLITCH_DURATION_MS);

    const fadeTimer = setTimeout(() => {
      onDone();
    }, GLITCH_DURATION_MS + FADE_TO_BLACK_MS);

    return () => {
      clearTimeout(glitchTimer);
      clearTimeout(fadeTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: phase === "fade" ? "#000" : "#0a0a0a",
        transition: phase === "fade" ? `background ${FADE_TO_BLACK_MS}ms ease` : "none",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {phase === "glitch" && (
        <>
          {/* Scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)",
              animation: "scanlines 0.1s steps(1) infinite",
              pointerEvents: "none",
            }}
          />

          {/* Glitch bands */}
          <GlitchBands />

          {/* Static noise overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
              opacity: 0.35,
              animation: "flicker 0.15s steps(1) infinite",
            }}
          />

          {/* SIGNAL LOST text */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "monospace",
              fontSize: "clamp(1rem, 3vw, 2rem)",
              fontWeight: 700,
              letterSpacing: "0.3em",
              color: "#ff0000",
              textShadow: "0 0 20px #ff0000, 2px 0 0 #00ffff, -2px 0 0 #ff00ff",
              animation: "glitch-text 0.08s steps(1) infinite",
              userSelect: "none",
            }}
          >
            SIGNAL LOST
          </div>
        </>
      )}

      <style>{`
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.15; }
        }
        @keyframes glitch-text {
          0%   { clip-path: inset(0 0 85% 0); transform: translate(calc(-50% + 4px), -50%); }
          10%  { clip-path: inset(15% 0 60% 0); transform: translate(calc(-50% - 6px), -50%); }
          20%  { clip-path: inset(50% 0 30% 0); transform: translate(calc(-50% + 2px), -50%); color: #00ffff; }
          30%  { clip-path: inset(0 0 0 0); transform: translate(-50%, -50%); color: #ff0000; }
          40%  { clip-path: inset(70% 0 10% 0); transform: translate(calc(-50% + 8px), -50%); }
          50%  { clip-path: inset(0 0 0 0); transform: translate(-50%, -50%); }
          60%  { clip-path: inset(20% 0 70% 0); transform: translate(calc(-50% - 3px), -50%); color: #ff00ff; }
          70%  { clip-path: inset(0 0 0 0); transform: translate(-50%, -50%); color: #ff0000; }
          80%  { clip-path: inset(40% 0 40% 0); transform: translate(calc(-50% + 5px), -50%); }
          90%  { clip-path: inset(0 0 0 0); transform: translate(-50%, -50%); }
          100% { clip-path: inset(0 0 85% 0); transform: translate(calc(-50% + 1px), -50%); }
        }
        @keyframes band-shift {
          0%   { transform: translateX(0px); opacity: 0.6; }
          25%  { transform: translateX(-20px); opacity: 0.8; }
          50%  { transform: translateX(15px); opacity: 0.4; }
          75%  { transform: translateX(-8px); opacity: 0.9; }
          100% { transform: translateX(0px); opacity: 0.6; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes artifact-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function GlitchBands() {
  // Several horizontal bands that shift with rgb channel displacement
  const bands = [
    { top: "8%", height: "4px", delay: "0ms" },
    { top: "23%", height: "2px", delay: "40ms" },
    { top: "37%", height: "8px", delay: "15ms" },
    { top: "55%", height: "3px", delay: "70ms" },
    { top: "71%", height: "5px", delay: "25ms" },
    { top: "88%", height: "2px", delay: "55ms" },
  ];

  return (
    <>
      {bands.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: b.top,
            height: b.height,
            background: i % 2 === 0 ? "rgba(255,0,0,0.7)" : "rgba(0,255,255,0.5)",
            animation: `band-shift ${80 + i * 13}ms steps(1) infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
    </>
  );
}

// ── Media Artifact Components ──────────────────────────────────────────────────

function NYTArtifact({ arc }: { arc: EndingArc }) {
  const headline = arc.spectrum[arc.result].split(" — ")[0];

  return (
    <div
      style={{
        maxWidth: "700px",
        width: "100%",
        background: "#fff",
        color: "#111",
        padding: "2.5rem 3rem",
        boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
        animation: "artifact-in 0.6s ease forwards",
      }}
    >
      {/* Masthead */}
      <div style={{ textAlign: "center", borderBottom: "3px double #111", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.6rem", fontFamily: "serif", letterSpacing: "0.15em", textTransform: "uppercase", color: "#666", marginBottom: "0.25rem" }}>
          All the News That's Fit to Print
        </div>
        <div style={{ fontSize: "2.5rem", fontFamily: "serif", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
          The New York Times
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", fontFamily: "serif", color: "#555", marginTop: "0.5rem" }}>
          <span>VOL. CLXXVII . . . No. 61,542</span>
          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>LATE EDITION</span>
          <span>March 15, 2028</span>
        </div>
      </div>

      {/* Main headline */}
      <div style={{ borderBottom: "1px solid #111", paddingBottom: "1rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.55rem", fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#555", marginBottom: "0.35rem" }}>
          The AI Race — Special Report
        </div>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2.4rem)", fontFamily: "serif", fontWeight: 700, lineHeight: 1.1, margin: 0 }}>
          {headline}
        </h1>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.7rem", fontFamily: "sans-serif", color: "#777" }}>
          <span>By The Editorial Board</span>
          <span>·</span>
          <span>Analysis</span>
        </div>
      </div>

      {/* Body */}
      <p style={{ fontFamily: "serif", fontSize: "0.9rem", lineHeight: 1.6, margin: 0, color: "#222" }}>
        {arc.narrative}
      </p>

      <div style={{ marginTop: "1rem", fontSize: "0.65rem", fontFamily: "serif", color: "#aaa", textAlign: "right", fontStyle: "italic" }}>
        Continued on Page A4 ›
      </div>
    </div>
  );
}

function ReutersArtifact({ arc }: { arc: EndingArc }) {
  const headline = arc.spectrum[arc.result].split(" — ")[0];

  return (
    <div
      style={{
        maxWidth: "680px",
        width: "100%",
        background: "#1a1a1a",
        border: "1px solid #333",
        padding: "2rem 2.5rem",
        boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
        animation: "artifact-in 0.6s ease forwards",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "2px solid #ff8000", paddingBottom: "0.75rem" }}>
        <div style={{ background: "#ff8000", color: "#000", fontFamily: "sans-serif", fontWeight: 900, fontSize: "1.1rem", padding: "0.2rem 0.6rem", letterSpacing: "-0.03em" }}>
          REUTERS
        </div>
        <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#999", marginLeft: "auto" }}>
          WIRE DISPATCH · PRIORITY: URGENT · March 17, 2028 14:22 UTC
        </div>
      </div>

      {/* Slug */}
      <div style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#ff8000", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
        GEOPOLITICS / US-CHINA RELATIONS
      </div>

      {/* Headline */}
      <h1 style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: "clamp(1.1rem, 3vw, 1.7rem)", color: "#f0f0f0", lineHeight: 1.2, margin: "0 0 1rem 0" }}>
        {headline}
      </h1>

      {/* Dateline + body */}
      <p style={{ fontFamily: "sans-serif", fontSize: "0.85rem", lineHeight: 1.65, color: "#ccc", margin: 0 }}>
        <span style={{ fontWeight: 700, color: "#fff" }}>SINGAPORE, March 17 (Reuters) — </span>
        {arc.narrative}
      </p>

      <div style={{ marginTop: "1.5rem", fontSize: "0.6rem", fontFamily: "monospace", color: "#555", display: "flex", justifyContent: "space-between" }}>
        <span>(Reporting by the Asia Bureau; Editing by World Desk)</span>
        <span>© Thomson Reuters 2028</span>
      </div>
    </div>
  );
}

function BloombergArtifact({ arc }: { arc: EndingArc }) {
  const headline = arc.spectrum[arc.result].split(" — ")[0];

  return (
    <div
      style={{
        maxWidth: "700px",
        width: "100%",
        background: "#000",
        border: "1px solid #1a1a1a",
        padding: "2rem 2.5rem",
        boxShadow: "0 25px 80px rgba(0,0,0,0.9)",
        animation: "artifact-in 0.6s ease forwards",
      }}
    >
      {/* Bloomberg terminal header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#ff6200", padding: "0.15rem 0.5rem" }}>
          <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "1rem", color: "#000", letterSpacing: "-0.02em" }}>Bloomberg</span>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#555" }}>
          TERMINAL · MARKETS · ECONOMIC ANALYSIS
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#ff6200", marginLeft: "auto" }}>
          03/20/2028 09:31:44
        </div>
      </div>

      {/* Category */}
      <div style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
        ECONOMICS / AI IMPACT REPORT
      </div>

      {/* Headline */}
      <h1 style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: "clamp(1.1rem, 3vw, 1.6rem)", color: "#fff", lineHeight: 1.2, margin: "0 0 0.5rem 0" }}>
        {headline}
      </h1>
      <div style={{ height: "2px", background: "linear-gradient(90deg, #ff6200 0%, transparent 80%)", marginBottom: "1rem" }} />

      {/* Body */}
      <p style={{ fontFamily: "sans-serif", fontSize: "0.85rem", lineHeight: 1.65, color: "#ddd", margin: 0 }}>
        {arc.narrative}
      </p>

      <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", borderTop: "1px solid #222", paddingTop: "1rem" }}>
        {[
          { label: "AI DISRUPTION INDEX", value: "74.2", delta: "+12.8" },
          { label: "LABOR DISPLACEMENT", value: "23.1%", delta: "+5.4%" },
          { label: "PRODUCTIVITY GAIN", value: "38.7%", delta: "+15.2%" },
        ].map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: "0.5rem", fontFamily: "monospace", color: "#666", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>{stat.label}</div>
            <div style={{ fontSize: "1.1rem", fontFamily: "monospace", fontWeight: 700, color: "#fff" }}>{stat.value}</div>
            <div style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#34d399" }}>{stat.delta} YTD</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TwitterArtifact({ arc }: { arc: EndingArc }) {
  const headline = arc.spectrum[arc.result].split(" — ")[0];

  return (
    <div
      style={{
        maxWidth: "580px",
        width: "100%",
        background: "#16181c",
        border: "1px solid #2f3336",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
        animation: "artifact-in 0.6s ease forwards",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid #2f3336" }}>
        <div style={{ background: "#1d9bf0", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 900, color: "#fff" }}>
          𝕏
        </div>
        <div style={{ fontSize: "0.9rem", fontFamily: "sans-serif", fontWeight: 700, color: "#fff" }}>X / Twitter — Trending</div>
        <div style={{ marginLeft: "auto", fontSize: "0.65rem", fontFamily: "sans-serif", color: "#71767b" }}>March 22, 2028</div>
      </div>

      {/* Thread post */}
      <div style={{ padding: "1rem", borderBottom: "1px solid #2f3336" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", flexShrink: 0 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <span style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>AI Correspondent</span>
              <span style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#71767b" }}>@aicorr · 1h</span>
            </div>
            <div style={{ fontFamily: "sans-serif", fontSize: "0.9rem", lineHeight: 1.5, color: "#e7e9ea" }}>
              🧵 THREAD: Here's what actually happened, and why almost nobody saw it coming.
              <br /><br />
              <span style={{ fontWeight: 700 }}>1/ {headline}.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continuation */}
      <div style={{ padding: "1rem", borderBottom: "1px solid #2f3336" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", flexShrink: 0 }} />
          <div style={{ fontFamily: "sans-serif", fontSize: "0.9rem", lineHeight: 1.5, color: "#e7e9ea" }}>
            <span style={{ fontWeight: 700 }}>2/ </span>{arc.narrative.substring(0, 200)}{arc.narrative.length > 200 ? "..." : ""}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "0.75rem 1rem", display: "flex", gap: "1.5rem" }}>
        {[
          { icon: "💬", count: "2.4K" },
          { icon: "🔁", count: "18.2K" },
          { icon: "❤️", count: "94.7K" },
        ].map((stat) => (
          <div key={stat.icon} style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#71767b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>{stat.icon}</span>
            <span>{stat.count}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontFamily: "sans-serif", fontSize: "0.7rem", color: "#1d9bf0", fontWeight: 700 }}>
          #Trending #{arc.id}
        </div>
      </div>
    </div>
  );
}

// ── Montage Sequence ───────────────────────────────────────────────────────────

function MontageSequence({ arcs, onDone }: { arcs: EndingArc[]; onDone: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (currentIdx >= ARTIFACTS.length) {
      onDone();
      return;
    }

    const showTimer = setTimeout(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((i) => i + 1);
        setVisible(true);
      }, ARTIFACT_FADE_MS);
    }, ARTIFACT_DISPLAY_MS);

    return () => clearTimeout(showTimer);
  }, [currentIdx, onDone]);

  if (currentIdx >= ARTIFACTS.length) return null;

  const artifact = ARTIFACTS[currentIdx];
  const arc = arcs.find((a) => a.id === artifact.arcId);

  if (!arc) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        zIndex: 9000,
      }}
    >
      {/* Progress dots */}
      <div style={{ position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.5rem" }}>
        {ARTIFACTS.map((_, i) => (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: i === currentIdx ? "#6366f1" : i < currentIdx ? "#4b5563" : "#1f2937",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>

      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${ARTIFACT_FADE_MS}ms ease`,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {artifact.outletType === "nyt" && <NYTArtifact arc={arc} />}
        {artifact.outletType === "reuters" && <ReutersArtifact arc={arc} />}
        {artifact.outletType === "bloomberg" && <BloombergArtifact arc={arc} />}
        {artifact.outletType === "twitter" && <TwitterArtifact arc={arc} />}
      </div>
    </div>
  );
}

// ── Debrief Screen ─────────────────────────────────────────────────────────────

function ArcSpectrumBar({ arc }: { arc: EndingArc }) {
  const pct = (arc.result / (arc.spectrum.length - 1)) * 100;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <span style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#f9fafb" }}>{arc.label}</span>
        <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#6b7280" }}>{arc.spectrum[arc.result].split(" — ")[0]}</span>
      </div>

      {/* Spectrum track */}
      <div style={{ position: "relative", height: "6px", background: "linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #34d399 100%)", borderRadius: "3px", marginBottom: "0.4rem" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "#fff",
            border: "3px solid #6366f1",
            boxShadow: "0 0 8px rgba(99,102,241,0.8)",
          }}
        />
      </div>

      {/* Endpoints */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", fontFamily: "monospace", color: "#4b5563" }}>
        <span style={{ maxWidth: "40%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{arc.spectrum[0].split(" — ")[0]}</span>
        <span style={{ maxWidth: "40%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
          {arc.spectrum[arc.spectrum.length - 1].split(" — ")[0]}
        </span>
      </div>

      {/* Narrative */}
      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "sans-serif", color: "#9ca3af", lineHeight: 1.5, fontStyle: "italic" }}>
        {arc.narrative}
      </div>
    </div>
  );
}

function StateHistoryTable({ history, finalState }: { history: RoundHistory[]; finalState: StateVariables | null }) {
  const rounds = history.length > 0 ? history.map((h) => h.round) : [1, 2, 3, 4, 5];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", fontFamily: "monospace" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#6b7280", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap", minWidth: "160px" }}>
              Variable
            </th>
            {rounds.map((r) => (
              <th key={r} style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#6b7280", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap" }}>
                R{r} Before
              </th>
            ))}
            {finalState && (
              <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#6366f1", borderBottom: "1px solid #1f2937", whiteSpace: "nowrap" }}>
                Final
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {STATE_KEYS.map((key) => (
            <tr key={key} style={{ borderBottom: "1px solid #111" }}>
              <td style={{ padding: "0.4rem 0.75rem", color: "#9ca3af", whiteSpace: "nowrap" }}>{STATE_LABELS[key]}</td>
              {history.map((h) => (
                <td key={h.round} style={{ textAlign: "right", padding: "0.4rem 0.75rem", color: "#d1d5db", fontVariantNumeric: "tabular-nums" }}>
                  {h.stateBefore[key].toFixed(0)}
                </td>
              ))}
              {finalState && (
                <td style={{ textAlign: "right", padding: "0.4rem 0.75rem", color: "#818cf8", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {finalState[key].toFixed(0)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DecisionHistoryPanel({ history }: { history: RoundHistory[] }) {
  return (
    <div>
      {history.map((h) => (
        <div key={h.round} style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Round {h.round}
          </div>

          {/* Team decisions */}
          {Object.entries(h.teamDecisions).length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#4b5563", marginBottom: "0.25rem" }}>Team Decisions:</div>
              {Object.entries(h.teamDecisions).map(([faction, optionId]) => (
                <div key={faction} style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", fontFamily: "monospace", padding: "0.2rem 0", color: "#9ca3af" }}>
                  <span style={{ color: "#6b7280", minWidth: "120px" }}>{faction}</span>
                  <span style={{ color: "#e5e7eb" }}>{optionId}</span>
                </div>
              ))}
            </div>
          )}

          {/* Individual decisions */}
          {Object.entries(h.decisions).length > 0 && (
            <div>
              <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#4b5563", marginBottom: "0.25rem" }}>Individual Decisions:</div>
              {Object.entries(h.decisions).map(([playerId, optionId]) => (
                <div key={playerId} style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", fontFamily: "monospace", padding: "0.2rem 0", color: "#9ca3af" }}>
                  <span style={{ color: "#6b7280", minWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{playerId}</span>
                  <span style={{ color: "#e5e7eb" }}>{optionId}</span>
                </div>
              ))}
            </div>
          )}

          {Object.entries(h.teamDecisions).length === 0 && Object.entries(h.decisions).length === 0 && (
            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#374151", fontStyle: "italic" }}>No decisions recorded.</div>
          )}
        </div>
      ))}
    </div>
  );
}

function DebriefScreen() {
  const { endingArcs, endingHistory, endingFinalState } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#020204",
        overflowY: "auto",
        zIndex: 8000,
      }}
      ref={scrollRef}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(2, 2, 4, 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1f2937",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: "0.6rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b7280", marginBottom: "0.15rem" }}>
            Takeoff Protocol — After Action Report
          </div>
          <h1 style={{ fontFamily: "sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "-0.02em" }}>
            Full Debrief
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "3rem 2rem" }}>

        {/* Section 1: Narrative Arcs */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "0.01em" }}>
              § 1 — Narrative Arcs
            </h2>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }} />
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#6b7280", marginBottom: "2rem", lineHeight: 1.5 }}>
            Nine independent narrative arcs, each reflecting how a dimension of the crisis resolved. The marker shows where the game landed on each spectrum (red = worst, green = best).
          </p>
          {endingArcs.length > 0 ? (
            endingArcs.map((arc) => <ArcSpectrumBar key={arc.id} arc={arc} />)
          ) : (
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#374151", fontStyle: "italic" }}>No arc data available.</div>
          )}
        </section>

        {/* Section 2: State History */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "0.01em" }}>
              § 2 — State Variable History
            </h2>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }} />
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Fog of war lifted. True values at the start of each round, as they actually were — not as any faction perceived them.
          </p>
          <div style={{ background: "#0a0a0f", border: "1px solid #1f2937", borderRadius: "4px", overflow: "hidden" }}>
            <StateHistoryTable history={endingHistory} finalState={endingFinalState} />
          </div>
        </section>

        {/* Section 3: Decision Log */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f9fafb", margin: 0, letterSpacing: "0.01em" }}>
              § 3 — Decision Log
            </h2>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #6366f1 0%, transparent 100%)" }} />
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Every faction team decision and individual player decision, round by round.
          </p>
          <div style={{ background: "#0a0a0f", border: "1px solid #1f2937", borderRadius: "4px", padding: "1.5rem" }}>
            {endingHistory.length > 0 ? (
              <DecisionHistoryPanel history={endingHistory} />
            ) : (
              <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#374151", fontStyle: "italic" }}>No decision history available.</div>
            )}
          </div>
        </section>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "2rem 0 4rem", borderTop: "1px solid #0f1117" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#1f2937", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Takeoff Protocol Exercise — End of Simulation
          </div>
          <div style={{ marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.55rem", color: "#111827" }}>
            Based on AI 2027 scenario · aicrisisexercise.com
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Ending Screen ─────────────────────────────────────────────────────────

type EndingStage = "glitch" | "montage" | "debrief";

export function Ending() {
  const { endingArcs } = useGameStore();
  const [stage, setStage] = useState<EndingStage>("glitch");

  const handleGlitchDone = () => setStage("montage");
  const handleMontageDone = () => setStage("debrief");

  return (
    <>
      {stage === "glitch" && <GlitchScreen onDone={handleGlitchDone} />}
      {stage === "montage" && <MontageSequence arcs={endingArcs} onDone={handleMontageDone} />}
      {stage === "debrief" && <DebriefScreen />}
    </>
  );
}
