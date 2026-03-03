# Backlog

## Twitter: Trending + Faction Bubble

**Current state:** All factions share a single public Twitter pool (`content/shared/twitter.ts`).

**Future iteration:** Split into two layers:

1. **Shared trending pool** — viral tweets, breaking news reactions, public discourse that everyone sees regardless of faction. The "trending" tab.
2. **Faction algorithmic bubble** — per-faction curated feed reflecting each faction's information ecosystem:
   - OpenBrain: tech insider discourse, capability optimism, startup culture
   - Prometheus: AI safety community, academic twitter, responsible AI advocates
   - External: DC policy twitter, journalist threads, pundit analysis
   - China: Weibo-equivalent (or remove Twitter entirely for China — they wouldn't have it)

This creates natural information asymmetry: the same event (e.g. an alignment scare) surfaces as "overblown doomerism" in OB's bubble and "vindication of safety concerns" in Prometheus's bubble. Same reality, different framing — mirroring how real social media shapes perception.

**Implementation:** Register shared pool for all factions, plus per-faction bubble modules. Loader merges both into the player's twitter feed.

## ADD GENERATION TO LOGGING
