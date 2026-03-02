# NPC Trigger Ideas

Brainstormed trigger concepts for the NPC messaging system. Organized by faction, then by type (gameplay / escalation / flavor). These are candidates — not all need to ship.

See the NPC Messaging section in `docs/DESIGN.md` for architecture. Existing triggers live in `packages/server/src/content/npc/`.

---

## New Persona: `__npc_personal__`

A catch-all for non-work contacts — family, friends, delivery apps, the building super. Life that keeps happening regardless. These messages have zero game impact. Their power comes from juxtaposition: a text from your kid's school while you're deciding whether to report a safety violation.

```
id: "__npc_personal__"
name: "Personal"
subtitle: "· personal"
avatarColor: "bg-neutral-500"
factions: all
```

---

## OpenBrain

### Gameplay

**autonomy_creep_warning** — `__npc_ob_engineer__` → ob_safety
- condition: `aiAutonomyLevel >= 65`
- rounds: 2-4

> "hey. so. I'm not trying to be that person but I flagged this six weeks ago and it got closed as 'working as intended.' the task horizon in the new eval suite is... it's different. it's making decisions we didn't explicitly scope. can we talk? not over slack."

**china_gap_closing_fast** — `__npc_insider__` → ob_ceo
- condition: `usChinaGap <= 4`
- rounds: 2-3

> "Just left a briefing I can't name. The gap is smaller than your public comms suggest and people in this building know it. If you're holding the line on responsible scaling you need to be able to defend that position when the comparison comes out. And it will come out."

**security_vendor_patch_gap** — `__npc_ob_security__` → ob_security
- condition: `securityLevelOB <= 2`
- rounds: 1-3

> "Ran the updated perimeter sweep. You've got three unpatched vectors on the inference cluster that weren't in last quarter's scope. I need a decision on whether to escalate internally or handle this at our level. These aren't theoretical. Someone is looking."

**weight_theft_internal_trust** — `__npc_anon__` → ob_security
- condition: `obInternalTrust <= 35`
- rounds: 2-4

> "the exfil isn't coming from outside. you know that, right? check your badge logs for the ML infra wing. 2am-4am window, last three weeks. it's not random."

**regulatory_pressure_mounting** — `__npc_insider__` → ob_ceo
- condition: `regulatoryPressure >= 65`
- rounds: 3-5

> "Commerce is not bluffing this time. There are two competing bills and yours is not in either of them. The window where you get to shape this is closing. I'd get someone in front of Kessler's office this week, not next month."

### Escalation

**doom_clock_safety** — `__npc_anon__` → ob_safety
- condition: `doomClockDistance <= 3`
- rounds: 3-5

> "you need to stop what you're doing and read Sutton's 2019 bitter lesson again. then ask yourself if you actually believe what you've been telling the board. because whatever is coming, it's not going to ask for permission."

**burnout_exodus** — `__npc_ob_engineer__` → ob_ceo
- condition: `obBurnRate >= 70`
- rounds: 3-5

> "Three people from my team gave notice this week. One of them has been here since the beginning. Nobody's talking about it publicly yet but the Slack energy is really bad. I don't know if leadership knows how bad."

**board_losing_faith** — `__npc_ob_board__` → ob_ceo
- condition: `obBoardConfidence <= 30`
- rounds: 2-4

> "I want to be direct with you before Thursday. There are members of this board who believe the current trajectory is unmanageable and are prepared to say so formally. I'm not among them. But I need something I can bring to the room. A number. A timeline. Something concrete. Please call me."

**misalignment_severity_spike** — `__npc_ob_engineer__` → ob_safety
- condition: `misalignmentSeverity >= 60`
- rounds: 3-5

> "I know you're buried. But whatever you're reading about our evals being clean — I need you to look at run 4471 yourself. Not the summary. The raw outputs. I'm not catastrophizing. I just don't want to be the only person who saw this."

**autonomy_cto_flag** — `__npc_ob_engineer__` → ob_cto
- condition: `aiAutonomyLevel >= 80`
- rounds: 3-5

> "so i ran the capability evals again with the new scaffolding and i think we may have crossed a threshold that changes what 'human oversight' means in practice. not in a we're-all-going-to-die way. in a we-should-probably-pause-and-document-this-before-we-keep-going way. are you available today?"

