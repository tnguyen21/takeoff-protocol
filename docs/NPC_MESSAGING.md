# NPC Messaging System — Design Document

**Status:** Proposal
**Goal:** Enable dynamic, in-round messaging from NPCs (non-player characters) to players via Signal to increase immersion and narrative urgency.

---

## 1. Overview

The tabletop exercise currently delivers narrative content through static, round-based JSON files. While effective for structured briefings, this lacks the **dynamic urgency** of a real crisis—where unexpected messages arrive mid-round, forcing players to react to new information under time pressure.

The NPC Messaging System introduces **automated and GM-triggered messages** from fictional characters (anonymous sources, worried engineers, board members, etc.) that arrive during gameplay, making each round feel alive and responsive to player actions.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Reuse existing infrastructure** | NPC messages flow through `GameMessage` + `message:receive` — no new store, no new socket event |
| **Immersive** | Messages feel organic — like real communications in a crisis |
| **Reactive** | NPCs respond to game state changes (e.g., whistleblower pressure triggers an anonymous tip) |
| **Flexible** | GM can manually inject messages to escalate drama or react to player creativity |
| **Faction-Appropriate** | Each faction has distinct NPC personas with believable voices |

---

## 2. Channel: Signal Only (MVP)

NPC messages are delivered exclusively through Signal. This is the right channel because:

- Signal is already built for 1:1 DMs with NPC contact infrastructure (`NPC_CONTACTS`, `NPC_IDS`)
- Anonymous/urgent/encrypted fits the narrative tone of NPC messages
- Slack and Email render `ContentItem[]` from static round JSON — injecting dynamic messages would require a second rendering path
- Players already expect Signal for cross-boundary communications

Future expansion to Slack/Email can be done by injecting NPC `ContentItem`s into the `AppContent[]` array server-side before emitting `game:content`, which requires no client changes.

---

## 3. NPC Personas

Each NPC has a consistent identity. Persona definitions live in a small shared config. Message content lives per-round alongside the other narrative content.

### Cross-Faction NPCs

| ID | Name | Subtitle | Target Factions | Voice |
|----|------|----------|-----------------|-------|
| `__npc_anon__` | Anonymous Source | encrypted channel | OB, Prom, External | Cryptic, urgent, paranoid |
| `__npc_policy__` | Policy Insider | DC source | OB, Prom, External | Connected, political, warning |

### OpenBrain NPCs

| ID | Name | Subtitle | Trigger Examples |
|----|------|----------|------------------|
| `__npc_ob_engineer__` | Worried Engineer | OB colleague | whistleblowerPressure > 60 |
| `__npc_ob_board__` | Board Member | OpenBrain Board | obBoardConfidence < 50 |
| `__npc_ob_security__` | Security Vendor | external consultant | chinaWeightTheftProgress > 60 |

### Prometheus NPCs

| ID | Name | Subtitle | Trigger Examples |
|----|------|----------|------------------|
| `__npc_prom_researcher__` | Safety Researcher | Prometheus Labs | alignmentConfidence < 45 |
| `__npc_prom_oss__` | OS Contributor | GitHub contributor | openSourceMomentum > 50 |

### China NPCs

| ID | Name | Subtitle | Trigger Examples |
|----|------|----------|------------------|
| `__npc_china_liaison__` | Party Liaison | Ministry of Science | ccpPatience < 35 |
| `__npc_china_engineer__` | DeepCent Engineer | CDZ Operations | cdzComputeUtilization > 80 |

### External NPCs

| ID | Name | Subtitle | Trigger Examples |
|----|------|----------|------------------|
| `__npc_nsa__` | Intel Analyst | NSA | chinaWeightTheftProgress > 50 |
| `__npc_vc__` | Portfolio CEO | portfolio company | marketIndex < 70 |
| `__npc_journalist__` | Whistleblower | anonymous | publicAwareness < 30 |

NPC IDs use the `__npc_` prefix convention to distinguish from real player IDs (which are socket IDs / UUIDs).

---

## 4. Trigger Types

### 4.1 State-Triggered (Automatic)

Messages fire when state variables cross thresholds, evaluated inside the existing `checkThresholds()` function in `game.ts`. Trigger IDs are added to the existing `room.firedThresholds` set — no new set needed.

