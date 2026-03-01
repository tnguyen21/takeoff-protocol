import React from "react";
import type { AppProps } from "./types.js";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useGameStore } from "../stores/game.js";
import type { StateView } from "@takeoff/shared";

const RUNS = [
  { name: "run-789-ft-v3", status: "running", loss: "0.0412", step: "12,440" },
  { name: "run-788-base", status: "finished", loss: "0.0581", step: "20,000" },
  { name: "run-787-ablation", status: "crashed", loss: "NaN", step: "3,210" },
];

function buildCapData(stateHistory: Record<number, StateView>, round: number, sv: StateView | null) {
  const hist: Record<number, StateView> = { ...stateHistory };
  if (sv && round > 0) hist[round] = sv;

  const rounds = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;

  const latestRound = rounds[rounds.length - 1];
  const latest = hist[latestRound];
  const obAcc = latest.obCapability.accuracy;
  const promAcc = latest.promCapability.accuracy;
  const chinaAcc = latest.chinaCapability.accuracy;

  // Use latest confidence for band rendering (applied uniformly to all history)
  const obConf = obAcc === "estimate" ? (latest.obCapability.confidence ?? 0) : 0;
  const promConf = promAcc === "estimate" ? (latest.promCapability.confidence ?? 0) : 0;
  const chinaConf = chinaAcc === "estimate" ? (latest.chinaCapability.confidence ?? 0) : 0;

  const data = rounds.map((r) => {
    const s = hist[r];
    const ob = s.obCapability;
    const prom = s.promCapability;
    const china = s.chinaCapability;
    return {
      round: r,
      ob: ob.accuracy !== "hidden" ? ob.value : null,
      prom: prom.accuracy !== "hidden" ? prom.value : null,
      china: china.accuracy !== "hidden" ? china.value : null,
      obLow: obConf > 0 && ob.accuracy !== "hidden" ? ob.value - obConf : null,
      obBandH: obConf > 0 && ob.accuracy !== "hidden" ? obConf * 2 : null,
      promLow: promConf > 0 && prom.accuracy !== "hidden" ? prom.value - promConf : null,
      promBandH: promConf > 0 && prom.accuracy !== "hidden" ? promConf * 2 : null,
      chinaLow: chinaConf > 0 && china.accuracy !== "hidden" ? china.value - chinaConf : null,
      chinaBandH: chinaConf > 0 && china.accuracy !== "hidden" ? chinaConf * 2 : null,
    };
  });

  return { data, obAcc, promAcc, chinaAcc };
}

export const WandBApp = React.memo(function WandBApp({ content }: AppProps) {
  const chartItems = content.filter((i) => i.type === "chart");
  const { stateView, stateHistory, round } = useGameStore((s) => ({
    stateView: s.stateView,
    stateHistory: s.stateHistory,
    round: s.round,
  }));

  const capData = buildCapData(stateHistory, round, stateView);

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
        {/* Intel chart metrics */}
        {chartItems.length > 0 && (
          <div className="bg-[#111] rounded border border-white/10 p-3">
            <div className="text-xs text-neutral-400 mb-3 font-medium uppercase tracking-wider">Intel Metrics</div>
            <div className="space-y-3">
              {chartItems.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 font-medium">{item.subject ?? item.sender ?? "Metric"}</span>
                    <span className="text-neutral-500 text-[10px]">{item.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Capability Index Chart */}
        <div className="bg-[#111] rounded border border-white/10 p-3">
          <div className="text-xs text-neutral-400 mb-3 font-medium uppercase tracking-wider">Capability Index</div>
          {!capData ? (
            <div className="h-40 flex items-center justify-center text-neutral-600 text-xs">No state data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={capData.data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="round"
                    type="number"
                    domain={[1, 5]}
                    tickCount={5}
                    tick={{ fill: "#555", fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#555", fontSize: 10 }}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 4, fontSize: 11 }}
                    labelFormatter={(v: unknown) => `Round ${v}`}
                    formatter={(val: number | undefined, name: string | undefined) => [val != null ? val.toFixed(0) : "", name ?? ""]}
                  />

                  {/* OB Capability – blue */}
                  <Area stackId="ob" type="monotone" dataKey="obLow" fill="transparent" stroke="none" legendType="none" />
                  <Area stackId="ob" type="monotone" dataKey="obBandH" fill="#3b82f6" fillOpacity={0.12} stroke="none" legendType="none" />
                  {capData.obAcc !== "hidden" && (
                    <Line
                      type="monotone"
                      dataKey="ob"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray={capData.obAcc === "estimate" ? "4 2" : undefined}
                      connectNulls
                      name="OB"
                    />
                  )}

                  {/* Prometheus Capability – green */}
                  <Area stackId="prom" type="monotone" dataKey="promLow" fill="transparent" stroke="none" legendType="none" />
                  <Area stackId="prom" type="monotone" dataKey="promBandH" fill="#22c55e" fillOpacity={0.12} stroke="none" legendType="none" />
                  {capData.promAcc !== "hidden" && (
                    <Line
                      type="monotone"
                      dataKey="prom"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray={capData.promAcc === "estimate" ? "4 2" : undefined}
                      connectNulls
                      name="Prometheus"
                    />
                  )}

                  {/* China Capability – red */}
                  <Area stackId="china" type="monotone" dataKey="chinaLow" fill="transparent" stroke="none" legendType="none" />
                  <Area stackId="china" type="monotone" dataKey="chinaBandH" fill="#ef4444" fillOpacity={0.12} stroke="none" legendType="none" />
                  {capData.chinaAcc !== "hidden" && (
                    <Line
                      type="monotone"
                      dataKey="china"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray={capData.chinaAcc === "estimate" ? "4 2" : undefined}
                      connectNulls
                      name="China"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex gap-4 mt-2 justify-end">
                {capData.obAcc !== "hidden" && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-400">
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#3b82f6" strokeWidth="2" strokeDasharray={capData.obAcc === "estimate" ? "4 2" : undefined} /></svg>
                    OB
                  </span>
                )}
                {capData.promAcc !== "hidden" && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400">
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#22c55e" strokeWidth="2" strokeDasharray={capData.promAcc === "estimate" ? "4 2" : undefined} /></svg>
                    PROM
                  </span>
                )}
                {capData.chinaAcc !== "hidden" && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400">
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#ef4444" strokeWidth="2" strokeDasharray={capData.chinaAcc === "estimate" ? "4 2" : undefined} /></svg>
                    CHINA
                  </span>
                )}
              </div>
            </>
          )}
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
