import type { NpcTrigger } from "@takeoff/shared";

/**
 * Round 1 NPC triggers — Q4 2026, "The Quiet Race"
 *
 * Narrative context: OpenBrain has Agent-1 internally. China's CDZ Phase 2 is coming online.
 * The public is unaware. NSC is watching. The weight-theft window is opening.
 *
 * Variables covered:
 *   - chinaWeightTheftProgress: China's progress toward exfiltrating US lab model weights
 *   - ccpPatience: CCP's patience with the pace of progress (low = impatient, reckless)
 *   - publicAwareness: How much the public understands what's actually being built (low = dark)
 */
export const ROUND1_NPC_TRIGGERS: NpcTrigger[] = [
  // ── chinaWeightTheftProgress thresholds ──

  {
    id: "npc_r1_weight_probe_detected",
    npcId: "__npc_anon__",
    content:
      "Seeing patterns in the traffic logs that don't fit normal research activity. " +
      "Someone is mapping the storage topology. Systematically. This isn't curiosity.",
    condition: { variable: "chinaWeightTheftProgress", operator: "gte", value: 35 },
    target: { role: "ext_nsa" },
  },

  {
    id: "npc_r1_weight_theft_imminent",
    npcId: "__npc_anon__",
    content:
      "They have a foothold. I don't know how deep, but they're past reconnaissance. " +
      "If your security isn't at SL3 right now, treat it as already compromised.",
    condition: { variable: "chinaWeightTheftProgress", operator: "gte", value: 60 },
    target: { role: "ob_security" },
  },

  // ── ccpPatience thresholds ──

  {
    id: "npc_r1_ccp_pressure_building",
    npcId: "__npc_insider__",
    content:
      "Reading Beijing's signals differently than I was a week ago. " +
      "The diplomatic restraint is performative now. There's pressure from above their research teams. " +
      "Someone there has a timeline and it's not measured in years.",
    condition: { variable: "ccpPatience", operator: "lte", value: 40 },
    target: { faction: "external" },
  },

  {
    id: "npc_r1_ccp_dangerous_impatience",
    npcId: "__npc_insider__",
    content:
      "Chinese embassy staff are being recalled for briefings. Third time this month. " +
      "Whatever they're being told, it's making people nervous over here. " +
      "Something is about to move.",
    condition: { variable: "ccpPatience", operator: "lte", value: 25 },
    target: { faction: "prometheus" },
  },

  // ── publicAwareness thresholds ──

  {
    id: "npc_r1_public_darkness_tip",
    npcId: "__npc_anon__",
    content:
      "You want a story? Look at the eval suite. Three tests were marked 'skipped' due to compute budget. " +
      "Those tests exist because someone thought they needed to exist. Ask yourself why they stopped running them.",
    condition: { variable: "publicAwareness", operator: "lte", value: 25 },
    target: { role: "ext_journalist" },
  },

  {
    id: "npc_r1_public_scrutiny_warning",
    npcId: "__npc_insider__",
    content:
      "Senate staffers are Googling your name. That Substack post circulated in three offices this morning. " +
      "The silence strategy has a shelf life. I'd recommend deciding what you want the narrative to be " +
      "before someone else decides it for you.",
    condition: { variable: "publicAwareness", operator: "gte", value: 50 },
    target: { role: "ob_ceo" },
  },

  // ── Schedule-based narrative triggers ──

  {
    id: "npc_r1_anon_ob_intel",
    npcId: "__npc_anon__",
    content:
      "Heads up: internal safety reports at OpenBrain are being quietly shelved. The pressure to ship is overwhelming the process. Watch what you sign off on.",
    schedule: { round: 1, phase: "intel" },
    target: { faction: "openbrain" },
  },

  {
    id: "npc_r1_insider_external_deliberation",
    npcId: "__npc_insider__",
    content:
      "The Senate Intel Committee has OpenBrain on their radar. If anything controversial surfaces this quarter, expect subpoenas. Whatever you're planning — tread carefully.",
    schedule: { round: 1, phase: "deliberation" },
    target: { faction: "external" },
  },
];
