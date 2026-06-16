import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireModule } from "@/lib/guard";
import { logAudit } from "@/lib/db";
import { createCampaign, listCampaigns } from "@/lib/pulse/db";

export const runtime = "nodejs";

const questionSchema = z.object({
  id: z.string().min(1).max(20),
  text: z.string().min(3).max(300),
  dimension: z.enum(["demandas", "controle", "apoio", "relacionamentos", "papel", "mudanca", "saude"]),
  reverse: z.boolean().optional(),
});

const createSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(3).max(200),
  areas: z.array(z.string().min(1).max(80)).min(1).max(50),
  anonymityThreshold: z.number().int().min(3).max(50).optional(),
  closesAt: z.string().datetime().nullable().optional(),
  questions: z.array(questionSchema).min(3).max(60).optional(),
});

export async function GET(request: NextRequest) {
  const s = await requireModule(request, "pulse");
  if (!s.ok) return s.res;

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") || undefined;
  const list = await listCampaigns(companyId);
  return NextResponse.json(list.map((c) => ({
    id: c.id,
    companyId: c.company_id,
    title: c.title,
    token: c.token,
    areas: c.areas,
    threshold: c.anonymity_threshold,
    status: c.status,
    createdAt: c.created_at,
    closesAt: c.closes_at,
  })));
}

export async function POST(request: NextRequest) {
  const s = await requireModule(request, "pulse");
  if (!s.ok) return s.res;

  const ip = s.ip;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  try {
    const r = await createCampaign({
      companyId: parsed.data.companyId,
      title: parsed.data.title,
      areas: parsed.data.areas,
      questions: parsed.data.questions,
      anonymityThreshold: parsed.data.anonymityThreshold,
      closesAt: parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
      createdBy: s.user.email,
    });
    await logAudit(s.user.email, "create_pulse_campaign", r.id, ip);
    return NextResponse.json({ ok: true, id: r.id, token: r.token });
  } catch (err) {
    console.error("[pulse] create error:", err);
    return NextResponse.json({ error: "Erro ao criar campanha" }, { status: 500 });
  }
}
