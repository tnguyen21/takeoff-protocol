import React from "react";
import type { AppProps } from "./types.js";
import type { Accuracy } from "@takeoff/shared";

interface StateRow {
  label: string;
  key: string;
  value: number;
  min: number;
  max: number;
  accuracy: Accuracy;
  confidence?: number;
  unit?: string;
}

const STATE_ROWS: StateRow[] = [
  { label: "OB Capability", key: "obCapability", value: 72, min: 0, max: 100, accuracy: "exact", unit: "pts" },
  { label: "Prometheus Capability", key: "promCapability", value: 61, min: 0, max: 100, accuracy: "estimate", confidence: 8 },
  { label: "China Capability", key: "chinaCapability", value: 55, min: 0, max: 100, accuracy: "estimate", confidence: 15 },
  { label: "US–China Gap", key: "usChinaGap", value: 6, min: -24, max: 24, accuracy: "estimate", confidence: 3, unit: "mo" },
  { label: "OB–Prom Gap", key: "obPromGap", value: 4, min: -24, max: 24, accuracy: "exact", unit: "mo" },
  { label: "Alignment Confidence", key: "alignmentConfidence", value: 48, min: 0, max: 100, accuracy: "exact" },
  { label: "Misalignment Severity", key: "misalignmentSeverity", value: 31, min: 0, max: 100, accuracy: "hidden" },
  { label: "Public Awareness", key: "publicAwareness", value: 42, min: 0, max: 100, accuracy: "exact" },
  { label: "Public Sentiment", key: "publicSentiment", value: -15, min: -100, max: 100, accuracy: "estimate", confidence: 10 },
  { label: "Economic Disruption", key: "economicDisruption", value: 38, min: 0, max: 100, accuracy: "hidden" },
  { label: "Taiwan Tension", key: "taiwanTension", value: 62, min: 0, max: 100, accuracy: "estimate", confidence: 12 },
  { label: "OB Internal Trust", key: "obInternalTrust", value: 71, min: 0, max: 100, accuracy: "exact" },
  { label: "Security Level OB", key: "securityLevelOB", value: 3, min: 1, max: 5, accuracy: "exact", unit: "SL" },
  { label: "Intl Cooperation", key: "intlCooperation", value: 44, min: 0, max: 100, accuracy: "estimate", confidence: 7 },
];

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

export const GameStateApp = React.memo(function GameStateApp(_: AppProps) {
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
        {STATE_ROWS.map((row) => {
          const pct = ((row.value - row.min) / (row.max - row.min)) * 100;
          const isHidden = row.accuracy === "hidden";
          return (
            <div key={row.key} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-neutral-400 text-[11px] truncate">{row.label}</span>

              {/* Bar */}
              <div className="flex-1 relative h-3 bg-neutral-800 rounded-full overflow-hidden">
                {isHidden ? (
                  <div className="absolute inset-0 bg-neutral-700/50 flex items-center justify-center">
                    <div className="w-full h-full" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)" }} />
                  </div>
                ) : (
                  <>
                    <div
                      className={`h-full rounded-full ${ACCURACY_COLOR[row.accuracy]} opacity-70`}
                      style={{ width: `${pct}%` }}
                    />
                    {row.confidence && (
                      <div
                        className="absolute top-0 h-full bg-white/20 rounded-full"
                        style={{
                          left: `${Math.max(0, pct - (row.confidence / (row.max - row.min)) * 100)}%`,
                          width: `${(row.confidence * 2 / (row.max - row.min)) * 100}%`,
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Value */}
              <div className={`w-24 text-right font-mono text-[11px] shrink-0 ${ACCURACY_TEXT[row.accuracy]}`}>
                {isHidden ? (
                  <span className="text-neutral-600">██████</span>
                ) : (
                  <>
                    {row.value}{row.unit ?? ""}
                    {row.confidence && <span className="text-neutral-600"> ±{row.confidence}</span>}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