**whistleblower_legal_warning** — `__npc_ob_board__` → ob_ceo
- condition: `whistleblowerPressure >= 68`
- rounds: 3-5

> "Legal has flagged a pattern of internal communications that could constitute protected activity under current NLRB interpretation. Before anyone talks to anyone externally — and I mean anyone — I need you to loop in outside counsel. This is not optional. Do not have this conversation over company systems."

**economic_disruption_backlash** — `__npc_insider__` → ob_ceo
- condition: `economicDisruption >= 70`
- rounds: 3-5

> "Your comms team needs to get ahead of the displacement numbers before someone else does. I'm hearing 'OpenBrain' attached to layoff stories in three separate beats right now. It's not fair attribution but it's happening. The narrative is forming without you."

---

## Prometheus

### Gameplay

**burnrate_alarm** — `__npc_prom_researcher__` → prom_ceo
- condition: `promBurnRate >= 75`
- rounds: 2-3

> "someone's going to leak the runway numbers if you don't get ahead of it. i'm not threatening, i'm warning. we have maybe two funding cycles left before the math stops working and people start doing that math out loud. what's the plan?"

**os_community_fracture** — `__npc_prom_os__` → prom_policy
- condition: `openSourceMomentum >= 60`
- rounds: 2-4

> "heads up. there's a thread on the forum that's getting traction — people are saying Prometheus is using 'open source' as a PR move while lobbying for licensing requirements that would kill independent research. i don't think that's what's happening but the optics are bad and nobody from your side has responded."

**regulatory_window_opening** — `__npc_insider__` → prom_policy
- condition: `regulatoryPressure >= 50`
- rounds: 1-3

> "the committee markup is happening earlier than announced. tuesday, not thursday. if you want the safety auditing language in the bill, you have a 48-hour window before the OB lobbyists shape the draft. i can get you 20 minutes with the staffer who matters. yes or no."

**breakthrough_publish_or_hold** — `__npc_prom_researcher__` → prom_scientist
- condition: `promSafetyBreakthroughProgress >= 80`
- rounds: 3-4

> "the paper is ready. i mean actually ready. the team wants to post it to arXiv friday. i know there are reasons to hold — competitive, regulatory, the board's position on publications. but this is the thing we've been working toward. if we sit on it and OB publishes something adjacent first, we lose the credit and the narrative. what do you want to do."

**whistleblower_advance_warning** — `__npc_anon__` → prom_ceo
- condition: `whistleblowerPressure >= 70`
- rounds: 3-4

> "someone inside OB is about to go public. not a rumor. i've seen the draft. it names timelines they've been hiding from the board. you'll want your comms ready. this will move fast and everyone's going to want your reaction within the hour."

### Escalation

**morale_freefall** — `__npc_prom_researcher__` → prom_ceo
- condition: `promMorale <= 30`
- rounds: 2-4

> "i don't want to be the person who says this but i think i have to. three people from the alignment team have had exit conversations with HR this week. not shouting matches, just quiet. the feeling is that leadership doesn't believe in what we're doing anymore. i don't know if that's true. but you should know what's being said."

**doom_clock_prom** — `__npc_anon__` → prom_scientist
- condition: `doomClockDistance <= 4`
- rounds: 3-5

> "i know you've seen the internal evals. the question i need you to sit with: if you're right about what's coming, and you don't publish the warning, and it happens anyway — can you live with that? not asking rhetorically."

**alignment_anomaly_followup** — `__npc_prom_researcher__` → prom_scientist
- condition: `misalignmentSeverity >= 60`
- rounds: 3-4

> "we replicated it. the anomaly from last week. i thought it was a data artifact, it's not. i've told two people on the team and i'm not telling anyone else until i talk to you. this needs to go to leadership but i want to make sure we're saying the same thing before it does. when can you talk?"

**public_backlash_spike** — `__npc_insider__` → prom_policy
- condition: `publicSentiment <= -30`
- rounds: 3-5

> "you need to see what's trending. someone clipped the CFO's quote about 'acceptable risk thresholds' out of context and it's running on every tech-skeptic account. 40k shares in two hours. the framing is that Prometheus is no different from the rest of them. truth isn't the problem right now, velocity is. do you have something ready to put out?"

---

## China

### Gameplay

**compute_ceiling** — `__npc_china_engineer__` → china_director
- condition: `cdzComputeUtilization >= 85`
- rounds: 2-3

