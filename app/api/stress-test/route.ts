import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireModule } from "@/lib/guard";
import { logAudit } from "@/lib/db";
import { calculateScore, validateAnswers, type Answers } from "@/lib/stress-test/scoring";
import { createStressAudit, listStressAudits } from "@/lib/stress-test/db";

export const runtime = "nodejs";

const altRegex = /^[A-E]$/;
const createSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  respondentName: z.string().min(2).max(200),
  respondentRole: z.string().max(200).optional(),
  answers: z.record(z.string(), z.string().regex(altRegex)),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const s = await requireModule(request, "stress");
  if (!s.ok) return s.res;

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") || undefined;

  try {
    const audits = await listStressAudits(companyId);
    return NextResponse.json(
      audits.map((a) => ({
        id: a.id,
        companyId: a.company_id,
        respondentName: a.respondent_name,
        respondentRole: a.respondent_role,
        scoreTotal: a.score_total,
        semaforo: a.semaforo,
        engavetamento: a.engavetamento_score,
        coerencia: a.coerencia_label,
        faixa: a.faixa,
        createdAt: a.created_at,
        createdBy: a.created_by,
      }))
    );
  } catch (err) {
    console.error("[stress-test] list error:", err);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const s = await requireModule(request, "stress");
  if (!s.ok) return s.res;

  const ip = s.ip;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
  }

  const answers = parsed.data.answers as Answers;
  const v = validateAnswers(answers);
  if (!v.ok) {
    return NextResponse.json({ error: "Respostas faltando", missing: v.missing }, { status: 400 });
  }

  try {
    const result = calculateScore(answers);
    const id = await createStressAudit({
      companyId: parsed.data.companyId ?? null,
      respondentName: parsed.data.respondentName,
      respondentRole: parsed.data.respondentRole ?? null,
      answers,
      result,
      notes: parsed.data.notes ?? null,
      createdBy: s.user.email,
    });
    await logAudit(s.user.email, "create_stress_audit", id, ip);
    return NextResponse.json({ ok: true, id, result });
  } catch (err) {
    console.error("[stress-test] create error:", err);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
