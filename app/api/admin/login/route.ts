import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  createSessionToken,
  getClientIp,
  resetRateLimit,
  timingSafeEqualStr,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // 5 attempts per 15 min, then blocked for 15 min
  const rl = checkRateLimit(`login:${ip}`, {
    max: 5,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 900) } }
    );
  }

  let body: { senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Servidor não configurado" },
      { status: 500 }
    );
  }

  const senha = (body.senha ?? "").toString();
  const ok = timingSafeEqualStr(senha, expected);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  // Success — reset rate limit for this IP
  resetRateLimit(`login:${ip}`);

  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours
  });
  return res;
}
