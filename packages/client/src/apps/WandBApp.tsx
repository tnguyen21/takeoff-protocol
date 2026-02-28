import React from "react";
import type { AppProps } from "./types.js";

const RUNS = [
  { name: "run-789-ft-v3", status: "running", loss: "0.0412", step: "12,440" },
  { name: "run-788-base", status: "finished", loss: "0.0581", step: "20,000" },
  { name: "run-787-ablation", status: "crashed", loss: "NaN", step: "3,210" },
];

function FakePlot({ label, color }: { label: string; color: string }) {
  const points = [88, 72, 61, 54, 49, 44, 41, 39, 38, 36, 35, 34];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;
  const h = 80;
  const w = 240;

  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="bg-[#1a1a1a] rounded p-3 border border-white/10">
      <div className="text-xs text-neutral-400 mb-2 font-medium">{label}</div>
      <svg width={w} height={h} className="overflow-visible">
        <path d={path} fill="none" stroke={color} strokeWidth="2" />
        {points.map((v, i) => {
          const x = (i / (points.length - 1)) * w;
          const y = h - ((v - min) / range) * h;
          return i === points.length - 1 ? (
            <circle key={i} cx={x} cy={y} r="3" fill={color} />
          ) : null;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-neutral-600 mt-1">
        <span>Step 0</span>
        <span>Step 12.4k</span>
      </div>
    </div>
  );
}

export const WandBApp = React.memo(function WandBApp(_: AppProps) {
  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white text-sm">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-2 flex items-center gap-3 shrink-0 bg-[#0d0d0d]">
        <div className="text-yellow-400 font-bold text-base">W</div>
        <span className="text-neutral-400 text-xs">openbrain /</span>
        <span className="text-white text-xs font-semibold">frontier-model-v3</span>
        <span className="ml-auto bg-green-900/50 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-700/50">
          1 run active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Run table */}
        <div className="bg-[#111] rounded border border-white/10 overflow-hidden">
          <div className="grid grid-cols-4 text-[10px] text-neutral-500 uppercase tracking-wider px-3 py-2 border-b border-white/5">
            <span>Run</span><span>Status</span><span>Loss</span><span>Step</span>
          </div>
          {RUNS.map((r) => (
            <div key={r.name} className="grid grid-cols-4 text-xs px-3 py-2 border-b border-white/5 hover:bg-white/5 cursor-pointer">
              <span className="text-blue-400 truncate">{r.name}</span>
              <span className={r.status === "running" ? "text-green-400" : r.status === "crashed" ? "text-red-400" : "text-neutral-400"}>
                {r.status}
              </span>
              <span className="text-neutral-300">{r.loss}</span>
              <span className="text-neutral-400">{r.step}</span>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-3">
          <FakePlot label="Training Loss" color="#f59e0b" />
          <FakePlot label="Eval Score" color="#60a5fa" />
        </div>

        {/* System metrics */}
        <div className="bg-[#111] rounded border border-white/10 p-3">
          <div className="text-xs text-neutral-400 mb-2 font-medium">System / GPU Utilization</div>
          <div className="space-y-2">
            {[["GPU 0", "94%"], ["GPU 1", "91%"], ["GPU 2", "88%"], ["GPU 3", "96%"]].map(([label, val]) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="text-neutral-500 w-12 shrink-0">{label}</span>
                <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: val }} />
                </div>
                <span className="text-neutral-400 w-8 text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
