# Implementation Plan

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Bun | Fast, built-in TS, built-in test runner |
| Monorepo | Bun workspaces | `packages/{client,server,shared}` |
| Frontend | React 19 + TypeScript | SPA, desktop simulation |
| Bundler | Vite | HMR, fast builds |
| Client state | Zustand | Minimal boilerplate, works well with external event sources (sockets) |
| Styling | Tailwind CSS | Rapid UI dev, easy to theme for macOS look |
| Desktop UI | Custom window manager | Draggable/resizable windows with z-ordering — no off-the-shelf lib matches what we need |
| Backend | Hono | Lightweight, Bun-native, serves static + WebSocket upgrade |
| WebSocket | Socket.io | Rooms, reconnection, fallback transport, namespace support |
| Game state | Server-authoritative, in-memory | No DB for MVP — game sessions are ephemeral (~2hr) |
| Charts | Recharts or lightweight SVG | W&B training curves, state variable bars, Bloomberg charts |
| Shared | `@takeoff/shared` package | TypeScript types, game constants, state resolution logic |

---

## Project Structure

```
takeoff-protocol/
├── packages/
│   ├── shared/              # Types, constants, game logic
│   │   └── src/
│   │       ├── types.ts           # All shared type definitions
│   │       ├── constants.ts       # Factions, roles, rounds, app configs
│   │       ├── state.ts           # State variable definitions + defaults
│   │       ├── decisions.ts       # Decision definitions per round
│   │       ├── resolution.ts      # Decision → state-change resolver
│   │       └── fog.ts             # Fog-of-war view computation
│   │
│   ├── server/              # Game server
│   │   └── src/
│   │       ├── index.ts           # Hono app + Socket.io setup
│   │       ├── rooms.ts           # Room lifecycle (create, join, start)
│   │       ├── game.ts            # Game loop: phases, timers, transitions
│   │       ├── state.ts           # Server-side GameState management
│   │       ├── events.ts          # Socket event handlers
│   │       ├── gm.ts              # GM-specific handlers (advance, inject, override)
│   │       └── content/
│   │           ├── loader.ts      # Loads round content from JSON/YAML
│   │           └── rounds/        # Pre-written content per round
│   │               ├── round1.json
│   │               ├── round2.json
│   │               ├── round3.json
│   │               ├── round4.json
│   │               └── round5.json
│   │
│   └── client/              # React SPA
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── socket.ts          # Socket.io client singleton
│           │
│           ├── stores/
│           │   ├── game.ts        # Game state (from server via socket)
│           │   ├── ui.ts          # Window positions, focus, open apps
│           │   └── messages.ts    # DMs, team chat messages
│           │
│           ├── screens/
│           │   ├── Lobby.tsx      # Room code entry, role selection
│           │   ├── Desktop.tsx    # The main game screen
│           │   ├── Briefing.tsx   # Full-screen GM briefing overlay
│           │   ├── Decision.tsx   # Decision modal
│           │   └── Ending.tsx     # Composite ending montage
│           │
│           ├── desktop/
│           │   ├── MenuBar.tsx    # Top bar: date, timer, notifications
│           │   ├── Dock.tsx       # Bottom dock with app icons
│           │   ├── Window.tsx     # Generic draggable/resizable window
│           │   └── WindowManager.tsx  # Z-ordering, focus, minimize
│           │
│           ├── apps/             # Each "app" is a component rendered inside a Window
│           │   ├── SlackApp.tsx        # Multi-channel team chat
│           │   ├── SignalApp.tsx       # Cross-faction DMs
│           │   ├── WandBApp.tsx        # Training dashboards (static charts)
│           │   ├── NewsApp.tsx         # Reuters/AP wire feed
│           │   ├── TwitterApp.tsx      # X.com public feed
│           │   ├── EmailApp.tsx        # Memos, cables
│           │   ├── SheetsApp.tsx       # Budget/compute tables
│           │   ├── GameStateApp.tsx    # Fog-of-war state dashboard
│           │   ├── SecurityApp.tsx     # OB security dashboard
│           │   ├── BloombergApp.tsx    # VC terminal
│           │   ├── BriefingApp.tsx     # NSA secure briefing (PDB)
│           │   ├── WeChatApp.tsx       # China encrypted comms
│           │   ├── IntelApp.tsx        # Intelligence briefing
│           │   ├── MilitaryApp.tsx     # Military readiness
│           │   └── ArxivApp.tsx        # Paper feed
│           │
│           └── components/
│               ├── Timer.tsx
│               ├── Notification.tsx
│               └── VotePanel.tsx
│
├── docs/
│   ├── DESIGN.md
│   └── IMPLEMENTATION.md     # (this file)
│
├── package.json              # Workspace root
├── tsconfig.json
└── bunfig.toml
```

