# Micro-Actions: In-App Agency for All Roles

> **Status:** Design exploration for v1.1+. Current v1 has communication-only micro-actions (tweet, slack, signal DM, publish).

## Problem

Players spend most of each round reading content in 11 passive apps. The only things they can *do* are talk (Slack, Signal, Twitter) and publish (Substack, Email leak). The formal decisions are the one moment of real agency per round.

This creates a gap: players who've read their intel and made up their mind have nothing to do but chat. Chat affects state via micro-actions, but the effects are invisible (players never see "your tweet moved publicAwareness +1.3") and tiny (base delta 1-2 with 1/n diminishing returns). The game feels like **read → wait → decide**, when it should feel like **read → act → react → decide**.

## Design Principles

1. **Embed actions in existing apps.** No separate "actions panel." The W&B app gets a compute slider. The Security app gets an alert response flow. Bloomberg gets a trade button.
2. **Tradeoffs, not free power.** Every action has a cost or a risk. Locking down security hurts morale. Allocating compute to safety slows capability. Publishing a leak burns a source.
3. **Visible consequences.** Players should see something change when they act — a notification, a state variable moving, an alert appearing in someone else's feed.
4. **Role-appropriate, not role-exclusive.** Most actions are available to anyone with the app, but some roles are better positioned to use them. The CTO *can* read the security dashboard, but only the Security Lead gets the "respond to alert" action.
5. **Bounded per round.** Each action type has a cap (1-3 uses per round) to prevent spam and force prioritization. This is different from current DR model where you can tweet 50 times at diminishing value.

## Action Categories

### 1. Resource Dials (Persistent, Adjustable)

Sliders or toggles that persist across the round. Changing them is free but has continuous effects. Creates ongoing tension — you can adjust anytime, but every second at a given setting accrues state change.

#### Compute Allocation (W&B App)
- **Who:** ob_cto, prom_scientist, china_director
- **UI:** Slider in W&B between "Capability" ↔ "Safety" (and for China: "Capability" ↔ "Domestic Chip R&D")
- **Effect:** Each tick (every 30s during intel/deliberation), the slider position applies a micro-delta:
  - Full capability: +0.3 capability, -0.2 alignmentConfidence
  - Full safety: +0.3 alignmentConfidence, -0.2 capability
  - Middle: +0.1 each, no penalty
- **Why it matters:** The CTO who maxes capability all game creates a very different state trajectory than one who splits time. And the safety officer can *see* what the CTO is doing (creates intra-faction tension).
- **Visibility:** Faction members see the current allocation in their W&B dashboard. Other factions don't (fog of war).

#### Security Posture (Security App)
- **Who:** ob_security (OB), china_director (China), prom_ceo (Prom — no dedicated security role)
- **UI:** Three-position toggle: Open / Standard / Lockdown
- **Effect:**
  - Open: securityLevel -1, morale +2/round, chinaWeightTheftProgress +1/round
  - Standard: no change (baseline)
  - Lockdown: securityLevel +1, morale -2/round, burnRate +1/round, chinaWeightTheftProgress -1/round
- **Why it matters:** Lockdown is safe but expensive. Open is risky but keeps people happy. The security lead has to decide without knowing if China is actively stealing.
- **Visibility:** Same faction sees posture. China intel can detect posture changes with a delay (appears as an intel item next round).

#### Budget Priority (Sheets App)
- **Who:** ob_ceo, prom_ceo, china_director (leaders)
- **UI:** Allocate a "focus" token to one of 3 departments: R&D / Operations / External Relations
- **Effect:**
  - R&D: capability +0.5/round, burnRate +0.5/round
  - Operations: burnRate -0.5/round, morale +0.3/round
  - External Relations: intlCooperation +0.3/round (US labs), ccpPatience +0.3/round (China)
- **Why it matters:** The CEO's budget focus is visible to their faction. The CTO sees the CEO isn't funding R&D and reacts. Creates organic conflict.

### 2. One-Shot Actions (Limited Per Round)

Discrete actions with immediate effects. Each has a per-round cap (usually 1-2).

#### Espionage Operation (Intel App)
- **Who:** china_intel
- **Cap:** 1 per round
- **UI:** "Launch Operation" button with target selector (OpenBrain / Prometheus)
- **Effect:** +5-8 chinaWeightTheftProgress (target-dependent), risk of detection proportional to target's securityLevel
- **Detection:** If securityLevel ≥ 3, 40% chance the target's Security app gets an alert: "Anomalous access pattern detected from [region]." If securityLevel ≥ 4, 70% chance. Alert is generic — doesn't name China.
- **Why it matters:** The intel chief has to weigh progress vs. getting caught. Getting caught changes the entire diplomatic landscape.

