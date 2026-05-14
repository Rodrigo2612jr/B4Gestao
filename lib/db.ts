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
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_criado_em ON submissions(criado_em DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_company ON submissions(company_id)`;
    // Migrations idempotentes
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_esocial_alerts_company ON esocial_alerts(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esocial_alerts_upload ON esocial_alerts(upload_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esocial_alerts_severity ON esocial_alerts(severity)`;

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
