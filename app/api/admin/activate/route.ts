import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/auth";
import { peekInvite, consumeInvite, logAudit } from "@/lib/db";

export const runtime = "nodejs";

// GET — valida o token (sem consumir) para a tela mostrar nome/e-mail.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });
  const info = await peekInvite(token);
  return NextResponse.json(info, { status: info.valid ? 200 : 410 });
}

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(1),
  confirm: z.string().min(1),
});

// POST — consome o convite e define a senha definitiva. Não cria sessão (OWASP).
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`activate:${ip}`, {
    max: 10,
    windowMs: 15 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  if (parsed.data.password !== parsed.data.confirm) {
    return NextResponse.json({ error: "As senhas não conferem." }, { status: 400 });
  }

  const r = await consumeInvite(parsed.data.token, parsed.data.password);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });

  await logAudit(null, "account_activated", null, ip);
  return NextResponse.json({ ok: true });
}