#### Intelligence Briefing (GameState App)
- **Who:** ext_nsa
- **Cap:** 2 per round
- **UI:** "Request Briefing" on any hidden or estimate-accuracy state variable
- **Effect:** Temporarily reveals the true value (exact accuracy) for the rest of the round. No state change.
- **Why it matters:** The NSA's unique power is *seeing clearly*. They can then choose to share (or not share) what they learn via Signal DMs. Creates information brokering dynamics.

#### Board Pressure (Bloomberg / Email App)
- **Who:** ext_vc
- **Cap:** 1 per round
- **UI:** "Apply Board Pressure" targeting OpenBrain or Prometheus
- **Effect:** Target's boardConfidence -3, burnRate -2 (belt-tightening). If the target CEO set budget focus to R&D, also capability -1 (forced reallocation).
- **Side effect:** marketIndex -2 (investor uncertainty is contagious)
- **Why it matters:** The VC can constrain labs from the outside. Creates tension with the CEO who wants to run fast. The CEO can anticipate and pre-adjust budget focus.

#### Safety Probe / Red Team (W&B App)
- **Who:** ob_safety, prom_scientist, china_scientist
- **Cap:** 1 per round
- **UI:** "Run Safety Probe" button — appears as a new run in W&B with a pass/fail result
- **Effect:** If alignmentConfidence < 40: probe fails (visible to faction), whistleblowerPressure +3
  If alignmentConfidence ≥ 40: probe passes, alignmentConfidence +2
- **Why it matters:** Running a probe is a gamble. If it fails, it creates evidence that the safety officer might leak. If it passes, it legitimately improves confidence. The CTO would rather the safety officer not run probes (because failures are embarrassing).

#### Publish Leak / Escalate (Email App)
- **Who:** ob_safety (already exists, could be extended)
- **Cap:** 1 per round
- **UI:** Forward any email/memo to ext_journalist via Signal (already possible) OR "Leak to Press" (existing mechanic)
- **Proposed addition:** "Escalate to Board" — sends the content as a formal board complaint
- **Effect (board escalation):** obBoardConfidence -5, obInternalTrust -3, whistleblowerPressure -5 (pressure relieved through formal channel)
- **Why it matters:** Gives the safety officer a middle option between silence and public leak. Board escalation hurts the company but doesn't create a media crisis.

#### Treaty Proposal (Email App)
- **Who:** ext_diplomat
- **Cap:** 1 per round
- **UI:** "Draft Treaty Proposal" — choose scope (Compute Governance / Safety Standards / Pause Agreement) and target (bilateral US-China / multilateral / G7)
- **Effect:** Creates a visible "treaty in progress" item. Doesn't resolve immediately — other players see it and can respond (support via DM, oppose via tweet, ignore). At resolution, if ≥3 players from different factions DM'd support: intlCooperation +5, regulatoryPressure +3. If ignored or opposed: intlCooperation -2.
- **Why it matters:** The diplomat's power depends on other players engaging. Forces social gameplay — the diplomat has to lobby, not just push a button.

#### Market Intervention (Bloomberg App)
- **Who:** ext_vc
- **Cap:** 1 per round
- **UI:** "Execute Trade" — Buy AI / Sell AI / Short AI
- **Effect:**
  - Buy: marketIndex +3, economicDisruption -1 (confidence signal)
  - Sell: marketIndex -3, economicDisruption +1 (fear signal)
  - Short: marketIndex -5, economicDisruption +2 (aggressive bet against)
- **Why it matters:** The VC can use market moves as signals. Shorting AI stocks before a big leak is profitable but destabilizing. Other players see the market move in their Bloomberg feeds.

#### Cyber Operation (Military App)
- **Who:** china_military
- **Cap:** 1 per round
- **UI:** "Deploy Cyber Capability" — target (US Infrastructure / Lab Networks / Taiwan Communications)
- **Effect:**
  - US Infrastructure: economicDisruption +3, intlCooperation -3, taiwanTension +2
  - Lab Networks: chinaWeightTheftProgress +3, securityLevel(target) triggers alert
  - Taiwan Comms: taiwanTension +5, ccpPatience -2
- **Why it matters:** Cyber ops are the military strategist's "between-decisions" lever. Each target creates different escalation dynamics. Hitting lab networks compounds with the intel chief's espionage.

### 3. Reactive Actions (Triggered by Events)

Actions that appear in response to game events. Players choose how to respond.

#### Alert Response (Security App)
- **Who:** ob_security, prom_ceo (or whoever has security responsibility)
- **Trigger:** Espionage detection, anomalous access, threshold events
- **UI:** Alert card with 3 response options:
  - Investigate (slow, thorough): +1 securityLevel next round, reveals attacker faction if China
  - Contain (fast, surface): no lasting effect, alert clears
  - Escalate (notify leadership + NSA): +2 securityLevel, -2 morale, sends notification to CEO + ext_nsa
