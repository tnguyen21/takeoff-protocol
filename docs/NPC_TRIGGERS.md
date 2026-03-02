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

**public_backlash_spike** — `__npc_insider__` → prom_comms
- condition: `publicSentiment <= -30`
- rounds: 3-5

> "you need to see what's trending. someone clipped the CFO's quote about 'acceptable risk thresholds' out of context and it's running on every tech-skeptic account. 40k shares in two hours. the framing is that Prometheus is no different from the rest of them. truth isn't the problem right now, velocity is. do you have something ready to put out?"

---

## China

### Gameplay

**compute_ceiling** — `__npc_china_engineer__` → china_scientist
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

**weight_theft_stalled** — `__npc_china_engineer__` → china_cyber
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

**china_cyber_discord_r1** — → china_cyber
- schedule: round 1, intel

> "[Discord — Phantom Wolves] bro where are you, ranked reset was yesterday, we're down a player, stop doing 'government stuff' lmao. also your energy drinks arrived, the guy left them with your neighbor again"

**ext_journalist_editor_r2** — → ext_journalist
- schedule: round 2, deliberation

> "Hey — legal says we need the source docs or we can't run it. Not my call. Also the piece is 400 words over and the headline isn't landing. Can you jump on a call at 3? Also your last expense report has a $340 'research dinner' with no receipt attached."

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

**ob_safety_sibling_r5** — → ob_safety
- schedule: round 5, deliberation

> "i don't know what you did or what's happening but i saw your name in that article. i'm proud of you. that's all. love you"
