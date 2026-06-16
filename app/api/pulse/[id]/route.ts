import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireModule } from "@/lib/guard";
import { logAudit } from "@/lib/db";
import { getCampaign, listResponses, aggregate, setCampaignStatus } from "@/lib/pulse/db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireModule(request, "pulse");
  if (!s.ok) return s.res;

  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  const responses = await listResponses(id);
  const agg = aggregate(campaign, responses);
  return NextResponse.json({
    campaign: {
      id: campaign.id,
      companyId: campaign.company_id,
      title: campaign.title,
      token: campaign.token,
      areas: campaign.areas,
      questions: campaign.questions,
      threshold: campaign.anonymity_threshold,
      status: campaign.status,
      createdAt: campaign.created_at,
      opensAt: campaign.opens_at,
      closesAt: campaign.closes_at,
    },
    aggregate: agg,
  });
}

const patchSchema = z.object({ status: z.enum(["open", "closed"]).optional() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireModule(request, "pulse");
  if (!s.ok) return s.res;

  const { id } = await params;
  const ip = s.ip;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  if (parsed.data.status) {
    await setCampaignStatus(id, parsed.data.status);
    await logAudit(s.user.email, `pulse_${parsed.data.status}`, id, ip);
  }
  return NextResponse.json({ ok: true });
}
