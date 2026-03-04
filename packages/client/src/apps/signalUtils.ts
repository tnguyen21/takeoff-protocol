/**
 * Pure utility functions for SignalApp — read receipts, NPC contacts.
 *
 * Exported for unit testing without a DOM/React environment.
 */

import type { GameMessage } from "@takeoff/shared";

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

/**
 * Returns true if the given ID belongs to an NPC sender.
 * All NPC IDs use the __npc_ prefix.
 */
export function isNpcId(id: string): boolean {
  return id.startsWith("__npc_");
}

/** Static metadata (subtitle + avatar color) for known NPC contacts. */
const NPC_METADATA: Record<string, { subtitle: string; avatarColor: string }> = {
  // Cross-faction
  __npc_personal__: { subtitle: "· personal", avatarColor: "bg-neutral-500" },
  __npc_anon__: { subtitle: "· encrypted channel", avatarColor: "bg-red-900" },
  __npc_insider__: { subtitle: "· DC source", avatarColor: "bg-purple-900" },
  // OpenBrain
  __npc_ob_engineer__: { subtitle: "· colleague", avatarColor: "bg-emerald-900" },
  __npc_ob_board__: { subtitle: "· OpenBrain Board", avatarColor: "bg-amber-900" },
  __npc_ob_security__: { subtitle: "· external consultant", avatarColor: "bg-slate-700" },
  // Prometheus
  __npc_prom_researcher__: { subtitle: "· safety research", avatarColor: "bg-blue-900" },
  __npc_prom_os__: { subtitle: "· GitHub contributor", avatarColor: "bg-green-900" },
  // China
  __npc_china_liaison__: { subtitle: "· Ministry of Science", avatarColor: "bg-red-900" },
  __npc_china_engineer__: { subtitle: "· CDZ Operations", avatarColor: "bg-orange-900" },
  // External
  __npc_intel_analyst__: { subtitle: "· NSA", avatarColor: "bg-indigo-900" },
  __npc_portfolio_ceo__: { subtitle: "· portfolio company", avatarColor: "bg-teal-900" },
  __npc_whistleblower__: { subtitle: "· anonymous", avatarColor: "bg-rose-900" },
};

const NPC_DEFAULT_METADATA = { subtitle: "· unknown source", avatarColor: "bg-neutral-700" };

/**
 * Builds NPC contact entries from live store messages.
 *
 * Invariants:
 * - Only returns contacts for NPCs that have sent ≥1 message to currentPlayerId.
 * - Messages within each contact are sorted by timestamp ascending.
 * - Name comes from the GameMessage.fromName field.
 * - AvatarColor and subtitle come from the static NPC_METADATA map, falling back
 *   to NPC_DEFAULT_METADATA for unknown NPC IDs.
 */
export function buildNpcContacts(messages: GameMessage[], currentPlayerId: string): NpcContact[] {
  // Filter to NPC messages addressed to the current player
  const npcMessages = messages.filter((m) => isNpcId(m.from) && m.to === currentPlayerId);

  // Group by NPC ID
  const grouped = new Map<string, GameMessage[]>();
  for (const m of npcMessages) {
    const group = grouped.get(m.from) ?? [];
    group.push(m);
    grouped.set(m.from, group);
  }

  // Build NpcContact entries — only for NPCs with ≥1 message
  const contacts: NpcContact[] = [];
  for (const [npcId, msgs] of grouped) {
    if (msgs.length === 0) continue;

    const sorted = [...msgs].sort((a, b) => a.timestamp - b.timestamp);
    const name = sorted[0].fromName;
    const meta = NPC_METADATA[npcId] ?? NPC_DEFAULT_METADATA;

    contacts.push({
      id: npcId,
      name,
      subtitle: meta.subtitle,
      avatarColor: meta.avatarColor,
      messages: sorted.map((m) => ({
        id: m.id,
        content: m.content,
        timestamp: m.timestamp,
      })),
    });
  }

  return contacts;
}

/**
 * Convenience set of well-known NPC contact IDs.
 * Use isNpcId() for dynamic checks (covers any __npc_ prefix).
 */
export const NPC_IDS = new Set<string>(Object.keys(NPC_METADATA));

// ── Content Contacts (seeded signal items grouped by sender) ────────────────

export interface ContentMessage {
  id: string;
  body: string;
  timestamp: string;
  sender?: string;
}

export interface ContentContact {
  id: string;
  name: string;
  subtitle: string;
  avatarColor: string;
  messages: ContentMessage[];
}

export function isContentContactId(id: string): boolean {
  return id.startsWith("__content_");
}

const CONTENT_COLORS = [
  "bg-emerald-800",
  "bg-violet-800",
  "bg-cyan-800",
  "bg-rose-800",
  "bg-amber-800",
  "bg-teal-800",
  "bg-indigo-800",
  "bg-pink-800",
];

/**
 * Groups seeded signal content items by sender into contacts.
 * Each unique sender becomes a contact entry in the sidebar.
 */
export function buildContentContacts(
  items: readonly { id: string; type: string; sender?: string; body: string; timestamp: string }[]
): ContentContact[] {
  const messageItems = items.filter((i) => i.type === "message" && i.sender);
  const grouped = new Map<string, typeof messageItems>();
  for (const item of messageItems) {
    const key = item.sender!;
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }

  let colorIdx = 0;
  return Array.from(grouped.entries()).map(([sender, msgs]) => ({
    id: `__content_${sender.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}__`,
    name: sender,
    subtitle: "· encrypted",
    avatarColor: CONTENT_COLORS[colorIdx++ % CONTENT_COLORS.length],
    messages: msgs.map((m) => ({
      id: m.id,
      body: m.body,
      timestamp: m.timestamp,
      sender: m.sender,
    })),
  }));
}
