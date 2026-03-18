/**
 * Pure utility functions for SlackApp channel management and unread counting.
 *
 * Exported for unit testing without a DOM environment.
 */

import type { ContentItem, GameMessage } from "@takeoff/shared";

export const SLACK_CHANNELS = ["#general", "#research", "#alignment", "#announcements", "#ops", "#random"] as const;
type SlackChannel = (typeof SLACK_CHANNELS)[number];

/**
 * Assigns a Slack channel to a content item.
 * Uses the item's `channel` field if present (normalizing # prefix),
 * falls back to classification-based assignment.
 */
export function assignChannelToMessage(item: ContentItem): string {
  if (item.channel) {
    const ch = item.channel.startsWith("#") ? item.channel : `#${item.channel}`;
    // Ensure it's one of our known channels; if not, default to #general
    if ((SLACK_CHANNELS as readonly string[]).includes(ch)) return ch;
    // Try a fuzzy match by checking if the channel name is contained
    const match = SLACK_CHANNELS.find((c) => c.toLowerCase() === ch.toLowerCase());
    if (match) return match;
    return "#general";
  }

  // Assign based on classification
  switch (item.classification) {
    case "critical":
      return "#announcements";
    case "red-herring":
      return "#random";
    case "breadcrumb":
      return "#ops";
    case "context":
    default:
      return "#general";
  }
}

/**
 * Filters a list of content items to only those belonging to a given channel.
 */
export function getChannelMessages(items: ContentItem[], channel: string): ContentItem[] {
  return items.filter((item) => assignChannelToMessage(item) === channel);
}

/**
 * Computes per-channel unread counts.
 * A channel has unread messages if it has not been seen (is not in seenChannels)
 * and is not the current activeChannel.
 * The count includes both scripted content items and live player team messages.
 */
export function computeUnreadCounts(items: ContentItem[], seenChannels: Set<string>, activeChannel: string, teamMessages: GameMessage[] = []): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ch of SLACK_CHANNELS) {
    if (ch === activeChannel || seenChannels.has(ch)) {
      counts[ch] = 0;
    } else {
      const contentCount = getChannelMessages(items, ch).length;
      const teamCount = teamMessages.filter((m) => (m.channel ?? "#general") === ch).length;
      counts[ch] = contentCount + teamCount;
    }
  }
  return counts;
}
