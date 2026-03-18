import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "site_auth";
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds

// ── Rate limit store ──

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ── Auth helpers ──

export function isAuthEnabled(): boolean {
  const pw = process.env.SITE_PASSWORD;
  return typeof pw === "string" && pw.length > 0;
}

export function checkPassword(input: string): boolean {
  const pw = process.env.SITE_PASSWORD ?? "";
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function generateAuthCookie(): string {
  const timestamp = String(Date.now());
  const hmac = createHmac("sha256", process.env.SITE_PASSWORD ?? "")
    .update(timestamp)
    .digest("hex");
  return `${timestamp}:${hmac}`;
}

export function validateAuthCookie(value: string): boolean {
  const sep = value.indexOf(":");
  if (sep === -1) return false;

  const timestamp = value.slice(0, sep);
  const providedHmac = value.slice(sep + 1);

  // Check expiry
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  if (Date.now() - ts > COOKIE_MAX_AGE_MS) return false;

  // Recompute HMAC
  const expectedHmac = createHmac("sha256", process.env.SITE_PASSWORD ?? "")
    .update(timestamp)
    .digest("hex");

  // Constant-time comparison
  const a = Buffer.from(providedHmac);
  const b = Buffer.from(expectedHmac);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ── Cookie parser ──

export function parseCookieHeader(
  header: string | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const val = pair.slice(eq + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

// ── Rate limiting ──

export function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Lazily prune expired entries on access
  if (entry && now >= entry.resetAt) {
    rateLimitStore.delete(ip);
    return { allowed: true };
  }

  if (!entry) return { allowed: true };
  return { allowed: entry.count < RATE_LIMIT_MAX };
}

export function recordAttempt(ip: string): void {
  const now = Date.now();

  // Prune expired entries lazily
  for (const [key, val] of rateLimitStore) {
    if (now >= val.resetAt) rateLimitStore.delete(key);
  }

  const entry = rateLimitStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
  }
}

// ── Client IP extraction ──

export function getClientIp(headers: Headers): string {
  const flyClientIp = headers.get("fly-client-ip");
  if (flyClientIp) return flyClientIp;

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  return "unknown";
}

// ── Gate page HTML ──

export function getGatePageHtml(error?: string): string {
  const errorHtml = error
    ? `<p style="color:#ef4444;margin:0 0 16px;font-size:14px">${error}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Takeoff Protocol</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a14;color:#e5e7eb;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#111827;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:40px;width:100%;max-width:380px;text-align:center}
h1{font-size:22px;font-weight:600;margin-bottom:24px;color:#f9fafb}
input[type="password"]{width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:#0a0a14;color:#e5e7eb;font-size:15px;outline:none;margin-bottom:16px}
input[type="password"]:focus{border-color:#8b5cf6}
button{width:100%;padding:10px;border:none;border-radius:8px;background:#8b5cf6;color:#fff;font-size:15px;font-weight:500;cursor:pointer}
button:hover{background:#7c3aed}
.rate-limit{color:#f59e0b;font-size:13px;margin-top:12px}
</style>
</head>
<body>
<div class="card">
<h1>Takeoff Protocol</h1>
${errorHtml}
<form method="POST" action="/api/auth">
<input type="password" name="password" placeholder="Password" autofocus required/>
<button type="submit">Enter</button>
</form>
<div class="rate-limit"></div>
</div>
</body>
</html>`;
}

export { COOKIE_NAME, rateLimitStore };
