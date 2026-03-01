# App Audit: GameStateApp (State Monitor)

**File**: `packages/client/src/apps/GameStateApp.tsx`
**App ID**: `gamestate`
**Date**: 2026-03-01

---

## 1. Current State

The GameStateApp renders a flat, scrollable list of ~30 state variables. Each variable gets a single row containing:

- A text label (136px wide, truncated)
- A horizontal bar chart (fills remaining width, rounded pill shape)
- A numeric value with optional +/- confidence interval
- A 60x24px sparkline from `recharts` showing historical values across rounds

Fog-of-war is communicated through three visual treatments:
- **Exact** (green): solid bar, crisp value
- **Estimate** (yellow): solid bar plus a white translucent confidence band, value shown with +/- range
- **Hidden**: hatched diagonal stripe pattern, value replaced with `"######"` redaction blocks

The header contains the title "STATE MONITOR" and a small legend for the three accuracy types.

The component reads `stateView` (current round, fog-filtered) and `stateHistory` (all past rounds, fog-filtered) from the Zustand game store. It ignores the `content` prop entirely (destructured as `_`).

### What works

- The accuracy color-coding is immediately readable at a glance.
- Sparklines provide round-over-round trend context.
- The confidence interval overlay on estimate bars is a nice touch.
- Hidden variables with diagonal hatching and redaction blocks communicate censorship clearly.

### What does not work

- All 30+ variables are in a single undifferentiated list. There is no grouping, no hierarchy, no visual separation between "AI capabilities race" and "public opinion" and "internal org health."
- The component is entirely passive. No interactivity beyond scrolling.
- No sense of urgency, no threat escalation, no visual alarm states. A variable at 95/100 looks roughly the same as one at 50/100 except for bar length.
- No contextual information. A player seeing "Taiwan Tension: 62" has no idea whether that is alarming or normal without memorizing the scale.
- The sparklines are tiny (60x24) and have no axis, no labels, no tooltips. They communicate "going up" or "going down" but little else.
- Every variable occupies the same visual weight. The Doom Clock (arguably the most important variable in the game) gets the same 12px row as OB Burn Rate.
- No round-over-round delta indicators (up/down arrows, change amounts).
- Does not use the `content` prop at all, meaning GM-injected narrative context or alerts for specific state changes cannot surface here.

---

## 2. Dashboard Design: Toward a Situation Room

The GameStateApp is the meta-game layer. It should feel like walking into a NORAD command center, a hedge fund risk dashboard, or a pandemic situation room. The current design feels like a developer debug panel.

### 2.1 Reference aesthetics

- **NORAD / DEFCON displays**: Large central threat indicator, color-coded alert levels, sector maps, subsystem status boards arranged in panels.
- **Bloomberg Terminal**: Dense data, but highly structured into panels with clear hierarchy. The BloombergApp already in this codebase is a good reference.
- **Pandemic dashboard (Johns Hopkins COVID tracker)**: Key metrics as large hero numbers at top, geographic breakdown below, time-series charts, heat maps.
- **SpaceX Mission Control**: Large central status display, subsystem panels with green/yellow/red status lights, countdown timers.

### 2.2 Proposed layout structure

Replace the single-column list with a multi-panel layout:

```
+-------------------------------------------------------+
|  STATE MONITOR           Round 3 | Mid 2027    DEFCON  |
|  [legend]                        | Phase: Intel   [3]  |
+-------------------+-------------------+----------------+
|  AI RACE          |  GEOPOLITICS      |  DOOM CLOCK    |
|  (hero panel)     |  (hero panel)     |  (hero gauge)  |
|  OB: 72  Prom: 61 |  Taiwan: 62       |     [2.4]      |
|  China: 55        |  US-China Gap: 6  |  ring gauge    |
|  Gap bars         |  Intl Coop: 44    |                |
+-------------------+-------------------+----------------+
|  PUBLIC / ECONOMY                 |  YOUR FACTION      |
|  Awareness, Sentiment, Markets    |  Internal metrics  |
|  Econ Disruption, Regulatory      |  Morale, Burn,     |
|  Media Cycle                      |  Board Conf, etc.  |
+-----------------------------------+--------------------+
|  HIDDEN VARIABLES (collapsed)     |  HISTORY TIMELINE  |
|  Hatched section, count shown     |  Multi-line chart  |
+-----------------------------------+--------------------+
```

