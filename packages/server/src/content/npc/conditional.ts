import type { NpcTrigger } from "@takeoff/shared";

/**
 * Conditional NPC triggers — fired across any round when the attached state-variable
 * condition is met, within the specified round window.
 *
 * All triggers here are content-only: they target a specific role via DM and fire
 * once per game (deduped by `id` against `room.firedThresholds`).
 */
export const CONDITIONAL_NPC_TRIGGERS: NpcTrigger[] = [
  // ── OpenBrain > Gameplay ───────────────────────────────────────────────────

  {
    id: "npc_autonomy_creep_warning",
    npcId: "__npc_ob_engineer__",
    content:
      "hey. so. I'm not trying to be that person but I flagged this six weeks ago and it got closed as 'working as intended.' the task horizon in the new eval suite is... it's different. it's making decisions we didn't explicitly scope. can we talk? not over slack.",
    condition: { variable: "aiAutonomyLevel", operator: "gte", value: 65 },
    target: { role: "ob_safety" },
    rounds: [2, 4],
  },

  {
    id: "npc_china_gap_closing_fast",
    npcId: "__npc_insider__",
    content:
      "Just left a briefing I can't name. The gap is smaller than your public comms suggest and people in this building know it. If you're holding the line on responsible scaling you need to be able to defend that position when the comparison comes out. And it will come out.",
    condition: { variable: "usChinaGap", operator: "lte", value: 4 },
    target: { role: "ob_ceo" },
    rounds: [2, 3],
  },

  {
    id: "npc_security_vendor_patch_gap",
    npcId: "__npc_ob_security__",
    content:
      "Ran the updated perimeter sweep. You've got three unpatched vectors on the inference cluster that weren't in last quarter's scope. I need a decision on whether to escalate internally or handle this at our level. These aren't theoretical. Someone is looking.",
    condition: { variable: "securityLevelOB", operator: "lte", value: 2 },
    target: { role: "ob_security" },
    rounds: [1, 3],
  },

  {
    id: "npc_weight_theft_internal_trust",
    npcId: "__npc_anon__",
    content:
      "the exfil isn't coming from outside. you know that, right? check your badge logs for the ML infra wing. 2am-4am window, last three weeks. it's not random.",
    condition: { variable: "obInternalTrust", operator: "lte", value: 35 },
    target: { role: "ob_security" },
    rounds: [2, 4],
  },

  {
    id: "npc_regulatory_pressure_mounting",
    npcId: "__npc_insider__",
    content:
      "Commerce is not bluffing this time. There are two competing bills and yours is not in either of them. The window where you get to shape this is closing. I'd get someone in front of Kessler's office this week, not next month.",
    condition: { variable: "regulatoryPressure", operator: "gte", value: 65 },
    target: { role: "ob_ceo" },
    rounds: [3, 5],
  },

  // ── OpenBrain > Escalation ─────────────────────────────────────────────────

  {
    id: "npc_doom_clock_safety",
    npcId: "__npc_anon__",
    content:
      "you need to stop what you're doing and read Sutton's 2019 bitter lesson again. then ask yourself if you actually believe what you've been telling the board. because whatever is coming, it's not going to ask for permission.",
    condition: { variable: "doomClockDistance", operator: "lte", value: 3 },
    target: { role: "ob_safety" },
    rounds: [3, 5],
  },

  {
    id: "npc_burnout_exodus",
    npcId: "__npc_ob_engineer__",
    content:
      "Three people from my team gave notice this week. One of them has been here since the beginning. Nobody's talking about it publicly yet but the Slack energy is really bad. I don't know if leadership knows how bad.",
    condition: { variable: "obBurnRate", operator: "gte", value: 70 },
    target: { role: "ob_ceo" },
    rounds: [3, 5],
  },

  {
    id: "npc_board_losing_faith",
    npcId: "__npc_ob_board__",
    content:
      "I want to be direct with you before Thursday. There are members of this board who believe the current trajectory is unmanageable and are prepared to say so formally. I'm not among them. But I need something I can bring to the room. A number. A timeline. Something concrete. Please call me.",
    condition: { variable: "obBoardConfidence", operator: "lte", value: 30 },
    target: { role: "ob_ceo" },
    rounds: [2, 4],
  },

  {
    id: "npc_misalignment_severity_spike",
    npcId: "__npc_ob_engineer__",
    content:
      "I know you're buried. But whatever you're reading about our evals being clean — I need you to look at run 4471 yourself. Not the summary. The raw outputs. I'm not catastrophizing. I just don't want to be the only person who saw this.",
    condition: { variable: "misalignmentSeverity", operator: "gte", value: 60 },
    target: { role: "ob_safety" },
    rounds: [3, 5],
  },

  {
    id: "npc_autonomy_cto_flag",
    npcId: "__npc_ob_engineer__",
    content:
      "so i ran the capability evals again with the new scaffolding and i think we may have crossed a threshold that changes what 'human oversight' means in practice. not in a we're-all-going-to-die way. in a we-should-probably-pause-and-document-this-before-we-keep-going way. are you available today?",
    condition: { variable: "aiAutonomyLevel", operator: "gte", value: 80 },
    target: { role: "ob_cto" },
    rounds: [3, 5],
  },

  {
    id: "npc_whistleblower_legal_warning",
    npcId: "__npc_ob_board__",
    content:
      "Legal has flagged a pattern of internal communications that could constitute protected activity under current NLRB interpretation. Before anyone talks to anyone externally — and I mean anyone — I need you to loop in outside counsel. This is not optional. Do not have this conversation over company systems.",
    condition: { variable: "whistleblowerPressure", operator: "gte", value: 68 },
    target: { role: "ob_ceo" },
    rounds: [3, 5],
  },

  {
    id: "npc_economic_disruption_backlash",
    npcId: "__npc_insider__",
    content:
      "Your comms team needs to get ahead of the displacement numbers before someone else does. I'm hearing 'OpenBrain' attached to layoff stories in three separate beats right now. It's not fair attribution but it's happening. The narrative is forming without you.",
    condition: { variable: "economicDisruption", operator: "gte", value: 70 },
    target: { role: "ob_ceo" },
    rounds: [3, 5],
  },

  // ── Prometheus > Gameplay ──────────────────────────────────────────────────

  {
    id: "npc_burnrate_alarm",
    npcId: "__npc_prom_researcher__",
    content:
      "someone's going to leak the runway numbers if you don't get ahead of it. i'm not threatening, i'm warning. we have maybe two funding cycles left before the math stops working and people start doing that math out loud. what's the plan?",
    condition: { variable: "promBurnRate", operator: "gte", value: 75 },
    target: { role: "prom_ceo" },
    rounds: [2, 3],
  },

  {
    id: "npc_os_community_fracture",
    npcId: "__npc_prom_os__",
    content:
      "heads up. there's a thread on the forum that's getting traction — people are saying Prometheus is using 'open source' as a PR move while lobbying for licensing requirements that would kill independent research. i don't think that's what's happening but the optics are bad and nobody from your side has responded.",
    condition: { variable: "openSourceMomentum", operator: "gte", value: 60 },
    target: { role: "prom_policy" },
    rounds: [2, 4],
  },

  {
    id: "npc_regulatory_window_opening",
    npcId: "__npc_insider__",
    content:
      "the committee markup is happening earlier than announced. tuesday, not thursday. if you want the safety auditing language in the bill, you have a 48-hour window before the OB lobbyists shape the draft. i can get you 20 minutes with the staffer who matters. yes or no.",
    condition: { variable: "regulatoryPressure", operator: "gte", value: 50 },
    target: { role: "prom_policy" },
    rounds: [1, 3],
  },

  {
    id: "npc_breakthrough_publish_or_hold",
    npcId: "__npc_prom_researcher__",
    content:
      "the paper is ready. i mean actually ready. the team wants to post it to arXiv friday. i know there are reasons to hold — competitive, regulatory, the board's position on publications. but this is the thing we've been working toward. if we sit on it and OB publishes something adjacent first, we lose the credit and the narrative. what do you want to do.",
    condition: { variable: "promSafetyBreakthroughProgress", operator: "gte", value: 80 },
    target: { role: "prom_scientist" },
    rounds: [3, 4],
  },

  {
    id: "npc_whistleblower_advance_warning",
    npcId: "__npc_anon__",
    content:
      "someone inside OB is about to go public. not a rumor. i've seen the draft. it names timelines they've been hiding from the board. you'll want your comms ready. this will move fast and everyone's going to want your reaction within the hour.",
    condition: { variable: "whistleblowerPressure", operator: "gte", value: 70 },
    target: { role: "prom_ceo" },
    rounds: [3, 4],
  },

  // ── Prometheus > Escalation ────────────────────────────────────────────────

  {
    id: "npc_morale_freefall",
    npcId: "__npc_prom_researcher__",
    content:
      "i don't want to be the person who says this but i think i have to. three people from the alignment team have had exit conversations with HR this week. not shouting matches, just quiet. the feeling is that leadership doesn't believe in what we're doing anymore. i don't know if that's true. but you should know what's being said.",
    condition: { variable: "promMorale", operator: "lte", value: 30 },
    target: { role: "prom_ceo" },
    rounds: [2, 4],
  },

  {
    id: "npc_doom_clock_prom",
    npcId: "__npc_anon__",
    content:
      "i know you've seen the internal evals. the question i need you to sit with: if you're right about what's coming, and you don't publish the warning, and it happens anyway — can you live with that? not asking rhetorically.",
    condition: { variable: "doomClockDistance", operator: "lte", value: 4 },
    target: { role: "prom_scientist" },
    rounds: [3, 5],
  },

  {
    id: "npc_alignment_anomaly_followup",
    npcId: "__npc_prom_researcher__",
    content:
      "we replicated it. the anomaly from last week. i thought it was a data artifact, it's not. i've told two people on the team and i'm not telling anyone else until i talk to you. this needs to go to leadership but i want to make sure we're saying the same thing before it does. when can you talk?",
    condition: { variable: "misalignmentSeverity", operator: "gte", value: 60 },
    target: { role: "prom_scientist" },
    rounds: [3, 4],
  },

  {
    id: "npc_public_backlash_spike",
    npcId: "__npc_insider__",
    content:
      "you need to see what's trending. someone clipped the CFO's quote about 'acceptable risk thresholds' out of context and it's running on every tech-skeptic account. 40k shares in two hours. the framing is that Prometheus is no different from the rest of them. truth isn't the problem right now, velocity is. do you have something ready to put out?",
    condition: { variable: "publicSentiment", operator: "lte", value: -30 },
    target: { role: "prom_policy" },
    rounds: [3, 5],
  },

  // ── China > Gameplay ───────────────────────────────────────────────────────

  {
    id: "npc_compute_ceiling",
    npcId: "__npc_china_engineer__",
    content:
      "CDZ-Ops @ 22:14 — utilization is pinned at 87%. we cannot run the next training sweep without dropping prod inference or requisitioning Cluster 7. need a decision from leadership before morning standup. this is blocking.",
    condition: { variable: "cdzComputeUtilization", operator: "gte", value: 85 },
    target: { role: "china_director" },
    rounds: [2, 3],
  },

  {
    id: "npc_chip_breakthrough",
    npcId: "__npc_china_liaison__",
    content:
      "Ministry of Science and Technology: Preliminary yield data from the Wuhan fab has been transmitted to your secure terminal. The Standing Committee has been briefed. Decisions regarding production scale allocation require your authorization within 48 hours. This is a Category 1 priority.",
    condition: { variable: "domesticChipProgress", operator: "gte", value: 70 },
    target: { role: "china_director" },
    rounds: [3, 4],
  },

  {
    id: "npc_gap_closing",
    npcId: "__npc_china_liaison__",
    content:
      "Party Liaison — The gap is within striking distance. The timeline the Premier communicated at Beidaihe was not rhetorical. Ensure your team understands the current moment. Those who deliver will be remembered. Those who hesitate will also be remembered.",
    condition: { variable: "usChinaGap", operator: "lte", value: 3 },
    target: { role: "china_director" },
    rounds: [2, 4],
  },

  {
    id: "npc_weight_theft_stalled",
    npcId: "__npc_china_engineer__",
    content:
      "we've got partial weights from the R&D cluster but they're sandboxed — inference is garbage without the alignment scaffolding. do you want us to keep pulling or pivot to the fine-tuning pipeline? burning time here",
    condition: { variable: "chinaWeightTheftProgress", operator: "gte", value: 20 },
    target: { role: "china_intel" },
    rounds: [2, 3],
  },

  // ── China > Escalation ─────────────────────────────────────────────────────

  {
    id: "npc_ccp_loss_of_patience",
    npcId: "__npc_china_liaison__",
    content:
      "This communication is not a suggestion. The Standing Committee met this morning. The directive has changed. You have until the next session to demonstrate measurable progress or the program leadership structure will be reviewed. Please confirm receipt.",
    condition: { variable: "ccpPatience", operator: "lte", value: 20 },
    target: { role: "china_director" },
    rounds: [4, 5],
  },

  // ── External > Gameplay ────────────────────────────────────────────────────

  {
    id: "npc_market_instability",
    npcId: "__npc_portfolio_ceo__",
    content:
      "Board is asking me to prepare contingency materials for a down round. I need to know if your fund is still committed before I get on a call with the Series C leads Thursday. Please just tell me where you stand.",
    condition: { variable: "economicDisruption", operator: "gte", value: 65 },
    target: { role: "ext_vc" },
    rounds: [3, 4],
  },

  {
    id: "npc_diplomatic_window",
    npcId: "__npc_insider__",
    content:
      "The Geneva channel is warm. Beijing sent a non-paper through the Swiss last night — vague, but they used the phrase 'mutual stability framework.' This is the window you've been waiting for. It will not stay open. What do you want me to tell them?",
    condition: { variable: "intlCooperation", operator: "gte", value: 55 },
    target: { role: "ext_diplomat" },
    rounds: [2, 3],
  },

  {
    id: "npc_autonomy_alarm",
    npcId: "__npc_intel_analyst__",
    content:
      "SIGINT cross-ref flagged autonomous task completion on CDZ infrastructure outside any logged training run. Duration: 4.3 hours. We do not have a good explanation for what it was doing. Flagging for your awareness before this goes up the chain.",
    condition: { variable: "aiAutonomyLevel", operator: "gte", value: 70 },
    target: { role: "ext_nsa" },
    rounds: [4, 5],
  },

  // ── External > Escalation ──────────────────────────────────────────────────

  {
    id: "npc_taiwan_brinkmanship",
    npcId: "__npc_anon__",
    content:
      "TSMC Hsinchu plant has gone dark on external comms. No statement from Taipei. PLA Eastern Theater Command is running unannounced live-fire drills 80nm off Penghu. I don't know if anyone in DC understands what happens to the global compute stack if this goes kinetic.",
    condition: { variable: "taiwanTension", operator: "gte", value: 80 },
    target: { role: "ext_nsa" },
    rounds: [4, 5],
  },

  {
    id: "npc_doom_clock_whistleblower",
    npcId: "__npc_whistleblower__",
    content:
      "I can't tell you my name. I can tell you that the eval results from last month's internal run were not shared with the board. The number they saw was not the number we measured. Please. Someone needs to publish this. I have a family. I need to know you'll protect me before I send the file.",
    condition: { variable: "doomClockDistance", operator: "lte", value: 2 },
    target: { role: "ext_journalist" },
    rounds: [5, 5],
  },
];
