# Communication App Audit: SlackApp, EmailApp, SignalApp, MemoApp

Audit of the four communication-oriented apps in the AI 2027 tabletop game. Each app is evaluated for real-world fidelity, interactivity, information density, visual polish, and concrete improvement opportunities.

---

## 1. SlackApp (`packages/client/src/apps/SlackApp.tsx`)

### Current State

Renders a two-pane layout: a 192px sidebar with a static list of seven hardcoded channels and a main chat area. The sidebar shows "OpenBrain" workspace branding with a green "Active" dot. The main pane is pinned to `#general` and displays two interleaved message streams: scripted intel content items and live team-chat messages from the same faction. Players can type messages and send them via Enter. Messages auto-scroll and are marked read when the app is open.

Channels in the sidebar are non-functional -- clicking them does nothing. All messages land in the same `#general` view regardless of their `channel` property.

### Real-World Fidelity

**What it gets right:** The aubergine/purple sidebar color (`#3f0f40`) is a recognizable Slack color. The workspace name + status dot, channel list with `#` prefix, and message layout with avatar/name/timestamp are all correct structural choices. The message input area with placeholder "Message #general" matches Slack conventions.

**What is missing or wrong:**

- **Channel switching is entirely absent.** Real Slack's core interaction is navigating between channels. Clicking a channel in the sidebar should filter messages to that channel. This is the single largest fidelity gap.
- **No DM section in the sidebar.** Real Slack has "Direct Messages" below "Channels" with online/offline indicators per person.
- **No "Threads" sidebar section or thread replies.** Slack's threading is a major organizational feature. A "Threads" nav item in the sidebar and the ability to see a reply count below messages would add density.
- **No channel header details.** Real Slack shows member count, topic, pins, and a search icon in the channel header bar. The current header is just `#general . team chat`.
- **No hover states on messages.** Real Slack shows a floating toolbar on message hover with emoji react, reply, bookmark, and more-actions buttons.
- **No workspace dropdown.** Real Slack has a chevron next to the workspace name for switching workspaces, preferences, etc.
- **No unread indicators on channels.** Real Slack bolds channel names and shows a bullet or unread count badge when a channel has unread messages. This would massively increase the "information overload" feeling.
- **No "Unreads" or "Mentions & reactions" sections** at the top of the sidebar.
- **Missing Slack's distinctive font.** Slack uses Lato. The app uses the default sans-serif.

### Interactivity Gaps

- **Channel navigation:** Clicking a channel should filter the displayed messages. Even if all intel goes to `#general`, having a few messages scattered across `#research` and `#alignment` with unread badges would create a more realistic feeling.
- **Emoji reactions:** A simple click-to-react on messages. Even decorative-only reactions would help. Pre-scripted messages could arrive with existing reaction counts (e.g., a thumbs-up with "3" on an announcement).
- **Thread indicator:** Messages could show "2 replies" as a clickable link, even if the thread view is read-only.
- **Message hover toolbar:** Show a floating action bar on hover. Buttons do not need to do anything beyond visual presence to add fidelity.
- **Star/pin messages:** A star icon on hover that toggles a visual state.
- **Typing indicator:** When another player is composing a message, show "PlayerName is typing..." at the bottom. The infrastructure for this exists (socket-based messages).
- **Search:** The top bar could have a search input (even non-functional) to match Slack's prominent search box.

### Information Density

The sidebar is sparse. Concrete additions for overload:

- Add a "Starred" section with 1-2 items.
- Add a "Direct Messages" section listing 3-5 NPC names with online/offline dots.
- Show unread count badges (white number on red/blue pill) next to 2-3 channels.
- Show a "# mentions" badge somewhere.
- Add a "Huddle" indicator showing "2 in huddle" on one channel.
- Channel topics visible as grey subtext under channel names.
- A small "Drafts" section with a count.

### Visual Polish

