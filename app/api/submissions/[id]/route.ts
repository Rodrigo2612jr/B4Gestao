import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  getClientIp,
  verifySessionToken,
} from "@/lib/auth";
import { logAudit, softDeleteSubmission, verifyUserPassword } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);

  // Must have valid admin session
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  // Rate limit destructive actions: 10 per 5 min per IP
  const rl = checkRateLimit(`delete:${ip}`, {
    max: 10,
    windowMs: 5 * 60 * 1000,
    blockMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Muitas exclusões. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 600) } }
    );
  }

  let body: { senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  // Re-verify password against the logged-in user
  const senha = (body.senha ?? "").toString();
  const user = await verifyUserPassword(session.email, senha);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Senha incorreta" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  await logAudit(session.email, "delete_lead", id, ip);

  try {
    const ok = await softDeleteSubmission(id);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Registro não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[submissions/delete] error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao excluir" }, { status: 500 });
  }
}
