import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import { logAudit } from "@/lib/db";
import {
  getAssessmentAccess,
  assessmentIdOfFunction,
  updateFunction,
  deleteFunction,
} from "@/lib/aep/db";

export const runtime = "nodejs";

async function authorize(request: NextRequest, functionId: string) {
  const auth = await requireAep(request);
  if (!auth.ok) return { error: auth.res };
  const assessmentId = await assessmentIdOfFunction(functionId);
  if (!assessmentId) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  const access = await getAssessmentAccess(assessmentId);
  if (!access) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  if (!canEditContent(auth.user, access)) {
    return { error: NextResponse.json({ error: "Edição não permitida neste estado" }, { status: 409 }) };
  }
  return { ok: true as const, auth, assessmentId };
}

const schema = z.object({
  ghe: z.string().max(200).optional().nullable(),
  funcaoParadigma: z.string().max(200).optional(),
  postoTrabalho: z.string().max(500).optional().nullable(),
  descricaoAmbiente: z.string().max(8000).optional().nullable(),
  descricaoAtividade: z.string().max(8000).optional().nullable(),
  modoOperatorio: z.string().max(8000).optional().nullable(),
  mobiliarioEquipamentos: z.string().max(8000).optional().nullable(),
  confortoAcustico: z.string().max(2000).optional().nullable(),
  temperatura: z.string().max(2000).optional().nullable(),
  iluminacao: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ functionId: string }> }
) {
  const { functionId } = await params;
  const a = await authorize(request, functionId);
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

  await updateFunction(functionId, parsed.data);
  await logAudit(a.auth.user.email, "aep_edit_function", a.assessmentId, a.auth.ip);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ functionId: string }> }
) {
  const { functionId } = await params;
  const a = await authorize(request, functionId);
  if ("error" in a) return a.error;

  await deleteFunction(functionId);
  await logAudit(a.auth.user.email, "aep_delete_function", a.assessmentId, a.auth.ip);
  return NextResponse.json({ ok: true });
}
