import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireModule } from "@/lib/guard";
import { logAudit, verifyUserPassword } from "@/lib/db";
import { getStressAudit, softDeleteStressAudit } from "@/lib/stress-test/db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireModule(request, "stress");
  if (!s.ok) return s.res;

  const { id } = await params;
  const audit = await getStressAudit(id);
  if (!audit) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json({
    id: audit.id,
    companyId: audit.company_id,
    respondentName: audit.respondent_name,
    respondentRole: audit.respondent_role,
    answers: audit.answers,
    result: audit.result_json,
    notes: audit.notes,
    createdAt: audit.created_at,
    createdBy: audit.created_by,
  });
}

const deleteSchema = z.object({ senha: z.string().min(1) });

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireModule(request, "stress");
  if (!s.ok) return s.res;

  const ip = s.ip;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Senha requerida" }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Senha requerida" }, { status: 400 });

  const user = await verifyUserPassword(s.user.email, parsed.data.senha);
  if (!user) return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });

  const ok = await softDeleteStressAudit(id);
  if (!ok) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await logAudit(s.user.email, "delete_stress_audit", id, ip);
  return NextResponse.json({ ok: true });
}
