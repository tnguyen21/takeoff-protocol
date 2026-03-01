# NPC Messaging System — Design Document

**Status:** Proposal  
**Goal:** Enable dynamic, in-round messaging from NPCs (non-player characters) to players via Signal, Slack, and Email channels to increase immersion and narrative urgency.

---

## 1. Overview

The tabletop exercise currently delivers narrative content through static, round-based JSON files. While effective for structured briefings, this lacks the **dynamic urgency** of a real crisis—where unexpected messages arrive mid-round, forcing players to react to new information under time pressure.

The NPC Messaging System introduces **automated and GM-triggered messages** from fictional characters (anonymous sources, worried engineers, board members, etc.) that arrive during gameplay, making each round feel alive and responsive to player actions.

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| **Immersive** | Messages feel organic—like real communications in a crisis |
| **Reactive** | NPCs respond to game state changes (e.g., whistleblower pressure triggers an anonymous tip) |
| **Flexible** | GM can manually inject messages to escalate drama or react to player creativity |
| **Faction-Appropriate** | Each faction has distinct NPC personas with believable voices |
| **Non-Disruptive** | Fits cleanly into existing architecture without major refactors |

---

## 3. Message Channels

NPC messages can be delivered through three channels, each with different UX implications:

| Channel | Best For | UI Behavior |
|---------|----------|-------------|
| **Signal** | Anonymous tips, urgent cross-faction leaks | DM notification; appears in Signal app sidebar |
| **Slack** | Internal team NPCs (engineers, researchers) | Channel message; appears in relevant Slack channel |
| **Email** | Formal communications (board, legal, external) | Inbox notification; appears in Email app with sender |

### Channel Selection Rationale

- **Signal** = encrypted, urgent, personal → anonymous sources, whistleblowers
- **Slack** = internal, conversational → colleagues, team members
- **Email** = formal, persistent → executives, external vendors, legal

---

## 4. NPC Personas

Each NPC has a consistent identity that determines their voice, which factions they can message, and through which channels.

### Cross-Faction NPCs

| ID | Name | Subtitle | Factions | Channels | Voice |
|----|------|----------|----------|----------|-------|
| `anon_source` | Anonymous Source | encrypted channel | OB, Prom, External | Signal | Cryptic, urgent, paranoid |
| `policy_insider` | Policy Insider | DC source | OB, Prom, External | Signal | Connected, political, warning |

### OpenBrain NPCs

| ID | Name | Subtitle | Channels | Trigger Examples |
|----|------|----------|----------|------------------|
| `ob_engineer` | Worried Engineer | #research | Slack, Signal | whistleblowerPressure > 60 |
| `ob_board_member` | Board Member | OpenBrain Board | Email, Signal | obBoardConfidence < 50 |
| `ob_security_vendor` | Security Vendor | external consultant | Email | chinaWeightTheftProgress > 60 |

### Prometheus NPCs

| ID | Name | Subtitle | Channels | Trigger Examples |
|----|------|----------|----------|------------------|
| `prom_researcher` | Safety Researcher | #safety-research | Slack, Signal | alignmentConfidence < 45 |
| `prom_open_source` | OS Contributor | GitHub contributor | Email, Slack | openSourceMomentum > 50 |

### China NPCs

| ID | Name | Subtitle | Channels | Trigger Examples |
|----|------|----------|----------|------------------|
| `china_party_liaison` | Party Liaison | Ministry of Science | Signal | ccpPatience < 35 |
| `china_deepcent_engineer` | DeepCent Engineer | CDZ Operations | Slack, Email | cdzComputeUtilization > 80 |

### External Stakeholder NPCs

| ID | Name | Subtitle | Channels | Trigger Examples |
|----|------|----------|----------|------------------|
| `nsa_analyst` | Intel Analyst | NSA | Signal, Email | chinaWeightTheftProgress > 50 |
| `vc_portfolio` | Portfolio CEO | portfolio company | Signal, Email | marketIndex < 70 |
| `journalist_source` | Whistleblower | anonymous | Signal | publicAwareness < 30 |

---

## 5. Trigger Types

NPC messages can be triggered in three ways:

### 5.1 State-Triggered (Automatic)

Messages fire automatically when game state variables cross thresholds. These are defined in a configuration file and checked after each state change.

**Example Triggers:**

```typescript
// When whistleblower pressure builds, an external journalist gets a tip
{
  id: "anon_whistleblower_tip",
  npcId: "anon_source",
  content: "Heard rumors about skipped safety evals at OB...",
  channel: "signal",
  condition: { variable: "whistleblowerPressure", operator: "gte", value: 40 },
  targetFactions: ["external"],
  targetRoles: ["ext_journalist"],
  oncePerGame: true
}

// When OB board confidence drops, the CEO gets concerned emails
{
  id: "ob_board_concerned",
  npcId: "ob_board_member",
  content: "The board is getting nervous about our public positioning...",
  channel: "email",
  condition: { variable: "obBoardConfidence", operator: "lte", value: 50 },
  targetFactions: ["openbrain"],
  targetRoles: ["ob_ceo"],
  oncePerGame: true
}
```

