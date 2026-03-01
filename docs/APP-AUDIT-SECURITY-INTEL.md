# App Audit: Security & Intel Apps

**Apps**: SecurityApp, MilitaryApp, IntelApp, BriefingApp
**Date**: 2026-03-01

---

## 1. SecurityApp

**File**: `packages/client/src/apps/SecurityApp.tsx` | **App ID**: `security`

### Current State

- Renders a static header ("Security Operations Center"), a stat row (4 counters), and a scrollable list of alerts.
- 5 hardcoded alerts with severity levels (critical/high/medium/low/info) plus any `content` items rendered as orange "INTEL" alerts.
- No interactivity whatsoever -- no filtering, no clicking alerts, no expanding details.
- Does not read from `useGameStore`, so the stat row values ("5 active alerts", "1 critical", "Last Scan: 4m ago") never change.

### Real-World Fidelity (target: Splunk/QRadar/Microsoft Sentinel SOC dashboard)

**What real SOC dashboards have that this lacks:**

- **Left navigation rail** with sections: Alerts, Incidents, Assets, Dashboards, Threat Intelligence, SOAR Playbooks. Even non-functional nav would add visual weight.
- **Alert table view with columns**: Severity, Source IP, Destination IP, Rule Name, Status (New/In Progress/Closed), Assigned Analyst. The current card layout is fine for a detail view but a SOC analyst's primary view is a dense table.
- **Timeline/sparkline at the top** showing alert volume over the last 24 hours (bar chart or area chart). The Bloomberg app already uses Recharts -- the same library could render a fake alert-volume timeline here.
- **MITRE ATT&CK mapping**: Real SIEM tools show which ATT&CK technique an alert maps to (e.g., "T1078 -- Valid Accounts", "T1567 -- Exfiltration Over Web Service"). Adding a small badge per alert would greatly increase realism.
- **Status indicators panel**: Firewall status, IDS/IPS status, DLP status, endpoint agent coverage -- a row of green/yellow/red dots.
- **IP geolocation mini-map**: Even a placeholder dark-themed world map outline with a few highlighted dots would evoke the SOC aesthetic.

### Interactivity Gaps

- **Severity filter tabs**: A row of toggleable severity pills (CRIT / HIGH / MED / LOW / INFO) at the top of the alerts list. Toggling them filters the visible alerts. This is the single most impactful addition.
- **Alert expansion**: Clicking an alert could expand it to show extra detail fields -- source IP, destination, rule ID, MITRE mapping, recommended action. The data can be hardcoded.
- **Acknowledge/dismiss**: A small "ACK" button on each alert that visually grays it out. Does not need to persist to server. Gives players something to "do" in the app.
- **Sound/notification pulse**: When new INTEL-type content arrives, flash the alert count in the stat bar or pulse the border red briefly.

### Information Density Improvements

- Add a **second stat row** or sidebar panel: "Endpoints Online: 2,847 / 2,850", "Firewall Rules Active: 1,204", "DLP Policies: 38", "Failed Logins (24h): 412".
- Add a **scrolling log ticker** at the bottom (like a terminal log tail): timestamps + one-line syslog messages scrolling by. Pure CSS animation on hardcoded strings would suffice.
- The stat row should pull from `useGameStore`: tie "Security Level" to `securityLevelOB` (or `securityLevelProm` depending on faction), tie alert counts to game state thresholds (e.g., if `chinaWeightTheftProgress > 50`, show an additional critical alert).

### Visual Polish

- The current dark theme (`bg-[#0d0d0d]`) is appropriate but too plain. Add subtle grid lines or a dot pattern background to evoke a monitoring dashboard.
- The security level indicator (5 numbered boxes) should use the same conditional coloring logic as MilitaryApp's THREATCON -- levels 4-5 should be red, not yellow.
- Add a faint pulsing glow on the critical alert's left border (CSS animation, `animate-pulse` on the border color).
- The header should include a monospace clock showing current time (can be a static string like "10:42:31 UTC").

### Specific Improvement Ideas

