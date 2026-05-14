import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  getClientIp,
  verifySessionToken,
} from "@/lib/auth";
import { verifyUserPassword } from "@/lib/db";
import { mergeCompanies } from "@/lib/companies";

export const runtime = "nodejs";

const mergeSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Rate limit (merge é operação sensível)
  const rl = checkRateLimit(`merge:${ip}`, {
    max: 10,
    windowMs: 60 * 1000,
    blockMs: 5 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = mergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Re-confirmação de senha (mesma proteção do delete)
  const user = await verifyUserPassword(session.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
  }

  try {
    await mergeCompanies(parsed.data.sourceId, parsed.data.targetId, session.email, ip);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[companies/merge] error:", err);
    const msg = err instanceof Error ? err.message : "Erro ao mesclar empresas";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
