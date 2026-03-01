# App Audit: Media & Content Apps

**Apps**: TwitterApp, SubstackApp, NewsApp, ArxivApp
**Date**: 2026-03-01

---

## 1. TwitterApp

**File**: `packages/client/src/apps/TwitterApp.tsx` | **App ID**: `twitter`

### Current State

Renders a three-column layout: narrow emoji icon sidebar, central tweet feed, and a right-panel trending section. Tweets come from `content` items of type `"tweet"` or fall back to 5 hardcoded `STATIC_TWEETS`. Each tweet shows an avatar initial (gradient circle), name, handle, timestamp, body text, and reply/retweet/like counts. The trending panel is driven by the `globalMediaCycle` state variable. Interactions are hover-only; nothing actually fires on click.

### Real-World Fidelity

**Good:**
- Black background, blue accent color, `backdrop-blur` sticky header are correct for X dark mode.
- Three-column layout is structurally right.
- Number formatting (`4.8K`) matches X convention.

**Missing:**
- The sidebar is emoji-based (`"⌂", "🔍", "🔔", "✉", "👤"`). Real X uses SVG icons with labels at wider breakpoints. The emoji sidebar feels toy-like.
- No "For You" / "Following" tab toggle in the header -- one of X's most recognizable UI elements.
- No "Post" compose button (the blue pill) in the sidebar.
- Right panel trending is undersized. Real X shows "What's happening" with topic categories, post counts, and sometimes thumbnails.
- No verified badges or blue checkmarks. In a 2026 scenario, verified vs. unverified is a key trust signal.
- Avatar is a single-initial gradient circle. Even a deterministic avatar generator (different colors based on handle hash) would feel more real.
- No "Show this thread" affordances or quote tweets.

### Interactivity Gaps

- **Like/retweet/reply buttons do nothing.** Even local-only state toggles (heart turns red, count increments) would add enormous immersion.
- **No tweet expansion.** Clicking a tweet should open a detail view or expand it.
- **No compose tweet.** SubstackApp lets certain roles publish articles; TwitterApp should let roles post tweets -- the most natural publish action in the game.
- **No image/media previews.** Even placeholder gray boxes would signal media exists.
- **No bookmark or share actions.**
- **Trending tags are not clickable.**

### Information Density

Current density is low: 5 tweets, 4 trending tags.

- Show 10-15 tweets so the feed feels endless.
- Add "Spaces" or "Communities" teaser in the sidebar for visual noise.
- Trending should show 8-10 topics with post counts (e.g., "12.4K posts").
- Add "Who to follow" suggestions in the right panel -- AI researchers, policy figures, journalists. Pure worldbuilding.
- Notification badge count on the bell icon (red dot with "14").
- A "Promoted" label on one tweet for ad realism.
- Thread indicators ("Show this thread" / "1/7" numbering).

### Visual Polish

- Replace emoji sidebar icons with SVG or Lucide icons.
- `hover:bg-white/3` is not a valid Tailwind opacity value -- should be `hover:bg-white/[0.03]` or `hover:bg-white/5`.
- Add verified badges (small blue checkmark) next to certain names.
- Add "Post" pill button at the bottom of the sidebar.
- "New tweets available" banner when content updates arrive.

### Specific Improvement Ideas

1. **Compose tweet action.** Mirror SubstackApp's `publishArticle` pattern but for tweets.
2. **Local interaction state.** Track liked/retweeted per-tweet in component state. Heart toggles red, retweet toggles green.
3. **Thread support.** Long tweets or thread-emoji tweets show "Show this thread" that expands.
4. **Quote tweet rendering.** A `ContentItem` referencing another renders as an embedded quote tweet.
5. **Profile hover cards.** Hovering a name shows a tooltip: "AI Researcher at Prometheus Labs | 45K followers" -- free worldbuilding.
6. **Engagement-aware sorting.** Synthetic engagement numbers proportional to game state (safety tweets get higher engagement when public sentiment is alarmed).

---

## 2. SubstackApp

**File**: `packages/client/src/apps/SubstackApp.tsx` | **App ID**: `substack`

### Current State

Two-panel layout: left sidebar (publication name, nav items, optional "New post" button gated by role) and main area (post list + article body). Supports a compose flow: title input, body textarea, publish button calling `publishArticle()`. Published articles appear in the list and propagate to other apps. Has a "just published" toast and autosave indicator.

