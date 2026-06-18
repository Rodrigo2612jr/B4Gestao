import { sql, initDb } from "../db";
import type { AdminRole } from "../db";
import type { ChecklistAnswers } from "./checklist";
import { calcRiskLevel, type AepStatus } from "./scoring";

// ============================================================
// TIPOS
// ============================================================

export interface AepAssessment {
  id: string;
  company_id: string;
  title: string;
  unidade: string | null;
  data_avaliacao: string | null;
  avaliador_user_id: string | null;
  supervisor_user_id: string | null;
  avaliador_cargo: string | null;
  norma_base: string;
  checklist: ChecklistAnswers;
  status: AepStatus;
  rejection_reason: string | null;
  tecnico_seen_at: string | null;
  supervisor_seen_at: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  created_by: string | null;
}

export interface AepSector {
  id: string;
  assessment_id: string;
  nome: string;
  ordem: number;
}

export interface AepFunction {
  id: string;
  assessment_id: string;
  sector_id: string;
  ghe: string | null;
  funcao_paradigma: string;
  posto_trabalho: string | null;
  descricao_ambiente: string | null;
  descricao_atividade: string | null;
  modo_operatorio: string | null;
  mobiliario_equipamentos: string | null;
  conforto_acustico: string | null;
  temperatura: string | null;
  iluminacao: string | null;
  checklist: ChecklistAnswers;
  ordem: number;
  photos: AepPhoto[];
  risks: AepRiskItem[];
}

export interface AepPhoto {
  id: string;
  function_id: string;
  url: string;
  pathname: string | null;
  caption: string | null;
  ordem: number;
  size_bytes: number | null;
}

export interface AepRiskItem {
  id: string;
  assessment_id: string;
  function_id: string | null;
  tipo: string;
  fator_risco: string | null;
  fonte_geradora: string | null;
  possiveis_danos: string | null;
  controles_existentes: string | null;
  p: number | null;
  s: number | null;
  n: number | null;
  ordem: number;
}

export interface AepChatMessage {
  id: string;
  assessment_id: string;
  author_user_id: string | null;
  author_email: string | null;
  author_name: string | null;
  author_role: string | null;
  body: string;
  kind: string;
  created_at: string;
}

export interface AepSectorWithFunctions extends AepSector {
  functions: AepFunction[];
}

export interface AepFull extends AepAssessment {
  company_name: string | null;
  company_cnpj: string | null;
  avaliador_name: string | null;
  supervisor_name: string | null;
  sectors: AepSectorWithFunctions[];
}

export interface AepListItem {
  id: string;
  company_id: string;
  company_name: string | null;
  title: string;
  status: AepStatus;
  avaliador_user_id: string | null;
  avaliador_name: string | null;
  supervisor_user_id: string | null;
  supervisor_name: string | null;
  updated_at: string;
  created_at: string;
}

// ============================================================
// ASSESSMENTS
// ============================================================

export async function createAssessment(input: {
  companyId: string;
  title: string;
  unidade?: string | null;
  dataAvaliacao?: string | null;
  avaliadorUserId?: string | null;
  supervisorUserId?: string | null;
  avaliadorCargo?: string | null;
  createdBy?: string | null;
}): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO aep_assessments (
      id, company_id, title, unidade, data_avaliacao,
      avaliador_user_id, supervisor_user_id, avaliador_cargo, created_by
    ) VALUES (
      ${id}, ${input.companyId}, ${input.title}, ${input.unidade ?? null}, ${input.dataAvaliacao ?? null},
      ${input.avaliadorUserId ?? null}, ${input.supervisorUserId ?? null}, ${input.avaliadorCargo ?? null}, ${input.createdBy ?? null}
    )
  `;
  return id;
}

export async function getAssessment(id: string): Promise<AepAssessment | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, company_id, title, unidade,
           to_char(data_avaliacao, 'YYYY-MM-DD') AS data_avaliacao,
           avaliador_user_id, supervisor_user_id, avaliador_cargo, norma_base,
           checklist, status, rejection_reason,
           to_char(tecnico_seen_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS tecnico_seen_at,
           to_char(supervisor_seen_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS supervisor_seen_at,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           to_char(submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS submitted_at,
           to_char(approved_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS approved_at,
           created_by
    FROM aep_assessments
    WHERE id = ${id} AND deleted_at IS NULL
    LIMIT 1
  `;
  return (rows[0] as unknown as AepAssessment) ?? null;
}

