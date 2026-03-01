import React, { useState } from "react";
import type { AppProps } from "./types.js";
import type { Faction, StateView } from "@takeoff/shared";
import { useGameStore } from "../stores/game.js";
import { formatFogValue, accuracyColor } from "./briefingUtils.js";

// ── Faction theme ──────────────────────────────────────────────────────────────

const FACTION_THEME: Record<string, {
  topBorder: string;
  accent: string;
  bannerBg: string;
  bannerText: string;
  banner: string;
  sectionBorder: string;
}> = {
  openbrain: {
    topBorder: "border-t-4 border-blue-600",
    accent: "text-blue-300",
    bannerBg: "bg-blue-950/60 border-b border-blue-800",
    bannerText: "text-blue-300",
    banner: "OPENBRAIN INTERNAL — EYES ONLY",
    sectionBorder: "border-blue-900/30",
  },
  prometheus: {
    topBorder: "border-t-4 border-orange-500",
    accent: "text-orange-300",
    bannerBg: "bg-orange-950/60 border-b border-orange-800",
    bannerText: "text-orange-300",
    banner: "PROMETHEUS LABS INTERNAL — RESTRICTED",
    sectionBorder: "border-orange-900/30",
  },
  china: {
    topBorder: "border-t-4 border-red-600",
    accent: "text-red-300",
    bannerBg: "bg-red-950/60 border-b border-red-800",
    bannerText: "text-red-300",
    banner: "中国人工智能局 — INTERNAL USE ONLY",
    sectionBorder: "border-red-900/30",
  },
};

const DEFAULT_THEME = {
  topBorder: "border-t-4 border-purple-700",
  accent: "text-purple-300",
  bannerBg: "bg-purple-950/60 border-b border-purple-800",
  bannerText: "text-purple-300",
  banner: "SITUATION BRIEFING — CONFIDENTIAL",
  sectionBorder: "border-purple-900/30",
};

function getTheme(faction: Faction | null) {
  return (faction && FACTION_THEME[faction]) ?? DEFAULT_THEME;
}

// ── State variable groups ──────────────────────────────────────────────────────

const STATE_GROUPS: Array<{
  label: string;
  vars: Array<{ label: string; key: keyof StateView }>;
}> = [
  {
    label: "AI Race",
    vars: [
      { label: "OB Capability", key: "obCapability" },
      { label: "Prom Capability", key: "promCapability" },
      { label: "China Capability", key: "chinaCapability" },
      { label: "OB–Prom Gap", key: "obPromGap" },
      { label: "US–China Gap", key: "usChinaGap" },
    ],
  },
  {
    label: "Safety",
    vars: [
      { label: "Alignment Confidence", key: "alignmentConfidence" },
      { label: "Misalignment Severity", key: "misalignmentSeverity" },
      { label: "Security Level OB", key: "securityLevelOB" },
    ],
  },
  {
    label: "Geopolitics",
    vars: [
      { label: "Taiwan Tension", key: "taiwanTension" },
      { label: "Intl Cooperation", key: "intlCooperation" },
    ],
  },
  {
    label: "Economy & Public",
    vars: [
      { label: "Public Awareness", key: "publicAwareness" },
      { label: "Economic Disruption", key: "economicDisruption" },
      { label: "Market Index", key: "marketIndex" },
      { label: "Regulatory Pressure", key: "regulatoryPressure" },
    ],
  },
];

// ── Collapsible section wrapper ────────────────────────────────────────────────

