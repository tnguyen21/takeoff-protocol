process.env.LOG_ENABLED = "false";

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createHmac } from "node:crypto";
import {
  isAuthEnabled,
  generateAuthCookie,
  validateAuthCookie,
  parseCookieHeader,
  checkRateLimit,
  recordAttempt,
  getClientIp,
  rateLimitStore,
} from "./auth.js";

const ORIGINAL_PASSWORD = process.env.SITE_PASSWORD;

afterEach(() => {
  // Restore env
  if (ORIGINAL_PASSWORD === undefined) {
    delete process.env.SITE_PASSWORD;
  } else {
    process.env.SITE_PASSWORD = ORIGINAL_PASSWORD;
  }
  // Clear rate limit store
  rateLimitStore.clear();
});

describe("isAuthEnabled", () => {
  it("returns false when SITE_PASSWORD is unset", () => {
    delete process.env.SITE_PASSWORD;
    expect(isAuthEnabled()).toBe(false);
  });

  it("returns false when SITE_PASSWORD is empty", () => {
    process.env.SITE_PASSWORD = "";
    expect(isAuthEnabled()).toBe(false);
  });

  it("returns true when SITE_PASSWORD is set", () => {
    process.env.SITE_PASSWORD = "s3cret";
    expect(isAuthEnabled()).toBe(true);
  });
});

describe("cookie generation and validation", () => {
  beforeEach(() => {
    process.env.SITE_PASSWORD = "test-password-123";
  });

  it("round-trips: generate then validate", () => {
    const cookie = generateAuthCookie();
    expect(validateAuthCookie(cookie)).toBe(true);
  });

  it("rejects an expired cookie (25 hours old)", () => {
    const secret = process.env.SITE_PASSWORD!;
    const oldTimestamp = String(Date.now() - 25 * 60 * 60 * 1000);
    const hmac = createHmac("sha256", secret).update(oldTimestamp).digest("hex");
    const expiredCookie = `${oldTimestamp}:${hmac}`;
    expect(validateAuthCookie(expiredCookie)).toBe(false);
  });

  it("rejects a cookie with wrong HMAC", () => {
    const cookie = generateAuthCookie();
    const [ts] = cookie.split(":");
    const tamperedCookie = `${ts}:deadbeefcafebabe0000000000000000000000000000000000000000deadbeef`;
    expect(validateAuthCookie(tamperedCookie)).toBe(false);
  });
});

describe("rate limiting", () => {
  it("allows 5 attempts then blocks the 6th", () => {
    const ip = "192.168.1.1";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip).allowed).toBe(true);
      recordAttempt(ip);
    }
    expect(checkRateLimit(ip).allowed).toBe(false);
  });

  it("allows again after window resets", () => {
    const ip = "10.0.0.1";
    for (let i = 0; i < 5; i++) recordAttempt(ip);
    expect(checkRateLimit(ip).allowed).toBe(false);

    // Simulate window expiry by mutating resetAt
    const entry = rateLimitStore.get(ip)!;
    entry.resetAt = Date.now() - 1;

    expect(checkRateLimit(ip).allowed).toBe(true);
  });
});

describe("parseCookieHeader", () => {
  it("parses multiple cookies including site_auth", () => {
    const header = "theme=dark; site_auth=12345:abc; session=xyz";
    const parsed = parseCookieHeader(header);
    expect(parsed["site_auth"]).toBe("12345:abc");
    expect(parsed["theme"]).toBe("dark");
    expect(parsed["session"]).toBe("xyz");
  });

  it("returns empty object for undefined", () => {
    expect(parseCookieHeader(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseCookieHeader("")).toEqual({});
  });
});

describe("getClientIp", () => {
  it("prefers Fly-Client-IP over X-Forwarded-For", () => {
    const headers = new Headers({
      "fly-client-ip": "1.2.3.4",
      "x-forwarded-for": "5.6.7.8, 9.10.11.12",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to first IP in X-Forwarded-For", () => {
    const headers = new Headers({
      "x-forwarded-for": "5.6.7.8, 9.10.11.12",
    });
    expect(getClientIp(headers)).toBe("5.6.7.8");
  });

  it('returns "unknown" when no headers present', () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