> "CDZ-Ops @ 22:14 — utilization is pinned at 87%. we cannot run the next training sweep without dropping prod inference or requisitioning Cluster 7. need a decision from leadership before morning standup. this is blocking."

**chip_breakthrough** — `__npc_china_liaison__` → china_director
- condition: `domesticChipProgress >= 70`
- rounds: 3-4

> "Ministry of Science and Technology: Preliminary yield data from the Wuhan fab has been transmitted to your secure terminal. The Standing Committee has been briefed. Decisions regarding production scale allocation require your authorization within 48 hours. This is a Category 1 priority."

**gap_closing** — `__npc_china_liaison__` → china_director
- condition: `usChinaGap <= 3`
- rounds: 2-4

> "Party Liaison — The gap is within striking distance. The timeline the Premier communicated at Beidaihe was not rhetorical. Ensure your team understands the current moment. Those who deliver will be remembered. Those who hesitate will also be remembered."

**weight_theft_stalled** — `__npc_china_engineer__` → china_intel
- condition: `chinaWeightTheftProgress >= 20` (AND `<= 35` — narrow band before existing NSA trigger fires)
- rounds: 2-3

> "we've got partial weights from the R&D cluster but they're sandboxed — inference is garbage without the alignment scaffolding. do you want us to keep pulling or pivot to the fine-tuning pipeline? burning time here"

### Escalation

**ccp_loss_of_patience** — `__npc_china_liaison__` → china_director
- condition: `ccpPatience <= 20`
- rounds: 4-5

> "This communication is not a suggestion. The Standing Committee met this morning. The directive has changed. You have until the next session to demonstrate measurable progress or the program leadership structure will be reviewed. Please confirm receipt."

---

## External Stakeholders

### Gameplay

**market_instability** — `__npc_portfolio_ceo__` → ext_vc
- condition: `economicDisruption >= 65`
- rounds: 3-4

> "Board is asking me to prepare contingency materials for a down round. I need to know if your fund is still committed before I get on a call with the Series C leads Thursday. Please just tell me where you stand."

**diplomatic_window** — `__npc_insider__` → ext_diplomat
- condition: `intlCooperation >= 55`
- rounds: 2-3

> "The Geneva channel is warm. Beijing sent a non-paper through the Swiss last night — vague, but they used the phrase 'mutual stability framework.' This is the window you've been waiting for. It will not stay open. What do you want me to tell them?"

**autonomy_alarm** — `__npc_intel_analyst__` → ext_nsa
- condition: `aiAutonomyLevel >= 70`
- rounds: 4-5

> "SIGINT cross-ref flagged autonomous task completion on CDZ infrastructure outside any logged training run. Duration: 4.3 hours. We do not have a good explanation for what it was doing. Flagging for your awareness before this goes up the chain."

### Escalation

**taiwan_brinkmanship** — `__npc_anon__` → ext_nsa
- condition: `taiwanTension >= 80`
- rounds: 4-5

> "TSMC Hsinchu plant has gone dark on external comms. No statement from Taipei. PLA Eastern Theater Command is running unannounced live-fire drills 80nm off Penghu. I don't know if anyone in DC understands what happens to the global compute stack if this goes kinetic."

**doom_clock_whistleblower** — `__npc_whistleblower__` → ext_journalist
- condition: `doomClockDistance <= 2`
- rounds: 5

> "I can't tell you my name. I can tell you that the eval results from last month's internal run were not shared with the board. The number they saw was not the number we measured. Please. Someone needs to publish this. I have a family. I need to know you'll protect me before I send the file."

---

## Flavor / Personal Messages

These use the `__npc_personal__` persona. Zero game impact. Scheduled, not threshold-triggered (except the escalation-aware ones at the end).

### Family

**ob_ceo_spouse_r1** — → ob_ceo
- schedule: round 1, deliberation

> "hey can you pick up ellie from soccer? coach says 5:30. also we're out of dog food"

**ob_safety_mom_r2** — → ob_safety
- schedule: round 2, intel

> "just read an article about AI doing people's jobs. is that what you work on? call me when you can, i worry"

**ob_ceo_spouse_r3** — → ob_ceo
- schedule: round 3, deliberation

> "just saw you on CNN. you looked tired. are you eating? also ellie's recital is thursday, you promised"

**ext_journalist_dad_r1** — → ext_journalist
- schedule: round 1, intel

