import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { sql, initDb } from "@/lib/db";

export const runtime = "nodejs";

interface RecentActivity {
  type: "lead" | "stress" | "pulse_response" | "esocial_upload" | "stress_invite";
  label: string;
  meta: string;
  at: string;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "DB não configurado" }, { status: 500 });

  await initDb();

  // ---- KPIs principais ----
  const now = new Date();
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);
  const last7 = new Date(now); last7.setDate(now.getDate() - 7);
  const last30Str = last30.toISOString();
  const last7Str = last7.toISOString();

  const [
    companiesTotal,
    leadsTotal,
    leads30d,
    leads7d,
    pulseCampaigns,
    pulseResponses,
    stressAudits,
    stressAudits30d,
    esocialAlerts,
    esocialCritical,
    esocialUploads,
    pendingInvites,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM companies WHERE merged_into_id IS NULL`,
    sql`SELECT COUNT(*)::int AS n FROM submissions WHERE deleted_at IS NULL`,
    sql`SELECT COUNT(*)::int AS n FROM submissions WHERE deleted_at IS NULL AND criado_em >= ${last30Str}`,
    sql`SELECT COUNT(*)::int AS n FROM submissions WHERE deleted_at IS NULL AND criado_em >= ${last7Str}`,
    sql`SELECT COUNT(*)::int AS n FROM pulse_campaigns`,
    sql`SELECT COUNT(*)::int AS n FROM pulse_responses`,
    sql`SELECT COUNT(*)::int AS n FROM stress_test_audits WHERE deleted_at IS NULL`,
    sql`SELECT COUNT(*)::int AS n FROM stress_test_audits WHERE deleted_at IS NULL AND created_at >= ${last30Str}`,
    sql`SELECT COUNT(*)::int AS n FROM esocial_alerts WHERE resolved = FALSE`,
    sql`SELECT COUNT(*)::int AS n FROM esocial_alerts WHERE resolved = FALSE AND severity = 'critical'`,
    sql`SELECT COUNT(*)::int AS n FROM esocial_uploads`,
    sql`SELECT COUNT(*)::int AS n FROM stress_test_invites WHERE status = 'open'`,
  ]);

  // ---- Distribuição de semáforo (Stress Test) ----
  const semaforos = await sql`
    SELECT semaforo, COUNT(*)::int AS n
    FROM stress_test_audits
    WHERE deleted_at IS NULL
    GROUP BY semaforo
  `;
  const semaforoBreakdown: Record<string, number> = { VERDE: 0, AMARELO: 0, VERMELHO: 0 };
  for (const row of semaforos as unknown as Array<{ semaforo: string; n: number }>) {
    semaforoBreakdown[row.semaforo] = row.n;
  }

  // ---- Séries REAIS para os gráficos do dashboard ----
  const sixMonths = new Date(now); sixMonths.setMonth(now.getMonth() - 5); sixMonths.setDate(1);
  const sixMonthsStr = sixMonths.toISOString();

  const [leadsMonthlyRaw, regiaoRaw, aepRaw] = await Promise.all([
    sql`SELECT to_char(date_trunc('month', criado_em),'YYYY-MM') AS ym, COUNT(*)::int AS n
        FROM submissions WHERE deleted_at IS NULL AND criado_em >= ${sixMonthsStr} GROUP BY 1`,
    sql`SELECT regiao, COUNT(*)::int AS n FROM submissions
        WHERE deleted_at IS NULL AND regiao IS NOT NULL AND regiao <> '' GROUP BY regiao ORDER BY n DESC`,
    sql`SELECT status, COUNT(*)::int AS n FROM aep_assessments WHERE deleted_at IS NULL GROUP BY status`,
  ]);

  const monthMap: Record<string, number> = {};
  for (const r of leadsMonthlyRaw as unknown as Array<{ ym: string; n: number }>) monthMap[r.ym] = r.n;
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const leadsByMonth: Array<{ label: string; n: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    leadsByMonth.push({ label: MES[d.getMonth()], n: monthMap[ym] ?? 0 });
  }

  const leadsByRegiao = (regiaoRaw as unknown as Array<{ regiao: string; n: number }>).map((r) => ({ regiao: r.regiao, n: r.n }));

  const aepByStatus: Record<string, number> = {};
  let aepTotal = 0;
  for (const r of aepRaw as unknown as Array<{ status: string; n: number }>) { aepByStatus[r.status] = r.n; aepTotal += r.n; }

  // ---- Atividade recente (10 últimas) ----
  const recentLeads = await sql`
    SELECT empresa, nome, criado_em
    FROM submissions
    WHERE deleted_at IS NULL
    ORDER BY criado_em DESC LIMIT 5
  `;
  const recentStress = await sql`
    SELECT respondent_name, score_total, semaforo, created_at
    FROM stress_test_audits
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 5
  `;
  const recentUploads = await sql`
    SELECT filename, alerts_count, created_at
    FROM esocial_uploads
    ORDER BY created_at DESC LIMIT 3
  `;

  const activity: RecentActivity[] = [
    ...(recentLeads as unknown as Array<{ empresa: string; nome: string; criado_em: string }>)
      .map((r): RecentActivity => ({
        type: "lead",
        label: `Novo lead: ${r.nome}`,
        meta: r.empresa,
        at: new Date(r.criado_em).toISOString(),
      })),
    ...(recentStress as unknown as Array<{ respondent_name: string; score_total: number; semaforo: string; created_at: string }>)
      .map((r): RecentActivity => ({
        type: "stress",
        label: `Stress Test · ${r.respondent_name}`,
        meta: `Score ${r.score_total}/100 · ${r.semaforo}`,
        at: new Date(r.created_at).toISOString(),
      })),
    ...(recentUploads as unknown as Array<{ filename: string; alerts_count: number; created_at: string }>)
      .map((r): RecentActivity => ({
        type: "esocial_upload",
        label: `eSocial upload: ${r.filename}`,
        meta: `${r.alerts_count} alerta(s) gerado(s)`,
        at: new Date(r.created_at).toISOString(),
      })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  return NextResponse.json({
    kpis: {
      companies: (companiesTotal[0] as { n: number }).n,
      leadsTotal: (leadsTotal[0] as { n: number }).n,
      leads30d: (leads30d[0] as { n: number }).n,
      leads7d: (leads7d[0] as { n: number }).n,
      pulseCampaigns: (pulseCampaigns[0] as { n: number }).n,
      pulseResponses: (pulseResponses[0] as { n: number }).n,
      stressAudits: (stressAudits[0] as { n: number }).n,
      stressAudits30d: (stressAudits30d[0] as { n: number }).n,
      esocialAlerts: (esocialAlerts[0] as { n: number }).n,
      esocialCritical: (esocialCritical[0] as { n: number }).n,
      esocialUploads: (esocialUploads[0] as { n: number }).n,
      pendingStressInvites: (pendingInvites[0] as { n: number }).n,
    },
    semaforoBreakdown,
    leadsByMonth,
    leadsByRegiao,
    aep: { total: aepTotal, byStatus: aepByStatus },
    activity,
  });
}
