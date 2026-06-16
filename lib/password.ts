/**
 * Política de senha (OWASP A07:2025 / NIST 800-63B).
 * Sem dependências de DB/auth para evitar ciclos de import — usada por lib/db.ts e pelas rotas.
 *
 * Regras:
 *  - mínimo 12 caracteres (bcrypt limita a 72 bytes);
 *  - não pode conter o e-mail do usuário;
 *  - bloqueia uma lista curta de senhas óbvias;
 *  - SEM regras de composição obrigatórias e SEM expiração periódica (a "temporariedade"
 *    é da CONTA via access_expires_at, não da senha).
 */

const COMMON_PASSWORDS = new Set([
  "123456789012", "senha12345678", "password1234", "qwerty123456",
  "123456789", "12345678", "password", "senha1234", "b4gestao123",
  "administrador", "111111111111", "abcdefghijkl",
]);

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_BYTES = 72; // limite do bcrypt

export function validatePasswordPolicy(
  password: string,
  ctx: { email: string; name?: string }
): string | null {
  const bytes = Buffer.byteLength(password, "utf8");
  if (bytes < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (bytes > MAX_PASSWORD_BYTES) {
    return `A senha é muito longa (máximo ${MAX_PASSWORD_BYTES} caracteres).`;
  }
  const low = password.toLowerCase();
  const local = ctx.email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 3 && low.includes(local)) {
    return "A senha não pode conter o seu e-mail.";
  }
  if (COMMON_PASSWORDS.has(low)) {
    return "Essa senha é muito comum. Escolha uma mais difícil de adivinhar.";
  }
  return null;
}
