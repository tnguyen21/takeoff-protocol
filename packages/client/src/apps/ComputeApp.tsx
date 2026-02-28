import React from "react";
import type { AppProps } from "./types.js";

const CLUSTERS = [
  { name: "Cluster A (H100 x512)", gpus: 512, util: 94, jobs: 3, reserved: "frontier-model-v3", status: "healthy" },
  { name: "Cluster B (H100 x256)", gpus: 256, util: 71, jobs: 2, reserved: "safety-evals", status: "healthy" },
  { name: "Cluster C (A100 x128)", gpus: 128, util: 88, jobs: 4, reserved: "alignment-research", status: "degraded" },
  { name: "Cloud Burst (GCP)", gpus: 64, util: 100, jobs: 1, reserved: "run-789", status: "healthy" },
  { name: "Dev Pool", gpus: 32, util: 22, jobs: 7, reserved: "misc", status: "healthy" },
];

const JOBS = [
  { id: "run-789-ft-v3", cluster: "A", gpus: 256, elapsed: "4h 12m", eta: "~16h", status: "training" },
  { id: "safety-eval-daily", cluster: "B", gpus: 64, elapsed: "0h 44m", eta: "~2h", status: "evaluating" },
  { id: "ablation-sweep-22", cluster: "C", gpus: 128, elapsed: "1h 58m", eta: "~6h", status: "training" },
  { id: "interp-probe-batch", cluster: "C", gpus: 16, elapsed: "0h 12m", eta: "~30m", status: "running" },
];

const STATUS_COLOR: Record<string, string> = {
  healthy: "text-green-400",
  degraded: "text-yellow-400",
  down: "text-red-400",
};

export const ComputeApp = React.memo(function ComputeApp(_: AppProps) {
  const totalGPUs = CLUSTERS.reduce((a, c) => a + c.gpus, 0);
  const avgUtil = Math.round(CLUSTERS.reduce((a, c) => a + c.util * c.gpus, 0) / totalGPUs);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white text-sm">
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <div className="font-bold text-sm">Compute Dashboard</div>
          <div className="text-neutral-500 text-xs">OpenBrain Infrastructure</div>
        </div>
        <div className="flex gap-6 text-xs">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-blue-400">{totalGPUs}</div>
            <div className="text-neutral-500">Total GPUs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-green-400">{avgUtil}%</div>
            <div className="text-neutral-500">Avg Util</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-yellow-400">{JOBS.length}</div>
            <div className="text-neutral-500">Active Jobs</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Clusters */}
        <div>
          <div className="text-xs text-neutral-500 font-semibold mb-2 uppercase tracking-wider">Cluster Status</div>
          <div className="space-y-2">
            {CLUSTERS.map((c) => (
              <div key={c.name} className="bg-[#111] border border-white/10 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-xs text-neutral-200">{c.name}</span>
                    <span className={`ml-2 text-[10px] ${STATUS_COLOR[c.status]}`}>● {c.status}</span>
                  </div>
                  <div className="text-xs text-neutral-500">{c.jobs} jobs · reserved: <span className="text-neutral-400">{c.reserved}</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.util >= 90 ? "bg-orange-500" : c.util >= 70 ? "bg-blue-500" : "bg-green-500"}`}
                      style={{ width: `${c.util}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-400 w-10 text-right font-mono">{c.util}%</span>
                  <span className="text-xs text-neutral-600 w-16 text-right font-mono">{c.gpus} GPU</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job queue */}
        <div>
          <div className="text-xs text-neutral-500 font-semibold mb-2 uppercase tracking-wider">Active Jobs</div>
          <div className="bg-[#111] border border-white/10 rounded overflow-hidden">
            <div className="grid grid-cols-5 text-[10px] text-neutral-500 uppercase tracking-wider px-3 py-2 border-b border-white/5">
              <span>Job ID</span><span>Cluster</span><span>GPUs</span><span>Elapsed</span><span>ETA</span>
            </div>
            {JOBS.map((j) => (
              <div key={j.id} className="grid grid-cols-5 text-xs px-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/3">
                <span className="text-blue-400 truncate">{j.id}</span>
                <span className="text-neutral-400">{j.cluster}</span>
                <span className="text-neutral-300 font-mono">{j.gpus}</span>
                <span className="text-neutral-400 font-mono">{j.elapsed}</span>
                <span className="text-neutral-500 font-mono">{j.eta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
