import React from "react";
import type { AppProps } from "./types.js";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useGameStore } from "../stores/game.js";
import type { StateView } from "@takeoff/shared";

const TICKERS = [
  { sym: "NVDA", price: "847.23", chg: "+4.12", pct: "+0.49%", vol: "48.2M" },
  { sym: "GOOGL", price: "182.41", chg: "-2.87", pct: "-1.55%", vol: "22.8M" },
  { sym: "MSFT", price: "419.38", chg: "+1.04", pct: "+0.25%", vol: "19.1M" },
  { sym: "AMZN", price: "203.17", chg: "-3.21", pct: "-1.56%", vol: "31.4M" },
  { sym: "META", price: "558.90", chg: "+8.34", pct: "+1.51%", vol: "15.6M" },
  { sym: "TSM", price: "168.44", chg: "-12.80", pct: "-7.07%", vol: "44.1M" },
  { sym: "AMD", price: "178.32", chg: "+2.91", pct: "+1.66%", vol: "38.9M" },
];

const STATIC_HEADLINES = [
  "SENATE AI GOVERNANCE BILL ADVANCES — TECH SECTOR SELL-OFF DEEPENS",
  "OPENB DELAYS MODEL RELEASE CITING SAFETY REVIEW — STOCK +2.1%",
  "TSM FALLS ON TAIWAN STRAIT TENSION REPORTS — SUPPLY CHAIN CONCERNS",
  "FED: AI-DRIVEN PRODUCTIVITY GAINS COULD OFFSET LABOR DISPLACEMENT — PAPER",
  "CHINA ANNOUNCES $40B STATE AI FUND — SEMICONDUCTOR FUTURES SURGE",
];

const INDICES = [
  { name: "SPX", value: "5,204.34", chg: "-0.82%" },
  { name: "NDX", value: "18,122.87", chg: "-1.24%" },
  { name: "DJI", value: "38,891.20", chg: "-0.43%" },
  { name: "VIX", value: "22.41", chg: "+18.3%" },
];

function buildEconData(stateHistory: Record<number, StateView>, round: number, sv: StateView | null) {
  const hist: Record<number, StateView> = { ...stateHistory };
  if (sv && round > 0) hist[round] = sv;

  const rounds = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;

  return rounds.map((r) => ({
    round: r,
    disruption: hist[r].economicDisruption.accuracy !== "hidden" ? hist[r].economicDisruption.value : null,
  }));
}

