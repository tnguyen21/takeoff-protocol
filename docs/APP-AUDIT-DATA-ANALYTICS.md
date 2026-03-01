# App Audit: Data & Analytics Apps

**Apps**: BloombergApp, SheetsApp, ComputeApp, WandBApp
**Date**: 2026-03-01

---

## 1. BloombergApp

**File**: `packages/client/src/apps/BloombergApp.tsx` | **App ID**: `bloomberg`

### Current State

Renders a Bloomberg Terminal-style interface with:
- Orange header bar with "BLOOMBERG TERMINAL" branding and a static timestamp.
- Conditional turmoil/bull-run banners driven by `economicDisruption`, `marketIndex` state variables.
- Index bar (SPX, NDX, DJI, VIX) with a dynamic AI INDEX when `marketIndex` is visible.
- A small area chart of economic disruption history by round.
- A 5-column ticker table (7 static rows: NVDA, GOOGL, MSFT, AMZN, META, TSM, AMD).
- A right sidebar with headlines (from content items or static fallback).
- A decorative command bar at the bottom with a blinking cursor.
- Public sentiment value displayed as a number next to the chart header.

Interactivity is minimal: hover highlights on ticker rows and headline items. Nothing is clickable, sortable, or expandable.

### Real-World Fidelity

Bloomberg Terminal is one of the most information-dense UIs ever built. The current implementation captures the color scheme (black/green/orange) and monospace font well, but it operates at maybe 20% of the real terminal's density.

**What the real Bloomberg has that this does not:**

- **Multi-panel layout.** The real terminal uses a tiled grid system (typically 2x2 or more panels) where each panel is its own function screen (GP, TOP, CANO, WEI, etc.). The current app is a single-column layout.
- **Function navigation.** Bloomberg's core UX is typing commands like `NVDA US <Equity> GP <GO>` into the command bar. The command bar here is purely decorative.
- **Scrolling ticker tape.** The real terminal often has a scrolling LED-style ticker along the top or bottom edge.
- **Dense tabular data everywhere.** Real Bloomberg screens pack 50-100 data points per panel. The 7-row ticker table is sparse.
- **Yellow/amber security pages.** When you look up a stock, you get an amber-on-black page with 40+ fields (P/E, market cap, yield, 52w range, beta, etc.).
- **Timestamp precision.** Real Bloomberg shows timestamps to the second on every data point, plus multiple timezone clocks in the header.
- **News with wire attribution.** Headlines show source (RTRS, BBG, DJ), timestamp, and priority tags.

### Interactivity Gaps

- **Command bar should accept input.** Even fake commands like `TOP`, `ALLX`, or `AI <GO>` could trigger view changes (swap between a market overview panel and a detail panel).
- **Clicking a ticker should show a detail pane.** A Bloomberg security page (GP screen) with price chart, key stats, and recent news for that ticker.
- **Sortable columns.** Clicking "CHG" or "%CHG" headers to sort the ticker table ascending/descending.
- **Headline click-through.** Clicking a headline could expand it inline or open a detail view with a few paragraphs of fake article text.
- **Index bar should be interactive.** Clicking SPX could show an intraday chart in the main area.

### Information Density Improvements

- **Add a scrolling ticker tape** across the top or bottom. CSS animation of a single line of tickers scrolling left continuously. This is the quintessential Bloomberg visual.
- **Add more tickers.** 7 is too few. At least 15-20, making the table scrollable. Include sector ETFs (SMH, SOXX, QQQ), bond yields (US10Y), commodities (Gold, Oil), and crypto (BTC, ETH) since it is 2027.
- **Add a second chart panel.** Show the AI INDEX over time alongside the economic disruption chart. Use a sparkline grid (3-4 mini charts side by side) for SPX, NDX, VIX, and AI INDEX.
- **Add market breadth data.** A row showing "Advances: 1,842 / Declines: 2,104 / Unchanged: 312" to fill dead space.
- **Add a status bar** at the very bottom (below the command bar) with connection status, data feed indicators, username, and terminal ID.
- **Show more state variables as data points.** Regulatory pressure could appear as a "REGULATORY RISK INDEX" in the sidebar. Public sentiment could be a small gauge or sparkline rather than just a number.
- **Add bid/ask spread columns** to the ticker table. Real Bloomberg shows Bid, Ask, Open, High, Low, Close, VWAP.
- **Multiple timezone clocks** in the header: NY, LDN, TKY, SHA.