---

## Game State Architecture

### Server: Single Source of Truth

The server holds a `GameRoom` per active session:

```typescript
interface GameRoom {
  code: string;                    // 4-char room code
  phase: GamePhase;                // lobby | briefing | intel | deliberation | decision | resolution | ending
  round: number;                   // 1-5
  timer: { endsAt: number; pausedAt?: number };

  // Players
  players: Map<string, Player>;    // socketId → Player
  gm: string | null;               // socketId of GM

  // Authoritative state
  state: GameState;                // All ~14 state variables at true values
  decisions: RoundDecisions;       // Submitted decisions for current round
  history: RoundHistory[];         // Completed rounds for ending resolution

  // Messaging
  messages: Message[];             // All DMs/team chats (server stores all, clients get filtered)
}

interface Player {
  id: string;
  name: string;
  faction: Faction;                // 'openbrain' | 'prometheus' | 'china' | 'external'
  role: Role;                      // e.g. 'ob_ceo', 'prom_scientist', 'china_intel', 'ext_journalist'
  isLeader: boolean;               // Can submit binding team decisions
  influenceTokens: number;
  connected: boolean;
}
```

### Client: Fog-of-War Views

Clients never receive the full `GameState`. The server computes a `FogView` per faction before emitting:

```typescript
interface StateView {
  variables: Record<string, {
    value: number | string;       // May be the true value or a noised estimate
    accuracy: 'exact' | 'estimate' | 'hidden';
    confidence?: number;           // ±N for estimates
  }>;
}
```

The fog computation lives in `@takeoff/shared` so it can be unit tested independently.

### State Resolution

When a decision phase completes, the server:

1. Collects all submitted decisions (individual + team).
2. Applies defaults for any missing submissions (inaction).
3. Runs the resolution engine: each decision has a pre-defined `StateEffect[]` — additive modifiers to state variables, with conditional multipliers at thresholds.
4. Computes the new `GameState`.
5. Generates round content for the next briefing (adaptive text based on state).
6. Emits new fog-of-war views to each faction.

```typescript
interface StateEffect {
  variable: string;
  delta: number;
  condition?: {                    // Optional conditional multiplier
    variable: string;
    threshold: number;
    operator: 'gt' | 'lt' | 'eq';
    multiplier: number;            // Applied to delta when condition is true
  };
}

interface DecisionOption {
  id: string;
  label: string;
  description: string;
  effects: StateEffect[];
}
```

---

## Socket Protocol

Namespaces: `/game` (players), `/gm` (game master).

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ gmName }` | GM creates a room |
| `room:join` | `{ code, name }` | Player joins by room code |
| `room:select-role` | `{ faction, role }` | Player picks faction/role |
| `game:ready` | — | GM starts the game |
| `decision:submit` | `{ individual, teamVote }` | Player submits decisions |
| `decision:leader-submit` | `{ teamDecision }` | Team leader locks team decision |
| `message:send` | `{ to, content }` | DM or team message |
| `token:use` | `{ action, target }` | Spend influence token |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room:state` | `{ players, phase }` | Lobby state updates |
| `game:phase` | `{ phase, round, timer }` | Phase transition |
| `game:briefing` | `{ text, faction? }` | Briefing content (may be faction-specific) |
| `game:content` | `{ apps: AppContent[] }` | New app content for the round |
| `game:state` | `{ view: StateView }` | Fog-of-war state update |
| `game:decisions` | `{ individual, team }` | Available decisions for this round |
| `decision:votes` | `{ votes }` | Team leader sees teammate votes |
| `message:receive` | `{ from, content, ts }` | Incoming message |
| `game:resolution` | `{ narrative, stateChanges }` | Round resolution summary |
| `game:ending` | `{ arcs: EndingArc[] }` | Composite ending data |

### GM → Server (additional)

| Event | Payload | Description |
|-------|---------|-------------|
| `gm:advance` | — | Force advance to next phase |
| `gm:pause` | — | Pause/resume timer |
| `gm:extend` | `{ seconds }` | Add time |
| `gm:inject` | `{ type, content, targets }` | Inject event/notification |
| `gm:briefing-edit` | `{ text }` | Edit briefing before display |

---

## Phase State Machine

