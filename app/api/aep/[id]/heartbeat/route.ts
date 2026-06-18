import { NextRequest, NextResponse } from "next/server";
import { requireAep, canView } from "@/lib/aep/guard";
import { getAssessmentAccess, touchPresence } from "@/lib/aep/db";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const access = await getAssessmentAccess(id);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!canView(auth.user, access)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const who = auth.user.id === access.avaliador_user_id ? "tecnico" : "supervisor";

  // O técnico publica seu cursor (passo + pergunta atual) p/ o supervisor acompanhar ao vivo.
  let cursor:
    | { step: string; fn: string | null; sub: string | null; focus: string | null }
    | null = null;
  if (who === "tecnico") {
    try {
      const body = await request.json();
      if (body && typeof body.step === "string") {
        cursor = {
          step: body.step,
          fn: typeof body.fn === "string" ? body.fn : null,
          sub: typeof body.sub === "string" ? body.sub : null,
          focus: typeof body.focus === "string" ? body.focus : null,
        };
      }
    } catch {
      /* heartbeat pode vir sem corpo */
    }
  }

  await touchPresence(id, who, cursor);
  return NextResponse.json({ ok: true, who });
}
