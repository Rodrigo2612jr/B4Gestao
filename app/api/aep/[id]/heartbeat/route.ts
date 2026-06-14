import { NextRequest, NextResponse } from "next/server";
import { requireAep, canView } from "@/lib/aep/guard";
import { getAssessmentAccess, touchPresence } from "@/lib/aep/db";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const access = await getAssessmentAccess(id);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!canView(auth.user, access)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const who = auth.user.id === access.avaliador_user_id ? "tecnico" : "supervisor";
  await touchPresence(id, who);
  return NextResponse.json({ ok: true, who });
}
