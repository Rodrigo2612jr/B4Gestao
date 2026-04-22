/**
 * Run: npx tsx scripts/setup-users.ts <email1> <name1> <email2> <name2>
 * Creates 2 admin users with random temporary passwords.
 * Prints the passwords — save them, they're shown once.
 */
import crypto from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createUser, findUserByEmail } from "../lib/db";

function genPassword(): string {
  // 12 chars: mix letters + numbers, no ambiguous chars
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 4 || args.length % 2 !== 0) {
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
    console.log(`   (será solicitada troca no primeiro login)\n`);
  }

  console.log("Pronto. Guarde as senhas temporárias e envie aos usuários.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
