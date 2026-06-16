import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/auth";
import { getCampaignByToken, addResponse } from "@/lib/pulse/db";
import crypto from "node:crypto";

export const runtime = "nodejs";

// GET — busca pública da campanha pelo token (só dados de respondente)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const campaign = await getCampaignByToken(token);
  if (!campaign) return NextResponse.json({ error: "Pesquisa não encontrada" }, { status: 404 });
  const isClosed = campaign.status !== "open" || (campaign.closes_at !== null && new Date(campaign.closes_at) < new Date());
  if (isClosed) return NextResponse.json({ error: "Pesquisa encerrada" }, { status: 410 });

  return NextResponse.json({
    title: campaign.title,
    questions: campaign.questions,
    areas: campaign.areas,
  });
}

const submitSchema = z.object({
  area: z.string().min(1).max(80).optional().nullable(),
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request);
  const { token } = await params;

  const rl = await checkRateLimit(`pulse-resp:${ip}`, { max: 10, windowMs: 60_000, blockMs: 5 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas respostas. Aguarde." }, { status: 429 });
  }

  const campaign = await getCampaignByToken(token);
  if (!campaign) return NextResponse.json({ error: "Pesquisa não encontrada" }, { status: 404 });
  const isClosed = campaign.status !== "open" || (campaign.closes_at !== null && new Date(campaign.closes_at) < new Date());
  if (isClosed) return NextResponse.json({ error: "Pesquisa encerrada" }, { status: 410 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  // Valida que respondeu todas as perguntas
  const missing = campaign.questions.filter((q) => parsed.data.answers[q.id] === undefined).map((q) => q.id);
  if (missing.length > 0) {
    return NextResponse.json({ error: "Respostas faltando", missing }, { status: 400 });
  }

  // Hash do respondente (IP + UA) — só pra evitar 2 envios rápidos do mesmo browser
  const ua = request.headers.get("user-agent") ?? "";
  const respondentHash = crypto.createHash("sha256").update(`${campaign.id}|${ip}|${ua}`).digest("hex");

  await addResponse({
    campaignId: campaign.id,
    area: parsed.data.area ?? null,
    answers: parsed.data.answers,
    respondentHash,
  });

  return NextResponse.json({ ok: true });
}
