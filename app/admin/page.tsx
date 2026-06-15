"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlineOfficeBuilding,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineDocumentReport,
  HiOutlineUser,
  HiOutlineUpload,
  HiOutlineArrowSmRight,
  HiOutlineLink,
  HiOutlineClipboardCheck,
} from "react-icons/hi";
import AdminShell from "./_components/AdminShell";
import { timeAgo } from "./_lib/time";
import { useToast } from "./_components/ToastProvider";
import { Sparkline, Gauge, Donut, HBars, CountUp, Reveal, type DonutSeg } from "./_components/Charts";

interface OverviewData {
  kpis: {
    companies: number; leadsTotal: number; leads30d: number; leads7d: number;
    pulseCampaigns: number; pulseResponses: number; stressAudits: number; stressAudits30d: number;
    esocialAlerts: number; esocialCritical: number; esocialUploads: number; pendingStressInvites: number;
  };
  semaforoBreakdown: { VERDE: number; AMARELO: number; VERMELHO: number };
  leadsByMonth: Array<{ label: string; n: number }>;
  leadsByRegiao: Array<{ regiao: string; n: number }>;
  aep: { total: number; byStatus: Record<string, number> };
  activity: Array<{ type: string; label: string; meta: string; at: string }>;
}

const PRIMARY = "#0e427b";
const ACTIVITY_META: Record<string, { Icon: React.ComponentType<{ className?: string }>; tone: string; bg: string }> = {
  lead: { Icon: HiOutlineUser, tone: "text-sky-600", bg: "bg-sky-50" },
  stress: { Icon: HiOutlineExclamationCircle, tone: "text-amber-600", bg: "bg-amber-50" },
  pulse_response: { Icon: HiOutlineChartBar, tone: "text-violet-600", bg: "bg-violet-50" },
  esocial_upload: { Icon: HiOutlineUpload, tone: "text-emerald-600", bg: "bg-emerald-50" },
  stress_invite: { Icon: HiOutlineLink, tone: "text-rose-600", bg: "bg-rose-50" },
};

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Visão geral">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      push("Erro ao carregar visão geral", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const k = data?.kpis;
  const semTotal = data ? data.semaforoBreakdown.VERDE + data.semaforoBreakdown.AMARELO + data.semaforoBreakdown.VERMELHO : 0;
  const aepTotal = data?.aep.total ?? 0;
  const aepAprov = data?.aep.byStatus?.aprovado ?? 0;
  const aepPct = aepTotal > 0 ? (aepAprov / aepTotal) * 100 : 0;
  const semSegments: DonutSeg[] = data ? [
    { label: "Verde", value: data.semaforoBreakdown.VERDE, color: "#10b981" },
    { label: "Amarelo", value: data.semaforoBreakdown.AMARELO, color: "#f59e0b" },
    { label: "Vermelho", value: data.semaforoBreakdown.VERMELHO, color: "#ef4444" },
  ] : [];

  return (
    <div className="space-y-6">
      <Reveal>
        <h2 className="text-2xl font-bold text-secondary" style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.025em" }}>Visão geral</h2>
        <p className="mt-1 text-sm text-gray-500">Resumo da operação · dados em tempo real.</p>
      </Reveal>

      {/* ===== KPI row ===== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Featured azul B4 · Leads com sparkline real */}
        <Reveal delay={40}>
          <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-md shadow-primary/25">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg"><HiOutlineClipboardList /></span>
                <span className="text-xs font-medium">Leads do site</span>
              </div>
              {loading || !k ? <div className="mt-4 h-9 w-16 animate-pulse rounded bg-white/20" /> : (
                <>
                  <p className="mt-2 text-4xl font-bold tabular-nums"><CountUp value={k.leadsTotal} /></p>
                  <div className="mt-2 -mx-1"><Sparkline data={(data?.leadsByMonth ?? []).map((m) => m.n)} color="rgba(255,255,255,0.9)" height={34} /></div>
                  <p className="mt-1 text-xs text-white/80">+{k.leads7d} esta semana</p>
                </>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={110}><KpiCard label="Empresas" value={k?.companies} hint="no CRM" loading={loading} icon={<HiOutlineOfficeBuilding />} tone="sky" href="/admin/companies" /></Reveal>
        <Reveal delay={180}><KpiCard label="Stress Tests" value={k?.stressAudits} hint={k ? `+${k.stressAudits30d} este mês` : ""} loading={loading} icon={<HiOutlineExclamationCircle />} tone="amber" href="/admin/stress-test" /></Reveal>
        <Reveal delay={250}><KpiCard label="Alertas eSocial" value={k?.esocialAlerts} hint={k ? `${k.esocialCritical} crítico(s)` : ""} loading={loading} icon={<HiOutlineDocumentReport />} tone={k && k.esocialCritical > 0 ? "rose" : "emerald"} href="/admin/esocial" /></Reveal>
      </div>

      {/* ===== Charts row ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal delay={120}>
          <Card title="Conclusão de AEP" subtitle="Avaliações ergonômicas aprovadas">
            {loading ? <Skeleton h={140} /> : aepTotal === 0 ? (
              <EmptyMini icon={<HiOutlineClipboardCheck />} text="Nenhuma avaliação ainda" />
            ) : (
              <div className="flex flex-col items-center">
                <Gauge value={aepPct} color={PRIMARY} />
                <p className="mt-1 text-xs text-gray-500">{aepAprov} de {aepTotal} avaliações aprovadas</p>
              </div>
            )}
          </Card>
        </Reveal>

        <Reveal delay={190}>
          <Card title="Semáforo Stress NR-1" subtitle="Distribuição por risco regulatório">
            {loading ? <Skeleton h={140} /> : semTotal === 0 ? (
              <EmptyMini icon={<HiOutlineExclamationCircle />} text="Nenhuma auditoria ainda" />
            ) : (
              <div className="flex items-center gap-4">
                <Donut segments={semSegments} centerTop={String(semTotal)} centerBottom="auditorias" />
                <div className="space-y-1.5 text-xs">
                  {semSegments.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-gray-700">{s.label}</span>
                      <span className="ml-auto font-semibold tabular-nums text-gray-500">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Reveal>

        <Reveal delay={260}>
          <Card title="Leads por região" subtitle="Origem dos contatos do site">
            {loading ? <Skeleton h={140} /> : !data || data.leadsByRegiao.length === 0 ? (
              <EmptyMini icon={<HiOutlineUser />} text="Nenhum lead com região" />
            ) : (
              <HBars data={data.leadsByRegiao.map((r) => ({ label: r.regiao, n: r.n }))} color={PRIMARY} />
            )}
          </Card>
        </Reveal>
      </div>

      {/* ===== Activity + resumo ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal delay={150} className="lg:col-span-2">
          <Card title="Atividade recente" subtitle="Últimas ações na operação">
            {loading || !data ? <Skeleton h={200} /> : data.activity.length === 0 ? (
              <EmptyMini icon={<HiOutlineClipboardList />} text="Nenhuma atividade ainda" />
            ) : (
              <ul className="-mx-1 divide-y divide-gray-50">
                {data.activity.map((a, idx) => {
                  const m = ACTIVITY_META[a.type] ?? ACTIVITY_META.lead;
                  return (
                    <li key={idx} className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-gray-50/70">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${m.bg} ${m.tone}`}><m.Icon className="text-base" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{a.label}</p>
                        <p className="truncate text-xs text-gray-500">{a.meta}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-gray-400">{timeAgo(a.at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </Reveal>

        {/* Card navy de resumo (dados reais) */}
        <Reveal delay={220}>
          <div className="relative h-full overflow-hidden rounded-2xl p-6 text-white shadow-md shadow-primary/25" style={{ background: "linear-gradient(135deg,#0A1F3D 0%,#0e427b 100%)" }}>
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-accent/15 blur-2xl" />
            <div className="relative">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/80">Operação NR-1</h3>
              <p className="mt-1 text-xs text-white/60">Resumo dos módulos ativos</p>
              <div className="mt-5 space-y-4">
                <MiniStat label="Respostas Pulse" value={k?.pulseResponses} hint={k ? `${k.pulseCampaigns} campanha(s)` : ""} loading={loading} />
                <MiniStat label="Uploads eSocial" value={k?.esocialUploads} hint="processados" loading={loading} />
                <MiniStat label="Convites pendentes" value={k?.pendingStressInvites} hint="Stress aguardando" loading={loading} />
              </div>
              <Link href="/admin/companies" className="mt-6 inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25">
                Ver empresas <HiOutlineArrowSmRight />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ============================================================
const TONES: Record<string, { bg: string; text: string }> = {
  sky: { bg: "bg-sky-50", text: "text-sky-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
};

function KpiCard({ label, value, hint, loading, icon, tone, href }: {
  label: string; value?: number; hint?: string; loading?: boolean; icon: React.ReactNode; tone: string; href?: string;
}) {
  const t = TONES[tone] ?? TONES.sky;
  const inner = (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${t.bg} ${t.text}`}>{icon}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      {loading ? <div className="mt-4 h-9 w-12 animate-pulse rounded bg-gray-100" /> : (
        <>
          <p className="mt-3 text-4xl font-bold tabular-nums text-secondary">{value != null ? <CountUp value={value} /> : "-"}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </>
      )}
    </div>
  );
  if (href) return <Link href={href} className="block h-full">{inner}</Link>;
  return inner;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value, hint, loading }: { label: string; value?: number; hint?: string; loading?: boolean }) {
  return (
    <div className="flex items-end justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <div>
        <p className="text-xs text-white/70">{label}</p>
        {hint && <p className="text-[11px] text-white/50">{hint}</p>}
      </div>
      {loading ? <div className="h-6 w-8 animate-pulse rounded bg-white/20" /> : <p className="text-2xl font-bold tabular-nums">{value != null ? <CountUp value={value} /> : "-"}</p>}
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="animate-pulse rounded-xl bg-gray-100" style={{ height: h }} />;
}

function EmptyMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-300">{icon}</span>
      <p className="mt-3 text-xs text-gray-400">{text}</p>
    </div>
  );
}
