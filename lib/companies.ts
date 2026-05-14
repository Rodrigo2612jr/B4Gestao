/**
 * Companies library — entity resolution para conectar leads + módulos NR-1.
 *
 * Camadas de matching:
 *   1. CNPJ canônico (gold standard)
 *   2. Slug normalizado (lowercase, sem acento, sem sufixos jurídicos)
 *   3. Fuzzy via pg_trgm (apenas para sugestão de duplicata)
 */

import { sql, initDb, logAudit } from "./db";

// ============================================================
// CNPJ helpers
// ============================================================

/** Remove tudo que não é dígito. */
export function stripCnpj(input: string): string {
  return (input || "").replace(/\D+/g, "");
}

/** Valida CNPJ (algoritmo oficial dos 2 dígitos verificadores). */
export function isValidCnpj(input: string): boolean {
  const cnpj = stripCnpj(input);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calc = (slice: string, factors: number[]): number => {
    const sum = slice
      .split("")
      .reduce((acc, n, i) => acc + parseInt(n, 10) * factors[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const base = cnpj.slice(0, 12);
  const d1 = calc(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(base + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj === base + String(d1) + String(d2);
}

/** Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX. */
export function formatCnpj(input: string): string {
  const c = stripCnpj(input);
  if (c.length !== 14) return input;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

// ============================================================
// Name normalization → slug
// ============================================================

const LEGAL_SUFFIXES = [
  "ltda",
  "me",
  "epp",
  "eireli",
  "sa",
  "s a",
  "s\\.a",
  "mei",
  "eireli",
  "limitada",
  "sociedade anonima",
  "sociedade anônima",
];

/** Normaliza nome de empresa para slug determinístico. */
export function companySlug(name: string): string {
  if (!name) return "";
  let s = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ") // mantém só alfanum + espaço + hífen
    .replace(/\s+/g, " ")
    .trim();

  // Remove sufixos jurídicos no final
  for (const suffix of LEGAL_SUFFIXES) {
    const re = new RegExp(`\\s+${suffix}\\.?$`, "i");
    s = s.replace(re, "").trim();
  }

  return s
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================
// Types
// ============================================================

export interface Company {
  id: string;
  cnpj: string; // limpo (14 dígitos)
  cnpj_formatted: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  merged_into_id: string | null;
}

export interface CompanyMatch {
  company: Company;
  score: number; // 0–1
  reason: "cnpj" | "slug" | "fuzzy";
}

// ============================================================
// CRUD + resolução
// ============================================================

/** Busca por CNPJ exato. */
export async function findCompanyByCnpj(cnpj: string): Promise<Company | null> {
  if (!sql) return null;
  await initDb();
  const clean = stripCnpj(cnpj);
  if (clean.length !== 14) return null;
  const rows = await sql`
    SELECT id, cnpj,
           CONCAT(SUBSTR(cnpj,1,2),'.',SUBSTR(cnpj,3,3),'.',SUBSTR(cnpj,6,3),'/',SUBSTR(cnpj,9,4),'-',SUBSTR(cnpj,13,2)) AS cnpj_formatted,
           name, slug, city, state, notes,
           to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           merged_into_id
    FROM companies
    WHERE cnpj = ${clean}
    LIMIT 1
  `;
  return (rows[0] as unknown as Company) ?? null;
}

/** Busca por slug exato. */
export async function findCompanyBySlug(slug: string): Promise<Company | null> {
  if (!sql) return null;
  await initDb();
  if (!slug) return null;
  const rows = await sql`
    SELECT id, cnpj,
           CONCAT(SUBSTR(cnpj,1,2),'.',SUBSTR(cnpj,3,3),'.',SUBSTR(cnpj,6,3),'/',SUBSTR(cnpj,9,4),'-',SUBSTR(cnpj,13,2)) AS cnpj_formatted,
           name, slug, city, state, notes,
           to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           merged_into_id
    FROM companies
    WHERE slug = ${slug} AND merged_into_id IS NULL
    LIMIT 1
  `;
  return (rows[0] as unknown as Company) ?? null;
}

/** Busca fuzzy (pg_trgm) — para sugerir possíveis duplicatas. */
export async function fuzzyFindCompanies(
  name: string,
  minScore = 0.4,
  limit = 5
): Promise<CompanyMatch[]> {
  if (!sql) return [];
  await initDb();
  const slug = companySlug(name);
  if (!slug) return [];
  const rows = (await sql`
    SELECT id, cnpj,
           CONCAT(SUBSTR(cnpj,1,2),'.',SUBSTR(cnpj,3,3),'.',SUBSTR(cnpj,6,3),'/',SUBSTR(cnpj,9,4),'-',SUBSTR(cnpj,13,2)) AS cnpj_formatted,
           name, slug, city, state, notes,
           to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           merged_into_id,
           similarity(slug, ${slug}) AS score
    FROM companies
    WHERE merged_into_id IS NULL
      AND similarity(slug, ${slug}) > ${minScore}
    ORDER BY score DESC
    LIMIT ${limit}
  `) as unknown as Array<Company & { score: number }>;
  return rows.map((r) => ({
    company: { ...r },
    score: Number(r.score),
    reason: "fuzzy" as const,
  }));
}

/**
 * Cria nova company (já assume CNPJ válido e único).
 */
export async function createCompany(input: {
  cnpj: string;
  name: string;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
}): Promise<Company> {
  if (!sql) throw new Error("Database not configured");
  await initDb();
  const cnpj = stripCnpj(input.cnpj);
  if (!isValidCnpj(cnpj)) throw new Error("CNPJ inválido");
  const slug = companySlug(input.name);
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO companies (id, cnpj, name, slug, city, state, notes)
    VALUES (${id}, ${cnpj}, ${input.name}, ${slug}, ${input.city ?? null}, ${input.state ?? null}, ${input.notes ?? null})
    RETURNING id, cnpj,
              CONCAT(SUBSTR(cnpj,1,2),'.',SUBSTR(cnpj,3,3),'.',SUBSTR(cnpj,6,3),'/',SUBSTR(cnpj,9,4),'-',SUBSTR(cnpj,13,2)) AS cnpj_formatted,
              name, slug, city, state, notes,
              to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
              to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
              merged_into_id
  `;
  return rows[0] as unknown as Company;
}

/**
 * resolveCompany — PORTA PRINCIPAL DE ENTRADA.
 *
 * 1. Se CNPJ existe → retorna match.
 * 2. Senão, cria nova company.
 * 3. Em paralelo, busca fuzzy por nome para alertar duplicata.
 *
 * Retorna { company, suggestions } onde suggestions são possíveis duplicatas
 * por nome (mesmo após criar/encontrar pela CNPJ).
 */
export async function resolveCompany(input: {
  cnpj: string;
  name: string;
  city?: string | null;
  state?: string | null;
}): Promise<{
  company: Company;
  created: boolean;
  suggestions: CompanyMatch[];
}> {
  const cnpj = stripCnpj(input.cnpj);
  if (!isValidCnpj(cnpj)) throw new Error("CNPJ inválido");

  // 1. Tenta match exato por CNPJ
  let existing = await findCompanyByCnpj(cnpj);

  // Se a company existe mas foi mesclada, segue até a raiz canônica
  while (existing?.merged_into_id) {
    const parent = await findCompanyById(existing.merged_into_id);
    if (!parent) break;
    existing = parent;
  }

  let company: Company;
  let created = false;

  if (existing) {
    company = existing;
    // Se o nome novo é "melhor" (mais completo), atualiza
    if (input.name && input.name.length > company.name.length) {
      await updateCompanyName(company.id, input.name);
      company = { ...company, name: input.name, slug: companySlug(input.name) };
    }
  } else {
    company = await createCompany({
      cnpj,
      name: input.name,
      city: input.city ?? null,
      state: input.state ?? null,
    });
    created = true;
  }

  // 2. Sugestões fuzzy (mesmo após criar — alerta admin de possível dup)
  const suggestions = (await fuzzyFindCompanies(input.name)).filter(
    (m) => m.company.id !== company.id
  );

  return { company, created, suggestions };
}

export async function findCompanyById(id: string): Promise<Company | null> {
  if (!sql) return null;
  await initDb();
  const rows = await sql`
    SELECT id, cnpj,
           CONCAT(SUBSTR(cnpj,1,2),'.',SUBSTR(cnpj,3,3),'.',SUBSTR(cnpj,6,3),'/',SUBSTR(cnpj,9,4),'-',SUBSTR(cnpj,13,2)) AS cnpj_formatted,
           name, slug, city, state, notes,
           to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           merged_into_id
    FROM companies
    WHERE id = ${id}
    LIMIT 1
  `;
  return (rows[0] as unknown as Company) ?? null;
}

export async function updateCompanyName(id: string, name: string): Promise<void> {
  if (!sql) return;
  await sql`
    UPDATE companies SET name = ${name}, slug = ${companySlug(name)}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function listCompanies(): Promise<Company[]> {
  if (!sql) return [];
  await initDb();
  const rows = await sql`
    SELECT id, cnpj,
           CONCAT(SUBSTR(cnpj,1,2),'.',SUBSTR(cnpj,3,3),'.',SUBSTR(cnpj,6,3),'/',SUBSTR(cnpj,9,4),'-',SUBSTR(cnpj,13,2)) AS cnpj_formatted,
           name, slug, city, state, notes,
           to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
           to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
           merged_into_id
    FROM companies
    WHERE merged_into_id IS NULL
    ORDER BY updated_at DESC
    LIMIT 2000
  `;
  return rows as unknown as Company[];
}

/**
 * Mescla `sourceId` em `targetId`. Todos os registros vinculados a source
 * passam a apontar para target. A source fica com merged_into_id = target.
 */
export async function mergeCompanies(
  sourceId: string,
  targetId: string,
  byUserEmail: string,
  ip: string
): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  if (sourceId === targetId) throw new Error("Não é possível mesclar a empresa nela mesma");

  await sql`UPDATE submissions SET company_id = ${targetId} WHERE company_id = ${sourceId}`;
  // Futuramente: idem para pulse, stress_test, esocial...
  await sql`UPDATE companies SET merged_into_id = ${targetId}, updated_at = NOW() WHERE id = ${sourceId}`;

  await logAudit(byUserEmail, "merge_companies", `${sourceId}->${targetId}`, ip);
}

/**
 * Retorna o agregado consolidado da empresa: dados + leads + (futuramente) módulos.
 */
export async function getCompanyAggregate(companyId: string): Promise<{
  company: Company | null;
  submissions: Array<{
    id: string;
    funcionarios: string;
    necessidade: string;
    regiao: string;
    empresa: string;
    cnpj: string | null;
    nome: string;
    telefone: string;
    criado_em: string;
  }>;
  counts: { leads: number; pulse: number; stress: number; esocial: number };
}> {
  if (!sql) return { company: null, submissions: [], counts: { leads: 0, pulse: 0, stress: 0, esocial: 0 } };
  await initDb();

  const company = await findCompanyById(companyId);
  if (!company) return { company: null, submissions: [], counts: { leads: 0, pulse: 0, stress: 0, esocial: 0 } };

  const subs = await sql`
    SELECT id, funcionarios, necessidade, regiao, empresa, cnpj, nome, telefone,
           to_char(criado_em,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em
    FROM submissions
    WHERE company_id = ${companyId} AND deleted_at IS NULL
    ORDER BY criado_em DESC
  `;

  return {
    company,
    submissions: subs as unknown as Array<{
      id: string;
      funcionarios: string;
      necessidade: string;
      regiao: string;
      empresa: string;
      cnpj: string | null;
      nome: string;
      telefone: string;
      criado_em: string;
    }>,
    counts: {
      leads: subs.length,
      pulse: 0, // TODO Módulo A
      stress: 0, // TODO Módulo B
      esocial: 0, // TODO Módulo C
    },
  };
}