```
LOBBY → BRIEFING → INTEL → DELIBERATION → DECISION → RESOLUTION
                                                          │
                                              ┌───────────┘
                                              ▼
                                     (round < 5 ? BRIEFING : ENDING)
```

Each transition is server-driven. The GM can manually advance, but default timers auto-advance:

| Phase | Default Duration | GM Override |
|-------|-----------------|-------------|
| BRIEFING | 120s | Can advance early |
| INTEL | 300s | Can extend ±60s (2x max) |
| DELIBERATION | 300s | Can extend ±60s (2x max) |
| DECISION | 300s | Can extend ±60s (2x max) |
| RESOLUTION | 180s | Can advance early |

---

## Desktop Window Manager

The window system is the core UX and the main technical challenge: render a macOS-like desktop with 8-10 draggable, resizable, overlapping windows — each containing a different React component — at 60fps, on mid-tier laptops, with real-time multiplayer state.

**Why not canvas?** Our "windows" contain rich interactive content (scrollable text, clickable links, form inputs for DMs). Canvas can't do that without reimplementing the browser. The DOM already handles text rendering, scrolling, input, and accessibility. We just need to manage z-index, position, and resize.

**Why not a library?** Existing options (react-rnd, react-desktop, react-kitten) are abandoned, bloated, or fight you on styling. Our windows have constrained behavior — ~200 lines of custom code using CSS `transform: translate3d()` for GPU-accelerated positioning is more maintainable than wrestling with a third-party lib.

### Key Behaviors

- **Z-ordering**: Click to focus. Focused window comes to front.
- **Dragging**: Title bar drag via `onPointerDown`. Constrained to viewport.
- **Resizing**: Edge/corner handles. Minimum size per app type.
- **Dock**: Click icon to open/focus app. Badge shows unread count.
- **Menubar**: Shows round name, in-game date, countdown timer.
- **Traffic lights**: macOS-style close/minimize/maximize buttons.
- **Notifications**: macOS-style toast in top-right corner. Clicks open the relevant app.

### Window State (Zustand `ui` store)

```typescript
interface WindowState {
  id: string;            // app identifier
  appId: string;         // which app component to render
  isOpen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}
```

### Performance

The danger zone is 10+ open windows with rich content. Mitigations:

- **GPU compositing**: `transform: translate3d(x, y, 0)` promotes each window to its own layer. No layout recalculation on drag (unlike `top`/`left`).
- **Selective re-render**: Zustand with selectors means only the moving window re-renders during drag. All other windows are static.
- **Virtualize offscreen content**: Minimized windows and windows fully occluded behind 3+ others don't render their content — just the shell. Re-render on focus.
- **Cap open windows**: Players can have ~5-6 windows open simultaneously. Additional opens minimize the oldest. Realistic (nobody has 15 windows open during a crisis) and saves perf.
- **Memoize app content**: App content is static within a round. Wrap each app in `React.memo` — they only re-render when round changes or game state updates.
- **Batch round transitions**: When a round resolves and all app content changes, use `startTransition` to avoid frame drops.
- **Lazy initial render**: Windows start minimized. Player clicks dock to open. Initial render is just desktop + dock + menubar.

---

## Content System

### Round Content Format

Each round's content is a JSON file containing all app items for all factions:

```typescript
interface RoundContent {
  round: number;
  briefing: {
    common: string;                           // Shown to all
    factionVariants?: Record<Faction, string>; // Optional faction-specific additions
  };
  apps: {
    faction: Faction;
    role?: Role;                               // If role-specific
    app: AppId;
    items: ContentItem[];
  }[];
}

interface ContentItem {
  id: string;
  type: 'message' | 'headline' | 'memo' | 'chart' | 'tweet' | 'document';
  sender?: string;
  channel?: string;
  subject?: string;
  body: string;
  timestamp: string;                          // In-game timestamp
  classification?: 'critical' | 'context' | 'red-herring' | 'breadcrumb';
  // For adaptive content that changes based on prior decisions:
  condition?: {
    variable: string;
    operator: 'gt' | 'lt' | 'eq';
    value: number | string;
  };
}
```

### Content Pipeline (MVP)

For v1: hand-author one "median" scenario path. ~375 content items total.

Each round content file includes conditional items that show/hide based on key prior decisions (e.g., "if China stole weights, show this intercepted comm"). This gives some branching without a full content graph.

