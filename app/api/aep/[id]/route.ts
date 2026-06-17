import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAudit, getUserRoleById } from "@/lib/db";
import { requireAep, canView, canEditContent, canSubmit, canDecide, actorRoleFor } from "@/lib/aep/guard";
import { isEditable } from "@/lib/aep/scoring";
import {
  getAssessmentAccess,
  getAssessmentFull,
  updateAssessmentHeader,
  updateChecklist,
  softDeleteAssessment,
} from "@/lib/aep/db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const access = await getAssessmentAccess(id);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!canView(auth.user, access)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const full = await getAssessmentFull(id);
  if (!full) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const viewer = {
    role: auth.user.role,
    actorRole: actorRoleFor(auth.user, access),
    isAvaliador: auth.user.id === access.avaliador_user_id,
    isSupervisor: auth.user.id === access.supervisor_user_id,
    canEdit: canEditContent(auth.user, access),
    canSubmit: canSubmit(auth.user, access),
    canDecide: canDecide(auth.user, access),
  };
  return NextResponse.json({ ...full, viewer });
}

const patchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  unidade: z.string().max(200).optional().nullable(),
  dataAvaliacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  avaliadorCargo: z.string().max(200).optional().nullable(),
  supervisorUserId: z.string().uuid().optional().nullable(),
  checklist: z.record(z.string(), z.any()).optional(),
});

export async function PATCH(
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
  }

  // Atribuição de supervisor: o alvo PRECISA ter perfil de supervisor (ou admin/SST)
  // e não pode ser o próprio avaliador. Fecha a auto-aprovação (técnico vira supervisor de si).
  if (parsed.data.supervisorUserId) {
    const targetRole = await getUserRoleById(parsed.data.supervisorUserId);
    if (targetRole !== "SUPERVISOR" && targetRole !== "ADMIN" && targetRole !== "SST") {
      return NextResponse.json(
        { error: "Supervisor inválido: o usuário precisa ter perfil de Supervisor." },
        { status: 400 }
      );
    }
    if (parsed.data.supervisorUserId === access.avaliador_user_id) {
      return NextResponse.json(
        { error: "O avaliador e o supervisor não podem ser a mesma pessoa." },
        { status: 400 }
      );
    }
  }

  try {
    const d = parsed.data;
    if (d.checklist !== undefined) {
      await updateChecklist(id, d.checklist);
    }
    if (
      d.title !== undefined ||
      d.unidade !== undefined ||
      d.dataAvaliacao !== undefined ||
      d.avaliadorCargo !== undefined ||
      d.supervisorUserId !== undefined
    ) {
      await updateAssessmentHeader(id, {
        title: d.title,
        unidade: d.unidade ?? null,
        dataAvaliacao: d.dataAvaliacao ?? null,
        avaliadorCargo: d.avaliadorCargo ?? null,
        supervisorUserId: d.supervisorUserId ?? null,
      });
    }
    // Trilha LGPD: registra edição de conteúdo (inclusive supervisor mexendo no trabalho do técnico)
    await logAudit(auth.user.email, "aep_edit", id, auth.ip);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[aep] patch error:", err);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const access = await getAssessmentAccess(id);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // ADMIN/SST excluem em qualquer estado. O técnico dono só enquanto editável
  // (não pode excluir o que já enviou para aprovação — trava de imutabilidade).
  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SST";
  const ownerCanDelete = auth.user.id === access.avaliador_user_id && isEditable(access.status);
  if (!isAdmin && !ownerCanDelete) {
    return NextResponse.json({ error: "Sem permissão para excluir neste estado" }, { status: 403 });
  }

  const ok = await softDeleteAssessment(id);
  if (!ok) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  await logAudit(auth.user.email, "aep_delete", id, auth.ip);
  return NextResponse.json({ ok: true });
}