- The avatar circles use `rounded` (4px border-radius). Real Slack uses `rounded` for workspace icons but varies for user avatars. The square-with-rounding is actually correct for Slack (not circular like Signal).
- The message text is `text-xs` (12px) everywhere. Real Slack uses 15px body text. The text feels cramped. Consider `text-sm` (14px) for message body while keeping metadata at `text-xs`.
- The sidebar channels lack the `#` icon that Slack uses (a small hash icon distinct from the text). Currently it is just inline text.
- The input area is missing the rich-text formatting toolbar that real Slack shows (bold, italic, strikethrough, link, list, code, @mention, emoji, attach). Even a row of greyed-out icon buttons would add fidelity.
- The send button is a plain `arrow` character. Real Slack uses a paper-plane icon that only appears (or becomes active) when text is present.
- Consider a thin green left-border or subtle background highlight on the active channel rather than `bg-white/20`.
- Add a subtle animation/transition when switching channels.

### Specific Improvement Ideas (Priority Order)

1. **Make channels clickable and filter messages by `channel` field.** This is the highest-impact single change. Messages with `channel: "#research"` should only appear when that channel is selected.
2. **Add unread badges to sidebar channels.** Count unread messages per channel and show a bold name + count badge. This immediately creates information-overload pressure.
3. **Add a "Direct Messages" section to the sidebar** listing NPC contacts and/or same-faction teammates, with online dots.
4. **Add hover toolbar on messages** with emoji react, thread, and bookmark icons. Even non-functional, this dramatically increases fidelity.
5. **Show pre-seeded emoji reactions on scripted content messages** (e.g., `eyes: 2, +1: 4` below an announcement).
6. **Add a typing indicator** using socket events when teammates are composing.
7. **Add a rich-text toolbar strip** below the input field with greyed-out formatting icons.
8. **Increase body text size** from `text-xs` to `text-sm` for message content.

---

## 2. EmailApp (`packages/client/src/apps/EmailApp.tsx`)

### Current State

Renders a two-pane email client: a 224px email list on the left, a reading pane on the right. Contains five hardcoded "static" emails as fallback content, plus dynamic content from `ContentItem[]`. A conditional "Congressional Inquiry" email is injected at the top when the `regulatoryPressure` state variable exceeds 50. The reading pane shows subject, from, timestamp, and body text. There is a special "Whistleblower Action" panel at the bottom of the reading pane for the `ob_safety` role that allows leaking memos to the press.

The search bar is non-functional (just a styled div). There is no compose, reply, forward, delete, archive, or any standard email action. There are no folders, labels, or categories.

### Real-World Fidelity

**What it gets right:** The dark theme is a reasonable stylistic choice for a corporate email client. The two-pane layout (list + reader) is the canonical email UI pattern. Unread indicators (bold name, blue dot) are correct. The preview text truncation matches real email clients. The "Leak to Press" mechanic is a great game-specific addition.

**What is missing or wrong:**

- **No folder/label sidebar.** Real email clients (Gmail, Outlook, Apple Mail) always have a sidebar with Inbox, Sent, Drafts, Starred, Spam, Trash, and custom labels/folders. This is a glaring absence -- there is no navigation at all.
- **No toolbar above the email list.** Real clients show checkboxes, archive/delete buttons, mark-as-read, move-to-folder, and a refresh button.
- **No compose button.** The most prominent element in any email client (Gmail's big blue "Compose" button, Outlook's "New Email") is completely missing.
- **No reply/forward/actions in the reading pane.** Real email clients show Reply, Reply All, Forward buttons. Even a decorative toolbar would help.
- **No CC/BCC/To fields visible in the reading pane header.** Real email reading views show the full recipient list.
- **No attachment indicators.** Some static emails mention "attached" but there is no paperclip icon or attachment badge.
- **No email timestamp grouping.** Real clients group emails by "Today", "Yesterday", "This Week", etc. The current list is flat.
- **No star/flag toggle.** Real clients let you star/flag emails in the list view.
- **No multi-select or bulk actions.**
- **No unread count in the app chrome.** The email list has blue dots but there is no "Inbox (3)" label.

### Interactivity Gaps

- **Add a folder sidebar** (Inbox, Sent, Drafts, Archive) on the left. The current email list should shift to become the second pane. Folders can be non-functional but their presence adds significant realism.
- **Add a compose modal/action.** Clicking "Compose" could open a simple reply form. Allowing the player to compose and "send" emails to NPCs or other players would add a gameplay dimension. Even a non-functional compose button with a tooltip "Coming soon" is better than nothing.
- **Add Reply/Forward buttons** in the reading pane header.
- **Add star/flag toggle** on each email row.
- **Add attachment icons** on emails that mention attachments.
- **Add keyboard shortcuts** (j/k for next/prev, e for archive, s for star).

