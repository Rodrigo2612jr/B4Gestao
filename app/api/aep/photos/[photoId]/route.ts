import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { requireAep, canEditContent } from "@/lib/aep/guard";
import { getAssessmentAccess, assessmentIdOfPhoto, deletePhoto } from "@/lib/aep/db";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;
  const { photoId } = await params;

  const assessmentId = await assessmentIdOfPhoto(photoId);
  if (!assessmentId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const access = await getAssessmentAccess(assessmentId);
  if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!canEditContent(auth.user, access)) {
    return NextResponse.json({ error: "Edição não permitida neste estado" }, { status: 409 });
  }

  const photo = await deletePhoto(photoId);
  if (!photo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Best-effort: remover do Blob
  if (process.env.BLOB_READ_WRITE_TOKEN && photo.url) {
    try {
      await del(photo.url);
    } catch (err) {
      console.warn("[aep] blob del failed:", err);
    }
  }
  return NextResponse.json({ ok: true });
}
