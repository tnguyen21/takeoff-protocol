import type { AppId, Faction } from "@takeoff/shared";

/**
 * Voice guide per faction — injected into every generation call for
 * that faction so the LLM writes in-character content.
 */
export const FACTION_VOICES: Record<Faction, string> = {
  openbrain: `Fast-moving, confident, slightly hubristic. Internal comms are informal — Slack messages use lowercase, abbreviations, emoji. Leadership speaks in metrics and velocity. Safety team is formal and frustrated. Security team is terse and alarmed.`,

  prometheus: `Mission-driven, principled, occasionally self-righteous. More formal than OpenBrain. Research discussions reference papers and interpretability results. Policy team speaks in regulatory language. There's an undercurrent of "we told you so" that they try to suppress.`,

  china: `Strategic, methodical, hierarchical. DeepCent engineers are technically brilliant and pragmatic. CCP communications are formal, directive, and increasingly urgent. Intelligence briefings are clinical and use IC terminology. Military communications are terse and operational.`,

  external: `Each sub-role has a distinct voice. NSA: dry, analytical, uses classified document format (PDB-style). Journalist: probing, skeptical, source-protective, always pushing for the story. VC: financial language, risk/return framing, FOMO energy. Diplomat: measured, multilateral, procedural — frustrated that no one listens.`,
};

export const APP_VOICES: Partial<Record<AppId, string>> = {
  slack: "Informal, conversational. Short messages. Lowercase ok. Emoji sparingly. Channel-appropriate tone (#research is technical, #general is casual, #alignment is earnest).",
  news: "Reuters/AP wire style. Terse. Lead with the news. Attribution. No editorializing. ALL CAPS for BREAKING/URGENT prefixes.",
  twitter: "Hot takes, ratio bait, doom posting, hype posting. 280 chars. Hashtags. Quote tweets. The full spectrum of AI Twitter.",
  bloomberg: "Financial shorthand. Ticker symbols. Basis points. 'Sources say.' Neutral but urgent. Format: { body: 'TICKER — financial data and analysis' }.",
  email: "Corporate formal. Subject lines matter. CC lists imply politics. Board emails are terse and loaded.",
  memo: "Internal document. Headers, bullet points. Classification markings for sensitive ones. Format: { subject: 'MEMO: Topic', body: 'content with headers' }.",
  signal: "Encrypted DM energy. Short, urgent, paranoid. Disappearing message vibes. Format: { sender: 'Contact Name', body: 'short encrypted message' }.",
  intel: "ICD 203 format. Classification headers. Confidence levels (HIGH/MODERATE/LOW). Analytic tradecraft. Format: { subject: 'CLASSIFICATION — Title', body: 'assessment body' }.",
};

/**
 * Faction identity descriptions for the story bible.
 * These are included once at initialization and persist across all rounds.
 */
export const FACTION_IDENTITIES: Record<
  Faction,
  { identity: string; tension: string; characters: string[] }
> = {
  openbrain: {
    identity:
      "The leading US lab. Capabilities-first culture. Moves fast, ships product, worries about safety later. Slight model lead. Deep government ties. Culture built on velocity.",
    tension:
      "Your lead is narrow and built on speed. Slowing down for safety gives Prometheus and China an opening. But what if the AI is actually dangerous?",
    characters: ["ob_ceo", "ob_cto", "ob_safety", "ob_security"],
  },
  prometheus: {
    identity:
      "The #2 US lab. Safety-first culture. Comparable models but invests heavily in alignment, interpretability, and responsible scaling. Smaller but principled.",
    tension:
      "You're behind because you do the hard safety work. Do you compromise your principles to close the gap? Or does your safety edge become the reason the government trusts YOU over OpenBrain?",
    characters: ["prom_ceo", "prom_scientist", "prom_policy", "prom_opensource"],
  },
  china: {
    identity:
      "The open-source dark horse. Stolen weights + massive state compute + growing domestic talent. Betting on a different strategy: commoditize the model layer, win on deployment and data.",
    tension:
      "You can't out-spend the US on frontier training. But you can steal weights, go open-source to undermine US moats, and pursue asymmetric strategies. How far do you escalate?",
    characters: ["china_director", "china_intel", "china_military"],
  },
  external: {
    identity:
      "The people with influence but no direct control: US government officials, VCs/investors, journalists, international diplomats. You shape the environment the labs operate in.",
    tension:
      "You can't build AGI yourself. But you control the money, the regulations, the narrative, and the public mandate. Who do you back? What do you demand? When do you blow the whistle?",
    characters: ["ext_nsa", "ext_journalist", "ext_vc", "ext_diplomat"],
  },
};