### Visual Polish

- The orange `#f26522` is correct for Bloomberg branding. Good.
- Use `font-variant-numeric: tabular-nums` on all numeric columns to prevent layout jitter.
- The real Bloomberg uses a very specific monospace font (Bloomberg Terminal font). Consider using `Consolas`, `Menlo`, or even a custom font-face for authenticity.
- The chart tooltip should match Bloomberg's style: minimal, no border radius, solid background.
- Headlines should use ALL CAPS with wire-service-style formatting: `10:41 *SENATE AI GOVERNANCE BILL ADVANCES -- BBG`.
- The blinking cursor in the command bar should be an amber/orange block cursor, not a green underscore.

### Specific Improvement Ideas

1. **Ticker tape banner:** Add a `<div>` above or below the index bar with CSS `@keyframes` horizontal scroll animation containing 30+ ticker symbols with prices and changes. Loop infinitely.
2. **Dual-panel layout:** Split the main content area into a left panel (ticker table + mini charts) and right panel (news + analysis). Use a 60/40 or 70/30 split.
3. **Fake command history:** Make the command bar show the last typed command like `AI INDEX <GO>` with a flash effect, then return to the blinking cursor. Could cycle through commands on a timer.
4. **Wire-format headlines:** Prefix each headline with a timestamp and source tag: `10:41 BBG *SENATE AI GOVERNANCE BILL ADVANCES`.
5. **Conditional ticker data:** When `marketIndex` is low, shift ticker prices down and make more of them red. When `economicDisruption` is high, increase VIX dramatically. The static data should react to game state.
6. **Add sector heatmap:** A small grid of colored squares (green/red) representing sectors (Tech, Energy, Healthcare, Finance, etc.) in the style of Bloomberg's IMAP function.

---

## 2. SheetsApp

**File**: `packages/client/src/apps/SheetsApp.tsx` | **App ID**: `sheets`

### Current State

Renders a Google Sheets-like dark-mode spreadsheet with:
- A burn rate health banner (progress bar driven by `obBurnRate` or `promBurnRate`).
- Toolbar with filename (`compute_budget_2024.xlsx`) and fake menu items (File, Edit, View, etc.).
- Formula bar showing a static cell reference (A1) and value ("Category").
- A 7-column, 8-row table of budget data (Q1/Q2 budget vs actual, variance, notes).
- Sheet tabs at the bottom (Budget Overview, Personnel, Compute Detail, Audit Log) -- only the first is "selected."
- Alternating row colors, hover state, and a special highlight for the TOTAL row and high-burn-rate compute row.

Content items of type "row" can replace the static data via tab-separated values.

### Real-World Fidelity

**What the real Google Sheets has that this does not:**

- **Column letters (A, B, C, ...) across the top** as a header row. Currently the column headers show semantic names but lack the lettered row that Sheets always shows.
- **Row numbers** are present (good), but they should be in a distinct gutter column with a slightly different background.
- **Cell selection highlight.** The hallmark Sheets interaction is clicking a cell and seeing a blue border around it, with the cell reference updating in the formula bar. This is completely absent.
- **The green Sheets icon** in the toolbar. Currently it is just a green square.
- **Conditional formatting indicators.** Real Sheets often has cells with color-coded backgrounds (not just text color).
- **Frozen panes.** The header row and first column should behave as frozen when scrolling.
- **The "Share" button** in the top right is iconic for Google Sheets.
- **Comments/notes indicators.** Real Sheets shows small colored triangles in cell corners for notes.
- **The toolbar buttons** (Bold, Italic, font size, alignment, borders, fill color, etc.) are entirely missing. The real Sheets has a substantial formatting toolbar.

