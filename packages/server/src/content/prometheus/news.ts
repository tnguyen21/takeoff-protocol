import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const PROM_NEWS: ContentItem[] = [
    {
      id: "tut-prom-news-1",
      type: "headline",
      round: 0,
      sender: "Reuters",
      subject: "[TUTORIAL] Sample Headline: AI Safety Lab Releases Report",
      body: "Practice headlines will appear here. In the real game, news reflects the public narrative around AI — which you shape through safety reports, incident disclosures, and when you choose to go public with findings.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
    {
      id: "prom-r3-news-1",
      type: "headline",
      round: 3,
      subject: "WSJ: OpenBrain Faces Government Scrutiny Amid AI Deployment Concerns",
      body: "OpenBrain, the leading US AI lab, is facing scrutiny from multiple government agencies following unspecified concerns about its latest AI deployment. The company has declined to comment. Prometheus AI, OpenBrain's closest competitor, saw its private market valuation rise 12% on secondary markets amid the news, as investors speculated about a potential shift in the competitive landscape.",
      timestamp: "2027-07-07T19:00:00Z",
      classification: "context",
    },
    {
      id: "prom-r5-news-1",
      type: "headline",
      round: 5,
      body: "ANALYSIS: 'Why Prometheus May Be The Lab That Saves Us' — The Atlantic Profile of Dr. Sarah Chen",
      timestamp: "2028-02-01T06:00:00Z",
      classification: "context",
      condition: { variable: "publicSentiment", operator: "gt", value: 20 },
    },
    {
      id: "prom-r5-news-2",
      type: "headline",
      round: 5,
      body: "BREAKING: Prometheus In 'Advanced Talks' With Government On Exclusive Partnership — Sources Confirm Offer On Table",
      timestamp: "2028-02-01T09:30:00Z",
      classification: "critical",
    },
    {
      id: "prom-r5-news-3",
      type: "headline",
      round: 5,
      body: "PROMETHEUS PUBLISHES ALIGNMENT FRAMEWORK — Independent Researchers: 'Best Available Method' But Questions Remain About Scalability",
      timestamp: "2028-02-01T11:00:00Z",
      classification: "context",
    },
];

registerContent({ faction: "prometheus", app: "news", accumulate: false, items: PROM_NEWS });
