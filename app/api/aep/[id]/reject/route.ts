import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/db";
import { requireAep, canDecide } from "@/lib/aep/guard";
import { getAssessmentAccess, rejectAssessment, addChatMessage } from "@/lib/aep/db";

export const runtime = "nodejs";

const schema = z.object({ reason: z.string().min(3).max(4000) });

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
    return NextResponse.json({ error: "Apenas o supervisor pode reprovar (e só quando aguardando aprovação)" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe o motivo da reprovação (o que precisa mudar)." }, { status: 400 });
  }

  await rejectAssessment(id, parsed.data.reason, { id: auth.user.id, email: auth.user.email });
  await addChatMessage({
    assessmentId: id,
    authorUserId: auth.user.id,
    authorEmail: auth.user.email,
    authorName: auth.user.name,
    authorRole: "SUPERVISOR",
    body: `Reprovado · ajustes necessários:\n${parsed.data.reason}`,
    kind: "rejection",
  });
  await logAudit(auth.user.email, "aep_reject", id, auth.ip);
  return NextResponse.json({ ok: true, status: "reprovado" });
}