The key principles:
- **Hero metrics** at the top for the 3-5 most important variables.
- **Grouped panels** by thematic domain, not by tier number.
- **Your faction's internal state** gets its own dedicated panel (only show variables relevant to the player's faction).
- **Hidden variables** collapsed by default to reduce noise, with a count badge ("7 variables hidden from your faction").
- **A prominent Doom Clock** rendered as a large gauge, not a tiny row.

---

## 3. Interactivity

### 3.1 Hover / tooltip on any variable

Hovering over a variable row or bar should show a tooltip containing:
- Full history across all rounds (as a larger sparkline or mini area chart)
- Round-by-round values in a small table
- The variable's min/max range for context
- The accuracy level with an explanation ("Your faction has an estimate with +/-15 confidence")
- For estimates, the true value could be shown as a ghost marker if this is the GM view

### 3.2 Grouping and filtering

Add tab-like navigation or collapsible sections:
- **All** (default, but grouped into panels)
- **AI Race** (obCapability, promCapability, chinaCapability, usChinaGap, obPromGap, aiAutonomyLevel)
- **Safety** (alignmentConfidence, misalignmentSeverity, doomClockDistance, promSafetyBreakthroughProgress)
- **Geopolitics** (taiwanTension, intlCooperation, usChinaGap, ccpPatience)
- **Public / Economy** (publicAwareness, publicSentiment, economicDisruption, marketIndex, regulatoryPressure, globalMediaCycle)
- **Your Faction** (dynamically filtered to only show variables your faction has exact or estimate access to, excluding hidden ones)

### 3.3 Drill-down panels

Clicking on a group header could expand it into a richer sub-view:
- The "AI Race" panel could show a stacked comparison bar (OB vs Prom vs China) or a radar chart.
- The "Geopolitics" panel could show a simplified map or a tension escalation ladder.
- The "Safety" panel could show the relationship between alignment confidence and misalignment severity as a 2D scatter with a danger zone.

### 3.4 Delta indicators on round transition

When a new round's state arrives, animate the changes:
- Flash variables that changed significantly (delta > 10) in red or green.
- Show up/down arrows with the delta value next to the current value for a few seconds, then settle.
- Variables that crossed a threshold (e.g., Taiwan Tension going above 60) should trigger a brief alert banner at the top of the panel.

---

## 4. Information Density Improvements

### 4.1 Hero metric cards

The top of the dashboard should have 4-6 large cards showing the most critical metrics. Each card contains:
- Variable name
- Large numeric value
- Delta from last round with arrow
- Tiny sparkline
- Color-coded background that shifts from green to yellow to red based on danger thresholds

Example hero metrics:
- **Doom Clock**: `2.4` (red background, pulsing)
- **US-China Gap**: `6 mo` (yellow, narrowing arrow)
- **Alignment Confidence**: `48%` (orange, down arrow)
- **Taiwan Tension**: `62` (red, up arrow)

### 4.2 Faction comparison view

A dedicated sub-panel or overlay that shows the three AI factions side by side:

```
             OpenBrain    Prometheus    China
Capability      72           61          55
Morale          71           80          --
Burn Rate       50           40          --
Board Conf      70           65          --
Security        SL3          SL3         --
```

Hidden values shown as `--`. This makes the competitive landscape immediately readable.

### 4.3 Trend indicators

