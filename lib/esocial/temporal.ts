/**
 * Camada temporal eSocial (Briefing v3 seção 7).
 *
 * Funções de:
 *  - persistir vínculos temporais (exposure_timeline, medical_events, leave_intervals, cat_events)
 *  - fechar vigência ao receber nova exposição
 *  - get_active_exposures(worker_key_hash, date)
 *  - cruzamentos temporais (S-2240×S-2220 por vigência, S-2210×S-2230 com janela)
 */

import { sql, initDb } from "../db";

// ============================================================
// Tipos
// ============================================================

export interface ExposureRow {
  id: string;
  worker_key_hash: string;
  cod_ag_noc: string | null;
  descr_agente: string | null;
  start_date: string;
  end_date: string | null;
  source_event_id: string | null;
  receipt: string | null;
  layout_version: string | null;
}

export interface MedicalEventRow {
  id: string;
  worker_key_hash: string;
  aso_date: string;
  tp_exame_ocup: string | null;
  source_event_id: string | null;
  receipt: string | null;
  layout_version: string | null;
}

export interface LeaveRow {
  id: string;
  worker_key_hash: string;
  leave_start: string;
  leave_end: string | null;
  reason_code: string | null;
  cid: string | null;
  is_work_related: boolean;
  source_event_id: string | null;
}

export interface CatRow {
  id: string;
  worker_key_hash: string;
  accident_date: string;
  cat_type: string | null;
  cid: string | null;
  source_event_id: string | null;
}

// ============================================================
// Persistência (inserts)
// ============================================================

