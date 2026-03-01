import React, { useState, useMemo } from "react";
import type { AppProps } from "./types.js";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useGameStore } from "../stores/game.js";
import type { StateView } from "@takeoff/shared";

const TICKERS = [
  { sym: "NVDA",  price: "847.23", chg: "+4.12",  pct: "+0.49%", vol: "48.2M" },
  { sym: "GOOGL", price: "182.41", chg: "-2.87",  pct: "-1.55%", vol: "22.8M" },
  { sym: "MSFT",  price: "419.38", chg: "+1.04",  pct: "+0.25%", vol: "19.1M" },
  { sym: "AMZN",  price: "203.17", chg: "-3.21",  pct: "-1.56%", vol: "31.4M" },
  { sym: "META",  price: "558.90", chg: "+8.34",  pct: "+1.51%", vol: "15.6M" },
  { sym: "TSM",   price: "168.44", chg: "-12.80", pct: "-7.07%", vol: "44.1M" },
  { sym: "AMD",   price: "178.32", chg: "+2.91",  pct: "+1.66%", vol: "38.9M" },
  { sym: "INTC",  price: "22.14",  chg: "-0.88",  pct: "-3.82%", vol: "52.3M" },
  { sym: "AAPL",  price: "189.52", chg: "+0.74",  pct: "+0.39%", vol: "41.7M" },
  { sym: "JPM",   price: "194.37", chg: "+1.22",  pct: "+0.63%", vol: "12.9M" },
  { sym: "GS",    price: "447.80", chg: "-3.10",  pct: "-0.69%", vol: "4.1M"  },
  { sym: "QQQ",   price: "441.23", chg: "-5.42",  pct: "-1.22%", vol: "33.5M" },
  { sym: "SMH",   price: "218.67", chg: "-9.34",  pct: "-4.10%", vol: "18.2M" },
  { sym: "SOXX",  price: "207.14", chg: "-8.91",  pct: "-4.13%", vol: "9.7M"  },
  { sym: "US10Y", price: "4.487",  chg: "+0.032", pct: "+0.72%", vol: "--"    },
  { sym: "US2Y",  price: "4.712",  chg: "+0.018", pct: "+0.38%", vol: "--"    },
  { sym: "GOLD",  price: "2341.40",chg: "+12.80", pct: "+0.55%", vol: "247K"  },
  { sym: "OIL",   price: "82.14",  chg: "-1.23",  pct: "-1.47%", vol: "389K"  },
  { sym: "NATGAS",price: "2.187",  chg: "+0.041", pct: "+1.91%", vol: "112K"  },
  { sym: "BTC",   price: "67482",  chg: "-1243",  pct: "-1.81%", vol: "18.4B" },
  { sym: "ETH",   price: "3412.88",chg: "-87.22", pct: "-2.49%", vol: "9.2B"  },
];

// 30+ symbols for the scrolling ticker tape
const TAPE_TICKERS = [
  { sym: "NVDA",   chg: "+0.49%", up: true  },
  { sym: "GOOGL",  chg: "-1.55%", up: false },
  { sym: "MSFT",   chg: "+0.25%", up: true  },
  { sym: "AMZN",   chg: "-1.56%", up: false },
  { sym: "META",   chg: "+1.51%", up: true  },
  { sym: "TSM",    chg: "-7.07%", up: false },
  { sym: "AMD",    chg: "+1.66%", up: true  },
  { sym: "INTC",   chg: "-3.82%", up: false },
  { sym: "AAPL",   chg: "+0.39%", up: true  },
  { sym: "JPM",    chg: "+0.63%", up: true  },
  { sym: "GS",     chg: "-0.69%", up: false },
  { sym: "QQQ",    chg: "-1.22%", up: false },
  { sym: "SMH",    chg: "-4.10%", up: false },
  { sym: "SOXX",   chg: "-4.13%", up: false },
  { sym: "SPY",    chg: "-0.82%", up: false },
  { sym: "IWM",    chg: "-1.03%", up: false },
  { sym: "US10Y",  chg: "+0.72%", up: true  },
  { sym: "US2Y",   chg: "+0.38%", up: true  },
  { sym: "GOLD",   chg: "+0.55%", up: true  },
  { sym: "OIL",    chg: "-1.47%", up: false },
  { sym: "NATGAS", chg: "+1.91%", up: true  },
  { sym: "BTC",    chg: "-1.81%", up: false },
  { sym: "ETH",    chg: "-2.49%", up: false },
  { sym: "SOL",    chg: "+3.12%", up: true  },
  { sym: "XLF",    chg: "+0.28%", up: true  },
  { sym: "XLE",    chg: "-0.91%", up: false },
  { sym: "XLK",    chg: "-1.34%", up: false },
  { sym: "XLV",    chg: "+0.17%", up: true  },
  { sym: "VIX",    chg: "+18.3%", up: true  },
  { sym: "DXY",    chg: "+0.44%", up: true  },
  { sym: "EUR/USD",chg: "-0.31%", up: false },
  { sym: "USD/JPY",chg: "+0.52%", up: true  },
];