### 5.2 GM-Triggered (Manual)

The Game Master can send NPC messages on-demand via the GM Dashboard. This allows reactive storytelling—if players discuss something interesting, the GM can have an NPC "overhear" and respond.

**Use Cases:**
- Escalating tension mid-round
- Reacting to creative player actions not covered by rules
- Pushing a quiet player into the spotlight
- Injecting red herrings or misinformation

### 5.3 Scheduled (Round/Phase)

Messages scheduled to arrive at specific round/phase combinations, regardless of state.

**Use Case:**
- Round 3, Intel Phase: Anonymous tip about Prometheus breakthrough
- Round 4, Deliberation Phase: Board inquiry email to OpenBrain CEO

---

## 6. Architecture

### 6.1 Data Model

```typescript
// Shared types (packages/shared/src/types.ts)

export type NpcMessageChannel = "signal" | "slack" | "email";

export interface NpcMessage {
  id: string;
  fromNpcId: string;
  fromNpcName: string;
  toPlayerId: string;
  channel: NpcMessageChannel;
  content: string;
  timestamp: number;
  round: number;
  phase?: GamePhase;
}

// Add to GameRoom:
interface GameRoom {
  // ... existing fields ...
  npcMessages?: NpcMessage[]; // for replay on reconnect
  firedNpcTriggers?: Set<string>; // track once-per-game triggers
}
```

### 6.2 Server-Side Components

**New File: `packages/server/src/content/npcs.ts`**

Contains:
- `NPC_DEFINITIONS`: Array of NPC personas (id, name, subtitle, avatarColor, factions, channels)
- `NPC_TRIGGERED_MESSAGES`: Array of state-triggered message configs
- `getTriggeredMessages(state, firedTriggers)`: Function to check which messages should fire
- `sendNpcMessage(io, room, message)`: Function to deliver message to target player(s)

**Integration Points:**

1. **After state changes** (in `checkThresholds()` or `emitResolution()`):
   ```typescript
   const newMessages = getTriggeredMessages(room.state, room.firedNpcTriggers, room.phase);
   for (const msg of newMessages) {
     await sendNpcMessage(io, room, msg);
     room.firedNpcTriggers.add(msg.id);
   }
   ```

2. **New socket event** for GM manual trigger:
   ```typescript
   socket.on("gm:send-npc-message", ({ npcId, content, channel, targetPlayerId }) => {
     // Validate GM, construct message, send
   });
   ```

### 6.3 Client-Side Components

**New Socket Event Handler:**

```typescript
// packages/client/src/stores/npcMessages.ts (new file)

socket.on("npc:message", (payload: NpcMessagePayload) => {
  // Add to NPC message store
  // Trigger notification toast
  // Play appropriate sound based on channel
});
```

**Signal App Updates:**
- Extend existing `NPC_CONTACTS` in `signalUtils.ts` to include dynamic NPCs
- New NPC messages append to the NPC's message thread
- Unread badge appears on Signal icon when new NPC message arrives

