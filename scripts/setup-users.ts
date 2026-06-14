/**
 * Cria usuários internos da B4 com senha temporária aleatória.
 *
 * Uso (grupos de 3 args: email, nome, perfil):
 *   npx tsx scripts/setup-users.ts <email> <nome> <perfil> [<email> <nome> <perfil> ...]
 *
 * Perfis válidos: ADMIN | SST | RH | JURIDICO | TECNICO | SUPERVISOR
 *
 * Ex.: npx tsx scripts/setup-users.ts joao@b4.com "João Téc" TECNICO maria@b4.com "Maria Sup" SUPERVISOR
 */
import crypto from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

const VALID_ROLES = ["ADMIN", "SST", "RH", "JURIDICO", "TECNICO", "SUPERVISOR"] as const;
type Role = (typeof VALID_ROLES)[number];

// Dynamic import AFTER env is loaded
async function run() {
  const { createUser, findUserByEmail } = await import("../lib/db");

  function genPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    const bytes = crypto.randomBytes(12);
    for (let i = 0; i < 12; i++) out += chars[bytes[i] % chars.length];
    return out;
  }

  const args = process.argv.slice(2);
  if (args.length < 3 || args.length % 3 !== 0) {
    console.error("Uso: tsx scripts/setup-users.ts <email> <nome> <perfil> [...]");
    console.error("Perfis: " + VALID_ROLES.join(" | "));
    process.exit(1);
  }

  const users: { email: string; name: string; role: Role }[] = [];
  for (let i = 0; i < args.length; i += 3) {
    const role = args[i + 2].toUpperCase() as Role;
    if (!VALID_ROLES.includes(role)) {
      console.error(`Perfil inválido para ${args[i]}: "${args[i + 2]}". Use: ${VALID_ROLES.join(" | ")}`);
      process.exit(1);
    }
    users.push({ email: args[i], name: args[i + 1], role });
  }

  console.log("\n=== CRIANDO USUÁRIOS ===\n");
  for (const u of users) {
    const existing = await findUserByEmail(u.email);
    if (existing) {
      console.log(`⏭️  ${u.email} já existe — pulando`);
      continue;
    }
    const pwd = genPassword();
    await createUser(u.email, u.name, pwd, u.role);
    console.log(`✅ Criado:`);
    console.log(`   Nome: ${u.name}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Perfil: ${u.role}`);
    console.log(`   Senha temporária: ${pwd}`);
    console.log();
  }

  console.log("Pronto. Guarde as senhas temporárias e envie aos usuários.\n");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
