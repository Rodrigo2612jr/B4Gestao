/**
 * Run: npx tsx scripts/setup-users.ts <email1> <name1> <email2> <name2>
 * Creates 2 admin users with random temporary passwords.
 */
import crypto from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

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
  if (args.length < 2 || args.length % 2 !== 0) {
    console.error("Usage: tsx scripts/setup-users.ts <email1> <name1> [<email2> <name2> ...]");
    process.exit(1);
  }

  const users: { email: string; name: string }[] = [];
  for (let i = 0; i < args.length; i += 2) {
    users.push({ email: args[i], name: args[i + 1] });
  }

  console.log("\n=== CRIANDO USUÁRIOS ===\n");
  for (const u of users) {
    const existing = await findUserByEmail(u.email);
    if (existing) {
      console.log(`⏭️  ${u.email} já existe — pulando`);
      continue;
    }
    const pwd = genPassword();
    await createUser(u.email, u.name, pwd);
    console.log(`✅ Criado:`);
    console.log(`   Nome: ${u.name}`);
    console.log(`   Email: ${u.email}`);
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