export async function insertExposure(input: {
  uploadId: string;
  companyId: string;
  workerKeyHash: string;
  codAgNoc?: string | null;
  descrAgente?: string | null;
  startDate: string;
  endDate?: string | null;
  sourceEventId?: string | null;
  receipt?: string | null;
  layoutVersion?: string | null;
  raw?: unknown;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();

  // Construção de vigência: fecha exposições anteriores do mesmo worker × agente
  // que ainda estavam abertas (end_date IS NULL) ou abertas depois do start novo
  await sql`
    UPDATE esocial_exposure_timeline
    SET end_date = (${input.startDate}::date - INTERVAL '1 day')::date
    WHERE worker_key_hash = ${input.workerKeyHash}
      AND COALESCE(cod_ag_noc, '') = ${input.codAgNoc ?? ""}
      AND (end_date IS NULL OR end_date >= ${input.startDate}::date)
      AND start_date < ${input.startDate}::date
  `;

  await sql`
    INSERT INTO esocial_exposure_timeline (
      id, upload_id, company_id, worker_key_hash, cod_ag_noc, descr_agente,
      start_date, end_date, source_event_id, receipt, layout_version, raw
    ) VALUES (
      ${id}, ${input.uploadId}, ${input.companyId}, ${input.workerKeyHash},
      ${input.codAgNoc ?? null}, ${input.descrAgente ?? null},
      ${input.startDate}, ${input.endDate ?? null},
      ${input.sourceEventId ?? null}, ${input.receipt ?? null}, ${input.layoutVersion ?? null},
      ${input.raw ? JSON.stringify(input.raw) : null}::jsonb
    )
  `;
  return id;
}

export async function insertMedicalEvent(input: {
  uploadId: string;
  companyId: string;
  workerKeyHash: string;
  asoDate: string;
  tpExameOcup?: string | null;
  exams?: Array<{ raw: string; normalized?: string }>;
  sourceEventId?: string | null;
  receipt?: string | null;
  layoutVersion?: string | null;
  raw?: unknown;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO esocial_medical_events (
      id, upload_id, company_id, worker_key_hash, aso_date, tp_exame_ocup,
      source_event_id, receipt, layout_version, raw
    ) VALUES (
      ${id}, ${input.uploadId}, ${input.companyId}, ${input.workerKeyHash},
      ${input.asoDate}, ${input.tpExameOcup ?? null},
      ${input.sourceEventId ?? null}, ${input.receipt ?? null}, ${input.layoutVersion ?? null},
      ${input.raw ? JSON.stringify(input.raw) : null}::jsonb
    )
  `;
  if (input.exams) {
    for (const e of input.exams) {
      await sql`
        INSERT INTO esocial_medical_exams (id, medical_event_id, exam_code_raw, exam_code_normalized)
        VALUES (${crypto.randomUUID()}, ${id}, ${e.raw}, ${e.normalized ?? null})
      `;
    }
  }
  return id;
}

export async function insertLeave(input: {
  uploadId: string;
  companyId: string;
  workerKeyHash: string;
  leaveStart: string;
  leaveEnd?: string | null;
  reasonCode?: string | null;
  cid?: string | null;
  isWorkRelated?: boolean;
  sourceEventId?: string | null;
  receipt?: string | null;
  layoutVersion?: string | null;
  raw?: unknown;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO esocial_leave_intervals (
      id, upload_id, company_id, worker_key_hash,
      leave_start, leave_end, reason_code, cid, is_work_related,
      source_event_id, receipt, layout_version, raw
    ) VALUES (
      ${id}, ${input.uploadId}, ${input.companyId}, ${input.workerKeyHash},
      ${input.leaveStart}, ${input.leaveEnd ?? null}, ${input.reasonCode ?? null},
      ${input.cid ?? null}, ${input.isWorkRelated ?? false},
      ${input.sourceEventId ?? null}, ${input.receipt ?? null}, ${input.layoutVersion ?? null},
      ${input.raw ? JSON.stringify(input.raw) : null}::jsonb
    )
  `;
  return id;
}

export async function insertCat(input: {
  uploadId: string;
  companyId: string;
  workerKeyHash: string;
  accidentDate: string;
  catType?: string | null;
  cid?: string | null;
  sourceEventId?: string | null;
  receipt?: string | null;
  layoutVersion?: string | null;
  raw?: unknown;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO esocial_cat_events (
      id, upload_id, company_id, worker_key_hash, accident_date, cat_type, cid,
      source_event_id, receipt, layout_version, raw
    ) VALUES (
      ${id}, ${input.uploadId}, ${input.companyId}, ${input.workerKeyHash},
      ${input.accidentDate}, ${input.catType ?? null}, ${input.cid ?? null},
      ${input.sourceEventId ?? null}, ${input.receipt ?? null}, ${input.layoutVersion ?? null},
      ${input.raw ? JSON.stringify(input.raw) : null}::jsonb
    )
  `;
  return id;
}

// ============================================================
// Queries — get_active_exposures
// ============================================================

/**
 * Retorna exposições vigentes no worker numa data específica.
 *
 *   get_active_exposures(worker_key_hash, date):
 *     where start_date <= date AND (end_date IS NULL OR end_date >= date)
 */
export async function getActiveExposures(
  workerKeyHash: string,
  date: string
): Promise<ExposureRow[]> {
  if (!sql) return [];
  const rows = await sql`
    SELECT id, worker_key_hash, cod_ag_noc, descr_agente,
           to_char(start_date,'YYYY-MM-DD') AS start_date,
           to_char(end_date,'YYYY-MM-DD') AS end_date,
           source_event_id, receipt, layout_version
    FROM esocial_exposure_timeline
    WHERE worker_key_hash = ${workerKeyHash}
      AND start_date <= ${date}::date
      AND (end_date IS NULL OR end_date >= ${date}::date)
  `;
  return rows as unknown as ExposureRow[];
}

// ============================================================
// Cruzamentos temporais
// ============================================================

export interface CrossMatch {
  workerKeyHash: string;
  asoId?: string;
  asoDate?: string;
  exposureIds: string[];
  catId?: string;
  catDate?: string;
  leaveId?: string;
  leaveStart?: string;
}

/**
 * S-2240 × S-2220: para cada ASO (medical_event), busca exposições vigentes
 * na aso_date. Identifica:
 *   - workers com exposição mas SEM ASO (MISSING_MONITORING)
 *   - workers com ASO mas SEM exposição vigente (POTENTIAL_OVERTESTING)
 */
export async function crossExposureVsAso(uploadId: string): Promise<{
  missingMonitoring: Array<{ workerKeyHash: string; exposureIds: string[]; period: { start: string; end: string | null } }>;
  potentialOvertesting: Array<{ workerKeyHash: string; asoId: string; asoDate: string }>;
}> {
  if (!sql) return { missingMonitoring: [], potentialOvertesting: [] };

  // Workers com exposição neste upload
  const exposures = (await sql`
    SELECT id, worker_key_hash,
           to_char(start_date,'YYYY-MM-DD') AS start_date,
           to_char(end_date,'YYYY-MM-DD') AS end_date,
           cod_ag_noc
    FROM esocial_exposure_timeline WHERE upload_id = ${uploadId}
  `) as unknown as Array<{ id: string; worker_key_hash: string; start_date: string; end_date: string | null; cod_ag_noc: string | null }>;

  // ASOs deste upload + empresa
  const asos = (await sql`
    SELECT id, worker_key_hash,
           to_char(aso_date,'YYYY-MM-DD') AS aso_date
    FROM esocial_medical_events WHERE upload_id = ${uploadId}
  `) as unknown as Array<{ id: string; worker_key_hash: string; aso_date: string }>;

  // Index exposições por worker
  const expByWorker: Record<string, typeof exposures> = {};
  for (const e of exposures) {
    (expByWorker[e.worker_key_hash] ??= []).push(e);
  }
  const asoByWorker: Record<string, typeof asos> = {};
  for (const a of asos) {
    (asoByWorker[a.worker_key_hash] ??= []).push(a);
  }

  // MISSING_MONITORING: tem exposição vigente que não foi coberta por ASO dentro de 12 meses após start
  const missingMonitoring: Array<{ workerKeyHash: string; exposureIds: string[]; period: { start: string; end: string | null } }> = [];
  for (const [worker, exps] of Object.entries(expByWorker)) {
    const asosOfWorker = asoByWorker[worker] ?? [];
    for (const exp of exps) {
      const expStart = new Date(exp.start_date);
      const expEnd = exp.end_date ? new Date(exp.end_date) : null;
      const hasASO = asosOfWorker.some((a) => {
        const d = new Date(a.aso_date);
        // ASO deve estar dentro da vigência da exposição
        return d >= expStart && (!expEnd || d <= expEnd);
      });
      if (!hasASO) {
        missingMonitoring.push({
          workerKeyHash: worker,
          exposureIds: [exp.id],
          period: { start: exp.start_date, end: exp.end_date },
        });
      }
    }
  }

  // POTENTIAL_OVERTESTING: ASO em data sem nenhuma exposição vigente
  const potentialOvertesting: Array<{ workerKeyHash: string; asoId: string; asoDate: string }> = [];
  for (const aso of asos) {
    const expsOfWorker = expByWorker[aso.worker_key_hash] ?? [];
    const asoDate = new Date(aso.aso_date);
    const hasExp = expsOfWorker.some((e) => {
      const s = new Date(e.start_date);
      const en = e.end_date ? new Date(e.end_date) : null;
      return asoDate >= s && (!en || asoDate <= en);
    });
    if (!hasExp) potentialOvertesting.push({ workerKeyHash: aso.worker_key_hash, asoId: aso.id, asoDate: aso.aso_date });
  }

  return { missingMonitoring, potentialOvertesting };
}

/**
 * S-2210 × S-2230: para cada afastamento work-related, procura CAT em janela
 * [leave_start - 1, leave_start + 7].
 */
export async function crossLeaveVsCat(uploadId: string): Promise<{
  catMissing: Array<{ workerKeyHash: string; leaveId: string; leaveStart: string }>;
}> {
  if (!sql) return { catMissing: [] };

  const leaves = (await sql`
    SELECT id, worker_key_hash,
           to_char(leave_start,'YYYY-MM-DD') AS leave_start,
           is_work_related, cid
    FROM esocial_leave_intervals
    WHERE upload_id = ${uploadId} AND is_work_related = TRUE
  `) as unknown as Array<{ id: string; worker_key_hash: string; leave_start: string; is_work_related: boolean; cid: string | null }>;

  const cats = (await sql`
    SELECT id, worker_key_hash,
           to_char(accident_date,'YYYY-MM-DD') AS accident_date
    FROM esocial_cat_events WHERE upload_id = ${uploadId}
  `) as unknown as Array<{ id: string; worker_key_hash: string; accident_date: string }>;

  const catByWorker: Record<string, typeof cats> = {};
  for (const c of cats) (catByWorker[c.worker_key_hash] ??= []).push(c);

  const catMissing: Array<{ workerKeyHash: string; leaveId: string; leaveStart: string }> = [];
  for (const l of leaves) {
    const lStart = new Date(l.leave_start);
    const winStart = new Date(lStart); winStart.setDate(winStart.getDate() - 1);
    const winEnd = new Date(lStart); winEnd.setDate(winEnd.getDate() + 7);
    const has = (catByWorker[l.worker_key_hash] ?? []).some((c) => {
      const d = new Date(c.accident_date);
      return d >= winStart && d <= winEnd;
    });
    if (!has) catMissing.push({ workerKeyHash: l.worker_key_hash, leaveId: l.id, leaveStart: l.leave_start });
  }

  return { catMissing };
}

// ============================================================
// Worker timeline (drill-down) — agrega todos os eventos de um worker
// ============================================================

export interface WorkerTimeline {
  workerKeyHash: string;
  exposures: ExposureRow[];
  asos: MedicalEventRow[];
  leaves: LeaveRow[];
  cats: CatRow[];
}

export async function getWorkerTimeline(
  companyId: string,
  workerKeyHash: string
): Promise<WorkerTimeline> {
  if (!sql) {
    return { workerKeyHash, exposures: [], asos: [], leaves: [], cats: [] };
  }

  const [exposures, asos, leaves, cats] = await Promise.all([
    sql`
      SELECT id, worker_key_hash, cod_ag_noc, descr_agente,
             to_char(start_date,'YYYY-MM-DD') AS start_date,
             to_char(end_date,'YYYY-MM-DD') AS end_date,
             source_event_id, receipt, layout_version
      FROM esocial_exposure_timeline
      WHERE company_id = ${companyId} AND worker_key_hash = ${workerKeyHash}
      ORDER BY start_date DESC
    `,
    sql`
      SELECT id, worker_key_hash,
             to_char(aso_date,'YYYY-MM-DD') AS aso_date,
             tp_exame_ocup, source_event_id, receipt, layout_version
      FROM esocial_medical_events
      WHERE company_id = ${companyId} AND worker_key_hash = ${workerKeyHash}
      ORDER BY aso_date DESC
    `,
    sql`
      SELECT id, worker_key_hash,
             to_char(leave_start,'YYYY-MM-DD') AS leave_start,
             to_char(leave_end,'YYYY-MM-DD') AS leave_end,
             reason_code, cid, is_work_related, source_event_id
      FROM esocial_leave_intervals
      WHERE company_id = ${companyId} AND worker_key_hash = ${workerKeyHash}
      ORDER BY leave_start DESC
    `,
    sql`
      SELECT id, worker_key_hash,
             to_char(accident_date,'YYYY-MM-DD') AS accident_date,
             cat_type, cid, source_event_id
      FROM esocial_cat_events
      WHERE company_id = ${companyId} AND worker_key_hash = ${workerKeyHash}
      ORDER BY accident_date DESC
    `,
  ]);

  return {
    workerKeyHash,
    exposures: exposures as unknown as ExposureRow[],
    asos: asos as unknown as MedicalEventRow[],
    leaves: leaves as unknown as LeaveRow[],
    cats: cats as unknown as CatRow[],
  };
}