1. **Connect to game state**: Read `securityLevelOB` from the store and drive the security level indicator. If `chinaWeightTheftProgress` is above a threshold, inject a dynamic alert about "anomalous data egress patterns detected on research subnet."
2. **Add a fake SIEM filter bar**: "Source: Any | Rule: Any | Status: Open | Analyst: Unassigned" -- even if non-functional, it adds visual credibility.
3. **MITRE ATT&CK badges**: Append technique IDs to existing alerts. E.g., the TOR exit node alert maps to T1078 (Valid Accounts) + T1090 (Proxy). The model weight exfiltration is T1567 (Exfil Over Web Service).
4. **Conditional alerts based on game round**: If the game is in later rounds, show escalating alerts. This makes the app feel alive across the game.

---

## 2. MilitaryApp

**File**: `packages/client/src/apps/MilitaryApp.tsx` | **App ID**: `military`

### Current State

- Renders a green-on-dark military terminal aesthetic with three sections: Situation Indicators (6 items in a 2-col grid), Force Disposition (5 units with readiness bars), and Event Log (4 hardcoded entries + content items).
- Classification banner: "SECRET // NOFORN" in the header.
- THREATCON indicator with 5 levels, hardcoded to level 3.
- No interactivity -- purely a read-only display.
- Does not read from `useGameStore`.

### Real-World Fidelity (target: GCCS-J / C2 command dashboard / JWICS-style terminal)

**What real military command systems have that this lacks:**

- **Map display**: The single most defining feature of a military command dashboard is a map. Even a simplified dark vector outline of the Pacific theater with unit position markers would transform this app. CSS-only is feasible -- an SVG of the Western Pacific with colored dots for fleet positions.
- **DEFCON / FPCON indicator**: Distinct from THREATCON. Real systems show multiple readiness posture indicators simultaneously. Adding DEFCON (1-5), FPCON (Normal/Alpha/Bravo/Charlie/Delta), and INFOCON would increase density.
- **Communications status panel**: SATCOM links, secure voice channels, data link status. A list of "Link 16: ACTIVE", "MUOS CH3: ACTIVE", "SIPRNet: NOMINAL" etc.
- **Date-Time Group (DTG) format**: The header shows "DTG 281042Z FEB 26" which is correct. But events in the log should also use DTG format consistently.
- **Message traffic indicators**: "FLASH", "IMMEDIATE", "PRIORITY", "ROUTINE" precedence labels on incoming messages, which is how military comms are actually prioritized.

### Interactivity Gaps

- **Expandable unit cards**: Clicking a unit in Force Disposition could reveal sub-unit breakdown, equipment status, personnel readiness, last contact time.
- **Threat level toggle**: Allow the player to view "What if THREATCON was raised to 4?" -- purely visual, showing how the display changes. Or tie it to `taiwanTension` from game state.
- **Tab navigation**: "FORCE STATUS | INTEL SUMMARY | COMMS LOG | MAP" tabs at the top. Even if only Force Status is fully implemented, the other tabs could show placeholder content and increase the feeling of depth.
- **Message precedence filtering**: Filter event log by FLASH/IMMEDIATE/PRIORITY/ROUTINE.

### Information Density Improvements

- **Add a "NATIONAL COMMAND AUTHORITY DIRECTIVES" section**: A small box showing the current NCA posture guidance. E.g., "CURRENT GUIDANCE: Avoid escalatory actions in Taiwan Strait. Maintain defensive posture. Report all PRC naval movements immediately."
- **Add asset counts**: "Carrier Strike Groups Deployed: 3", "SSBN on Patrol: 6", "ISR Orbits Active: 14", "Cyber Teams Engaged: 22". Small stat boxes like SecurityApp's stat row.
- **Satellite/ISR panel**: "KH-11: PASS 0845Z -- IMAGERY PENDING", "SIGINT GEOSYNC: ACTIVE", "ELINT: 14 NEW INTERCEPTS". This ties into the intelligence theme.
- **Weather/environment strip**: "WESTPAC WEATHER: MONSOON SEASON -- DEGRADED MARITIME OPS", "SPACE WEATHER: G1 STORM -- MINOR COMM DEGRADATION". Real command dashboards always show environmental conditions.

### Visual Polish

- The green-on-dark aesthetic is very good and appropriate. Minor refinements:
  - Add scan-line or CRT effect (subtle CSS overlay with repeating horizontal lines at low opacity). This is a common retro-military-terminal trope.
  - The readiness bars are good. Add a subtle animation -- the bar could have a faint shimmer/gradient animation to suggest live updating.
  - Section headers ("SITUATION INDICATORS", "FORCE DISPOSITION") should have a slightly different treatment -- perhaps a left-border accent line in green, or a small icon/glyph.
  - Add a blinking cursor or "SYSTEM READY" prompt at the bottom, similar to Bloomberg's CMD bar.
