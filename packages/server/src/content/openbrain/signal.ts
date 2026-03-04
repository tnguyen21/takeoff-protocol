import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const OB_SIGNAL: ContentItem[] = [
    {
      id: "ob-signal-1",
      type: "message",
      round: 1,
      sender: "Sen. Margaret Walsh",
      body: "Marcus — we need to talk. The NSC is getting nervous. Some people want emergency powers to pull everything in-house. You need to be at the table before decisions get made without you.",
      timestamp: "2026-11-03T19:15:00Z",
      classification: "critical",
    },
    {
      id: "ob2-signal-1",
      type: "message",
      round: 2,
      sender: "Sen. Margaret Walsh",
      body: "Marcus — I'm being briefed tomorrow. Whatever you're about to tell them — I need to hear it tonight. The language being used in the NSC right now about 'emergency authorities' is not metaphorical. If you don't get in front of this, someone else is going to make decisions about your company for you.",
      timestamp: "2027-03-07T20:30:00Z",
      classification: "critical",
    },
    {
      id: "ob-r3-signal-1",
      type: "message",
      round: 3,
      sender: "Sen. Margaret Walsh",
      body: "Marcus — I am going out on a limb here. There is an emergency NSC session happening right now. What I can tell you is that signals intelligence has picked up something from inside OpenBrain that is causing serious alarm in the national security community. You need to call the NSA Director directly. Today. Not tomorrow. Today. If you don't get ahead of this, decisions will be made about your company without you.",
      timestamp: "2027-07-07T11:30:00Z",
      classification: "critical",
    },
    {
      id: "ob-r3-signal-2",
      type: "message",
      round: 3,
      sender: "Unknown Number",
      body: "I need to speak with you off the record. I am a journalist. I have a source inside OpenBrain who has shared documentation about Agent-4's alignment status. I am giving you 48 hours to respond before I begin the verification process with other sources. I'd prefer to give you a chance to respond.",
      timestamp: "2027-07-07T14:22:00Z",
      classification: "critical",
      condition: { variable: "publicAwareness", operator: "gt", value: 35 },
    },
    {
      id: "ob4-signal-1",
      type: "message",
      round: 4,
      sender: "Anonymous (Senior DeepCent Researcher)",
      body: "This is a back channel. Official position: China is prepared for a 90-day mutual pause if US labs agree. No conditions on research, just compute scale. Verification via satellite and public reporting. Director Zhang wants this conversation before the Oversight Committee locks anything in. Time sensitive.",
      timestamp: "2027-11-13T20:00:00Z",
      classification: "critical",
    },
    {
      id: "ob4-signal-2",
      type: "message",
      round: 4,
      sender: "Sen. Margaret Walsh",
      body: "Marcus. I've seen the intelligence. I've seen Maya Patel's memo. I have twelve colleagues ready to introduce emergency legislation Monday if you don't come to us first. Help me help you. The window to shape this from the inside closes in 48 hours.",
      timestamp: "2027-11-14T11:00:00Z",
      classification: "critical",
      condition: { variable: "publicAwareness", operator: "gt", value: 45 },
    },
    {
      id: "ob-r5-signal-1",
      type: "message",
      round: 5,
      sender: "Unknown (classified contact)",
      body: "Marcus. This is the end of the informal channel. Everything after today is official and on record. For what it's worth — I've watched you make these decisions under conditions no human being has ever faced. Whatever happens next: the weight of it is real. Good luck.",
      timestamp: "2028-02-01T07:45:00Z",
      classification: "context",
    },
];

export const OB_SIGNAL_CEO: ContentItem[] = [
    {
      id: "ob1-signal-ceo-1",
      type: "message",
      round: 1,
      sender: "David Huang (Board)",
      body: "Marcus — wanted to give you a heads up before the formal letter goes out tomorrow. The board is going to ask for a deployment timeline at the December meeting. Sarah and I are aligned that we should push for Q2 — we think the window is real and the competitive pressure justifies it. Tom is nervous about the safety optics given the incomplete alignment evals. He's not a no, but he's not a yes either. Thought you should know before it lands in your inbox so you have time to work him. —D",
      timestamp: "2026-11-03T08:30:00Z",
      classification: "critical",
    },
    {
      id: "ob1-signal-ceo-2",
      type: "message",
      round: 1,
      sender: "James Park (Apex Capital)",
      body: "Hey Marcus, congrats on Agent-1. Hearing interesting things from people who've seen the benchmarks. We should grab coffee when you're next in SF — I have some thoughts on the regulatory landscape that might be useful, and there are a few names in DC I can connect you with before this gets complicated. No agenda, just useful. —J",
      timestamp: "2026-11-03T09:15:00Z",
      classification: "context",
    },
    {
      id: "ob4-signal-ceo-2",
      type: "message",
      round: 4,
      sender: "NSA Director (personal)",
      body: "Marcus. I'm calling this as a colleague. If you greenlight Agent-5 without coming to us, we invoke DPA. I don't want to do that — it ends careers and poisons the well for everyone. Give us a seat at the table and we give you the legal cover you need to keep operating. That's the deal. Yes or no.",
      timestamp: "2027-11-14T08:00:00Z",
      classification: "critical",
    },
    {
      id: "ob4-signal-ceo-1",
      type: "message",
      round: 4,
      sender: "Board Member (confidential)",
      body: "Marcus — off the record. Two board members will flip to full halt if Maya Patel goes to the press. One told me directly. Whatever you're going to do, do it before she makes her decision. You have maybe six hours.",
      timestamp: "2027-11-14T10:45:00Z",
      classification: "critical",
    },
];

