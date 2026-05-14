import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getUpload, listAlerts } from "@/lib/esocial/db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const upload = await getUpload(id);
  if (!upload) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const alerts = await listAlerts({ uploadId: id });
  return NextResponse.json({
    upload: {
      id: upload.id,
      companyId: upload.company_id,
      filename: upload.filename,
      sizeBytes: upload.size_bytes,
      status: upload.status,
      eventsCount: upload.events_count,
      alertsCount: upload.alerts_count,
      meta: upload.meta,
      error: upload.error,
      createdAt: upload.created_at,
      createdBy: upload.created_by,
    },
    alerts: alerts.map((a) => ({
      id: a.id,
      kind: a.kind,
      severity: a.severity,
      title: a.title,
      description: a.description,
      evidence: a.evidence,
      custoFaixa: a.custo_faixa,
      resolved: a.resolved,
      createdAt: a.created_at,
    })),
  });
}
