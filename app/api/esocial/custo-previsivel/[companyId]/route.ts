import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/guard";
import { logAudit } from "@/lib/db";
import { calculateCostPanel, DEFAULT_COST_CONFIG } from "@/lib/esocial/custo-previsivel";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const s = await requireModule(request, "esocial");
  if (!s.ok) return s.res;

  const { companyId } = await params;
  await logAudit(s.user.email, "esocial_view_custo", companyId, s.ip);
  const url = new URL(request.url);

  // Overrides opcionais via query (?salary=4000&faeAliquot=0.05)
  const cfg = { ...DEFAULT_COST_CONFIG };
  const salaryParam = url.searchParams.get("salary");
  if (salaryParam) cfg.defaultSalary = Math.max(1000, parseFloat(salaryParam) || cfg.defaultSalary);
  const aliquotParam = url.searchParams.get("faeAliquot");
  if (aliquotParam) cfg.faeAliquot = Math.min(0.5, Math.max(0, parseFloat(aliquotParam) || cfg.faeAliquot));
  const monthsParam = url.searchParams.get("months");
  if (monthsParam) cfg.monthsLookback = Math.min(60, Math.max(1, parseInt(monthsParam) || cfg.monthsLookback));

  const result = await calculateCostPanel(companyId, cfg);
  return NextResponse.json({ ...result, config: cfg });
}