```typescript
// In round content file, e.g. packages/server/src/content/rounds/round2-npc.ts
export const round2NpcTriggers: NpcTrigger[] = [
  {
    id: "npc_anon_whistleblower_tip",
    npcId: "__npc_anon__",
    content: "OB insider here. Safety evals were skipped. Leadership knows.",
    condition: { variable: "whistleblowerPressure", operator: "gte", value: 40 },
    target: { faction: "external", role: "ext_journalist" },
  },
  {
    id: "npc_ob_board_concerned",
    npcId: "__npc_ob_board__",
    content: "The board is getting nervous about our public positioning...",
    condition: { variable: "obBoardConfidence", operator: "lte", value: 50 },
    target: { faction: "openbrain", role: "ob_ceo" },
  },
];
```

### 4.2 GM-Triggered (Manual)

The GM can send NPC messages via a `gm:send-npc-message` socket event. For MVP, no dashboard UI — the GM uses a simple form or dev console. The server constructs a `GameMessage` with the NPC's `from` sentinel ID and emits it via `message:receive`.

**Use cases:**
- Escalating tension mid-round
- Reacting to creative player actions not covered by rules
- Pushing a quiet player into the spotlight
- Injecting red herrings or misinformation

### 4.3 Scheduled (Round/Phase)

Messages tied to specific round/phase combos fire unconditionally when that phase starts. These are just trigger entries with a `schedule` field instead of a `condition`:

```typescript
{
  id: "npc_anon_prom_tip_r3",
  npcId: "__npc_anon__",
  content: "Prometheus is closer than anyone thinks. Ask about run 847.",
  schedule: { round: 3, phase: "intel" },
  target: { faction: "external" },
}
```

---

## 5. Architecture

### 5.1 No New Types — Extend `GameMessage`

NPC messages reuse `GameMessage` with an `isNpc` flag:

```typescript
// Extend existing GameMessage in packages/shared/src/types.ts
interface GameMessage {
  id: string;
  from: string;        // NPC: sentinel like "__npc_anon__"
  fromName: string;     // NPC: display name like "Anonymous Source"
  to: string | null;    // target player ID
  faction: Faction;     // sender's faction context (or target's faction for cross-faction NPCs)
  content: string;
  timestamp: number;
  isTeamChat: boolean;  // false for NPC messages
  isNpc?: boolean;      // NEW — marks this as an NPC message
}
```

**Why this works:**
- Reconnect replay (`message:history`) includes NPC messages for free — they're already in `room.messages`
- GM message feed sees NPC messages for free — the `_gmView` flag works as-is
- `useMessagesStore` stores them alongside player messages
- SignalApp already branches on `NPC_IDS.has()` — just filter messages from the store instead of reading from the static `NPC_CONTACTS` array

### 5.2 NPC Persona Config

A small shared config file defines persona metadata. This is NOT per-round content — it's stable identity data:

```typescript
// packages/server/src/content/npcPersonas.ts
export interface NpcPersona {
  id: string;           // "__npc_anon__"
  name: string;         // "Anonymous Source"
  subtitle: string;     // "encrypted channel"
  avatarColor: string;  // Tailwind class
  factions: Faction[];  // which factions can see this NPC
}

export const NPC_PERSONAS: NpcPersona[] = [ ... ];
```

### 5.3 NPC Trigger Config (Per-Round)

Message content and triggers live alongside other round content:

```typescript
// packages/server/src/content/npc/round2.ts
export interface NpcTrigger {
  id: string;
  npcId: string;
  content: string;
  condition?: { variable: keyof StateVariables; operator: "gte" | "lte" | "eq"; value: number };
  schedule?: { round: number; phase: GamePhase };
  target: { faction?: Faction; role?: string };  // server resolves to socket IDs at send time
}
```

### 5.4 Server Integration

Trigger evaluation merges into `checkThresholds()`:

```typescript
// In game.ts checkThresholds()
function checkThresholds(io: Server, room: GameRoom) {
  // ... existing threshold checks ...

  // NPC triggers for current round
  const npcTriggers = getNpcTriggersForRound(room.round);
  for (const trigger of npcTriggers) {
    if (room.firedThresholds.has(trigger.id)) continue;
    if (!evaluateCondition(trigger, room.state, room.round, room.phase)) continue;

    const targets = resolveTargets(room, trigger.target);
    for (const player of targets) {
      const msg: GameMessage = {
        id: nanoid(),
        from: trigger.npcId,
        fromName: getNpcName(trigger.npcId),
        to: player.id,
        faction: player.faction,
        content: trigger.content,
        timestamp: Date.now(),
        isTeamChat: false,
        isNpc: true,
      };
      room.messages.push(msg);
      io.to(player.socketId).emit("message:receive", msg);
      if (room.gmId) io.to(room.gmId).emit("message:receive", { ...msg, _gmView: true });
    }
    room.firedThresholds.add(trigger.id);
  }
}
```

