import type { NpcTrigger } from "@takeoff/shared";
import { ROUND1_NPC_TRIGGERS } from "./round1.js";
import { ROUND2_NPC_TRIGGERS } from "./round2.js";
import { CONDITIONAL_NPC_TRIGGERS } from "./conditional.js";
import { PERSONAL_NPC_TRIGGERS } from "./personal.js";

export { ROUND1_NPC_TRIGGERS } from "./round1.js";
export { ROUND2_NPC_TRIGGERS } from "./round2.js";
export { CONDITIONAL_NPC_TRIGGERS } from "./conditional.js";
export { PERSONAL_NPC_TRIGGERS } from "./personal.js";

// ── Round 3 NPC Triggers ──────────────────────────────────────────────────────

const ROUND3_NPC_TRIGGERS: NpcTrigger[] = [
  {
    id: "npc_r3_ob_engineer_morale",
    npcId: "__npc_ob_engineer__",
    content:
      "The safety team is burning out. Half of us are updating our resumes. If leadership doesn't change course this round, you're going to lose the people who actually understand what's being built here.",
    condition: { variable: "obMorale", operator: "lte", value: 40 },
    target: { faction: "openbrain" },
  },
  {
    id: "npc_r3_anon_whistleblower_pressure",
    npcId: "__npc_anon__",
    content:
      "There are people inside ready to go public. The pressure cooker is near its limit. A coordinated leak could break at any time — factor that into whatever you decide this round.",
    condition: { variable: "whistleblowerPressure", operator: "gte", value: 60 },
    target: { faction: "openbrain" },
  },
  {
    id: "npc_r3_insider_regulatory_surge",
    npcId: "__npc_insider__",
    content:
      "Regulatory momentum is building in a way I haven't seen since GDPR. If the labs don't offer something credible this round, Congress will move on its own timeline — and it won't be pretty.",
    condition: { variable: "regulatoryPressure", operator: "gte", value: 55 },
    target: { faction: "external" },
  },
];

// ── Round 4 NPC Triggers ──────────────────────────────────────────────────────

const ROUND4_NPC_TRIGGERS: NpcTrigger[] = [
  {
    id: "npc_r4_anon_ob_crisis",
    npcId: "__npc_anon__",
    content:
      "This is it. Everything you've been quietly dreading is now on the table. I don't know how much longer the situation can hold together. Whatever you're going to do — do it now.",
    schedule: { round: 4, phase: "briefing" },
    target: { faction: "openbrain" },
  },
  {
    id: "npc_r4_insider_taiwan",
    npcId: "__npc_insider__",
    content:
      "The NSC had an emergency session last night. Taiwan Strait activity is at levels not seen since 1996. The military options being discussed behind closed doors would surprise you.",
    condition: { variable: "taiwanTension", operator: "gte", value: 70 },
    target: { faction: "external" },
  },
  {
    id: "npc_r4_anon_doom_clock",
    npcId: "__npc_anon__",
    content:
      "The people who understand what's actually being built are terrified. Not publicly — they can't be. But privately, the mood has shifted. Something has changed in the last few weeks.",
    condition: { variable: "doomClockDistance", operator: "lte", value: 3 },
    target: { faction: "openbrain" },
  },
];

// ── Round 5 NPC Triggers ──────────────────────────────────────────────────────

const ROUND5_NPC_TRIGGERS: NpcTrigger[] = [
  {
    id: "npc_r5_anon_ob_finale",
    npcId: "__npc_anon__",
    content:
      "Whatever happens next, I want you to know: the choices made in these rooms mattered. The history being written right now will define everything that comes after. No pressure.",
    schedule: { round: 5, phase: "deliberation" },
    target: { faction: "openbrain" },
  },
  {
    id: "npc_r5_insider_external_finale",
    npcId: "__npc_insider__",
    content:
      "The President is being briefed daily now. Decision-makers at the highest levels are watching. This is your last real window to shape the outcome before events take over.",
    schedule: { round: 5, phase: "deliberation" },
    target: { faction: "external" },
  },
  {
    id: "npc_r5_anon_prom_finale",
    npcId: "__npc_anon__",
    content:
      "You're almost at the end. The work Prometheus did on alignment either mattered or it didn't — we're about to find out. Make this last round count.",
    schedule: { round: 5, phase: "deliberation" },
    target: { faction: "prometheus" },
  },
];

// ── Index ─────────────────────────────────────────────────────────────────────

/** All NPC triggers indexed by round number. */
const NPC_TRIGGERS_BY_ROUND: Record<number, NpcTrigger[]> = {
  1: ROUND1_NPC_TRIGGERS,
  2: ROUND2_NPC_TRIGGERS,
  3: ROUND3_NPC_TRIGGERS,
  4: ROUND4_NPC_TRIGGERS,
  5: ROUND5_NPC_TRIGGERS,
};

/**
 * Returns NPC triggers active for the given round.
 *
 * Merges three sources:
 * - Round-specific triggers (keyed by round number)
 * - Conditional triggers filtered by their `rounds` range (or always-active if omitted)
 * - Personal triggers filtered by their `rounds` range or `schedule.round`
 *
 * INV: Every returned trigger has a non-empty `id`, `npcId`, and `content`.
 */
export function getNpcTriggersForRound(round: number): NpcTrigger[] {
  const roundSpecific = NPC_TRIGGERS_BY_ROUND[round] ?? [];
  const conditional = CONDITIONAL_NPC_TRIGGERS.filter((t) => {
    if (!t.rounds) return true;
    return round >= t.rounds[0] && round <= t.rounds[1];
  });
  const personal = PERSONAL_NPC_TRIGGERS.filter((t) => {
    if (t.rounds) return round >= t.rounds[0] && round <= t.rounds[1];
    if (t.schedule) return t.schedule.round === round;
    return true;
  });
  return [...roundSpecific, ...conditional, ...personal];
}
