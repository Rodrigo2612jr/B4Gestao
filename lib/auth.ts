import crypto from "node:crypto";

/**
 * Simple session token utilities using HMAC-SHA256.
 * Format: <payload_base64url>.<signature_base64url>
 * Payload: { exp: number } (unix ms timestamp)
 */

const SECRET = process.env.ADMIN_SESSION_SECRET || "";
if (!SECRET || SECRET.length < 32) {
  // Don't throw at module load in dev, but log warning.
  if (process.env.NODE_ENV === "production") {
    console.error("ADMIN_SESSION_SECRET not set or too short (min 32 chars)");
  }
}

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

function sign(data: string): string {
  return crypto
    .createHmac("sha256", SECRET || "fallback-insecure-dev-secret-do-not-use-in-prod-pls")
    .update(data)
    .digest("base64url");
}

export function createSessionToken(): string {
  const payload = { exp: Date.now() + SESSION_DURATION_MS };
  const data = b64url(JSON.stringify(payload));
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [data, sig] = parts;
  const expectedSig = sign(data);
  // Timing-safe compare
  if (sig.length !== expectedSig.length) return false;
  try {
    const eq = crypto.timingSafeEqual(
      Buffer.from(sig, "base64url"),
      Buffer.from(expectedSig, "base64url")
    );
    if (!eq) return false;
  } catch {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Timing-safe string compare (used for password check).
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Still do a compare to burn time
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Simple in-memory rate limiter.
 * Keyed by IP. Sliding window via timestamps.
 */
type Attempt = { count: number; firstAt: number; blockedUntil: number };
const attempts = new Map<string, Attempt>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number; blockMs: number }
): RateLimitResult {
  const now = Date.now();
  const a = attempts.get(key);
  if (a && a.blockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((a.blockedUntil - now) / 1000) };
  }
  if (!a || now - a.firstAt > opts.windowMs) {
    attempts.set(key, { count: 1, firstAt: now, blockedUntil: 0 });
    return { allowed: true };
  }
  a.count += 1;
  if (a.count > opts.max) {
    a.blockedUntil = now + opts.blockMs;
    return { allowed: false, retryAfterSec: Math.ceil(opts.blockMs / 1000) };
  }
  return { allowed: true };
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export const SESSION_COOKIE_NAME = "b4_admin_session";
