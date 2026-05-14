import { sql, initDb } from "../db";
import { DEFAULT_TEMPLATE, DIMENSION_LABELS, type PulseQuestion, type Dimension } from "./templates";

export interface PulseCampaign {
  id: string;
  company_id: string;
  title: string;
  token: string;
  questions: PulseQuestion[];
  areas: string[];
  anonymity_threshold: number;
  status: "open" | "closed";
  opens_at: string;
  closes_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PulseResponse {
  id: string;
  campaign_id: string;
  area: string | null;
  answers: Record<string, number>;
  created_at: string;
}

export function randomToken(len = 24): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function createCampaign(input: {
  companyId: string;
  title: string;
  areas: string[];
  questions?: PulseQuestion[];
  anonymityThreshold?: number;
  closesAt?: Date | null;
  createdBy?: string | null;
}): Promise<{ id: string; token: string }> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  const token = randomToken();
  const questions = input.questions ?? DEFAULT_TEMPLATE;
  const threshold = Math.max(3, input.anonymityThreshold ?? 8);

  await sql`
    INSERT INTO pulse_campaigns (id, company_id, title, token, questions, areas, anonymity_threshold, closes_at, created_by)
    VALUES (
      ${id}, ${input.companyId}, ${input.title}, ${token},
      ${JSON.stringify(questions)}::jsonb, ${JSON.stringify(input.areas)}::jsonb,
      ${threshold}, ${input.closesAt ? input.closesAt.toISOString() : null}, ${input.createdBy ?? null}
    )
  `;
  return { id, token };
}

