import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import { getAssessmentAccess, addRisk, assessmentIdOfFunction } from "@/lib/aep/db";

export const runtime = "nodejs";

const schema = z.object({
  functionId: z.string().uuid().optional().nullable(),
  tipo: z.string().max(100).optional(),
  fatorRisco: z.string().max(200).optional().nullable(),
  fonteGeradora: z.string().max(2000).optional().nullable(),
  possiveisDanos: z.string().max(2000).optional().nullable(),
  controlesExistentes: z.string().max(2000).optional().nullable(),
  p: z.number().int().min(1).max(5).optional().nullable(),
  s: z.number().int().min(1).max(5).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const access = await getAssessmentAccess(id);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!canEditContent(auth.user, access)) {
    return NextResponse.json({ error: "Edição não permitida neste estado" }, { status: 409 });
  }

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

  const { functionId, ...rest } = parsed.data;
  // Se vinculado a uma função, ela precisa pertencer a ESTA avaliação.
  if (functionId && (await assessmentIdOfFunction(functionId)) !== id) {
    return NextResponse.json({ error: "Função não pertence a esta avaliação" }, { status: 400 });
  }
  const risk = await addRisk(id, functionId ?? null, rest);
  return NextResponse.json({ ok: true, risk });
}