### Interactivity Gaps

- **Cell selection.** Clicking a cell should highlight it with a blue border and update the formula bar to show the cell reference and value.
- **Sheet tab switching.** The four tabs at the bottom do nothing. Each could show different static data: "Personnel" could show headcount and salaries; "Compute Detail" could show GPU hours breakdown; "Audit Log" could show timestamped entries.
- **Column resize handles.** Hover on column borders to see a resize cursor (visual only).
- **Right-click context menu.** Even a fake one that appears and does nothing would add immersion.
- **Sort indicators.** Clicking column headers to sort ascending/descending with arrow indicators.
- **Cell editing.** Double-clicking a cell could show a text input (even if it reverts on blur).

### Information Density Improvements

- **Add more rows.** 8 rows is very sparse for a budget spreadsheet. Add sub-categories: break "Compute (H100 hours)" into multiple line items (training, inference, eval, burst). Add departments, projects, etc. Target 15-25 rows.
- **Add sparkline cells.** Google Sheets supports `=SPARKLINE()` -- show tiny inline charts in the Notes column or a dedicated Trend column.
- **Add a summary bar** at the bottom (above the sheet tabs): "SUM: $17,256,000 | AVG: $2,465,142 | COUNT: 7" -- this is what real Sheets shows when you select a range.
- **Add frozen header/sidebar.** The first column (Category) should remain sticky when scrolling horizontally.
- **Multiple data types.** Show percentages, dates, currencies, and plain numbers to make it feel like a real mixed-use spreadsheet.
- **Add cell comments.** Small orange triangles in certain cell corners that show a tooltip on hover.

### Visual Polish

- The dark mode treatment is reasonable but Google Sheets dark mode has a more specific palette: `#202124` background, `#303134` cell borders, `#e8eaed` text.
- The formula bar `fx` icon should be slightly bolder and the cell reference box should have a distinct darker background.
- Sheet tabs should have a small "+" button at the end for "Add sheet."
- The toolbar gap between "Format" and "Data" is missing "Tools", "Extensions", and "Help."
- Cells with currency values should be right-aligned.

### Specific Improvement Ideas

1. **Implement cell selection state.** Track `selectedCell: [row, col]` in local state. Render a 2px blue border on the selected cell. Update the formula bar to show the corresponding column letter + row number and cell value.
2. **Make sheet tabs functional.** Store `activeTab` state. Each tab renders a different static dataset. "Audit Log" tab could show timestamped entries: `2026-02-28 14:22 -- User changed Compute Q2 Budget from $11.8M to $12.2M`.
3. **Currency alignment.** Right-align all monetary columns. Use `text-align: right` and `font-variant-numeric: tabular-nums`.
4. **Add a formatting toolbar row** between the menu bar and formula bar with small icon buttons: B, I, U, paint bucket, borders, alignment, etc. These do not need to function; they just need to look correct.
5. **Conditional cell coloring.** Variance cells with positive variance could have a light red background; negative variance a light green background (matching the "over/under budget" semantic). The TOTAL row could have a stronger background band.
6. **Dynamic data from state variables.** When `burnRate` is high, update some "Q2 Actual" cells from "---" to alarming numbers. When `economicDisruption` rises, add a "Market Conditions" row showing the impact.

---

## 3. ComputeApp

**File**: `packages/client/src/apps/ComputeApp.tsx` | **App ID**: `compute`

### Current State

Renders a cloud compute dashboard with:
- Header showing "Compute Dashboard" with org name (OpenBrain or DeepCent depending on faction).
- Summary stats: Total GPUs (992), Avg Utilization (83%), Active Jobs (4). For China faction, shows CDZ utilization instead.
- AI Capability Index bar chart comparing OB, PROM, and CHINA capabilities with fog-of-war support (hidden values shown as gray bars, estimates shown at reduced opacity with error bars).
- Five cluster cards, each with name, status indicator (healthy/degraded), job count, reserved workload, and utilization bar.
- Intel metrics section (rendered from content items of type "chart").
- Active jobs table (4 static jobs) with ID, cluster, GPUs, elapsed time, and ETA.

