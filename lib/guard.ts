import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getClientIp, verifySessionToken } from "@/lib/auth";
import { findUserByEmail, type AdminUser } from "@/lib/db";
import { canAccess, type Module } from "@/lib/acl";

/**
 * Guard único de sessão para TODAS as rotas internas.
 *
 * Resolve a sessão e revalida o estado da conta a cada request (revogação quase
 * imediata, já que o token HMAC é stateless e dura 8h):
 *  - conta inexistente → 401
 *  - conta desativada (is_active=false) → 403  (kill switch)
 *  - acesso expirado (access_expires_at < agora) → 403  (acessos temporários)
 *  - senha temporária ainda não trocada → 403  (a menos que allowMustChange)
 *
 * requireModule() adiciona a checagem de ACL por módulo (lib/acl.ts) que, antes
 * desta revisão, só era aplicada no AEP.
 */

export type SessionOk = { ok: true; user: AdminUser; ip: string };
export type SessionResult = SessionOk | { ok: false; res: NextResponse };

function deny(status: number, error: string, code?: string): { ok: false; res: NextResponse } {
  return { ok: false, res: NextResponse.json({ error, code }, { status }) };
}

export async function requireSession(
  req: NextRequest,
  opts?: { allowMustChange?: boolean }
): Promise<SessionResult> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return deny(401, "Não autorizado");

  const user = await findUserByEmail(session.email);
  if (!user) return deny(401, "Não autorizado");
  if (user.is_active === false) return deny(403, "Conta desativada", "account_disabled");
  if (user.access_expires_at && new Date(user.access_expires_at) < new Date()) {
    return deny(403, "Acesso expirado", "access_expired");
  }
  if (!opts?.allowMustChange && user.must_change_password) {
    return deny(403, "Troque sua senha temporária para continuar", "must_change_password");
  }
  return { ok: true, user, ip: getClientIp(req) };
}

/** Sessão válida + permissão para o módulo (companies/leads/pulse/stress/esocial/users/aep). */
export async function requireModule(req: NextRequest, module: Module): Promise<SessionResult> {
  const s = await requireSession(req);
  if (!s.ok) return s;
  if (!canAccess(s.user.role, module)) {
    return deny(403, "Sem permissão para este módulo", "forbidden_module");
  }
  return s;
}

/** Exige perfil ADMIN (operações destrutivas / administração de usuários). */
export async function requireAdmin(req: NextRequest): Promise<SessionResult> {
  const s = await requireSession(req);
  if (!s.ok) return s;
  if (s.user.role !== "ADMIN") return deny(403, "Apenas administradores", "forbidden_admin");
  return s;
}
