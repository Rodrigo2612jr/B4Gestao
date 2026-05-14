import { neon, neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

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

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  must_change_password: boolean;
  created_at: string;
  last_login: string | null;
}

/**
 * Initialize tables (idempotent).
 */
let initPromise: Promise<void> | null = null;
export async function initDb(): Promise<void> {
  if (!sql) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
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
        last_login TIMESTAMPTZ
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
    SELECT id, email, password_hash, name, must_change_password,
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
  if (newPassword.length < 8) throw new Error("Senha deve ter no mínimo 8 caracteres");
  const hash = await bcrypt.hash(newPassword, 12);
  await sql`
    UPDATE admin_users
    SET password_hash = ${hash}, must_change_password = FALSE
    WHERE id = ${userId}
  `;
}

export async function touchLastLogin(userId: string): Promise<void> {
  if (!sql) return;
  await sql`UPDATE admin_users SET last_login = NOW() WHERE id = ${userId}`;
}

export async function createUser(
  email: string,
  name: string,
  tempPassword: string
): Promise<string> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(tempPassword, 12);
  await sql`
    INSERT INTO admin_users (id, email, password_hash, name, must_change_password)
    VALUES (${id}, ${email.toLowerCase()}, ${hash}, ${name}, TRUE)
  `;
  return id;
}

export async function listUsers(): Promise<Omit<AdminUser, "password_hash">[]> {
  if (!sql) return [];
  await initDb();
  const rows = await sql`
    SELECT id, email, name, must_change_password,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(last_login, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login
    FROM admin_users
    ORDER BY created_at ASC
  `;
  return rows as unknown as Omit<AdminUser, "password_hash">[];
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
