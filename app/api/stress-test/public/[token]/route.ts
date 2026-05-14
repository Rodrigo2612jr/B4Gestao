import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/auth";
import { findCompanyById } from "@/lib/companies";
import { calculateScore, validateAnswers, type Answers } from "@/lib/stress-test/scoring";
import { createStressAudit, getStressInviteByToken, consumeStressInvite } from "@/lib/stress-test/db";
import { QUESTIONS } from "@/lib/stress-test/questions";

export const runtime = "nodejs";

// GET — busca pública por token (retorna empresa + perguntas)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getStressInviteByToken(token);
  if (!invite) return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  if (invite.status !== "open") return NextResponse.json({ error: "Este link já foi utilizado." }, { status: 410 });

  const company = await findCompanyById(invite.company_id);
  return NextResponse.json({
    company: company ? { name: company.name, cnpj_formatted: company.cnpj_formatted } : null,
    questions: QUESTIONS,
  });
}

const submitSchema = z.object({
  respondentName: z.string().min(2).max(200),
  respondentRole: z.string().max(200).optional(),
  answers: z.record(z.string(), z.string().regex(/^[A-E]$/)),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request);
  const { token } = await params;

  const rl = checkRateLimit(`stress-public:${ip}`, { max: 5, windowMs: 60_000, blockMs: 5 * 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: "Muitas tentativas. Aguarde." }, { status: 429 });

  const invite = await getStressInviteByToken(token);
  if (!invite) return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  if (invite.status !== "open") return NextResponse.json({ error: "Este link já foi utilizado." }, { status: 410 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const answers = parsed.data.answers as Answers;
  const v = validateAnswers(answers);
  if (!v.ok) return NextResponse.json({ error: "Respostas faltando", missing: v.missing }, { status: 400 });

  try {
    const result = calculateScore(answers);
    const auditId = await createStressAudit({
      companyId: invite.company_id,
      respondentName: parsed.data.respondentName,
      respondentRole: parsed.data.respondentRole ?? null,
      answers,
      result,
      createdBy: "public-link",
    });
    await consumeStressInvite(token, auditId);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[stress-public] error:", err);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
