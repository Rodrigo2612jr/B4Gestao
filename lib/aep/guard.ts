import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getClientIp, verifySessionToken } from "@/lib/auth";
import { findUserByEmail, type AdminUser } from "@/lib/db";
import { canAccess } from "@/lib/acl";
import { isEditable, type AepStatus } from "./scoring";

export interface AepActor {
  user: AdminUser;
  ip: string;
}

type GuardResult =
  | { ok: true; user: AdminUser; ip: string }
  | { ok: false; res: NextResponse };

/** Exige sessão válida + acesso ao módulo AEP. */
export async function requireAep(req: NextRequest): Promise<GuardResult> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return { ok: false, res: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  const user = await findUserByEmail(session.email);
  if (!user) return { ok: false, res: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  if (!canAccess(user.role, "aep")) {
    return { ok: false, res: NextResponse.json({ error: "Sem permissão para o módulo AEP" }, { status: 403 }) };
  }
  return { ok: true, user, ip: getClientIp(req) };
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

/** Pode editar conteúdo (só técnico dono ou admin, e enquanto editável). */
export function canEditContent(user: AdminUser, a: AssessmentAccess): boolean {
  const owner = user.role === "ADMIN" || user.id === a.avaliador_user_id;
  return owner && isEditable(a.status);
}

/** Pode concluir/enviar para aprovação. */
export function canSubmit(user: AdminUser, a: AssessmentAccess): boolean {
  const owner = user.role === "ADMIN" || user.id === a.avaliador_user_id;
  return owner && isEditable(a.status);
}

/** Pode aprovar/reprovar (supervisor designado ou admin, no estado certo). */
export function canDecide(user: AdminUser, a: AssessmentAccess): boolean {
  const sup = user.role === "ADMIN" || user.id === a.supervisor_user_id;
  return sup && a.status === "aguardando_aprovacao";
}

/** Qual papel o usuário exerce nesta avaliação (para chat/presença). */
export function actorRoleFor(user: AdminUser, a: AssessmentAccess): "TECNICO" | "SUPERVISOR" | "ADMIN" {
  if (user.id === a.avaliador_user_id) return "TECNICO";
  if (user.id === a.supervisor_user_id) return "SUPERVISOR";
  return user.role === "SUPERVISOR" ? "SUPERVISOR" : user.role === "TECNICO" ? "TECNICO" : "ADMIN";
}
