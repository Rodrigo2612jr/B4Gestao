import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/db";
import { requireAep, canSubmit } from "@/lib/aep/guard";
import { getAssessmentAccess, getAssessmentFull, submitAssessment, addChatMessage } from "@/lib/aep/db";
import { isChecklistComplete } from "@/lib/aep/checklist";

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
  if (!canSubmit(auth.user, access)) {
    return NextResponse.json({ error: "Não é possível concluir neste estado" }, { status: 409 });
  }

  const full = await getAssessmentFull(id);
  if (!full) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const missing: string[] = [];
  if (full.sectors.length === 0) missing.push("Adicione pelo menos um setor.");
  const totalFunctions = full.sectors.reduce((acc, s) => acc + s.functions.length, 0);
  if (totalFunctions === 0) missing.push("Adicione pelo menos uma função.");
  if (!isChecklistComplete(full.checklist)) missing.push("Responda todas as perguntas do checklist.");
  if (missing.length > 0) {
    return NextResponse.json({ error: "Avaliação incompleta", missing }, { status: 422 });
  }

  const ok = await submitAssessment(id, access.status, { id: auth.user.id, email: auth.user.email });
  if (!ok) {
    return NextResponse.json({ error: "O estado da avaliação mudou. Recarregue e tente novamente." }, { status: 409 });
  }
  await addChatMessage({
    assessmentId: id,
    authorUserId: auth.user.id,
    authorEmail: auth.user.email,
    authorName: auth.user.name,
    authorRole: "TECNICO",
    body: "Avaliação concluída e enviada para aprovação do supervisor.",
    kind: "status",
  });
  await logAudit(auth.user.email, "aep_submit", id, auth.ip);
  return NextResponse.json({ ok: true, status: "aguardando_aprovacao" });
}