- Classification banner should be full-width and more prominent -- in real JWICS systems, the classification banner is at both top AND bottom, bright green for SECRET (not red, which is TS/SCI). Consider: "SECRET // NOFORN" in bright green background with black text, or yellow for SECRET.

### Specific Improvement Ideas

1. **Connect to game state**: Read `taiwanTension` and drive the "Taiwan Strait Situation" indicator. Read `chinaCapability` and modulate "PRC Naval Movements". Make THREATCON dynamic: if `taiwanTension > 70`, auto-escalate to THREATCON 4.
2. **SVG theater map**: A minimal SVG map of the Western Pacific showing fleet positions as colored pips. Can be completely static but would massively increase fidelity.
3. **Bottom classification banner**: Add the matching classification banner at the bottom (like IntelApp does). Real classified systems always have top + bottom banners.
4. **Message precedence on event log items**: Prepend "[FLASH]", "[IMMEDIATE]", "[PRIORITY]", or "[ROUTINE]" to each event log entry.
5. **COMMS STATUS sidebar**: A narrow right sidebar showing link status: "SIPRNet: UP", "JWICS: UP", "Link 16: UP", "SATCOM: DEGRADED" -- with green/yellow/red dots.

---

## 3. IntelApp

**File**: `packages/client/src/apps/IntelApp.tsx` | **App ID**: `intel`

### Current State

