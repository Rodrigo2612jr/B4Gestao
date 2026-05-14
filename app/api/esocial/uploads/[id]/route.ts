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
    alerts: alerts.map((a) => {
      // a pode ter campos v3 (alert_code, period_start/end, related_events, recommended_action)
      const ax = a as typeof a & {
        alert_code?: string | null;
        period_start?: string | null;
        period_end?: string | null;
        related_events?: Record<string, string[]> | null;
        recommended_action?: string | null;
      };
      return {
        id: a.id,
        kind: a.kind,
        severity: a.severity,
        title: a.title,
        description: a.description,
        evidence: a.evidence,
        custoFaixa: a.custo_faixa,
        resolved: a.resolved,
        createdAt: a.created_at,
        // Campos v3 oficiais
        alertCode: ax.alert_code ?? null,
        periodStart: ax.period_start ?? null,
        periodEnd: ax.period_end ?? null,
        relatedEvents: ax.related_events ?? null,
        recommendedAction: ax.recommended_action ?? null,
      };
    }),
  });
}