### Information Density

The email list could be much denser:

- Add a folder sidebar showing "Inbox (7), Sent (24), Drafts (1), Starred (2), Spam (14), Trash (3)". These numbers alone create overload.
- Add a "Priority" or "Focused" tab at the top of the inbox (like Outlook's Focused/Other tabs or Gmail's Primary/Social/Promotions).
- Show more static emails. Five is too few. Real inboxes have dozens. Even 10-15 rows of varying read/unread states would feel more realistic.
- Add a "3 new messages" banner that appears when new content arrives mid-round.
- Show email labels/tags inline (e.g., colored pills for "Internal", "External", "Urgent", "Board").
- Add a count badge to the attachment paperclip (e.g., "2 attachments").

### Visual Polish

- The dark background (`#111`) is fine but lacks the subtle layering real email clients use. Consider a slightly lighter shade for the reading pane (`#1a1a1a`) to create visual separation.
- The search bar is a flat grey rectangle. Real search bars have a magnifying glass icon, placeholder text "Search mail...", and a subtle border.
- The email list items could use a left-border color indicator for categories (blue for personal, green for updates, yellow for important) similar to how Gmail and Outlook use color coding.
- The reading pane body uses `<pre>` with `font-sans`. This works but real email clients render HTML emails with paragraph spacing, links, signatures with different styling. Consider parsing basic markdown in email bodies.
- The "Whistleblower" panel is great but its red styling makes it look like an error state. Consider making it more clandestine: a subtle bottom-bar with a small icon that expands on click, so the player has to discover the action.
- Add a miniature profile picture or initials avatar next to the sender name in the reading pane.

### Specific Improvement Ideas (Priority Order)

1. **Add a folder sidebar** with Inbox, Sent, Drafts, Archive, Starred. Show unread counts. Non-functional clicking is fine -- just always show Inbox.
2. **Increase the number of static fallback emails** from 5 to 12-15 with diverse senders, subjects, and read/unread states.
3. **Add a compose button** at the top of the sidebar. Even if it just opens an empty modal with To/Subject/Body fields and a "Send" button, it adds immersion.
4. **Add Reply/Forward toolbar** in the reading pane header area.
5. **Add star/flag toggle** per email row (visual-only state is fine).
6. **Add attachment indicators** (paperclip icon) on relevant emails.
7. **Add email category tabs** ("Focused / Other" or "Primary / Updates / Promotions") above the email list.
8. **Add a real search interaction** -- typing in the search box filters visible emails by subject/sender/body match.
9. **Refine the whistleblower UI** to be more discoverable but less visually alarming. Consider a small, unassuming icon in the toolbar that expands to reveal the leak action.

---

## 3. SignalApp (`packages/client/src/apps/SignalApp.tsx`)

### Current State

Renders a two-pane layout: a 208px contact list on the left and a conversation view on the right. The contact list dynamically shows players from other factions (cross-faction DM targets) and an "Intel Feed" pseudo-contact for scripted intel content. The conversation view uses Signal-style chat bubbles (blue for sent, dark grey for received, amber for intel). Unread counts per player appear as blue badges. Messages are sent via socket with a specific `to` target. The send button is a circular blue button with a triangle icon.

This is the most interactive of the four apps: it supports real bidirectional messaging between players across factions.

### Real-World Fidelity

**What it gets right:** The dark background (`#1b1b1b`), the rounded chat bubbles, the circular send button, and the contact list with preview text all closely match Signal Desktop. The blue-for-sent / grey-for-received color split is correct. The timestamp placement inside bubbles is correct. Unread badge positioning is appropriate.

**What is missing or wrong:**

