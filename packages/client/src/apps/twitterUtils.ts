/**
 * Pure helper functions for TwitterApp — extracted here so bun:test can import
 * without hitting react/jsx-dev-runtime issues.
 */

export interface TweetInteraction {
  liked: boolean;
  retweeted: boolean;
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