Beyond sparklines, add explicit trend arrows or micro-indicators:
- Up arrow (green or red depending on whether higher is good or bad for that variable)
- Down arrow
- Flat/stable indicator
- "Accelerating" double arrow for variables that changed more this round than last

### 4.4 Risk gauges

For variables with natural danger thresholds, replace the linear bar with a semicircular gauge or a segmented bar with color zones:

- **Doom Clock** (0-5): Gauge with 5=green, 3=yellow, 1=red, 0=black. This is the single most visually prominent element.
- **Taiwan Tension** (0-100): Bar with green (0-30), yellow (30-60), orange (60-80), red (80-100).
- **Alignment Confidence** (0-100): Inverted -- red when low, green when high.
- **Security Level** (1-5): Five discrete blocks that light up, like the SecurityApp already does for its header.

### 4.5 Timeline / history view

A toggle-able full-width panel at the bottom showing a multi-line time-series chart across all rounds. Each line is a variable (or a selected subset). This gives players the "big picture" of how the game has evolved. Use the fog-of-war colors for line styling (green=exact, yellow=estimate, gaps for hidden rounds).

### 4.6 Correlation callouts

When two variables move in tandem (e.g., Taiwan Tension goes up while CCP Patience goes down), surface a small callout: "Taiwan Tension and CCP Patience are diverging." This helps players who are not deeply familiar with the state system understand what is happening narratively.

---

## 5. Visual Polish

### 5.1 Color coding by threat level

The current color scheme (green/yellow/gray) communicates accuracy but not danger. Add a secondary color layer for threat:

- Variables in a "safe" range: subtle, muted background
- Variables approaching a danger threshold: yellow/amber glow or border
- Variables in a critical range: red background pulse, like the Bloomberg "MARKETS IN TURMOIL" banner

Thresholds could be defined per-variable in the `STATE_ROW_DEFS` array:

```ts
interface StateRow {
  label: string;
  key: keyof StateView;
  min: number;
  max: number;
  unit?: string;
  dangerAbove?: number;  // value above which this is "dangerous"
  dangerBelow?: number;  // value below which this is "dangerous"
}
```

### 5.2 Animated transitions

- Bar widths should animate smoothly when values change between rounds (CSS transition or Framer Motion).
- New values should briefly flash or highlight before settling.
- The Doom Clock gauge should have a slow, ominous pulse when below 3.

### 5.3 Typography hierarchy

Currently everything is 10-11px monospace. Introduce hierarchy:
- Section headers: 13px, bold, uppercase, letter-spaced, with a colored left border
- Hero metrics: 24-32px, bold monospace
- Standard variable values: 12px monospace
- Labels: 11px, regular weight, neutral-400
- Confidence intervals: 10px, neutral-600

### 5.4 Panel chrome

Each group panel should have:
- A dark header bar with the section title and a status indicator (green dot if all variables in range, yellow/red if any are critical)
- A subtle border with a top accent color matching the section theme
- Compact but breathable internal padding

### 5.5 Redacted variable treatment

The current `"######"` blocks are fine but could be enhanced:
- Add a subtle glitch/scan-line animation to hidden values
- Show a small lock icon next to hidden variables
- Group all hidden variables at the bottom with a collapsed section header: "CLASSIFIED - 7 variables restricted" with a lock icon
- When a previously hidden variable becomes visible (accuracy changes between rounds), flash it with a "DECLASSIFIED" animation

### 5.6 The Doom Clock as a centerpiece

The Doom Clock (doomClockDistance, 0-5) is the most narratively significant variable in the game. It deserves special treatment:

- Render it as a large circular gauge (like a Doomsday Clock face) in a dedicated panel
- The clock hand rotates from 12 o'clock (safe, distance=5) toward midnight (catastrophe, distance=0)
- Color transitions: green (5-4), yellow (3), orange (2), red (1), pulsing red (0)
- The label changes: "STABLE" -> "CAUTION" -> "WARNING" -> "CRITICAL" -> "MIDNIGHT"
- If hidden, show the clock face with a static overlay and "CLASSIFIED" text