- **No disappearing message timer icon.** Signal is famous for disappearing messages. A small timer icon in the header or per-message would add thematic flavor (especially fitting for secretive cross-faction DMs).
- **No "Safety Number" or verification badge.** Signal shows a shield/checkmark icon when the safety number is verified. This is a signature Signal UI element.
- **No delivery/read receipts.** Signal shows a single checkmark (delivered), double checkmark (read), and a clock (sending) on sent messages. This is one of Signal's most recognizable UI patterns.
- **No profile photos.** Signal uses circular profile photos. The current initials-in-circle is acceptable but photos or procedurally-generated avatars would be better.
- **No "Note to Self" contact.** Signal always has this at the top of the contact list.
- **No group chat capability.** Signal supports group chats. A pre-existing "Back Channel" group with 3-4 NPCs could add narrative depth.
- **No media/file sharing.** Real Signal has attachment, camera, GIF, and voice note buttons next to the input.
- **The header bar is too minimal.** Real Signal Desktop shows a video call icon, voice call icon, and a kebab menu (three dots) in the conversation header.
- **No search.** Real Signal has a search icon at the top of the contact list.
- **No "New Message" button.** Real Signal has a compose/pencil icon to start a new conversation.
- **The Intel Feed contact uses an emoji (satellite dish) as an avatar.** This breaks the style consistency. Consider using a styled icon or initial instead.

### Interactivity Gaps

- **Delivery/read receipts** (checkmarks on sent messages). Could be purely visual -- show a single check immediately, then double-check after a few seconds. This would add significant authenticity.
- **Typing indicator** ("PlayerName is typing..."). Would require socket events but is straightforward.
- **Disappearing messages toggle** in the conversation header. Visual-only toggle that shows a timer icon per message.
- **Message reactions.** Signal now supports emoji reactions on messages. A long-press or double-click to react would add interactivity.
- **Reply-to-message (quoting).** Signal allows replying to a specific message with a quote preview above the reply. This is helpful for strategic DM conversations.
- **Voice/video call buttons** in the header (non-functional, just present for fidelity).
- **Swipe to reply** (or right-click context menu with Reply, Copy, Delete options).

### Information Density

The contact list is lean because it only shows real players from other factions. To increase density:

- Add 3-5 NPC contacts with pre-seeded last-message previews (e.g., "Anonymous Source: Check your email regarding...", "Kira Nakamura: The board meeting went sideways", "DC Contact: Call me when you can").
- Add a "Back Channel" group chat contact with an unread badge.
- Show "last seen" timestamps under contact names ("last seen 3 min ago").
- Add a pinned contacts section at the top.
- Show media thumbnails for "recent media" in the conversation header info.

### Visual Polish

- The send button uses a triangle character. Real Signal uses a proper paper-plane or arrow icon. Consider an SVG arrow icon.
- The input field uses `rounded-full` which is correct for Signal.
- The bubble corner rounding (`rounded-2xl` with `rounded-br-sm` for sent) is a nice touch. Real Signal uses slightly more subtle corner variation -- `rounded-xl` with `rounded-br-none` might be closer.
- Add a subtle fade-in animation when new messages appear.
- The conversation header could show an "online" indicator (green dot) or "last seen" time next to the contact name.
- The contact list divider lines are very subtle (`border-white/5`). Real Signal Desktop uses a slightly more visible separator.
- Consider adding a subtle encryption badge or "Messages are end-to-end encrypted" banner at the top of each conversation (this is a signature Signal element).

### Specific Improvement Ideas (Priority Order)

1. **Add delivery/read receipt checkmarks** on sent messages. Single grey check -> double blue check after 2 seconds. Purely visual timer, no server state needed.
2. **Add typing indicator** using socket events. Show "PlayerName is typing..." with the three-dot animation.
3. **Add NPC contacts** with pre-seeded conversations to increase density. These could carry narrative intel in a more organic way than the "Intel Feed" pseudo-contact.
4. **Add "Messages are end-to-end encrypted" banner** at the top of each conversation. This is Signal's most iconic UI element.
5. **Add message reactions** (double-click or long-press to show emoji picker).
6. **Add reply-to-message quoting** (click a message to quote it in your reply).
7. **Add voice/video call icons** in the conversation header (non-functional).
8. **Replace the Intel Feed emoji avatar** with a styled icon or initial that matches the app's visual language.
9. **Add a disappearing messages timer icon** in the conversation header for thematic flavor.

