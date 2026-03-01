import React from "react";
import type { AppProps } from "./types.js";
import type { Accuracy } from "@takeoff/shared";
import { LineChart, Line } from "recharts";
import { useGameStore } from "../stores/game.js";
import type { StateView } from "@takeoff/shared";

interface StateRow {
  label: string;
  key: keyof StateView;
  min: number;
  max: number;
  unit?: string;
}

const STATE_ROW_DEFS: StateRow[] = [
  { label: "OB Capability", key: "obCapability", min: 0, max: 100, unit: "pts" },
  { label: "Prometheus Capability", key: "promCapability", min: 0, max: 100 },
  { label: "China Capability", key: "chinaCapability", min: 0, max: 100 },
  { label: "US–China Gap", key: "usChinaGap", min: -24, max: 24, unit: "mo" },
  { label: "OB–Prom Gap", key: "obPromGap", min: -24, max: 24, unit: "mo" },
  { label: "Alignment Confidence", key: "alignmentConfidence", min: 0, max: 100 },
  { label: "Misalignment Severity", key: "misalignmentSeverity", min: 0, max: 100 },
  { label: "Public Awareness", key: "publicAwareness", min: 0, max: 100 },
  { label: "Public Sentiment", key: "publicSentiment", min: -100, max: 100 },
  { label: "Economic Disruption", key: "economicDisruption", min: 0, max: 100 },
  { label: "Taiwan Tension", key: "taiwanTension", min: 0, max: 100 },
  { label: "OB Internal Trust", key: "obInternalTrust", min: 0, max: 100 },
  { label: "Security Level OB", key: "securityLevelOB", min: 1, max: 5, unit: "SL" },
  { label: "Intl Cooperation", key: "intlCooperation", min: 0, max: 100 },
];

// Fallback static values used when stateView is null (matches previous mock)
const STATIC_FALLBACK: Record<keyof StateView, { value: number; accuracy: Accuracy; confidence?: number }> = {
  obCapability: { value: 72, accuracy: "exact" },
  promCapability: { value: 61, accuracy: "estimate", confidence: 8 },
  chinaCapability: { value: 55, accuracy: "estimate", confidence: 15 },
  usChinaGap: { value: 6, accuracy: "estimate", confidence: 3 },
  obPromGap: { value: 4, accuracy: "exact" },
  alignmentConfidence: { value: 48, accuracy: "exact" },
  misalignmentSeverity: { value: 31, accuracy: "hidden" },
  publicAwareness: { value: 42, accuracy: "exact" },
  publicSentiment: { value: -15, accuracy: "estimate", confidence: 10 },
  economicDisruption: { value: 38, accuracy: "hidden" },
  taiwanTension: { value: 62, accuracy: "estimate", confidence: 12 },
  obInternalTrust: { value: 71, accuracy: "exact" },
  securityLevelOB: { value: 3, accuracy: "exact" },
  securityLevelProm: { value: 3, accuracy: "exact" },
  intlCooperation: { value: 44, accuracy: "estimate", confidence: 7 },
};

const ACCURACY_COLOR: Record<Accuracy, string> = {
  exact: "bg-green-500",
  estimate: "bg-yellow-500",
  hidden: "bg-neutral-600",
};

const ACCURACY_TEXT: Record<Accuracy, string> = {
  exact: "text-green-400",
  estimate: "text-yellow-400",
  hidden: "text-neutral-500",
};

const SPARKLINE_STROKE: Record<Accuracy, string> = {
  exact: "#22c55e",
  estimate: "#eab308",
  hidden: "#555",
};

function Sparkline({ data, accuracy }: { data: Array<{ v: number | null }>; accuracy: Accuracy }) {
  if (!data.length) return <div style={{ width: 60, height: 24 }} />;
  return (
    <LineChart width={60} height={24} data={data}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={SPARKLINE_STROKE[accuracy]}
        strokeWidth={1.5}
        dot={false}
        connectNulls
        isAnimationActive={false}
      />
    </LineChart>
  );
}

export const GameStateApp = React.memo(function GameStateApp({ content: _ }: AppProps) {
  const { stateView, stateHistory } = useGameStore((s) => ({
    stateView: s.stateView,
    stateHistory: s.stateHistory,
  }));

  const rounds = Object.keys(stateHistory).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white text-xs">
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-3 shrink-0">
        <span className="font-mono font-bold text-sm text-green-400">STATE MONITOR</span>
        <div className="ml-auto flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />Exact</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" />Estimate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-neutral-600 inline-block" />Hidden</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {STATE_ROW_DEFS.map((rowDef) => {
          // Use live stateView if available, otherwise fall back to static mock
          const fogVar = stateView ? stateView[rowDef.key] : STATIC_FALLBACK[rowDef.key];
          const { value, accuracy, confidence } = fogVar;
          const pct = ((value - rowDef.min) / (rowDef.max - rowDef.min)) * 100;
          const isHidden = accuracy === "hidden";

          // Build sparkline data from history
          const sparkData = rounds.map((r) => {
            const hv = stateHistory[r][rowDef.key];
            return { v: hv.accuracy !== "hidden" ? hv.value : null };
          });

          return (
            <div key={rowDef.key} className="flex items-center gap-2">
              <span className="w-36 shrink-0 text-neutral-400 text-[11px] truncate">{rowDef.label}</span>

              {/* Bar */}
              <div className="flex-1 relative h-3 bg-neutral-800 rounded-full overflow-hidden">
                {isHidden ? (
                  <div className="absolute inset-0 bg-neutral-700/50 flex items-center justify-center">
                    <div className="w-full h-full" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)" }} />
                  </div>
                ) : (
                  <>
                    <div
                      className={`h-full rounded-full ${ACCURACY_COLOR[accuracy]} opacity-70`}
                      style={{ width: `${pct}%` }}
                    />
                    {confidence && (
                      <div
                        className="absolute top-0 h-full bg-white/20 rounded-full"
                        style={{
                          left: `${Math.max(0, pct - (confidence / (rowDef.max - rowDef.min)) * 100)}%`,
                          width: `${(confidence * 2 / (rowDef.max - rowDef.min)) * 100}%`,
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Value */}
              <div className={`w-16 text-right font-mono text-[11px] shrink-0 ${ACCURACY_TEXT[accuracy]}`}>
                {isHidden ? (
                  <span className="text-neutral-600">██████</span>
                ) : (
                  <>
                    {value}{rowDef.unit ?? ""}
                    {confidence && <span className="text-neutral-600"> ±{confidence}</span>}
                  </>
                )}
              </div>

              {/* Sparkline */}
              <div className="shrink-0 opacity-70">
                <Sparkline data={sparkData} accuracy={accuracy} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