- **Why it matters:** The security lead has to make real-time triage decisions. Escalating creates cross-faction information flow (the NSA now knows about the breach). Containing might miss a real attack.

#### Source Request (Signal App)
- **Who:** ext_journalist
- **Trigger:** Journalist DMs any player
- **UI:** After a DM thread reaches 3+ messages, journalist gets option: "Cultivate as Source"
- **Effect:** That player becomes a "source" — journalist gets +1 accuracy on any state variable the source's faction controls. Source gets whistleblowerPressure +2 (they're now in a risky position).
- **Why it matters:** The journalist has to build relationships before extracting information. Being a source is risky for the other player but gives them influence over what gets published.

## Effect Magnitude Comparison

To calibrate: how do these compare to existing mechanics?

| Action Type | Magnitude | Frequency | Total per Round |
|-------------|-----------|-----------|-----------------|
| Formal decision effect | ±8 per variable, 5-8 vars | 2 per player per round | ~±120 state points/round (all players) |
| Current tweet micro-action | ±2 base, 1/n DR | unlimited | ~±5 total (diminishes fast) |
| Current slack micro-action | ±1 base, 1/n DR | unlimited | ~±3 total |
| **Proposed resource dial** | ±0.3/tick, ~10 ticks/round | continuous | ~±3 per dial per round |
| **Proposed one-shot action** | ±3-8 immediate | 1-2 per round | ~±5-10 per player per round |
| **Proposed reactive action** | ±1-3 | event-dependent | ~±2-5 when triggered |

One-shot actions would be the most impactful micro-actions — roughly 5-10% of a single formal decision's total effect. Enough to matter, not enough to overshadow decisions.

## Implementation Sketch

### Data Model

```typescript
// New type for trackable actions
interface MicroAction {
  id: string;
  type: string;              // "espionage" | "briefing" | "board_pressure" | etc.
  actor: string;             // socketId
  round: number;
  timestamp: number;
  target?: string;           // faction, player, variable depending on type
  result?: string;           // "detected" | "success" | "failed"
  effects: Partial<StateVariables>;
}

// Add to GameRoom
interface GameRoom {
  // ...existing...
  microActions?: MicroAction[];              // log of all micro-actions taken
  resourceDials?: Record<string, ResourceDialState>;  // socketId → dial settings
}

interface ResourceDialState {
  computeAllocation?: number;    // 0 (full safety) to 100 (full capability)
  securityPosture?: "open" | "standard" | "lockdown";
  budgetFocus?: "rd" | "ops" | "external";
}
```

### Socket Events

```typescript
// Client → Server
"micro:set_dial"     → { dial: string, value: number | string }
"micro:one_shot"     → { action: string, target?: string, params?: Record<string, unknown> }
"micro:respond"      → { alertId: string, response: string }

// Server → Client
"micro:dial_updated" → { playerId: string, dial: string } // faction-visible
"micro:action_result"→ { action: string, result: string, narrative: string }
"micro:alert"        → { id: string, type: string, description: string, responses: string[] }
```

### Tick Loop

Resource dials need a tick loop (already have one for the countdown timer). Every 30s during intel/deliberation phases, apply dial effects:

```typescript
function tickResourceDials(room: GameRoom) {
  for (const [socketId, dials] of Object.entries(room.resourceDials ?? {})) {
    const player = room.players[socketId];
    if (!player?.role) continue;
    // Apply compute allocation effects...
    // Apply security posture effects...
    // Apply budget focus effects...
  }
  clampState(room.state);
}
```

## Open Questions

1. **Visibility model.** Which actions are visible to whom? Current proposal: dials visible to faction, one-shots produce effects visible to targets, reactive actions visible to actor only. But more visibility = more social gameplay.

2. **GM override.** Should the GM see all micro-actions in real time? Probably yes — they're running the game and need to understand state changes.

3. **Tutorial round.** Current tutorial skips activity penalties. Should it also introduce micro-actions, or keep it simple?

4. **LLM awareness.** Should generated content reference micro-actions? ("Following the intelligence chief's espionage operation last round...") Would require adding micro-action log to the generation context.

5. **Balance testing.** Resource dials that tick continuously could swing state significantly over a full round (±3 per dial × ~5 dials in play = ±15 points, comparable to one formal decision option). May need lower tick rates or caps.

6. **UI density.** Players already have 8-12 apps to manage. Adding interactive elements to 6 more apps increases cognitive load. May want to introduce gradually (Round 1: dials only, Round 2: add one-shots, Round 3+: reactive).

7. **Cross-action interactions.** Some actions naturally combo: china_intel launches espionage → ob_security gets alert → ob_security escalates → ext_nsa gets notification → ext_nsa requests briefing to verify → ext_nsa DMs ext_diplomat → ext_diplomat drafts treaty. This emergent chain is the dream scenario. How do we make it likely without scripting it?