type WireSource = "BBG" | "RTRS" | "AP" | "DJ";

interface WireHeadline {
  time: string;
  source: WireSource;
  text: string;
}

const STATIC_WIRE_HEADLINES: WireHeadline[] = [
  { time: "10:41", source: "BBG",  text: "SENATE AI GOVERNANCE BILL ADVANCES — TECH SECTOR SELL-OFF DEEPENS" },
  { time: "10:38", source: "RTRS", text: "OPENAI DELAYS MODEL RELEASE CITING SAFETY REVIEW — STOCK +2.1%" },
  { time: "10:33", source: "AP",   text: "TSM FALLS ON TAIWAN STRAIT TENSION REPORTS — SUPPLY CHAIN CONCERNS" },
  { time: "10:29", source: "BBG",  text: "FED: AI-DRIVEN PRODUCTIVITY GAINS COULD OFFSET LABOR DISPLACEMENT" },
  { time: "10:21", source: "DJ",   text: "CHINA ANNOUNCES $40B STATE AI FUND — SEMICONDUCTOR FUTURES SURGE" },
  { time: "10:14", source: "RTRS", text: "NVIDIA SAYS AI CHIP DEMAND OUTPACING SUPPLY THROUGH 2027" },
  { time: "10:08", source: "BBG",  text: "REGULATORS WEIGH MANDATORY AI AUDIT REQUIREMENTS FOR LARGE MODELS" },
  { time: "09:57", source: "AP",   text: "SENATE JUDICIARY SUBCOMMITTEE SETS EMERGENCY AI HEARING FOR MONDAY" },
];

const SOURCE_COLORS: Record<WireSource, string> = {
  BBG:  "text-green-400",
  RTRS: "text-orange-400",
  AP:   "text-red-400",
  DJ:   "text-cyan-400",
};

const INDICES = [
  { name: "SPX", value: "5,204.34", chg: "-0.82%" },
  { name: "NDX", value: "18,122.87", chg: "-1.24%" },
  { name: "DJI", value: "38,891.20", chg: "-0.43%" },
  { name: "VIX", value: "22.41",     chg: "+18.3%" },
];

type SortCol = "sym" | "price" | "chg" | "pct" | "vol";

