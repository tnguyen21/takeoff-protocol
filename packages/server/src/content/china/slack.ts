import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const CHINA_SLACK: ContentItem[] = [
    {
      id: "tut-china-slack-1",
      type: "message",
      round: 0,
      sender: "Tutorial Bot",
      channel: "#general",
      body: "[TUTORIAL] Welcome to DeepCent's coordination channel! This is where your team communicates. Your Slack communications are visible to your faction, not to others — unless there's a leak.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "china", app: "slack", accumulate: true, items: CHINA_SLACK });
