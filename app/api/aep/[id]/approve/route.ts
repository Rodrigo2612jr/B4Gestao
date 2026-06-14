import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/db";
import { requireAep, canDecide } from "@/lib/aep/guard";
import { getAssessmentAccess, approveAssessment, addChatMessage } from "@/lib/aep/db";

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
  if (!canDecide(auth.user, access)) {
    return NextResponse.json({ error: "Apenas o supervisor pode aprovar (e só quando aguardando aprovação)" }, { status: 403 });
  }

  await approveAssessment(id, { id: auth.user.id, email: auth.user.email });
  await addChatMessage({
    assessmentId: id,
    authorUserId: auth.user.id,
    authorEmail: auth.user.email,
    authorName: auth.user.name,
    authorRole: "SUPERVISOR",
    body: "Avaliação aprovada. ✅",
    kind: "status",
  });
  await logAudit(auth.user.email, "aep_approve", id, auth.ip);
  return NextResponse.json({ ok: true, status: "aprovado" });
}
