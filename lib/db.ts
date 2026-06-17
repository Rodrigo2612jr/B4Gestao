import { neon, neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { validatePasswordPolicy } from "./password";

// Cache connection across serverless invocations
neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL not set");
  }
  console.warn("[db] DATABASE_URL not set — database features disabled");
}

// Lazy SQL client
export const sql = connectionString ? neon(connectionString) : null;

export interface Submission {
  id: string;
  funcionarios: string;
  necessidade: string;
  regiao: string;
  empresa: string;
  cnpj: string | null;
  nome: string;
  telefone: string;
  criado_em: string;
  company_id?: string | null;
}

export type AdminRole = "ADMIN" | "SST" | "RH" | "JURIDICO" | "TECNICO" | "SUPERVISOR";

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  must_change_password: boolean;
  created_at: string;
  last_login: string | null;
  role: AdminRole;
  // Ciclo de vida da conta + lockout (revisão de segurança 2026-06)
  is_active: boolean;
  access_expires_at: string | null;
  password_changed_at: string | null;
  deactivated_at: string | null;
  invited_by: string | null;
  failed_attempts: number;
  locked_until: string | null;
}

/**
 * Initialize tables (idempotent).
 */
let initPromise: Promise<void> | null = null;
// Versão do schema. BUMP ao alterar a DDL do initDb → as migrações rodam uma vez no
// próximo cold start; cold starts seguintes pulam toda a DDL (1 query só, não ~40).
const SCHEMA_VERSION = 1;
export async function initDb(): Promise<void> {
  if (!sql) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // Fast-path: se o schema já está na versão atual, pula toda a DDL (perf de cold start).
    try {
      const v = await sql`SELECT 1 FROM schema_meta WHERE version >= ${SCHEMA_VERSION} LIMIT 1`;
      if (v.length > 0) return;
    } catch {
      // schema_meta ainda não existe → roda o setup completo abaixo
    }
    // pg_trgm para fuzzy matching de nomes de empresa
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    } catch (err) {
      console.warn("[db] pg_trgm extension could not be created:", err);
    }

    // Companies — espinha dorsal do CRM
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY,
        cnpj TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        city TEXT,
        state TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        merged_into_id UUID REFERENCES companies(id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_merged ON companies(merged_into_id)`;
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_companies_slug_trgm ON companies USING gin (slug gin_trgm_ops)`;
    } catch (err) {
      console.warn("[db] trigram index could not be created:", err);
    }

    // Submissions (with soft delete + company FK)
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY,
        funcionarios TEXT NOT NULL,
        necessidade TEXT NOT NULL,
        regiao TEXT NOT NULL,
        empresa TEXT NOT NULL,
        cnpj TEXT,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        company_id UUID REFERENCES companies(id)
      )
    `;
    // Migrations idempotentes — adicionar colunas ANTES de criar índices nelas
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'submissions' AND column_name = 'deleted_at'
        ) THEN
          ALTER TABLE submissions ADD COLUMN deleted_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'submissions' AND column_name = 'company_id'
        ) THEN
          ALTER TABLE submissions ADD COLUMN company_id UUID REFERENCES companies(id);
        END IF;
      END $$
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_criado_em ON submissions(criado_em DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_company ON submissions(company_id)`;

    // Admin users
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login TIMESTAMPTZ,
        role TEXT NOT NULL DEFAULT 'ADMIN'
      )
    `;
    // Migration idempotente — adicionar role se não existir
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='role') THEN
          ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'ADMIN';
        END IF;
      END $$
    `;

    // Ciclo de vida da conta + lockout persistente (revisão de segurança 2026-06)
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='is_active') THEN
          ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='access_expires_at') THEN
          ALTER TABLE admin_users ADD COLUMN access_expires_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='password_changed_at') THEN
          ALTER TABLE admin_users ADD COLUMN password_changed_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='deactivated_at') THEN
          ALTER TABLE admin_users ADD COLUMN deactivated_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='invited_by') THEN
          ALTER TABLE admin_users ADD COLUMN invited_by UUID REFERENCES admin_users(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='failed_attempts') THEN
          ALTER TABLE admin_users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='locked_until') THEN
          ALTER TABLE admin_users ADD COLUMN locked_until TIMESTAMPTZ;
        END IF;
      END $$
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_active ON admin_users(is_active)`;

    // Convites/ativação de conta — token de USO ÚNICO e HASHEADO (nunca o token em claro)
    await sql`
      CREATE TABLE IF NOT EXISTS admin_invites (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        purpose TEXT NOT NULL DEFAULT 'invite',
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_by UUID REFERENCES admin_users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_invites_user ON admin_invites(user_id)`;

    // Rate limiting / lockout durável (substitui o Map em memória — funciona em serverless)
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        blocked_until TIMESTAMPTZ
      )
    `;

    // ============================================================
    // MÓDULO B — Stress Test NR-1
    // ============================================================
    await sql`
      CREATE TABLE IF NOT EXISTS stress_test_audits (
        id UUID PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        respondent_name TEXT NOT NULL,
        respondent_role TEXT,
        answers JSONB NOT NULL,
        score_total INTEGER NOT NULL,
        semaforo TEXT NOT NULL,
        engavetamento_score INTEGER NOT NULL,
        coerencia_label TEXT NOT NULL,
        faixa TEXT NOT NULL,
        result_json JSONB NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT,
        deleted_at TIMESTAMPTZ
      )
    `;

    // Convites públicos (cliente preenche o Stress Test sozinho)
    await sql`
      CREATE TABLE IF NOT EXISTS stress_test_invites (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id),
        token TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'open',
        audit_id UUID REFERENCES stress_test_audits(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT,
        used_at TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_stress_invites_company ON stress_test_invites(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stress_invites_token ON stress_test_invites(token)`;

    await sql`CREATE INDEX IF NOT EXISTS idx_stress_company ON stress_test_audits(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stress_created ON stress_test_audits(created_at DESC)`;

    // ============================================================
    // MÓDULO A — Pulse NR-1
    // ============================================================
    await sql`
      CREATE TABLE IF NOT EXISTS pulse_campaigns (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id),
        title TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        questions JSONB NOT NULL,
        areas JSONB NOT NULL DEFAULT '[]'::jsonb,
        anonymity_threshold INTEGER NOT NULL DEFAULT 8,
        status TEXT NOT NULL DEFAULT 'open',
        opens_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closes_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_pulse_company ON pulse_campaigns(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pulse_token ON pulse_campaigns(token)`;

    await sql`
      CREATE TABLE IF NOT EXISTS pulse_responses (
        id UUID PRIMARY KEY,
        campaign_id UUID NOT NULL REFERENCES pulse_campaigns(id) ON DELETE CASCADE,
        area TEXT,
        answers JSONB NOT NULL,
        respondent_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_pulse_resp_campaign ON pulse_responses(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pulse_resp_area ON pulse_responses(area)`;

    // ============================================================
    // MÓDULO C — eSocial Analytics
    // ============================================================
    await sql`
      CREATE TABLE IF NOT EXISTS esocial_uploads (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id),
        filename TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        events_count INTEGER NOT NULL DEFAULT 0,
        alerts_count INTEGER NOT NULL DEFAULT 0,
        meta JSONB,
        error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_esocial_uploads_company ON esocial_uploads(company_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS esocial_alerts (
        id UUID PRIMARY KEY,
        upload_id UUID NOT NULL REFERENCES esocial_uploads(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        kind TEXT NOT NULL,
        severity TEXT NOT NULL,
        worker_key_hash TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence JSONB,
        custo_faixa TEXT,
        resolved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        alert_code TEXT,
        period_start DATE,
        period_end DATE,
        related_events JSONB,
        recommended_action TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_esocial_alerts_company ON esocial_alerts(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esocial_alerts_upload ON esocial_alerts(upload_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esocial_alerts_severity ON esocial_alerts(severity)`;
    // Migration idempotente para colunas novas
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='esocial_alerts' AND column_name='alert_code') THEN
          ALTER TABLE esocial_alerts ADD COLUMN alert_code TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='esocial_alerts' AND column_name='period_start') THEN
          ALTER TABLE esocial_alerts ADD COLUMN period_start DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='esocial_alerts' AND column_name='period_end') THEN
          ALTER TABLE esocial_alerts ADD COLUMN period_end DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='esocial_alerts' AND column_name='related_events') THEN
          ALTER TABLE esocial_alerts ADD COLUMN related_events JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='esocial_alerts' AND column_name='recommended_action') THEN
          ALTER TABLE esocial_alerts ADD COLUMN recommended_action TEXT;
        END IF;
      END $$
    `;

    // ============================================================
    // MÓDULO C — CAMADA TEMPORAL (Briefing v3, seção 7)
    // ============================================================

    // exposure_timeline (S-2240) — vigência por agente
    await sql`
      CREATE TABLE IF NOT EXISTS esocial_exposure_timeline (
        id UUID PRIMARY KEY,
        upload_id UUID NOT NULL REFERENCES esocial_uploads(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        worker_key_hash TEXT NOT NULL,
        cod_ag_noc TEXT,
        descr_agente TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        source_event_id TEXT,
        receipt TEXT,
        layout_version TEXT,
        raw JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_exposure_worker ON esocial_exposure_timeline(worker_key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_exposure_company ON esocial_exposure_timeline(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_exposure_dates ON esocial_exposure_timeline(start_date, end_date)`;

    // medical_events (S-2220) — ASOs
    await sql`
      CREATE TABLE IF NOT EXISTS esocial_medical_events (
        id UUID PRIMARY KEY,
        upload_id UUID NOT NULL REFERENCES esocial_uploads(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        worker_key_hash TEXT NOT NULL,
        aso_date DATE NOT NULL,
        tp_exame_ocup TEXT,
        source_event_id TEXT,
        receipt TEXT,
        layout_version TEXT,
        raw JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_medev_worker ON esocial_medical_events(worker_key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_medev_company ON esocial_medical_events(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_medev_aso ON esocial_medical_events(aso_date)`;

    // medical_exams (filha de medical_events)
    await sql`
      CREATE TABLE IF NOT EXISTS esocial_medical_exams (
        id UUID PRIMARY KEY,
        medical_event_id UUID NOT NULL REFERENCES esocial_medical_events(id) ON DELETE CASCADE,
        exam_code_raw TEXT,
        exam_code_normalized TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_medex_event ON esocial_medical_exams(medical_event_id)`;

    // leave_intervals (S-2230)
    await sql`
      CREATE TABLE IF NOT EXISTS esocial_leave_intervals (
        id UUID PRIMARY KEY,
        upload_id UUID NOT NULL REFERENCES esocial_uploads(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        worker_key_hash TEXT NOT NULL,
        leave_start DATE NOT NULL,
        leave_end DATE,
        reason_code TEXT,
        cid TEXT,
        is_work_related BOOLEAN NOT NULL DEFAULT FALSE,
        source_event_id TEXT,
        receipt TEXT,
        layout_version TEXT,
        raw JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_leave_worker ON esocial_leave_intervals(worker_key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leave_company ON esocial_leave_intervals(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leave_dates ON esocial_leave_intervals(leave_start, leave_end)`;

    // cat_events (S-2210)
    await sql`
      CREATE TABLE IF NOT EXISTS esocial_cat_events (
        id UUID PRIMARY KEY,
        upload_id UUID NOT NULL REFERENCES esocial_uploads(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        worker_key_hash TEXT NOT NULL,
        accident_date DATE NOT NULL,
        cat_type TEXT,
        cid TEXT,
        source_event_id TEXT,
        receipt TEXT,
        layout_version TEXT,
        raw JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_cat_worker ON esocial_cat_events(worker_key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cat_company ON esocial_cat_events(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cat_date ON esocial_cat_events(accident_date)`;

    // ============================================================
    // MÓDULO D — AEP (Avaliação Ergonômica Preliminar) — FO-SST.013
    // Fluxo técnico ↔ supervisor (preenchimento, chat, aprovação)
    // ============================================================

    // Raiz da avaliação + cabeçalho geral + estado da máquina
    await sql`
      CREATE TABLE IF NOT EXISTS aep_assessments (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id),
        title TEXT NOT NULL,
        unidade TEXT,
        data_avaliacao DATE,
        avaliador_user_id UUID REFERENCES admin_users(id),
        supervisor_user_id UUID REFERENCES admin_users(id),
        avaliador_cargo TEXT,
        norma_base TEXT NOT NULL DEFAULT 'NR-17 / ABNT ISO 20646:2017',
        checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'rascunho',
        rejection_reason TEXT,
        tecnico_seen_at TIMESTAMPTZ,
        supervisor_seen_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        submitted_at TIMESTAMPTZ,
        approved_at TIMESTAMPTZ,
        created_by TEXT,
        deleted_at TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_company ON aep_assessments(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_status ON aep_assessments(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_created ON aep_assessments(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_avaliador ON aep_assessments(avaliador_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_supervisor ON aep_assessments(supervisor_user_id)`;

    // Setores (loop ADD SETOR)
    await sql`
      CREATE TABLE IF NOT EXISTS aep_sectors (
        id UUID PRIMARY KEY,
        assessment_id UUID NOT NULL REFERENCES aep_assessments(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        nome TEXT NOT NULL,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_sectors_assessment ON aep_sectors(assessment_id)`;

    // Funções / GHE / paradigma (loop ADD FUNÇÃO)
    await sql`
      CREATE TABLE IF NOT EXISTS aep_functions (
        id UUID PRIMARY KEY,
        assessment_id UUID NOT NULL REFERENCES aep_assessments(id) ON DELETE CASCADE,
        sector_id UUID NOT NULL REFERENCES aep_sectors(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        ghe TEXT,
        funcao_paradigma TEXT NOT NULL,
        posto_trabalho TEXT,
        descricao_ambiente TEXT,
        descricao_atividade TEXT,
        modo_operatorio TEXT,
        mobiliario_equipamentos TEXT,
        conforto_acustico TEXT,
        temperatura TEXT,
        iluminacao TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_functions_assessment ON aep_functions(assessment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_functions_sector ON aep_functions(sector_id)`;

    // Fotos do posto de trabalho (Vercel Blob)
    await sql`
      CREATE TABLE IF NOT EXISTS aep_photos (
        id UUID PRIMARY KEY,
        function_id UUID NOT NULL REFERENCES aep_functions(id) ON DELETE CASCADE,
        assessment_id UUID NOT NULL REFERENCES aep_assessments(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        pathname TEXT,
        caption TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        size_bytes INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_photos_function ON aep_photos(function_id)`;

    // Inventário de perigos e riscos por GHE/função
    await sql`
      CREATE TABLE IF NOT EXISTS aep_risk_items (
        id UUID PRIMARY KEY,
        assessment_id UUID NOT NULL REFERENCES aep_assessments(id) ON DELETE CASCADE,
        function_id UUID REFERENCES aep_functions(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id),
        tipo TEXT NOT NULL DEFAULT 'ERGONOMICO',
        fator_risco TEXT,
        fonte_geradora TEXT,
        possiveis_danos TEXT,
        controles_existentes TEXT,
        p INTEGER,
        s INTEGER,
        n INTEGER,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_risk_assessment ON aep_risk_items(assessment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_risk_function ON aep_risk_items(function_id)`;

    // Chat técnico ↔ supervisor
    await sql`
      CREATE TABLE IF NOT EXISTS aep_chat_messages (
        id UUID PRIMARY KEY,
        assessment_id UUID NOT NULL REFERENCES aep_assessments(id) ON DELETE CASCADE,
        author_user_id UUID REFERENCES admin_users(id),
        author_email TEXT,
        author_name TEXT,
        author_role TEXT,
        body TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'message',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_chat_assessment ON aep_chat_messages(assessment_id, created_at)`;

    // Log de transições de estado (auditoria do fluxo de aprovação)
    await sql`
      CREATE TABLE IF NOT EXISTS aep_events (
        id UUID PRIMARY KEY,
        assessment_id UUID NOT NULL REFERENCES aep_assessments(id) ON DELETE CASCADE,
        actor_user_id UUID REFERENCES admin_users(id),
        actor_email TEXT,
        from_status TEXT,
        to_status TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_aep_events_assessment ON aep_events(assessment_id, created_at)`;

    // Audit log
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY,
        user_email TEXT,
        action TEXT NOT NULL,
        target_id TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC)`;

    // Marca a versão aplicada — cold starts futuros pulam toda a DDL acima (1 query só).
    await sql`CREATE TABLE IF NOT EXISTS schema_meta (version INTEGER PRIMARY KEY)`;
    await sql`INSERT INTO schema_meta (version) VALUES (${SCHEMA_VERSION}) ON CONFLICT DO NOTHING`;
  })();
  return initPromise;
}

// ============================================================
// SUBMISSIONS
// ============================================================
export async function insertSubmission(
  s: Omit<Submission, "id" | "criado_em">
): Promise<{ id: string; row: Submission }> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO submissions (id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone, company_id)
    VALUES (${id}, ${s.funcionarios}, ${s.necessidade}, ${s.regiao}, ${s.empresa}, ${s.cnpj || null}, ${s.nome}, ${s.telefone}, ${s.company_id ?? null})
    RETURNING id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone, company_id,
              to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em
  `;
  return { id, row: rows[0] as unknown as Submission };
}

export async function listSubmissions(includeDeleted = false): Promise<Submission[]> {
  if (!sql) return [];
  await initDb();
  const rows = includeDeleted
    ? await sql`
        SELECT id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone, company_id,
               to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em
        FROM submissions
        ORDER BY criado_em DESC
        LIMIT 5000
      `
    : await sql`
        SELECT id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone, company_id,
               to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em
        FROM submissions
        WHERE deleted_at IS NULL
        ORDER BY criado_em DESC
        LIMIT 5000
      `;
  return rows as unknown as Submission[];
}

/** Soft delete: marks as deleted, does not remove the row. */
export async function softDeleteSubmission(id: string): Promise<boolean> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  const result = await sql`
    UPDATE submissions
    SET deleted_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING id
  `;
  return result.length > 0;
}

// ============================================================
// ADMIN USERS
// ============================================================
export async function findUserByEmail(email: string): Promise<AdminUser | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, email, password_hash, name, must_change_password, role,
           COALESCE(is_active, TRUE) AS is_active, COALESCE(failed_attempts, 0) AS failed_attempts, invited_by,
           to_char(access_expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS access_expires_at,
           to_char(locked_until, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS locked_until,
           to_char(password_changed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS password_changed_at,
           to_char(deactivated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS deactivated_at,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(last_login, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login
    FROM admin_users
    WHERE email = ${email.toLowerCase()}
    LIMIT 1
  `;
  return (rows[0] as unknown as AdminUser) ?? null;
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    // Dummy bcrypt compare to equalize timing
    await bcrypt.compare(password, "$2a$10$invalidHashInvalidHashInvalidHashInvalidHashInvalid");
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  if (Buffer.byteLength(newPassword, "utf8") < 12) {
    throw new Error("Senha deve ter no mínimo 12 caracteres");
  }
  const hash = await bcrypt.hash(newPassword, 12);
  // Trocar a senha zera lockout e marca a data (encerra o estado de "senha temporária").
  await sql`
    UPDATE admin_users
    SET password_hash = ${hash}, must_change_password = FALSE,
        password_changed_at = NOW(), failed_attempts = 0, locked_until = NULL
    WHERE id = ${userId}
  `;
}

/** Registra uma tentativa de login falha e bloqueia a conta após `maxAttempts`. */
export async function recordLoginFailure(
  userId: string,
  maxAttempts: number,
  lockMs: number
): Promise<void> {
  if (!sql) return;
  await sql`
    UPDATE admin_users
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE
          WHEN failed_attempts + 1 >= ${maxAttempts}
          THEN NOW() + (${lockMs}::bigint * interval '1 millisecond')
          ELSE locked_until END
    WHERE id = ${userId}
  `;
}

/** Zera o contador de falhas (login bem-sucedido). */
export async function clearLoginFailures(userId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ${userId}`;
}

/** Login bem-sucedido: zera lockout + marca último acesso numa ÚNICA query (perf). */
export async function markSuccessfulLogin(userId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ${userId}`;
}

/** Ativa/desativa uma conta (kill switch — vale no próximo request via guard). */
export async function setUserActive(userId: string, active: boolean): Promise<void> {
  if (!sql) return;
  await sql`
    UPDATE admin_users
    SET is_active = ${active}, deactivated_at = ${active ? null : new Date().toISOString()}
    WHERE id = ${userId}
  `;
}

/** Define/renova a validade do acesso (NULL = sem expiração). */
export async function setUserAccessExpiry(userId: string, expiresAt: string | null): Promise<void> {
  if (!sql) return;
  await sql`UPDATE admin_users SET access_expires_at = ${expiresAt}, is_active = TRUE WHERE id = ${userId}`;
}

export async function touchLastLogin(userId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE admin_users SET last_login = NOW() WHERE id = ${userId}`;
}

export async function createUser(
  email: string,
  name: string,
  tempPassword: string,
  role: AdminRole = "ADMIN"
): Promise<string> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(tempPassword, 12);
  await sql`
    INSERT INTO admin_users (id, email, password_hash, name, must_change_password, role)
    VALUES (${id}, ${email.toLowerCase()}, ${hash}, ${name}, TRUE, ${role})
  `;
  return id;
}

/** Papel de um usuário por id (validação de atribuição de supervisor no AEP). */
export async function getUserRoleById(id: string): Promise<AdminRole | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`SELECT role FROM admin_users WHERE id = ${id} LIMIT 1`;
  return (rows[0] as unknown as { role: AdminRole } | undefined)?.role ?? null;
}

/** Lista usuários por perfil (ex.: supervisores para o select do AEP). */
export async function getUsersByRole(
  role: AdminRole
): Promise<Pick<AdminUser, "id" | "email" | "name" | "role">[]> {
  if (!sql) return [];
  await initDb();
  const rows = await sql`
    SELECT id, email, name, role
    FROM admin_users
    WHERE role = ${role}
    ORDER BY name ASC
  `;
  return rows as unknown as Pick<AdminUser, "id" | "email" | "name" | "role">[];
}

export async function listUsers(): Promise<Omit<AdminUser, "password_hash">[]> {
  if (!sql) return [];
  await initDb();
  const rows = await sql`
    SELECT id, email, name, must_change_password, role,
           COALESCE(is_active, TRUE) AS is_active, invited_by,
           to_char(access_expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS access_expires_at,
           to_char(locked_until, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS locked_until,
           to_char(password_changed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS password_changed_at,
           to_char(deactivated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS deactivated_at,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(last_login, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login
    FROM admin_users
    ORDER BY created_at ASC
  `;
  return rows as unknown as Omit<AdminUser, "password_hash">[];
}

// ============================================================
// CONVITES / ATIVAÇÃO DE CONTA (acessos temporários)
// ============================================================
const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48h

/**
 * Cria o usuário (senha placeholder inutilizável) + um convite de uso único.
 * Retorna o token BRUTO uma única vez (vai no link de ativação; no banco só o hash).
 */
export async function createUserWithInvite(opts: {
  email: string;
  name: string;
  role: AdminRole;
  invitedBy: string;
  validDays?: number | null;
}): Promise<{ userId: string; rawToken: string; expiresAt: string }> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  const userId = crypto.randomUUID();
  // Senha aleatória descartável — a conta só fica usável após a ativação.
  const placeholder = randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(placeholder, 12);
  const accessExpiresAt =
    opts.validDays && opts.validDays > 0
      ? new Date(Date.now() + opts.validDays * 86400000).toISOString()
      : null;

  await sql`
    INSERT INTO admin_users
      (id, email, password_hash, name, must_change_password, role, is_active, access_expires_at, invited_by)
    VALUES
      (${userId}, ${opts.email.toLowerCase()}, ${hash}, ${opts.name}, TRUE, ${opts.role}, TRUE, ${accessExpiresAt}, ${opts.invitedBy})
  `;

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const inviteExpires = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  await sql`
    INSERT INTO admin_invites (id, user_id, token_hash, purpose, expires_at, created_by)
    VALUES (${crypto.randomUUID()}, ${userId}, ${tokenHash}, 'invite', ${inviteExpires}, ${opts.invitedBy})
  `;
  return { userId, rawToken, expiresAt: inviteExpires };
}

/** Gera um novo convite (reenviar / resetar senha) para um usuário existente. */
export async function createInviteForUser(
  userId: string,
  invitedBy: string,
  purpose: "invite" | "reset" = "reset"
): Promise<{ rawToken: string; expiresAt: string }> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  // Invalida convites pendentes anteriores (uso único de verdade).
  await sql`UPDATE admin_invites SET used_at = NOW() WHERE user_id = ${userId} AND used_at IS NULL`;
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const ttl = purpose === "reset" ? 60 * 60 * 1000 : INVITE_TTL_MS; // reset: 1h
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  await sql`
    INSERT INTO admin_invites (id, user_id, token_hash, purpose, expires_at, created_by)
    VALUES (${crypto.randomUUID()}, ${userId}, ${tokenHash}, ${purpose}, ${expiresAt}, ${invitedBy})
  `;
  return { rawToken, expiresAt };
}

/** Valida um convite SEM consumir (para a tela de ativação mostrar nome/e-mail). */
export async function peekInvite(
  rawToken: string
): Promise<{ valid: boolean; email?: string; name?: string }> {
  if (!sql) return { valid: false };
  await initDb();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const rows = await sql`
    SELECT u.email, u.name
    FROM admin_invites i
    JOIN admin_users u ON u.id = i.user_id
    WHERE i.token_hash = ${tokenHash} AND i.used_at IS NULL AND i.expires_at > NOW()
    LIMIT 1
  `;
  const row = rows[0] as unknown as { email: string; name: string } | undefined;
  if (!row) return { valid: false };
  return { valid: true, email: row.email, name: row.name };
}

/**
 * Consome um convite (uso único): valida token/expiração, aplica a política de senha,
 * grava a senha definitiva e marca o convite como usado. NÃO cria sessão (OWASP).
 */
export async function consumeInvite(
  rawToken: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: "Banco não configurado" };
  await initDb();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const rows = await sql`
    SELECT i.id AS invite_id, i.user_id, u.email, u.name
    FROM admin_invites i
    JOIN admin_users u ON u.id = i.user_id
    WHERE i.token_hash = ${tokenHash} AND i.used_at IS NULL AND i.expires_at > NOW()
    LIMIT 1
  `;
  const row = rows[0] as unknown as { invite_id: string; user_id: string; email: string; name: string } | undefined;
  if (!row) return { ok: false, error: "Convite inválido ou expirado." };

  const policyErr = validatePasswordPolicy(newPassword, { email: row.email, name: row.name });
  if (policyErr) return { ok: false, error: policyErr };

  const hash = await bcrypt.hash(newPassword, 12);
  await sql`
    UPDATE admin_users
    SET password_hash = ${hash}, must_change_password = FALSE, password_changed_at = NOW(),
        failed_attempts = 0, locked_until = NULL, is_active = TRUE
    WHERE id = ${row.user_id}
  `;
  await sql`UPDATE admin_invites SET used_at = NOW() WHERE id = ${row.invite_id}`;
  return { ok: true };
}

// ============================================================
// AUDIT LOG
// ============================================================
export async function logAudit(
  userEmail: string | null,
  action: string,
  targetId: string | null,
  ip: string
): Promise<void> {
  if (!sql) return;
  try {
    await sql`
      INSERT INTO audit_log (id, user_email, action, target_id, ip)
      VALUES (${crypto.randomUUID()}, ${userEmail}, ${action}, ${targetId}, ${ip})
    `;
  } catch (err) {
    console.error("[audit] log failed:", err);
  }
}