GM manual sends use a new socket event that constructs the same `GameMessage`:

```typescript
// In events.ts
socket.on("gm:send-npc-message", ({ npcId, content, targetPlayerId }, callback) => {
  // validate GM, build GameMessage with isNpc: true, emit via message:receive
});
```

### 5.5 Client Integration

**No new store.** NPC messages arrive via the existing `message:receive` handler and land in `useMessagesStore`.

**SignalApp changes:**
1. NPC contact list comes from the server (via `game:content` or a dedicated `npc:contacts` event), filtered by the player's faction/role — replaces the hardcoded `NPC_CONTACTS` import
2. NPC conversation view reads from `useMessagesStore.messages.filter(m => m.from === npcId || m.to === npcId)`
3. "Cannot reply to this contact" UI stays as-is — NPCs are one-way

**Notifications:** The existing `message:receive` handler in `game.ts` (client store) already fires a toast for new Signal DMs. NPC messages trigger the same path — toast says "Signal: Anonymous Source", clicking opens Signal.

---

## 6. Example Scenarios

### Scenario 1: Whistleblower Pressure Builds

**State:** Round 2, `whistleblowerPressure` crosses 60

**Triggers fire:**
1. **External Journalist** gets Signal DM from "Anonymous Source":
   > "OB insider here. Safety evals were skipped. Leadership knows. Check #alignment channel logs from Nov 3."

2. **OpenBrain CEO** gets Signal DM from "Worried Engineer":
   > "Seeing things in eval logs that don't make sense. The safety team flagged something last week and it just... disappeared."

**Result:** Journalist has an actionable lead; CEO faces internal dissent. Both create emergent gameplay.

### Scenario 2: GM Manual Intervention

**Situation:** Players in Slack discussing whether to leak to press. GM decides to escalate.

**GM Action:** Emits `gm:send-npc-message` with NPC "OB Internal" → OpenBrain Safety Officer:
> "I saw what you posted in #general. If you're considering going external, talk to me first. I have documents that will make your case stronger."

**Result:** Safety Officer faces a new choice — trust this source or proceed independently.

---

## 7. Implementation Plan

### Phase 1: Core Infrastructure
- [ ] Add `isNpc?: boolean` to `GameMessage` in shared types
- [ ] Create `npcPersonas.ts` with persona definitions
- [ ] Create per-round NPC trigger files (start with round 1-2 as proof of concept)
- [ ] Integrate trigger evaluation into `checkThresholds()` in `game.ts`
- [ ] Add `gm:send-npc-message` socket event in `events.ts`
- [ ] Update SignalApp to read NPC contacts from server data instead of hardcoded import
- [ ] Update SignalApp NPC conversation view to read from `useMessagesStore`

### Phase 2: Expand Content + GM Tools
- [ ] Write NPC trigger content for rounds 3-5
- [ ] Add GM Dashboard UI for sending NPC messages (NPC picker, target picker, textarea)
- [ ] Scheduled (round/phase) triggers
- [ ] Rate limiting (max 1-2 NPC messages per phase per player)

### Phase 3: Channel Expansion (Future)
- [ ] Slack NPCs: inject NPC `ContentItem`s into `AppContent[]` server-side before `game:content` emit
- [ ] Email NPCs: same approach — server-side `ContentItem` injection
- [ ] Different notification sounds per channel

---

## 8. Open Questions

1. **Player Replies:** Should players be able to "reply" to NPCs? (Probably no — keep one-way to avoid complexity)
2. **Misinformation:** Should some NPC messages be deliberately false? (Yes — add `reliability` field to personas, GM can see ground truth)
3. **Volume Control:** How do we prevent message spam? (Rate limiting in Phase 2; for now, content authors exercise restraint)

---

## 9. Files Changed

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Add `isNpc?: boolean` to `GameMessage` |
| `packages/server/src/content/npcPersonas.ts` | **New:** NPC persona definitions |
| `packages/server/src/content/npc/round1.ts` | **New:** Round 1 NPC trigger content |
| `packages/server/src/content/npc/round2.ts` | **New:** Round 2 NPC trigger content |
| `packages/server/src/game.ts` | Add NPC trigger evaluation to `checkThresholds()` |
| `packages/server/src/events.ts` | Add `gm:send-npc-message` handler |
| `packages/client/src/apps/signalUtils.ts` | Make NPC contacts server-driven instead of hardcoded |
| `packages/client/src/apps/SignalApp.tsx` | Read NPC messages from `useMessagesStore` |