---

## 4. MemoApp (`packages/client/src/apps/MemoApp.tsx`)

### Current State

Renders a two-pane document viewer: a 176px sidebar listing document pages and a main reading pane. Falls back to a static "Alignment Strategy -- Internal Working Document" with a custom markdown renderer that handles headings, bold, checkboxes, horizontal rules, and table rows. When dynamic content items are present, it shows them as selectable pages. A sidebar "New page" button exists but is non-functional.

The markdown rendering is partial: it handles `#`, `##`, `*italic*`, `**bold**`, `- [ ]` checkboxes, `---`, and basic table rows. It does not handle links, images, ordered lists, blockquotes, or code blocks.

### Real-World Fidelity

The closest real-world analog is Notion, Google Docs, or a Confluence wiki page. The current implementation borrows most from Notion (sidebar page list, clean document layout, page emoji icons).

**What it gets right:** The white background, centered content column (`max-w-2xl mx-auto`), page list sidebar, and clean typography are all very Notion-like. The document emoji icons in the sidebar are a nice touch. The checkbox rendering creates interactivity.

**What is missing or wrong:**

- **No breadcrumb navigation.** Notion shows a breadcrumb trail at the top of the page (e.g., "OpenBrain / Engineering / Alignment Strategy"). This is a signature Notion element.
- **No page icon/cover image.** Notion pages often have an emoji icon and a color banner at the top. Consider adding a subtle colored bar or emoji before the page title.
- **No "Last edited by" indicator in the page header.** The static content has this embedded in markdown but it should be a UI element (avatar + name + timestamp).
- **No comments or annotations.** Notion and Google Docs support inline comments. Even showing a few pre-seeded comment markers (small avatars in the right margin) would add density.
- **No table of contents.** Notion shows a floating TOC for long documents. This would help with the "Alignment Strategy" doc.
- **No page properties/metadata.** Notion has a properties section (Status, Owner, Due Date) at the top of pages.
- **No sharing/permission indicators.** Notion shows "Share" button and who has access. A "Shared with: Leadership Team" indicator would add realism.
- **No version history or "Last edited 3 hours ago" in the header.**
- **No favorite/star toggle per page.**
- **The sidebar lacks hierarchy.** Notion pages are nested (parent/child). The flat list feels more like a file browser.

### Interactivity Gaps

- **Checkbox toggling.** The checkboxes render via `<input type="checkbox">` but toggling them does not persist or trigger any game state change. If checkboxes could be toggled and the state communicated (e.g., "player checked off 'Brief board on discrepancy'"), it could become a gameplay mechanic.
- **Page creation.** The "New page" button is present but non-functional. Even opening a blank page with an editable title would add interactivity.
- **Inline editing.** If the document text were editable (contentEditable or a simple textarea mode), players could draft memos, strategy docs, or talking points. This transforms the app from a passive viewer into an active tool.
- **Search across pages.** A search input in the sidebar that filters pages by title or body content.
- **Page reordering.** Drag-and-drop to reorder pages in the sidebar.
- **Copy/share button.** A button that copies the document text to clipboard, or "shares" it to another app (e.g., paste into Slack or Email).

### Information Density

The sidebar is sparse with only a few items. To increase density:

- Add nested page hierarchy. Under "Alignment Strategy", show indented sub-pages like "Appendix A: Eval Results", "Appendix B: External Audit", "Meeting Notes 2/24".
- Add page icons that vary: some with warning emoji, some with lock emoji, some with chart emoji.
- Add a "Favorites" section at the top of the sidebar with 2-3 starred pages.
- Add a "Recent" section showing recently viewed pages with timestamps.
- Add a "Shared with me" section.
- Show word count or reading time at the top of the document.
- Add inline mentions (highlighted text like "@Chen" or "@Safety Team" that look like Notion @-mentions).
- Add a few "resolved" and "unresolved" comment indicators in the right margin.
- Add a "3 updates since you last viewed" banner at the top of the page.

### Visual Polish