/** Acesso leve para autorização nas rotas (sem montar tudo). */
export async function getAssessmentAccess(
  id: string
): Promise<{ id: string; status: AepStatus; avaliador_user_id: string | null; supervisor_user_id: string | null } | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, status, avaliador_user_id, supervisor_user_id
    FROM aep_assessments WHERE id = ${id} AND deleted_at IS NULL LIMIT 1
  `;
  return (rows[0] as unknown as { id: string; status: AepStatus; avaliador_user_id: string | null; supervisor_user_id: string | null }) ?? null;
}

export async function getAssessmentFull(id: string): Promise<AepFull | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT a.id, a.company_id, a.title, a.unidade,
           to_char(a.data_avaliacao, 'YYYY-MM-DD') AS data_avaliacao,
           a.avaliador_user_id, a.supervisor_user_id, a.avaliador_cargo, a.norma_base,
           a.checklist, a.status, a.rejection_reason,
           to_char(a.tecnico_seen_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS tecnico_seen_at,
           to_char(a.supervisor_seen_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS supervisor_seen_at,
           to_char(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(a.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           to_char(a.submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS submitted_at,
           to_char(a.approved_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS approved_at,
           a.created_by,
           c.name AS company_name, c.cnpj AS company_cnpj,
           av.name AS avaliador_name, sup.name AS supervisor_name
    FROM aep_assessments a
    LEFT JOIN companies c ON c.id = a.company_id
    LEFT JOIN admin_users av ON av.id = a.avaliador_user_id
    LEFT JOIN admin_users sup ON sup.id = a.supervisor_user_id
    WHERE a.id = ${id} AND a.deleted_at IS NULL
    LIMIT 1
  `;
  const head = rows[0] as unknown as AepFull | undefined;
  if (!head) return null;

  const sectors = (await sql`
    SELECT id, assessment_id, nome, ordem FROM aep_sectors
    WHERE assessment_id = ${id} ORDER BY ordem ASC, created_at ASC
  `) as unknown as AepSector[];

  const functions = (await sql`
    SELECT id, assessment_id, sector_id, ghe, funcao_paradigma, posto_trabalho,
           descricao_ambiente, descricao_atividade, modo_operatorio,
           mobiliario_equipamentos, conforto_acustico, temperatura, iluminacao, checklist, ordem
    FROM aep_functions WHERE assessment_id = ${id} ORDER BY ordem ASC, created_at ASC
  `) as unknown as AepFunction[];

  const photos = (await sql`
    SELECT id, function_id, url, pathname, caption, ordem, size_bytes
    FROM aep_photos WHERE assessment_id = ${id} ORDER BY ordem ASC, created_at ASC
  `) as unknown as AepPhoto[];

  const risks = (await sql`
    SELECT id, assessment_id, function_id, tipo, fator_risco, fonte_geradora,
           possiveis_danos, controles_existentes, p, s, n, ordem
    FROM aep_risk_items WHERE assessment_id = ${id} ORDER BY ordem ASC, created_at ASC
  `) as unknown as AepRiskItem[];

  const photosByFn = new Map<string, AepPhoto[]>();
  for (const p of photos) {
    if (!photosByFn.has(p.function_id)) photosByFn.set(p.function_id, []);
    photosByFn.get(p.function_id)!.push(p);
  }
  const risksByFn = new Map<string, AepRiskItem[]>();
  for (const r of risks) {
    const key = r.function_id ?? "";
    if (!risksByFn.has(key)) risksByFn.set(key, []);
    risksByFn.get(key)!.push(r);
  }
  for (const fn of functions) {
    fn.photos = photosByFn.get(fn.id) ?? [];
    fn.risks = risksByFn.get(fn.id) ?? [];
  }

  const fnBySector = new Map<string, AepFunction[]>();
  for (const fn of functions) {
    if (!fnBySector.has(fn.sector_id)) fnBySector.set(fn.sector_id, []);
    fnBySector.get(fn.sector_id)!.push(fn);
  }
  head.sectors = sectors.map((s) => ({ ...s, functions: fnBySector.get(s.id) ?? [] }));
  return head;
}

