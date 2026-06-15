import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getClientIp, verifySessionToken } from "@/lib/auth";
import { sql, initDb, logAudit } from "@/lib/db";
import { isValidCnpj, resolveCompany } from "@/lib/companies";

export const runtime = "nodejs";

/**
 * Backfill: percorre submissions sem company_id e tenta vincular.
 * - Se tem CNPJ válido → resolveCompany cria/vincula.
 * - Se não → fica sem vínculo (admin pode editar manualmente no futuro).
 *
 * Endpoint protegido por sessão. Idempotente · pode ser rodado várias vezes.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: "DB não configurado" }, { status: 500 });
  }

  const ip = getClientIp(request);
  await initDb();

  const rows = (await sql`
    SELECT id, empresa, cnpj, regiao
    FROM submissions
    WHERE company_id IS NULL AND deleted_at IS NULL
    LIMIT 500
  `) as unknown as Array<{ id: string; empresa: string; cnpj: string | null; regiao: string }>;

  let linked = 0;
  let skipped = 0;
  const skippedDetails: Array<{ id: string; empresa: string; reason: string }> = [];

  for (const r of rows) {
    if (!r.cnpj || !isValidCnpj(r.cnpj)) {
      skipped++;
      skippedDetails.push({ id: r.id, empresa: r.empresa, reason: "CNPJ ausente ou inválido" });
      continue;
    }
    try {
      const { company } = await resolveCompany({
        cnpj: r.cnpj,
        name: r.empresa,
        state: r.regiao,
      });
      await sql`UPDATE submissions SET company_id = ${company.id} WHERE id = ${r.id}`;
      linked++;
    } catch (err) {
      skipped++;
      skippedDetails.push({
        id: r.id,
        empresa: r.empresa,
        reason: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  await logAudit(session.email, "backfill_companies", `linked:${linked} skipped:${skipped}`, ip);

  return NextResponse.json({
    ok: true,
    processed: rows.length,
    linked,
    skipped,
    skippedDetails: skippedDetails.slice(0, 50),
  });
}
