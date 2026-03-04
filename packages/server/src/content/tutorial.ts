import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "./loader.js";

export const SHARED_CLASSIFICATION_TUTORIAL: ContentItem[] = [
    {
      id: "tut-shared-classification-1",
      type: "message",
      round: 0,
      sender: "Game System",
      subject: "Intel Classification Guide",
      body: "[TUTORIAL] Each piece of intel is tagged: critical = time-sensitive and decision-relevant; breadcrumb = a lead that may require follow-up to develop; context = atmosphere and background; red-herring = may be deliberately misleading. Use classifications to triage what to act on now versus file for later.",
      timestamp: "2026-01-01T08:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "openbrain", app: "gamestate", accumulate: false, items: SHARED_CLASSIFICATION_TUTORIAL });
registerContent({ faction: "prometheus", app: "gamestate", accumulate: false, items: SHARED_CLASSIFICATION_TUTORIAL });
registerContent({ faction: "china", app: "gamestate", accumulate: false, items: SHARED_CLASSIFICATION_TUTORIAL });
registerContent({ faction: "external", app: "gamestate", accumulate: false, items: SHARED_CLASSIFICATION_TUTORIAL });

export const OB_GAMESTATE: ContentItem[] = [
    {
      id: "tut-ob-state-1",
      type: "message",
      round: 0,
      sender: "Game System",
      subject: "Your Fog-of-War Dashboard",
      body: "[TUTORIAL] This is your view of the world state. You don't see everything — information is filtered by your role and faction. Numbers shown as ranges (~X ± Y) indicate estimates. Hidden values appear as ???. As the game progresses, your visibility may improve or degrade depending on what you and other players decide.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "openbrain", app: "gamestate", accumulate: false, items: OB_GAMESTATE });

export const PROM_GAMESTATE: ContentItem[] = [
    {
      id: "tut-prom-state-1",
      type: "message",
      round: 0,
      sender: "Game System",
      subject: "Your Fog-of-War Dashboard",
      body: "[TUTORIAL] This is your view of the world state. As Prometheus, you have high visibility into alignment metrics but may have less precision on competitor capability levels. Use this dashboard to track how your decisions move the safety-capability gap — the number that matters most.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "prometheus", app: "gamestate", accumulate: false, items: PROM_GAMESTATE });

export const CHINA_GAMESTATE: ContentItem[] = [
    {
      id: "tut-china-state-1",
      type: "message",
      round: 0,
      sender: "Game System",
      subject: "Your Fog-of-War Dashboard",
      body: "[TUTORIAL] As China, you're most blind to US lab internals and their actual alignment confidence. You have good visibility on capability gaps but limited insight into what OpenBrain and Prometheus actually know about safety. Monitor the gap metrics carefully.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "china", app: "gamestate", accumulate: false, items: CHINA_GAMESTATE });

export const EXT_GAMESTATE: ContentItem[] = [
    {
      id: "tut-ext-state-1",
      type: "message",
      round: 0,
      sender: "Game System",
      subject: "Your Fog-of-War Dashboard",
      body: "[TUTORIAL] As an External Stakeholder, your state view reflects public information — what the world knows. You have good visibility on public awareness and sentiment, but limited insight into lab internals. Your power is influence: you shape what others know.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "external", app: "gamestate", accumulate: false, items: EXT_GAMESTATE });
