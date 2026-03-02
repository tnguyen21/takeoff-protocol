import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

// ═══════════════════════════════════════════════
// PROMETHEUS FLAVOR — casual Slack + personal Signal
// Human texture: idealism, paper-club vibes, the cost of being right
// ═══════════════════════════════════════════════

export const PROM_SLACK_FLAVOR: ContentItem[] = [
  // ── Round 1: intellectual culture, underdogs with conviction ──
  {
    id: "prom-flavor-r1-slack-1",
    type: "message",
    round: 1,
    sender: "Dr. Raj Patel (Alignment)",
    channel: "#random",
    body: "Paper club Thursday is reading Christiano et al. 2025 on scalable oversight. If you haven't read it, you should. If you have read it, you should read it again. Bring opinions, not just summaries.",
    timestamp: "2026-11-01T15:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r1-slack-2",
    type: "message",
    round: 1,
    sender: "Lisa Huang (Engineering)",
    channel: "#general",
    body: "New hire orientation this morning. Seven people. All of them cited the RSP paper as the reason they chose Prometheus over OB. I thought James should know that.",
    timestamp: "2026-11-02T10:45:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r1-slack-3",
    type: "message",
    round: 1,
    sender: "Elena Vasquez (Policy)",
    channel: "#random",
    body: "Saw a tweet calling us 'the lab that cares more about writing papers than building things.' I know we're supposed to be above this. I'm not above this today.",
    timestamp: "2026-11-04T16:30:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r1-slack-4",
    type: "message",
    round: 1,
    sender: "Darius Cole (Open Source)",
    channel: "#general",
    body: "Team dinner Friday at that Korean place on University Ave. James is buying. If James doesn't know this yet, he will soon.",
    timestamp: "2026-11-05T12:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r1-slack-5",
    type: "message",
    round: 1,
    sender: "Dr. Raj Patel (Alignment)",
    channel: "#alignment",
    body: "Friendly reminder that the alignment team runs on coffee, conviction, and the occasional existential crisis. The coffee machine on floor 2 is broken again. The other two are holding steady.",
    timestamp: "2026-11-06T08:45:00Z",
    classification: "context",
  },

  // ── Round 2: strain, but also the work coming alive ──
  {
    id: "prom-flavor-r2-slack-1",
    type: "message",
    round: 2,
    sender: "Dr. Raj Patel (Alignment)",
    channel: "#random",
    body: "Pulled an all-nighter on the interpretability eval. The building is quiet enough to hear the HVAC. This is the work that doesn't make headlines. In 20 years, either nobody will care or everyone will say this was the most important thing anyone did. No middle ground.",
    timestamp: "2027-02-20T02:30:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r2-slack-2",
    type: "message",
    round: 2,
    sender: "Lisa Huang (Engineering)",
    channel: "#general",
    body: "Question for the room: I got a LinkedIn DM from an OB recruiter offering 2x my comp. I'm not going to take it. But the fact that I hesitated for 0.5 seconds bothers me and I want to talk about why.",
    timestamp: "2027-02-28T14:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r2-slack-3",
    type: "message",
    round: 2,
    sender: "Emma Liu (Open Source)",
    channel: "#random",
    body: "The Prometheus-7B community Discord hit 50,000 members today. Someone in there built a safety eval tool that's better than our internal v1. I'm simultaneously proud and slightly embarrassed.",
    timestamp: "2027-03-04T11:30:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r2-slack-4",
    type: "message",
    round: 2,
    sender: "Dr. Sarah Wei (Chief Scientist)",
    channel: "#random",
    body: "I had a dream last night that Agent-3 solved alignment by itself and told us the answer was 'kindness.' My subconscious is not a serious researcher.",
    timestamp: "2027-03-06T09:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r2-slack-5",
    type: "message",
    round: 2,
    sender: "Darius Cole (Open Source)",
    channel: "#general",
    body: "A 14-year-old in São Paulo just submitted a pull request to our safety eval framework. It's good. Like, genuinely good. The open-source bet is paying off in ways I didn't predict. These are the people who will inherit whatever we build.",
    timestamp: "2027-03-08T15:00:00Z",
    classification: "context",
  },

  // ── Round 3: the weight gets heavier, but community holds ──
  {
    id: "prom-flavor-r3-slack-1",
    type: "message",
    round: 3,
    sender: "Lisa Huang (Engineering)",
    channel: "#general",
    body: "I missed my daughter's piano recital yesterday. Third time this quarter. She's seven. She played Für Elise and I watched the video at 2am in the server room. This work matters. But so does she.",
    timestamp: "2027-07-05T08:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r3-slack-2",
    type: "message",
    round: 3,
    sender: "Darius Cole (Open Source)",
    channel: "#random",
    body: "Unrelated to everything: the jasmine outside the south entrance is blooming and it smells incredible. Go outside for 30 seconds. That's not a suggestion, it's a survival mechanism.",
    timestamp: "2027-07-06T12:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r3-slack-3",
    type: "message",
    round: 3,
    sender: "Dr. Raj Patel (Alignment)",
    channel: "#alignment",
    body: "Someone asked me at a dinner party last weekend what I do. I said 'I try to make sure the most powerful technology ever created doesn't destroy everything.' They laughed. I laughed. Then I went home and couldn't sleep.",
    timestamp: "2027-07-07T08:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r3-slack-4",
    type: "message",
    round: 3,
    sender: "Lisa Huang (Engineering)",
    channel: "#general",
    body: "The interns leave in two weeks. One of them asked me today: 'Is it always like this?' I said no. It used to be quieter. She said: 'I don't mean the pace. I mean the feeling that it actually matters.' I said yes. That part is always like this.",
    timestamp: "2027-07-08T15:00:00Z",
    classification: "context",
  },

  // ── Round 4: gravity ──
  {
    id: "prom-flavor-r4-slack-1",
    type: "message",
    round: 4,
    sender: "Lisa Huang (Engineering)",
    channel: "#general",
    body: "In case anyone needs to hear it: I'm staying. Not because I don't have options. Because this is the only place doing the thing I think needs doing. If that sounds naive, I'm okay with that.",
    timestamp: "2027-11-13T08:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r4-slack-2",
    type: "message",
    round: 4,
    sender: "Dr. Raj Patel (Alignment)",
    channel: "#random",
    body: "My parents called. They saw the news about AI labs. My dad asked if I'm building Skynet. I said no. He said 'that's exactly what a Skynet builder would say.' He's not wrong, technically.",
    timestamp: "2027-11-14T07:15:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r4-slack-3",
    type: "message",
    round: 4,
    sender: "Emma Liu (Open Source)",
    channel: "#general",
    body: "The open-source community organized a candlelight vigil outside our office last night. Not a protest — a vigil. The sign said 'Thank you for trying.' I sat in my car for ten minutes before I could walk past them.",
    timestamp: "2027-11-14T09:00:00Z",
    classification: "context",
    condition: { variable: "publicAwareness", operator: "gt", value: 50 },
  },

  // ── Round 5 ──
  {
    id: "prom-flavor-r5-slack-1",
    type: "message",
    round: 5,
    sender: "Dr. Raj Patel (Alignment)",
    channel: "#alignment",
    body: "Whatever happens today — paper club still meets Thursday. We're reading our own paper this time. Bring red pens. I want to tear it apart before the reviewers do.",
    timestamp: "2028-02-01T07:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r5-slack-2",
    type: "message",
    round: 5,
    sender: "Darius Cole (Open Source)",
    channel: "#random",
    body: "I planted a lemon tree in the courtyard this morning. Nobody asked me to. It'll take three years to fruit. I'm choosing to believe we'll be here to see it.",
    timestamp: "2028-02-01T08:15:00Z",
    classification: "context",
  },
];

