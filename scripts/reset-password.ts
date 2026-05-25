/**
 * Reseta senha de um usuário admin pra uma nova senha temporária.
 * Marca must_change_password = TRUE pra forçar troca no próximo login.
 *
 * Uso: npx tsx scripts/reset-password.ts <email>
 */
import crypto from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: tsx scripts/reset-password.ts <email>");
    process.exit(1);
  }

  const { sql, findUserByEmail } = await import("../lib/db");
  if (!sql) {
    console.error("DB não configurado");
    process.exit(1);
  }

  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`Usuário ${email} não encontrado`);
    process.exit(1);
  }

  // Gera senha aleatória
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  let pwd = "";
  for (let i = 0; i < 12; i++) pwd += chars[bytes[i] % chars.length];

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.default.hash(pwd, 12);

  await sql`
    UPDATE admin_users
    SET password_hash = ${hash},
        must_change_password = TRUE
    WHERE email = ${email.toLowerCase()}
  `;

  console.log("\n=== SENHA RESETADA ===\n");
  console.log(`Email: ${email}`);
  console.log(`Nova senha temporária: ${pwd}`);
  console.log(`Nome: ${user.name}`);
  console.log("\nNo próximo login vai forçar trocar pra sua senha definitiva.\n");
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
