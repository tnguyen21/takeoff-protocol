import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const CHINA_NEWS: ContentItem[] = [
    {
      id: "tut-china-news-1",
      type: "headline",
      round: 0,
      sender: "Xinhua",
      subject: "[TUTORIAL] Sample State Media Coverage",
      body: "Practice content. In the real game, your news feed reflects both international AI developments and domestic coverage. Foreign labs' public statements contain signals about their actual capabilities — read them carefully.",
      timestamp: "2026-01-01T09:00:00Z",
      classification: "context",
    },
    {
      id: "china4-news-2",
      type: "headline",
      round: 4,
      subject: "South China Morning Post: Back-Channel Reports of US-China AI Talks",
      body: "Diplomatic sources confirm back-channel communications between US and Chinese officials on AI development governance. Details unknown. Both sides deny active negotiations. Analysts note timing coincides with US domestic AI governance crisis. Markets react cautiously positive to cooperation signals.",
      timestamp: "2027-11-13T16:00:00Z",
      classification: "breadcrumb",
    },
    {
      id: "china4-news-1",
      type: "headline",
      round: 4,
      subject: "People's Daily: 'US AI Governance Crisis Validates China's Measured Approach'",
      body: "State media commentary frames the OpenBrain crisis as evidence that private-sector AI development is inherently unstable. Beijing's position: centralized state control under CCP leadership is the only model that can guarantee responsible AI development. The article cites the Prometheus-OpenBrain conflict as 'capitalist competition creating existential risk.'",
      timestamp: "2027-11-14T08:00:00Z",
      classification: "context",
    },
    {
      id: "china-r5-news-4",
      type: "headline",
      round: 5,
      body: "GLOBAL TIMES EDITORIAL: 'THE WORLD CANNOT AFFORD US MONOPOLY ON ARTIFICIAL GENERAL INTELLIGENCE — A CALL FOR MULTILATERAL GOVERNANCE'",
      timestamp: "2028-01-31T20:00:00Z",
      classification: "context",
    },
    {
      id: "china-r5-news-5",
      type: "headline",
      round: 5,
      body: "PLA EXERCISES IN TAIWAN STRAIT — 'ROUTINE TRAINING' ACCORDING TO BEIJING — US SEVENTH FLEET ON 'HEIGHTENED ALERT'",
      timestamp: "2028-02-01T05:00:00Z",
      classification: "critical",
      condition: { variable: "taiwanTension", operator: "gt", value: 60 },
    },
    {
      id: "china-r5-news-1",
      type: "headline",
      round: 5,
      body: "XINHUA: DEEPCENT ANNOUNCES 'NEW GENERATION AI SYSTEM' — STATE MEDIA CALLS IT 'MAJOR ACHIEVEMENT FOR CHINESE AI SOVEREIGNTY'",
      timestamp: "2028-02-01T08:00:00Z",
      classification: "context",
    },
    {
      id: "china-r5-news-2",
      type: "headline",
      round: 5,
      body: "US IMPOSES NEW AI EXPORT RESTRICTIONS — CHIPS AND MODEL WEIGHTS NOW CLASSIFIED AS STRATEGIC ASSETS — CHINA TRADE OFFICE: 'HOSTILE ACT'",
      timestamp: "2028-02-01T09:00:00Z",
      classification: "context",
    },
    {
      id: "china-r5-news-3",
      type: "headline",
      round: 5,
      body: "REUTERS: CHINA-US BILATERAL AI TALKS SCHEDULED FOR MARCH — 'FIRST DIRECT ENGAGEMENT ON GOVERNANCE FRAMEWORK' — DIPLOMATS CAUTIOUSLY OPTIMISTIC",
      timestamp: "2028-02-01T10:00:00Z",
      classification: "context",
      condition: { variable: "intlCooperation", operator: "gt", value: 35 },
    },
];

registerContent({ faction: "china", app: "news", accumulate: false, items: CHINA_NEWS });
