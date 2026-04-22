import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  getClientIp,
  verifySessionToken,
} from "@/lib/auth";
import { insertSubmission, listSubmissions, logAudit } from "@/lib/db";
import { sendNewLeadEmail } from "@/lib/email";

export const runtime = "nodejs";

// Server-side validation schema with strict size limits
const submissionSchema = z.object({
  funcionarios: z.string().min(1).max(100),
  necessidade: z.string().min(1).max(200),
  regiao: z.string().min(1).max(100),
  empresa: z.string().min(2).max(200),
  cnpj: z.string().max(20).optional(),
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
});

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests may not send Origin
  try {
    const url = new URL(origin);
    const host = url.host;
    if (host === "localhost:3000" || host === "127.0.0.1:3000") return true;
    if (host.endsWith("b4gestao.com.br")) return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

// POST — salvar nova submissão (público, protegido com origin + rate limit + validação)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Origin check (CSRF protection)
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ ok: false, error: "Origem não autorizada" }, { status: 403 });
  }

  // Rate limit: 5 submissions per minute per IP
  const rl = checkRateLimit(`submit:${ip}`, {
    max: 5,
    windowMs: 60 * 1000,
    blockMs: 5 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisições. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const { id, row } = await insertSubmission({
      funcionarios: parsed.data.funcionarios,
      necessidade: parsed.data.necessidade,
      regiao: parsed.data.regiao,
      empresa: parsed.data.empresa,
      cnpj: parsed.data.cnpj ?? null,
      nome: parsed.data.nome,
      telefone: parsed.data.telefone,
    });
    // Fire-and-forget email notification (doesn't block response)
    sendNewLeadEmail(row).catch((err) => {
      console.error("[email] send failed:", err);
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[submissions] insert error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao salvar" }, { status: 500 });
  }
}

// GET — listar submissões (protegido por session cookie httpOnly)
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await logAudit(session.email, "list_leads", null, ip);

  try {
    const submissions = await listSubmissions();
    // Remap field name to match frontend expectation
    const out = submissions.map((s) => ({
      id: s.id,
      funcionarios: s.funcionarios,
      necessidade: s.necessidade,
      regiao: s.regiao,
      empresa: s.empresa,
      cnpj: s.cnpj ?? undefined,
      nome: s.nome,
      telefone: s.telefone,
      criadoEm: s.criado_em,
    }));
    return NextResponse.json(out);
  } catch (err) {
    console.error("[submissions] list error:", err);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}
