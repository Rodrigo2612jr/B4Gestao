import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAudit, getUserRoleById } from "@/lib/db";
import { requireAep } from "@/lib/aep/guard";
import { createAssessment, listAssessments } from "@/lib/aep/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId");

  try {
    const list = await listAssessments({
      role: auth.user.role,
      userId: auth.user.id,
      companyId: companyId || null,
    });
    return NextResponse.json(list);
  } catch (err) {
    console.error("[aep] list error:", err);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}

const createSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(2).max(200),
  unidade: z.string().max(200).optional().nullable(),
  dataAvaliacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  avaliadorUserId: z.string().uuid().optional().nullable(),
  supervisorUserId: z.string().uuid().optional().nullable(),
  avaliadorCargo: z.string().max(200).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;

  // Só técnico ou admin criam avaliações
  if (auth.user.role !== "TECNICO" && auth.user.role !== "ADMIN" && auth.user.role !== "SST") {
    return NextResponse.json({ error: "Apenas técnicos podem criar avaliações" }, { status: 403 });
  }

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

  // Técnico cria sempre como avaliador dele mesmo (a menos que admin defina outro)
  const avaliadorUserId =
    auth.user.role === "TECNICO" ? auth.user.id : parsed.data.avaliadorUserId ?? auth.user.id;

  // Supervisor (se informado) precisa ter perfil de supervisor e ser ≠ do avaliador.
  if (parsed.data.supervisorUserId) {
    const targetRole = await getUserRoleById(parsed.data.supervisorUserId);
    if (targetRole !== "SUPERVISOR" && targetRole !== "ADMIN" && targetRole !== "SST") {
      return NextResponse.json(
        { error: "Supervisor inválido: o usuário precisa ter perfil de Supervisor." },
        { status: 400 }
      );
    }
    if (parsed.data.supervisorUserId === avaliadorUserId) {
      return NextResponse.json(
        { error: "O avaliador e o supervisor não podem ser a mesma pessoa." },
        { status: 400 }
      );
    }
  }

  try {
    const id = await createAssessment({
      companyId: parsed.data.companyId,
      title: parsed.data.title,
      unidade: parsed.data.unidade ?? null,
      dataAvaliacao: parsed.data.dataAvaliacao ?? null,
      avaliadorUserId,
      supervisorUserId: parsed.data.supervisorUserId ?? null,
      avaliadorCargo: parsed.data.avaliadorCargo ?? null,
      createdBy: auth.user.email,
    });
    await logAudit(auth.user.email, "aep_create", id, auth.ip);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[aep] create error:", err);
    return NextResponse.json({ error: "Erro ao criar avaliação" }, { status: 500 });
  }
}
