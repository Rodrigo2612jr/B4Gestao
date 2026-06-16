import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/guard";
import { listAlerts } from "@/lib/esocial/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const s = await requireModule(request, "esocial");
  if (!s.ok) return s.res;

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") || undefined;
  const alerts = await listAlerts({ companyId });
  return NextResponse.json(alerts.map((a) => ({
    id: a.id,
    uploadId: a.upload_id,
    companyId: a.company_id,
    kind: a.kind,
    severity: a.severity,
    title: a.title,
    description: a.description,
    custoFaixa: a.custo_faixa,
    resolved: a.resolved,
    createdAt: a.created_at,
  })));
}
