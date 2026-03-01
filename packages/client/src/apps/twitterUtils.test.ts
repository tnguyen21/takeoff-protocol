/**
 * Tests for TwitterApp pure helper functions.
 *
 * Invariants tested:
 * - INV-1: toggleLike/computeLikeCount toggles liked flag and increments/decrements count
 * - INV-2: toggleRetweet/computeRetweetCount toggles retweeted flag and changes count
 * - INV-3: isVerifiedHandle returns true for known verified accounts
 */

import { describe, expect, it } from "bun:test";
import {
  toggleLike,
  toggleRetweet,
  computeLikeCount,
  computeRetweetCount,
  isVerifiedHandle,
} from "./twitterUtils.js";
import type { TweetInteraction } from "./twitterUtils.js";

const NOT_LIKED: TweetInteraction = { liked: false, retweeted: false };
const LIKED: TweetInteraction = { liked: true, retweeted: false };
const RETWEETED: TweetInteraction = { liked: false, retweeted: true };

describe("toggleLike", () => {
  it("INV-1: toggles from not-liked to liked", () => {
    expect(toggleLike(NOT_LIKED).liked).toBe(true);
  });

  it("INV-1: toggles from liked back to not-liked", () => {
    expect(toggleLike(LIKED).liked).toBe(false);
  });

  it("INV-1: does not change retweeted flag", () => {
    expect(toggleLike(RETWEETED).retweeted).toBe(true);
  });
});

describe("toggleRetweet", () => {
  it("INV-2: toggles from not-retweeted to retweeted", () => {
    expect(toggleRetweet(NOT_LIKED).retweeted).toBe(true);
  });

  it("INV-2: toggles from retweeted back to not-retweeted", () => {
    expect(toggleRetweet(RETWEETED).retweeted).toBe(false);
  });

  it("INV-2: does not change liked flag", () => {
    expect(toggleRetweet(LIKED).liked).toBe(true);
  });
});

describe("computeLikeCount", () => {
  it("INV-1: returns base count when not liked", () => {
    expect(computeLikeCount(100, NOT_LIKED)).toBe(100);
  });

  it("INV-1: returns base+1 when liked", () => {
    expect(computeLikeCount(100, LIKED)).toBe(101);
  });

  it("INV-1: like then unlike produces original count", () => {
    const afterLike = computeLikeCount(500, LIKED);
    const afterUnlike = computeLikeCount(500, NOT_LIKED);
    expect(afterLike).toBe(501);
    expect(afterUnlike).toBe(500);
  });

  it("INV-1: works at zero base count", () => {
    expect(computeLikeCount(0, LIKED)).toBe(1);
    expect(computeLikeCount(0, NOT_LIKED)).toBe(0);
  });
});

describe("computeRetweetCount", () => {
  it("INV-2: returns base count when not retweeted", () => {
    expect(computeRetweetCount(200, NOT_LIKED)).toBe(200);
  });

  it("INV-2: returns base+1 when retweeted", () => {
    expect(computeRetweetCount(200, RETWEETED)).toBe(201);
  });

  it("INV-2: retweet then un-retweet produces original count", () => {
    expect(computeRetweetCount(42, RETWEETED)).toBe(43);
    expect(computeRetweetCount(42, NOT_LIKED)).toBe(42);
  });
});

describe("isVerifiedHandle", () => {
  it("INV-3: returns true for known verified handles", () => {
    expect(isVerifiedHandle("@reuterstech")).toBe(true);
    expect(isVerifiedHandle("@marcuschen_ceo")).toBe(true);
    expect(isVerifiedHandle("@senkim_official")).toBe(true);
    expect(isVerifiedHandle("@linwei_ml")).toBe(true);
  });

  it("INV-3: returns false for unknown handles", () => {
    expect(isVerifiedHandle("@random_person")).toBe(false);
    expect(isVerifiedHandle("@aiaccel8")).toBe(false);
  });

  it("INV-3: is case-sensitive (no partial match)", () => {
    expect(isVerifiedHandle("@Reuters_Tech")).toBe(false);
    expect(isVerifiedHandle("reuterstech")).toBe(false);
  });
});