### Real-World Fidelity

This app is trying to be something like a GCP Console, AWS EC2 dashboard, or an internal MLOps platform (like RunPod, Lambda, or CoreWeave dashboards).

**What real compute dashboards have that this does not:**

- **Navigation sidebar.** Every cloud console has a left nav: Instances, Clusters, Jobs, Storage, Billing, IAM, Logs. Currently there is no navigation at all.
- **Tabbed views.** Real dashboards have tabs: Overview, Monitoring, Logs, Configuration.
- **Real-time metrics.** CPU/GPU utilization shown as live-updating sparklines or time-series graphs, not just single-number bars.
- **Log streams.** A terminal-style log viewer showing recent events: "Cluster C: GPU 47 ECC error detected", "Job run-789: checkpoint saved at step 12,440."
- **Cost tracking.** Real cloud dashboards prominently show cost: hourly burn rate, projected monthly cost, budget vs actual.
- **Alerts and incidents.** A banner or sidebar showing active alerts: "Cluster C degraded: 2 GPUs offline."
- **Resource quotas.** Show allocated vs available: "H100 allocation: 768/1024 used."

### Interactivity Gaps

- **Cluster cards should be expandable.** Clicking a cluster should expand to show individual GPU status, temperature, memory usage, and the list of jobs running on it.
- **Job rows should be clickable.** Clicking a job should show details: training config, loss curve, resource usage, logs.
- **Utilization bars should show tooltips** on hover with exact numbers and breakdowns.
- **Status filters.** Buttons to filter clusters by status (All, Healthy, Degraded, Down).
- **Refresh button.** A fake "Refresh" button with a spinning icon animation that triggers a brief loading state.
- **Time range selector.** A dropdown to view utilization over "Last 1h", "Last 24h", "Last 7d."

### Information Density Improvements

- **Add a sidebar or top nav.** Even a narrow left sidebar with icon-only navigation (Dashboard, Clusters, Jobs, Storage, Alerts, Billing) would dramatically increase fidelity.
- **Add a real-time events log** at the bottom. A small scrollable panel with timestamped events: `14:22:01 run-789: step 12,440 | loss=0.0412 | lr=1.2e-4`.
- **Add cost/billing info.** A card showing "Today's spend: $42,800 | This month: $1.24M | Projected: $1.38M." This ties directly to the `burnRate` state variable.
- **Show more clusters.** 5 clusters is reasonable but the data within each cluster is thin. Add memory utilization, network throughput, and storage I/O bars alongside GPU utilization.
- **Add a "Pending Jobs" queue** below active jobs. Show queued jobs waiting for resources with their priority level and estimated start time.
- **Add alerts/incidents panel.** When `cdzComputeUtilization` is high or a cluster is degraded, show a red alert card with details and suggested actions.

### Visual Polish

- The dark `#0d0d0d` background is good for a monitoring dashboard.
- Cluster status indicators should use pulsing animations for "degraded" and "down" states.
- The bar chart for capability comparison is well done with the fog-of-war opacity and error bars. Consider adding a subtle hatching pattern for "hidden" bars instead of just gray.
- Utilization bars should have gradient fills that shift from green to yellow to orange to red, not discrete color jumps.
- Add subtle grid lines or dotted separators between cluster cards.
- Job status should have distinct badges: a green pulsing dot for "training", a blue spinner for "evaluating", a gray checkmark for "completed."

### Specific Improvement Ideas

