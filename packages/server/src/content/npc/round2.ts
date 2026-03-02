import type { NpcTrigger } from "@takeoff/shared";

/**
 * Round 2 NPC triggers — Q1 2027, "The Superhuman Coder"
 *
 * Narrative context: OpenBrain's Agent-3 is a 5x R&D multiplier. The gap is accelerating.
 * Prometheus is under board pressure. China has closed ground. The alignment anomalies
 * in Agent-3's eval suite are logged but not public. The whistleblower clock is ticking.
 *
 * Variables covered:
 *   - whistleblowerPressure: Internal pressure at OB to go external with safety concerns
 *   - obBoardConfidence: OpenBrain board's confidence in leadership (low = fracturing)
 *   - alignmentConfidence: Field-wide confidence in alignment evals (low = crisis territory)
 *   - openSourceMomentum: Adoption of open-source AI (high = proliferation, regulatory risk)
 */
export const ROUND2_NPC_TRIGGERS: NpcTrigger[] = [
  // ── whistleblowerPressure thresholds ──

  {
    id: "npc_r2_whistleblower_tip_escalating",
    npcId: "__npc_anon__",
    content:
      "Still here. What I told you before — it's worse now. " +
      "The anomalies they flagged in the eval report are not measurement variance. " +
      "Someone inside knows. They've been told to wait. They won't wait much longer.",
    condition: { variable: "whistleblowerPressure", operator: "gte", value: 55 },
    target: { role: "ext_journalist" },
  },

  {
    id: "npc_r2_internal_warning_imminent_leak",
    npcId: "__npc_ob_internal__",
    content:
      "Maya is past the point of internal process. She's not threatening — she's informing. " +
      "I've seen her draft. If the board doesn't respond by end of week, something goes external. " +
      "You need to get in front of this today.",
    condition: { variable: "whistleblowerPressure", operator: "gte", value: 72 },
    target: { role: "ob_ceo" },
  },

  // ── obBoardConfidence thresholds ──

  {
    id: "npc_r2_board_fracture_signal",
    npcId: "__npc_insider__",
    content:
      "Someone on the OpenBrain board is talking to Hill staff. Off the record, but I heard it. " +
      "When board members go looking for allies in DC, it means they've stopped trusting the CEO. " +
      "That's not a leak — that's a fracture.",
    condition: { variable: "obBoardConfidence", operator: "lte", value: 42 },
    target: { role: "ob_ceo" },
  },

  // ── alignmentConfidence thresholds ──

  {
    id: "npc_r2_alignment_anomaly_signal",
    npcId: "__npc_anon__",
    content:
      "Task 17. Run it yourself. The corrigibility probe at high capability load. " +
      "Don't use the internal eval harness — they've added a preprocessing step. " +
      "Run it clean. Tell me what you get.",
    condition: { variable: "alignmentConfidence", operator: "lte", value: 38 },
    target: { role: "prom_scientist" },
  },

  {
    id: "npc_r2_alignment_suppression_warning",
    npcId: "__npc_ob_internal__",
    content:
      "The Wednesday safety meeting was rescheduled. Again. " +
      "The anomalous results from tasks 17 and 23 are not in the board summary. " +
      "I know because I wrote the original summary and I just saw the version they sent up.",
    condition: { variable: "alignmentConfidence", operator: "lte", value: 50 },
    target: { role: "ob_safety" },
  },

  // ── openSourceMomentum thresholds ──

  {
    id: "npc_r2_opensource_regulatory_crossfire",
    npcId: "__npc_insider__",
    content:
      "Commerce is drafting export rules that don't distinguish between commercial labs and open weights. " +
      "Prometheus is going to get caught in this even if the rule is aimed at China. " +
      "You have maybe three weeks to get your people in the room before the language is locked.",
    condition: { variable: "openSourceMomentum", operator: "gte", value: 55 },
    target: { role: "prom_policy" },
  },

  // ── Schedule-based and cross-faction narrative triggers ──

  {
    id: "npc_r2_anon_alignment_warning",
    npcId: "__npc_anon__",
    content:
      "I've seen the internal evals. The published alignment numbers don't match what we're seeing internally. Someone needs to pump the brakes before this gets away from everyone.",
    condition: { variable: "alignmentConfidence", operator: "lte", value: 50 },
    target: { faction: "openbrain" },
  },

  {
    id: "npc_r2_insider_china_gap",
    npcId: "__npc_insider__",
    content:
      "Beijing is moving faster than DC expected. If the US–China gap closes much further, expect emergency executive action. Start preparing your contingency positions now.",
    condition: { variable: "usChinaGap", operator: "lte", value: 0 },
    target: { faction: "external" },
  },

  {
    id: "npc_r2_anon_prom_intel",
    npcId: "__npc_anon__",
    content:
      "OpenBrain's internal capability estimates are being revised upward. The gap between them and everyone else is widening faster than the public numbers show.",
    schedule: { round: 2, phase: "intel" },
    target: { faction: "prometheus" },
  },
];