**Slack App Updates:**
- Channel messages from NPCs appear in relevant channels (#research, #alignment, etc.)
- NPC messages have distinct styling (different avatar color, "bot" indicator)

**Email App Updates:**
- NPC emails appear in inbox with proper sender metadata
- Subject lines can be provided in message config

**Notification System:**
- NPC messages trigger toast notifications same as player messages
- Title format: "Signal: Anonymous Source" or "Email: Board Member"

### 6.4 GM Dashboard Updates

New section in GM Dashboard: **"Send NPC Message"**

UI Components:
- NPC selector (dropdown of all NPCs)
- Channel selector (Signal/Slack/Email)
- Target player selector (or "all in faction")
- Message content textarea
- "Send Now" button
- Preset quick-messages for common scenarios

---

## 7. Message Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRIGGER SOURCES                          │
├─────────────────────────────────────────────────────────────────┤
│  State Change          GM Action           Scheduled            │
│  (automatic)           (manual)            (round/phase)        │
└──────────┬─────────────────┬──────────────────┬─────────────────┘
           │                 │                  │
           ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SELECT TARGET PLAYERS                       │
│     (filter by faction, role, or specific playerId)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUILD NpcMessage                           │
│  { id, fromNpcId, fromNpcName, toPlayerId, channel, content,    │
│    timestamp, round, phase }                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DELIVER TO CLIENT                          │
│  io.to(playerId).emit("npc:message", { message, senderAvatar }) │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE HANDLING                         │
│  • Store in npcMessages store                                   │
│  • Show toast notification                                      │
│  • Update app-specific UI (Signal/Slack/Email)                  │
│  • Play sound (different per channel)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Example Scenarios

### Scenario 1: Whistleblower Pressure Builds

**Game State:**
- Round 2, Intel Phase
- OpenBrain Safety Officer has been raising concerns internally
- `whistleblowerPressure` variable crosses 60

**Automatic Triggers:**
1. **External Journalist** gets Signal DM from "Anonymous Source":
   > "OB insider here. Safety evals were skipped. Leadership knows. Check #alignment channel logs from Nov 3."

2. **OpenBrain CEO** gets Slack DM from "Worried Engineer":
   > "Seeing things in eval logs that don't make sense. The safety team flagged something last week and it just... disappeared. Am I being paranoid?"

**Result:** Journalist now has actionable lead; CEO faces internal dissent. Both create emergent gameplay.

### Scenario 2: China Espionage Escalates

**Game State:**
- Round 1, Deliberation Phase  
- `chinaWeightTheftProgress` crosses 50

**Automatic Triggers:**
1. **NSA player** gets Signal from "Intel Analyst":
   > "SIGINT suggests increased PRC activity targeting US AI infrastructure. Recommend immediate security posture review."

2. **OpenBrain Security Lead** gets Email from "Security Vendor":
   > "Subject: URGENT - Anomalous Traffic Detected
   > 
   > Our monitoring detected patterns consistent with reconnaissance activity targeting model storage. Recommend immediate audit."

**Result:** Security becomes urgent priority; players must decide whether to allocate resources to defense or risk theft.

### Scenario 3: GM Manual Intervention

**Gameplay Situation:**
- Players in Slack discussing whether to leak to press
- GM decides to escalate by having an NPC "overhear"

**GM Action:**
Opens GM Dashboard → Send NPC Message:
- NPC: "OB Internal"
- Channel: Slack
- Target: OpenBrain Safety Officer
- Message: "I saw what you posted in #general. If you're considering going external, talk to me first. I have documents that will make your case stronger."

**Result:** Safety Officer now faces a choice—trust this internal source or proceed independently. Creates new narrative branch.

---

## 9. Implementation Phases

### Phase 1: Core Infrastructure (MVP)
- [ ] Add shared types (`NpcMessage`, `NpcMessageChannel`)
- [ ] Create `npcs.ts` content file with NPC definitions + triggered messages
- [ ] Implement `sendNpcMessage()` server function
- [ ] Add socket event handler for GM manual sends
- [ ] Extend Signal app to receive NPC messages
- [ ] Add basic GM Dashboard controls

### Phase 2: Channel Expansion
- [ ] Slack channel support for NPC messages
- [ ] Email inbox support for NPC messages
- [ ] Different notification sounds per channel

### Phase 3: Polish
- [ ] Scheduled messages (round/phase triggers)
- [ ] NPC avatar images/colors
- [ ] Message threading in Signal
- [ ] "Message History" view in GM Dashboard

---

## 10. Open Questions

1. **Message Persistence:** Should NPC messages persist across reconnects? (Probably yes—store in `room.npcMessages`)

2. **GM Visibility:** Should GM see all NPC messages in real-time? (Probably yes—echo to GM socket)

3. **Player Replies:** Should players be able to "reply" to NPCs? (Probably no—keep it one-way to avoid complexity)

4. **Misinformation:** Should some NPC messages be false/plant? (Yes—add `reliability` field to NPCs, GM can see truth)

5. **Volume Control:** How do we prevent message spam? (Rate limiting, max 1-2 NPC messages per phase per player)

---

## 11. Related Files

| File | Purpose |
|------|---------|
| `packages/shared/src/types.ts` | Add `NpcMessage` types, update `GameRoom` |
| `packages/server/src/content/npcs.ts` | **New:** NPC definitions, triggered messages, trigger evaluation |
| `packages/server/src/game.ts` | Integrate trigger checking into state resolution |
| `packages/server/src/events.ts` | Add `gm:send-npc-message` socket handler |
| `packages/client/src/apps/signalUtils.ts` | Extend `NPC_CONTACTS` for dynamic NPCs |
| `packages/client/src/apps/SignalApp.tsx` | Display NPC messages in conversation view |
| `packages/client/src/stores/npcMessages.ts` | **New:** Store for NPC message state |
| `packages/client/src/screens/GMDashboard.tsx` | Add NPC message sending UI |

---

## 12. Success Metrics

- **Player Engagement:** % of players who open NPC messages within 30 seconds
- **GM Usage:** Average NPC messages sent manually per game session
- **Immersion:** Post-game survey question: "Did unexpected messages make the crisis feel real?"
- **Narrative Impact:** Track decision changes correlated with NPC message receipt
