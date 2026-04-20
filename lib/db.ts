import { neon, neonConfig } from "@neondatabase/serverless";

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

/**
 * Initialize submissions table (idempotent).
 * Called automatically on first access.
 */
let initPromise: Promise<void> | null = null;
export async function initDb(): Promise<void> {
  if (!sql) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
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
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_criado_em ON submissions(criado_em DESC)`;
  })();
  return initPromise;
}

export async function insertSubmission(s: Omit<Submission, "id" | "criado_em">): Promise<string> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO submissions (id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone)
    VALUES (${id}, ${s.funcionarios}, ${s.necessidade}, ${s.regiao}, ${s.empresa}, ${s.cnpj || null}, ${s.nome}, ${s.telefone})
  `;
  return id;
}

export async function listSubmissions(): Promise<Submission[]> {
  if (!sql) return [];
  await initDb();
  const rows = await sql`
    SELECT id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone,
           to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em
    FROM submissions
    ORDER BY criado_em DESC
    LIMIT 5000
  `;
  return rows as unknown as Submission[];
}
