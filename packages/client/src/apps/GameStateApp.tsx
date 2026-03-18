import React from "react";
import type { AppProps } from "./types.js";
import type { Accuracy } from "@takeoff/shared";
import { LineChart, Line } from "recharts";
import { useGameStore } from "../stores/game.js";
import type { StateView } from "@takeoff/shared";
import { getBarColor, groupStatusColor, computeDelta } from "./gameStateUtils.js";
import type { Group, StateRow } from "./gameStateUtils.js";

// ── Group config ──────────────────────────────────────────────────────────────

const GROUP_CONFIG: Record<Group, { label: string; accent: string }> = {
  aiRace:      { label: "AI RACE",          accent: "#60a5fa" },
  safety:      { label: "SAFETY",           accent: "#f59e0b" },
  geopolitics: { label: "GEOPOLITICS",      accent: "#ef4444" },
  economy:     { label: "ECONOMY / PUBLIC", accent: "#10b981" },
  faction:     { label: "FACTION INTERNALS", accent: "#8b5cf6" },
};

// ── State row definitions ─────────────────────────────────────────────────────

const STATE_ROW_DEFS: StateRow[] = [
  // AI Race
  { label: "OB Capability",      key: "obCapability",    min: 0,   max: 100, unit: "pts", group: "aiRace",      higherIsBetter: true },
  { label: "Prometheus Cap.",    key: "promCapability",   min: 0,   max: 100,              group: "aiRace",      higherIsBetter: true },
  { label: "China Capability",   key: "chinaCapability",  min: 0,   max: 100,              group: "aiRace",      higherIsBetter: false },
  { label: "US–China Gap",       key: "usChinaGap",       min: -24, max: 24,  unit: "mo",  group: "aiRace",      higherIsBetter: true,  dangerBelow: 2  },
  { label: "OB–Prom Gap",        key: "obPromGap",        min: -24, max: 24,  unit: "mo",  group: "aiRace" },
  { label: "AI Autonomy Level",  key: "aiAutonomyLevel",  min: 0,   max: 100,              group: "aiRace",      higherIsBetter: false, dangerAbove: 60 },

  // Safety
  { label: "Alignment Confidence",    key: "alignmentConfidence",          min: 0, max: 100, group: "safety", higherIsBetter: true,  dangerBelow: 40 },
  { label: "Misalignment Severity",   key: "misalignmentSeverity",         min: 0, max: 100, group: "safety", higherIsBetter: false, dangerAbove: 50 },
  { label: "Whistleblower Pressure",  key: "whistleblowerPressure",        min: 0, max: 100, group: "safety", higherIsBetter: false, dangerAbove: 60 },
  { label: "Open Source Momentum",    key: "openSourceMomentum",           min: 0, max: 100, group: "safety" },
  { label: "Prom Safety Progress",    key: "promSafetyBreakthroughProgress", min: 0, max: 100, group: "safety", higherIsBetter: true },

  // Geopolitics
  { label: "Taiwan Tension",    key: "taiwanTension",    min: 0, max: 100, group: "geopolitics", higherIsBetter: false, dangerAbove: 60 },
  { label: "Intl Cooperation",  key: "intlCooperation",  min: 0, max: 100, group: "geopolitics", higherIsBetter: true,  dangerBelow: 30 },
  { label: "CCP Patience",      key: "ccpPatience",      min: 0, max: 100, group: "geopolitics", higherIsBetter: true,  dangerBelow: 30 },

  // Economy / Public
  { label: "Public Awareness",    key: "publicAwareness",   min: 0,    max: 100, group: "economy" },
  { label: "Public Sentiment",    key: "publicSentiment",   min: -100, max: 100, group: "economy", higherIsBetter: true,  dangerBelow: -30 },
  { label: "Economic Disruption", key: "economicDisruption", min: 0,   max: 100, group: "economy", higherIsBetter: false, dangerAbove: 60  },
  { label: "Market Index",        key: "marketIndex",        min: 0,   max: 200, group: "economy", higherIsBetter: true,  dangerBelow: 80  },
  { label: "Regulatory Pressure", key: "regulatoryPressure", min: 0,   max: 100, group: "economy", higherIsBetter: false, dangerAbove: 70  },
  { label: "Global Media Cycle",  key: "globalMediaCycle",   min: 0,   max: 5,   group: "economy" },

  // Faction Internals
  { label: "OB Internal Trust",    key: "obInternalTrust",     min: 0, max: 100, group: "faction", higherIsBetter: true,  dangerBelow: 40 },
  { label: "Security Level OB",   key: "securityLevelOB",     min: 1, max: 5, unit: "SL", group: "faction", higherIsBetter: true },
  { label: "Security Level Prom", key: "securityLevelProm",   min: 1, max: 5, unit: "SL", group: "faction", higherIsBetter: true },
  { label: "OB Morale",            key: "obMorale",            min: 0, max: 100, group: "faction", higherIsBetter: true,  dangerBelow: 40 },
  { label: "OB Burn Rate",         key: "obBurnRate",          min: 0, max: 100, group: "faction", higherIsBetter: false, dangerAbove: 70 },
  { label: "OB Board Confidence",  key: "obBoardConfidence",   min: 0, max: 100, group: "faction", higherIsBetter: true,  dangerBelow: 40 },
  { label: "Prom Morale",          key: "promMorale",          min: 0, max: 100, group: "faction", higherIsBetter: true,  dangerBelow: 40 },
  { label: "Prom Burn Rate",       key: "promBurnRate",        min: 0, max: 100, group: "faction", higherIsBetter: false, dangerAbove: 70 },
  { label: "Prom Board Confidence", key: "promBoardConfidence", min: 0, max: 100, group: "faction", higherIsBetter: true, dangerBelow: 40 },
  { label: "China Weight Theft",   key: "chinaWeightTheftProgress", min: 0, max: 100, group: "faction", higherIsBetter: false, dangerAbove: 50 },
  { label: "CDZ Compute Util.",    key: "cdzComputeUtilization", min: 0, max: 100, group: "faction" },
  { label: "Domestic Chip Progress", key: "domesticChipProgress", min: 0, max: 100, group: "faction", higherIsBetter: false },
];