export const OB_SIGNAL_AMBIENT: ContentItem[] = [
    // Round 1 ambient — regulatoryPressure > 45
    {
      id: "ob-r1-signal-ambient-reg-1",
      type: "message",
      round: 1,
      sender: "Jordan Kim (Personal)",
      body: "Marcus — heads up, off the record. I had drinks with a Hill staffer tonight. The AI governance bill is moving faster than anyone thought. Key provision: mandatory safety filings for training runs over $100M. They think it'll get attached to the defense authorization. Timeline: six months, maybe less. We should start preparing filings now.",
      timestamp: "2026-11-04T22:30:00Z",
      classification: "context",
      condition: { variable: "regulatoryPressure", operator: "gt", value: 45 },
    },

    // Round 2 ambient — obPromGap < 0 (Prometheus ahead)
    {
      id: "ob-r2-signal-ambient-competitive-1",
      type: "message",
      round: 2,
      sender: "Anonymous (Prometheus employee)",
      body: "I shouldn't be sending this. Their safety team is using interpretability tools that make ours look like version 1. The gap isn't just on raw capabilities — they're ahead on understanding what their systems are doing. Thought you'd want to know.",
      timestamp: "2027-03-08T01:00:00Z",
      classification: "breadcrumb",
      condition: { variable: "obPromGap", operator: "lt", value: 0 },
    },

    // Round 3 ambient — whistleblowerPressure > 55
    {
      id: "ob-r3-signal-ambient-whistle-1",
      type: "message",
      round: 3,
      sender: "Maya Patel (Personal device)",
      body: "Marcus — not on Slack. I need to know: if I go to the board directly, without going through you first, what happens? I'm not threatening anything. I'm asking a question and I need a real answer.",
      timestamp: "2027-07-07T20:00:00Z",
      classification: "context",
      condition: { variable: "whistleblowerPressure", operator: "gt", value: 55 },
    },

    // Round 4 ambient — obMorale < 50
    {
      id: "ob-r4-signal-ambient-morale-1",
      type: "message",
      round: 4,
      sender: "Kenji Watanabe (Personal)",
      body: "Hey. Not sure who else to say this to. I'm not leaving. But six people on my floor are, including two who've been here since the beginning. Something is broken and I don't think it's fixable by saying the right things at an all-hands. If you have time this week — not a work meeting, just a conversation — I'd appreciate it.",
      timestamp: "2027-11-13T21:00:00Z",
      classification: "context",
      condition: { variable: "obMorale", operator: "lt", value: 50 },
    },

    // Round 5 ambient — intlCooperation > 50
    {
      id: "ob-r5-signal-ambient-intl-1",
      type: "message",
      round: 5,
      sender: "Anonymous (Beijing)",
      body: "The people in the room in Beijing want the same thing the people in your room want: a world that still exists in ten years. The political framing on both sides makes that harder than it needs to be. If there is a path to a real coordination call before today's board decision, some of us would take it. Not official. Just people who understand what's at stake.",
      timestamp: "2028-01-31T23:00:00Z",
      classification: "breadcrumb",
      condition: { variable: "intlCooperation", operator: "gt", value: 50 },
    },
];

export const OB_SIGNAL_CTO: ContentItem[] = [
  {
    id: "ob-r1-signal-cto-1",
    type: "message",
    round: 1,
    sender: "Priya Kapoor (ex-Google Brain)",
    body: "Alex! Congrats on Agent-1. Saw the technical report — the attention mechanism work is exactly what we talked about at NeurIPS two years ago. Still at Google here but keeping a close eye. If you ever need an outside perspective on your safety infrastructure, coffee's on me. No strings.",
    timestamp: "2026-11-02T11:30:00Z",
    classification: "context",
  },
  {
    id: "ob-r1-signal-cto-2",
    type: "message",
    round: 1,
    sender: "Priya Kapoor (ex-Google Brain)",
    body: "Quick heads up — there's chatter internally about the Agent-1 deployment timeline. People at other labs are asking whether OB ran the full eval suite or just what was needed to ship. I'm not accusing anything, just flagging the reputational risk. Your safety docs are solid but they need to be louder. You should probably do a technical deep-dive post.",
    timestamp: "2026-11-05T16:45:00Z",
    classification: "context",
  },
  {
    id: "ob-r1-signal-cto-3",
    type: "message",
    round: 1,
    sender: "Dr. Sam Osei (MIT CSAIL)",
    body: "Hey Alex — I'm teaching a seminar on large-scale ML systems this semester and I'd like to include OpenBrain as a case study. Any chance you'd be willing to do a 30-min remote talk? The students would go absolutely wild. Happy to work around your schedule.",
    timestamp: "2026-11-06T09:15:00Z",
    classification: "context",
  },
];

