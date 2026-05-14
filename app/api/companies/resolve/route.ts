import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME, getClientIp, verifySessionToken } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { isValidCnpj, resolveCompany } from "@/lib/companies";

export const runtime = "nodejs";

const schema = z.object({
  cnpj: z.string().min(14).max(20).refine((v) => isValidCnpj(v), { message: "CNPJ inválido" }),
  name: z.string().min(2).max(200),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(80).optional().nullable(),
});

/**
 * POST /api/companies/resolve
 *
 * Aceita CNPJ + nome e retorna a empresa correspondente.
 * - Se CNPJ existe → vincula à empresa existente.
 * - Se não existe → cria nova empresa.
 * - Em ambos os casos, retorna sugestões fuzzy de possíveis duplicatas.
 *
 * Usado nos wizards dos módulos (Stress Test, Pulse, eSocial) para criar
 * a empresa on-the-fly sem precisar pré-cadastrar.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ip = getClientIp(request);

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  try {
    const { company, created, suggestions } = await resolveCompany({
      cnpj: parsed.data.cnpj,
      name: parsed.data.name,
      city: parsed.data.city ?? null,
      state: parsed.data.state ?? null,
    });

    if (created) {
      await logAudit(session.email, "create_company_inline", company.id, ip);
    }

    return NextResponse.json({
      company,
      created,
      suggestions: suggestions.map((s) => ({
        id: s.company.id,
        name: s.company.name,
        cnpj_formatted: s.company.cnpj_formatted,
        score: s.score,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
