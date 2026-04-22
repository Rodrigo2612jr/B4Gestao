import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  getClientIp,
  verifySessionToken,
} from "@/lib/auth";
import { logAudit, updateUserPassword, verifyUserPassword } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  // Rate limit password changes: 5 per hour
  const rl = checkRateLimit(`pwd:${ip}`, {
    max: 5,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const current = (body.currentPassword ?? "").toString();
  const next = (body.newPassword ?? "").toString();

  if (next.length < 8) {
    return NextResponse.json(
      { ok: false, error: "A nova senha deve ter no mínimo 8 caracteres" },
      { status: 400 }
    );
  }

  // Verify current password
  const user = await verifyUserPassword(session.email, current);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Senha atual incorreta" }, { status: 403 });
  }

  await updateUserPassword(user.id, next);
  await logAudit(user.email, "change_password", null, ip);

  return NextResponse.json({ ok: true });
}
