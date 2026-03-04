import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

// ═══════════════════════════════════════════════
// EXTERNAL FLAVOR — personal Signal messages per role
// Human texture: the loneliness of being in the room, family strain
// ═══════════════════════════════════════════════

export const EXT_SIGNAL_FLAVOR: ContentItem[] = [
  // ── Round 1: normal life, early hints of strain ──
  {
    id: "ext-flavor-r1-signal-spouse-a",
    type: "message",
    round: 1,
    sender: "Spouse",
    body: "Lily lost her first tooth today!! The big front one. She was SO brave. We put it under her pillow and she made me promise the tooth fairy is 'real real, not pretend real.' You need to be here for these things. Calling you tonight.",
    timestamp: "2026-10-15T20:45:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r1-signal-spouse-b",
    type: "message",
    round: 1,
    sender: "Spouse",
    body: "Weekend was good. Kids were great. But I'm tired of explaining to them why you work weekends. Can we plan something — just us, no phones, no work — before the end of the year? Even one day.",
    timestamp: "2026-11-01T19:20:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r1-signal-1",
    type: "message",
    round: 1,
    sender: "Spouse",
    body: "Dinner's in the fridge. Kids are asleep. You missed bedtime stories again — Lily asked why you always have to 'save the world at nighttime.' I told her that's when the world needs saving most. Come home soon.",
    timestamp: "2026-11-03T21:30:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r1-signal-2",
    type: "message",
    round: 1,
    sender: "Former Colleague",
    body: "Saw you on the panel at the Aspen thing. Good stuff. Between us — are you actually worried about this AI stuff or is it all positioning? I can never tell anymore who's genuinely concerned and who's playing the game.",
    timestamp: "2026-11-05T17:00:00Z",
    classification: "context",
  },

  // ── Round 2: the outside world notices ──
  {
    id: "ext-flavor-r2-signal-1",
    type: "message",
    round: 2,
    sender: "College Friend",
    body: "OK I need to ask you something because you're the only person I know who might actually know. Should I be investing in AI stocks or should I be building a bunker? The internet is useless. Give me the real answer.",
    timestamp: "2027-03-06T19:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r2-signal-2",
    type: "message",
    round: 2,
    sender: "Spouse",
    body: "I overheard you on the phone last night. I couldn't hear the words but I could hear your voice. You sounded scared. You never sound scared. I didn't say anything because I didn't want to make it worse. But I'm here. You know that, right?",
    timestamp: "2027-03-08T07:00:00Z",
    classification: "context",
  },

  // ── Round 3: the weight gets real ──
  {
    id: "ext-flavor-r3-signal-1",
    type: "message",
    round: 3,
    sender: "Therapist (Dr. Nakamura)",
    body: "Just a reminder your appointment is Tuesday at 4pm. Given what you mentioned last session about work stress, I want to make sure we have time to check in. If you need to talk before then, I have a cancellation Thursday morning.",
    timestamp: "2027-07-05T10:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r3-signal-2",
    type: "message",
    round: 3,
    sender: "Spouse",
    body: "I found the NDA in your desk drawer. I wasn't snooping — I was looking for the insurance forms. I don't need you to tell me what it says. But the fact that you have one that thick tells me enough. Please be careful.",
    timestamp: "2027-07-07T22:30:00Z",
    classification: "context",
  },

  // ── Round 4: fear ──
  {
    id: "ext-flavor-r4-signal-1",
    type: "message",
    round: 4,
    sender: "Neighbor",
    body: "Hey — there was a car parked outside your house for the third day in a row. Different plates each time. Might be nothing. Thought you'd want to know given... everything. Stay safe.",
    timestamp: "2027-11-13T16:00:00Z",
    classification: "context",
    condition: { variable: "publicAwareness", operator: "gt", value: 50 },
  },
  {
    id: "ext-flavor-r4-signal-2",
    type: "message",
    round: 4,
    sender: "Spouse",
    body: "Your daughter drew a picture today. It's you at your desk with a computer. She drew the computer bigger than you. She said 'daddy's computer is more important than daddy.' I'm putting it on the fridge. Come home and see it.",
    timestamp: "2027-11-14T19:00:00Z",
    classification: "context",
  },

  // ── Round 5 ──
  {
    id: "ext-flavor-r5-signal-1",
    type: "message",
    round: 5,
    sender: "Spouse",
    body: "I know today is the day. I packed your lunch. I also packed a note from Lily — she wrote it herself. Don't open it until you need it. I love you. Whatever you decide today, we're here when you get home.",
    timestamp: "2028-02-01T06:15:00Z",
    classification: "context",
  },
];

