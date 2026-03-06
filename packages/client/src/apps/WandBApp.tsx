import React, { useState } from "react";
import type { AppProps } from "./types.js";
import {
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGameStore } from "../stores/game.js";
import { buildCapData, getRunStatusColor } from "./wandbUtils.js";

// ── Static run data ──────────────────────────────────────────────────────────

const RUNS = [
  { name: "run-789-ft-v3", status: "running", loss: "0.0412", step: "12,440", duration: "2h 14m", created: "2h ago", user: "alice", tags: ["frontier", "v3"], color: "#0bcabc" },
  { name: "run-788-base", status: "finished", loss: "0.0581", step: "20,000", duration: "5h 32m", created: "1d ago", user: "bob", tags: ["base"], color: "#ff7e33" },
  { name: "run-787-ablation", status: "crashed", loss: "NaN", step: "3,210", duration: "0h 28m", created: "2d ago", user: "alice", tags: ["ablation"], color: "#8b5cf6" },
  { name: "run-786-ft-v2", status: "finished", loss: "0.0621", step: "20,000", duration: "4h 50m", created: "3d ago", user: "charlie", tags: ["frontier", "v2"], color: "#0bcabc" },
  { name: "run-785-ctx8k", status: "finished", loss: "0.0709", step: "18,500", duration: "4h 12m", created: "4d ago", user: "alice", tags: ["ctx-8k"], color: "#ff7e33" },
  { name: "run-784-safety", status: "finished", loss: "0.0834", step: "20,000", duration: "5h 01m", created: "5d ago", user: "dana", tags: ["safety"], color: "#8b5cf6" },
  { name: "run-783-scale", status: "running", loss: "0.1248", step: "8,320", duration: "1h 42m", created: "6h ago", user: "bob", tags: ["scale", "v3"], color: "#0bcabc" },
];

// ── Static chart data ────────────────────────────────────────────────────────

const TRAINING_LOSS_DATA = [
  { step: 0, loss: 2.48 },
  { step: 1000, loss: 2.15 },
  { step: 2000, loss: 1.82 },
  { step: 3000, loss: 1.54 },
  { step: 4000, loss: 1.28 },
  { step: 5000, loss: 1.05 },
  { step: 6000, loss: 0.91 },
  { step: 7000, loss: 0.86 },
  { step: 8000, loss: 0.75 },
  { step: 9000, loss: 0.62 },
  { step: 10000, loss: 0.51 },
  { step: 11000, loss: 0.43 },
  { step: 12000, loss: 0.34 },
  { step: 13000, loss: 0.27 },
  { step: 14000, loss: 0.29 },
  { step: 15000, loss: 0.21 },
  { step: 16000, loss: 0.16 },
  { step: 17000, loss: 0.11 },
  { step: 18000, loss: 0.07 },
  { step: 19000, loss: 0.053 },
  { step: 20000, loss: 0.042 },
];

const LR_DATA = [
  { step: 0, lr: 0 },
  { step: 500, lr: 0.00025 },
  { step: 1000, lr: 0.0005 },
  { step: 1500, lr: 0.00075 },
  { step: 2000, lr: 0.001 },
  { step: 3000, lr: 0.00098 },
  { step: 5000, lr: 0.00088 },
  { step: 7000, lr: 0.00075 },
  { step: 9000, lr: 0.00061 },
  { step: 11000, lr: 0.00047 },
  { step: 13000, lr: 0.00034 },
  { step: 15000, lr: 0.00023 },
  { step: 17000, lr: 0.00014 },
  { step: 19000, lr: 0.000066 },
  { step: 20000, lr: 0.00005 },
];

const THROUGHPUT_DATA = [
  { step: 0, tps: 43200 },
  { step: 2000, tps: 44800 },
  { step: 4000, tps: 45100 },
  { step: 6000, tps: 44600 },
  { step: 8000, tps: 45300 },
  { step: 10000, tps: 44900 },
  { step: 12000, tps: 45600 },
  { step: 14000, tps: 45200 },
  { step: 16000, tps: 44700 },
  { step: 18000, tps: 45800 },
  { step: 20000, tps: 45100 },
];

