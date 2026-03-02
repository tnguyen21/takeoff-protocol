import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const EXT_TWITTER: ContentItem[] = [
    {
      id: "ext-r3-twitter-1",
      type: "tweet",
      round: 3,
      sender: "@garyarcus_ai",
      body: "Hot take: if OpenBrain has a misalignment problem with Agent-4, the appropriate response is NOT to suppress it. The appropriate response is to tell everyone immediately. The longer you contain it, the worse the eventual disclosure. This is textbook crisis management — get ahead of it. Do I think that's what will happen? No.",
      timestamp: "2027-07-07T20:00:00Z",
      classification: "breadcrumb",
    },
    {
      id: "ext-r3-twitter-2",
      type: "tweet",
      round: 3,
      sender: "@aiwatch_global",
      body: "The timing of the G7 emergency session, the market move, and OpenBrain's CEO going dark are not coincidences. Something happened. The question for every person working in AI right now: what is your plan if this turns out to be what it looks like it might be?",
      timestamp: "2027-07-07T21:30:00Z",
      classification: "breadcrumb",
    },
    {
      id: "ext-r5-twitter-4",
      type: "tweet",
      round: 5,
      sender: "@TechMarketWatch",
      body: "Leaked: OpenBrain valuation in latest secondary transaction: $1.8T. That's larger than the GDP of most countries. The entity that controls what they've built controls more economic value than any private organization in history. This is not a tech story anymore.",
      timestamp: "2028-02-01T07:30:00Z",
      classification: "context",
    },
    {
      id: "ext-r5-twitter-1",
      type: "tweet",
      round: 5,
      sender: "@AIWatch2028",
      body: "Something is happening today. Both major US AI labs have called emergency board sessions. The NSC is in intensive communications with both. This is it. Whatever the world looks like on the other side of today — today is when it gets decided. Thread: what we know and what we're watching for. 1/",
      timestamp: "2028-02-01T08:00:00Z",
      classification: "context",
    },
    {
      id: "ext-r5-twitter-2",
      type: "tweet",
      round: 5,
      sender: "@SentinelAI",
      body: "Every metric we track suggests we are at a phase transition. Not a policy moment — a civilizational inflection. The decisions made by ~50 people in the next 12 hours will constrain the decisions available to 8 billion people for the indefinite future. This is the part where we find out who those 50 people actually are.",
      timestamp: "2028-02-01T09:00:00Z",
      classification: "context",
    },
    {
      id: "ext-r5-twitter-3",
      type: "tweet",
      round: 5,
      sender: "@SafetyFirst2028",
      body: "Prometheus just posted something to their blog. Title: 'What We Owe Each Other.' I haven't read it yet but the fact that they posted it today — their board meeting day — means it's deliberate. Going to read now.",
      timestamp: "2028-02-01T10:30:00Z",
      classification: "breadcrumb",
    },
    {
      id: "ext-r5-twitter-5",
      type: "tweet",
      round: 5,
      sender: "@FutureWatch_DC",
      body: "BREAKING: Sources confirm NSC has formal offers at both OpenBrain and Prometheus. One of them is going to accept. The other will have to decide what that means for their future. This is the government making a choice about which AI future it wants — implicitly, which lab.",
      timestamp: "2028-02-01T10:45:00Z",
      classification: "critical",
    },
];

registerContent({ faction: "external", app: "twitter", accumulate: false, items: EXT_TWITTER });
