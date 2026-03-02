import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

// ═══════════════════════════════════════════════
// CHINA FLAVOR — casual Slack + personal Signal
// Human texture: engineering pride, cultural grounding, the cost of secrecy
// ═══════════════════════════════════════════════

export const CHINA_SLACK_FLAVOR: ContentItem[] = [
  // ── Round 1: team building, CDZ pride ──
  {
    id: "china-flavor-r1-slack-1",
    type: "message",
    round: 1,
    sender: "CDZ Operations (Night Shift)",
    channel: "#operations",
    body: "Night shift report: all systems nominal. Block A running at 94%. Block B had a brief thermal event at 03:22 — resolved in 11 minutes. Also, someone left a box of moon cakes in the break room. They were excellent. Whoever you are, thank you.",
    timestamp: "2026-11-02T06:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r1-slack-2",
    type: "message",
    round: 1,
    sender: "Dr. Liu Yang",
    channel: "#research",
    body: "Team: I know the hours have been long. The December 1 deadline does not move, but your health matters. The congee station is open 24 hours. Please use it. This is not a sprint. It is a marathon we happen to be running at sprint pace.",
    timestamp: "2026-11-04T12:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r1-slack-3",
    type: "message",
    round: 1,
    sender: "Junior Researcher (Wei Chen)",
    channel: "#general",
    body: "Completed my PhD at Tsinghua three months ago. Today I watched our model solve a coding problem that was the subject of my entire thesis. It did it in 40 seconds. I am simultaneously proud and existentially confused.",
    timestamp: "2026-11-06T17:30:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r1-slack-4",
    type: "message",
    round: 1,
    sender: "CDZ Operations (Day Shift)",
    channel: "#operations",
    body: "Facilities note: the vending machine in Hall 3 break room has been stocked with Wahaha and Nongfu Spring. Whoever keeps filling it with Red Bull — I admire the commitment but the electricity bill for the cooling alone is ¥4,000/month. The computing should be the expensive part.",
    timestamp: "2026-11-07T09:00:00Z",
    classification: "context",
  },

  // ── Round 2: Spring Festival sacrifice, efficiency wins ──
  {
    id: "china-flavor-r2-slack-1",
    type: "message",
    round: 2,
    sender: "Junior Researcher (Wei Chen)",
    channel: "#random",
    body: "Spring Festival was two weeks ago and I spent it here. My mother sent jiaozi through express delivery. They arrived frozen solid. I ate them at 3am between training runs. Best meal I've had in months.",
    timestamp: "2027-02-20T09:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r2-slack-2",
    type: "message",
    round: 2,
    sender: "CDZ Operations (Day Shift)",
    channel: "#operations",
    body: "Chip replacement team completed Block C maintenance 4 hours ahead of schedule. 412 chips swapped. The team has been working 16-hour shifts for two weeks. They've requested a day off. I've authorized it. They've earned it ten times over.",
    timestamp: "2027-03-02T18:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r2-slack-3",
    type: "message",
    round: 2,
    sender: "Dr. Liu Yang",
    channel: "#general",
    body: "I want to say something to the team that I probably shouldn't put in writing. Three years ago, colleagues at Stanford told me I was making a mistake coming back to China. They said the compute gap was insurmountable. They said the talent gap was permanent. Look at this dashboard. Look at what we built. They were wrong.",
    timestamp: "2027-03-05T20:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r2-slack-4",
    type: "message",
    round: 2,
    sender: "Junior Researcher (Wei Chen)",
    channel: "#research",
    body: "Reading the American AI safety papers. They are very good. Some of the interpretability work from Prometheus is genuinely ahead of anything we have. I am not saying this to be defeatist. I am saying it because ignoring their strengths is how you lose. We should be learning from everything they publish.",
    timestamp: "2027-03-07T11:00:00Z",
    classification: "context",
  },

  // ── Round 3: pressure, but also humor under strain ──
  {
    id: "china-flavor-r3-slack-1",
    type: "message",
    round: 3,
    sender: "CDZ Operations",
    channel: "#operations",
    body: "Coolant pressure anomaly in Hall 5 resolved. Root cause: a bird nested in the external heat exchanger. Maintenance cleared it. The bird is fine. We are naming her 'Agent-5.' She has been relocated to a tree that is not critical infrastructure.",
    timestamp: "2027-07-04T05:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r3-slack-2",
    type: "message",
    round: 3,
    sender: "Junior Researcher (Wei Chen)",
    channel: "#random",
    body: "My girlfriend asked what I've been working on. I said 'nothing interesting.' She said 'you've been at work 14 hours a day for a year and it's nothing interesting?' I have never been a worse liar than I am right now.",
    timestamp: "2027-07-05T22:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r3-slack-3",
    type: "message",
    round: 3,
    sender: "Dr. Liu Yang",
    channel: "#research",
    body: "Night shift team found a bug in the data pipeline at 4am that would have corrupted 200 hours of training. They fixed it in 40 minutes. No one will write a paper about this. No one outside this building will ever know. But this is the kind of engineering that wins. I'm noting their names for commendation.",
    timestamp: "2027-07-06T09:00:00Z",
    classification: "context",
  },

  // ── Round 4: achievement, emotion ──
  {
    id: "china-flavor-r4-slack-1",
    type: "message",
    round: 4,
    sender: "Junior Researcher (Wei Chen)",
    channel: "#general",
    body: "DeepCent-7 benchmarks came in this morning. I sat in the results meeting trying to stay professional. Then I excused myself and went to the bathroom and cried for five minutes. We did this. We actually did this.",
    timestamp: "2027-11-12T14:00:00Z",
    classification: "context",
    condition: { variable: "chinaCapability", operator: "gt", value: 60 },
  },
  {
    id: "china-flavor-r4-slack-2",
    type: "message",
    round: 4,
    sender: "Dr. Liu Yang",
    channel: "#research",
    body: "Whatever decision is made about the grand bargain — I want this on record: this team built something extraordinary under constraints the Americans never faced. Export controls, talent restrictions, compute limitations. We solved problems they didn't have to solve. That engineering achievement exists regardless of the politics.",
    timestamp: "2027-11-14T07:30:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r4-slack-3",
    type: "message",
    round: 4,
    sender: "CDZ Operations (Night Shift)",
    channel: "#operations",
    body: "The Americans have their crisis. We have ours. Hall 7 power feed fluctuated at 23:41 — backup kicked in within 800ms, no interruption to training. This is the third time this month. The Tianwan feed is stable but the grid connection is aging. We need the Phase 4 power infrastructure or we're one equipment failure from a very bad day.",
    timestamp: "2027-11-13T06:00:00Z",
    classification: "context",
  },

  // ── Round 5 ──
  {
    id: "china-flavor-r5-slack-1",
    type: "message",
    round: 5,
    sender: "Junior Researcher (Wei Chen)",
    channel: "#general",
    body: "My mother asked me on the phone last night: 'Are you building something good?' I said yes. She said: 'Then finish it and come home.' That's the best strategic analysis anyone has given me this month.",
    timestamp: "2028-02-01T07:15:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r5-slack-2",
    type: "message",
    round: 5,
    sender: "CDZ Operations",
    channel: "#operations",
    body: "Final shift log before the decision: CDZ has been operational for 458 consecutive days. Zero unplanned outages exceeding 30 minutes. 2.1 million chip-hours delivered this quarter. Whatever leadership decides today, the infrastructure held. That was our job. We did our job.",
    timestamp: "2028-02-01T06:30:00Z",
    classification: "context",
  },
];

