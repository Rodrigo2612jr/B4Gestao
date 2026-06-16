import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/guard";
import { type AdminUser } from "@/lib/db";
import { isEditable, isEditableForSupervisor, type AepStatus } from "./scoring";

export interface AepActor {
  user: AdminUser;
  ip: string;
}

type GuardResult =
  | { ok: true; user: AdminUser; ip: string }
  | { ok: false; res: NextResponse };

/**
 * Exige sessão válida + conta ativa/não-expirada/senha trocada + acesso ao módulo AEP.
 * Delega ao guard compartilhado (lib/guard.ts) para reutilizar o ciclo de vida da conta.
 */
export async function requireAep(req: NextRequest): Promise<GuardResult> {
  return requireModule(req, "aep");
}

export interface AssessmentAccess {
  status: AepStatus;
  avaliador_user_id: string | null;
  supervisor_user_id: string | null;
}

function isAdminLike(user: AdminUser): boolean {
  return user.role === "ADMIN" || user.role === "SST";
}

/** Pode ver/abrir a avaliação. */
export function canView(user: AdminUser, a: AssessmentAccess): boolean {
  return isAdminLike(user) || user.id === a.avaliador_user_id || user.id === a.supervisor_user_id;
}

/**
 * Pode editar conteúdo. Regra por papel:
 *  - ADMIN/SST: editam em qualquer estado não-terminal.
 *  - SUPERVISOR designado: edita o trabalho do técnico inclusive em "aguardando_aprovacao".
 *  - TÉCNICO dono: edita só enquanto editável (trava após enviar — isEditable).
 */
export function canEditContent(user: AdminUser, a: AssessmentAccess): boolean {
  if (isAdminLike(user)) return a.status !== "aprovado" && a.status !== "cancelado";
  if (user.id === a.supervisor_user_id) return isEditableForSupervisor(a.status);
  if (user.id === a.avaliador_user_id) return isEditable(a.status);
  return false;
}

/** Pode concluir/enviar para aprovação (técnico dono ou admin, enquanto editável). */
export function canSubmit(user: AdminUser, a: AssessmentAccess): boolean {
  const owner = isAdminLike(user) || user.id === a.avaliador_user_id;
  return owner && isEditable(a.status);
}

/**
 * Pode aprovar/reprovar. Segregação de funções (corrige auto-aprovação):
 *  - só em "aguardando_aprovacao";
 *  - NUNCA quem é o avaliador (nem que vire supervisor de si mesmo);
 *  - ADMIN/SST (override) ou o SUPERVISOR designado com papel real SUPERVISOR.
 */
export function canDecide(user: AdminUser, a: AssessmentAccess): boolean {
  if (a.status !== "aguardando_aprovacao") return false;
  if (user.id === a.avaliador_user_id) return false;
  if (isAdminLike(user)) return true;
  return user.role === "SUPERVISOR" && user.id === a.supervisor_user_id;
}

/** Qual papel o usuário exerce nesta avaliação (para chat/presença). */
export function actorRoleFor(user: AdminUser, a: AssessmentAccess): "TECNICO" | "SUPERVISOR" | "ADMIN" {
  if (user.id === a.avaliador_user_id) return "TECNICO";
  if (user.id === a.supervisor_user_id) return "SUPERVISOR";
  return user.role === "SUPERVISOR" ? "SUPERVISOR" : user.role === "TECNICO" ? "TECNICO" : "ADMIN";
}