export async function listAssessments(scope: {
  role?: AdminRole;
  userId?: string | null;
  companyId?: string | null;
}): Promise<AepListItem[]> {
  if (!sql) return [];
  await initDb();
  const role = scope.role;
  const seesAll = role === "ADMIN" || role === "SST";

  const uid = scope.userId ?? "";
  let rows;
  if (scope.companyId && seesAll) {
    rows = await sql`
      SELECT a.id, a.company_id, c.name AS company_name, a.title, a.status,
             a.avaliador_user_id, av.name AS avaliador_name,
             a.supervisor_user_id, sup.name AS supervisor_name,
             to_char(a.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
             to_char(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM aep_assessments a
      LEFT JOIN companies c ON c.id = a.company_id
      LEFT JOIN admin_users av ON av.id = a.avaliador_user_id
      LEFT JOIN admin_users sup ON sup.id = a.supervisor_user_id
      WHERE a.deleted_at IS NULL AND a.company_id = ${scope.companyId}
      ORDER BY a.updated_at DESC LIMIT 500
    `;
  } else if (scope.companyId) {
    // técnico/supervisor: só as próprias avaliações DENTRO da empresa (não vê as de colegas)
    rows = await sql`
      SELECT a.id, a.company_id, c.name AS company_name, a.title, a.status,
             a.avaliador_user_id, av.name AS avaliador_name,
             a.supervisor_user_id, sup.name AS supervisor_name,
             to_char(a.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
             to_char(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM aep_assessments a
      LEFT JOIN companies c ON c.id = a.company_id
      LEFT JOIN admin_users av ON av.id = a.avaliador_user_id
      LEFT JOIN admin_users sup ON sup.id = a.supervisor_user_id
      WHERE a.deleted_at IS NULL AND a.company_id = ${scope.companyId}
        AND (a.avaliador_user_id = ${uid} OR a.supervisor_user_id = ${uid})
      ORDER BY a.updated_at DESC LIMIT 500
    `;
  } else if (seesAll) {
    rows = await sql`
      SELECT a.id, a.company_id, c.name AS company_name, a.title, a.status,
             a.avaliador_user_id, av.name AS avaliador_name,
             a.supervisor_user_id, sup.name AS supervisor_name,
             to_char(a.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
             to_char(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM aep_assessments a
      LEFT JOIN companies c ON c.id = a.company_id
      LEFT JOIN admin_users av ON av.id = a.avaliador_user_id
      LEFT JOIN admin_users sup ON sup.id = a.supervisor_user_id
      WHERE a.deleted_at IS NULL
      ORDER BY a.updated_at DESC LIMIT 500
    `;
  } else {
    rows = await sql`
      SELECT a.id, a.company_id, c.name AS company_name, a.title, a.status,
             a.avaliador_user_id, av.name AS avaliador_name,
             a.supervisor_user_id, sup.name AS supervisor_name,
             to_char(a.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
             to_char(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM aep_assessments a
      LEFT JOIN companies c ON c.id = a.company_id
      LEFT JOIN admin_users av ON av.id = a.avaliador_user_id
      LEFT JOIN admin_users sup ON sup.id = a.supervisor_user_id
      WHERE a.deleted_at IS NULL AND (a.avaliador_user_id = ${uid} OR a.supervisor_user_id = ${uid})
      ORDER BY a.updated_at DESC LIMIT 500
    `;
  }
  return rows as unknown as AepListItem[];
}

export async function updateAssessmentHeader(
  id: string,
  fields: {
    title?: string;
    unidade?: string | null;
    dataAvaliacao?: string | null;
    avaliadorCargo?: string | null;
    supervisorUserId?: string | null;
  }
): Promise<void> {
  if (!sql) throw new Error("DB not configured");
  await sql`
    UPDATE aep_assessments SET
      title = COALESCE(${fields.title ?? null}, title),
      unidade = COALESCE(${fields.unidade ?? null}, unidade),
      data_avaliacao = COALESCE(${fields.dataAvaliacao ?? null}, data_avaliacao),
      avaliador_cargo = COALESCE(${fields.avaliadorCargo ?? null}, avaliador_cargo),
      supervisor_user_id = COALESCE(${fields.supervisorUserId ?? null}, supervisor_user_id),
      updated_at = NOW(),
      status = CASE WHEN status = 'rascunho' THEN 'em_preenchimento' ELSE status END
    WHERE id = ${id} AND deleted_at IS NULL
  `;
}

