import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getStressAudit } from "@/lib/stress-test/db";
import { findCompanyById } from "@/lib/companies";
import { generateStressTestPptx } from "@/lib/reports/stress-pptx";
import { generateStressDashboardPptx } from "@/lib/reports/dashboard-pptx";
import { generateStressNarrative } from "@/lib/ai/anthropic";

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
    // Tenta gerar narrativa AI (silencioso se falhar — usa fallback)
    const narrative = await generateStressNarrative({
      companyName: company?.name ?? "Empresa",
      scoreTotal: audit.result_json.total,
      semaforo: audit.result_json.semaforo,
      semaforoLabel: audit.result_json.semaforoLabel,
      engavetamento: {
        classification: audit.result_json.engavetamento.classification ?? "",
        score: audit.result_json.engavetamento.score,
        max: audit.result_json.engavetamento.max,
      },
      faixa: audit.result_json.faixa,
      coerencia: {
        label: audit.result_json.coerencia.label,
        description: audit.result_json.coerencia.description,
      },
      weakSpots: audit.result_json.weakSpots.map((w) => ({ id: w.id, text: w.text, chosen: w.chosen })),
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