This single element could dramatically increase the emotional weight of the dashboard.

---

## 6. Specific Improvement Ideas (Prioritized)

### P0 -- High impact, moderate effort

1. **Group variables into themed panels** instead of a flat list. Use the tier/domain structure already in the code comments (AI Race, Safety, Geopolitics, Public/Economy, Faction Internals). Add collapsible sections with header bars.

2. **Add round-over-round delta indicators**. For each variable, compute `currentValue - previousRoundValue` and show a colored arrow + delta number. This is the single most useful piece of information missing from the current dashboard.

3. **Add danger-zone color coding** to bars. Define per-variable thresholds and shift the bar color from its accuracy color toward red when in a danger zone. Taiwan Tension at 80 should look alarming; at 20 it should look calm.

4. **Render the Doom Clock as a prominent gauge** rather than a standard row. Give it a dedicated card at the top of the dashboard.

### P1 -- High impact, higher effort

5. **Add hover tooltips** with full round-by-round history for each variable. Show the history as a larger sparkline (200x80) with round labels on the x-axis and the value range on the y-axis.

6. **Hero metric cards** at the top of the dashboard for 4-6 key variables. Large numbers, delta arrows, mini sparklines, color-coded backgrounds.

7. **"Your Faction" panel** that dynamically shows only the variables your faction can see (exact + estimate), grouped by relevance to your role. This reduces cognitive load for new players.

8. **Faction comparison view** for the AI race variables, showing OB / Prom / China side by side with comparative bars.

### P2 -- Medium impact, moderate effort

9. **Animated bar transitions** when values change between rounds. Use CSS `transition` on the bar width.

10. **Threshold alert banners** at the top of the dashboard when a variable crosses a critical threshold (e.g., "ALERT: Taiwan Tension has exceeded 70").

11. **Collapse hidden variables** into a dedicated "CLASSIFIED" section at the bottom with a count badge, rather than interleaving them with visible variables.

12. **Security Level as discrete blocks** (like the SecurityApp header already does) rather than a continuous bar for SL 1-5.

### P3 -- Nice-to-have, polish

13. **Glitch/scan-line animation** on hidden values instead of static hatching.

14. **"DECLASSIFIED" flash animation** when a previously hidden variable becomes visible.

15. **Multi-line history chart** as an expandable panel at the bottom.

16. **Correlation callouts** when variables move in tandem or diverge.

17. **Use the `content` prop** to surface GM-injected narrative context (e.g., a "SITUATION BRIEFING" card at the top with contextual flavor text about the current state of the world, drawn from the content items routed to the gamestate app).

18. **Sound integration** -- play a subtle alarm sound when a variable enters a critical zone (leveraging the existing `soundManager`).

---

## 7. Technical Notes

- The component already uses `recharts` for sparklines. Expanding to `AreaChart`, `RadialBarChart`, or `PieChart` for the Doom Clock gauge is straightforward.
- The `stateHistory` record in the Zustand store provides all the data needed for trend computation and delta calculation. No backend changes required for most of these improvements.
- The `STATE_ROW_DEFS` array is the right place to add `dangerAbove`/`dangerBelow` thresholds and grouping metadata (e.g., a `group: "aiRace" | "safety" | "geopolitics" | "economy" | "faction"` field).
- The fog matrix in `packages/shared/src/fog.ts` could be extended with per-role overrides (e.g., the OB Safety Officer sees alignmentConfidence as exact while the OB CEO sees it as estimate). This would make the GameStateApp even more role-specific.
- The `content` prop is currently ignored (`content: _`). It should be used to render a narrative summary card or alert messages at the top of the dashboard when the GM pushes content to the `gamestate` app.
- The component does not currently know the player's faction or role. It would need to read these from the game store to implement faction-specific filtering or role-specific views.
