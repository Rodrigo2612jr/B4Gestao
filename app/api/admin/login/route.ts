import { NextRequest, NextResponse, after } from "next/server";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  createSessionToken,
  getClientIp,
  resetRateLimit,
} from "@/lib/auth";
import {
  logAudit,
  findUserByEmail,
  recordLoginFailure,
  markSuccessfulLogin,
} from "@/lib/db";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
// Hash bcrypt fixo (cost 12) para comparar quando o e-mail não existe — mantém o tempo
// de resposta constante (anti-enumeração) SEM uma 2ª ida ao banco.
const DUMMY_HASH = "$2b$12$zCbLFuEDVek..8qe4VO8TeaP6T0cW0/C/IdmTwGzt1bmoksXpjSSm";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  let body: { email?: string; senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();
  const senha = (body.senha ?? "").toString();
  if (!email || !senha) {
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  // Rate limit (por IP) + busca do usuário em PARALELO — 1 ida ao banco em vez de 2 sequenciais.
  const [rl, existing] = await Promise.all([
    checkRateLimit(`login:${ip}`, { max: MAX_ATTEMPTS, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 }),
    findUserByEmail(email),
  ]);

  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 900) } }
    );
  }

  // Lockout por conta (durável)
  if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
    return NextResponse.json(
      { ok: false, error: "Conta temporariamente bloqueada por tentativas. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  // Verifica a senha. Sem usuário → compara com hash fixo para tempo constante (anti-enumeração).
  const ok = await bcrypt.compare(senha, existing?.password_hash ?? DUMMY_HASH);
  if (!existing || !ok) {
    if (existing) await recordLoginFailure(existing.id, MAX_ATTEMPTS, LOCK_MS);
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  const user = existing;

  // Conta desativada / acesso expirado (acessos temporários + kill switch)
  if (user.is_active === false) {
    return NextResponse.json({ ok: false, error: "Conta desativada. Procure o administrador." }, { status: 403 });
  }
  if (user.access_expires_at && new Date(user.access_expires_at) < new Date()) {
    return NextResponse.json({ ok: false, error: "Seu acesso expirou. Procure o administrador." }, { status: 403 });
  }

  // Bookkeeping (último acesso, reset do rate-limit, auditoria) roda APÓS a resposta via
  // after() — não bloqueia o login. Na Vercel o runtime mantém a função viva até concluir.
  after(async () => {
    await Promise.all([
      markSuccessfulLogin(user.id),
      resetRateLimit(`login:${ip}`),
      logAudit(user.email, "login", null, ip),
    ]);
  });

  const token = createSessionToken({ id: user.id, email: user.email });
  const res = NextResponse.json({
    ok: true,
    user: {
      email: user.email,
      name: user.name,
      mustChangePassword: user.must_change_password,
    },
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}