export async function updateChecklist(id: string, checklist: ChecklistAnswers): Promise<void> {
  if (!sql) throw new Error("DB not configured");
  await sql`
    UPDATE aep_assessments
    SET checklist = ${JSON.stringify(checklist)}::jsonb, updated_at = NOW(),
        status = CASE WHEN status = 'rascunho' THEN 'em_preenchimento' ELSE status END
    WHERE id = ${id} AND deleted_at IS NULL
  `;
}

export async function softDeleteAssessment(id: string): Promise<boolean> {
  if (!sql) return false;
  const r = await sql`UPDATE aep_assessments SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING id`;
  return r.length > 0;
}

/** Marca presença (heartbeat) do técnico ou supervisor. */
export async function touchPresence(
  id: string,
  who: "tecnico" | "supervisor",
  cursor?: { step: string; fn: string | null; sub: string | null; focus: string | null } | null
): Promise<void> {
  if (!sql) return;
  if (who === "tecnico") {
    const cur = cursor ? JSON.stringify(cursor) : null;
    // COALESCE: heartbeat sem cursor nao apaga o ultimo cursor conhecido
    await sql`UPDATE aep_assessments
              SET tecnico_seen_at = NOW(),
                  tecnico_cursor = COALESCE(${cur}::jsonb, tecnico_cursor)
              WHERE id = ${id}`;
  } else {
    await sql`UPDATE aep_assessments SET supervisor_seen_at = NOW() WHERE id = ${id}`;
  }
}

export interface AepState {
  status: AepStatus;
  updated_at: string;
  rejection_reason: string | null;
  tecnico_seen_at: string | null;
  supervisor_seen_at: string | null;
  tecnico_cursor: { step: string; fn: string | null; sub: string | null; focus: string | null } | null;
  last_chat_id: string | null;
  last_chat_at: string | null;
  chat_count: number;
}

