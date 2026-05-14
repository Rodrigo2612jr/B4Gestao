/**
 * Inspeciona submissions e roda backfill de companies.
 *
 * Uso: npx tsx scripts/inspect-and-backfill.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não definido em .env.local");
    process.exit(1);
  }

  // Importação dinâmica pra carregar env antes
  const { sql, initDb } = await import("../lib/db");
  const { isValidCnpj, resolveCompany, stripCnpj } = await import("../lib/companies");

  if (!sql) throw new Error("sql não inicializou");
  await initDb();

  console.log("\n=== ESTADO ATUAL ===");

  const totalSubs = (await sql`SELECT COUNT(*)::int AS n FROM submissions WHERE deleted_at IS NULL`) as { n: number }[];
  const subsSemCompany = (await sql`SELECT COUNT(*)::int AS n FROM submissions WHERE company_id IS NULL AND deleted_at IS NULL`) as { n: number }[];
  const subsComCnpjValido = (await sql`
    SELECT id, empresa, cnpj, regiao FROM submissions
    WHERE company_id IS NULL AND deleted_at IS NULL AND cnpj IS NOT NULL
  `) as Array<{ id: string; empresa: string; cnpj: string; regiao: string }>;
  const totalCompanies = (await sql`SELECT COUNT(*)::int AS n FROM companies`) as { n: number }[];

  console.log(`Total de leads (submissions ativas):  ${totalSubs[0].n}`);
  console.log(`Leads SEM company_id:                 ${subsSemCompany[0].n}`);
  console.log(`Companies já cadastradas:             ${totalCompanies[0].n}`);
  console.log(`Leads com CNPJ pendentes de backfill: ${subsComCnpjValido.length}`);

  if (subsComCnpjValido.length === 0) {
    console.log("\n✓ Nada para fazer — todos os leads já estão vinculados a empresas.");
    return;
  }

  console.log("\n=== LEADS PENDENTES DE VINCULAÇÃO ===");
  for (const s of subsComCnpjValido) {
    const valid = isValidCnpj(s.cnpj);
    console.log(`- ${s.empresa.padEnd(40)} CNPJ ${s.cnpj.padEnd(20)} ${valid ? "✓ válido" : "✗ inválido"}`);
  }

  console.log("\n=== RODANDO BACKFILL ===");
  let linked = 0;
  let createdNew = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  for (const s of subsComCnpjValido) {
    if (!s.cnpj || !isValidCnpj(s.cnpj)) {
      skipped++;
      skippedReasons.push(`${s.empresa} — CNPJ inválido (${s.cnpj})`);
      continue;
    }
    try {
      const before = (await sql`SELECT id FROM companies WHERE cnpj = ${stripCnpj(s.cnpj)}`) as { id: string }[];
      const { company, created } = await resolveCompany({
        cnpj: s.cnpj,
        name: s.empresa,
        state: s.regiao,
      });
      await sql`UPDATE submissions SET company_id = ${company.id} WHERE id = ${s.id}`;
      linked++;
      if (created || before.length === 0) {
        createdNew++;
        console.log(`✓ CRIOU empresa: ${company.name} (CNPJ ${company.cnpj_formatted})`);
      } else {
        console.log(`✓ VINCULOU à existente: ${company.name}`);
      }
    } catch (err) {
      skipped++;
      const msg = err instanceof Error ? err.message : "?";
      skippedReasons.push(`${s.empresa} — ${msg}`);
    }
  }

  console.log("\n=== RESULTADO ===");
  console.log(`Leads vinculados:           ${linked}`);
  console.log(`Empresas novas criadas:     ${createdNew}`);
  console.log(`Vinculados a existentes:    ${linked - createdNew}`);
  console.log(`Pulados:                    ${skipped}`);
  if (skippedReasons.length > 0) {
    console.log("\nMotivos:");
    for (const r of skippedReasons) console.log(`  - ${r}`);
  }

  const totalAfter = (await sql`SELECT COUNT(*)::int AS n FROM companies`) as { n: number }[];
  console.log(`\nTotal de companies agora: ${totalAfter[0].n}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