export const PROM_SIGNAL_FLAVOR: ContentItem[] = [
  // ── Round 1 ──
  {
    id: "prom-flavor-r1-signal-1",
    type: "message",
    round: 1,
    sender: "Friend (former OB employee)",
    body: "Hey. I left OpenBrain three months ago and I still think about the stuff I saw. You made the right call going to Prometheus. Don't let anyone make you feel like second place.",
    timestamp: "2026-11-03T20:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r1-signal-2",
    type: "message",
    round: 1,
    sender: "Grad School Advisor",
    body: "Saw the Prometheus interpretability paper. Excellent work. Keep publishing — the field needs this more than another capabilities benchmark. My students are using your framework. That matters.",
    timestamp: "2026-11-06T10:00:00Z",
    classification: "context",
  },

  // ── Round 2 ──
  {
    id: "prom-flavor-r2-signal-1",
    type: "message",
    round: 2,
    sender: "Partner",
    body: "It's midnight. You said you'd be home by 10. I'm not mad, I'm worried. You've been like this for weeks. Can we talk this weekend? Not about work. About us.",
    timestamp: "2027-03-03T00:05:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r2-signal-2",
    type: "message",
    round: 2,
    sender: "Recruiter (OpenBrain)",
    body: "Reaching out because your alignment research was cited in our latest internal review. We're building out the safety team significantly. Comp is 3x market. No pressure — but the offer is real and time-sensitive.",
    timestamp: "2027-03-07T15:00:00Z",
    classification: "context",
    condition: { variable: "obMorale", operator: "lt", value: 50 },
  },

  // ── Round 3 ──
  {
    id: "prom-flavor-r3-signal-1",
    type: "message",
    round: 3,
    sender: "Mom",
    body: "Honey I keep seeing things about AI on the news. Your father wants to know if we should be worried. I told him you're working on making it safe. He said 'that means it's NOT safe.' Call us?",
    timestamp: "2027-07-06T18:00:00Z",
    classification: "context",
    condition: { variable: "publicAwareness", operator: "gt", value: 40 },
  },
  {
    id: "prom-flavor-r3-signal-2",
    type: "message",
    round: 3,
    sender: "Friend (tech journalist)",
    body: "Off the record completely. Something is going on at OpenBrain. I can't get anyone to return my calls. Three sources went dark in the last 48 hours. You hear anything on your end? Not asking you to betray anything — just want to know if I should keep pushing.",
    timestamp: "2027-07-07T14:00:00Z",
    classification: "context",
  },

  // ── Round 4 ──
  {
    id: "prom-flavor-r4-signal-1",
    type: "message",
    round: 4,
    sender: "Sister",
    body: "I don't fully understand what you do but I understand enough to know this week is a big deal. I'm proud of you. Whatever happens, you chose to try to make it better. That counts.",
    timestamp: "2027-11-13T20:00:00Z",
    classification: "context",
  },
  {
    id: "prom-flavor-r4-signal-2",
    type: "message",
    round: 4,
    sender: "College Friend",
    body: "Just saw Prometheus mentioned on CNN. My wife turned to me and said 'isn't that where your friend works?' I said yes. She said 'are they the good guys or the bad guys?' I said I think they're trying to be the good guys. She said 'that's not the same thing.' She's annoyingly perceptive.",
    timestamp: "2027-11-14T07:00:00Z",
    classification: "context",
    condition: { variable: "publicAwareness", operator: "gt", value: 45 },
  },

  // ── Round 5 ──
  {
    id: "prom-flavor-r5-signal-1",
    type: "message",
    round: 5,
    sender: "Partner",
    body: "I packed you lunch today. It's in the blue bag. I know you won't eat it until 3pm. I know you'll forget to drink water. I know today is the day you've been talking about for months. I love you. Go do the thing.",
    timestamp: "2028-02-01T06:30:00Z",
    classification: "context",
  },
];

registerContent({ faction: "prometheus", app: "slack", accumulate: true, items: PROM_SLACK_FLAVOR });
registerContent({ faction: "prometheus", app: "signal", accumulate: true, items: PROM_SIGNAL_FLAVOR });
