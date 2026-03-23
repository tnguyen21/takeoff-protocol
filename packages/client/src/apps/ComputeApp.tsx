import React, { useState } from "react";
import type { AppProps } from "./types.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ErrorBar } from "recharts";
import { useGameStore } from "../stores/game.js";
import { gpuTileColor, jobProgressRatio, deriveCost } from "./computeUtils.js";
import { DashboardIcon, ClustersIcon, JobsIcon, StorageIcon, AlertsIcon, BillingIcon } from "./icons.js";

const CLUSTERS = [
  { name: "Cluster A (H100 x512)", gpus: 512, util: 94, jobs: 3, reserved: "frontier-model-v3", status: "healthy", memUtil: 87 },
  { name: "Cluster B (H100 x256)", gpus: 256, util: 71, jobs: 2, reserved: "safety-evals", status: "healthy", memUtil: 64 },
  { name: "Cluster C (A100 x128)", gpus: 128, util: 88, jobs: 4, reserved: "alignment-research", status: "degraded", memUtil: 79 },
  { name: "Cloud Burst (GCP)", gpus: 64, util: 100, jobs: 1, reserved: "run-789", status: "healthy", memUtil: 95 },
  { name: "Dev Pool", gpus: 32, util: 22, jobs: 7, reserved: "misc", status: "healthy", memUtil: 18 },
];

const JOBS = [
  { id: "run-789-ft-v3", cluster: "A", gpus: 256, elapsed: "4h 12m", eta: "~16h", status: "training" },
  { id: "safety-eval-daily", cluster: "B", gpus: 64, elapsed: "0h 44m", eta: "~2h", status: "evaluating" },
  { id: "ablation-sweep-22", cluster: "C", gpus: 128, elapsed: "1h 58m", eta: "~6h", status: "training" },
  { id: "interp-probe-batch", cluster: "C", gpus: 16, elapsed: "0h 12m", eta: "~30m", status: "running" },
];

const EVENT_LOG = [
  "14:22:01 run-789: step 12,440 | loss=0.0412",
  "14:21:55 cluster-c: GPU 47 temp warning (82°C)",
  "14:21:30 run-456: checkpoint saved",
  "14:20:18 cluster-a: job run-789-ft-v3 resumed",
  "14:19:42 billing: daily spend crossed $42K threshold",
];

const STATUS_COLOR: Record<string, string> = {
  healthy: "text-green-400",
  degraded: "text-yellow-400",
  down: "text-red-400",
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: DashboardIcon, active: true },
  { id: "clusters", label: "Clusters", Icon: ClustersIcon, active: false },
  { id: "jobs", label: "Jobs", Icon: JobsIcon, active: false },
  { id: "storage", label: "Storage", Icon: StorageIcon, active: false },
  { id: "alerts", label: "Alerts", Icon: AlertsIcon, active: false },
  { id: "billing", label: "Billing", Icon: BillingIcon, active: false },
];

// Generate 16 deterministic GPU utilizations centered around cluster util
function clusterGpuUtils(clusterUtil: number): number[] {
  return Array.from({ length: 16 }, (_, i) => {
    const offset = Math.round(Math.sin(i * 2.3 + 0.7) * 15);
    return Math.max(0, Math.min(100, clusterUtil + offset));
  });
}