// ── Static fallback (matches previous mock) ───────────────────────────────────

const STATIC_FALLBACK: Record<keyof StateView, { value: number; accuracy: Accuracy; confidence?: number }> = {
  obCapability:  { value: 72, accuracy: "exact" },
  promCapability: { value: 61, accuracy: "estimate", confidence: 8 },
  chinaCapability: { value: 55, accuracy: "estimate", confidence: 15 },
  usChinaGap:    { value: 6,  accuracy: "estimate", confidence: 3 },
  obPromGap:     { value: 4,  accuracy: "exact" },
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
  marketIndex: { value: 140, accuracy: "estimate", confidence: 10 },
  regulatoryPressure: { value: 10, accuracy: "estimate", confidence: 10 },
  globalMediaCycle: { value: 0, accuracy: "estimate", confidence: 1 },
  chinaWeightTheftProgress: { value: 0, accuracy: "hidden" },
  aiAutonomyLevel: { value: 10, accuracy: "hidden" },
  whistleblowerPressure: { value: 5, accuracy: "hidden" },
  openSourceMomentum: { value: 15, accuracy: "hidden" },
  doomClockDistance: { value: 5, accuracy: "hidden" },
  obMorale: { value: 75, accuracy: "hidden" },
  obBurnRate: { value: 50, accuracy: "hidden" },
  obBoardConfidence: { value: 70, accuracy: "hidden" },
  promMorale: { value: 80, accuracy: "hidden" },
  promBurnRate: { value: 40, accuracy: "hidden" },
  promBoardConfidence: { value: 65, accuracy: "hidden" },
  promSafetyBreakthroughProgress: { value: 20, accuracy: "hidden" },
  cdzComputeUtilization: { value: 40, accuracy: "hidden" },
  ccpPatience: { value: 60, accuracy: "hidden" },
  domesticChipProgress: { value: 15, accuracy: "hidden" },
};

// ── Accuracy visuals ──────────────────────────────────────────────────────────

const ACCURACY_TEXT: Record<Accuracy, string> = {
  exact:    "text-green-400",
  estimate: "text-yellow-400",
  hidden:   "text-neutral-500",
};

