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

registerContent({ faction: "openbrain", app: "signal", accumulate: true, items: OB_SIGNAL });
registerContent({ faction: "openbrain", app: "signal", role: "ob_ceo", accumulate: true, items: OB_SIGNAL_CEO });
