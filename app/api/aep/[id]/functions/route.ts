import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import { getAssessmentAccess, addFunction } from "@/lib/aep/db";

export const runtime = "nodejs";

const schema = z.object({
  sectorId: z.string().uuid(),
  funcaoParadigma: z.string().max(200).optional(),
  ghe: z.string().max(200).optional().nullable(),
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
  if (!parsed.success) return NextResponse.json({ error: "Setor requerido" }, { status: 400 });

  const functionId = await addFunction(id, parsed.data.sectorId, {
    funcaoParadigma: parsed.data.funcaoParadigma,
    ghe: parsed.data.ghe ?? null,
  });
  return NextResponse.json({ ok: true, id: functionId });
}
