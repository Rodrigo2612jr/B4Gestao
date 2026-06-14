import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAep, canView, actorRoleFor } from "@/lib/aep/guard";
import { getAssessmentAccess, listChat, addChatMessage } from "@/lib/aep/db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const access = await getAssessmentAccess(id);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!canView(auth.user, access)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const url = new URL(request.url);
  const after = url.searchParams.get("after");
  const messages = await listChat(id, after);
  return NextResponse.json(messages);
}

const schema = z.object({ body: z.string().min(1).max(4000) });

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  const message = await addChatMessage({
    assessmentId: id,
    authorUserId: auth.user.id,
    authorEmail: auth.user.email,
    authorName: auth.user.name,
    authorRole: actorRoleFor(auth.user, access),
    body: parsed.data.body,
  });
  return NextResponse.json({ ok: true, message });
}