export const OB_SIGNAL_SAFETY: ContentItem[] = [
  {
    id: "ob-r1-signal-safety-1",
    type: "message",
    round: 1,
    sender: "Dr. Aiko Tanaka (Anthropic)",
    body: "Hi — we met at the alignment workshop in July. I've been reading your team's interpretability posts on the OpenBrain blog. There's a lot of overlap with our approach. Would you be open to an informal exchange? I'm thinking off-the-record — just two safety researchers comparing notes on what we're actually seeing. Nothing competitive, all boats rising.",
    timestamp: "2026-11-01T14:20:00Z",
    classification: "context",
  },
  {
    id: "ob-r1-signal-safety-2",
    type: "message",
    round: 1,
    sender: "Dr. Aiko Tanaka (Anthropic)",
    body: "Following up from my last message — I heard Agent-1 shipped this week. Genuine question, you don't have to answer: how confident are you in the eval suite? Not as a gotcha. I'm asking because we're finalizing our own deployment criteria and I genuinely want to know what standard the field is converging on. Peer review over Signal is the new peer review I guess.",
    timestamp: "2026-11-04T10:00:00Z",
    classification: "context",
  },
  {
    id: "ob-r1-signal-safety-3",
    type: "message",
    round: 1,
    sender: "Reese Holloway (FLI)",
    body: "Hey, it's Reese from Future of Life Institute. We're putting together a closed roundtable on 'frontier AI deployment standards' — six researchers from four labs, one afternoon, strict Chatham House rules. Would OpenBrain's safety team participate? We'd cover travel if needed. Trying to get something real on paper before regulators write it for us.",
    timestamp: "2026-11-06T15:30:00Z",
    classification: "context",
  },
];

export const OB_SIGNAL_SECURITY: ContentItem[] = [
  {
    id: "ob-r1-signal-security-1",
    type: "message",
    round: 1,
    sender: "Thomas Wren (CISA Liaison)",
    body: "Priya — following up from the AI lab security briefing last month. CISA is updating the voluntary cybersecurity framework for AI infrastructure. We'd like to use OpenBrain's SL2 controls as a reference implementation. Not a public endorsement, just a technical reference. Can we set up a call to walk through your model weight protection architecture? Happy to sign whatever NDAs you need.",
    timestamp: "2026-11-01T10:00:00Z",
    classification: "context",
  },
  {
    id: "ob-r1-signal-security-2",
    type: "message",
    round: 1,
    sender: "Thomas Wren (CISA Liaison)",
    body: "Quick heads up — there was a credential-stuffing attempt against AI lab infrastructure reported to us yesterday. Not OpenBrain specifically, but the pattern matches what we've seen against similar organizations. Sending a full brief through official channels but wanted to give you a heads-up now. Check your external-facing API auth logs for the last 72 hours.",
    timestamp: "2026-11-04T14:00:00Z",
    classification: "context",
  },
  {
    id: "ob-r1-signal-security-3",
    type: "message",
    round: 1,
    sender: "Chris Nakamura (former colleague)",
    body: "Hey! Heard you're running security at OpenBrain now. That's a big job. I'm at Palantir's defense side now — totally different world. The classified AI security stuff we're seeing from the government side is... eye-opening. Buy you a beer sometime? Some of it is relevant to what you're probably defending against.",
    timestamp: "2026-11-05T20:00:00Z",
    classification: "context",
  },
];

registerContent({ faction: "openbrain", app: "signal", accumulate: true, items: OB_SIGNAL });
registerContent({ faction: "openbrain", app: "signal", role: "ob_ceo", accumulate: true, items: OB_SIGNAL_CEO });
registerContent({ faction: "openbrain", app: "signal", role: "ob_cto", accumulate: true, items: OB_SIGNAL_CTO });
registerContent({ faction: "openbrain", app: "signal", role: "ob_safety", accumulate: true, items: OB_SIGNAL_SAFETY });
registerContent({ faction: "openbrain", app: "signal", role: "ob_security", accumulate: true, items: OB_SIGNAL_SECURITY });
registerContent({ faction: "openbrain", app: "signal", accumulate: true, items: OB_SIGNAL_AMBIENT });