This is the most interactive of the four apps. The publish-and-propagate mechanic is strong.

### Real-World Fidelity

**Good:**
- Orange `#ff6719` is exact Substack brand orange.
- Writer dashboard layout (sidebar nav + post list + editor) is structurally correct.
- "Published" / "Draft" status badges match Substack patterns.
- Subscriber count shown below publication name.

**Missing:**
- **No reader view.** Real Substack has writer dashboard (current) and reader/subscriber view (large serif headline, author avatar, publish date, read time, like/comment counts, "Subscribe" button). Most players will be readers, not writers.
- **No comments section.** Even "42 comments" with a few visible would add density.
- **No "Notes" tab** (Substack's short-form post feature).
- **No email-inbox feel.** Substack's primary distribution is email. A hint like "Delivered to your inbox" would reinforce this.
- **No rich formatting.** Article body renders as `<pre>` with `font-sans`. Real Substack has headings, blockquotes, horizontal rules, bold/italic. The static `EDITOR_CONTENT` already uses `**bold**` and `---` markdown syntax that goes unrendered.
- **No analytics.** Sidebar lists "Analytics" but it does nothing.

### Interactivity Gaps

- **No article "like" (heart).** Substack's heart button at the bottom of each article is distinctive.
- **No comment/reply.** Even static comments would add immersion.
- **No "Share" button** (copy link, share to Twitter).
- **Sidebar nav items are non-functional.** "Drafts", "Subscribers", "Analytics", "Settings" do nothing.
- **No "Restacks"** (Substack's repost mechanic).
- **"Save draft" button does nothing.**
- **No markdown or rich text in compose editor.** Even non-functional bold/italic toolbar buttons would add realism.

### Information Density

- Add "Recommended" publications in the sidebar: "Alignment Forum Weekly", "The GPU Report", "China Watcher".
- Show read time estimates next to each post ("8 min read").
- Reader engagement metrics per post: likes, comments, restacks.
- "X people are reading this right now" (fake but atmospheric).

### Visual Polish

- Article body uses `<pre>` with `whitespace-pre-wrap font-sans`. Should render as proper markdown with serif fonts (Georgia, Source Serif Pro).
- Article title should be larger and serif.
- Add author avatar, byline, and date below title.
- Add minimal toolbar strip above compose textarea (B, I, H1, H2, link, image icons, even if non-functional).
- "Published to all feeds" toast should use a slide-in animation.

### Specific Improvement Ideas

1. **Dual-mode rendering.** Publisher roles see the dashboard; reader roles see the reader view with serif typography, hero headline, "Subscribe" CTA, and comment section.
2. **Markdown rendering.** Use a simple markdown-to-HTML renderer for bold, italic, headers, blockquotes, horizontal rules. The static content already uses markdown syntax.
3. **Static comments.** Below each article, show 2-3 static comments with usernames, timestamps, like counts.
4. **Sidebar "Recommended" panel** with 3-4 in-universe publications.
5. **Rich text toolbar in compose mode.** Non-functional icons (B, I, H, link, image) in a toolbar strip.
6. **"Email this post" indicator.** "Sent to 24.1K subscribers via email" below the title.

---

## 3. NewsApp

**File**: `packages/client/src/apps/NewsApp.tsx` | **App ID**: `news`

### Current State

Single-column dark feed styled as a wire service: "WIRE SERVICE" header in monospace, "LIVE" pulse indicator, source badges (Reuters, AP, AFP, Bloomberg), UTC timestamps, headlines, and summaries. Content from `"headline"` type items or 6 `STATIC_STORIES`. Minimal interactivity -- hover states only.

### Real-World Fidelity

**Identity ambiguity:** The app is called "NewsApp" / ID `"news"` but is styled as a professional wire terminal rather than a consumer news aggregator. This should be a deliberate choice. If it is a wire service, lean harder into that identity.

**As a wire service (current direction):**
- Monospace typography, UTC timestamps, source badges, and "LIVE FEED" indicator are good aesthetics.
- Missing: priority levels (URGENT, FLASH, BULLETIN), dateline formatting ("WASHINGTON --"), wire slugs/category codes, update/correction markers, and the rapid-fire cadence of a real wire terminal.

### Interactivity Gaps

- **No article expansion.** Clicking a headline should expand to show full body or longer excerpt.
- **No category filtering.** Header says "TECHNOLOGY | AI POLICY" but no way to filter.
- **No search.**
- **No "Breaking" banner.** Urgent stories need distinct visual treatment (red banner, flash indicator).
- **No bookmarking or flagging.**
- **No story update tracking.** Wire services show "UPDATE 1:", "UPDATE 2:" as stories develop -- excellent for evolving game narrative.

### Information Density

This is the weakest of the four apps for density. A real wire terminal is overwhelming by design.

- Show 12-20 stories, not 6.
- Add priority levels: FLASH (red, bold), URGENT (orange), BULLETIN (yellow), ROUTINE.
- Add dateline formatting: "WASHINGTON, Feb 28 (Reuters) --".
- Add a running ticker/marquee at the bottom with one-line headlines scrolling past.
- Show update timestamps and revision numbers: "Updated 3 times | Last: 10:47 UTC."
- Add story categories/slugs: "TECH-AI-GOVERNANCE", "CHINA-POLICY", "MARKETS-TECH".
- Multiple wire sources per story: "Also reported by: AP, AFP."

### Visual Polish

- `hover:bg-white/3` is invalid Tailwind (same issue as TwitterApp).
- "LIVE" pulse could be paired with "Last updated: X seconds ago" counter.
- Source badges could use source-specific colors: Reuters (orange), AP (red), AFP (blue), Bloomberg (terminal green).
- Subtle "new story" animation: brief yellow flash on newly-arrived items, then fade.
- Running UTC clock in header.

### Specific Improvement Ideas

1. **Priority tier system.** Map `ContentItem.classification` to wire priority: `"critical"` -> FLASH (red), `"context"` -> BULLETIN, `"breadcrumb"` -> ROUTINE, `"red-herring"` -> ROUTINE.
2. **Story expansion on click.** Accordion-expand to reveal longer body text.
3. **Running ticker.** CSS-animated bottom bar scrolling one-line headlines.
4. **"UPDATE" markers.** If the same story appears multiple times, show "UPDATE 2" and link to previous.
5. **Breaking news banner.** Full-width red banner at top when FLASH-priority stories arrive.
6. **Wire-style datelines.** "WASHINGTON, Feb 28 (Reuters) --" formatting.
7. **UTC clock in header.** Ticking clock or static round-appropriate time.

---

## 4. ArxivApp

**File**: `packages/client/src/apps/ArxivApp.tsx` | **App ID**: `arxiv`

### Current State

Styled to resemble arXiv: red `#b31b1b` header bar, static search div, results count line, and a list of papers with category badge, date, linked title (blue), author list, abstract (line-clamped to 3 lines), and `[PDF] [abs] [HTML]` links. Content from `"document"` type items or 5 `STATIC_PAPERS`. No interactivity beyond hover.

### Real-World Fidelity

**Good:**
- Red `#b31b1b` is exact arXiv brand color.
- `[PDF] [abs] [HTML]` link format is spot-on arXiv convention.
- Category badges (`cs.AI`, `cs.LG`, `cs.CY`) are correct taxonomy.
- Results-count bar with sort option matches arXiv search results page.

**Missing:**
- **arXiv paper IDs.** Every arXiv paper has an ID like `2602.18847`. This is one of the most recognizable arXiv elements.
- **No submission vs. revision dates.** arXiv shows "[Submitted on 27 Feb 2026]" and "(v2, last revised 28 Feb 2026)".
- **No cross-listing.** Papers often appear in multiple categories: "cs.AI, cs.LG, cs.CL".
- **No author affiliation links.**
- **No "New submissions" daily listing format.** arXiv category pages show daily submissions with date headers and counts, distinct from the search results format currently used.
- **No citation counts.** While arXiv itself does not show these, Semantic Scholar / Google Scholar integration is ubiquitous. "Cited by: 14" adds density and signals importance.

### Interactivity Gaps

- **No paper expansion / abstract page.** Clicking a title should expand to show full abstract and metadata.
- **No search functionality.** The search bar is a static div.
- **`[PDF]` / `[abs]` / `[HTML]` links do nothing.**
- **No "Save to library" / bookmark.**
- **No category navigation.** `cs.AI | cs.LG | cs.CY` in header are not clickable.
- **No pagination.**

### Information Density

- Show 8-12 papers (researchers scan long lists).
- Add arXiv IDs (`arXiv:2602.18847`) next to each paper.
- Add cross-listed categories per paper.
- Show citation counts ("Cited by 14 | 3 code repositories").
- Add "Recent" section showing daily submission counts: "cs.AI: 47 new, 12 cross-listed".
- Add "Subjects" / "Comments" / "Journal-ref" metadata lines matching arXiv's format.
- Show version history: "(v1) Submitted 27 Feb 2026; (v2) Revised 28 Feb 2026."

### Visual Polish

- Header search box is a plain div. Give it an input field with placeholder: "Search arXiv (e.g., alignment, RLHF, compute governance)".
- The arXiv logo could be more faithful (the real site renders the "X" distinctly as the chi character).
- Author names should be comma-separated blue links.
- Category badge could show full name on hover: `cs.AI` -> "Artificial Intelligence".
- Add a footer: "arXiv is a free distribution service and an open-access archive..." (on every real arXiv page).
- Add "new" / "recent" / "current" tabs matching real arXiv category pages.

### Specific Improvement Ideas

1. **arXiv IDs.** Generate deterministic fake IDs: `arXiv:2602.{10000 + index}`.
2. **Paper detail expansion.** Click to expand: full abstract, full author list, submission metadata, subjects, comments, simulated BibTeX export.
3. **Client-side search.** Make the search bar filter papers by title/abstract/author text match.
4. **Category filter tabs.** Make `cs.AI | cs.LG | cs.CY` clickable to filter. "All" shows everything.
5. **Citation and code badges.** "Cited by: N | Code: GitHub | Related: M papers" below each abstract.
6. **Daily submissions header.** "New submissions for [game date], showing 1-N of N entries for cs.AI" with "new | cross-lists | replacements" tabs.
7. **Version indicators.** Show `(v1)` or `(v2)` next to dates.

---

## Cross-Cutting Observations

### Shared Pattern: Content Fallback
All four apps filter `content` by type, fall back to static data if none match. This is sound, but static datasets are sparse. Consider 10-15 items each so apps feel alive even at game start.

### Shared Gap: No Content Mixing
Each app filters exactly one `ContentItem.type`. In reality, a Twitter feed surfaces news headlines, an arXiv paper gets discussed on Substack, a wire service reports a viral tweet. Cross-pollination would make the information ecosystem feel interconnected and more overwhelming -- directly serving the "information overload" mechanic.

### Shared Gap: No Timestamps Relative to Game Clock
All timestamps are static strings. Relative timestamps ("2 minutes ago", "Just now") tied to the game clock would make feeds feel live.

### Shared Gap: No Visual Distinction for Content Classification
`ContentItem` has a `classification` field (`"critical"`, `"context"`, `"red-herring"`, `"breadcrumb"`) but none of the apps use it visually. Critical items could have a subtle left-border accent. Red herrings should look equally important (deliberately misleading), but breadcrumbs could reward careful readers with slightly different styling. Any distinction must be subtle enough not to give away the game.

### Shared Gap: No Loading / Skeleton States
No visual indication of "more content coming" when transitioning between rounds. A skeleton/shimmer loading state would add polish.

### Shared Gap: Invalid Tailwind Classes
`hover:bg-white/3` in TwitterApp and NewsApp is not valid Tailwind (opacity goes by 5s, or requires bracket notation `[0.03]`). Standardize across all apps.

### Information Overload Multiplier Ideas

1. **Notification badges.** Unread counts on app tabs: "Twitter (7)", "News (3)", "arXiv (2 new)". Players should feel they cannot keep up.
2. **Cross-app references.** A tweet references a Substack article. A headline references an arXiv paper. An arXiv paper cites a news event. Cross-references force context-switching.
3. **Time pressure indicators.** "Published 30 seconds ago." "Trending for 4 hours." "Viewed 1,247 times today." Events move faster than the player can process.
4. **Contradictory information.** Two sources report contradictory details. Two tweets take opposite positions. Forces credibility evaluation -- a core game skill.
5. **Volume escalation across rounds.** Round 1: 5 items per app. Round 3: 12. Round 5: 20. Information load scales with narrative tension.