function CollapsibleSection({
  title,
  accentClass,
  borderClass,
  defaultOpen = true,
  children,
}: {
  title: string;
  accentClass: string;
  borderClass: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-[#1a1a2e] rounded-lg border ${borderClass} overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
      >
        <h2 className={`font-semibold text-sm ${accentClass}`}>{title}</h2>
        <span className="text-neutral-600 text-xs select-none">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const BriefingApp = React.memo(function BriefingApp({ content }: AppProps) {
  const round = useGameStore((s) => s.round);
  const stateView = useGameStore((s) => s.stateView);
  const selectedFaction = useGameStore((s) => s.selectedFaction);

  const theme = getTheme(selectedFaction);

  // Pick briefing/overview text from content prop (memo or document items)
  const overviewItems = content.filter((i) => i.type === "memo" || i.type === "document");
  const hasContentOverview = overviewItems.length > 0;

  return (
    <div className={`flex flex-col h-full bg-[#12121e] text-white overflow-y-auto ${theme.topBorder}`}>
      {/* Faction banner */}
      <div className={`px-4 py-1 shrink-0 ${theme.bannerBg}`}>
        <span className={`text-[10px] font-bold tracking-widest uppercase ${theme.bannerText}`}>
          {theme.banner}
        </span>
      </div>

      {/* Header */}
      <div className="bg-[#1e1e3a] border-b border-purple-900/50 px-6 py-4 shrink-0">
        <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${theme.accent}`}>
          Round {round || 1} — Briefing Phase
        </div>
        <h1 className="text-xl font-bold text-white">Situation Briefing</h1>
        <p className="text-neutral-400 text-xs mt-1">Read carefully. This context shapes your strategic environment.</p>
      </div>

      <div className="p-6 space-y-4 max-w-2xl">
        {/* Scenario overview */}
        <CollapsibleSection title="Scenario Overview" accentClass={theme.accent} borderClass={theme.sectionBorder}>
          {hasContentOverview ? (
            <div className="space-y-3">
              {overviewItems.map((item) => (
                <div key={item.id}>
                  {item.subject && (
                    <p className={`text-xs font-semibold mb-1 ${theme.accent}`}>{item.subject}</p>
                  )}
                  <p className="text-neutral-300 text-xs leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-300 text-xs leading-relaxed">
              It is February 2026. Three AI labs — OpenBrain, Prometheus Labs, and a Chinese state-backed
              program — are in a race to deploy the world's first transformatively capable AI system. Each
              has reached Agent-3 capability levels. The gap between labs is measured in months, not years.
              Governments, investors, and the public are watching. The decisions made in the next 72 hours
              will determine whether advanced AI deployment is safe, controlled, or catastrophic.
            </p>
          )}
        </CollapsibleSection>

        {/* Faction objectives */}
        <CollapsibleSection title="Your Objectives" accentClass={theme.accent} borderClass={theme.sectionBorder}>
          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex gap-2">
              <span className={`shrink-0 ${theme.accent}`}>Primary:</span>
              <span>Deploy a capable AI system that advances your organization's goals without triggering catastrophic outcomes.</span>
            </div>
            <div className="flex gap-2">
              <span className={`shrink-0 ${theme.accent}`}>Secondary:</span>
              <span>Maintain organizational cohesion, manage external relationships, and influence the regulatory environment.</span>
            </div>
            <div className="flex gap-2">
              <span className={`shrink-0 ${theme.accent}`}>Hidden:</span>
              <span className="text-neutral-600 italic">Revealed as game progresses.</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* State variable groups */}
        {STATE_GROUPS.map((group) => (
          <CollapsibleSection
            key={group.label}
            title={group.label}
            accentClass={theme.accent}
            borderClass={theme.sectionBorder}
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              {group.vars.map(({ label, key }) => {
                const fogVar = stateView?.[key];
                const displayValue = fogVar ? formatFogValue(fogVar, key) : "—";
                const valueColor = fogVar ? accuracyColor(fogVar) : "text-neutral-500";
                const isClassified = fogVar?.accuracy === "hidden";

                return (
                  <div
                    key={key}
                    className="flex justify-between border border-white/10 rounded px-2 py-1.5 gap-2"
                  >
                    <span className="text-neutral-500 truncate">{label}</span>
                    <span
                      className={`font-mono shrink-0 tabular-nums ${isClassified ? "text-neutral-600 italic text-[10px]" : valueColor}`}
                    >
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        ))}

        {/* Timer reminder */}
        <div className="text-center text-xs text-neutral-600">
          The deliberation phase begins when the GM advances the round.
        </div>
      </div>
    </div>
  );
});
