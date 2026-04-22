import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  createSessionToken,
  getClientIp,
  resetRateLimit,
} from "@/lib/auth";
import { logAudit, touchLastLogin, verifyUserPassword } from "@/lib/db";

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

  let body: { email?: string; senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();
  const senha = (body.senha ?? "").toString();

  if (!email || !senha) {
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  const user = await verifyUserPassword(email, senha);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  resetRateLimit(`login:${ip}`);
  await touchLastLogin(user.id);
  await logAudit(user.email, "login", null, ip);

  const token = createSessionToken({ id: user.id, email: user.email });
  const res = NextResponse.json({
    ok: true,
    user: {
      email: user.email,
      name: user.name,
      mustChangePassword: user.must_change_password,
    },
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}