const GPU_SPARKLINES = [
  { label: "GPU 0", pct: "94%", data: [82, 91, 94, 88, 95, 92, 97, 90, 93, 94].map((v) => ({ v })) },
  { label: "GPU 1", pct: "91%", data: [78, 85, 88, 90, 87, 94, 89, 93, 88, 91].map((v) => ({ v })) },
  { label: "GPU 2", pct: "88%", data: [82, 86, 82, 91, 85, 88, 86, 90, 87, 88].map((v) => ({ v })) },
  { label: "GPU 3", pct: "96%", data: [88, 92, 95, 97, 94, 96, 98, 93, 96, 96].map((v) => ({ v })) },
];

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Runs", active: false },
  { label: "Charts", active: true },
  { label: "Artifacts", active: false },
  { label: "Sweeps", active: false },
  { label: "Reports", active: false },
  { label: "System", active: false },
];

const FILTER_PILLS = [
  { label: "Status: running" },
  { label: "Tag: frontier-v3" },
];

// ── ChartPanel wrapper ───────────────────────────────────────────────────────

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] rounded border border-white/10 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0">
        <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-1">
          <button className="text-neutral-600 hover:text-neutral-300 text-xs px-1 py-0.5 rounded hover:bg-white/10">≈</button>
          <button className="text-neutral-600 hover:text-neutral-300 text-[9px] px-1 py-0.5 rounded hover:bg-white/10 font-mono">log</button>
        </div>
      </div>
      <div className="flex-1 p-2">{children}</div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (isNaN(then)) return timestamp;
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export const WandBApp = React.memo(function WandBApp({ content }: AppProps) {
  const stateView = useGameStore((s) => s.stateView);
  const stateHistory = useGameStore((s) => s.stateHistory);
  const round = useGameStore((s) => s.round);

  const [activeTab, setActiveTab] = useState("charts");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const capData = buildCapData(stateHistory, round, stateView);

  const reports = [...content.filter((i) => i.type === "chart")].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null;

  return (
    <div className="flex h-full bg-[#0d0d0d] text-white text-sm overflow-hidden">
      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <nav className="w-[190px] shrink-0 bg-[#1b1d2a] flex flex-col border-r border-white/10">
        {/* Wordmark */}
        <div className="px-4 py-3 border-b border-white/10 flex items-baseline gap-1.5">
          <span className="text-yellow-400 font-black text-lg leading-none">W</span>
          <span className="text-white font-bold text-sm">&amp;B</span>
        </div>

        {/* Project breadcrumb */}
        <div className="px-4 py-2 border-b border-white/5 text-[10px] text-neutral-500 truncate">
          openbrain / frontier-model-v3
        </div>

        {/* Nav items */}
        <div className="flex-1 py-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.label.toLowerCase();
            return (
              <div
                key={item.label}
                onClick={() => setActiveTab(item.label.toLowerCase())}
                className={`flex items-center gap-2.5 px-4 py-2 text-xs cursor-pointer transition-colors ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isActive ? "#3b82f6" : "#444" }} />
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Footer: active run badge */}
        <div className="px-4 py-3 border-t border-white/10">
          <span className="bg-green-900/50 text-green-400 text-[10px] px-2 py-1 rounded-full border border-green-700/50">
            2 runs active
          </span>
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header bar */}
        <div className="border-b border-white/10 px-4 py-2 flex items-center gap-3 shrink-0 bg-[#0d0d0d]">
          <span className="text-neutral-400 text-xs capitalize">{activeTab}</span>
          <span className="text-neutral-600 text-xs">/</span>
          <span className="text-white text-xs font-semibold">frontier-model-v3</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-neutral-500 text-[10px]">Last 7 days</span>
            {activeTab === "charts" && (
              <span className="bg-[#1b1d2a] text-neutral-300 text-[10px] px-2 py-0.5 rounded border border-white/10 cursor-pointer hover:bg-white/10">
                + Add panel
              </span>
            )}
          </div>
        </div>

        {/* ── Reports tab ──────────────────────────────────────────── */}
        {activeTab === "reports" && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: report list */}
            <div className="w-[220px] shrink-0 border-r border-white/10 overflow-y-auto">
              {reports.length === 0 ? (
                <div className="flex items-center justify-center h-full text-neutral-600 text-xs p-4 text-center">
                  No reports available yet.
                </div>
              ) : (
                reports.map((r) => {
                  const isSelected = r.id === selectedReportId;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReportId(r.id)}
                      className={`px-3 py-2.5 border-b border-white/5 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-600/20 border-l-2 border-l-blue-500 pl-2.5" : "hover:bg-white/5"
                      }`}
                    >
                      <div className={`text-xs font-medium leading-snug ${isSelected ? "text-blue-300" : "text-white"}`}>
                        {r.subject ?? r.body.slice(0, 60)}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{formatRelativeTime(r.timestamp)}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: detail pane */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedReport ? (
                <div>
                  <div className="mb-3 pb-3 border-b border-white/10">
                    <div className="text-sm font-semibold text-white mb-1">{selectedReport.subject ?? "Report"}</div>
                    <div className="text-[10px] text-neutral-500">{formatRelativeTime(selectedReport.timestamp)}</div>
                  </div>
                  <pre className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-mono">{selectedReport.body}</pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-600 text-xs">
                  Select a report
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Other non-charts placeholder ─────────────────────────── */}
        {activeTab !== "charts" && activeTab !== "reports" && (
          <div className="flex-1 flex items-center justify-center text-neutral-600 text-xs">
            Coming soon
          </div>
        )}

        {/* Scrollable body — Charts tab */}
        {activeTab === "charts" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* ── Chart grid 2×2 ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Panel 1: Capability Index (dynamic) */}
            <ChartPanel title="Capability Index">
              {!capData ? (
                <div className="h-[120px] flex items-center justify-center text-neutral-600 text-xs">No state data</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={110}>
                    <ComposedChart data={capData.data} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                      <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                      <XAxis dataKey="round" type="number" domain={[1, 5]} tickCount={5} tick={{ fill: "#555", fontSize: 9 }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#555", fontSize: 9 }} tickLine={false} width={26} />
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 4, fontSize: 10 }}
                        labelFormatter={(v: unknown) => `Round ${v}`}
                        formatter={(val: number | undefined, name: string | undefined) => [val != null ? val.toFixed(0) : "", name ?? ""]}
                      />
                      <Area stackId="ob" type="monotone" dataKey="obLow" fill="transparent" stroke="none" legendType="none" />
                      <Area stackId="ob" type="monotone" dataKey="obBandH" fill="#3b82f6" fillOpacity={0.12} stroke="none" legendType="none" />
                      {capData.obAcc !== "hidden" && (
                        <Line type="monotone" dataKey="ob" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray={capData.obAcc === "estimate" ? "4 2" : undefined} connectNulls name="OB" />
                      )}
                      <Area stackId="prom" type="monotone" dataKey="promLow" fill="transparent" stroke="none" legendType="none" />
                      <Area stackId="prom" type="monotone" dataKey="promBandH" fill="#22c55e" fillOpacity={0.12} stroke="none" legendType="none" />
                      {capData.promAcc !== "hidden" && (
                        <Line type="monotone" dataKey="prom" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray={capData.promAcc === "estimate" ? "4 2" : undefined} connectNulls name="Prom" />
                      )}
                      <Area stackId="china" type="monotone" dataKey="chinaLow" fill="transparent" stroke="none" legendType="none" />
                      <Area stackId="china" type="monotone" dataKey="chinaBandH" fill="#ef4444" fillOpacity={0.12} stroke="none" legendType="none" />
                      {capData.chinaAcc !== "hidden" && (
                        <Line type="monotone" dataKey="china" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray={capData.chinaAcc === "estimate" ? "4 2" : undefined} connectNulls name="China" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 mt-1 justify-end">
                    {capData.obAcc !== "hidden" && <span className="flex items-center gap-1 text-[9px] text-blue-400"><span className="w-3 h-px bg-blue-400 inline-block" />OB</span>}
                    {capData.promAcc !== "hidden" && <span className="flex items-center gap-1 text-[9px] text-green-400"><span className="w-3 h-px bg-green-400 inline-block" />Prom</span>}
                    {capData.chinaAcc !== "hidden" && <span className="flex items-center gap-1 text-[9px] text-red-400"><span className="w-3 h-px bg-red-400 inline-block" />China</span>}
                  </div>
                </>
              )}
            </ChartPanel>

            {/* Panel 2: Training Loss (static) */}
            <ChartPanel title="Training Loss">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={TRAINING_LOSS_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="step" tick={{ fill: "#555", fontSize: 9 }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}k` : String(v)} />
                  <YAxis tick={{ fill: "#555", fontSize: 9 }} tickLine={false} width={30} tickFormatter={(v: number) => v.toFixed(1)} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 4, fontSize: 10 }}
                    formatter={(val: number | undefined) => [val != null ? val.toFixed(4) : "", "loss"]}
                    labelFormatter={(v: unknown) => `step ${v}`}
                  />
                  <Line type="monotone" dataKey="loss" stroke="#f97316" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            {/* Panel 3: Learning Rate Schedule (static) */}
            <ChartPanel title="Learning Rate">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={LR_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="step" tick={{ fill: "#555", fontSize: 9 }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}k` : String(v)} />
                  <YAxis tick={{ fill: "#555", fontSize: 9 }} tickLine={false} width={34} tickFormatter={(v: number) => v === 0 ? "0" : v.toExponential(0)} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 4, fontSize: 10 }}
                    formatter={(val: number | undefined) => [val != null ? val.toExponential(2) : "", "lr"]}
                    labelFormatter={(v: unknown) => `step ${v}`}
                  />
                  <Line type="monotone" dataKey="lr" stroke="#a78bfa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            {/* Panel 4: Throughput tokens/sec (static) */}
            <ChartPanel title="Throughput (tok/s)">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={THROUGHPUT_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="step" tick={{ fill: "#555", fontSize: 9 }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}k` : String(v)} />
                  <YAxis tick={{ fill: "#555", fontSize: 9 }} tickLine={false} width={36} domain={[42000, 47000]} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 4, fontSize: 10 }}
                    formatter={(val: number | undefined) => [val != null ? val.toLocaleString() : "", "tok/s"]}
                    labelFormatter={(v: unknown) => `step ${v}`}
                  />
                  <Line type="monotone" dataKey="tps" stroke="#34d399" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          {/* ── Filter bar ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Filters:</span>
            {FILTER_PILLS.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1 bg-[#1b1d2a] text-white/80 text-[10px] px-2 py-0.5 rounded border border-white/15"
              >
                {f.label}
                <button className="text-neutral-500 hover:text-white ml-0.5 leading-none">×</button>
              </span>
            ))}
            <button className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer">+ Add filter</button>
          </div>

          {/* ── Run table ──────────────────────────────────────────── */}
          <div className="bg-[#111] rounded border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[minmax(0,1fr)_62px_52px_60px_54px_56px_44px_88px] text-[10px] text-neutral-500 uppercase tracking-wider px-3 py-2 border-b border-white/5">
                  <span>Run</span>
                  <span>Status</span>
                  <span>Loss</span>
                  <span>Step</span>
                  <span>Duration</span>
                  <span>Created</span>
                  <span>User</span>
                  <span>Tags</span>
                </div>
                {RUNS.map((r) => (
                  <div
                    key={r.name}
                    className={`grid grid-cols-[minmax(0,1fr)_62px_52px_60px_54px_56px_44px_88px] text-xs px-3 py-2 border-b border-white/5 hover:bg-white/5 cursor-pointer tabular-nums`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                      <span className="text-blue-400 truncate">{r.name}</span>
                    </span>
                    <span className={getRunStatusColor(r.status)}>{r.status}</span>
                    <span className="text-neutral-300 font-mono">{r.loss}</span>
                    <span className="text-neutral-400 font-mono">{r.step}</span>
                    <span className="text-neutral-400">{r.duration}</span>
                    <span className="text-neutral-400">{r.created}</span>
                    <span className="text-neutral-400">{r.user}</span>
                    <span className="flex flex-wrap gap-0.5">
                      {r.tags.map((t) => (
                        <span key={t} className="bg-blue-900/40 text-blue-300 text-[9px] px-1 py-0.5 rounded border border-blue-700/30">{t}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── GPU sparklines ─────────────────────────────────────── */}
          <div className="bg-[#111] rounded border border-white/10 p-3">
            <div className="text-xs text-neutral-400 mb-2 font-medium">System / GPU Utilization</div>
            <div className="space-y-1.5">
              {GPU_SPARKLINES.map((gpu) => (
                <div key={gpu.label} className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-500 w-12 shrink-0 text-[10px]">{gpu.label}</span>
                  <div className="shrink-0">
                    <LineChart width={90} height={24} data={gpu.data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <Line type="monotone" dataKey="v" stroke="#eab308" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                    </LineChart>
                  </div>
                  <span className="text-neutral-400 w-8 text-right tabular-nums text-[10px]">{gpu.pct}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
});
