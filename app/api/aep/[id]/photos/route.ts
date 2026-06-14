import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { logAudit } from "@/lib/db";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import {
  getAssessmentAccess,
  assessmentIdOfFunction,
  countPhotosByFunction,
  addPhoto,
} from "@/lib/aep/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_PER_FUNCTION = 4;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const access = await getAssessmentAccess(id);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!canEditContent(auth.user, access)) {
    return NextResponse.json({ error: "Edição não permitida neste estado" }, { status: 409 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const functionId = String(formData.get("functionId") ?? "");
  const caption = formData.get("caption") ? String(formData.get("caption")) : null;

  if (!functionId) return NextResponse.json({ error: "functionId requerido" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo requerido" }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Apenas imagens são aceitas" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Imagem maior que 8MB" }, { status: 413 });
  }

  // Função pertence a esta avaliação?
  const parentAssessment = await assessmentIdOfFunction(functionId);
  if (parentAssessment !== id) {
    return NextResponse.json({ error: "Função inválida" }, { status: 400 });
  }

  const count = await countPhotosByFunction(functionId);
  if (count >= MAX_PER_FUNCTION) {
    return NextResponse.json({ error: `Máximo de ${MAX_PER_FUNCTION} fotos por função` }, { status: 409 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Storage de imagens não configurado (BLOB_READ_WRITE_TOKEN ausente)" },
      { status: 503 }
    );
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const pathname = `aep/${id}/${functionId}/${crypto.randomUUID()}-${safeName}`;
    const blob = await put(pathname, file, { access: "public", contentType: file.type });
    const photo = await addPhoto({
      functionId,
      assessmentId: id,
      url: blob.url,
      pathname: blob.pathname,
      caption,
      sizeBytes: file.size,
    });
    await logAudit(auth.user.email, "aep_photo_upload", id, auth.ip);
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    console.error("[aep] photo upload error:", err);
    return NextResponse.json({ error: "Falha no upload da imagem" }, { status: 500 });
  }
}