function numericVal(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.\-+]/g, ""));
  return isNaN(n) ? 0 : n;
}

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
  const [sortCol, setSortCol] = useState<SortCol>("sym");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const headlineItems = content.filter((i) => i.type === "headline");
  const wireHeadlines: WireHeadline[] =
    headlineItems.length > 0
      ? headlineItems.map((item, idx) => ({
          time: `${10 - Math.floor(idx / 2)}:${String(41 - (idx % 2) * 7).padStart(2, "0")}`,
          source: (["BBG", "RTRS", "AP", "DJ"] as WireSource[])[idx % 4],
          text: (item.subject ?? item.body).toUpperCase(),
        }))
      : STATIC_WIRE_HEADLINES;

  const stateView = useGameStore((s) => s.stateView);
  const stateHistory = useGameStore((s) => s.stateHistory);
  const round = useGameStore((s) => s.round);

  const econData = buildEconData(stateHistory, round, stateView);
  const econAccuracy = stateView?.economicDisruption.accuracy ?? null;
  const econValue = stateView ? (econAccuracy !== "hidden" ? stateView.economicDisruption.value : null) : null;
  const inTurmoil = econValue !== null && econValue > 50;

  const marketIndexAccuracy = stateView?.marketIndex.accuracy ?? null;
  const marketIndexValue = stateView ? (marketIndexAccuracy !== "hidden" ? stateView.marketIndex.value : null) : null;
  const inMarketTurmoil = marketIndexValue !== null && marketIndexValue < 80;
  const inBullRun = marketIndexValue !== null && marketIndexValue > 160;

  const sentimentAccuracy = stateView?.publicSentiment.accuracy ?? null;
  const sentimentValue = stateView ? (sentimentAccuracy !== "hidden" ? stateView.publicSentiment.value : null) : null;

  const sortedTickers = useMemo(() => {
    const tickers = [...TICKERS];
    tickers.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortCol === "sym") {
        av = a.sym; bv = b.sym;
      } else if (sortCol === "price") {
        av = numericVal(a.price); bv = numericVal(b.price);
      } else if (sortCol === "chg") {
        av = numericVal(a.chg); bv = numericVal(b.chg);
      } else if (sortCol === "pct") {
        av = numericVal(a.pct); bv = numericVal(b.pct);
      } else {
        av = a.vol === "--" ? -1 : numericVal(a.vol);
        bv = b.vol === "--" ? -1 : numericVal(b.vol);
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return tickers;
  }, [sortCol, sortDir]);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function sortArrow(col: SortCol) {
    if (sortCol !== col) return <span className="text-green-900 ml-0.5">↕</span>;
    return <span className="text-amber-400 ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const tapeContent = TAPE_TICKERS.map(
    (t) => `${t.sym} ${t.chg}`
  ).join("  ·  ");

  return (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono text-xs">
      <style>{`
        @keyframes bbgTapeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .bbg-tape-inner {
          animation: bbgTapeScroll 35s linear infinite;
          white-space: nowrap;
        }
      `}</style>

      {/* Header */}
      <div className="bg-[#f26522] text-black px-3 py-1 flex items-center justify-between shrink-0">
        <span className="font-bold text-sm tracking-widest">BLOOMBERG TERMINAL</span>
        <span className="text-black/80 text-[10px] tabular-nums tracking-wide">
          NY 10:42 | LDN 15:42 | TKY 00:42 | SHA 23:42
        </span>
      </div>

      {/* Turmoil banner — economic disruption */}
      {inTurmoil && (
        <div className="bg-red-900/80 border-y border-red-500 px-3 py-1 text-red-300 font-bold text-[11px] tracking-widest text-center shrink-0 animate-pulse">
          ⚠ MARKETS IN TURMOIL — ECONOMIC DISRUPTION INDEX: {econValue?.toFixed(0)}
        </div>
      )}

      {/* AI market condition banners */}
      {inMarketTurmoil && (
        <div className="bg-red-950/90 border-y border-red-700 px-3 py-1 text-red-400 font-bold text-[11px] tracking-widest text-center shrink-0 animate-pulse">
          ⚠ MARKETS IN TURMOIL — AI INDEX: {marketIndexValue?.toFixed(0)}
        </div>
      )}
      {inBullRun && (
        <div className="bg-green-950/90 border-y border-green-600 px-3 py-1 text-green-300 font-bold text-[11px] tracking-widest text-center shrink-0 animate-pulse">
          ▲ AI BULL RUN — AI INDEX: {marketIndexValue?.toFixed(0)}
        </div>
      )}

      {/* Index bar */}
      <div className="flex gap-6 px-3 py-1 bg-[#0a0a0a] border-b border-green-900 shrink-0 flex-wrap">
        {INDICES.map((idx) => (
          <span key={idx.name} className="flex gap-2 tabular-nums">
            <span className="text-[#f26522] font-bold">{idx.name}</span>
            <span className="text-amber-300">{idx.value}</span>
            <span className={idx.chg.startsWith("+") ? "text-green-400" : "text-red-400"}>{idx.chg}</span>
          </span>
        ))}
        {marketIndexValue !== null && (
          <span className="flex gap-2 tabular-nums">
            <span className="text-cyan-400 font-bold">AI INDEX</span>
            <span className={`font-mono ${inBullRun ? "text-green-400" : inMarketTurmoil ? "text-red-400" : "text-amber-300"}`}>
              {marketIndexValue.toFixed(0)}
            </span>
            <span className={`${marketIndexValue >= 100 ? "text-green-400" : "text-red-400"}`}>
              {marketIndexValue >= 100 ? `+${(marketIndexValue - 100).toFixed(0)}` : `${(marketIndexValue - 100).toFixed(0)}`}
            </span>
          </span>
        )}
      </div>

      {/* Scrolling ticker tape */}
      <div className="overflow-hidden bg-[#050505] border-b border-green-900 shrink-0 py-0.5">
        <div className="bbg-tape-inner inline-flex gap-0 text-[10px] tabular-nums">
          {[tapeContent, tapeContent].map((chunk, ci) => (
            <span key={ci} className="inline-flex">
              {TAPE_TICKERS.map((t, i) => (
                <span key={`${ci}-${i}`} className="inline-flex items-center gap-1 mr-4">
                  <span className="text-amber-300 font-bold">{t.sym}</span>
                  <span className={t.up ? "text-green-400" : "text-red-400"}>{t.chg}</span>
                  {i < TAPE_TICKERS.length - 1 && <span className="text-green-900 mx-1">·</span>}
                </span>
              ))}
            </span>
          ))}
        </div>
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
                className={`text-[14px] font-bold tabular-nums ${sentimentValue > 10 ? "text-green-400" : sentimentValue < -10 ? "text-red-400" : "text-amber-400"}`}
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
                labelFormatter={(v: unknown) => `Round ${v}`}
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
          <div className="grid grid-cols-5 text-[#f26522] px-2 py-1 border-b border-green-900 text-[10px] tracking-widest sticky top-0 bg-black z-10">
            <span className="cursor-pointer hover:text-amber-300 select-none" onClick={() => handleSort("sym")}>
              TICKER{sortArrow("sym")}
            </span>
            <span className="cursor-pointer hover:text-amber-300 select-none" onClick={() => handleSort("price")}>
              LAST{sortArrow("price")}
            </span>
            <span className="cursor-pointer hover:text-amber-300 select-none" onClick={() => handleSort("chg")}>
              CHG{sortArrow("chg")}
            </span>
            <span className="cursor-pointer hover:text-amber-300 select-none" onClick={() => handleSort("pct")}>
              %CHG{sortArrow("pct")}
            </span>
            <span className="cursor-pointer hover:text-amber-300 select-none" onClick={() => handleSort("vol")}>
              VOL{sortArrow("vol")}
            </span>
          </div>
          {sortedTickers.map((t) => (
            <div key={t.sym} className="grid grid-cols-5 px-2 py-1 border-b border-green-900/30 hover:bg-green-900/10 cursor-pointer tabular-nums">
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
          <div className="text-[#f26522] px-2 py-1 border-b border-green-900 text-[10px] tracking-widest sticky top-0 bg-black z-10">TOP STORIES</div>
          {wireHeadlines.map((h, i) => (
            <div key={i} className="px-2 py-2 border-b border-green-900/20 text-[10px] text-green-300 leading-tight hover:bg-green-900/10 cursor-pointer">
              <span className="text-green-700">{h.time} </span>
              <span className={`font-bold ${SOURCE_COLORS[h.source]}`}>{h.source}</span>
              <span className="text-green-600"> *</span>
              <span className="text-green-300"> {h.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Command bar */}
      <div className="flex items-center gap-2 px-2 py-1 bg-[#0a0a0a] border-t border-green-900 shrink-0">
        <span className="text-[#f26522]">CMD&gt;</span>
        <span className="animate-pulse text-amber-400 font-bold">█</span>
      </div>
    </div>
  );
});