export const ComputeApp = React.memo(function ComputeApp({ content }: AppProps) {
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  const totalGPUs = CLUSTERS.reduce((a, c) => a + c.gpus, 0);
  const avgUtil = Math.round(CLUSTERS.reduce((a, c) => a + c.util * c.gpus, 0) / totalGPUs);

  const stateView = useGameStore((s) => s.stateView);
  const selectedFaction = useGameStore((s) => s.selectedFaction);
  const isChina = selectedFaction === "china";
  const isOpenbrain = selectedFaction === "openbrain";
  const isPrometheus = selectedFaction === "prometheus";

  const cdzUtilAccuracy = stateView?.cdzComputeUtilization.accuracy ?? null;
  const cdzUtilValue = isChina && stateView && cdzUtilAccuracy !== "hidden"
    ? stateView.cdzComputeUtilization.value
    : null;

  // Burn rate for cost card
  const burnRateVar = isOpenbrain
    ? stateView?.obBurnRate
    : isPrometheus
      ? stateView?.promBurnRate
      : null;
  const burnRateValue = burnRateVar && burnRateVar.accuracy !== "hidden" ? burnRateVar.value : 50;
  const burnRateHigh = burnRateValue > 70;
  const cost = deriveCost(burnRateValue);

  // Build capability comparison bar data from fog-filtered state
  const capBarData = stateView
    ? [
        {
          label: "OB",
          value: stateView.obCapability.accuracy !== "hidden" ? stateView.obCapability.value : 0,
          error: stateView.obCapability.accuracy === "estimate" ? (stateView.obCapability.confidence ?? 0) : 0,
          accuracy: stateView.obCapability.accuracy,
          fill: "#3b82f6",
        },
        {
          label: "PROM",
          value: stateView.promCapability.accuracy !== "hidden" ? stateView.promCapability.value : 0,
          error: stateView.promCapability.accuracy === "estimate" ? (stateView.promCapability.confidence ?? 0) : 0,
          accuracy: stateView.promCapability.accuracy,
          fill: "#22c55e",
        },
        {
          label: "CHINA",
          value: stateView.chinaCapability.accuracy !== "hidden" ? stateView.chinaCapability.value : 0,
          error: stateView.chinaCapability.accuracy === "estimate" ? (stateView.chinaCapability.confidence ?? 0) : 0,
          accuracy: stateView.chinaCapability.accuracy,
          fill: "#ef4444",
        },
      ]
    : null;

  const toggleCluster = (name: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="flex h-full bg-[#0d0d0d] text-white text-sm overflow-hidden">
      {/* Left sidebar — INV-1: renders with navigation icons */}
      <div className="w-12 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-white/10 bg-[#0a0a0a]">
        {NAV_ITEMS.map(({ id, label, Icon, active }) => (
          <div
            key={id}
            title={label}
            className={`w-9 h-9 flex items-center justify-center rounded cursor-pointer transition-colors ${
              active
                ? "bg-blue-600/20 text-blue-400"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.04]"
            }`}
          >
            <Icon />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <div className="font-bold text-sm">Compute Dashboard</div>
            <div className="text-neutral-500 text-xs">{isChina ? "DeepCent Infrastructure" : "OpenBrain Infrastructure"}</div>
          </div>
          <div className="flex gap-6 text-xs">
            {cdzUtilValue !== null ? (
              <>
                <div className="text-center">
                  <div className={`text-2xl font-bold font-mono ${cdzUtilValue >= 90 ? "text-orange-400" : cdzUtilValue >= 70 ? "text-yellow-400" : "text-green-400"}`}>
                    {cdzUtilValue.toFixed(0)}%
                  </div>
                  <div className="text-neutral-500">CDZ Util</div>
                </div>
                <div className="flex flex-col justify-center gap-1">
                  <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">CDZ COMPUTE</div>
                  <div className="w-32 bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cdzUtilValue >= 90 ? "bg-orange-500" : cdzUtilValue >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${cdzUtilValue}%` }}
                    />
                  </div>
                  {cdzUtilValue >= 90 && (
                    <div className="text-[9px] text-orange-400 font-semibold">⚠ HIGH UTILIZATION</div>
                  )}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Cost card — INV-3: reflects burnRate */}
          <div
            className={`bg-[#111] border rounded p-3 flex items-center justify-between ${
              burnRateHigh ? "border-orange-500/60" : "border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${burnRateHigh ? "text-orange-400" : "text-neutral-500"}`}>
                {burnRateHigh ? "⚠ " : ""}Compute Cost
              </span>
            </div>
            <div className="flex gap-5 text-xs font-mono tabular-nums">
              <div className="text-center">
                <div className={`font-bold ${burnRateHigh ? "text-orange-300" : "text-neutral-200"}`}>{cost.today}</div>
                <div className="text-neutral-600 text-[10px]">Today</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-neutral-200">{cost.month}</div>
                <div className="text-neutral-600 text-[10px]">Month</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-neutral-400">{cost.projected}</div>
                <div className="text-neutral-600 text-[10px]">Projected</div>
              </div>
            </div>
          </div>

          {/* Capability Comparison Chart */}
          <div className="bg-[#111] border border-white/10 rounded p-3">
            <div className="text-xs text-neutral-500 font-semibold mb-2 uppercase tracking-wider">AI Capability Index</div>
            {!capBarData ? (
              <div className="h-28 flex items-center justify-center text-neutral-600 text-xs">No state data</div>
            ) : (
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={capBarData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barCategoryGap="30%">
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 4, fontSize: 11 }}
                    formatter={(val: number | undefined, _name: string | undefined, item: { payload?: { accuracy?: string; error?: number } }) => {
                      const acc = item.payload?.accuracy;
                      if (acc === "hidden") return ["██████", "Capability"];
                      const err = item.payload?.error ?? 0;
                      if (val == null) return ["", "Capability"];
                      return [err > 0 ? `${val} ±${err}` : String(val), "Capability"];
                    }}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {capBarData.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={entry.accuracy === "hidden" ? "#333" : entry.fill}
                        fillOpacity={entry.accuracy === "estimate" ? 0.65 : 1}
                      />
                    ))}
                    <ErrorBar dataKey="error" width={6} strokeWidth={1.5} stroke="#ffffff60" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {capBarData && (
              <div className="flex gap-3 mt-1 justify-end">
                {capBarData.map((d) => (
                  <span key={d.label} className="text-[10px]" style={{ color: d.accuracy === "hidden" ? "#555" : d.fill }}>
                    {d.label}: {d.accuracy === "hidden" ? "██" : `${d.value}${d.accuracy === "estimate" ? "~" : ""}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Clusters — INV-2: clicking expands to show GPU grid */}
          <div>
            <div className="text-xs text-neutral-500 font-semibold mb-2 uppercase tracking-wider">Cluster Status</div>
            <div className="space-y-2">
              {CLUSTERS.map((c) => {
                const isExpanded = expandedClusters.has(c.name);
                const gpuUtils = clusterGpuUtils(c.util);
                return (
                  <div key={c.name} className="bg-[#111] border border-white/10 rounded">
                    {/* Cluster header row — clickable */}
                    <div
                      className="p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleCluster(c.name)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {/* Disclosure chevron */}
                          <span className={`text-neutral-500 text-[10px] transition-transform inline-block ${isExpanded ? "rotate-90" : ""}`}>
                            ▶
                          </span>
                          <span className="font-semibold text-xs text-neutral-200">{c.name}</span>
                          <span className={`ml-1 text-[10px] ${STATUS_COLOR[c.status]}`}>● {c.status}</span>
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
                        <span className="text-xs text-neutral-400 w-10 text-right font-mono tabular-nums">{c.util}%</span>
                        <span className="text-xs text-neutral-600 w-16 text-right font-mono tabular-nums">{c.gpus} GPU</span>
                      </div>
                    </div>

                    {/* Expanded GPU grid */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-white/5">
                        <div className="mt-2 mb-1 text-[10px] text-neutral-500 uppercase tracking-wider">GPU Grid</div>
                        {/* 4x4 grid */}
                        <div className="grid grid-cols-8 gap-1 mb-3">
                          {gpuUtils.map((util, i) => (
                            <div
                              key={i}
                              title={`GPU ${i} — ${util}% util`}
                              className="h-4 rounded-sm cursor-default"
                              style={{ backgroundColor: gpuTileColor(util) }}
                            />
                          ))}
                        </div>
                        {/* Memory utilization bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500 w-16 shrink-0">Mem Util</span>
                          <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.memUtil >= 90 ? "bg-red-500" : c.memUtil >= 70 ? "bg-yellow-500" : "bg-teal-500"}`}
                              style={{ width: `${c.memUtil}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono w-8 text-right">{c.memUtil}%</span>
                        </div>
                        {/* Color legend */}
                        <div className="flex gap-3 mt-2">
                          {[
                            { color: "#22c55e", label: "0-60%" },
                            { color: "#eab308", label: "60-80%" },
                            { color: "#f97316", label: "80-90%" },
                            { color: "#ef4444", label: "90-100%" },
                          ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                              <span className="text-[9px] text-neutral-600">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Intel metrics from game content */}
          {content.filter((i) => i.type === "chart").length > 0 && (
            <div>
              <div className="text-xs text-neutral-500 font-semibold mb-2 uppercase tracking-wider">Intel Metrics</div>
              <div className="space-y-2">
                {content.filter((i) => i.type === "chart").map((item) => (
                  <div key={item.id} className="bg-[#111] border border-blue-900/30 rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-blue-300 text-xs font-semibold">{item.subject ?? item.sender ?? "Metric"}</span>
                      <span className="text-neutral-600 text-[10px]">{item.timestamp}</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job queue with progress bars */}
          <div>
            <div className="text-xs text-neutral-500 font-semibold mb-2 uppercase tracking-wider">Active Jobs</div>
            <div className="bg-[#111] border border-white/10 rounded overflow-hidden">
              <div className="grid grid-cols-5 text-[10px] text-neutral-500 uppercase tracking-wider px-3 py-2 border-b border-white/5">
                <span>Job ID</span><span>Cluster</span><span>GPUs</span><span className="col-span-2">Progress</span>
              </div>
              {JOBS.map((j) => {
                const ratio = jobProgressRatio(j.elapsed, j.eta);
                const pct = Math.round(ratio * 100);
                return (
                  <div key={j.id} className="grid grid-cols-5 text-xs px-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.03] tabular-nums items-center">
                    <span className="text-blue-400 truncate">{j.id}</span>
                    <span className="text-neutral-400">{j.cluster}</span>
                    <span className="text-neutral-300 font-mono">{j.gpus}</span>
                    {/* Progress bar spanning 2 columns */}
                    <div className="col-span-2 flex items-center gap-2" title={`Elapsed: ${j.elapsed} — ETA: ${j.eta}`}>
                      <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-neutral-500 font-mono text-[10px] w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event log — terminal-style */}
          <div>
            <div className="text-xs text-neutral-500 font-semibold mb-2 uppercase tracking-wider">Event Log</div>
            <div className="bg-[#080808] border border-white/10 rounded p-2 overflow-y-auto max-h-[110px]">
              {EVENT_LOG.map((line, i) => (
                <div key={i} className="font-mono text-[11px] text-neutral-400 leading-relaxed hover:text-neutral-200 transition-colors">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
