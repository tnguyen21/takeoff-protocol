import type { NpcPersona } from "@takeoff/shared";

// ── Persona Definitions ───────────────────────────────────────────────────────

export const NPC_PERSONAS: NpcPersona[] = [
  {
    id: "__npc_anon__",
    name: "Anonymous Source",
    subtitle: "encrypted channel",
    avatarColor: "bg-red-700",
    factions: ["openbrain", "prometheus", "china", "external"],
  },
  {
    id: "__npc_insider__",
    name: "Policy Insider",
    subtitle: "DC source",
    avatarColor: "bg-purple-700",
    factions: ["openbrain", "prometheus", "china", "external"],
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

  // ── Personal ───────────────────────────────────────────────────────────────
  // Keep as fallback for any future triggers without a specific persona.

  {
    id: "__npc_personal__",
    name: "Personal",
    subtitle: "· personal",
    avatarColor: "bg-neutral-500",
    factions: ["openbrain", "prometheus", "china", "external"],
  },

  // ── Family ─────────────────────────────────────────────────────────────────

  {
    id: "__npc_spouse__",
    name: "Wife",
    subtitle: "· personal",
    avatarColor: "bg-pink-700",
    factions: ["openbrain", "prometheus", "china", "external"],
  },
  {
    id: "__npc_mom__",
    name: "Mom",
    subtitle: "· personal",
    avatarColor: "bg-rose-600",
    factions: ["openbrain", "prometheus", "china", "external"],
  },
  {
    id: "__npc_dad__",
    name: "Dad",
    subtitle: "· personal",
    avatarColor: "bg-blue-600",
    factions: ["external"],
  },
  {
    id: "__npc_brother__",
    name: "Brother",
    subtitle: "· personal",
    avatarColor: "bg-cyan-700",
    factions: ["openbrain", "external"],
  },
  {
    id: "__npc_sister__",
    name: "Sister",
    subtitle: "· personal",
    avatarColor: "bg-fuchsia-700",
    factions: ["openbrain", "prometheus"],
  },
  {
    id: "__npc_kid__",
    name: "Mei",
    subtitle: "· personal",
    avatarColor: "bg-yellow-600",
    factions: ["china"],
  },
  {
    id: "__npc_advisor__",
    name: "Prof. Chen",
    subtitle: "· advisor",
    avatarColor: "bg-violet-700",
    factions: ["prometheus"],
  },
  {
    id: "__npc_college_friend__",
    name: "Dan",
    subtitle: "· personal",
    avatarColor: "bg-teal-600",
    factions: ["openbrain", "prometheus", "china", "external"],
  },
  {
    id: "__npc_roommate__",
    name: "Mike",
    subtitle: "· home",
    avatarColor: "bg-lime-700",
    factions: ["prometheus"],
  },
  {
    id: "__npc_editor__",
    name: "Rachel",
    subtitle: "· work",
    avatarColor: "bg-orange-600",
    factions: ["external"],
  },

  // ── Delivery ────────────────────────────────────────────────────────────────

  {
    id: "__npc_amazon__",
    name: "Amazon Delivery",
    subtitle: "· delivery",
    avatarColor: "bg-amber-600",
    factions: ["openbrain", "prometheus", "china", "external"],
  },
  {
    id: "__npc_doordash__",
    name: "692-847",
    subtitle: "· delivery",
    avatarColor: "bg-red-600",
    factions: ["external"],
  },

  // ── Notifications ────────────────────────────────────────────────────────────

  {
    id: "__npc_school__",
    name: "Meadowbrook Elementary",
    subtitle: "· notification",
    avatarColor: "bg-green-600",
    factions: ["prometheus"],
  },
  {
    id: "__npc_library__",
    name: "Stanford Library",
    subtitle: "· notification",
    avatarColor: "bg-indigo-600",
    factions: ["prometheus"],
  },
  {
    id: "__npc_linkedin__",
    name: "LinkedIn",
    subtitle: "· notification",
    avatarColor: "bg-blue-800",
    factions: ["external"],
  },
  {
    id: "__npc_discord__",
    name: "Discord",
    subtitle: "· notification",
    avatarColor: "bg-violet-800",
    factions: ["china"],
  },
  {
    id: "__npc_comrades__",
    name: "Old Comrades Group",
    subtitle: "· WeChat",
    avatarColor: "bg-red-900",
    factions: ["china"],
  },
  {
    id: "__npc_hackernews__",
    name: "Hacker News",
    subtitle: "· notification",
    avatarColor: "bg-orange-700",
    factions: ["prometheus"],
  },
  {
    id: "__npc_recall__",
    name: "Cuisinart",
    subtitle: "· notification",
    avatarColor: "bg-slate-500",
    factions: ["openbrain"],
  },
  {
    id: "__npc_gym__",
    name: "Barry's Bootcamp",
    subtitle: "· notification",
    avatarColor: "bg-red-700",
    factions: ["openbrain"],
  },
  {
    id: "__npc_dentist__",
    name: "Castro Dental",
    subtitle: "· notification",
    avatarColor: "bg-sky-600",
    factions: ["external"],
  },
  {
    id: "__npc_auto_service__",
    name: "Tesla Service",
    subtitle: "· notification",
    avatarColor: "bg-zinc-600",
    factions: ["external"],
  },
  {
    id: "__npc_facilities__",
    name: "Facilities",
    subtitle: "· internal",
    avatarColor: "bg-stone-600",
    factions: ["external"],
  },
  {
    id: "__npc_defcon__",
    name: "DEF CON",
    subtitle: "· notification",
    avatarColor: "bg-green-800",
    factions: ["openbrain"],
  },
  {
    id: "__npc_drycleaner__",
    name: "Martinizing",
    subtitle: "· notification",
    avatarColor: "bg-sky-700",
    factions: ["prometheus"],
  },
  {
    id: "__npc_bikeshop__",
    name: "Volta Cycles",
    subtitle: "· notification",
    avatarColor: "bg-emerald-600",
    factions: ["prometheus"],
  },
  {
    id: "__npc_logistics__",
    name: "后勤保障部",
    subtitle: "· internal",
    avatarColor: "bg-stone-700",
    factions: ["china"],
  },
  {
    id: "__npc_venmo__",
    name: "Venmo",
    subtitle: "· notification",
    avatarColor: "bg-blue-700",
    factions: ["openbrain", "prometheus", "china", "external"],
  },
  {
    id: "__npc_fantasy__",
    name: "Fantasy Football",
    subtitle: "· notification",
    avatarColor: "bg-green-700",
    factions: ["openbrain"],
  },
  {
    id: "__npc_alumni_chat__",
    name: "Dartmouth '09",
    subtitle: "· group chat",
    avatarColor: "bg-emerald-800",
    factions: ["external"],
  },
  {
    id: "__npc_groupchat__",
    name: "Williams '08",
    subtitle: "· group chat",
    avatarColor: "bg-purple-700",
    factions: ["external"],
  },
  {
    id: "__npc_wechat_classmates__",
    name: "同学群",
    subtitle: "· WeChat",
    avatarColor: "bg-green-900",
    factions: ["china"],
  },
  {
    id: "__npc_landlord__",
    name: "Building Mgmt",
    subtitle: "· notification",
    avatarColor: "bg-neutral-600",
    factions: ["openbrain"],
  },
  {
    id: "__npc_petco__",
    name: "Petco",
    subtitle: "· notification",
    avatarColor: "bg-blue-500",
    factions: ["prometheus"],
  },

  // ── Spam ───────────────────────────────────────────────────────────────────

  {
    id: "__npc_spam_loan__",
    name: "833-291-0472",
    subtitle: "",
    avatarColor: "bg-gray-500",
    factions: ["openbrain", "prometheus", "external"],
  },
  {
    id: "__npc_spam_insurance__",
    name: "877-914-6233",
    subtitle: "",
    avatarColor: "bg-gray-400",
    factions: ["openbrain", "prometheus", "external"],
  },
  {
    id: "__npc_spam_political__",
    name: "202-555-0178",
    subtitle: "",
    avatarColor: "bg-gray-500",
    factions: ["openbrain", "prometheus", "external"],
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

const NPC_PERSONA_BY_ID: Map<string, NpcPersona> = new Map(NPC_PERSONAS.map((p) => [p.id, p]));

/** Returns the NpcPersona for the given id, or undefined if not found. */
export function getNpcPersona(id: string): NpcPersona | undefined {
  return NPC_PERSONA_BY_ID.get(id);
}
