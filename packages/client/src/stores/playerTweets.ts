import type { PlayerTweet } from "@takeoff/shared";

export function appendPlayerTweet(existing: PlayerTweet[], incoming: PlayerTweet): PlayerTweet[] {
  if (existing.some((tweet) => tweet.id === incoming.id)) {
    return existing;
  }
  return [incoming, ...existing];
}