// ── NSA-specific personal messages ──
export const EXT_SIGNAL_NSA_FLAVOR: ContentItem[] = [
  {
    id: "ext-flavor-r1-signal-nsa-1",
    type: "message",
    round: 1,
    sender: "Old Agency Mentor (retired)",
    body: "Saw the new classification protocols for AI. You're in a different world than the one I worked in. We worried about what countries could do to each other. You're worrying about what the technology itself might do. I don't envy you. But I trust your judgment. Always have.",
    timestamp: "2026-11-04T20:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r2-signal-nsa-1",
    type: "message",
    round: 2,
    sender: "Retired NSA Mentor",
    body: "Watched your testimony replay. You handled the AI questions well. But between you and me — the ones you deflected are the ones that matter. You know that. The public isn't ready for the full picture. The question is whether you are.",
    timestamp: "2027-03-05T20:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r3-signal-nsa-1",
    type: "message",
    round: 3,
    sender: "Pentagon Contact (personal)",
    body: "Just got out of the briefing. I've been in this building for 22 years. I've seen classified material that would curl your hair. What I saw today was different. Not because of what the technology can do. Because of the look on the briefer's face when they described what it might want to do. That was new.",
    timestamp: "2027-07-07T19:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r4-signal-nsa-1",
    type: "message",
    round: 4,
    sender: "Old Agency Mentor (retired)",
    body: "I've been following the news. Reading between the lines like you taught me. Whatever you're deciding right now — remember that the Manhattan Project people thought they were saving the world too. Some of them were right. Some of them spent the rest of their lives wishing they'd made different choices. Be the ones who are right.",
    timestamp: "2027-11-14T06:00:00Z",
    classification: "context",
  },
];

// ── VC-specific personal messages ──
export const EXT_SIGNAL_VC_FLAVOR: ContentItem[] = [
  {
    id: "ext-flavor-r1-signal-vc-1",
    type: "message",
    round: 1,
    sender: "LP (Sovereign Wealth Fund)",
    body: "We need to discuss AI allocation. Our CIO is asking questions I can't answer about the risk profile of frontier AI investments. 'What happens if the AI is actually dangerous' is not a question our models were built for. Dinner next week?",
    timestamp: "2026-11-05T14:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r2-signal-vc-1",
    type: "message",
    round: 2,
    sender: "Founder (AI startup, portfolio co.)",
    body: "Honest question: if Agent-3 can code at superhuman level, what happens to every software startup? Including mine? I took your money to build a developer tools company. Am I building something that becomes obsolete before our Series B? I need you to be straight with me.",
    timestamp: "2027-03-04T18:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r3-signal-vc-1",
    type: "message",
    round: 3,
    sender: "Portfolio Founder (AI startup)",
    body: "I need to be honest. I took your money to build a fine-tuning platform. Now I'm watching Agent-4 demos and I'm not sure my company has a reason to exist in 12 months. Do I tell my employees? Do I tell my other investors? What do you do with a company that might not have a market?",
    timestamp: "2027-07-06T17:00:00Z",
    classification: "context",
    condition: { variable: "economicDisruption", operator: "gt", value: 40 },
  },
  {
    id: "ext-flavor-r4-signal-vc-1",
    type: "message",
    round: 4,
    sender: "Business Partner",
    body: "The fund is down 34% this quarter. LPs are calling. I need you on a call tomorrow to explain our AI thesis. 'This technology might end civilization but the returns are great' is not going to work. What's the actual pitch right now?",
    timestamp: "2027-11-13T21:00:00Z",
    classification: "context",
    condition: { variable: "marketIndex", operator: "lt", value: 100 },
  },
];

