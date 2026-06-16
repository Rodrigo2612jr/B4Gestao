import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireModule } from "@/lib/guard";
import { logAudit } from "@/lib/db";
import { createStressInvite, listStressInvites } from "@/lib/stress-test/db";

export const runtime = "nodejs";

const schema = z.object({ companyId: z.string().uuid() });

export async function GET(request: NextRequest) {
  const s = await requireModule(request, "stress");
  if (!s.ok) return s.res;

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId requerido" }, { status: 400 });

  const list = await listStressInvites(companyId);
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const s = await requireModule(request, "stress");
  if (!s.ok) return s.res;

  const ip = s.ip;
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { id, token: inviteToken } = await createStressInvite(parsed.data.companyId, s.user.email);
  await logAudit(s.user.email, "create_stress_invite", id, ip);
  return NextResponse.json({ ok: true, id, token: inviteToken });
}
