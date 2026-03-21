/**
 * Pure helper functions for TwitterApp — extracted here so bun:test can import
 * without hitting react/jsx-dev-runtime issues.
 */

export interface TweetInteraction {
  liked: boolean;
  retweeted: boolean;
}

/**
 * Assign stable string IDs to an array of items at build time.
 * IDs are `${prefix}_${index}` and are invariant under subsequent
 * filtering or sorting of the resulting array — keys never shift.
 *
 * INV: every returned item has a unique, non-empty id.
 */
export function assignStableIds<T extends object>(items: T[], prefix: string): (T & { id: string })[] {
  return items.map((item, i) => ({ ...item, id: `${prefix}_${i}` }));
}

const VERIFIED_HANDLES = new Set([
  "@techpolicywatch",
  "@linwei_ml",
  "@reuterstech",
  "@marcuschen_ceo",
  "@alignmentforum",
  "@priya_nair_policy",
  "@deepmind_research",
  "@elisa_vasquez_ml",
  "@taiwantechnews",
  "@senkim_official",
]);

/** Returns true if the handle belongs to a verified account. */
export function isVerifiedHandle(handle: string): boolean {
  return VERIFIED_HANDLES.has(handle);
}

/** Toggle like — flips the liked flag. */
export function toggleLike(current: TweetInteraction): TweetInteraction {
  return { ...current, liked: !current.liked };
}

/** Toggle retweet — flips the retweeted flag. */
export function toggleRetweet(current: TweetInteraction): TweetInteraction {
  return { ...current, retweeted: !current.retweeted };
}

/**
 * Compute the displayed like count given the base count and current interaction.
 * INV-1: count must be baseLikes + (liked ? 1 : 0).
 */
export function computeLikeCount(baseLikes: number, interaction: TweetInteraction): number {
  return baseLikes + (interaction.liked ? 1 : 0);
}

/**
 * Compute the displayed retweet count given the base count and current interaction.
 * INV-2: count must be baseRetweets + (retweeted ? 1 : 0).
 */
export function computeRetweetCount(baseRetweets: number, interaction: TweetInteraction): number {
  return baseRetweets + (interaction.retweeted ? 1 : 0);
}

/** Simple deterministic hash for seeding engagement numbers from a tweet ID. */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Generate stable random base engagement for a generated NPC tweet. */
export function randomEngagement(id: string, verified: boolean): { likes: number; retweets: number; replies: number } {
  const h = hashCode(id);
  const baseLikes = verified ? 2000 : 200;
  const rangeLikes = verified ? 15000 : 4000;
  const likes = baseLikes + (h % rangeLikes);
  const retweets = Math.floor(likes * (0.15 + ((h >> 8) % 20) / 100));
  const replies = Math.floor(likes * (0.05 + ((h >> 16) % 10) / 100));
  return { likes, retweets, replies };
}

/**
 * Deterministic time-based engagement for player tweets.
 * All clients compute the same values from the same tweetId + timestamp,
 * so engagement is effectively shared state without server coordination.
 * Starts at 0, begins ticking ~1s after posting.
 */
export function timeBasedEngagement(tweetId: string, timestamp: number, now?: number): { likes: number; retweets: number; replies: number } {
  const elapsed = ((now ?? Date.now()) - timestamp) / 1000;
  if (elapsed < 1) return { likes: 0, retweets: 0, replies: 0 };

  const h = hashCode(tweetId);
  const likeRate = 3 + (h % 15);       // 3–17 likes per tick
  const rtRate = 1 + ((h >> 8) % 5);   // 1–5 retweets per tick
  const replyRate = (h >> 16) % 3;     // 0–2 replies per tick

  const ticks = Math.floor((elapsed - 1) / 3); // one tick every 3s after 1s delay
  return {
    likes: ticks * likeRate,
    retweets: ticks * rtRate,
    replies: ticks * replyRate,
  };
}
