import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import { getAssessmentAccess, assessmentIdOfRisk, updateRisk, deleteRisk } from "@/lib/aep/db";

export const runtime = "nodejs";

async function authorize(request: NextRequest, riskId: string) {
  const auth = await requireAep(request);
  if (!auth.ok) return { error: auth.res };
  const assessmentId = await assessmentIdOfRisk(riskId);
  if (!assessmentId) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  const access = await getAssessmentAccess(assessmentId);
  if (!access) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  if (!canEditContent(auth.user, access)) {
    return { error: NextResponse.json({ error: "Edição não permitida neste estado" }, { status: 409 }) };
  }
  return { ok: true as const };
}

const schema = z.object({
  tipo: z.string().max(100).optional(),
  fatorRisco: z.string().max(200).optional().nullable(),
  fonteGeradora: z.string().max(2000).optional().nullable(),
  possiveisDanos: z.string().max(2000).optional().nullable(),
  controlesExistentes: z.string().max(2000).optional().nullable(),
  p: z.number().int().min(1).max(5).optional().nullable(),
  s: z.number().int().min(1).max(5).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ riskId: string }> }
) {
  const { riskId } = await params;
  const a = await authorize(request, riskId);
  if ("error" in a) return a.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
  }

  await updateRisk(riskId, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ riskId: string }> }
) {
  const { riskId } = await params;
  const a = await authorize(request, riskId);
  if ("error" in a) return a.error;

  await deleteRisk(riskId);
  return NextResponse.json({ ok: true });
}
