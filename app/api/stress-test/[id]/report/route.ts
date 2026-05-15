import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getStressAudit } from "@/lib/stress-test/db";
import { findCompanyById } from "@/lib/companies";
import { generateStressTestPptx } from "@/lib/reports/stress-pptx";
import { generateStressDashboardPptx } from "@/lib/reports/dashboard-pptx";
import { generateStressNarrativeLocal } from "@/lib/reports/narrative-local";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") ?? "executive"; // "executive" | "dashboard"

  const audit = await getStressAudit(id);
  if (!audit) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const company = audit.company_id ? await findCompanyById(audit.company_id) : null;

  let buffer: Buffer;
  if (variant === "dashboard") {
    buffer = await generateStressDashboardPptx({
      companyName: company?.name ?? "Empresa não vinculada",
      cnpj: company?.cnpj_formatted ?? "—",
      respondentName: audit.respondent_name,
      createdAt: audit.created_at,
      result: audit.result_json,
    });
  } else {
    // Narrativa gerada localmente (determinística, sem IA externa)
    const narrative = generateStressNarrativeLocal({
      companyName: company?.name ?? "Empresa",
      result: audit.result_json,
    });
    buffer = await generateStressTestPptx({
      companyName: company?.name ?? "Empresa não vinculada",
      cnpj: company?.cnpj_formatted ?? "—",
      respondentName: audit.respondent_name,
      respondentRole: audit.respondent_role,
      createdAt: audit.created_at,
      result: audit.result_json,
      narrative,
    });
  }

  const safeName = (company?.name ?? "empresa").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const filename = `stress-${variant}-${safeName}-${new Date(audit.created_at).toISOString().slice(0, 10)}.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
