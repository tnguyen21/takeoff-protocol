import React from "react";
import type { AppProps } from "./types.js";

const THREAT_LEVEL = 3; // 1-5

const FORCE_STATUS = [
  { unit: "7th Fleet (Pacific)", status: "ELEVATED", readiness: 88, location: "W. Pacific" },
  { unit: "5th Fleet (Mideast)", status: "NORMAL", readiness: 94, location: "Arabian Sea" },
  { unit: "STRATCOM", status: "ELEVATED", readiness: 97, location: "Offutt AFB" },
  { unit: "CYBERCOM", status: "HIGH ALERT", readiness: 99, location: "Fort Meade" },
  { unit: "82nd Airborne", status: "NORMAL", readiness: 91, location: "Ft. Bragg" },
];

const INDICATORS = [
  { label: "Taiwan Strait Situation", value: "ELEVATED", color: "text-orange-400" },
  { label: "DPRK Activity", value: "MONITORING", color: "text-yellow-400" },
  { label: "PRC Naval Movements", value: "INCREASED", color: "text-orange-400" },
  { label: "Allied Coordination", value: "ACTIVE", color: "text-green-400" },
  { label: "Space Domain", value: "NOMINAL", color: "text-green-400" },
  { label: "Cyber Posture", value: "DEFENSIVE+", color: "text-orange-400" },
];

const STATUS_COLORS: Record<string, string> = {
  "NORMAL": "text-green-400",
  "ELEVATED": "text-yellow-400",
  "HIGH ALERT": "text-red-400",
};

export const MilitaryApp = React.memo(function MilitaryApp(_: AppProps) {
  return (
    <div className="flex flex-col h-full bg-[#0a0e14] text-white font-mono text-xs">
      {/* Header */}
      <div className="bg-[#0d1a0d] border-b border-green-900 px-4 py-2 flex items-center justify-between shrink-0">
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
                  n <= THREAT_LEVEL
                    ? n >= 4 ? "bg-red-600 border-red-400 text-white" : n >= 3 ? "bg-yellow-600 border-yellow-400 text-black" : "bg-green-700 border-green-500 text-white"
                    : "bg-transparent border-green-900 text-green-900"
                }`}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Indicators */}
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
                  <span className="text-green-600 text-[10px] w-10 text-right">{f.readiness}%</span>
                  <span className="text-green-800 text-[10px] w-20 text-right">{f.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent events log */}
        <div className="border border-green-900 rounded">
          <div className="bg-green-900/30 px-3 py-1 text-green-500 font-bold tracking-widest text-[10px]">EVENT LOG</div>
          {[
            ["1042Z", "CYBERCOM reports elevated foreign cyber activity targeting AI infrastructure"],
            ["0921Z", "7th Fleet: additional surface combatants ordered to W. Pacific"],
            ["0830Z", "Taiwan Strait: PRC naval exercise extended beyond announced window"],
            ["0700Z", "STRATCOM: ICBM force readiness check completed — all systems nominal"],
          ].map(([time, event]) => (
            <div key={time} className="flex gap-3 px-3 py-1.5 border-b border-green-900/20 last:border-b-0">
              <span className="text-green-600 shrink-0">{time}</span>
              <span className="text-green-300 text-[10px] leading-tight">{event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
