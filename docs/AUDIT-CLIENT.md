# Client Package Audit — Findings

## 1. Dead Code / Unnecessary Complexity

**1.1 Duplicate `game:publish` socket handler (HIGH)**
`stores/game.ts` lines 485 and 527 both register `socket.on("game:publish", ...)`. On every publish event, both fire. The first sends a notification; the second appends to `state.publications` and injects content items. Almost certainly a leftover from a refactor. Two handlers on one event is a double state-mutation bug.

**1.2 Dead `notifications` field in UIStore**
`stores/ui.ts` line 20 declares `notifications: Notification[]`, initialized but never read or written. The actual notification system lives in `stores/notifications.ts`. Also, the local `Notification` interface (lines 38–43) shadows the browser global.

**1.3 `Ending.tsx` is a passthrough wrapper with no value**
`screens/Ending.tsx` lines 295–297: `export function Ending() { return <DebriefScreen />; }`. No logic, no props. Dead indirection — call `DebriefScreen` directly.

**1.4 `WandBApp` ignores its `content` prop**
`apps/WandBApp.tsx` line 129: `WandBApp(_props: AppProps)` — the prop is discarded. The app renders fully static data.

**1.5 Inline `<style>` injected on every render in four files**
`desktop/Dock.tsx`, `desktop/MenuBar.tsx`, `desktop/Notifications.tsx`, `apps/NewsApp.tsx` all inject CSS animation keyframes as inline `<style>` elements inside JSX. Each re-render creates a new `<style>` tag in the DOM. Move to a global stylesheet or hoist outside the component.

**1.6 `formatTime(ms)` duplicated verbatim**
`screens/Decision.tsx:7` and `screens/GMDashboard.tsx:9` — identical implementation. Extract to a shared utility.

**1.7 `STATE_LABELS` duplicated**
`screens/Ending.tsx:7–46` and `screens/GMDashboard.tsx:37–76` — identical `Record<keyof StateVariables, string>` constant defined twice.

**1.8 Faction display maps duplicated across 4+ files**
`FACTION_NAMES`, `FACTION_SHORT_NAMES`, `FACTION_COLORS`, `FACTION_THEMES`, `FACTION_PREFIX` — five slightly different versions of the same faction-to-display mapping scattered across Lobby, Resolution, MenuBar, and GMDashboard. These belong in `@takeoff/shared` or a client-level constants file.

**1.9 `VERIFIED_HANDLES` in TwitterApp duplicates data in `STATIC_TWEETS`**
`apps/TwitterApp.tsx` lines 160–171. The set re-lists handles already flagged as `verified: true` in `STATIC_TWEETS`. The check at line 522 (`t.verified || VERIFIED_HANDLES.has(t.handle)`) makes the set redundant for static tweets.

---

## 2. Refactoring Opportunities

**2.1 `SlackApp.sendMessage` stale closure — REAL BUG**
`apps/SlackApp.tsx` lines 81–88: `activeChannel` is read inside `sendMessage` but missing from the `useCallback` dependency array (`[input]` only). If the user switches channels between typing and sending, the message goes to the wrong channel.

**2.2 `SignalApp` computes unread counts in render body without `useMemo`**
`apps/SignalApp.tsx` lines 151–167: `unreadPerPlayer` and `unreadPerContent` are computed via `for` loops in the component body on every render, including on every keystroke.

**2.3 O(n²) contact sort in `SignalApp`**
`apps/SignalApp.tsx` lines 340–349: the sort comparator calls `messages.filter(...)` twice per comparison. For `n` players and `m` messages this is O(m × n²) per render. Pre-compute the last timestamp per contact once with `useMemo`.

**2.4 `EmailApp` — two `useEffect` calls doing the same thing**
`apps/EmailApp.tsx` lines 413–419: `dismissByApp("email")` is called in two separate effects — one with `[]` deps, one with `[content.length]`. Merge into one with `[content.length]`.

**2.5 `EmailApp` read state keyed by array index — broken when `highRegulatory` changes**
`apps/EmailApp.tsx` lines 401–432: `readEmails` is a `Record<number, boolean>` keyed by `_originalIdx`. When `highRegulatory` becomes true, `REGULATORY_EMAIL` is prepended, shifting every subsequent email's index by 1, invalidating all read state. Key by a stable identity instead.

**2.6 `Desktop.tsx` calls `getContentForApp` per-window per-render**
`screens/Desktop.tsx` lines 82–83: `getContentForApp(content, w.appId)` filters the entire `content` array for every visible window on every render. Memoize a `contentByApp` map.