**Authoring workflow**: Content is authored in a spreadsheet with columns: `round | faction | role | app | channel/section | content | type | classification (critical/context/herring/breadcrumb)`. Exported to JSON, loaded by the content loader at round start. This keeps content creation accessible to non-engineers and separates content from code.

---

## Build Order

Sequenced for maximum early testability — get something on screen fast, then layer in game logic.

### Phase 1: Skeleton (get things running)

1. **Monorepo setup** — Bun workspaces, shared tsconfig, Vite for client, Hono for server. `bun dev` starts both.
2. **Shared types** — All TypeScript interfaces from this doc: `GameRoom`, `Player`, `GameState`, `StateView`, `DecisionOption`, `ContentItem`, socket event types.
3. **Socket scaffolding** — Socket.io server on Hono, client singleton. Room create/join. Verify two browser tabs can connect to same room.

### Phase 2: Desktop Shell

4. **Desktop chrome** — MenuBar, Dock, background. Static — no game logic yet. Looks like macOS.
5. **Window manager** — Draggable, resizable, focusable windows. Zustand UI store. Open/close/minimize from dock.
6. **App shells** — Empty app components for each app type, registered in dock config per faction/role.

### Phase 3: Game Loop

7. **Lobby screen** — Room code display/entry, role picker grid, GM "start game" button.
8. **Phase machine** — Server-side phase transitions with timers. Client receives phase events and renders correct screen (briefing overlay, unlocked desktop, decision modal).
9. **GM dashboard** — Phase controls (advance, pause, extend), player list with connection status, timer display.

### Phase 4: Core Gameplay

10. **Content loader + delivery** — Server loads round JSON, filters by faction/role/conditions, emits to clients. Apps render their content items.
11. **App implementations** — Build out the ~15 app components to render content items in appropriate formats (chat bubbles for Slack/Signal, headlines for News, tables for Sheets, etc.).
12. **Decision system** — Decision modal with individual + team options, vote submission, leader override view, countdown, default-to-inaction.
13. **State engine** — State resolution: collect decisions → apply effects → compute new state → emit fog views.
14. **Messaging** — Team chat (Slack-like) and cross-faction DMs (Signal-like). Server relays, GM can read all.

### Phase 5: Polish & Endings

15. **Fog-of-war dashboard** — The GameState app that shows your faction's view of state variables with confidence intervals.
16. **Briefing system** — Full-screen briefing overlay with adaptive text. GM can preview/edit before displaying.
17. **Composite endings** — Arc resolution from final state, fake media artifact montage, debrief screen with lifted fog-of-war.

### Phase 6: Content Authoring

18. **Round 1 content** — Full content for all factions/roles for Round 1 (~75 items).
19. **Rounds 2-5 content** — Remaining ~300 items with conditional variants.
20. **Playtesting** — Run through with test group, iterate on pacing and content.

---

## Key Design Decisions

**Why Zustand over Redux/Context?**
The game has two distinct state domains: server-authoritative game state (arrives via sockets) and client-only UI state (window positions, which app is focused). Zustand handles both cleanly with separate stores, no provider nesting, and trivial socket integration (`socket.on('game:state', (data) => useGameStore.setState(data))`).

**Why in-memory state, no database?**
Game sessions last ~2 hours and are ephemeral. There's no user accounts, no persistence between games, no login. A `Map<string, GameRoom>` in server memory is the right level of complexity. If we want game replays later, we append to a log file per room.

**Why hand-authored content over LLM-generated?**
Quality control. The content IS the game — every Slack message, memo, and headline needs to feel real and carry the right signals. LLM generation is a v2 feature for branching content and replayability.

**Why a custom window manager over a library?**
Existing React window manager libraries (react-rnd, react-mosaic) optimize for either developer tooling or tiling layouts. We need something that feels like a real macOS desktop: overlapping windows, a dock, a menu bar, notification toasts. The custom implementation is ~200 lines for the core (drag, resize, z-order) and gives us full control over the feel.

---

## Resolved Decisions

- **Reconnection**: Full message history on reconnect. It's small data over a 2hr game and players need context to rejoin mid-round.
- **Content format**: JSON. No extra parser, TypeScript imports directly, matches the spreadsheet → export workflow.
- **Deployment**: Single Fly.io deploy. Hono serves static client build + WebSocket from one process. No split deploy complexity.
- **Testing**: Unit tests on shared logic (fog computation, state resolution). Integration tests on socket protocol. Manual testing for desktop UX. E2E later.
- **Game replay**: Append-only event log per room (JSONL). No DB — just write to disk. Enables post-game debrief and future replay feature.