export async function getCampaign(id: string): Promise<PulseCampaign | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, company_id, title, token, questions, areas, anonymity_threshold, status,
           to_char(opens_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS opens_at,
           to_char(closes_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS closes_at,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           created_by
    FROM pulse_campaigns WHERE id = ${id} LIMIT 1
  `;
  return (rows[0] as unknown as PulseCampaign) ?? null;
}

export async function getCampaignByToken(token: string): Promise<PulseCampaign | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, company_id, title, token, questions, areas, anonymity_threshold, status,
           to_char(opens_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS opens_at,
           to_char(closes_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS closes_at,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           created_by
    FROM pulse_campaigns WHERE token = ${token} LIMIT 1
  `;
  return (rows[0] as unknown as PulseCampaign) ?? null;
}

export async function listCampaigns(companyId?: string): Promise<PulseCampaign[]> {
  if (!sql) return [];
  await initDb();
  const rows = companyId
    ? await sql`
        SELECT id, company_id, title, token, questions, areas, anonymity_threshold, status,
               to_char(opens_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS opens_at,
               to_char(closes_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS closes_at,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
               created_by
        FROM pulse_campaigns WHERE company_id = ${companyId}
        ORDER BY created_at DESC LIMIT 100
      `
    : await sql`
        SELECT id, company_id, title, token, questions, areas, anonymity_threshold, status,
               to_char(opens_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS opens_at,
               to_char(closes_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS closes_at,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
               created_by
        FROM pulse_campaigns
        ORDER BY created_at DESC LIMIT 200
      `;
  return rows as unknown as PulseCampaign[];
}

export async function addResponse(input: {
  campaignId: string;
  area: string | null;
  answers: Record<string, number>;
  respondentHash: string;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO pulse_responses (id, campaign_id, area, answers, respondent_hash)
    VALUES (${id}, ${input.campaignId}, ${input.area}, ${JSON.stringify(input.answers)}::jsonb, ${input.respondentHash})
  `;
  return id;
}

export async function listResponses(campaignId: string): Promise<PulseResponse[]> {
  if (!sql) return [];
  await initDb();
  const rows = await sql`
    SELECT id, campaign_id, area, answers,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
    FROM pulse_responses WHERE campaign_id = ${campaignId}
  `;
  return rows as unknown as PulseResponse[];
}

export async function setCampaignStatus(id: string, status: "open" | "closed"): Promise<void> {
  if (!sql) return;
  await sql`UPDATE pulse_campaigns SET status = ${status} WHERE id = ${id}`;
}

export async function countCampaignsByCompany(companyId: string): Promise<number> {
  if (!sql) return 0;
  await initDb();
  const rows = await sql`SELECT COUNT(*)::int AS n FROM pulse_campaigns WHERE company_id = ${companyId}`;
  return (rows[0] as unknown as { n: number }).n ?? 0;
}

// ============================================================
// AGREGAÇÃO COM THRESHOLD DE ANONIMATO
// ============================================================

export interface AggregateResult {
  totalResponses: number;
  threshold: number;
  byDimension: Record<string, { score: number; count: number; pct: number; label: string }>;
  byArea: Record<
    string,
    {
      count: number;
      blocked: boolean; // true se abaixo do threshold
      byDimension?: Record<string, { score: number; pct: number; label: string }>;
    }
  >;
  heatmap: Array<{
    area: string;
    blocked: boolean;
    count: number;
    cells: Array<{ dimension: string; label: string; pct: number | null }>;
  }>;
  quickWins: Array<{ dimension: string; label: string; pct: number; reason: string }>;
}

export function aggregate(
  campaign: PulseCampaign,
  responses: PulseResponse[]
): AggregateResult {
  const threshold = campaign.anonymity_threshold;
  const dimensions = Array.from(new Set(campaign.questions.map((q) => q.dimension)));

  const byDimensionGlobal: Record<string, { sum: number; count: number; max: number }> = {};
  const byArea: Record<string, { count: number; byDim: Record<string, { sum: number; count: number; max: number }> }> = {};

  for (const r of responses) {
    const area = (r.area || "Sem área").trim();
    if (!byArea[area]) byArea[area] = { count: 0, byDim: {} };
    byArea[area].count++;

    for (const q of campaign.questions) {
      const raw = r.answers[q.id];
      if (typeof raw !== "number" || raw < 1 || raw > 5) continue;
      const score = q.reverse ? 6 - raw : raw;
      const max = 5;

      // global
      const g = (byDimensionGlobal[q.dimension] ??= { sum: 0, count: 0, max: 0 });
      g.sum += score;
      g.count++;
      g.max += max;

      // por área
      const a = (byArea[area].byDim[q.dimension] ??= { sum: 0, count: 0, max: 0 });
      a.sum += score;
      a.count++;
      a.max += max;
    }
  }

  const byDimension: AggregateResult["byDimension"] = {};
  for (const dim of dimensions) {
    const g = byDimensionGlobal[dim];
    if (!g || g.count === 0) {
      byDimension[dim] = { score: 0, count: 0, pct: 0, label: DIMENSION_LABELS[dim as Dimension] ?? dim };
    } else {
      byDimension[dim] = {
        score: Math.round((g.sum / g.count) * 10) / 10,
        count: g.count,
        pct: Math.round((g.sum / g.max) * 100),
        label: DIMENSION_LABELS[dim as Dimension] ?? dim,
      };
    }
  }

  const byAreaOut: AggregateResult["byArea"] = {};
  const heatmap: AggregateResult["heatmap"] = [];
  for (const [area, data] of Object.entries(byArea)) {
    const blocked = data.count < threshold;
    const areaResult: AggregateResult["byArea"][string] = { count: data.count, blocked };
    const cells: AggregateResult["heatmap"][number]["cells"] = [];
    if (!blocked) {
      areaResult.byDimension = {};
      for (const dim of dimensions) {
        const a = data.byDim[dim];
        if (!a || a.count === 0) {
          areaResult.byDimension[dim] = { score: 0, pct: 0, label: DIMENSION_LABELS[dim as Dimension] ?? dim };
          cells.push({ dimension: dim, label: DIMENSION_LABELS[dim as Dimension] ?? dim, pct: 0 });
        } else {
          const pct = Math.round((a.sum / a.max) * 100);
          areaResult.byDimension[dim] = {
            score: Math.round((a.sum / a.count) * 10) / 10,
            pct,
            label: DIMENSION_LABELS[dim as Dimension] ?? dim,
          };
          cells.push({ dimension: dim, label: DIMENSION_LABELS[dim as Dimension] ?? dim, pct });
        }
      }
    } else {
      for (const dim of dimensions) {
        cells.push({ dimension: dim, label: DIMENSION_LABELS[dim as Dimension] ?? dim, pct: null });
      }
    }
    byAreaOut[area] = areaResult;
    heatmap.push({ area, blocked, count: data.count, cells });
  }

  // Quick wins: dimensões com pct < 60 globalmente
  const quickWins: AggregateResult["quickWins"] = Object.entries(byDimension)
    .filter(([, v]) => v.pct < 60 && v.count > 0)
    .sort((a, b) => a[1].pct - b[1].pct)
    .slice(0, 5)
    .map(([dim, v]) => ({
      dimension: dim,
      label: v.label,
      pct: v.pct,
      reason: v.pct < 40 ? "Dimensão crítica — ação imediata" : "Dimensão de atenção — ação em 30 dias",
    }));

  return { totalResponses: responses.length, threshold, byDimension, byArea: byAreaOut, heatmap, quickWins };
}
