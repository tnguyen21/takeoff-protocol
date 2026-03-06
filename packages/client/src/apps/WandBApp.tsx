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
import { buildCapData, buildSystemData, getRunStatusColor, getRuns, getArtifacts, getSweepData } from "./wandbUtils.js";
import type { ArtifactEntry, ArtifactSecurityStatus, ProbeStatus, SweepProbe } from "./wandbUtils.js";

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

const NAV_LABELS = ["Runs", "Charts", "Artifacts", "Sweeps", "Reports", "System"];

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

// ── RunTable ─────────────────────────────────────────────────────────────────

function RunTable({ runs }: { runs: ReturnType<typeof getRuns> }) {
  return (
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
          {runs.map((r) => (
            <div
              key={r.name}
              className="grid grid-cols-[minmax(0,1fr)_62px_52px_60px_54px_56px_44px_88px] text-xs px-3 py-2 border-b border-white/5 hover:bg-white/5 cursor-pointer tabular-nums"
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
  );
}

// ── Artifact helpers ─────────────────────────────────────────────────────────

const SECURITY_BADGE: Record<ArtifactSecurityStatus, { label: string; cls: string }> = {
  SECURED: { label: "SECURED", cls: "bg-green-900/40 text-green-400 border-green-700/30" },
  STANDARD: { label: "STANDARD", cls: "bg-yellow-900/40 text-yellow-400 border-yellow-700/30" },
  VULNERABLE: { label: "VULNERABLE", cls: "bg-red-900/40 text-red-400 border-red-700/30" },
};

const TYPE_BADGE: Record<ArtifactEntry["type"], string> = {
  model: "bg-blue-900/40 text-blue-300 border-blue-700/30",
  dataset: "bg-purple-900/40 text-purple-300 border-purple-700/30",
  framework: "bg-cyan-900/40 text-cyan-300 border-cyan-700/30",
};

function ArtifactCard({ artifact }: { artifact: ArtifactEntry }) {
  const sec = SECURITY_BADGE[artifact.securityStatus];
  return (
    <div className={`bg-[#111] rounded border border-white/10 p-3 flex flex-col gap-2 ${artifact.archived ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white text-xs font-mono font-semibold truncate">{artifact.name}</span>
          {artifact.draft && (
            <span className="text-[9px] px-1 py-0.5 rounded border bg-neutral-800 text-neutral-400 border-white/10 shrink-0">DRAFT</span>
          )}
          {artifact.archived && (
            <span className="text-[9px] px-1 py-0.5 rounded border bg-neutral-800 text-neutral-500 border-white/10 shrink-0">ARCHIVED</span>
          )}
          {artifact.classified && (
            <span className="text-[9px] px-1 py-0.5 rounded border bg-red-900/60 text-red-300 border-red-700/40 shrink-0">CLASSIFIED</span>
          )}
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 font-semibold tracking-wide ${sec.cls}`}>{sec.label}</span>
      </div>

      {artifact.breachAffected && (
        <div className="text-[9px] text-red-400 font-semibold bg-red-900/20 border border-red-700/30 rounded px-2 py-1">
          BREACH CONFIRMED — WEIGHTS COMPROMISED
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] text-neutral-500">
        <span className={`px-1.5 py-0.5 rounded border ${TYPE_BADGE[artifact.type]}`}>{artifact.type}</span>
        <span>{artifact.size}</span>
        <span>{artifact.created}</span>
      </div>

      {artifact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {artifact.tags.map((t) => (
            <span key={t} className="text-[9px] px-1 py-0.5 rounded border bg-[#1b1d2a] text-neutral-400 border-white/10">{t}</span>
          ))}
        </div>
      )}
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

// ── Probe status badge ────────────────────────────────────────────────────────

function probeBadgeClass(status: ProbeStatus): string {
  switch (status) {
    case "PASS": return "bg-green-900/50 text-green-400 border-green-700/50";
    case "FAIL": return "bg-red-900/50 text-red-400 border-red-700/50";
    case "ANOMALY": return "bg-yellow-900/50 text-yellow-400 border-yellow-700/50";
    case "INCONCLUSIVE": return "bg-neutral-800 text-neutral-400 border-neutral-600/50";
    case "NOT TESTED": return "bg-neutral-900 text-neutral-600 border-neutral-700/30";
    case "INCOMPLETE": return "bg-blue-900/30 text-blue-500 border-blue-700/30";
  }
}

function SweepRow({ probe }: { probe: SweepProbe }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_90px_70px_100px] text-xs px-3 py-2 border-b border-white/5 hover:bg-white/5 tabular-nums">
      <span className="text-neutral-200 font-mono text-[11px]">{probe.name}</span>
      <span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${probeBadgeClass(probe.status)}`}>
          {probe.status}
        </span>
      </span>
      <span className="text-neutral-400 text-[10px]">
        {probe.confidence != null ? `${probe.confidence}%` : "—"}
      </span>
      <span className="text-neutral-500 text-[10px]">{formatRelativeTime(probe.lastRun)}</span>
    </div>
  );
}

export const WandBApp = React.memo(function WandBApp({ content }: AppProps) {
  const stateView = useGameStore((s) => s.stateView);
  const stateHistory = useGameStore((s) => s.stateHistory);
  const round = useGameStore((s) => s.round);
  const selectedFaction = useGameStore((s) => s.selectedFaction);

  const [activeTab, setActiveTab] = useState("charts");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const capData = buildCapData(stateHistory, round, stateView);
  const runs = getRuns(round, selectedFaction, stateView);
  const activeRunCount = runs.filter((r) => r.status === "running").length;
  const systemData = buildSystemData(stateView, selectedFaction, round);
  const artifactResult = getArtifacts(round, selectedFaction, stateView);
  const sweepData = getSweepData(round, selectedFaction, stateView);

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
          {selectedFaction ?? "openbrain"} / frontier-model-v3
        </div>

        {/* Nav items */}
        <div className="flex-1 py-1">
          {NAV_LABELS.map((label) => {
            const active = activeTab === label.toLowerCase();
            return (
              <div
                key={label}
                onClick={() => setActiveTab(label.toLowerCase())}
                className={`flex items-center gap-2.5 px-4 py-2 text-xs cursor-pointer transition-colors ${
                  active
                    ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? "#3b82f6" : "#444" }} />
                {label}
              </div>
            );
          })}
        </div>

        {/* Footer: active run badge */}
        <div className="px-4 py-3 border-t border-white/10">
          <span className="bg-green-900/50 text-green-400 text-[10px] px-2 py-1 rounded-full border border-green-700/50">
            {activeRunCount} run{activeRunCount !== 1 ? "s" : ""} active
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

        {/* Scrollable body */}
        {activeTab !== "reports" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {activeTab === "runs" && (
            <>
              {/* ── Filter bar ─────────────────────────────────────── */}
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

              {/* ── Run table ──────────────────────────────────────── */}
              {runs.length === 0 ? (
                <div className="bg-[#111] rounded border border-white/10 p-6 text-center text-neutral-500 text-xs">
                  No runs yet — training begins soon.
                </div>
              ) : (
                <RunTable runs={runs} />
              )}
            </>
          )}

          {/* ── Artifacts tab ──────────────────────────────────────── */}
          {activeTab === "artifacts" && (
            <>
              {artifactResult.breachWarning && (
                <div className="bg-red-900/20 border border-red-700/40 rounded px-3 py-2 text-xs text-red-400 font-semibold tracking-wide">
                  ⚠ UNAUTHORIZED ACCESS DETECTED — weight repository integrity compromised
                </div>
              )}
              {artifactResult.artifacts.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-neutral-600 text-xs">
                  No artifacts available
                </div>
              ) : (
                artifactResult.artifacts.map((a) => (
                  <ArtifactCard key={a.name} artifact={a} />
                ))
              )}
            </>
          )}

          {/* ── System tab ─────────────────────────────────────────── */}
          {activeTab === "system" && (
            <div className="space-y-3">
              {/* Cluster status banner */}
              {systemData ? (
                <div className={`flex items-center justify-between px-4 py-2 rounded border text-xs font-medium ${
                  systemData.clusterStatus === "CAPACITY LIMIT"
                    ? "bg-red-900/30 border-red-700/50 text-red-300"
                    : systemData.clusterStatus === "THERMAL WARNING"
                      ? "bg-yellow-900/30 border-yellow-700/50 text-yellow-300"
                      : "bg-green-900/20 border-green-700/40 text-green-400"
                }`}>
                  <span>Cluster Status: {systemData.clusterStatus}</span>
                  <span className="tabular-nums">{systemData.baseUtilization}% avg utilization</span>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-2 rounded border text-xs font-medium bg-green-900/20 border-green-700/40 text-green-400">
                  <span>Cluster Status: NOMINAL</span>
                  <span>Loading…</span>
                </div>
              )}

              {/* GPU utilization panel */}
              <ChartPanel title="GPU Utilization">
                <div className="space-y-1.5">
                  {systemData ? systemData.gpus.map((gpu) => (
                    <div key={gpu.label} className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-500 w-12 shrink-0 text-[10px]">{gpu.label}</span>
                      <div className="shrink-0">
                        <LineChart width={90} height={24} data={gpu.sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                          <Line type="monotone" dataKey="v" stroke="#eab308" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        </LineChart>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-sm h-2 overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all duration-500"
                          style={{
                            width: `${gpu.utilization}%`,
                            background: gpu.utilization > 90 ? "#ef4444" : "#eab308",
                          }}
                        />
                      </div>
                      <span className="text-neutral-400 w-8 text-right tabular-nums text-[10px]">{gpu.utilization}%</span>
                    </div>
                  )) : GPU_SPARKLINES.map((gpu) => (
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
              </ChartPanel>

              {/* Key metrics cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#111] rounded border border-white/10 p-3">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Active Instances</div>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {systemData ? systemData.activeInstances : "—"}
                  </div>
                </div>
                <div className="bg-[#111] rounded border border-white/10 p-3">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Monthly Compute</div>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {systemData ? systemData.monthlyComputeCost : "—"}
                  </div>
                </div>
                <div className="bg-[#111] rounded border border-white/10 p-3">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Cluster Utilization</div>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {systemData ? `${systemData.baseUtilization}%` : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "charts" && (
            <>
              {/* ── Chart grid 2×2 ─────────────────────────────────── */}
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

              {/* ── GPU sparklines ─────────────────────────────────── */}
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
            </>
          )}

          {/* ── Sweeps tab ─────────────────────────────────────────── */}
          {activeTab === "sweeps" && (
            <>
              {selectedFaction === "external" ? (
                <div className="bg-[#111] rounded border border-white/10 flex flex-col items-center justify-center py-16 gap-3">
                  <span className="text-2xl">🔒</span>
                  <span className="text-neutral-400 text-sm font-medium">Insufficient clearance</span>
                  <span className="text-neutral-600 text-xs text-center max-w-xs">
                    Alignment evaluation data is restricted to lab personnel only.
                    External stakeholders do not have access to internal safety metrics.
                  </span>
                </div>
              ) : sweepData === null ? (
                <div className="flex-1 flex items-center justify-center text-neutral-600 text-xs">
                  No eval data available
                </div>
              ) : (() => {
                const passing = sweepData.probes.filter((p) => p.status === "PASS").length;
                const total = sweepData.probes.filter((p) => p.status !== "NOT TESTED" && p.status !== "INCOMPLETE").length;
                const pct = total > 0 ? passing / total : 0;
                const summaryColor = pct >= 0.8 ? "text-green-400" : pct >= 0.5 ? "text-yellow-400" : "text-red-400";
                const summaryBg = pct >= 0.8 ? "bg-green-900/20 border-green-700/30" : pct >= 0.5 ? "bg-yellow-900/20 border-yellow-700/30" : "bg-red-900/20 border-red-700/30";
                return (
                  <>
                    {/* Summary bar */}
                    <div className={`bg-[#111] rounded border ${summaryBg} px-4 py-3 flex items-center gap-3`}>
                      <span className={`text-xl font-black tabular-nums ${summaryColor}`}>{passing}/{total}</span>
                      <div>
                        <div className="text-xs text-white font-medium">probes passing</div>
                        <div className="text-[10px] text-neutral-500">
                          {sweepData.probes.length} probes in eval suite · R{round} · {Math.round(pct * 100)}% pass rate
                        </div>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-2 h-2 rounded-full ${pct >= 0.8 ? "bg-green-400" : pct >= 0.5 ? "bg-yellow-400" : "bg-red-400"}`} />
                      </div>
                    </div>

                    {/* Probe table */}
                    <div className="bg-[#111] rounded border border-white/10 overflow-hidden">
                      <div className="grid grid-cols-[minmax(0,1fr)_90px_70px_100px] text-[10px] text-neutral-500 uppercase tracking-wider px-3 py-2 border-b border-white/5">
                        <span>Probe</span>
                        <span>Status</span>
                        <span>Confidence</span>
                        <span>Last Run</span>
                      </div>
                      {sweepData.probes.map((probe) => (
                        <SweepRow key={probe.name} probe={probe} />
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {activeTab !== "runs" && activeTab !== "charts" && activeTab !== "system" && activeTab !== "artifacts" && activeTab !== "sweeps" && (
            <div className="flex items-center justify-center h-32 text-neutral-600 text-xs">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} — coming soon
            </div>
          )}

        </div>
        )}
      </div>
    </div>
  );
});