export const BloombergApp = React.memo(function BloombergApp({ content }: AppProps) {
  const headlineItems = content.filter((i) => i.type === "headline");
  const headlines =
    headlineItems.length > 0
      ? headlineItems.map((item) => (item.subject ?? item.body).toUpperCase())
      : STATIC_HEADLINES;

  const { stateView, stateHistory, round } = useGameStore((s) => ({
    stateView: s.stateView,
    stateHistory: s.stateHistory,
    round: s.round,
  }));

  const econData = buildEconData(stateHistory, round, stateView);
  const econAccuracy = stateView?.economicDisruption.accuracy ?? null;
  const econValue = stateView ? (econAccuracy !== "hidden" ? stateView.economicDisruption.value : null) : null;
  const inTurmoil = econValue !== null && econValue > 50;

  const sentimentAccuracy = stateView?.publicSentiment.accuracy ?? null;
  const sentimentValue = stateView ? (sentimentAccuracy !== "hidden" ? stateView.publicSentiment.value : null) : null;

  return (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono text-xs">
      {/* Header */}
      <div className="bg-[#f26522] text-black px-3 py-1 flex items-center justify-between shrink-0">
        <span className="font-bold text-sm tracking-widest">BLOOMBERG TERMINAL</span>
        <span className="text-black/70 text-[10px]">NY  10:42:31  2026-02-28</span>
      </div>

      {/* Turmoil banner */}
      {inTurmoil && (
        <div className="bg-red-900/80 border-y border-red-500 px-3 py-1 text-red-300 font-bold text-[11px] tracking-widest text-center shrink-0 animate-pulse">
          ⚠ MARKETS IN TURMOIL — ECONOMIC DISRUPTION INDEX: {econValue?.toFixed(0)}
        </div>
      )}

      {/* Index bar */}
      <div className="flex gap-6 px-3 py-1 bg-[#0a0a0a] border-b border-green-900 shrink-0">
        {INDICES.map((idx) => (
          <span key={idx.name} className="flex gap-2">
            <span className="text-[#f26522] font-bold">{idx.name}</span>
            <span className="text-amber-300">{idx.value}</span>
            <span className={idx.chg.startsWith("+") ? "text-green-400" : "text-red-400"}>{idx.chg}</span>
          </span>
        ))}
      </div>

      {/* Economic disruption chart + public sentiment */}
      <div className="shrink-0 border-b border-green-900 px-3 py-2 bg-[#050505]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#f26522] text-[10px] tracking-widest">ECON DISRUPTION INDEX</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-green-700">PUBLIC SENTIMENT</span>
            {sentimentValue === null ? (
              <span className="text-neutral-600 text-[11px] font-bold">██████</span>
            ) : (
              <span
                className={`text-[14px] font-bold ${sentimentValue > 10 ? "text-green-400" : sentimentValue < -10 ? "text-red-400" : "text-amber-400"}`}
              >
                {sentimentValue > 0 ? "+" : ""}{sentimentValue.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {econValue === null && econAccuracy === null ? (
          <div className="h-14 flex items-center justify-center text-green-900 text-[10px]">-- NO DATA --</div>
        ) : econAccuracy === "hidden" ? (
          <div className="h-14 flex items-center justify-center text-red-900 text-[10px] font-bold">-- CLASSIFIED --</div>
        ) : (
          <ResponsiveContainer width="100%" height={56}>
            <AreaChart data={econData ?? []} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="econGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={inTurmoil ? "#ef4444" : "#f26522"} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={inTurmoil ? "#ef4444" : "#f26522"} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="round" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{ background: "#0a0a0a", border: "1px solid #1a4a1a", borderRadius: 2, fontSize: 10 }}
                labelFormatter={(v) => `Round ${v}`}
                formatter={(val: number | undefined) => [val != null ? val.toFixed(0) : "", "Disruption"]}
              />
              <Area
                type="monotone"
                dataKey="disruption"
                stroke={inTurmoil ? "#ef4444" : "#f26522"}
                fill="url(#econGrad)"
                strokeWidth={1.5}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: ticker table */}
        <div className="flex-1 overflow-y-auto border-r border-green-900">
          <div className="grid grid-cols-5 text-[#f26522] px-2 py-1 border-b border-green-900 text-[10px] tracking-widest">
            <span>TICKER</span><span>LAST</span><span>CHG</span><span>%CHG</span><span>VOL</span>
          </div>
          {TICKERS.map((t) => (
            <div key={t.sym} className="grid grid-cols-5 px-2 py-1 border-b border-green-900/30 hover:bg-green-900/10 cursor-pointer">
              <span className="text-amber-300 font-bold">{t.sym}</span>
              <span className="text-green-300">{t.price}</span>
              <span className={t.chg.startsWith("+") ? "text-green-400" : "text-red-400"}>{t.chg}</span>
              <span className={t.pct.startsWith("+") ? "text-green-400" : "text-red-400"}>{t.pct}</span>
              <span className="text-green-700">{t.vol}</span>
            </div>
          ))}
        </div>

        {/* Right: news */}
        <div className="w-56 overflow-y-auto">
          <div className="text-[#f26522] px-2 py-1 border-b border-green-900 text-[10px] tracking-widest">TOP STORIES</div>
          {headlines.map((h, i) => (
            <div key={i} className="px-2 py-2 border-b border-green-900/20 text-[10px] text-green-300 leading-tight hover:bg-green-900/10 cursor-pointer">
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* Command bar */}
      <div className="flex items-center gap-2 px-2 py-1 bg-[#0a0a0a] border-t border-green-900 shrink-0">
        <span className="text-[#f26522]">CMD&gt;</span>
        <span className="animate-pulse text-green-400">_</span>
      </div>
    </div>
  );
});
