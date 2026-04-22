import type { Submission } from "./db";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAILS = (process.env.NOTIFY_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FROM_EMAIL = process.env.FROM_EMAIL ?? "B4 Gestão <onboarding@resend.dev>";

function renderLeadHtml(s: Submission): string {
  const esc = (v: string | null | undefined) =>
    (v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, Arial, sans-serif; background:#f8fafb; padding:20px; margin:0;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
    <div style="background:#0e427b; padding:20px; color:white;">
      <h1 style="margin:0; font-size:18px;">🎯 Novo lead recebido</h1>
      <p style="margin:4px 0 0; font-size:13px; opacity:0.8;">B4 Gestão Ocupacional</p>
    </div>
    <div style="padding:20px;">
      <h2 style="font-size:20px; margin:0 0 4px; color:#021a52;">${esc(s.empresa)}</h2>
      <p style="margin:0 0 16px; color:#696969;">${esc(s.nome)} • ${esc(s.telefone)}</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:8px 0; color:#696969; font-size:13px; width:120px;">CNPJ</td><td style="padding:8px 0; font-size:14px;">${esc(s.cnpj) || "—"}</td></tr>
        <tr><td style="padding:8px 0; color:#696969; font-size:13px;">Região</td><td style="padding:8px 0; font-size:14px;">${esc(s.regiao)}</td></tr>
        <tr><td style="padding:8px 0; color:#696969; font-size:13px;">Porte</td><td style="padding:8px 0; font-size:14px;">${esc(s.funcionarios)}</td></tr>
        <tr><td style="padding:8px 0; color:#696969; font-size:13px;">Necessidade</td><td style="padding:8px 0; font-size:14px;"><strong>${esc(s.necessidade)}</strong></td></tr>
        <tr><td style="padding:8px 0; color:#696969; font-size:13px;">Recebido</td><td style="padding:8px 0; font-size:14px;">${esc(new Date(s.criado_em).toLocaleString("pt-BR"))}</td></tr>
      </table>
      <div style="margin-top:20px; display:flex; gap:10px;">
        <a href="https://wa.me/55${s.telefone.replace(/\D/g, "")}" style="background:#25d366; color:white; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">💬 Abrir WhatsApp</a>
        <a href="https://b4gestao.com.br/admin" style="background:#0e427b; color:white; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">Ver no Painel</a>
      </div>
    </div>
    <div style="padding:12px 20px; background:#f8fafb; font-size:11px; color:#999; text-align:center;">
      Esse é um backup automático do lead. Todos os dados estão salvos no painel admin.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendNewLeadEmail(s: Submission): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY not set — skipping email notification");
    return;
  }
  if (NOTIFY_EMAILS.length === 0) {
    console.log("[email] NOTIFY_EMAILS not set — skipping");
    return;
  }

  const subject = `🎯 Novo lead: ${s.empresa}`;
  const html = renderLeadHtml(s);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAILS,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend error:", res.status, text);
    } else {
      console.log(`[email] Sent notification to ${NOTIFY_EMAILS.length} recipient(s)`);
    }
  } catch (err) {
    console.error("[email] network error:", err);
  }
}
