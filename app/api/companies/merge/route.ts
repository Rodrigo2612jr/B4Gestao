import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth";
import { requireAdmin } from "@/lib/guard";
import { verifyUserPassword } from "@/lib/db";
import { mergeCompanies } from "@/lib/companies";

export const runtime = "nodejs";

const mergeSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const s = await requireAdmin(request);
  if (!s.ok) return s.res;
  const ip = s.ip;

  // Rate limit (merge é operação sensível)
  const rl = await checkRateLimit(`merge:${ip}`, {
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
  const user = await verifyUserPassword(s.user.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
  }

  try {
    await mergeCompanies(parsed.data.sourceId, parsed.data.targetId, s.user.email, ip);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[companies/merge] error:", err);
    const msg = err instanceof Error ? err.message : "Erro ao mesclar empresas";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
