import type { Submission } from "./db";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAILS = (process.env.NOTIFY_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FROM_EMAIL = process.env.FROM_EMAIL ?? "B4 Gestão <onboarding@resend.dev>";

function escHtml(v: string | null | undefined): string {
  return (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderLeadHtml(s: Submission): string {
  const cnpj = s.cnpj ? escHtml(s.cnpj) : "—";
  const recebido = new Date(s.criado_em).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const phoneDigits = s.telefone.replace(/\D/g, "");
  const phoneFormatted =
    phoneDigits.length === 11
      ? `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 7)}-${phoneDigits.slice(7)}`
      : phoneDigits.length === 10
      ? `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 6)}-${phoneDigits.slice(6)}`
      : escHtml(s.telefone);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo lead — B4 Gestão</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1a2332;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,26,82,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e427b 0%,#021a52 100%);padding:32px 32px 28px;">
              <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:1.5px;color:#7ed957;text-transform:uppercase;">Novo lead recebido</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
                ${escHtml(s.empresa)}
              </h1>
            </td>
          </tr>

          <!-- Quick info -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.8px;color:#9ca3af;text-transform:uppercase;">Responsável</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#1a2332;">${escHtml(s.nome)}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.8px;color:#9ca3af;text-transform:uppercase;">Telefone</p>
                    <p style="margin:0;font-size:16px;font-weight:600;">
                      <a href="https://wa.me/55${phoneDigits}" style="color:#0e427b;text-decoration:none;">${phoneFormatted}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:8px 32px;">
              <div style="height:1px;background:#e5e7eb;"></div>
            </td>
          </tr>

          <!-- Details grid -->
          <tr>
            <td style="padding:16px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
                <tr>
                  <td style="padding:10px 0;width:130px;color:#6b7280;font-size:13px;">CNPJ</td>
                  <td style="padding:10px 0;color:#1a2332;font-weight:500;">${cnpj}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:13px;">Região</td>
                  <td style="padding:10px 0;color:#1a2332;font-weight:500;">${escHtml(s.regiao)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:13px;">Porte</td>
                  <td style="padding:10px 0;color:#1a2332;font-weight:500;">${escHtml(s.funcionarios)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:13px;vertical-align:top;">Necessidade</td>
                  <td style="padding:10px 0;">
                    <span style="display:inline-block;background:#e8f0fa;color:#0e427b;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;">${escHtml(s.necessidade)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:13px;">Recebido em</td>
                  <td style="padding:10px 0;color:#1a2332;font-weight:500;">${escHtml(recebido)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTAs -->
          <tr>
            <td style="padding:24px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:6px;width:50%;">
                    <a href="https://wa.me/55${phoneDigits}" style="display:block;background:#25d366;color:#ffffff;text-align:center;padding:14px 16px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
                      Abrir WhatsApp
                    </a>
                  </td>
                  <td style="padding-left:6px;width:50%;">
                    <a href="https://b4gestao.com.br/admin" style="display:block;background:#0e427b;color:#ffffff;text-align:center;padding:14px 16px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
                      Ver no painel
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Backup automático do formulário do site.<br>
                Os dados também estão salvos no painel administrativo.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#c4c9d0;">
                <strong style="color:#9ca3af;">B4 Gestão Ocupacional</strong> · b4gestao.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderLeadText(s: Submission): string {
  const recebido = new Date(s.criado_em).toLocaleString("pt-BR");
  const cnpj = s.cnpj || "—";
  return [
    `Novo lead recebido — B4 Gestão Ocupacional`,
    ``,
    `Empresa: ${s.empresa}`,
    `Responsável: ${s.nome}`,
    `Telefone: ${s.telefone}`,
    `CNPJ: ${cnpj}`,
    `Região: ${s.regiao}`,
    `Porte: ${s.funcionarios}`,
    `Necessidade: ${s.necessidade}`,
    `Recebido: ${recebido}`,
    ``,
    `WhatsApp: https://wa.me/55${s.telefone.replace(/\D/g, "")}`,
    `Painel: https://b4gestao.com.br/admin`,
  ].join("\n");
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

  const subject = `Novo lead: ${s.empresa}`;
  const html = renderLeadHtml(s);
  const text = renderLeadText(s);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAILS,
        subject,
        html,
        text,
        headers: {
          "Content-Type": 'text/html; charset="UTF-8"',
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[email] Resend error:", res.status, errText);
    } else {
      console.log(`[email] Sent notification to ${NOTIFY_EMAILS.length} recipient(s)`);
    }
  } catch (err) {
    console.error("[email] network error:", err);
  }
}