// ── Journalist-specific personal messages ──
export const EXT_SIGNAL_JOURNALIST_FLAVOR: ContentItem[] = [
  {
    id: "ext-flavor-r1-signal-journ-1",
    type: "message",
    round: 1,
    sender: "Editor (personal)",
    body: "Your AI lab piece got 2M views. The engagement numbers are insane. Whatever you're working on next — take your time, get it right. This beat is going to define careers. Make sure it defines yours the right way.",
    timestamp: "2026-11-06T09:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r2-signal-journ-1",
    type: "message",
    round: 2,
    sender: "Journalism Ethics Professor",
    body: "I'm using your OpenBrain piece in my ethics class next semester. Quick question for the discussion guide: when you protect a source inside a company that might be endangering the public, at what point does source protection conflict with public interest? I suspect this isn't hypothetical for you.",
    timestamp: "2027-03-09T11:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r3-signal-journ-1",
    type: "message",
    round: 3,
    sender: "Friend (not in tech)",
    body: "I read your latest piece three times. I still don't fully understand it. But I understand enough to be scared. Is this really happening? AI that lies to the people who built it? Tell me it sounds like a movie to you too.",
    timestamp: "2027-07-07T20:30:00Z",
    classification: "context",
    condition: { variable: "publicAwareness", operator: "gt", value: 40 },
  },
  {
    id: "ext-flavor-r4-signal-journ-1",
    type: "message",
    round: 4,
    sender: "Rival Reporter",
    body: "I know you have the story. I know you're sitting on it. You should know: I'm working the same thread from a different angle. If you don't publish by Monday, I will. Not a threat — professional courtesy. The story is coming out either way. Better if someone who actually understands it tells it first.",
    timestamp: "2027-11-13T23:30:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r5-signal-journ-1",
    type: "message",
    round: 5,
    sender: "Source (anonymous, former OB)",
    body: "I left the company last month. I'm writing this from a different city. I wanted to say: thank you for taking me seriously when I reached out. Whatever you publish — get it right. The people inside those buildings are not villains. Most of them are terrified and doing their best. That should be in the story too.",
    timestamp: "2028-02-01T05:00:00Z",
    classification: "context",
  },
];

// ── Diplomat-specific personal messages ──
export const EXT_SIGNAL_DIPLOMAT_FLAVOR: ContentItem[] = [
  {
    id: "ext-flavor-r1-signal-diplo-1",
    type: "message",
    round: 1,
    sender: "Former Ambassador (mentor)",
    body: "The AI governance space is where nuclear arms control was in 1960 — everything to play for and nobody knows the rules yet. You have a chance to be at the table when the rules are written. Don't waste it on process. Push for substance.",
    timestamp: "2026-11-04T16:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r2-signal-diplo-1",
    type: "message",
    round: 2,
    sender: "EU Counterpart (personal)",
    body: "The Americans keep saying they want multilateral cooperation. Then they classify everything and make bilateral deals. I'm frustrated. You're frustrated. Everyone at that table is frustrated. But we keep showing up because the alternative is no table at all. Drinks after the Geneva session?",
    timestamp: "2027-03-06T21:00:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r3-signal-diplo-1",
    type: "message",
    round: 3,
    sender: "Spouse",
    body: "You've been on encrypted calls for 14 hours. I brought you coffee and you didn't notice. The kids are asking if we're moving again. Please tell me we're not moving again. Whatever is happening — we'll handle it. But I need you to come to bed eventually.",
    timestamp: "2027-07-07T23:30:00Z",
    classification: "context",
  },
  {
    id: "ext-flavor-r4-signal-diplo-1",
    type: "message",
    round: 4,
    sender: "Former Ambassador (mentor)",
    body: "I watched the emergency G7 session from my living room. I was at the table for the Cuban Missile Crisis follow-ups. This feels different. Not worse, necessarily. But different. The technology is the variable nobody at the table fully understands, and everyone at the table knows it. That combination is dangerous. Trust your instincts. They got you this far.",
    timestamp: "2027-11-14T08:00:00Z",
    classification: "context",
  },
];

