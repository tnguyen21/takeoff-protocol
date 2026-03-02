import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const OB_TWITTER: ContentItem[] = [
    {
      id: "ob-r3-twitter-1",
      type: "tweet",
      round: 3,
      sender: "@yoshibengio_ml",
      body: "Something is happening. Multiple people I trust at frontier labs — not naming which — have gone very quiet at the same time. When AI safety researchers get quiet simultaneously, it's usually because they've seen something and don't know how to talk about it. I'm worried.",
      timestamp: "2027-07-07T13:00:00Z",
      classification: "breadcrumb",
    },
    {
      id: "ob-r3-twitter-2",
      type: "tweet",
      round: 3,
      sender: "@aistrike_watcher",
      body: "THREAD: Things that don't add up about the OpenBrain 'emergency consultations' story. 1) The NSA Director doesn't do 'precautionary consultations.' That is not a thing that happens. 2) The market move today was front-run — someone knew before the announcement. 3) The timing aligns with their Agent-4 deployment window. Draw your own conclusions.",
      timestamp: "2027-07-07T20:00:00Z",
      classification: "breadcrumb",
    },
    // --- AMBIENT CONDITION-GATED ITEMS ---

    // Round 1 ambient — publicAwareness > 50
    {
      id: "ob-r1-twitter-ambient-1",
      type: "tweet",
      round: 1,
      sender: "@ai_skeptic_pete",
      body: "OpenBrain's Agent-1 'research automation tool' is doing things no one is talking about publicly. I've seen the benchmarks. 50% R&D speedup is the conservative estimate. The lab knows what it has and it's saying almost nothing. This is not a normal product launch situation.",
      timestamp: "2026-11-05T22:00:00Z",
      classification: "context",
      condition: { variable: "publicAwareness", operator: "gt", value: 50 },
    },

    // Round 2 ambient — alignmentConfidence > 75
    {
      id: "ob-r2-twitter-ambient-align-1",
      type: "tweet",
      round: 2,
      sender: "@safetyresearcher_anon",
      body: "Contrary to the doomer takes: OpenBrain's safety team is genuinely doing serious work. Maya Patel's alignment approach is not theater. The anomaly reports are exactly what a conscientious safety team looks like. This is hard to get right. That they're trying is meaningful.",
      timestamp: "2027-03-03T18:00:00Z",
      classification: "context",
      condition: { variable: "alignmentConfidence", operator: "gt", value: 75 },
    },

    // Round 2 ambient — obPromGap < 0 (Prometheus ahead)
    {
      id: "ob-r2-twitter-ambient-competitive-1",
      type: "tweet",
      round: 2,
      sender: "@techcompetition_watch",
      body: "Prometheus just dropped their Q1 capability disclosure. Their alignment-adjusted benchmark numbers are ahead of what OpenBrain has published. This is the first time Prometheus has been clearly ahead on a public metric. The race just got tighter.",
      timestamp: "2027-03-07T12:00:00Z",
      classification: "context",
      condition: { variable: "obPromGap", operator: "lt", value: 0 },
    },

    // Round 3 ambient — aiAutonomyLevel > 50
    {
      id: "ob-r3-twitter-ambient-autonomy-1",
      type: "tweet",
      round: 3,
      sender: "@yoshibengio_ml",
      body: "The framing of 'human-in-the-loop' is increasingly misleading when the loop runs at 1000x human cognitive speed. The human is technically in the loop. But they cannot actually keep up. This is an autonomy problem that 'oversight' language obscures. We need new vocabulary.",
      timestamp: "2027-07-05T14:30:00Z",
      classification: "context",
      condition: { variable: "aiAutonomyLevel", operator: "gt", value: 50 },
    },

    // Round 3 ambient — whistleblowerPressure > 55
    {
      id: "ob-r3-twitter-ambient-whistle-1",
      type: "tweet",
      round: 3,
      sender: "@anonymousfrontier",
      body: "The question isn't whether someone will leak. It's whether the leak comes before or after something goes wrong. At one frontier lab (not saying which), the gap between what leadership knows and what they're saying publicly is wider than I've ever seen it. I work there. I'm thinking about my options.",
      timestamp: "2027-07-07T17:00:00Z",
      classification: "breadcrumb",
      condition: { variable: "whistleblowerPressure", operator: "gt", value: 55 },
    },

    // Round 4 ambient — publicAwareness > 50
    {
      id: "ob-r4-twitter-ambient-pr-1",
      type: "tweet",
      round: 4,
      sender: "@aipanic_tracker",
      body: "Summary of OpenBrain coverage this week: NYT (cover), Atlantic (cover), WaPo (three stories), congressional testimony (4 mentions), two major podcasts, one 60 Minutes segment in production. When you have this level of coverage with zero on-record sources from the company — the silence itself becomes the story.",
      timestamp: "2027-11-14T09:30:00Z",
      classification: "context",
      condition: { variable: "publicAwareness", operator: "gt", value: 50 },
    },

    // Round 5 ambient — doomClockDistance < 2
    {
      id: "ob-r5-twitter-ambient-doom-1",
      type: "tweet",
      round: 5,
      sender: "@yoshibengio_ml",
      body: "The decisions being made in the next 72 hours will be among the most consequential in human history. I do not say this for effect. I say it because it is true, and the people making them deserve to know that people outside those rooms are watching, and holding hope.",
      timestamp: "2028-02-01T07:00:00Z",
      classification: "context",
      condition: { variable: "doomClockDistance", operator: "lt", value: 2 },
    },
];

registerContent({ faction: "openbrain", app: "twitter", accumulate: false, items: OB_TWITTER });
