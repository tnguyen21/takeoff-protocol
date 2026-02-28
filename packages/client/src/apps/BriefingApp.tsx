import React from "react";
import type { AppProps } from "./types.js";

export const BriefingApp = React.memo(function BriefingApp(_: AppProps) {
  return (
    <div className="flex flex-col h-full bg-[#12121e] text-white overflow-y-auto">
      {/* Header */}
      <div className="bg-[#1e1e3a] border-b border-purple-900/50 px-6 py-4 shrink-0">
        <div className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-1">Round 1 — Briefing Phase</div>
        <h1 className="text-xl font-bold text-white">Situation Briefing</h1>
        <p className="text-neutral-400 text-xs mt-1">Read carefully. This context shapes your strategic environment.</p>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Scenario overview */}
        <div className="bg-[#1a1a2e] rounded-lg p-4 border border-purple-900/30">
          <h2 className="font-semibold text-purple-300 text-sm mb-2">Scenario Overview</h2>
          <p className="text-neutral-300 text-xs leading-relaxed">
            It is February 2026. Three AI labs — OpenBrain, Prometheus Labs, and a Chinese state-backed program — are
            in a race to deploy the world's first transformatively capable AI system. Each has reached Agent-3 capability
            levels. The gap between labs is measured in months, not years. Governments, investors, and the public are
            watching. The decisions made in the next 72 hours will determine whether advanced AI deployment is safe,
            controlled, or catastrophic.
          </p>
        </div>

        {/* Faction objectives */}
        <div className="bg-[#1a1a2e] rounded-lg p-4 border border-purple-900/30">
          <h2 className="font-semibold text-purple-300 text-sm mb-3">Your Objectives</h2>
          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">Primary:</span>
              <span>Deploy a capable AI system that advances your organization's goals without triggering catastrophic outcomes.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">Secondary:</span>
              <span>Maintain organizational cohesion, manage external relationships, and influence the regulatory environment.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">Hidden:</span>
              <span className="text-neutral-600 italic">Revealed as game progresses.</span>
            </div>
          </div>
        </div>

        {/* Current state */}
        <div className="bg-[#1a1a2e] rounded-lg p-4 border border-purple-900/30">
          <h2 className="font-semibold text-purple-300 text-sm mb-3">Known State Variables</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Alignment Confidence", "87%"],
              ["Public Awareness", "42%"],
              ["Security Level", "SL-3"],
              ["Intl Cooperation", "44/100"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border border-white/10 rounded px-2 py-1.5">
                <span className="text-neutral-500">{k}</span>
                <span className="text-neutral-200 font-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timer reminder */}
        <div className="text-center text-xs text-neutral-600">
          The deliberation phase begins when the GM advances the round.
        </div>
      </div>
    </div>
  );
});