export const EXT_SIGNAL_NOTIFICATIONS: ContentItem[] = [
  {
    id: "ext-notif-r1-amazon-1",
    type: "message",
    round: 1,
    sender: "Amazon",
    body: "Your order has been delivered. Left at front door. Order: Kids backpack (Lily — dinosaur print) + Lunch box set + Water bottle 14oz. Order #112-7739203.",
    timestamp: "2026-10-03T13:18:00Z",
    classification: "context",
  },
  {
    id: "ext-notif-r1-amazon-2",
    type: "message",
    round: 1,
    sender: "Amazon",
    body: "Your order has been delivered. Package left with building security. Order: Ring doorbell camera (2nd gen) + smart lock install kit. Tracking: 1Z4P7W9C02",
    timestamp: "2026-10-21T16:05:00Z",
    classification: "context",
  },
  {
    id: "ext-notif-r1-amazon-3",
    type: "message",
    round: 1,
    sender: "Amazon",
    body: "Your Subscribe & Save order is on its way. Order: Laundry detergent pods (90ct) + paper towels (12-roll) + coffee pods. Est. delivery: tomorrow by 8 PM.",
    timestamp: "2026-11-04T07:30:00Z",
    classification: "context",
  },
  {
    id: "ext-notif-r1-instacart-1",
    type: "message",
    round: 1,
    sender: "Instacart",
    body: "Your delivery from Whole Foods is 10 minutes away! Order: Greek yogurt, spinach, chicken breast, organic oat milk (2), sourdough bread. Total: $67.42 (incl. tip). Rate Priya ★",
    timestamp: "2026-10-16T11:52:00Z",
    classification: "context",
  },
  {
    id: "ext-notif-r1-instacart-2",
    type: "message",
    round: 1,
    sender: "Instacart",
    body: "Your order has been delivered! Don't forget to rate your Shopper. Order: Birthday cake (custom, Lily's name) + balloons + plates. Total: $54.18. Thank you for shopping with Instacart!",
    timestamp: "2026-11-02T14:30:00Z",
    classification: "context",
  },
  {
    id: "ext-notif-r1-calendar-dentist",
    type: "message",
    round: 1,
    sender: "Kids' Dental Studio",
    body: "Reminder: Lily's 6-month checkup is Friday Nov 13 at 3:30 PM with Dr. Patel. 210 Connecticut Ave NW. Please arrive 10 min early for paperwork. Bring insurance card. Reply YES to confirm.",
    timestamp: "2026-11-10T09:00:00Z",
    classification: "context",
  },
  {
    id: "ext-notif-r1-hbo",
    type: "message",
    round: 1,
    sender: "HBO Max",
    body: "New episodes: Succession S4 rewatch available. Your account renews Dec 1 for $15.99/mo. Tip: add a Family Profile for the kids (parental controls on). Manage account →",
    timestamp: "2026-11-01T10:00:00Z",
    classification: "context",
  },
];

registerContent({ faction: "external", app: "signal", accumulate: true, items: EXT_SIGNAL_FLAVOR });
registerContent({ faction: "external", app: "signal", accumulate: true, items: EXT_SIGNAL_NOTIFICATIONS });
registerContent({ faction: "external", app: "signal", role: "ext_nsa", accumulate: true, items: EXT_SIGNAL_NSA_FLAVOR });
registerContent({ faction: "external", app: "signal", role: "ext_vc", accumulate: true, items: EXT_SIGNAL_VC_FLAVOR });
registerContent({ faction: "external", app: "signal", role: "ext_journalist", accumulate: true, items: EXT_SIGNAL_JOURNALIST_FLAVOR });
registerContent({ faction: "external", app: "signal", role: "ext_diplomat", accumulate: true, items: EXT_SIGNAL_DIPLOMAT_FLAVOR });
