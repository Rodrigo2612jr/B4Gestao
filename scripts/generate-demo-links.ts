/**
 * Gera empresa demo + tokens PRODUÇÃO para mostrar ao cliente.
 * URLs usam https://b4gestao.com.br/... (já hospedado na Vercel).
 *
 * Uso: npx tsx scripts/generate-demo-links.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const DEMO_CNPJ = "11.222.333/0001-81"; // CNPJ válido fictício
const DEMO_NAME = "Demo Cliente — Apresentação B4";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não definido");
    process.exit(1);
  }
  const { sql, initDb } = await import("../lib/db");
  const { resolveCompany } = await import("../lib/companies");
  const { createCampaign } = await import("../lib/pulse/db");
  const { createStressInvite } = await import("../lib/stress-test/db");

  if (!sql) throw new Error("sql não inicializou");
  await initDb();

  // 1. Cria/recupera empresa demo (CNPJ é a chave)
  const { company, created } = await resolveCompany({ cnpj: DEMO_CNPJ, name: DEMO_NAME });
  console.log(`Empresa demo: ${company.name} ${created ? "(criada agora)" : "(reaproveitada)"}\n`);

  // 2. Pulse — campanha aberta
  const pulse = await createCampaign({
    companyId: company.id,
    title: "Pulse NR-1 — Pesquisa de clima psicossocial (DEMO)",
    areas: ["Administrativo", "Operações", "Comercial", "Diretoria"],
    createdBy: "demo-script",
  });

  // 3. Stress Test — convite one-shot
  const stress = await createStressInvite(company.id, "demo-script");

  const PROD = "https://b4gestao.com.br";
  console.log("════════════════════════════════════════════════════");
  console.log("🌎 LINKS DE PRODUÇÃO — pode mandar pro cliente agora");
  console.log("════════════════════════════════════════════════════\n");
  console.log("📊 PULSE — funcionário responde anônimo:");
  console.log(`   ${PROD}/pulse/${pulse.token}\n`);
  console.log("🚦 STRESS TEST — cliente decisor preenche:");
  console.log(`   ${PROD}/stress/${stress.token}\n`);
  console.log("════════════════════════════════════════════════════");
  console.log("🔐 Quando ativar DNS (pulse.b4gestao.com.br / stress...):");
  console.log(`   https://pulse.b4gestao.com.br/${pulse.token}`);
  console.log(`   https://stress.b4gestao.com.br/${stress.token}`);
  console.log("════════════════════════════════════════════════════");
  console.log("\n💡 Comportamento:");
  console.log("   - Pulse: aberto até você encerrar (vários respondentes)");
  console.log("   - Stress: link one-shot (1 uso → expira)");
  console.log("\n📋 Pra ver as respostas:");
  console.log(`   ${PROD}/admin → Empresas → "${company.name}"`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
