import type { NpcPersona } from "@takeoff/shared";

// ── Persona Definitions ───────────────────────────────────────────────────────

export const NPC_PERSONAS: NpcPersona[] = [
  // ── Cross-Faction ──────────────────────────────────────────────────────────

  {
    id: "__npc_personal__",
    name: "Personal",
    subtitle: "personal",
    avatarColor: "bg-neutral-500",
    factions: ["openbrain", "prometheus", "china", "external"],
  },
  {
    id: "__npc_anon__",
    name: "Anonymous Source",
    subtitle: "encrypted channel",
    avatarColor: "bg-red-700",
    factions: ["openbrain", "prometheus", "external"],
  },
  {
    id: "__npc_insider__",
    name: "Policy Insider",
    subtitle: "DC source",
    avatarColor: "bg-purple-700",
    factions: ["openbrain", "prometheus", "external"],
  },

  // ── OpenBrain ──────────────────────────────────────────────────────────────

  {
    id: "__npc_ob_engineer__",
    name: "Worried Engineer",
    subtitle: "#research",
    avatarColor: "bg-emerald-700",
    factions: ["openbrain"],
  },
  {
    id: "__npc_ob_board__",
    name: "Board Member",
    subtitle: "OpenBrain Board",
    avatarColor: "bg-amber-700",
    factions: ["openbrain"],
  },
  {
    id: "__npc_ob_security__",
    name: "Security Vendor",
    subtitle: "external consultant",
    avatarColor: "bg-slate-600",
    factions: ["openbrain"],
  },

  // ── Prometheus ─────────────────────────────────────────────────────────────

  {
    id: "__npc_prom_researcher__",
    name: "Safety Researcher",
    subtitle: "#safety-research",
    avatarColor: "bg-blue-700",
    factions: ["prometheus"],
  },
  {
    id: "__npc_prom_os__",
    name: "OS Contributor",
    subtitle: "GitHub contributor",
    avatarColor: "bg-green-700",
    factions: ["prometheus"],
  },

  // ── China ──────────────────────────────────────────────────────────────────

  {
    id: "__npc_china_liaison__",
    name: "Party Liaison",
    subtitle: "Ministry of Science",
    avatarColor: "bg-red-800",
    factions: ["china"],
  },
  {
    id: "__npc_china_engineer__",
    name: "DeepCent Engineer",
    subtitle: "CDZ Operations",
    avatarColor: "bg-orange-700",
    factions: ["china"],
  },

  // ── External ───────────────────────────────────────────────────────────────

  {
    id: "__npc_intel_analyst__",
    name: "Intel Analyst",
    subtitle: "NSA",
    avatarColor: "bg-indigo-700",
    factions: ["external"],
  },
  {
    id: "__npc_portfolio_ceo__",
    name: "Portfolio CEO",
    subtitle: "portfolio company",
    avatarColor: "bg-teal-700",
    factions: ["external"],
  },
  {
    id: "__npc_whistleblower__",
    name: "Whistleblower",
    subtitle: "anonymous",
    avatarColor: "bg-rose-700",
    factions: ["external"],
  },
];

// ── Lookups ───────────────────────────────────────────────────────────────────

/** Set of all persona IDs for fast membership checks. */
export const NPC_IDS: Set<string> = new Set(NPC_PERSONAS.map((p) => p.id));

/** Returns the NpcPersona for the given id, or undefined if not found. */
export function getNpcPersona(id: string): NpcPersona | undefined {
  return NPC_PERSONAS.find((p) => p.id === id);
}
