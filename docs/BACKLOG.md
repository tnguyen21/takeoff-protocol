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

## Slack: Real-Time Conversational NPCs (Option B)

**Current state:** Slack channels show pre-authored + round-boundary generated content items. Players can chat in #general (team chat). Option A (implemented or in progress) adds player typing in all channels and round-boundary NPC generation that's aware of player messages.

**Future iteration:** LLM-powered NPCs that respond to player messages in real-time during a round.

### Architecture

**NPC Registry:** Each faction has named NPCs with personas, knowledge scopes, and channel presence. E.g., OB might have "Dr. Chen" in #research and #alignment, Prometheus has "Kai" in #safety. NPCs are defined per faction, and only respond in channels they're assigned to.

**Response Trigger:** When a player posts in a channel, check if any NPC is present in that channel. If so, queue a response with a 3-8s "typing..." delay (randomized for realism). The NPC's prompt includes:
- Their persona/knowledge scope
- Last ~20 messages in the channel (both content items and player messages)
- Current game state (relevant subset)
- Current round arc / narrative beat
- What they know vs what's hidden from them

**Rate Limiting:** Max 1 NPC response per 30s per channel. If multiple players post rapidly, batch context and respond once. This controls cost and prevents spam.

**Coherence Between Rounds:** The generation context system (`context.ts`) already builds a "story bible" with prior round events. NPC responses would feed into this: at round boundary, summarize NPC conversations into the story bible so next round's generation is aware of what was discussed. Player messages in channels would also be harvested into `RoundHistory`.

### Complexity Estimate

- NPC registry + persona system: 1-2 issues
- Real-time response trigger + rate limiter: 2 issues
- Prompt engineering (per-NPC, channel-aware): 1-2 issues
- Story bible integration (conversation summaries): 1 issue
- Typing indicator UX in SlackApp: 1 issue
- Cost monitoring / kill switch: 1 issue

Total: ~7-9 issues, medium-large lift. Main risks are latency (LLM calls take 1-5s), cost scaling (every player message can trigger a call), and coherence (NPCs need consistent personalities across a game session).

### Hybrid Approach (Recommended Path)

Start with Option A (round-boundary generation aware of player messages). Then layer on reactive NPCs for specific high-value interactions:
1. @mention triggers (player explicitly addresses an NPC)
2. Threshold triggers (game state crosses a critical value, NPC comments)
3. Scheduled check-ins (NPC posts unprompted every ~2-3 minutes during active play)

This limits LLM calls while still creating the illusion of a living workspace.

## ADD GENERATION TO LOGGING

## IMPROVE JOURNALIST ROLE
