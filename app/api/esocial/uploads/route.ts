import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/guard";
import { logAudit } from "@/lib/db";
import { createUpload, finishUpload, listUploads } from "@/lib/esocial/db";
import { processESocial } from "@/lib/esocial/parser";

export const runtime = "nodejs";
// Tamanho máximo do upload: ~10MB. Para volumes maiores migrar pra blob storage.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const s = await requireModule(request, "esocial");
  if (!s.ok) return s.res;

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") || undefined;
  await logAudit(s.user.email, "esocial_list_uploads", companyId ?? null, s.ip);
  const list = await listUploads(companyId);
  return NextResponse.json(list.map((u) => ({
    id: u.id,
    companyId: u.company_id,
    filename: u.filename,
    sizeBytes: u.size_bytes,
    status: u.status,
    eventsCount: u.events_count,
    alertsCount: u.alerts_count,
    createdAt: u.created_at,
    createdBy: u.created_by,
    error: u.error,
  })));
}

export async function POST(request: NextRequest) {
  const s = await requireModule(request, "esocial");
  if (!s.ok) return s.res;

  const ip = s.ip;

  const formData = await request.formData();
  const file = formData.get("file");
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) return NextResponse.json({ error: "companyId requerido" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo requerido" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo maior que 10MB" }, { status: 413 });
  }

  // Só XML do eSocial (evita upload de binário/script arbitrário)
  const nameLower = file.name.toLowerCase();
  const isXml =
    nameLower.endsWith(".xml") || file.type === "text/xml" || file.type === "application/xml";
  if (!isXml) {
    return NextResponse.json({ error: "Envie um arquivo XML do eSocial (.xml)" }, { status: 415 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const text = buf.toString("utf8");

  const uploadId = await createUpload({
    companyId,
    filename: file.name,
    sizeBytes: file.size,
    createdBy: s.user.email,
  });

  await logAudit(s.user.email, "esocial_upload", uploadId, ip);

  try {
    const result = await processESocial({
      uploadId,
      companyId,
      content: text,
      filename: file.name,
    });
    await finishUpload(uploadId, {
      eventsCount: result.eventsTotal,
      alertsCount: result.alertsCreated,
      meta: { byType: result.byType, workersDetected: result.workersDetected },
    });
    return NextResponse.json({ ok: true, id: uploadId, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro";
    await finishUpload(uploadId, { eventsCount: 0, alertsCount: 0, error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