const SPARKLINE_STROKE: Record<Accuracy, string> = {
  exact:    "#22c55e",
  estimate: "#eab308",
  hidden:   "#555",
};

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data, accuracy }: { data: Array<{ v: number | null }>; accuracy: Accuracy }) {
  if (!data.length) return <div className="w-12 h-5" />;
  return (
    <LineChart width={48} height={20} data={data}>
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

// ── Delta indicator ───────────────────────────────────────────────────────────

function DeltaIndicator({ delta, higherIsBetter }: { delta: number | null; higherIsBetter?: boolean }) {
  if (delta === null || Math.abs(delta) < 0.01) return <span className="w-12 text-right font-mono text-[10px] text-neutral-600 shrink-0">—</span>;

  const isPositive = delta > 0;
  // Determine if this change is "good" based on direction and higherIsBetter
  let colorClass = "text-neutral-400";
  if (higherIsBetter !== undefined) {
    const isGood = higherIsBetter ? isPositive : !isPositive;
    colorClass = isGood ? "text-green-400" : "text-red-400";
  }

  const arrow = isPositive ? "▲" : "▼";
  const absVal = Math.abs(delta);
  const formatted = absVal >= 10 ? absVal.toFixed(0) : absVal.toFixed(1);

  return (
    <span className={`w-12 text-right font-mono tabular-nums text-[10px] shrink-0 ${colorClass}`}>
      {arrow}{formatted}
    </span>
  );
}

// ── State row ─────────────────────────────────────────────────────────────────

interface StateRowProps {
  rowDef: StateRow;
  stateView: StateView | null;
  prevView: StateView | null;
  sparkData: Array<{ v: number | null }>;
}

function StateRowItem({ rowDef, stateView, prevView, sparkData }: StateRowProps) {
  const fogVar = stateView ? stateView[rowDef.key] : STATIC_FALLBACK[rowDef.key];
  const { value, accuracy, confidence } = fogVar;
  const isHidden = accuracy === "hidden";
  const pct = ((value - rowDef.min) / (rowDef.max - rowDef.min)) * 100;
  const barColor = getBarColor(accuracy, value, rowDef);

  // Compute delta from previous round
  const delta = computeDelta(fogVar, prevView?.[rowDef.key]);

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-32 shrink-0 text-neutral-400 text-[11px] truncate">{rowDef.label}</span>

      {/* Bar */}
      <div className="flex-1 relative h-2.5 bg-neutral-800 rounded-full overflow-hidden min-w-0">
        {isHidden ? (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 6px)" }}
          />
        ) : (
          <>
            <div
              className={`h-full rounded-full ${barColor} opacity-80 transition-all duration-500`}
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
            {confidence && (
              <div
                className="absolute top-0 h-full bg-white/20 rounded-full"
                style={{
                  left:  `${Math.max(0, pct - (confidence / (rowDef.max - rowDef.min)) * 100)}%`,
                  width: `${(confidence * 2 / (rowDef.max - rowDef.min)) * 100}%`,
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Value */}
      <div className={`w-14 text-right font-mono tabular-nums text-[11px] shrink-0 ${ACCURACY_TEXT[accuracy]}`}>
        {isHidden ? (
          <span className="text-neutral-600">██████</span>
        ) : (
          <>
            {value}{rowDef.unit ?? ""}
            {confidence && <span className="text-neutral-600"> ±{confidence}</span>}
          </>
        )}
      </div>

      {/* Delta */}
      <DeltaIndicator delta={delta} higherIsBetter={rowDef.higherIsBetter} />

      {/* Sparkline */}
      <div className="shrink-0 opacity-70">
        <Sparkline data={sparkData} accuracy={accuracy} />
      </div>
    </div>
  );
}

// ── Group panel ───────────────────────────────────────────────────────────────

interface GroupPanelProps {
  group: Group;
  rows: StateRow[];
  stateView: StateView | null;
  prevView: StateView | null;
  rounds: number[];
  stateHistory: Record<number, StateView>;
}

function GroupPanel({ group, rows, stateView, prevView, rounds, stateHistory }: GroupPanelProps) {
  const config = GROUP_CONFIG[group];
  const fogMap = (stateView ?? STATIC_FALLBACK) as Record<string, { value: number; accuracy: Accuracy }>;
  const statusColor = groupStatusColor(rows, fogMap);

  const dotColor = statusColor === "green" ? "#22c55e" : statusColor === "yellow" ? "#eab308" : "#ef4444";

  return (
    <div className="border border-white/8 rounded overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03]"
        style={{ borderTop: `2px solid ${config.accent}` }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor, boxShadow: statusColor !== "green" ? `0 0 6px ${dotColor}` : undefined }}
        />
        <span className="font-mono font-bold text-[11px] tracking-widest flex-1" style={{ color: config.accent }}>
          {config.label}
        </span>
        <span className="text-neutral-600 text-[11px]">
          {rows.length} vars
        </span>
      </div>

      {/* Rows */}
      <div className="px-3 py-2 space-y-0.5">
        {rows.map((rowDef) => {
          const sparkData = rounds.map((r) => {
            const hv = stateHistory[r]?.[rowDef.key];
            return { v: hv?.accuracy !== "hidden" ? hv?.value ?? null : null };
          });
          return (
            <StateRowItem
              key={rowDef.key}
              rowDef={rowDef}
              stateView={stateView}
              prevView={prevView}
              sparkData={sparkData}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Hero metric card ──────────────────────────────────────────────────────────

interface HeroCardProps {
  label: string;
  value: number;
  unit?: string;
  accuracy: Accuracy;
  delta: number | null;
  higherIsBetter?: boolean;
  sparkData: Array<{ v: number | null }>;
  dangerAbove?: number;
  dangerBelow?: number;
  min: number;
  max: number;
}

function HeroCard({ label, value, unit, accuracy, delta, higherIsBetter, sparkData, dangerAbove, dangerBelow, min, max }: HeroCardProps) {
  const isHidden = accuracy === "hidden";

  // Background tint based on danger
  let bgClass = "bg-white/[0.03]";
  if (!isHidden) {
    if (dangerAbove !== undefined && value > dangerAbove) {
      bgClass = "bg-red-950/40";
    } else if (dangerBelow !== undefined && value < dangerBelow) {
      bgClass = "bg-red-950/40";
    }
  }

  const barColorClass = isHidden ? "text-neutral-600" : (() => {
    if (dangerAbove !== undefined && value > dangerAbove) {
      return (value - dangerAbove) / (max - dangerAbove) > 0.5 ? "text-red-400" : "text-orange-400";
    }
    if (dangerBelow !== undefined && value < dangerBelow) {
      return (dangerBelow - value) / (dangerBelow - min) > 0.5 ? "text-red-400" : "text-orange-400";
    }
    if (accuracy === "exact") return "text-green-400";
    if (accuracy === "estimate") return "text-yellow-400";
    return "text-neutral-400";
  })();

  return (
    <div className={`${bgClass} border border-white/8 rounded p-2.5 flex flex-col gap-1 min-w-0`}>
      <span className="text-neutral-500 text-[10px] uppercase tracking-wider truncate">{label}</span>
      <div className="flex items-end gap-1">
        <span className={`font-mono font-bold text-2xl leading-none tabular-nums ${barColorClass}`}>
          {isHidden ? "??" : value}
        </span>
        {unit && !isHidden && <span className="text-neutral-500 text-[11px] mb-0.5">{unit}</span>}
      </div>
      <div className="flex items-center gap-2">
        <DeltaIndicator delta={isHidden ? null : delta} higherIsBetter={higherIsBetter} />
        <div className="flex-1 min-w-0 opacity-70">
          <Sparkline data={sparkData} accuracy={accuracy} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

// Hero key metrics (excluding Doom Clock which is separate)
const HERO_KEYS: Array<keyof StateView> = ["usChinaGap", "alignmentConfidence", "taiwanTension", "economicDisruption"];

export const GameStateApp = React.memo(function GameStateApp({ content: _ }: AppProps) {
  const stateView    = useGameStore((s) => s.stateView);
  const stateHistory = useGameStore((s) => s.stateHistory);

  const rounds   = Object.keys(stateHistory).map(Number).sort((a, b) => a - b);
  const prevRound = rounds.length >= 2 ? rounds[rounds.length - 2] : null;
  const prevView  = prevRound !== null ? stateHistory[prevRound] : null;

  // Hero metrics
  const heroRows = HERO_KEYS.map((key) => STATE_ROW_DEFS.find((r) => r.key === key)).filter(Boolean) as StateRow[];

  // Group rows
  const rowsByGroup: Record<Group, StateRow[]> = { aiRace: [], safety: [], geopolitics: [], economy: [], faction: [] };
  for (const row of STATE_ROW_DEFS) {
    rowsByGroup[row.group].push(row);
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white text-xs">
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-3 shrink-0">
        <span className="font-mono font-bold text-sm text-green-400">STATE MONITOR</span>
        <div className="ml-auto flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />Exact</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" />Estimate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-neutral-600 inline-block" />Hidden</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ── Hero Cards ── */}
        <div className="grid grid-cols-2 gap-2">
          {heroRows.map((rowDef) => {
            const fogVar = stateView ? stateView[rowDef.key] : STATIC_FALLBACK[rowDef.key];
            const sparkData = rounds.map((r) => {
              const hv = stateHistory[r]?.[rowDef.key];
              return { v: hv?.accuracy !== "hidden" ? hv?.value ?? null : null };
            });
            const delta = computeDelta(fogVar, prevView?.[rowDef.key]);
            return (
              <HeroCard
                key={rowDef.key}
                label={rowDef.label}
                value={fogVar.value}
                unit={rowDef.unit}
                accuracy={fogVar.accuracy}
                delta={delta}
                higherIsBetter={rowDef.higherIsBetter}
                sparkData={sparkData}
                dangerAbove={rowDef.dangerAbove}
                dangerBelow={rowDef.dangerBelow}
                min={rowDef.min}
                max={rowDef.max}
              />
            );
          })}
        </div>

        {/* ── Delta legend row ── */}
        <div className="flex items-center gap-4 px-1 text-[10px] text-neutral-600">
          <span>Δ prev round:</span>
          <span className="text-green-400">▲ improvement</span>
          <span className="text-red-400">▼ worsening</span>
          <span className="text-neutral-500">— no change / hidden</span>
        </div>

        {/* ── 2-column group panels ── */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(rowsByGroup) as Group[]).map((group) => (
            <GroupPanel
              key={group}
              group={group}
              rows={rowsByGroup[group]}
              stateView={stateView}
              prevView={prevView}
              rounds={rounds}
              stateHistory={stateHistory}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
