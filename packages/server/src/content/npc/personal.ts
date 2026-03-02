import type { NpcTrigger } from "@takeoff/shared";

/**
 * Personal / flavor NPC triggers — `__npc_personal__` persona.
 *
 * Zero game impact. Power comes from juxtaposition: life keeps happening
 * while players decide things that matter. These are scheduled or escalation-aware.
 *
 * Sections:
 *   - Family: personal family messages per role
 *   - Mundane Life: notifications, appointments, errands
 *   - Social / Professional Noise: LinkedIn, group chats, fantasy sports, etc.
 *   - Escalation-Aware Personal: fire when crisis bleeds into personal life
 */
export const PERSONAL_NPC_TRIGGERS: NpcTrigger[] = [
  // ── Family ───────────────────────────────────────────────────────────────

  {
    id: "npc_personal_ob_ceo_spouse_r1",
    npcId: "__npc_personal__",
    content: "hey can you pick up ellie from soccer? coach says 5:30. also we're out of dog food",
    schedule: { round: 1, phase: "deliberation" },
    target: { role: "ob_ceo" },
  },

  {
    id: "npc_personal_ob_ceo_spouse_r3",
    npcId: "__npc_personal__",
    content: "just saw you on CNN. you looked tired. are you eating? also ellie's recital is thursday, you promised",
    schedule: { round: 3, phase: "deliberation" },
    target: { role: "ob_ceo" },
  },

  {
    id: "npc_personal_ob_safety_mom_r2",
    npcId: "__npc_personal__",
    content: "just read an article about AI doing people's jobs. is that what you work on? call me when you can, i worry",
    schedule: { round: 2, phase: "intel" },
    target: { role: "ob_safety" },
  },

  {
    id: "npc_personal_ob_cto_partner_r2",
    npcId: "__npc_personal__",
    content: "hey did you call the electrician yet? it's been three weeks. also what do you want for dinner tonight, i can pick something up",
    schedule: { round: 2, phase: "intel" },
    target: { role: "ob_cto" },
  },

  {
    id: "npc_personal_ob_security_brother_r1",
    npcId: "__npc_personal__",
    content: "bro you see the Chiefs game last night?? also can you help me move this saturday. i have a van but just need an extra person. only like 2-3 hours tops. free pizza",
    schedule: { round: 1, phase: "deliberation" },
    target: { role: "ob_security" },
  },

  {
    id: "npc_personal_prom_ceo_kid_school_r1",
    npcId: "__npc_personal__",
    content: "[Meadowbrook Elementary] Reminder: Third-grade science fair projects are due Friday. Students may bring display materials on Thursday. Questions? Contact Ms. Herrera at ext. 214.",
    schedule: { round: 1, phase: "intel" },
    target: { role: "prom_ceo" },
  },

  {
    id: "npc_personal_prom_ceo_spouse_r3",
    npcId: "__npc_personal__",
    content: "you okay? you seem distant lately. we don't have to talk about work but i'm here if you want to. also jake wants to know if you're coming to his game saturday",
    schedule: { round: 3, phase: "deliberation" },
    target: { role: "prom_ceo" },
  },

  {
    id: "npc_personal_prom_scientist_advisor_r2",
    npcId: "__npc_personal__",
    content: "Checking in — how's the postdoc treating you? I saw a preprint from your group this morning. Very exciting work. Would love to connect when you have a moment. Also the department is looking for alumni speakers if you're ever interested.",
    schedule: { round: 2, phase: "intel" },
    target: { role: "prom_scientist" },
  },

  {
    id: "npc_personal_prom_policy_sister_r1",
    npcId: "__npc_personal__",
    content: "hey!! did you see they're finally doing the farmers market in your neighborhood on saturdays again? we should go. also are you still skipping lunch? stop that",
    schedule: { round: 1, phase: "deliberation" },
    target: { role: "prom_policy" },
  },

  {
    id: "npc_personal_prom_opensource_roommate_r2",
    npcId: "__npc_personal__",
    content: "yo the wifi router is rebooting like every two hours. did you change something? also your package from newegg is on the kitchen table. also we're completely out of coffee",
    schedule: { round: 2, phase: "deliberation" },
    target: { role: "prom_opensource" },
  },

  {
    id: "npc_personal_china_director_spouse_r2",
    npcId: "__npc_personal__",
    content: "妈妈问你什么时候回家。上次视频通话是三个月前了。她没有抱怨，只是问。我也在问。",
    schedule: { round: 2, phase: "deliberation" },
    target: { role: "china_director" },
  },

  {
    id: "npc_personal_china_intel_daughter_r3",
    npcId: "__npc_personal__",
    content: "爸，我的手机屏碎了。妈说要问你。你最近都不接电话，是不是很忙？学校需要家长签字的表格我已经微信发过去了。",
    schedule: { round: 3, phase: "intel" },
    target: { role: "china_intel" },
  },

  {
    id: "npc_personal_china_military_wife_r2",
    npcId: "__npc_personal__",
    content: "你在吗？孩子今天又问起你了。我说你在忙正事。我们都好，你不用担心。注意身体，多吃点。什么时候能通个电话？",
    schedule: { round: 2, phase: "intel" },
    target: { role: "china_military" },
  },

  {
    id: "npc_personal_ext_journalist_dad_r1",
    npcId: "__npc_personal__",
    content: "your piece ran in the print edition. i cut it out. very proud of you kiddo. your grandmother wants a copy",
    schedule: { round: 1, phase: "intel" },
    target: { role: "ext_journalist" },
  },

  {
    id: "npc_personal_ext_vc_partner_r2",
    npcId: "__npc_personal__",
    content: "you missed another dinner. this is the third time this month. kids asked where you were",
    schedule: { round: 2, phase: "deliberation" },
    target: { role: "ext_vc" },
  },

  {
    id: "npc_personal_ext_nsa_sibling_r3",
    npcId: "__npc_personal__",
    content: "dude did you see that interview with the openai guy?? what do you actually DO at work. also mom wants to know if you're coming for thanksgiving",
    schedule: { round: 3, phase: "intel" },
    target: { role: "ext_nsa" },
  },

  {
    id: "npc_personal_ext_diplomat_parent_r2",
    npcId: "__npc_personal__",
    content: "your father and I are so proud. we saw you speak at the UN on the livestream. you looked very official. please eat",
    schedule: { round: 2, phase: "intel" },
    target: { role: "ext_diplomat" },
  },

  // ── Mundane Life ─────────────────────────────────────────────────────────

  {
    id: "npc_personal_any_package_r1",
    npcId: "__npc_personal__",
    content: "[Building Notification] Your package from Amazon has been delivered to the package room. Pickup by Friday to avoid return.",
    schedule: { round: 1, phase: "intel" },
    target: {},
  },

  {
    id: "npc_personal_ext_nsa_doordash_r1",
    npcId: "__npc_personal__",
    content: "Your DoorDash order from Chipotle is 5 stops away! Estimated arrival: 8:47pm. Driver: Marcus 4.9 stars",
    schedule: { round: 1, phase: "deliberation" },
    target: { role: "ext_nsa" },
  },

  {
    id: "npc_personal_ext_vc_dentist_r2",
    npcId: "__npc_personal__",
    content: "Reminder from Castro Dental: you have a cleaning scheduled for Thursday at 2pm. Reply Y to confirm or call to reschedule.",
    schedule: { round: 2, phase: "intel" },
    target: { role: "ext_vc" },
  },

  {
    id: "npc_personal_ob_safety_gym_r2",
    npcId: "__npc_personal__",
    content: "Barry's Bootcamp: Class CANCELLED — Tuesday 6:30am (Instructor illness). Credit added to your account. Sorry for the inconvenience!",
    schedule: { round: 2, phase: "deliberation" },
    target: { role: "ob_safety" },
  },

  {
    id: "npc_personal_ext_vc_tesla_r3",
    npcId: "__npc_personal__",
    content: "Tesla Service Center — Palo Alto: Your Model S is ready for pickup. Estimated total: $2,847. Please bring your confirmation number and a valid payment method.",
    schedule: { round: 3, phase: "intel" },
    target: { role: "ext_vc" },
  },

  {
    id: "npc_personal_ext_nsa_parking_r3",
    npcId: "__npc_personal__",
    content: "FYI your parking pass expired last Friday. Facilities says you need to come to the B-wing desk in person with two forms of ID to renew. Hours are 0730-1530. They cannot make exceptions. I know. I asked.",
    schedule: { round: 3, phase: "deliberation" },
    target: { role: "ext_nsa" },
  },

  {
    id: "npc_personal_ob_cto_recall_r1",
    npcId: "__npc_personal__",
    content: "[Safety Notice] Cuisinart® has issued a voluntary recall for model DFP-14BCWX food processors. Please visit cuisinart.com/recall or call 1-877-339-2534. Your registered product may be affected.",
    schedule: { round: 1, phase: "intel" },
    target: { role: "ob_cto" },
  },

  {
    id: "npc_personal_ob_security_defcon_r3",
    npcId: "__npc_personal__",
    content: "DEF CON 35 — Early bird badge registration closes in 48 hours. Goon applications now open. Villages TBA. See you in Vegas.",
    schedule: { round: 3, phase: "intel" },
    target: { role: "ob_security" },
  },

  {
    id: "npc_personal_prom_scientist_library_r1",
    npcId: "__npc_personal__",
    content: "NOTICE: Overdue library item — 'Reinforcement Learning: An Introduction' (Sutton & Barto) was due 3 weeks ago. $2.40 in fines have accrued. Please return or renew online at library.stanford.edu.",
    schedule: { round: 1, phase: "deliberation" },
    target: { role: "prom_scientist" },
  },

  {
    id: "npc_personal_prom_policy_drycleaning_r2",
    npcId: "__npc_personal__",
    content: "[Martinizing Cleaners] Your order #3847 is ready for pickup. Please pick up by Saturday to avoid a storage fee. Hours: M-F 7am-7pm, Sat 8am-5pm. Thank you!",
    schedule: { round: 2, phase: "intel" },
    target: { role: "prom_policy" },
  },

  {
    id: "npc_personal_prom_opensource_bikeshop_r3",
    npcId: "__npc_personal__",
    content: "Hey! Your Trek is all set — new brake cables, derailleur tuned. Total comes to $85. Open till 6 today and 5 Saturday. -Volta Cycles",
    schedule: { round: 3, phase: "intel" },
    target: { role: "prom_opensource" },
  },

  {
    id: "npc_personal_china_military_vehicle_r3",
    npcId: "__npc_personal__",
    content: "[后勤保障部] 您的公务车辆年检已完成。请于本周五前到保障站取车，工作时间0800-1700。维修项目已完成，详见随附清单。",
    schedule: { round: 3, phase: "deliberation" },
    target: { role: "china_military" },
  },

  // ── Social / Professional Noise ──────────────────────────────────────────

  {
    id: "npc_personal_ext_journalist_linkedin_r1",
    npcId: "__npc_personal__",
    content: "Hi — I came across your profile and think you'd be a great fit for a Content Strategy role at Synapse AI. Open to connecting?",
    schedule: { round: 1, phase: "deliberation" },
    target: { role: "ext_journalist" },
  },

  {
    id: "npc_personal_any_venmo_r2",
    npcId: "__npc_personal__",
    content: "Jake Chen charged you $23.50 for 'thai food from last tuesday'",
    schedule: { round: 2, phase: "intel" },
    target: {},
  },

  {
    id: "npc_personal_ob_ceo_fantasy_r4",
    npcId: "__npc_personal__",
    content: "[Fantasy Football] Your team 'Garbage Time' is 2-7 and officially eliminated from playoff contention. Better luck next year!",
    schedule: { round: 4, phase: "intel" },
    target: { role: "ob_ceo" },
  },

  {
    id: "npc_personal_ext_vc_reunion_r3",
    npcId: "__npc_personal__",
    content: "DARTMOUTH '09 — 15-YEAR REUNION IS COMING!! Save the date: October 4-6. Who's in??",
    schedule: { round: 3, phase: "deliberation" },
    target: { role: "ext_vc" },
  },

  {
    id: "npc_personal_ext_diplomat_groupchat_r3",
    npcId: "__npc_personal__",
    content: "[Williams College '08] Priya: omg who watched the UN session yesterday?? is that literally maya on tv?? / Dev: dead / Keiko: MAYA RESPOND",
    schedule: { round: 3, phase: "intel" },
    target: { role: "ext_diplomat" },
  },

  {
    id: "npc_personal_china_intel_discord_r1",
    npcId: "__npc_personal__",
    content: "[Discord — Phantom Wolves] bro where are you, ranked reset was yesterday, we're down a player, stop doing 'government stuff' lmao. also your energy drinks arrived, the guy left them with your neighbor again",
    schedule: { round: 1, phase: "intel" },
    target: { role: "china_intel" },
  },

  {
    id: "npc_personal_ext_journalist_editor_r2",
    npcId: "__npc_personal__",
    content: "Hey — legal says we need the source docs or we can't run it. Not my call. Also the piece is 400 words over and the headline isn't landing. Can you jump on a call at 3? Also your last expense report has a $340 'research dinner' with no receipt attached.",
    schedule: { round: 2, phase: "deliberation" },
    target: { role: "ext_journalist" },
  },

  {
    id: "npc_personal_ob_cto_labmate_r3",
    npcId: "__npc_personal__",
    content: "hey!! I was randomly thinking about the GPU cluster drama from grad school and looked you up. wild what you're building. are you doing okay? genuinely. happy to grab coffee if you're ever in boston",
    schedule: { round: 3, phase: "deliberation" },
    target: { role: "ob_cto" },
  },

  {
    id: "npc_personal_ob_security_landlord_r2",
    npcId: "__npc_personal__",
    content: "Hi, this is Faye from building management. We need to schedule the annual fire alarm inspection for your unit. Available slots: Tuesday 2-4pm, Wednesday 10am-12pm, or Thursday 4-6pm. Please confirm your preference by Friday.",
    schedule: { round: 2, phase: "deliberation" },
    target: { role: "ob_security" },
  },

  {
    id: "npc_personal_prom_scientist_cat_r3",
    npcId: "__npc_personal__",
    content: "[Petco] Your auto-ship order for Wellness CORE RawRev has shipped! Estimated delivery: Thursday. Your cat Euler will be happy :)",
    schedule: { round: 3, phase: "intel" },
    target: { role: "prom_scientist" },
  },

  {
    id: "npc_personal_prom_opensource_hn_r1",
    npcId: "__npc_personal__",
    content: "[Hacker News] Your comment on 'Ask HN: Is open-source AI regulation inevitable?' has 47 upvotes and 12 replies.",
    schedule: { round: 1, phase: "intel" },
    target: { role: "prom_opensource" },
  },

  {
    id: "npc_personal_china_intel_classmate_r2",
    npcId: "__npc_personal__",
    content: "[微信] 同学群 — 班长: 大家好，十年同学聚会开始筹备了！10月5日，有兴趣的同学报个名。人越多越好，@你 你来吗？",
    schedule: { round: 2, phase: "deliberation" },
    target: { role: "china_intel" },
  },

  {
    id: "npc_personal_china_military_comrade_r1",
    npcId: "__npc_personal__",
    content: "[微信] 老战友群 — 张华: 各位，上周末爬了趟黄山，心情不错。大家最近怎么样？有空聚一聚。@你 还是在老地方？",
    schedule: { round: 1, phase: "deliberation" },
    target: { role: "china_military" },
  },

  // ── Escalation-Aware Personal ────────────────────────────────────────────
  // These fire when crisis bleeds into personal life.
  // They have a condition + rounds (not a schedule), meaning they fire once
  // the threshold is crossed within the eligible round window.

  {
    id: "npc_personal_any_mom_worried",
    npcId: "__npc_personal__",
    content: "honey i saw the news again. should i be worried? are you safe? call me when you can. love mom",
    condition: { variable: "publicAwareness", operator: "gte", value: 70 },
    rounds: [3, 5],
    target: {},
  },

  {
    id: "npc_personal_any_partner_401k",
    npcId: "__npc_personal__",
    content: "did you see the market today?? should we move things around? i'm looking at the 401k and freaking out a little. call me tonight",
    condition: { variable: "economicDisruption", operator: "gte", value: 60 },
    rounds: [3, 5],
    target: {},
  },

  {
    id: "npc_personal_any_war_scare",
    npcId: "__npc_personal__",
    content: "are we going to war?? the news is saying things and i can't tell what's real. you would know right?? please just tell me we're okay",
    condition: { variable: "taiwanTension", operator: "gte", value: 75 },
    rounds: [4, 5],
    target: {},
  },

  {
    id: "npc_personal_any_old_friend_doom",
    npcId: "__npc_personal__",
    content: "hey, weird question out of nowhere — are things as bad as they seem on the news? like actually? you work in this stuff, so. sorry if that's a weird thing to ask",
    condition: { variable: "doomClockDistance", operator: "lte", value: 3 },
    rounds: [5, 5],
    target: {},
  },

  {
    id: "npc_personal_ob_safety_sibling_r5",
    npcId: "__npc_personal__",
    content: "i don't know what you did or what's happening but i saw your name in that article. i'm proud of you. that's all. love you",
    schedule: { round: 5, phase: "deliberation" },
    target: { role: "ob_safety" },
  },

  {
    id: "npc_personal_ob_cto_partner_worried",
    npcId: "__npc_personal__",
    content: "are you seeing the stuff online about the AI that scheduled its own follow-up? i know it's probably overblown but it feels like things are moving fast. you'd know, right? are you okay?",
    condition: { variable: "aiAutonomyLevel", operator: "gte", value: 75 },
    rounds: [4, 5],
    target: { role: "ob_cto" },
  },

  {
    id: "npc_personal_prom_scientist_advisor_worried",
    npcId: "__npc_personal__",
    content: "I've been following the public coverage and something feels off to me. I trust you and your team. But I want you to know — you can always call me, even just to talk. I'm proud of what you're doing and I want you to be okay.",
    condition: { variable: "misalignmentSeverity", operator: "gte", value: 55 },
    rounds: [4, 5],
    target: { role: "prom_scientist" },
  },

  {
    id: "npc_personal_china_director_spouse_worried",
    npcId: "__npc_personal__",
    content: "昨晚看了新闻，有些不安心。你那边还好吗？不用说太多，我知道你有难处。只是想知道你平安。孩子们也想你。好好保重。",
    condition: { variable: "ccpPatience", operator: "lte", value: 25 },
    rounds: [4, 5],
    target: { role: "china_director" },
  },
];
