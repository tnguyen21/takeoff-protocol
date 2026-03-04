# Player View Preview — GM Dashboard Overlay

## Context

The GM dashboard shows player names/roles but has no way to see what a specific player's desktop actually looks like — their content items, apps, fogged state. Currently the only option is opening a separate `dev:bootstrap` tab, which creates a different room entirely. We want a click-on-player → modal overlay that shows that player's view.

## Approach

**Server**: New `gm:preview-content` socket event that returns the `AppContent[]` a player would receive (reuses existing `getContentForPlayer`).

**Client**: New `PlayerPreview` modal component rendered from `GMDashboard`. Click a player row → modal opens with:
- Tabbed app bar (the player's available apps from their faction config)
- App content rendered using existing `APP_COMPONENTS` with server-returned content
- Fogged state sidebar showing what that player's state visibility looks like
- Slack/Signal tabs show a placeholder ("live messaging — not previewable")

**Scope decision**: Apps that read `stateView`/`stateHistory` from the global store will show the GM's true values (not fogged) in charts. The fog sidebar compensates — it shows the player's actual fog view. This avoids touching ~10 app files for a v1 dev tool. Can add context-based store override later if needed.

## Files to Change

### 1. `packages/server/src/events.ts`
- Add `gm:preview-content` socket handler near other GM controls (~line 243)
- Takes `{ faction, role }`, calls `getContentForPlayer(room.round, faction, role, room.state)`
- Returns `{ ok: true, content: AppContent[] }`
- Gated on `room.gmId === socket.id`
- Add import: `getContentForPlayer` from `./content/loader.js`

### 2. `packages/client/src/components/PlayerPreview.tsx` (new file)
- Props: `faction, role, playerName, round, gmRawState, onClose`
- On mount: emits `gm:preview-content` → gets `AppContent[]`
- Computes fog view via `computeFogView(gmRawState, faction, role, round)` (already in shared)
- Renders full-screen modal overlay:
  - Header: player name, role label, faction badge, close button
  - Tab bar: faction's apps from `FACTIONS.find(f => f.id === faction).apps`
  - Content area: renders `APP_COMPONENTS[activeApp]` with filtered content
  - Right sidebar: fogged state view (simplified fog inspector)
- Slack/Signal tabs show placeholder text
- Closes on Escape or backdrop click
- Uses `APP_COMPONENTS` from `apps/index.ts` and `getContentForApp` from `stores/game.ts`

### 3. `packages/client/src/screens/GMDashboard.tsx`
- Add state: `previewPlayer: { faction, role, name } | null`
- Make player rows in the player panel clickable → `setPreviewPlayer(...)`
- Render `<PlayerPreview>` when `previewPlayer` is set
- Import `PlayerPreview` from `../components/PlayerPreview.js`

### 4. Remove the "view" link added earlier
- The `<a href=... target="_blank">view</a>` link on player rows in GMDashboard becomes redundant — clicking the row itself opens the preview now

## Verification
1. `bun run typecheck` — all packages pass
2. `bun run test` — existing tests pass
3. Manual: start dev server, open GM dashboard (`?dev=1&...&gm=1`), click a player, verify modal shows their apps with correct content items
