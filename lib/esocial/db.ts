import { sql, initDb } from "../db";

export interface ESocialUpload {
  id: string;
  company_id: string;
  filename: string;
  size_bytes: number;
  status: "pending" | "processing" | "done" | "error";
  events_count: number;
  alerts_count: number;
  meta: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  created_by: string | null;
}

export type AlertKind =
  | "exposure_without_aso"
  | "aso_without_exposure"
  | "cat_without_leave"
  | "leave_without_cat"
  | "linach_carcinogen"
  | "special_retirement"
  | "noise_method_gap"
  | "mental_health_pattern"
  | "other";

export type AlertSeverity = "info" | "warn" | "critical";

export interface ESocialAlert {
  id: string;
  upload_id: string;
  company_id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  worker_key_hash: string | null;
  title: string;
  description: string;
  evidence: Record<string, unknown> | null;
  custo_faixa: string | null;
  resolved: boolean;
  created_at: string;
}

export async function createUpload(input: {
  companyId: string;
  filename: string;
  sizeBytes: number;
  createdBy?: string | null;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO esocial_uploads (id, company_id, filename, size_bytes, created_by)
    VALUES (${id}, ${input.companyId}, ${input.filename}, ${input.sizeBytes}, ${input.createdBy ?? null})
  `;
  return id;
}

export async function finishUpload(
  id: string,
  result: { eventsCount: number; alertsCount: number; meta?: Record<string, unknown>; error?: string | null }
): Promise<void> {
  if (!sql) return;
  const status = result.error ? "error" : "done";
  await sql`
    UPDATE esocial_uploads
    SET status = ${status},
        events_count = ${result.eventsCount},
        alerts_count = ${result.alertsCount},
        meta = ${result.meta ? JSON.stringify(result.meta) : null}::jsonb,
        error = ${result.error ?? null}
    WHERE id = ${id}
  `;
}

export async function listUploads(companyId?: string): Promise<ESocialUpload[]> {
  if (!sql) return [];
  await initDb();
  const rows = companyId
    ? await sql`
        SELECT id, company_id, filename, size_bytes, status, events_count, alerts_count, meta, error,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at, created_by
        FROM esocial_uploads WHERE company_id = ${companyId}
        ORDER BY created_at DESC LIMIT 200
      `
    : await sql`
        SELECT id, company_id, filename, size_bytes, status, events_count, alerts_count, meta, error,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at, created_by
        FROM esocial_uploads
        ORDER BY created_at DESC LIMIT 500
      `;
  return rows as unknown as ESocialUpload[];
}

export async function getUpload(id: string): Promise<ESocialUpload | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, company_id, filename, size_bytes, status, events_count, alerts_count, meta, error,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at, created_by
    FROM esocial_uploads WHERE id = ${id} LIMIT 1
  `;
  return (rows[0] as unknown as ESocialUpload) ?? null;
}

export async function insertAlert(input: {
  uploadId: string;
  companyId: string;
  kind: AlertKind;
  severity: AlertSeverity;
  workerKeyHash?: string | null;
  title: string;
  description: string;
  evidence?: Record<string, unknown> | null;
  custoFaixa?: string | null;
}): Promise<void> {
  if (!sql) return;
  await sql`
    INSERT INTO esocial_alerts (id, upload_id, company_id, kind, severity, worker_key_hash, title, description, evidence, custo_faixa)
    VALUES (
      ${crypto.randomUUID()}, ${input.uploadId}, ${input.companyId},
      ${input.kind}, ${input.severity}, ${input.workerKeyHash ?? null},
      ${input.title}, ${input.description},
      ${input.evidence ? JSON.stringify(input.evidence) : null}::jsonb,
      ${input.custoFaixa ?? null}
    )
  `;
}

export async function listAlerts(filter: {
  companyId?: string;
  uploadId?: string;
  severity?: AlertSeverity;
  resolved?: boolean;
}): Promise<ESocialAlert[]> {
  if (!sql) return [];
  await initDb();
  // Build dynamic-ish: usar caminhos discretos
  if (filter.uploadId) {
    const rows = await sql`
      SELECT id, upload_id, company_id, kind, severity, worker_key_hash, title, description, evidence, custo_faixa, resolved,
             to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM esocial_alerts WHERE upload_id = ${filter.uploadId}
      ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warn' THEN 1 ELSE 2 END, created_at DESC
    `;
    return rows as unknown as ESocialAlert[];
  }
  if (filter.companyId) {
    const rows = await sql`
      SELECT id, upload_id, company_id, kind, severity, worker_key_hash, title, description, evidence, custo_faixa, resolved,
             to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM esocial_alerts WHERE company_id = ${filter.companyId}
      ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warn' THEN 1 ELSE 2 END, created_at DESC LIMIT 500
    `;
    return rows as unknown as ESocialAlert[];
  }
  const rows = await sql`
    SELECT id, upload_id, company_id, kind, severity, worker_key_hash, title, description, evidence, custo_faixa, resolved,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
    FROM esocial_alerts ORDER BY severity DESC, created_at DESC LIMIT 500
  `;
  return rows as unknown as ESocialAlert[];
}

export async function countAlertsByCompany(companyId: string): Promise<{ total: number; critical: number }> {
  if (!sql) return { total: 0, critical: 0 };
  await initDb();
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE severity = 'critical')::int AS critical
    FROM esocial_alerts
    WHERE company_id = ${companyId} AND resolved = FALSE
  `;
  return rows[0] as unknown as { total: number; critical: number };
}
