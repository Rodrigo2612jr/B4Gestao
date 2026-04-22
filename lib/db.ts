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
    // Submissions (with soft delete)
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
        deleted_at TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_criado_em ON submissions(criado_em DESC)`;
    // Add deleted_at column if missing (migration for existing deploys)
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'submissions' AND column_name = 'deleted_at'
        ) THEN
          ALTER TABLE submissions ADD COLUMN deleted_at TIMESTAMPTZ;
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
    INSERT INTO submissions (id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone)
    VALUES (${id}, ${s.funcionarios}, ${s.necessidade}, ${s.regiao}, ${s.empresa}, ${s.cnpj || null}, ${s.nome}, ${s.telefone})
    RETURNING id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone,
              to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em
  `;
  return { id, row: rows[0] as unknown as Submission };
}

export async function listSubmissions(includeDeleted = false): Promise<Submission[]> {
  if (!sql) return [];
  await initDb();
  const rows = includeDeleted
    ? await sql`
        SELECT id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone,
               to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em
        FROM submissions
        ORDER BY criado_em DESC
        LIMIT 5000
      `
    : await sql`
        SELECT id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone,
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
