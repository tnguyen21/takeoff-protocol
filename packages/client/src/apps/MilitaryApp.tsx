import React from "react";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { computeThreatCon, getTaiwanSituation, getPrcNavalMovements, getPrecedenceLabel } from "./militaryUtils.js";

// ── Static data ───────────────────────────────────────────────────────────────

const FORCE_STATUS = [
  { unit: "7th Fleet (Pacific)", status: "ELEVATED",   readiness: 88, location: "W. Pacific" },
  { unit: "5th Fleet (Mideast)", status: "NORMAL",     readiness: 94, location: "Arabian Sea" },
  { unit: "STRATCOM",            status: "ELEVATED",   readiness: 97, location: "Offutt AFB" },
  { unit: "CYBERCOM",            status: "HIGH ALERT", readiness: 99, location: "Fort Meade" },
  { unit: "82nd Airborne",       status: "NORMAL",     readiness: 91, location: "Ft. Bragg" },
];

const STATUS_COLORS: Record<string, string> = {
  "NORMAL":     "text-green-400",
  "ELEVATED":   "text-yellow-400",
  "HIGH ALERT": "text-red-400",
};

// Each entry: [precedence, labelColor, dtg, text]
const HARDCODED_EVENTS: [string, string, string, string][] = [
  ["FLASH",     "text-red-500",     "281042Z FEB 26", "CYBERCOM: sustained foreign cyber operations targeting AI research infrastructure — attribution: PRC state actors"],
  ["IMMEDIATE", "text-orange-400",  "280921Z FEB 26", "7th Fleet: additional surface combatants ordered to W. Pacific — CSG-11 departing Pearl Harbor 291200Z"],
  ["PRIORITY",  "text-neutral-400", "280830Z FEB 26", "Taiwan Strait: PRC naval exercise extended beyond announced window — 14 surface combatants observed in strait"],
  ["PRIORITY",  "text-neutral-400", "280700Z FEB 26", "STRATCOM: ICBM force readiness check completed — all systems nominal, no anomalies detected"],
  ["IMMEDIATE", "text-orange-400",  "280612Z FEB 26", "NSA SIGINT: encrypted burst communications spike on PRC military network — likely exercise C2 traffic"],
  ["PRIORITY",  "text-neutral-400", "280500Z FEB 26", "State Dept: Beijing postponed scheduled diplomatic call — no explanation provided to Embassy staff"],
  ["ROUTINE",   "text-green-700",   "280348Z FEB 26", "INDOPACOM: USS Ronald Reagan returned to Yokosuka — scheduled port call, 72h liberty authorized"],
  ["ROUTINE",   "text-green-700",   "280230Z FEB 26", "DIA: Updated PRC order of battle assessment transmitted to all PACOM subordinate commands"],
  ["ROUTINE",   "text-green-700",   "271845Z FEB 26", "Space Domain: SBIRS alert — missile test from Jiuquan, assessed as routine ICBM test (DF-5B variant)"],
];

// ── Component ─────────────────────────────────────────────────────────────────

