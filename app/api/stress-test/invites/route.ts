import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME, getClientIp, verifySessionToken } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { createStressInvite, listStressInvites } from "@/lib/stress-test/db";

export const runtime = "nodejs";

const schema = z.object({ companyId: z.string().uuid() });

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId requerido" }, { status: 400 });

  const list = await listStressInvites(companyId);
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ip = getClientIp(request);
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { id, token: inviteToken } = await createStressInvite(parsed.data.companyId, session.email);
  await logAudit(session.email, "create_stress_invite", id, ip);
  return NextResponse.json({ ok: true, id, token: inviteToken });
}