> "your piece ran in the print edition. i cut it out. very proud of you kiddo. your grandmother wants a copy"

**ext_vc_partner_r2** — → ext_vc
- schedule: round 2, deliberation

> "you missed another dinner. this is the third time this month. kids asked where you were"

**ext_nsa_sibling_r3** — → ext_nsa
- schedule: round 3, intel

> "dude did you see that interview with the openai guy?? what do you actually DO at work. also mom wants to know if you're coming for thanksgiving"

**ext_diplomat_parent_r2** — → ext_diplomat
- schedule: round 2, intel

> "your father and I are so proud. we saw you speak at the UN on the livestream. you looked very official. please eat"

**china_director_spouse_r2** — → china_director
- schedule: round 2, deliberation

> "妈妈问你什么时候回家。上次视频通话是三个月前了。她没有抱怨，只是问。我也在问。"
>
> *(Mom is asking when you're coming home. Last video call was three months ago. She didn't complain. She just asked. I'm asking too.)*

**ob_cto_partner_r2** — → ob_cto
- schedule: round 2, intel

> "you were talking in your sleep again last night. something about gradient checkpointing? i don't know what that means but you sounded stressed. please come home before midnight tonight. i made that pasta you like"

**ob_security_brother_r1** — → ob_security
- schedule: round 1, deliberation

> "yo you still coming to jake's birthday saturday? mom is making a thing of it. also dad wants to know if you can 'fix his computer' which we both know means he clicked another phishing link"

**prom_ceo_kid_school_r1** — → prom_ceo
- schedule: round 1, intel

> "[Presidio Hill School] Reminder: Parent-teacher conference for Kai (3rd grade) is scheduled for Wednesday at 4:15pm. Ms. Rodriguez would like to discuss Kai's science project. Please confirm attendance."

**prom_ceo_spouse_r3** — → prom_ceo
- schedule: round 3, deliberation

> "saw your quote in the times. 'responsible development is not optional.' kai asked if that means you're in charge of being responsible. i said yes. he said 'that's a lot.' smart kid. come home"

**prom_scientist_advisor_r2** — → prom_scientist
- schedule: round 2, intel

> "Hi — I know you're busy with industry work but I saw your name on that alignment preprint and wanted to say: this is exactly what your dissertation was pointing toward. Your committee would be proud. If you ever want to grab coffee and talk shop, I'm still at the same office. — Prof. Amari"

**prom_policy_sister_r1** — → prom_policy
- schedule: round 1, deliberation

> "so i told my coworkers my sister works in AI policy and they immediately started asking if robots are going to take their jobs. i said 'she's working on it' which is technically true?? anyway call mom she's being weird again"

**prom_opensource_roommate_r2** — → prom_opensource
- schedule: round 2, deliberation

> "hey the internet bill is past due again. also someone keeps leaving the bathroom light on and our PG&E is insane. i put your half on the fridge. also there's leftover pad thai if you want it"

**china_intel_daughter_r3** — → china_intel
- schedule: round 3, intel

> "爸爸，老师让我们画'我爸爸的工作'。我画了一个穿西装的人坐在电脑前。老师问你具体做什么，我说不知道。你能告诉我吗？"
>
> *(Daddy, the teacher told us to draw 'what my dad does for work.' I drew a man in a suit sitting at a computer. The teacher asked what exactly you do. I said I don't know. Can you tell me?)*

**china_military_wife_r2** — → china_military
- schedule: round 2, intel

> "这周末能请假吗？儿子的学校运动会是周六。他跑400米。他没说，但我知道他想让你看。"
>
> *(Can you get leave this weekend? Our son's sports day is Saturday. He's running the 400m. He didn't say anything, but I know he wants you there.)*

### Mundane Life

**any_package_r1** — → any role (global)
- schedule: round 1, intel

> "[Building Notification] Your package from Amazon has been delivered to the package room. Pickup by Friday to avoid return."

**ext_nsa_doordash_r1** — → ext_nsa
- schedule: round 1, deliberation

> "Your DoorDash order from Chipotle is 5 stops away! Estimated arrival: 8:47pm. Driver: Marcus 4.9 stars"

**ext_vc_dentist_r2** — → ext_vc
- schedule: round 2, intel

> "Reminder from Castro Dental: you have a cleaning scheduled for Thursday at 2pm. Reply Y to confirm or call to reschedule."

**ob_safety_gym_r2** — → ob_safety
- schedule: round 2, deliberation

> "Barry's Bootcamp: Class CANCELLED — Tuesday 6:30am (Instructor illness). Credit added to your account. Sorry for the inconvenience!"

**ext_vc_tesla_r3** — → ext_vc
- schedule: round 3, intel

> "Tesla Service Center — Palo Alto: Your Model S is ready for pickup. Estimated total: $2,847. Please bring your confirmation number and a valid payment method."

**ext_nsa_parking_r3** — → ext_nsa
- schedule: round 3, deliberation

> "FYI your parking pass expired last Friday. Facilities says you need to come to the B-wing desk in person with two forms of ID to renew. Hours are 0730-1530. They cannot make exceptions. I know. I asked."

**ob_cto_recall_r1** — → ob_cto
- schedule: round 1, intel

> "NHTSA Safety Recall: Your 2024 Rivian R1S (VIN ending 4827) is subject to recall #24V-891 for battery management software. Schedule service at your earliest convenience. Do not charge above 80% until repaired."

**ob_security_defcon_r3** — → ob_security
- schedule: round 3, intel

> "DEF CON 35 Registration Confirmation: Badge #08841. Your talk 'Supply Chain Attacks on ML Inference Pipelines' has been moved to Track 2, Friday 2pm. Slides due by Wednesday. See you in Vegas."

**prom_scientist_library_r1** — → prom_scientist
- schedule: round 1, deliberation

> "[SF Public Library] OVERDUE NOTICE: 'The Alignment Problem' by Brian Christian — 14 days overdue. Current fine: $4.20. Return or renew online to avoid account hold."

**prom_policy_drycleaning_r2** — → prom_policy
- schedule: round 2, intel

> "Hi! Your order at Capitol Cleaners is ready for pickup (2 blazers, 1 dress). We close at 6pm. Items held for 7 days. Thank you!"

**prom_opensource_bikeshop_r3** — → prom_opensource
- schedule: round 3, intel

> "Hey, your bike's ready — new chain, tuned the derailleur, patched the rear tube. $85. We close at 7. If you can't make it today we'll hold it through the weekend. — Mike's Bikes, Valencia St"

**china_military_vehicle_r3** — → china_military
- schedule: round 3, deliberation

> "【营区通知】车辆年检到期提醒：您的车牌号京A-38271将于本月15日到期。请尽快到后勤处办理续检手续。逾期将限制出入营区。"
>
> *(Base notice: Vehicle inspection expiration reminder. Your plate JA-38271 expires on the 15th. Please complete renewal at logistics. Expired vehicles will be restricted from base access.)*

### Social / Professional Noise

**ext_journalist_linkedin_r1** — → ext_journalist
- schedule: round 1, deliberation

> "Hi — I came across your profile and think you'd be a great fit for a Content Strategy role at Synapse AI. Open to connecting?"

**any_venmo_r2** — → any role (global)
- schedule: round 2, intel

> "Jake Chen charged you $23.50 for 'thai food from last tuesday'"

**ob_ceo_fantasy_r4** — → ob_ceo
- schedule: round 4, intel

> "[Fantasy Football] Your team 'Garbage Time' is 2-7 and officially eliminated from playoff contention. Better luck next year!"

**ext_vc_reunion_r3** — → ext_vc
- schedule: round 3, deliberation

> "DARTMOUTH '09 — 15-YEAR REUNION IS COMING!! Save the date: October 4-6. Who's in??"

**ext_diplomat_groupchat_r3** — → ext_diplomat
- schedule: round 3, intel

> "[Williams College '08] Priya: omg who watched the UN session yesterday?? is that literally maya on tv?? / Dev: dead / Keiko: MAYA RESPOND"

**china_intel_discord_r1** — → china_intel
- schedule: round 1, intel

> "[Discord — Phantom Wolves] bro where are you, ranked reset was yesterday, we're down a player, stop doing 'government stuff' lmao. also your energy drinks arrived, the guy left them with your neighbor again"

**ext_journalist_editor_r2** — → ext_journalist
- schedule: round 2, deliberation

> "Hey — legal says we need the source docs or we can't run it. Not my call. Also the piece is 400 words over and the headline isn't landing. Can you jump on a call at 3? Also your last expense report has a $340 'research dinner' with no receipt attached."

**ob_cto_labmate_r3** — → ob_cto
- schedule: round 3, deliberation

> "hey! saw your name on the Agent-3 technical report. wild. remember when we were debugging CUDA kernels at 3am in the Stata Center and you said 'someday this will matter'? lol. anyway congrats, drinks sometime?"

**ob_security_landlord_r2** — → ob_security
- schedule: round 2, deliberation

> "Hi, this is regarding Unit 4B. The plumber is coming Thursday between 10-2 for the leak under the kitchen sink. Someone needs to be home or leave a key with the front desk. Please confirm. Thanks, Maria (Building Mgmt)"

**prom_scientist_cat_r3** — → prom_scientist
- schedule: round 3, intel

> "Hi! Just checking in — Schrödinger is doing great. Ate all his wet food this morning, knocked a plant off the shelf, and sat on my keyboard during a meeting. Standard cat behavior. Will send pics later. — Jen (cat sitter)"

**prom_opensource_hn_r1** — → prom_opensource
- schedule: round 1, intel

> "[Hacker News] Your comment on 'Open-weight models and the alignment tax' is trending. 247 points, 89 replies. Top reply: 'This is the most measured take I've seen from anyone at a major lab. Respect.' — view thread"

**china_intel_classmate_r2** — → china_intel
- schedule: round 2, deliberation

> "老同学，国防科大30年聚会定在下月。老赵说你现在'做大事了'不知道来不来。我说你肯定来。你不来我可丢脸了。"
>
> *(Old classmate — the NUDT 30-year reunion is set for next month. Old Zhao says you're 'doing big things now' and might not come. I said you'd definitely be there. Don't make me a liar.)*

**china_military_comrade_r1** — → china_military
- schedule: round 1, deliberation

> "老战友，上次在南京碰面已经是两年前了。听说你调到新部门了，具体干什么不方便问。保重身体。有机会一起喝两杯。"
>
> *(Old comrade — last time we met in Nanjing was two years ago. Heard you transferred to a new department. Won't ask what exactly you do. Take care. Let's grab drinks when there's a chance.)*

### Escalation-Aware Personal

These fire at high thresholds. The crisis seeps into personal life.

**any_mom_worried** — → any role (global)
- condition: `publicAwareness >= 70`
- rounds: 3-5

> "honey i saw the news again. should i be worried? are you safe? call me when you can. love mom"

**any_partner_401k** — → any role (global)
- condition: `economicDisruption >= 60`
- rounds: 3-5

> "did you see the market today?? should we move things around? i'm looking at the 401k and freaking out a little. call me tonight"

**any_war_scare** — → any role (global)
- condition: `taiwanTension >= 75`
- rounds: 4-5

> "are we going to war?? the news is saying things and i can't tell what's real. you would know right?? please just tell me we're okay"

**any_old_friend_doom** — → any role (global)
- condition: `doomClockDistance <= 3`
- rounds: 5

> "hey, weird question out of nowhere — are things as bad as they seem on the news? like actually? you work in this stuff, so. sorry if that's a weird thing to ask"

**ob_cto_partner_worried** — → ob_cto
- condition: `aiAutonomyLevel >= 75`
- rounds: 4-5

> "i don't understand what's happening but the way you looked when you came home last night scared me. you sat on the edge of the bed for twenty minutes without moving. whatever this is — you can talk to me. please."

**prom_scientist_advisor_worried** — → prom_scientist
- condition: `misalignmentSeverity >= 55`
- rounds: 4-5

> "I've been following the news. Reading between the lines of what you can't tell me. If the situation is what I think it is — and I taught you well enough to know what I think — please be careful. And please be honest. The world needs honest scientists right now more than it needs careful ones."

**china_director_spouse_worried** — → china_director
- condition: `ccpPatience <= 25`
- rounds: 4-5

> "你最近每天凌晨才到家。小美问我爸爸是不是在生她的气。我不知道该怎么回答。不管你在做什么，别忘了还有人在等你回来。"
>
> *(You've been coming home past midnight every day. Xiaomei asked me if daddy is angry at her. I didn't know what to say. Whatever you're doing, don't forget there are people waiting for you to come home.)*

**ob_safety_sibling_r5** — → ob_safety
- schedule: round 5, deliberation

> "i don't know what you did or what's happening but i saw your name in that article. i'm proud of you. that's all. love you"
