/**
 * Tests for shared player tweet feed helpers.
 *
 * Invariants tested:
 * - INV-1: a newly received player tweet is added to the feed
 * - INV-2: duplicate tweet ids are ignored during reconnect replay
 * - INV-3: newest tweet is kept first in Following feed order
 */

import { describe, expect, it } from "bun:test";
import type { PlayerTweet } from "@takeoff/shared";
import { appendPlayerTweet } from "./playerTweets.js";

function makeTweet(overrides: Partial<PlayerTweet> = {}): PlayerTweet {
  return {
    id: "tweet-1",
    playerName: "Alice",
    playerRole: "ob_cto",
    playerFaction: "openbrain",
    text: "hello world",
    timestamp: 1_000,
    ...overrides,
  };
}

describe("appendPlayerTweet", () => {
  it("INV-1: stores a newly received player tweet", () => {
    const tweets = appendPlayerTweet([], makeTweet());

    expect(tweets).toHaveLength(1);
    expect(tweets[0]?.id).toBe("tweet-1");
    expect(tweets[0]?.text).toBe("hello world");
  });

  it("INV-2: duplicate tweet ids are ignored during replay", () => {
    const tweet = makeTweet({ id: "dup-tweet" });
    const once = appendPlayerTweet([], tweet);
    const twice = appendPlayerTweet(once, tweet);

    expect(twice).toHaveLength(1);
    expect(twice[0]?.id).toBe("dup-tweet");
  });

  it("INV-3: newer tweets are kept first in feed order", () => {
    const withOldest = appendPlayerTweet([], makeTweet({ id: "oldest", text: "first", timestamp: 1_000 }));
    const withNewest = appendPlayerTweet(withOldest, makeTweet({ id: "newest", text: "second", timestamp: 2_000 }));

    expect(withNewest.map((tweet) => tweet.id)).toEqual(["newest", "oldest"]);
  });
});