export const MilitaryApp = React.memo(function MilitaryApp({ content }: AppProps) {
  const stateView = useGameStore((s) => s.stateView);

  // Read taiwanTension and chinaCapability with fog-of-war guard
  const rawTension    = stateView?.taiwanTension?.accuracy    !== "hidden" ? stateView?.taiwanTension?.value    : null;
  const rawCapability = stateView?.chinaCapability?.accuracy  !== "hidden" ? stateView?.chinaCapability?.value  : null;

  const threatLevel     = rawTension    != null ? computeThreatCon(rawTension)       : 3;
  const taiwanDisplay   = rawTension    != null ? getTaiwanSituation(rawTension)     : { value: "ELEVATED", color: "text-orange-400" };
  const prcNavalDisplay = rawCapability != null ? getPrcNavalMovements(rawCapability) : { value: "INCREASED", color: "text-orange-400" };

  const INDICATORS = [
    { label: "Taiwan Strait Situation", value: taiwanDisplay.value,   color: taiwanDisplay.color },
    { label: "DPRK Activity",           value: "MONITORING",           color: "text-yellow-400" },
    { label: "PRC Naval Movements",     value: prcNavalDisplay.value,  color: prcNavalDisplay.color },
    { label: "Allied Coordination",     value: "ACTIVE",               color: "text-green-400" },
    { label: "Space Domain",            value: "NOMINAL",              color: "text-green-400" },
    { label: "Cyber Posture",           value: "DEFENSIVE+",           color: "text-orange-400" },
  ];

  const intelItems = content.filter((i) => i.type === "document" || i.type === "memo" || i.type === "message");

  return (
    <div className="relative flex flex-col h-full bg-[#0a0e14] text-white font-mono text-xs overflow-hidden">
      {/* CRT scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)" }}
      />

      {/* Top classification banner */}
      <div className="relative z-20 bg-green-500 text-black text-center py-0.5 text-[10px] font-bold tracking-widest shrink-0">
        SECRET // NOFORN
      </div>

      {/* Header */}
      <div className="relative z-20 bg-[#0d1a0d] border-b border-green-900 px-4 py-2 flex items-center justify-between shrink-0">
        <div>
          <div className="text-green-400 font-bold tracking-widest text-sm">GLOBAL FORCE STATUS DASHBOARD</div>
          <div className="text-green-700 text-[10px]">CLASSIFICATION: SECRET // NOFORN · DTG 281042Z FEB 26</div>
        </div>
        <div className="text-right">
          <div className="text-green-400 text-[10px]">THREATCON</div>
          <div className="flex gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border ${
                  n <= threatLevel
                    ? n >= 4 ? "bg-red-600 border-red-400 text-white"
                    : n >= 3 ? "bg-yellow-600 border-yellow-400 text-black"
                    : "bg-green-700 border-green-500 text-white"
                    : "bg-transparent border-green-900 text-green-900"
                }`}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20 flex-1 overflow-y-auto p-3 space-y-3">
        {/* Situation indicators */}
        <div className="border border-green-900 rounded">
          <div className="bg-green-900/30 px-3 py-1 text-green-500 font-bold tracking-widest text-[10px]">SITUATION INDICATORS</div>
          <div className="grid grid-cols-2 gap-0">
            {INDICATORS.map((ind) => (
              <div key={ind.label} className="flex justify-between items-center px-3 py-1.5 border-b border-green-900/30 last:border-b-0">
                <span className="text-green-700 text-[10px]">{ind.label}</span>
                <span className={`font-bold text-[10px] ${ind.color}`}>{ind.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Force disposition */}
        <div className="border border-green-900 rounded overflow-hidden">
          <div className="bg-green-900/30 px-3 py-1 text-green-500 font-bold tracking-widest text-[10px]">FORCE DISPOSITION</div>
          <div className="divide-y divide-green-900/30">
            {FORCE_STATUS.map((f) => (
              <div key={f.unit} className="px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-300 text-[11px] font-semibold">{f.unit}</span>
                  <span className={`text-[10px] font-bold ${STATUS_COLORS[f.status] ?? "text-neutral-400"}`}>{f.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-green-900/20 rounded-full h-1.5 overflow-hidden border border-green-900/50">
                    <div
                      className={`h-full rounded-full ${f.readiness >= 95 ? "bg-green-500" : f.readiness >= 85 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${f.readiness}%` }}
                    />
                  </div>
                  <span className="text-green-600 text-[10px] w-10 text-right tabular-nums">{f.readiness}%</span>
                  <span className="text-green-800 text-[10px] w-20 text-right">{f.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event log */}
        <div className="border border-green-900 rounded">
          <div className="bg-green-900/30 px-3 py-1 text-green-500 font-bold tracking-widest text-[10px]">EVENT LOG</div>

          {/* Intel items from game content */}
          {intelItems.map((item) => {
            const { label, labelColor } = getPrecedenceLabel(item.classification);
            const isFlash     = label === "FLASH";
            const isImmediate = label === "IMMEDIATE";
            return (
              <div
                key={item.id}
                className={`flex gap-2 px-3 py-1.5 border-b border-green-900/20 ${isFlash ? "bg-red-900/15" : isImmediate ? "bg-orange-900/10" : "bg-yellow-900/10"}`}
              >
                <span className={`shrink-0 font-bold text-[10px] ${labelColor}`}>[{label}]</span>
                <span className="text-yellow-300 text-[10px] leading-tight">{item.subject ?? item.body.slice(0, 120)}</span>
              </div>
            );
          })}

          {/* Hardcoded event entries */}
          {HARDCODED_EVENTS.map(([precedence, labelColor, dtg, text]) => (
            <div key={dtg + text.slice(0, 20)} className="flex gap-2 px-3 py-1.5 border-b border-green-900/20 last:border-b-0">
              <span className={`shrink-0 font-bold text-[10px] ${labelColor}`}>[{precedence}]</span>
              <span className="text-green-700 text-[10px] shrink-0 tabular-nums">{dtg}</span>
              <span className="text-green-300 text-[10px] leading-tight">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom classification banner */}
      <div className="relative z-20 bg-green-500 text-black text-center py-0.5 text-[10px] font-bold tracking-widest shrink-0">
        SECRET // NOFORN
      </div>
    </div>
  );
});