1. **Add a narrow left sidebar** (48-56px wide, icon-only) with 6-8 nav icons. Highlight "Dashboard" as active.
2. **Expandable cluster cards.** Use a disclosure triangle. Expanded view shows a 4x4 or 8x8 grid of GPU tiles, each colored by utilization (green/yellow/red), simulating a real GPU rack view.
3. **Integrate cost data.** Add a "Cost" card at the top alongside the existing summary stats. Show hourly burn rate derived from GPU hours and pricing. When `burnRate` state is high, make this card flash with a warning border.
4. **Add a mini event log.** A 4-5 line scrollable log at the bottom of the page, styled like a terminal, showing recent system events with timestamps.
5. **Job progress bars.** Each active job should show a progress bar based on elapsed/ETA ratio, not just text values.
6. **Network/storage metrics row.** Below GPU utilization in each cluster, show two more thin bars for network I/O and storage throughput.

---

## 4. WandBApp

**File**: `packages/client/src/apps/WandBApp.tsx` | **App ID**: `wandb`

### Current State

Renders a Weights & Biases-style experiment tracking UI with:
- Header with yellow "W" logo, project breadcrumb (`openbrain / frontier-model-v3`), and a "1 run active" badge.
- Intel metrics section (from content items of type "chart").
- A run table (3 static runs: one running, one finished, one crashed) with status, loss, and step.
- A Capability Index chart (ComposedChart with Line + Area) showing OB, Prometheus, and China capability over rounds. Includes confidence bands for estimates and dashed lines for estimated values.
- Legend with line style indicators matching accuracy level.
- GPU utilization bars for 4 GPUs (static percentages).

### Real-World Fidelity

**What the real W&B has that this does not:**

- **Left sidebar navigation.** W&B has a sidebar with: Runs, Charts, Artifacts, Sweeps, Reports, System. This is one of the most recognizable elements.
- **Run comparison table.** The real W&B run table is a fully sortable, filterable, column-configurable table with checkboxes for selecting which runs to compare. It shows dozens of columns: run name, status, duration, loss metrics, hyperparameters, hardware, user, tags, notes.
- **Chart panels with controls.** Real W&B charts have controls above them: x-axis selector (step, relative time, wall time), smoothing slider, outlier toggle, log scale toggle. Charts can be resized, rearranged, and pinned.
- **Multiple synchronized charts.** A typical W&B workspace shows 4-8 charts in a grid: train/loss, eval/loss, learning_rate, gradient_norm, throughput, GPU utilization, memory. They all share an x-axis and have linked crosshairs.
- **Run grouping and filtering.** A filter bar at the top: "Status = running", "Tag = frontier", "Created > 2h ago."
- **The W&B color palette.** W&B uses a specific set of run colors (teal, orange, purple, pink, blue) and their sidebar is a distinctive dark navy (`#1a1c2c` or similar).

### Interactivity Gaps

- **Run selection checkboxes.** Each run in the table should have a checkbox. Checked runs appear on the chart overlays.
- **Chart x-axis toggle.** A small button group above the chart to switch between "Step" and "Round" (or "Wall Time" in a real W&B).
- **Smoothing slider.** A small range input that controls chart line smoothing. This is one of the most-used W&B interactions.
- **Hover crosshair on charts.** When hovering, a vertical line should appear across all charts at the same x-position, with value callouts for each line.
- **Run table column sort.** Clicking column headers should sort the table.
- **Expand run details.** Clicking a run row should expand to show config (hyperparameters), summary metrics, system info, and notes.
- **Log scale toggle.** A small icon button to switch the y-axis between linear and log scale.

### Information Density Improvements

- **Add a left sidebar.** Even a collapsed icon-only sidebar with Runs, Charts, Artifacts, Sweeps, Reports, System would massively improve fidelity.
- **Add more charts.** Show a 2x2 grid of small charts: (1) Capability Index (existing), (2) Training Loss curve, (3) Learning Rate schedule, (4) Throughput (tokens/sec or samples/sec). These can all be static or semi-static.
- **Expand the run table.** Add columns: Duration, Created, User, Tags, GPU Type, Config. Show 6-8 runs instead of 3. Add column reorder handles and a "Columns" button.
- **Add a system metrics panel.** Expand the GPU utilization section to include: GPU Memory (% used), CPU utilization, RAM usage, Disk I/O, Network I/O. Show these as small sparkline time-series, not just single bars.
- **Add hyperparameter display.** A collapsible panel showing the training config: `lr: 1.2e-4, batch_size: 2048, warmup: 1000, max_steps: 20000, model: transformer-xl-128B`.
- **Show artifacts.** A section listing model checkpoints: `checkpoint-12440.pt (48.2 GB) | checkpoint-10000.pt (48.2 GB)` etc.

