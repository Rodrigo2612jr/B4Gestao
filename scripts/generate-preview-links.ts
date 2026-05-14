/**
 * Gera tokens reais de Pulse e Stress Test pra visualização das páginas públicas.
 * Uso: npx tsx scripts/generate-preview-links.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não definido");
    process.exit(1);
  }

  const { sql, initDb } = await import("../lib/db");
  const { listCompanies } = await import("../lib/companies");
  const { createCampaign } = await import("../lib/pulse/db");
  const { createStressInvite } = await import("../lib/stress-test/db");

  if (!sql) throw new Error("sql não inicializou");
  await initDb();

  const companies = await listCompanies();
  if (companies.length === 0) {
    console.error("Nenhuma empresa cadastrada. Cadastre uma primeiro.");
    process.exit(1);
  }
  const company = companies[0];
  console.log(`Empresa usada: ${company.name} (${company.cnpj_formatted})\n`);

  // Pulse
  const pulse = await createCampaign({
    companyId: company.id,
    title: "Pulse NR-1 — Diagnóstico psicossocial (preview)",
    areas: ["Administrativo", "Operações", "Comercial"],
    createdBy: "preview-script",
  });
  console.log("✓ Pulse campaign criada");

  // Stress Test
  const stress = await createStressInvite(company.id, "preview-script");
  console.log("✓ Stress Test invite criado\n");

  console.log("════════════════════════════════════════");
  console.log("📊 PULSE — funcionário responde anônimo:");
  console.log(`   http://localhost:3000/pulse/${pulse.token}`);
  console.log("");
  console.log("🚦 STRESS TEST — cliente preenche:");
  console.log(`   http://localhost:3000/stress/${stress.token}`);
  console.log("════════════════════════════════════════");
  console.log("");
  console.log("⚠ eSocial NÃO tem página pública — só admin faz upload.");
  console.log("");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
