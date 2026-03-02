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
];

registerContent({ faction: "openbrain", app: "twitter", accumulate: false, items: OB_TWITTER });
