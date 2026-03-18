import type { Faction } from "@takeoff/shared";

export const FACTION_LONG_NAMES: Record<Faction, string> = {
  openbrain: "OpenBrain",
  prometheus: "Prometheus",
  china: "China (DeepCent)",
  external: "External Stakeholders",
};

export const FACTION_SHORT_NAMES: Record<Faction, string> = {
  openbrain: "OpenBrain",
  prometheus: "Prometheus",
  china: "China",
  external: "External",
};

export const FACTION_PREFIX: Record<Faction, string> = {
  openbrain: "OB",
  prometheus: "Prom",
  china: "China",
  external: "Ext",
};

export const FACTION_COLORS: Record<Faction, string> = {
  openbrain: "var(--color-faction-openbrain)",
  prometheus: "var(--color-faction-prometheus)",
  china: "var(--color-faction-china)",
  external: "var(--color-faction-external)",
};

// Faction descriptions from DESIGN.md section 3 — Identity column
export const FACTION_IDENTITIES: Record<Faction, string> = {
  openbrain: "Capabilities-first. Moves fast, ships product, worries about safety later. Slight model lead, deep government ties.",
  prometheus: "Safety-first. Invests heavily in alignment and interpretability. Principled but behind in the race.",
  china: "The open-source dark horse. Stolen weights + massive state compute. Commoditize the model layer, win on deployment.",
  external: "Influence without control — government officials, VCs, journalists, diplomats shaping the environment.",
};

interface FactionTheme {
  cardBorder: string;
  cardBorderSelected: string;
  cardBg: string;
  headerText: string;
  countBg: string;
  countText: string;
  dot: string;
  roleSelectedBg: string;
  roleHover: string;
  badgeBg: string;
  badgeText: string;
}

export const FACTION_THEMES: Record<Faction, FactionTheme> = {
  openbrain: {
    cardBorder: "border-blue-900/50",
    cardBorderSelected: "border-blue-500",
    cardBg: "bg-blue-950/10",
    headerText: "text-blue-300",
    countBg: "bg-blue-900/40",
    countText: "text-blue-300",
    dot: "bg-blue-400",
    roleSelectedBg: "bg-blue-600 text-white",
    roleHover: "hover:bg-blue-900/25",
    badgeBg: "bg-blue-900/30",
    badgeText: "text-blue-400",
  },
  prometheus: {
    cardBorder: "border-green-900/50",
    cardBorderSelected: "border-green-500",
    cardBg: "bg-green-950/10",
    headerText: "text-green-300",
    countBg: "bg-green-900/40",
    countText: "text-green-300",
    dot: "bg-green-400",
    roleSelectedBg: "bg-green-600 text-white",
    roleHover: "hover:bg-green-900/25",
    badgeBg: "bg-green-900/30",
    badgeText: "text-green-400",
  },
  china: {
    cardBorder: "border-red-900/50",
    cardBorderSelected: "border-red-500",
    cardBg: "bg-red-950/10",
    headerText: "text-red-300",
    countBg: "bg-red-900/40",
    countText: "text-red-300",
    dot: "bg-red-400",
    roleSelectedBg: "bg-red-600 text-white",
    roleHover: "hover:bg-red-900/25",
    badgeBg: "bg-red-900/30",
    badgeText: "text-red-400",
  },
  external: {
    cardBorder: "border-amber-900/50",
    cardBorderSelected: "border-amber-500",
    cardBg: "bg-amber-950/10",
    headerText: "text-amber-300",
    countBg: "bg-amber-900/40",
    countText: "text-amber-300",
    dot: "bg-amber-400",
    roleSelectedBg: "bg-amber-600 text-white",
    roleHover: "hover:bg-amber-900/25",
    badgeBg: "bg-amber-900/30",
    badgeText: "text-amber-400",
  },
};

