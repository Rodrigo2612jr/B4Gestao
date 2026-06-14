import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import { getAssessmentAccess, addSector } from "@/lib/aep/db";

export const runtime = "nodejs";

const schema = z.object({ nome: z.string().min(1).max(200) });

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
  if (!parsed.success) return NextResponse.json({ error: "Nome do setor requerido" }, { status: 400 });

  const sector = await addSector(id, parsed.data.nome);
  return NextResponse.json({ ok: true, sector });
}
