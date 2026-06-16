import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/guard";
import { getCampaign, listResponses, aggregate } from "@/lib/pulse/db";
import { findCompanyById } from "@/lib/companies";
import { generatePulsePptx } from "@/lib/reports/pulse-pptx";
import { generatePulseDashboardPptx } from "@/lib/reports/dashboard-pptx";
import { generatePulseNarrativeLocal } from "@/lib/reports/narrative-local";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireModule(request, "pulse");
  if (!s.ok) return s.res;

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
    const narrative = generatePulseNarrativeLocal({
      companyName: company?.name ?? "Empresa",
      campaignTitle: campaign.title,
      aggregate: agg,
    });
    buffer = await generatePulsePptx({
      companyName: company?.name ?? "Empresa",
      cnpj: company?.cnpj_formatted ?? "—",
      campaignTitle: campaign.title,
      createdAt: campaign.created_at,
      aggregate: agg,
      narrative,
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