- The sidebar `bg-neutral-50` is correct for Notion's light theme.
- The document title could be larger and bolder -- Notion uses very large page titles (text-3xl or text-4xl, font-bold, with generous top padding).
- The markdown rendering should handle more cases: blockquotes (indented with left blue border), code blocks (grey background), and inline code (subtle grey background with monospace font).
- Table rendering is broken: `<tr>` elements are rendered inside a `<div>` parent without a `<table>` wrapper. This likely causes rendering issues in browsers.
- The sidebar page items could show a subtle "last edited" time next to the title ("3h ago").
- Add a subtle hover effect on the document body that shows a drag handle (six dots) to the left of blocks, mimicking Notion's block handles.
- The "New page" button should look more like Notion's: a subtle `+` icon with grey text that highlights on hover.
- Consider adding a cover image strip (a subtle gradient or solid color band) at the top of the page above the title.

### Specific Improvement Ideas (Priority Order)

1. **Fix table rendering.** Wrap `<tr>` elements in a proper `<table>` with `<thead>` and `<tbody>`. Style the table with Notion-like borders and padding.
2. **Add breadcrumb navigation** at the top of the page (e.g., "OpenBrain > Internal Docs > Alignment Strategy").
3. **Add page metadata block** below the title: Status (Draft/Final/Archived), Owner, Last edited timestamp, Shared with.
4. **Add more static fallback pages** so the sidebar is not sparse. Include "Q1 Board Deck", "Compute Budget 2026", "Hiring Pipeline", "Incident Report: Feb 15" with realistic body content.
5. **Add inline comments** as decorative margin indicators. Show 2-3 small avatar circles in the right margin at different paragraph positions.
6. **Expand the markdown renderer** to handle blockquotes, code blocks, inline code, ordered lists, and links.
7. **Add a "Last edited by X, Y hours ago"** header below the page title.
8. **Make the "New page" button functional** -- open a blank page with an editable title field.
9. **Add nested page hierarchy** in the sidebar for realism.
10. **Add a search input** in the sidebar header.

---

## Cross-Cutting Themes

### Shared Improvements Across All Four Apps

1. **Information overload is underdelivered.** All four apps are too clean and minimal. Real communication tools are noisy. Every app should have more items, more badges, more unread counts, more sidebar sections. The game mechanic of information overload requires the player to triage -- but currently there is not enough to triage.

2. **Sidebars are too narrow and sparse.** The sidebar widths (176-224px) are reasonable but the content within them is minimal. Real apps pack their sidebars with sections, collapsible groups, badges, and indicators.

3. **No cross-app linking.** Communication naturally cross-references: an email mentions "see the memo I shared in Slack", a Slack message says "check your Signal DMs." Adding body-text references to other apps (even as plain text) would make the information web feel interconnected.

4. **No timestamps relative to game time.** All apps should use game-world time (not real-world `Date.now()`). Showing "Feb 27, 2026" or "3 hours ago" in game-time creates narrative coherence.

5. **No keyboard shortcuts.** Real desktop apps are keyboard-driven. Adding even basic shortcuts (Cmd+K for search, up/down arrows for navigation, Cmd+Enter for send) would increase the "desktop simulation" fidelity.

6. **Sounds and notifications are underused.** The message store plays `slack-knock` for all incoming messages. Consider differentiating sounds per app (Slack's distinctive "knock" vs. Signal's notification chime vs. email's subtle ding). New content arriving in Email and Memo apps should also trigger notifications.

7. **No loading/skeleton states.** When content arrives, it pops in instantly. A brief skeleton state or shimmer animation when switching contexts (changing channels, opening an email, switching contacts) would add polish.

### Priority Ranking Across All Apps

If resources are limited, the highest-impact improvements in order:

1. **SlackApp: Make channels clickable** with per-channel message filtering and unread badges.
2. **EmailApp: Add a folder sidebar** with unread counts and more static emails.
3. **SignalApp: Add delivery receipts and typing indicator.**
4. **MemoApp: Fix table rendering and add breadcrumbs.**
5. **All apps: Add more static content** for denser information overload.
6. **SlackApp: Add message hover toolbar and emoji reactions.**
7. **EmailApp: Add compose/reply capability.**
8. **SignalApp: Add NPC contacts with pre-seeded conversations.**
9. **MemoApp: Add page metadata and inline comments.**
10. **All apps: Add cross-app content references.**