### Visual Polish

- The "W" logo should be the W&B icon (a stylized "W" in their brand yellow `#ffcc33` or similar). Currently it is just a text "W" which is decent.
- The real W&B sidebar background is a dark navy/charcoal, not pure black. Consider `#1b1d2a` or `#13151f` for the sidebar when added.
- Run colors in the table and chart should use the W&B palette: first run is teal, second is orange, third is purple, etc.
- Chart gridlines should be more subtle (`#1a1a1a`). The current `#2a2a2a` is a touch bright.
- The "1 run active" badge is good. Add a small pulsing green dot next to it.
- Run status should use colored dot indicators: green pulsing = running, gray = finished, red = crashed, yellow = queued.

### Specific Improvement Ideas

1. **Add a left sidebar** (180-200px wide) with navigation items: Runs, Charts, Artifacts, Sweeps, Reports, System. Use the W&B dark navy background. Highlight "Charts" as active. Add the full "Weights & Biases" wordmark at the top of the sidebar.
2. **Multi-chart grid.** Replace the single Capability Index chart with a 2-column grid of 4 chart panels. Each panel has a title, the chart, and small controls (x-axis selector, smoothing). Only the Capability Index chart needs to be dynamic; the others can be static SVG or hardcoded Recharts with fake training curves.
3. **Enhanced run table.** Add columns: Duration, Config (truncated), User, Tags. Add a header row with clickable sort arrows. Add run color dots (small colored circles) to the left of each run name, matching the chart line colors.
4. **Filter bar.** Above the run table, add a filter bar with fake filter pills: `Status: running`, `Tag: frontier-v3`. These do not need to be functional but sell the interface.
5. **System metrics sparklines.** Replace the static GPU utilization bars with tiny sparkline charts (8-10 data points each) showing GPU utilization over time.
6. **Config panel.** Below the run table, add a collapsible "Config" section showing a key-value list of hyperparameters in a two-column layout.

---

## Cross-Cutting Themes

### Shared Patterns to Implement Across All Four Apps

1. **Navigation chrome.** Bloomberg has function keys, Sheets has menu bar + formula bar (partially done), Compute and WandB need sidebars. Every real productivity app has navigation; its absence is the single biggest fidelity gap across all four apps.

2. **State-reactive data.** All four apps use mostly static/hardcoded data with minimal connection to game state. More data points should shift based on state variables: when `economicDisruption` rises, Bloomberg tickers should turn red and VIX should spike; when `burnRate` is high, Sheets should show alarming numbers; when capability scores change, WandB charts should reflect new training run dynamics.

3. **Hover states and tooltips.** All four apps have minimal hover interactions. Every data point, every row, every chart element should have a hover state or tooltip. This is the cheapest way to add depth.

4. **Status bars.** All four apps end abruptly at the bottom. Real apps have status bars: Bloomberg has a command line (partially done), Sheets shows selection summary, Compute dashboards show "Last refreshed: 10s ago", WandB shows run duration and step count.

5. **Loading and refresh states.** None of the apps ever show a loading or refreshing state. Briefly showing a skeleton or spinner when the round changes would sell the "live data" feeling.

6. **Font stacking.** Use `font-variant-numeric: tabular-nums` on all numeric data across all four apps to prevent layout jitter when values change.

7. **Information overload as a spectrum.** Bloomberg and WandB should be the most dense (they are professional power-user tools). Sheets should feel dense but structured (rows and columns provide natural ordering). Compute should be moderately dense with clear visual hierarchy (cards, charts, tables). Currently all four are at roughly the same (low) density level.