export async function getState(id: string): Promise<AepState | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT a.status, a.rejection_reason,
           to_char(a.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           to_char(a.tecnico_seen_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS tecnico_seen_at,
           to_char(a.supervisor_seen_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS supervisor_seen_at,
           a.tecnico_cursor,
           (SELECT id::text FROM aep_chat_messages WHERE assessment_id = a.id ORDER BY created_at DESC LIMIT 1) AS last_chat_id,
           (SELECT to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') FROM aep_chat_messages WHERE assessment_id = a.id ORDER BY created_at DESC LIMIT 1) AS last_chat_at,
           (SELECT COUNT(*)::int FROM aep_chat_messages WHERE assessment_id = a.id) AS chat_count
    FROM aep_assessments a
    WHERE a.id = ${id} AND a.deleted_at IS NULL LIMIT 1
  `;
  return (rows[0] as unknown as AepState) ?? null;
}

// ============================================================
// TRANSIÇÕES DE ESTADO
// ============================================================

async function recordEvent(
  assessmentId: string,
  actor: { id?: string | null; email?: string | null },
  from: AepStatus,
  to: AepStatus,
  note?: string | null
): Promise<void> {
  if (!sql) return;
  await sql`
    INSERT INTO aep_events (id, assessment_id, actor_user_id, actor_email, from_status, to_status, note)
    VALUES (${crypto.randomUUID()}, ${assessmentId}, ${actor.id ?? null}, ${actor.email ?? null}, ${from}, ${to}, ${note ?? null})
  `;
}

/**
 * Transições atômicas: o estado de origem entra na cláusula WHERE, então
 * cliques duplos / requisições concorrentes (TOCTOU) não gravam transição inválida.
 * Retornam `false` quando a avaliação já não está no estado esperado (rota responde 409).
 */
export async function submitAssessment(
  id: string,
  from: AepStatus,
  actor: { id?: string | null; email?: string | null }
): Promise<boolean> {
  if (!sql) throw new Error("DB not configured");
  const r = await sql`
    UPDATE aep_assessments
    SET status = 'aguardando_aprovacao', submitted_at = NOW(), updated_at = NOW(), rejection_reason = NULL
    WHERE id = ${id} AND deleted_at IS NULL
      AND status IN ('rascunho', 'em_preenchimento', 'reprovado')
    RETURNING id
  `;
  if (r.length === 0) return false;
  await recordEvent(id, actor, from, "aguardando_aprovacao");
  return true;
}

export async function approveAssessment(
  id: string,
  actor: { id?: string | null; email?: string | null }
): Promise<boolean> {
  if (!sql) throw new Error("DB not configured");
  const r = await sql`
    UPDATE aep_assessments
    SET status = 'aprovado', approved_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL AND status = 'aguardando_aprovacao'
    RETURNING id
  `;
  if (r.length === 0) return false;
  await recordEvent(id, actor, "aguardando_aprovacao", "aprovado");
  return true;
}

export async function rejectAssessment(
  id: string,
  reason: string,
  actor: { id?: string | null; email?: string | null }
): Promise<boolean> {
  if (!sql) throw new Error("DB not configured");
  const r = await sql`
    UPDATE aep_assessments
    SET status = 'reprovado', rejection_reason = ${reason}, updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL AND status = 'aguardando_aprovacao'
    RETURNING id
  `;
  if (r.length === 0) return false;
  await recordEvent(id, actor, "aguardando_aprovacao", "reprovado", reason);
  return true;
}

// ============================================================
// SETORES
// ============================================================

export async function addSector(assessmentId: string, nome: string): Promise<AepSector> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO aep_sectors (id, assessment_id, company_id, nome, ordem)
    VALUES (${id}, ${assessmentId},
      (SELECT company_id FROM aep_assessments WHERE id = ${assessmentId}), ${nome},
      (SELECT COALESCE(MAX(ordem), -1) + 1 FROM aep_sectors WHERE assessment_id = ${assessmentId}))
    RETURNING id, assessment_id, nome, ordem
  `;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = ${assessmentId}`;
  return rows[0] as unknown as AepSector;
}

export async function assessmentIdOfSector(sectorId: string): Promise<string | null> {
  if (!sql) return null;
  const rows = await sql`SELECT assessment_id FROM aep_sectors WHERE id = ${sectorId} LIMIT 1`;
  return (rows[0] as unknown as { assessment_id: string } | undefined)?.assessment_id ?? null;
}

export async function updateSector(sectorId: string, nome: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE aep_sectors SET nome = ${nome} WHERE id = ${sectorId}`;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = (SELECT assessment_id FROM aep_sectors WHERE id = ${sectorId})`;
}

export async function deleteSector(sectorId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = (SELECT assessment_id FROM aep_sectors WHERE id = ${sectorId})`;
  await sql`DELETE FROM aep_sectors WHERE id = ${sectorId}`;
}

// ============================================================
// FUNÇÕES
// ============================================================

export interface FunctionFields {
  ghe?: string | null;
  funcaoParadigma?: string;
  postoTrabalho?: string | null;
  descricaoAmbiente?: string | null;
  descricaoAtividade?: string | null;
  modoOperatorio?: string | null;
  mobiliarioEquipamentos?: string | null;
  confortoAcustico?: string | null;
  temperatura?: string | null;
  iluminacao?: string | null;
  checklist?: ChecklistAnswers;
}

export async function addFunction(
  assessmentId: string,
  sectorId: string,
  data: FunctionFields
): Promise<string> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO aep_functions (
      id, assessment_id, sector_id, company_id, ghe, funcao_paradigma, posto_trabalho,
      descricao_ambiente, descricao_atividade, modo_operatorio, mobiliario_equipamentos,
      conforto_acustico, temperatura, iluminacao, ordem
    ) VALUES (
      ${id}, ${assessmentId}, ${sectorId},
      (SELECT company_id FROM aep_assessments WHERE id = ${assessmentId}), ${data.ghe ?? null},
      ${data.funcaoParadigma ?? "Nova função"}, ${data.postoTrabalho ?? null},
      ${data.descricaoAmbiente ?? null}, ${data.descricaoAtividade ?? null}, ${data.modoOperatorio ?? null},
      ${data.mobiliarioEquipamentos ?? null}, ${data.confortoAcustico ?? null}, ${data.temperatura ?? null},
      ${data.iluminacao ?? null},
      (SELECT COALESCE(MAX(ordem), -1) + 1 FROM aep_functions WHERE sector_id = ${sectorId})
    )
  `;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = ${assessmentId}`;
  return id;
}

export async function assessmentIdOfFunction(functionId: string): Promise<string | null> {
  if (!sql) return null;
  const rows = await sql`SELECT assessment_id FROM aep_functions WHERE id = ${functionId} LIMIT 1`;
  return (rows[0] as unknown as { assessment_id: string } | undefined)?.assessment_id ?? null;
}

export async function updateFunction(functionId: string, data: FunctionFields): Promise<void> {
  if (!sql) return;
  const checklistJson = data.checklist !== undefined ? JSON.stringify(data.checklist) : null;
  // COALESCE em tudo: PATCH parcial (ex.: só o checklist) NÃO zera os outros campos.
  // "" (string vazia enviada p/ limpar) não é null, então limpar segue funcionando.
  await sql`
    UPDATE aep_functions SET
      ghe = COALESCE(${data.ghe ?? null}, ghe),
      funcao_paradigma = COALESCE(${data.funcaoParadigma ?? null}, funcao_paradigma),
      posto_trabalho = COALESCE(${data.postoTrabalho ?? null}, posto_trabalho),
      descricao_ambiente = COALESCE(${data.descricaoAmbiente ?? null}, descricao_ambiente),
      descricao_atividade = COALESCE(${data.descricaoAtividade ?? null}, descricao_atividade),
      modo_operatorio = COALESCE(${data.modoOperatorio ?? null}, modo_operatorio),
      mobiliario_equipamentos = COALESCE(${data.mobiliarioEquipamentos ?? null}, mobiliario_equipamentos),
      conforto_acustico = COALESCE(${data.confortoAcustico ?? null}, conforto_acustico),
      temperatura = COALESCE(${data.temperatura ?? null}, temperatura),
      iluminacao = COALESCE(${data.iluminacao ?? null}, iluminacao),
      checklist = COALESCE(${checklistJson}::jsonb, checklist)
    WHERE id = ${functionId}
  `;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = (SELECT assessment_id FROM aep_functions WHERE id = ${functionId})`;
}

export async function deleteFunction(functionId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = (SELECT assessment_id FROM aep_functions WHERE id = ${functionId})`;
  await sql`DELETE FROM aep_functions WHERE id = ${functionId}`;
}

// ============================================================
// FOTOS (Vercel Blob · URL é gerada na rota)
// ============================================================

export async function addPhoto(input: {
  functionId: string;
  assessmentId: string;
  url: string;
  pathname?: string | null;
  caption?: string | null;
  sizeBytes?: number | null;
}): Promise<AepPhoto> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO aep_photos (id, function_id, assessment_id, url, pathname, caption, size_bytes, ordem)
    VALUES (${id}, ${input.functionId}, ${input.assessmentId}, ${input.url}, ${input.pathname ?? null},
      ${input.caption ?? null}, ${input.sizeBytes ?? null},
      (SELECT COALESCE(MAX(ordem), -1) + 1 FROM aep_photos WHERE function_id = ${input.functionId}))
    RETURNING id, function_id, url, pathname, caption, ordem, size_bytes
  `;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = ${input.assessmentId}`;
  return rows[0] as unknown as AepPhoto;
}

export async function countPhotosByFunction(functionId: string): Promise<number> {
  if (!sql) return 0;
  const rows = await sql`SELECT COUNT(*)::int AS n FROM aep_photos WHERE function_id = ${functionId}`;
  return (rows[0] as unknown as { n: number }).n ?? 0;
}

export async function assessmentIdOfPhoto(photoId: string): Promise<string | null> {
  if (!sql) return null;
  const rows = await sql`SELECT assessment_id FROM aep_photos WHERE id = ${photoId} LIMIT 1`;
  return (rows[0] as unknown as { assessment_id: string } | undefined)?.assessment_id ?? null;
}

/** Remove e devolve a foto (pra apagar do Blob na rota). */
export async function deletePhoto(photoId: string): Promise<AepPhoto | null> {
  if (!sql) return null;
  const rows = await sql`
    DELETE FROM aep_photos WHERE id = ${photoId}
    RETURNING id, function_id, url, pathname, caption, ordem, size_bytes
  `;
  return (rows[0] as unknown as AepPhoto) ?? null;
}

// ============================================================
// INVENTÁRIO DE RISCO
// ============================================================

export interface RiskFields {
  tipo?: string;
  fatorRisco?: string | null;
  fonteGeradora?: string | null;
  possiveisDanos?: string | null;
  controlesExistentes?: string | null;
  p?: number | null;
  s?: number | null;
}

export async function addRisk(
  assessmentId: string,
  functionId: string | null,
  data: RiskFields
): Promise<AepRiskItem> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  const n = calcRiskLevel(data.p ?? null, data.s ?? null);
  const rows = await sql`
    INSERT INTO aep_risk_items (
      id, assessment_id, function_id, company_id, tipo, fator_risco, fonte_geradora,
      possiveis_danos, controles_existentes, p, s, n, ordem
    ) VALUES (
      ${id}, ${assessmentId}, ${functionId},
      (SELECT company_id FROM aep_assessments WHERE id = ${assessmentId}), ${data.tipo ?? "ERGONOMICO"},
      ${data.fatorRisco ?? null}, ${data.fonteGeradora ?? null}, ${data.possiveisDanos ?? null},
      ${data.controlesExistentes ?? null}, ${data.p ?? null}, ${data.s ?? null}, ${n},
      (SELECT COALESCE(MAX(ordem), -1) + 1 FROM aep_risk_items WHERE assessment_id = ${assessmentId})
    )
    RETURNING id, assessment_id, function_id, tipo, fator_risco, fonte_geradora,
              possiveis_danos, controles_existentes, p, s, n, ordem
  `;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = ${assessmentId}`;
  return rows[0] as unknown as AepRiskItem;
}

export async function assessmentIdOfRisk(riskId: string): Promise<string | null> {
  if (!sql) return null;
  const rows = await sql`SELECT assessment_id FROM aep_risk_items WHERE id = ${riskId} LIMIT 1`;
  return (rows[0] as unknown as { assessment_id: string } | undefined)?.assessment_id ?? null;
}

export async function updateRisk(riskId: string, data: RiskFields): Promise<void> {
  if (!sql) return;
  const n = calcRiskLevel(data.p ?? null, data.s ?? null);
  await sql`
    UPDATE aep_risk_items SET
      tipo = COALESCE(${data.tipo ?? null}, tipo),
      fator_risco = ${data.fatorRisco ?? null},
      fonte_geradora = ${data.fonteGeradora ?? null},
      possiveis_danos = ${data.possiveisDanos ?? null},
      controles_existentes = ${data.controlesExistentes ?? null},
      p = ${data.p ?? null}, s = ${data.s ?? null}, n = ${n}
    WHERE id = ${riskId}
  `;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = (SELECT assessment_id FROM aep_risk_items WHERE id = ${riskId})`;
}

