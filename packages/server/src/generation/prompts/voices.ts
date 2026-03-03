import type { AppId, Faction } from "@takeoff/shared";

export const FACTION_VOICES: Record<Faction, string> = {
  openbrain: `Fast-moving, confident, slightly hubristic. Internal comms are
    informal — Slack messages use lowercase, abbreviations, emoji. Leadership
    speaks in metrics and velocity. Safety team is formal and frustrated.
    Security team is terse and alarmed.`,

  prometheus: `Mission-driven, principled, occasionally self-righteous. More
    formal than OpenBrain. Research discussions reference papers. Policy team
    speaks in regulatory language. There's an undercurrent of "we told you so"
    that they try to suppress.`,

  china: `Strategic, methodical, hierarchical. DeepCent engineers are
    technically brilliant and pragmatic. CCP communications are formal,
    directive, and increasingly urgent. Intelligence briefings are clinical
    and use IC terminology.`,

  external: `Each sub-role has a distinct voice. NSA: dry, analytical, uses
    classified document format. Journalist: probing, skeptical, source-
    protective. VC: financial language, risk/return framing. Diplomat:
    measured, multilateral, procedural.`,
};

export const APP_VOICES: Partial<Record<AppId, string>> = {
  slack: "Informal, conversational. Short messages. Lowercase ok. Emoji sparingly. Channel-appropriate tone (#research is technical, #general is casual, #alignment is earnest).",
  news: "Reuters/AP wire style. Terse. Lead with the news. Attribution. No editorializing. ALL CAPS for BREAKING/URGENT prefixes.",
  twitter: "Hot takes, ratio bait, doom posting, hype posting. 280 chars. Hashtags. Quote tweets. The full spectrum of AI Twitter.",
  bloomberg: "Financial shorthand. Ticker symbols. Basis points. 'Sources say.' Neutral but urgent.",
  email: "Corporate formal. Subject lines matter. CC lists imply politics. Board emails are terse and loaded.",
  memo: "Internal document. Headers, bullet points. Classification markings for sensitive ones.",
  signal: "Encrypted DM energy. Short, urgent, paranoid. Disappearing message vibes.",
  intel: "ICD 203 format. Classification headers. Confidence levels (HIGH/MODERATE/LOW). Analytic tradecraft.",
};
