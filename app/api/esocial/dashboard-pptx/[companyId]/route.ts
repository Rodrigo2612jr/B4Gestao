import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { findCompanyById } from "@/lib/companies";
import { listAlerts } from "@/lib/esocial/db";
import { calculateCostPanel } from "@/lib/esocial/custo-previsivel";
import { generateESocialDashboardPptx } from "@/lib/reports/dashboard-pptx";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { companyId } = await params;
  const company = await findCompanyById(companyId);
  if (!company) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

  const alerts = await listAlerts({ companyId });
  const panel = await calculateCostPanel(companyId);

  // Agrupa alertas por alert_code
  const alertsByCode: Record<string, { count: number; severity: string; faixa: string | null }> = {};
  for (const a of alerts) {
    const ax = a as typeof a & { alert_code?: string | null };
    const code = ax.alert_code ?? a.kind;
    if (!alertsByCode[code]) {
      alertsByCode[code] = { count: 0, severity: a.severity, faixa: a.custo_faixa };
    }
    alertsByCode[code].count++;
    // Ranking de severity
    if (a.severity === "critical") alertsByCode[code].severity = "critical";
    else if (a.severity === "warn" && alertsByCode[code].severity !== "critical") alertsByCode[code].severity = "warn";
  }

  const buffer = await generateESocialDashboardPptx({
    companyName: company.name,
    cnpj: company.cnpj_formatted,
    alertsByCode,
    integrityScore: panel.integrityScore,
    integrityLabel: panel.integrityLabel,
    totalAlertsActive: panel.totalAlertsActive,
    criticalAlerts: panel.criticalAlerts,
    bands: panel.bands.map((b) => ({
      category: b.category,
      label: b.label,
      faixa: b.faixa,
      rangeLow: b.rangeLow,
      rangeHigh: b.rangeHigh,
    })),
    disclaimer: panel.disclaimer,
  });

  const safeName = company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const filename = `esocial-dashboard-${safeName}.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