**2.7 `UIStore.openWindow` and `focusWindow` read `get()` outside updater function**
`stores/ui.ts` lines 113–114 and 126–135: both methods call `get()` outside of a `set(s => ...)` updater. This creates a race if two calls happen in the same microtask tick. Use `set((s) => ...)` throughout for consistent state reads.

---

## 3. Potential Bugs

**3.1 (HIGH) Double `game:publish` handler**
Same as 1.1 — both handlers fire, causing potential double notification and double content append.

**3.2 (HIGH) `SlackApp.sendMessage` stale closure**
Same as 2.1 — message sent to wrong channel on rapid channel switching.

**3.3 (MEDIUM) `Decision.tsx` auto-submit stale closure**
`screens/Decision.tsx` lines 135–139: `handleSubmit` captures `individualChoice` and `teamVoteChoice` at creation time. If the timer fires after the user changes a selection (edge case: UI not fully disabled in all states), stale values are submitted.

**3.4 (MEDIUM) `PublishNotificationBanner` — only the oldest notification's auto-dismiss timer runs**
`components/PublishNotificationBanner.tsx` lines 12–21: a single `setTimeout` is created for `notifications[0]`. Notifications 2 and 3 (shown simultaneously) only get timers after the one ahead is dismissed. They linger well past their 6-second target.

**3.5 (MEDIUM) `EmailApp` read state broken by `highRegulatory` prepend**
Same as 2.5 — index-keyed read state is invalidated when regulatory email is prepended.

**3.6 (MEDIUM) `negotiation-pulse` CSS class applied but never defined**
`desktop/Dock.tsx` line 95: `className={isSignalPulsing ? "negotiation-pulse" : undefined}`. The `PULSE_STYLE` constant in the same file defines only `dock-pulse` and `.dock-primary-dot`. `negotiation-pulse` is not defined anywhere in the codebase. The Signal icon produces no visual effect during Round 4 negotiation.

**3.7 (LOW) `Desktop.tsx` subscribes to entire game store — re-renders on every state change**
`screens/Desktop.tsx` line 37: `const { selectedFaction, isGM, phase, content, reconnecting } = useGameStore()` with no selector. Any game state change — GM decision status, team votes, lobby players, timer ticks — causes Desktop to re-render. Use individual selectors per field.

**3.8 (LOW) Socket connect race at import time**
`stores/game.ts` lines 544–547: `socket.connect()` is called at module scope during import. The `connect` handler is registered on the same socket object at line 321. If import order is reordered by the bundler, the handler might be registered after connect fires.

**3.9 (LOW) `MemoApp` page lookup by mutable title string**
`apps/MemoApp.tsx` lines 238–239: `allPages.find((p) => p.title === effectiveTitle)`. If a server document's title changes between content deliveries, the selected page silently changes.

**3.10 (LOW) Suppressed `react-hooks/exhaustive-deps` warnings hiding real deps**
`screens/Briefing.tsx:68` and `screens/Resolution.tsx:114` both have `// eslint-disable-next-line react-hooks/exhaustive-deps` suppressions. The behavior is coincidentally correct today but conceals the dependency chain from future readers.

---

## 4. Overall Observations

**No error boundary anywhere in the tree.**
Any throw during render (e.g. unexpected null in server data) kills the full game session. At minimum wrap each `Window`'s content in an `ErrorBoundary`.

**`use-sound` dependency is unused.**
`package.json` line 21: `"use-sound": "^5.0.0"` is listed as a runtime dependency but never imported. The codebase uses a custom `soundManager` singleton. Remove it.

**`GMDashboard.tsx` is a 700+ line single file.**
Handles timer display, state variable editing, player activity, phase jumping, ending arc preview, and message log — all in one component. Split into independent panel components to enable memoization at each panel boundary.

**Mixed inline styles and Tailwind classes throughout.**
`Decision.tsx`, `Resolution.tsx`, `Briefing.tsx`, `Ending.tsx` use almost exclusively inline `style={{}}` objects with hex values. `Desktop.tsx`, `Lobby.tsx`, `Dock.tsx` use Tailwind. The same color appears as `text-red-400` in one place and `color: "#ef4444"` in another. Pick one approach.

**Socket listener architecture is not tear-downable.**
All socket handlers are registered at module scope in `game.ts` and `messages.ts`. Fine for the current single-session model. If leave-room or restart flows are ever added, there's no mechanism to clean up handlers.
