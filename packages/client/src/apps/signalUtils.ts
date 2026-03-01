/**
 * Pure utility functions for SignalApp — read receipts, NPC contacts.
 *
 * Exported for unit testing without a DOM/React environment.
 */

// ── Read Receipts ───────────────────────────────────────────────────────────

export type ReadReceiptStatus = "sent" | "delivered" | "read";

/**
 * Returns the read-receipt status for a sent message based on its age.
 *
 * - "sent":      < 5 000 ms old (still delivering)
 * - "delivered": 5 000 – 30 000 ms old (arrived, not yet read)
 * - "read":      > 30 000 ms old (recipient has read it)
 */
export function getReadReceiptStatus(timestampMs: number, nowMs: number): ReadReceiptStatus {
  const ageMs = nowMs - timestampMs;
  if (ageMs < 5_000) return "sent";
  if (ageMs < 30_000) return "delivered";
  return "read";
}

// ── Disappearing Messages ────────────────────────────────────────────────────

/**
 * Deterministically returns true for ~25% of messages by message ID.
 * Used to show a disappearing-message timer indicator on "certain messages".
 */
export function hasDisappearingTimer(msgId: string): boolean {
  const hash = msgId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 4 === 0;
}

// ── NPC Contacts ─────────────────────────────────────────────────────────────

export interface NpcMessage {
  id: string;
  content: string;
  /** Epoch milliseconds. Computed once at module load via _BASE_TS. */
  timestamp: number;
}

export interface NpcContact {
  id: string;
  name: string;
  subtitle: string;
  /** Tailwind bg-* color class for the avatar circle. */
  avatarColor: string;
  messages: NpcMessage[];
}

const _BASE_TS = Date.now();
function _ago(ms: number): number {
  return _BASE_TS - ms;
}

export const NPC_CONTACTS: NpcContact[] = [
  {
    id: "__npc_anon__",
    name: "Anonymous Source",
    subtitle: "· encrypted channel",
    avatarColor: "bg-red-900",
    messages: [
      {
        id: "anon-1",
        content: "They're closer than you think. The weight extraction already happened.",
        timestamp: _ago(3_600_000),
      },
      {
        id: "anon-2",
        content: "CDZ has copies. Three checkpoints. Don't let them get the fourth.",
        timestamp: _ago(1_800_000),
      },
      {
        id: "anon-3",
        content:
          "Look at the compute logs. Someone is running unauthorized inference runs. The sparsity pattern is a fingerprint — match it.",
        timestamp: _ago(600_000),
      },
    ],
  },
  {
    id: "__npc_insider__",
    name: "Policy Insider",
    subtitle: "· DC source",
    avatarColor: "bg-purple-900",
    messages: [
      {
        id: "insider-1",
        content:
          "Hill staffers are drafting emergency compute export controls. Your friends at NSF are scared.",
        timestamp: _ago(7_200_000),
      },
      {
        id: "insider-2",
        content:
          "The Senate AI caucus had a closed briefing yesterday. Three senators walked out early. Read into that what you will.",
        timestamp: _ago(3_000_000),
      },
      {
        id: "insider-3",
        content:
          "Ambassador Wu just cancelled a meeting with State. Fifth time this month. Something is moving on their side.",
        timestamp: _ago(900_000),
      },
    ],
  },
  {
    id: "__npc_ob_internal__",
    name: "OB Internal",
    subtitle: "· colleague",
    avatarColor: "bg-emerald-900",
    messages: [
      {
        id: "ob-1",
        content:
          "The new eval suite is being hidden from the safety team. I've seen the raw scores. We should talk.",
        timestamp: _ago(5_400_000),
      },
      {
        id: "ob-2",
        content:
          "They're calling it a 'capability overhang' in internal memos. What they really mean is: it's already there, we're just not telling anyone.",
        timestamp: _ago(2_400_000),
      },
    ],
  },
];

/** Convenience set of all NPC contact IDs. */
export const NPC_IDS = new Set(NPC_CONTACTS.map((c) => c.id));
