import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import { logAudit } from "@/lib/db";
import { getAssessmentAccess, assessmentIdOfSector, updateSector, deleteSector } from "@/lib/aep/db";

export const runtime = "nodejs";

async function authorize(request: NextRequest, sectorId: string) {
  const auth = await requireAep(request);
  if (!auth.ok) return { error: auth.res };
  const assessmentId = await assessmentIdOfSector(sectorId);
  if (!assessmentId) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  const access = await getAssessmentAccess(assessmentId);
  if (!access) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  if (!canEditContent(auth.user, access)) {
    return { error: NextResponse.json({ error: "Edição não permitida neste estado" }, { status: 409 }) };
  }
  return { ok: true as const, auth, assessmentId };
}

const schema = z.object({ nome: z.string().min(1).max(200) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sectorId: string }> }
) {
  const { sectorId } = await params;
  const a = await authorize(request, sectorId);
  if ("error" in a) return a.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nome requerido" }, { status: 400 });

  await updateSector(sectorId, parsed.data.nome);
  await logAudit(a.auth.user.email, "aep_edit_sector", a.assessmentId, a.auth.ip);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sectorId: string }> }
) {
  const { sectorId } = await params;
  const a = await authorize(request, sectorId);
  if ("error" in a) return a.error;

  await deleteSector(sectorId);
  await logAudit(a.auth.user.email, "aep_delete_sector", a.assessmentId, a.auth.ip);
  return NextResponse.json({ ok: true });
}