export async function deleteRisk(riskId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE aep_assessments SET updated_at = NOW() WHERE id = (SELECT assessment_id FROM aep_risk_items WHERE id = ${riskId})`;
  await sql`DELETE FROM aep_risk_items WHERE id = ${riskId}`;
}

// ============================================================
// CHAT
// ============================================================

export async function addChatMessage(input: {
  assessmentId: string;
  authorUserId?: string | null;
  authorEmail?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  body: string;
  kind?: string;
}): Promise<AepChatMessage> {
  if (!sql) throw new Error("DB not configured");
  await initDb();
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO aep_chat_messages (id, assessment_id, author_user_id, author_email, author_name, author_role, body, kind)
    VALUES (${id}, ${input.assessmentId}, ${input.authorUserId ?? null}, ${input.authorEmail ?? null},
      ${input.authorName ?? null}, ${input.authorRole ?? null}, ${input.body}, ${input.kind ?? "message"})
    RETURNING id, assessment_id, author_user_id, author_email, author_name, author_role, body, kind,
              to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
  `;
  return rows[0] as unknown as AepChatMessage;
}

export async function listChat(assessmentId: string, afterId?: string | null): Promise<AepChatMessage[]> {
  if (!sql) return [];
  await initDb();
  const rows = afterId
    ? await sql`
        SELECT id, assessment_id, author_user_id, author_email, author_name, author_role, body, kind,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
        FROM aep_chat_messages
        WHERE assessment_id = ${assessmentId}
          AND created_at > (SELECT created_at FROM aep_chat_messages WHERE id = ${afterId})
        ORDER BY created_at ASC LIMIT 500
      `
    : await sql`
        SELECT id, assessment_id, author_user_id, author_email, author_name, author_role, body, kind,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
        FROM aep_chat_messages
        WHERE assessment_id = ${assessmentId}
        ORDER BY created_at ASC LIMIT 500
      `;
  return rows as unknown as AepChatMessage[];
}

// ============================================================
// AGREGADO (para getCompanyAggregate)
// ============================================================

export async function countAEPByCompany(companyId: string): Promise<number> {
  if (!sql) return 0;
  await initDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS n FROM aep_assessments
    WHERE company_id = ${companyId} AND deleted_at IS NULL
  `;
  return (rows[0] as unknown as { n: number }).n ?? 0;
}
