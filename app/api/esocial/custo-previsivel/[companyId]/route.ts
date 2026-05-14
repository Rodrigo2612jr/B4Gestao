import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { calculateCostPanel, DEFAULT_COST_CONFIG } from "@/lib/esocial/custo-previsivel";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { companyId } = await params;
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
