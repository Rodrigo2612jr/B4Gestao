import crypto from "node:crypto";
import { sql, initDb } from "./db";

/**
 * Simple session token utilities using HMAC-SHA256.
 * Format: <payload_base64url>.<signature_base64url>
 * Payload: { exp: number } (unix ms timestamp)
 */

const SECRET = process.env.ADMIN_SESSION_SECRET || "";
if (!SECRET || SECRET.length < 32) {
  if (process.env.NODE_ENV === "production") {
    // Fail-fast: jamais rodar em produção assinando sessões com segredo ausente/fraco.
    throw new Error(
      "ADMIN_SESSION_SECRET ausente ou muito curto (mínimo 32 caracteres). Configure a variável de ambiente antes do deploy."
    );
  }
  console.warn("[auth] ADMIN_SESSION_SECRET ausente/curto — usando segredo efêmero de DESENVOLVIMENTO.");
}

// Em dev sem segredo: segredo aleatório POR PROCESSO (some ao reiniciar) — nunca um literal commitado.
const DEV_SECRET = SECRET || crypto.randomBytes(48).toString("hex");

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET || DEV_SECRET).update(data).digest("base64url");
}

export interface SessionPayload {
  exp: number;
  uid: string;
  email: string;
}

export function createSessionToken(user: { id: string; email: string }): string {
  const payload: SessionPayload = {
    exp: Date.now() + SESSION_DURATION_MS,
    uid: user.id,
    email: user.email,
  };
  const data = b64url(JSON.stringify(payload));
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined | null
): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = sign(data);
  if (sig.length !== expectedSig.length) return null;
  try {
    const eq = crypto.timingSafeEqual(
      Buffer.from(sig, "base64url"),
      Buffer.from(expectedSig, "base64url")
    );
    if (!eq) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (typeof payload.exp !== "number" || !payload.uid || !payload.email) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
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

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

// Fallback EM MEMÓRIA — só quando não há banco (ex.: dev sem DATABASE_URL).
type Attempt = { count: number; firstAt: number; blockedUntil: number };
const memAttempts = new Map<string, Attempt>();
function checkRateLimitMemory(
  key: string,
  opts: { max: number; windowMs: number; blockMs: number }
): RateLimitResult {
  const now = Date.now();
  const a = memAttempts.get(key);
  if (a && a.blockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((a.blockedUntil - now) / 1000) };
  }
  if (!a || now - a.firstAt > opts.windowMs) {
    memAttempts.set(key, { count: 1, firstAt: now, blockedUntil: 0 });
    return { allowed: true };
  }
  a.count += 1;
  if (a.count > opts.max) {
    a.blockedUntil = now + opts.blockMs;
    return { allowed: false, retryAfterSec: Math.ceil(opts.blockMs / 1000) };
  }
  return { allowed: true };
}

/**
 * Rate limit DURÁVEL em Postgres — compartilhado entre instâncias serverless e
 * resistente a cold start (o Map em memória não era). Atômico via INSERT ... ON CONFLICT.
 * Fail-open: se o banco falhar, libera (não derruba o serviço por causa do limitador).
 */
export async function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number; blockMs: number }
): Promise<RateLimitResult> {
  if (!sql) return checkRateLimitMemory(key, opts);
  try {
    await initDb();
    const rows = await sql`
      INSERT INTO rate_limits (key, count, window_start, blocked_until)
      VALUES (${key}, 1, NOW(), NULL)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > NOW() THEN rate_limits.count
          WHEN NOW() - rate_limits.window_start > (${opts.windowMs}::bigint * interval '1 millisecond') THEN 1
          ELSE rate_limits.count + 1 END,
        window_start = CASE
          WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > NOW() THEN rate_limits.window_start
          WHEN NOW() - rate_limits.window_start > (${opts.windowMs}::bigint * interval '1 millisecond') THEN NOW()
          ELSE rate_limits.window_start END,
        blocked_until = CASE
          WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > NOW() THEN rate_limits.blocked_until
          WHEN NOW() - rate_limits.window_start <= (${opts.windowMs}::bigint * interval '1 millisecond')
               AND rate_limits.count + 1 > ${opts.max}
          THEN NOW() + (${opts.blockMs}::bigint * interval '1 millisecond')
          ELSE NULL END
      RETURNING blocked_until, EXTRACT(EPOCH FROM (blocked_until - NOW()))::int AS retry_after
    `;
    const row = rows[0] as unknown as { blocked_until: string | null; retry_after: number | null };
    if (row?.blocked_until && new Date(row.blocked_until) > new Date()) {
      return { allowed: false, retryAfterSec: Math.max(1, row.retry_after ?? Math.ceil(opts.blockMs / 1000)) };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[ratelimit] erro de DB, liberando:", err);
    return { allowed: true };
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  memAttempts.delete(key);
  if (!sql) return;
  try {
    await sql`DELETE FROM rate_limits WHERE key = ${key}`;
  } catch {
    /* noop */
  }
}

export function getClientIp(req: Request): string {
  // Na Vercel, x-vercel-forwarded-for é preenchido pela borda e NÃO é spoofável pelo cliente.
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  // Fallback (dev/local): primeiro hop do XFF.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

export const SESSION_COOKIE_NAME = "b4_admin_session";
