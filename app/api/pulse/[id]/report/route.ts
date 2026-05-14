import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getCampaign, listResponses, aggregate } from "@/lib/pulse/db";
import { findCompanyById } from "@/lib/companies";
import { generatePulsePptx } from "@/lib/reports/pulse-pptx";
import { generatePulseDashboardPptx } from "@/lib/reports/dashboard-pptx";

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
  const variant = url.searchParams.get("variant") ?? "executive";

  const campaign = await getCampaign(id);
  if (!campaign) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  const responses = await listResponses(id);
  const agg = aggregate(campaign, responses);
  const company = await findCompanyById(campaign.company_id);

  let buffer: Buffer;
  if (variant === "dashboard") {
    buffer = await generatePulseDashboardPptx({
      companyName: company?.name ?? "Empresa",
      cnpj: company?.cnpj_formatted ?? "—",
      campaignTitle: campaign.title,
      createdAt: campaign.created_at,
      aggregate: agg,
    });
  } else {
    buffer = await generatePulsePptx({
      companyName: company?.name ?? "Empresa",
      cnpj: company?.cnpj_formatted ?? "—",
      campaignTitle: campaign.title,
      createdAt: campaign.created_at,
      aggregate: agg,
    });
  }

  const safeName = (company?.name ?? "empresa").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const filename = `pulse-${variant}-${safeName}-${new Date(campaign.created_at).toISOString().slice(0, 10)}.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