- Two modes: if `content` contains document/memo items, it renders them as styled classified documents. If not, it renders a hardcoded DIA intelligence product with redacted sections.
- Classification banners at top and bottom ("TOP SECRET // SCI // NOFORN") in red -- correct for TS/SCI.
- The default document is very well-crafted: proper DIA header block, DTG, reference numbers, classification paragraph markings ((TS//SCI), (S//NF)), redacted blocks, key judgments, and dissemination lines.
- Completely non-interactive -- read-only.
- Does not use game state.

### Real-World Fidelity (target: ICD 203 intelligence product / PDB-style briefing)

**This is already the highest-fidelity app of the four.** The classification markings, paragraph-level classification, redaction style, and document structure closely mirror real IC products.

**What could push it further:**

- **Portion markings in parentheses**: Already present and correct. Could add more variety: (S), (C), (U//FOUO), (TS//SI//TK) to show the range of classification levels within a single document.
- **Source reliability matrix**: Real intel products include source assessments. A small table: "Source A: Reliable / Information: Confirmed", "Source B: Usually Reliable / Information: Probably True". This is a distinctive IC pattern.
- **Analytic confidence explanation**: After "HIGH CONFIDENCE", real NIEs include a footnote explaining what that means: "High confidence indicates solid analytical reasoning and/or corroborating sources."
- **Annexes / attachments reference**: "See Annex A: Technical Assessment (TS//SCI//SAR)" -- even without the annex existing, the reference adds realism.
- **Coordination line**: "This assessment has been coordinated with CIA/DI, NSA/SID, NGA/AG, and CYBERCOM/J2." Real products list which agencies concurred.
- **Distribution list at the bottom**: More detailed than current -- should be a formatted block.

### Interactivity Gaps

- **Document navigation sidebar**: If multiple documents are loaded via `content`, show a left sidebar listing them by title/date. Click to navigate between documents.
- **Redaction reveal mechanic**: This is a game mechanic opportunity. If a player has the right role or has completed certain actions, redacted blocks could become un-redacted. Even without implementing the mechanic now, structuring the code to support it would be valuable.
- **Highlight/annotate**: Let players highlight text or add margin notes. These could be visible to teammates via the game state. Lightweight annotation -- click a paragraph, add a note.
- **Print/export button**: A non-functional "PRINT COPY" button in the header that shows a tooltip "Printing disabled on JWICS terminal" -- adds flavor.

### Information Density Improvements

- **Multiple documents per view**: When content has multiple items, show them as a stack of documents with tabs or a table of contents, not just a vertical scroll.
- **Intelligence Community Directive formatting**: Add the ICD 203 "Analytic Standards" footer that real products carry.
- **Cross-reference callouts**: Inline references like "(See DIA-AI-2026-0215-003)" that suggest a larger body of intelligence. Even without those documents existing, the references create depth.
- **Handling caveats box**: A bordered box at the top listing handling instructions: "HANDLE VIA COMINT CHANNELS ONLY", "NOT RELEASABLE TO FOREIGN NATIONALS", "ORIGINATOR CONTROLLED".

### Visual Polish

- The parchment-colored background (`bg-[#f5f0e8]`) is a good choice -- evokes printed classified documents.
- Could add a very faint watermark effect: "DRAFT" or "COPY __ OF __ COPIES" diagonally across the page in very light gray.
- The redaction blocks (`bg-black text-black select-none`) are effective. Could vary them slightly -- some shorter, some longer -- to look more natural. Some could use the `[REDACTED]` text-replacement pattern instead of black bars.
- Consider adding a faint fold line or paper texture via CSS background pattern.
- The font is `font-mono` which is appropriate for cable-style intelligence but less so for finished intelligence products. The DIA would use a serif or standard government font (similar to Times New Roman). Consider using `font-serif` for the body text and `font-mono` only for the header metadata block.

### Specific Improvement Ideas

1. **Dynamic classification based on role**: If the player is `ext_nsa`, show TS/SCI content. If they are `ext_journalist`, the same document could appear with heavier redactions or at a lower classification. The `content` system supports `role`-scoped items but the rendering does not differentiate.
2. **Source reliability footer**: Add a small "SOURCE SUMMARY" table at the bottom of each document with source designators and reliability ratings.
3. **Coordination line**: "Coordinated with: CIA/DI (concur), NSA/SID (concur with comment), DHS/I&A (concur), FBI/IB (nonconcur -- see footnote 3)." The nonconcurrence pattern is a classic IC detail.
4. **Multiple document tabs**: When several content items arrive, render a tabbed or sidebar navigation rather than stacking them vertically.
5. **Connect to game state**: The default document mentions foreign AI capability assessment. The "revised timeline" redaction could actually show a dynamic value derived from `usChinaGap` -- e.g., if the gap is small, the un-redacted text reads "by Q3 2026", if large, "by early 2027".

---

## 4. BriefingApp

**File**: `packages/client/src/apps/BriefingApp.tsx` | **App ID**: `briefing`

### Current State

- Renders a game-meta briefing screen: scenario overview, player objectives, known state variables, and a timer prompt.
- Purple-themed dark UI with card-based layout.
- Completely static -- hardcoded text, hardcoded state variables ("87%", "42%", "SL-3", "44/100").
- Ignores the `content` prop entirely (destructured as `_`).
- Does not use `useGameStore`.

### Real-World Fidelity (target: game-UI briefing, not a real-world app replica)

This app is unique because it is a game mechanic screen, not a simulation of a real tool. The fidelity target is "polished game briefing UI" rather than "replica of a real app." It could borrow from real executive briefing tools (e.g., Palantir Gotham briefing view, Situation Room briefing slides, PDB cover sheets) to maintain the simulation's tone.

**What would improve it:**

- **Dynamic state variables**: The "Known State Variables" section shows 4 hardcoded values. This should read from `useGameStore` and show the player's `stateView` (respecting fog of war -- showing "?" or "CLASSIFIED" for hidden values, and "~87%" with a confidence range for estimates). This is arguably a bug, not just a polish issue.
- **Faction-specific briefing text**: The scenario overview and objectives are generic. The `content` prop is ignored. The `RoundContent.briefing` type supports `factionVariants` -- this app should render faction-specific briefing text when available.
- **Round-awareness**: The header says "Round 1 -- Briefing Phase" but this is hardcoded. Should read `round` from the store.
- **Phase-appropriate content**: The briefing should change between rounds. Round 1 should be the scenario introduction. Later rounds should summarize what happened in prior rounds.

### Interactivity Gaps

- **Expandable sections**: The briefing cards should be collapsible. In a dense briefing, players may want to focus on one section at a time.
- **State variable tooltips**: Hovering over a state variable could show a brief explanation of what it means and why it matters.
- **Acknowledge/ready button**: A "Ready to Proceed" button that signals to the GM that this player has read the briefing. Ties into game flow.
- **Tabbed historical briefings**: After round 1, the briefing app could show tabs: "Round 1 | Round 2 | Round 3" so players can re-read previous briefings.

### Information Density Improvements

- **Show more state variables**: The game has 30+ state variables. The briefing should show all variables the player can see (respecting fog of war), grouped by category.
- **Faction roster**: Show who is on your team, their roles, and whether they are connected.
- **Timeline / key dates**: A horizontal timeline showing "Feb 26: Game Start | Feb 27: Model evaluation deadline | Feb 28: UN summit | Mar 1: Board meeting". Gives players temporal anchoring.
- **Decision history**: After round 1, show what decisions were made and their outcomes.
- **Objectives tracker**: Show primary/secondary objectives with progress indicators.

### Visual Polish

- The purple theme is fine for a game-meta screen but feels a bit sterile compared to the other apps.
- **Add a faction-colored accent**: If the player is OpenBrain, use a blue accent. Prometheus could be orange. China could be red. This reinforces faction identity.
- **Animated entrance**: Cards could fade in sequentially when the briefing phase begins, guiding the player's reading order.
- **Classification-style header**: Even though this is a game screen, adding a "BRIEFING DOCUMENT -- [FACTION] EYES ONLY" banner in faction colors would maintain the simulation's tone.
- **Better typography**: The body text in the scenario overview could use slightly larger font and better line-height for readability. This is a reading-heavy screen.

### Specific Improvement Ideas

1. **Connect to game state (critical)**: Read `round`, `stateView`, and `lobbyPlayers` from `useGameStore`. Display real state variable values. Show round number dynamically. This is the single highest-priority fix.
2. **Use the content prop**: The briefing content system (`RoundContent.briefing`) exists but is being ignored. Wire it up so faction-specific briefing text renders.
3. **Add faction branding**: Show faction logo/name prominently. Color the header in faction colors.
4. **Decision history panel**: After round 1, include a "Previous Round Summary" card showing decisions made and state changes.
5. **Player roster card**: Show the team roster with roles and connection status.
6. **"EYES ONLY" classification banner**: "OPENBRAIN INTERNAL -- BOARD LEVEL ONLY" or "PRC STATE COUNCIL -- RESTRICTED" depending on faction. Maintains simulation immersion even on a meta-game screen.

---

## Cross-Cutting Themes

### All four apps share these weaknesses:

1. **No connection to game state**: None of the four apps read from `useGameStore`. Bloomberg does this well -- it reads `stateView`, `stateHistory`, and `round` to show dynamic charts and conditional banners. These four apps should follow that pattern. The state variables `securityLevelOB`, `taiwanTension`, `chinaWeightTheftProgress`, `alignmentConfidence`, and `usChinaGap` are all directly relevant.

2. **No interactivity**: SlackApp has message input. BloombergApp has hover states and a (fake) command bar. These four apps are entirely passive. Even small interactions (click-to-expand, filter toggles, tab navigation) would make them feel like tools rather than posters.

3. **Static hardcoded data**: The hardcoded alerts, force status, and briefing text never change across rounds. As the game progresses, these apps should reflect the evolving situation.

4. **Content prop underutilization**: SecurityApp and MilitaryApp render content items in a basic way (orange "INTEL" cards or yellow "[INTEL]" log entries). IntelApp handles document-type content well. BriefingApp ignores content entirely.

### Priority Ranking

| Priority | App | Improvement | Effort |
|----------|-----|-------------|--------|
| 1 | BriefingApp | Connect to game state (real state variables, round number) | Low |
| 2 | BriefingApp | Wire up `content` prop and faction-specific briefing text | Low |
| 3 | SecurityApp | Connect `securityLevelOB` to the security level indicator | Low |
| 4 | MilitaryApp | Connect `taiwanTension` to situation indicators | Low |
| 5 | SecurityApp | Add severity filter tabs | Medium |
| 6 | IntelApp | Add document navigation sidebar for multiple documents | Medium |
| 7 | MilitaryApp | Add bottom classification banner + message precedence labels | Low |
| 8 | SecurityApp | Add alert-volume sparkline chart (reuse Recharts) | Medium |
| 9 | MilitaryApp | Add SVG theater map placeholder | Medium |
| 10 | IntelApp | Dynamic redaction based on game state | High |
| 11 | SecurityApp | MITRE ATT&CK technique badges on alerts | Low |
| 12 | BriefingApp | Faction-colored branding and EYES ONLY banner | Low |
| 13 | SecurityApp | Scrolling syslog ticker at bottom | Medium |
| 14 | MilitaryApp | CRT scan-line CSS effect | Low |
| 15 | IntelApp | Source reliability matrix footer | Low |