export const CHINA_SIGNAL_FLAVOR: ContentItem[] = [
  // ── Round 1 ──
  {
    id: "china-flavor-r1-signal-1",
    type: "message",
    round: 1,
    sender: "Mother (家人)",
    body: "儿子，你工作太辛苦了。上次回家是什么时候？你爸说他在电视上看到了关于AI的新闻，问你是不是在做那个。我说不知道。回家吃饭吧。\n\n[Son, you work too hard. When was the last time you came home? Your father saw AI news on TV and asked if that's what you're doing. I said I didn't know. Come home for dinner.]",
    timestamp: "2026-11-05T19:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r1-signal-2",
    type: "message",
    round: 1,
    sender: "University Friend (Shanghai)",
    body: "The whole campus is talking about the DeepCent open-source release. My students are using it for their research projects. Whatever you're doing over there — it's working. Proud of you, old friend.",
    timestamp: "2026-11-07T14:00:00Z",
    classification: "context",
  },

  // ── Round 2 ──
  {
    id: "china-flavor-r2-signal-1",
    type: "message",
    round: 2,
    sender: "Wife (家人)",
    body: "小明又问爸爸什么时候回来。我不知道怎么回答他了。我知道你在做重要的事。但他才四岁，他不懂'重要的事'。\n\n[Xiaoming asked again when daddy is coming home. I don't know how to answer him anymore. I know you're doing important work. But he's four. He doesn't understand 'important work.']",
    timestamp: "2027-03-03T20:30:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r2-signal-2",
    type: "message",
    round: 2,
    sender: "Classmate (now at Huawei)",
    body: "Heard through the grapevine that your team hit some impressive numbers last quarter. Can't get details obviously but the rumors are circulating in the industry. If half of what I'm hearing is true — you're going to be in the history books. Buy me dinner when it's over.",
    timestamp: "2027-03-06T12:00:00Z",
    classification: "context",
  },

  // ── Round 3 ──
  {
    id: "china-flavor-r3-signal-1",
    type: "message",
    round: 3,
    sender: "Former Colleague (now at Google)",
    body: "I'm hearing things through the grapevine about what's happening at OpenBrain. I don't know what you're working on and I know better than to ask. Just... be careful. The stakes in this space got very real very fast. Take care of yourself.",
    timestamp: "2027-07-06T16:00:00Z",
    classification: "context",
  },
  {
    id: "china-flavor-r3-signal-2",
    type: "message",
    round: 3,
    sender: "Wife (家人)",
    body: "小明今天画了一幅画。画的是你在电脑前面工作。他把电脑画得比你大三倍。我不知道该笑还是该哭。\n\n[Xiaoming drew a picture today. It's you working in front of a computer. He drew the computer three times bigger than you. I don't know whether to laugh or cry.]",
    timestamp: "2027-07-07T19:30:00Z",
    classification: "context",
  },

  // ── Round 4 ──
  {
    id: "china-flavor-r4-signal-1",
    type: "message",
    round: 4,
    sender: "Mother (家人)",
    body: "电视上说美国的AI公司出问题了。你安全吗？你们的也安全吗？我知道你不能说。但一个妈妈总要问的。\n\n[They're saying on TV that American AI companies are in trouble. Are you safe? Is yours safe too? I know you can't say. But a mother always has to ask.]",
    timestamp: "2027-11-14T06:30:00Z",
    classification: "context",
    condition: { variable: "publicAwareness", operator: "gt", value: 50 },
  },
  {
    id: "china-flavor-r4-signal-2",
    type: "message",
    round: 4,
    sender: "University Friend (Shanghai)",
    body: "I read the Western coverage of DeepCent-7. They keep saying 'stolen technology.' You know and I know how much original engineering your team did. It's infuriating. But I suppose the politics are the politics. History will sort it out. For what it's worth — the students here know. They're proud.",
    timestamp: "2027-11-13T15:00:00Z",
    classification: "context",
    condition: { variable: "chinaCapability", operator: "gt", value: 50 },
  },

  // ── Round 5 ──
  {
    id: "china-flavor-r5-signal-1",
    type: "message",
    round: 5,
    sender: "Wife (家人)",
    body: "不管今天发生什么，回家。小明给你留了一个位置在晚饭桌上。他每天都留。\n\n[Whatever happens today, come home. Xiaoming saved you a seat at the dinner table. He saves one every day.]",
    timestamp: "2028-02-01T06:00:00Z",
    classification: "context",
  },
];

registerContent({ faction: "china", app: "slack", accumulate: true, items: CHINA_SLACK_FLAVOR });
registerContent({ faction: "china", app: "signal", accumulate: true, items: CHINA_SIGNAL_FLAVOR });
