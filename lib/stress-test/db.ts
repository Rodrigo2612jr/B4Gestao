import { sql, initDb } from "../db";
import type { Answers, ScoreResult } from "./scoring";

export interface StressAudit {
  id: string;
  company_id: string | null;
  respondent_name: string;
  respondent_role: string | null;
  answers: Answers;
  score_total: number;
  semaforo: string;
  engavetamento_score: number;
  coerencia_label: string;
  faixa: string;
  result_json: ScoreResult;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export async function createStressAudit(input: {
  companyId: string | null;
  respondentName: string;
  respondentRole?: string | null;
  answers: Answers;
  result: ScoreResult;
  notes?: string | null;
  createdBy?: string | null;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO stress_test_audits (
      id, company_id, respondent_name, respondent_role,
      answers, score_total, semaforo, engavetamento_score,
      coerencia_label, faixa, result_json, notes, created_by
    ) VALUES (
      ${id}, ${input.companyId}, ${input.respondentName}, ${input.respondentRole ?? null},
      ${JSON.stringify(input.answers)}::jsonb, ${input.result.total}, ${input.result.semaforo},
      ${input.result.engavetamento.score}, ${input.result.coerencia.label}, ${input.result.faixa},
      ${JSON.stringify(input.result)}::jsonb, ${input.notes ?? null}, ${input.createdBy ?? null}
    )
  `;
  return id;
}

export async function listStressAudits(companyId?: string): Promise<StressAudit[]> {
  if (!sql) return [];
  await initDb();
  const rows = companyId
    ? await sql`
        SELECT id, company_id, respondent_name, respondent_role, answers,
               score_total, semaforo, engavetamento_score, coerencia_label, faixa,
               result_json, notes,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
               created_by
        FROM stress_test_audits
        WHERE deleted_at IS NULL AND company_id = ${companyId}
        ORDER BY created_at DESC
        LIMIT 200
      `
    : await sql`
        SELECT id, company_id, respondent_name, respondent_role, answers,
               score_total, semaforo, engavetamento_score, coerencia_label, faixa,
               result_json, notes,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
               created_by
        FROM stress_test_audits
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 500
      `;
  return rows as unknown as StressAudit[];
}

export async function getStressAudit(id: string): Promise<StressAudit | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, company_id, respondent_name, respondent_role, answers,
           score_total, semaforo, engavetamento_score, coerencia_label, faixa,
           result_json, notes,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           created_by
    FROM stress_test_audits
    WHERE id = ${id} AND deleted_at IS NULL
    LIMIT 1
  `;
  return (rows[0] as unknown as StressAudit) ?? null;
}

export async function softDeleteStressAudit(id: string): Promise<boolean> {
  if (!sql) return false;
  const result = await sql`
    UPDATE stress_test_audits SET deleted_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING id
  `;
  return result.length > 0;
}

export async function countStressByCompany(companyId: string): Promise<number> {
  if (!sql) return 0;
  await initDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS n FROM stress_test_audits
    WHERE company_id = ${companyId} AND deleted_at IS NULL
  `;
  return (rows[0] as unknown as { n: number }).n ?? 0;
}
