import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/guard";
import {
  listUsers,
  findUserByEmail,
  getUserRoleById,
  createUserWithInvite,
  createInviteForUser,
  setUserActive,
  setUserAccessExpiry,
  logAudit,
} from "@/lib/db";

export const runtime = "nodejs";

const ROLES = ["ADMIN", "SST", "RH", "JURIDICO", "TECNICO", "SUPERVISOR"] as const;

function inviteUrl(request: NextRequest, rawToken: string): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  return `${base}/admin/ativar?token=${rawToken}`;
}

// GET — lista usuários (só ADMIN)
export async function GET(request: NextRequest) {
  const s = await requireAdmin(request);
  if (!s.ok) return s.res;
  const users = await listUsers();
  return NextResponse.json({ users });
}

const createSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(2).max(120),
  role: z.enum(ROLES),
  validDays: z.number().int().min(1).max(3650).nullable().optional(),
});

// POST — cria usuário + convite de uso único (só ADMIN). Retorna o link de ativação.
export async function POST(request: NextRequest) {
  const s = await requireAdmin(request);
  if (!s.ok) return s.res;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail." }, { status: 409 });
  }

  const { userId, rawToken, expiresAt } = await createUserWithInvite({
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    invitedBy: s.user.id,
    validDays: parsed.data.validDays ?? null,
  });
  await logAudit(s.user.email, `user_invite_create:${parsed.data.role}`, userId, s.ip);

  return NextResponse.json({
    ok: true,
    userId,
    inviteUrl: inviteUrl(request, rawToken),
    inviteExpiresAt: expiresAt,
  });
}

const patchSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["deactivate", "reactivate", "set_expiry", "regenerate_invite"]),
  expiresAt: z.string().datetime().nullable().optional(),
});

// PATCH — ações de ciclo de vida (só ADMIN)
export async function PATCH(request: NextRequest) {
  const s = await requireAdmin(request);
  if (!s.ok) return s.res;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { userId, action } = parsed.data;

  // Um admin não pode desativar/expirar a própria conta (evita auto-lockout).
  if (userId === s.user.id && (action === "deactivate" || action === "set_expiry")) {
    return NextResponse.json({ error: "Você não pode alterar o acesso da sua própria conta." }, { status: 400 });
  }

  const targetRole = await getUserRoleById(userId);
  if (!targetRole) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  switch (action) {
    case "deactivate":
      await setUserActive(userId, false);
      await logAudit(s.user.email, "user_deactivate", userId, s.ip);
      return NextResponse.json({ ok: true });
    case "reactivate":
      await setUserActive(userId, true);
      await logAudit(s.user.email, "user_reactivate", userId, s.ip);
      return NextResponse.json({ ok: true });
    case "set_expiry":
      await setUserAccessExpiry(userId, parsed.data.expiresAt ?? null);
      await logAudit(s.user.email, `user_set_expiry:${parsed.data.expiresAt ?? "none"}`, userId, s.ip);
      return NextResponse.json({ ok: true });
    case "regenerate_invite": {
      const { rawToken, expiresAt } = await createInviteForUser(userId, s.user.id, "reset");
      await logAudit(s.user.email, "user_regenerate_invite", userId, s.ip);
      return NextResponse.json({ ok: true, inviteUrl: inviteUrl(request, rawToken), inviteExpiresAt: expiresAt });
    }
  }
}
