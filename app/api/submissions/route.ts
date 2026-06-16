import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/auth";
import { requireModule } from "@/lib/guard";
import { insertSubmission, listSubmissions, logAudit } from "@/lib/db";
import { sendNewLeadEmail } from "@/lib/email";
import { isValidCnpj, resolveCompany, stripCnpj } from "@/lib/companies";

export const runtime = "nodejs";

// Server-side validation schema with strict size limits
const submissionSchema = z.object({
  funcionarios: z.string().min(1).max(100),
  necessidade: z.string().min(1).max(200),
  regiao: z.string().min(1).max(100),
  empresa: z.string().min(2).max(200),
  cnpj: z
    .string()
    .min(14)
    .max(20)
    .refine((v) => isValidCnpj(v), { message: "CNPJ inválido" }),
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
  const rl = await checkRateLimit(`submit:${ip}`, {
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
    // Resolve a empresa (cria nova ou vincula a existente por CNPJ)
    let companyId: string | null = null;
    let companyDupSuggestions: { id: string; name: string; score: number }[] = [];
    try {
      const resolved = await resolveCompany({
        cnpj: parsed.data.cnpj,
        name: parsed.data.empresa,
        state: parsed.data.regiao,
      });
      companyId = resolved.company.id;
      companyDupSuggestions = resolved.suggestions.map((s) => ({
        id: s.company.id,
        name: s.company.name,
        score: s.score,
      }));
    } catch (err) {
      console.error("[submissions] resolveCompany failed:", err);
    }

    const { id, row } = await insertSubmission({
      funcionarios: parsed.data.funcionarios,
      necessidade: parsed.data.necessidade,
      regiao: parsed.data.regiao,
      empresa: parsed.data.empresa,
      cnpj: stripCnpj(parsed.data.cnpj),
      nome: parsed.data.nome,
      telefone: parsed.data.telefone,
      company_id: companyId,
    });
    // Fire-and-forget email notification (doesn't block response)
    sendNewLeadEmail(row).catch((err) => {
      console.error("[email] send failed:", err);
    });
    return NextResponse.json({
      ok: true,
      id,
      companyId,
      dupSuggestions: companyDupSuggestions,
    });
  } catch (err) {
    console.error("[submissions] insert error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao salvar" }, { status: 500 });
  }
}

// GET — listar submissões (protegido por sessão + módulo leads)
export async function GET(request: NextRequest) {
  const s = await requireModule(request, "leads");
  if (!s.ok) return s.res;

  await logAudit(s.user.email, "list_leads", null, s.ip);

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
      companyId: s.company_id ?? undefined,
    }));
    return NextResponse.json(out);
  } catch (err) {
    console.error("[submissions] list error:", err);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}
