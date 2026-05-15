"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlineOfficeBuilding,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineDocumentReport,
  HiOutlineLink,
  HiOutlineUser,
  HiOutlineUpload,
  HiOutlineArrowSmRight,
  HiOutlinePlus,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import AdminShell from "./_components/AdminShell";
import { timeAgo } from "./_lib/time";
import { useToast } from "./_components/ToastProvider";

interface OverviewData {
  kpis: {
    companies: number;
    leadsTotal: number;
    leads30d: number;
    leads7d: number;
    pulseCampaigns: number;
    pulseResponses: number;
    stressAudits: number;
    stressAudits30d: number;
    esocialAlerts: number;
    esocialCritical: number;
    esocialUploads: number;
    pendingStressInvites: number;
  };
  semaforoBreakdown: { VERDE: number; AMARELO: number; VERMELHO: number };
  activity: Array<{ type: string; label: string; meta: string; at: string }>;
}

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
  const [now, setNow] = useState(new Date());
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error();
      setData(await res.json());
      setNow(new Date());
    } catch {
      push("Erro ao carregar visão geral", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const totalAudits = data ? data.semaforoBreakdown.VERDE + data.semaforoBreakdown.AMARELO + data.semaforoBreakdown.VERMELHO : 0;
  const hello = greeting();

  return (
    <div className="space-y-6">
      {/* ============ HERO DARK — saudação + 4 KPIs principais ============ */}
      <section
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xl sm:p-8"
        style={{
          background: "linear-gradient(135deg, #0A1F3D 0%, #143A6B 50%, #0E427B 100%)",
        }}
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
          <h1
            className="mt-1 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.025em" }}
          >
            {hello}
          </h1>
          <p className="mt-1.5 text-sm text-slate-300">
            Um resumo do que está acontecendo na operação agora.
          </p>

          {/* KPIs em hero */}
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 lg:grid-cols-4">
            <HeroKpi
              label="Empresas"
              value={data?.kpis.companies}
              hint="no CRM"
              Icon={HiOutlineOfficeBuilding}
              href="/admin/companies"
              loading={loading}
            />
            <HeroKpi
              label="Leads do site"
              value={data?.kpis.leadsTotal}
              hint={data ? `+${data.kpis.leads7d} esta semana` : ""}
              Icon={HiOutlineClipboardList}
              href="/admin/leads"
              loading={loading}
              accent={data && data.kpis.leads7d > 0 ? "emerald" : undefined}
            />
            <HeroKpi
              label="Stress Tests"
              value={data?.kpis.stressAudits}
              hint={data ? `+${data.kpis.stressAudits30d} este mês` : ""}
              Icon={HiOutlineExclamationCircle}
              href="/admin/stress-test"
              loading={loading}
              accent="amber"
            />
            <HeroKpi
              label="Alertas eSocial"
              value={data?.kpis.esocialAlerts}
              hint={data ? `${data.kpis.esocialCritical} crítico(s)` : ""}
              Icon={HiOutlineDocumentReport}
              href="/admin/esocial"
              loading={loading}
              accent={data && data.kpis.esocialCritical > 0 ? "red" : undefined}
            />
          </div>
        </div>
      </section>

      {/* ============ ALERT BAR (só aparece se há alertas críticos) ============ */}
      {!loading && data && data.kpis.esocialCritical > 0 && (
        <section className="flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <HiOutlineExclamationCircle className="text-2xl" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-900">
              {data.kpis.esocialCritical} alerta(s) crítico(s) ativo(s) no eSocial
            </p>
            <p className="text-xs text-red-700">
              Eventos como CIDs psicossociais ou agentes LINACH detectados — exigem atenção imediata.
            </p>
          </div>
          <Link
            href="/admin/esocial"
            className="flex-shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Revisar
          </Link>
        </section>
      )}

      {/* ============ MAIN GRID ============ */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Coluna esquerda — atividade + semáforo (2/3) */}
        <div className="space-y-5 lg:col-span-2">
          {/* Atividade recente — bg branco com header colorido */}
          <Panel
            title="Atividade recente"
            subtitle="Últimas 10 ações"
            badge={data && data.activity.length > 0 ? String(data.activity.length) : undefined}
          >
            {loading || !data ? (
              <ActivitySkeleton />
            ) : data.activity.length === 0 ? (
              <p className="px-5 py-14 text-center text-sm text-gray-400">Nenhuma atividade ainda.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.activity.map((a, idx) => {
                  const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.lead;
                  return (
                    <li key={idx} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.tone}`}>
                        <meta.Icon className="text-base" />
                      </div>
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
          </Panel>

          {/* Distribuição Stress Test — TINTADO com background sutil */}
          <section className="overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/40 via-white to-white">
            <header className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-5 py-3.5">
              <div>
                <h2 className="text-sm font-bold text-amber-900">Distribuição Stress Test</h2>
                <p className="text-xs text-amber-700/70">Por semáforo regulatório NR-1</p>
              </div>
              <Link href="/admin/stress-test" className="text-xs font-semibold text-amber-900 hover:text-amber-700">
                Ver todos →
              </Link>
            </header>
            <div className="px-5 py-5">
              {loading || !data ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-amber-100/50" />)}
                </div>
              ) : totalAudits === 0 ? (
                <p className="py-8 text-center text-sm text-amber-700/60">Nenhuma auditoria realizada ainda.</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "VERDE", count: data.semaforoBreakdown.VERDE, fill: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-900", desc: "Conformidade sólida (80-100)" },
                    { label: "AMARELO", count: data.semaforoBreakdown.AMARELO, fill: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-900", desc: "Lacunas relevantes (55-79)" },
                    { label: "VERMELHO", count: data.semaforoBreakdown.VERMELHO, fill: "bg-red-500", bg: "bg-red-50", text: "text-red-900", desc: "Exposição crítica (0-54)" },
                  ].map((s) => {
                    const pct = totalAudits > 0 ? (s.count / totalAudits) * 100 : 0;
                    return (
                      <div key={s.label} className={`rounded-lg ${s.bg} p-3`}>
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                            <span className="ml-2 text-[11px] text-gray-500">{s.desc}</span>
                          </div>
                          <span className="font-mono text-sm font-bold tabular-nums text-gray-900">
                            {s.count} <span className="text-gray-400">· {pct.toFixed(0)}%</span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60">
                          <div className={`h-full ${s.fill} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Coluna direita (1/3) */}
        <div className="space-y-5">
          {/* Saúde do sistema — bg slate sutil */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
            <header className="border-b border-slate-200 bg-white px-5 py-3.5">
              <h2 className="text-sm font-bold text-slate-900">Saúde do sistema</h2>
              <p className="text-xs text-slate-500">Métricas operacionais</p>
            </header>
            <ul className="divide-y divide-slate-200">
              <HealthRow Icon={HiOutlineChartBar} label="Pulse — respostas" value={data?.kpis.pulseResponses} hint={data ? `${data.kpis.pulseCampaigns} campanha(s)` : ""} loading={loading} tone="text-violet-600" bg="bg-violet-100" />
              <HealthRow Icon={HiOutlineDocumentReport} label="eSocial — uploads" value={data?.kpis.esocialUploads} hint="processados" loading={loading} tone="text-emerald-600" bg="bg-emerald-100" />
              <HealthRow Icon={HiOutlineLink} label="Convites pendentes" value={data?.kpis.pendingStressInvites} hint="Stress aguardando" loading={loading} tone="text-rose-600" bg="bg-rose-100" />
              <HealthRow Icon={HiOutlineUser} label="Leads (30d)" value={data?.kpis.leads30d} hint="último mês" loading={loading} tone="text-sky-600" bg="bg-sky-100" />
            </ul>
          </section>

          {/* Ações rápidas — com bg suave navy */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <header className="flex items-center gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
              <HiOutlineLightningBolt className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Ações rápidas</h2>
            </header>
            <div className="divide-y divide-slate-100">
              {[
                { href: "/admin/companies", label: "Buscar empresa", desc: "Por CNPJ ou nome", Icon: HiOutlineOfficeBuilding, tone: "text-sky-600", bg: "bg-sky-50" },
                { href: "/admin/stress-test/new", label: "Nova auditoria Stress", desc: "Wizard 25 perguntas", Icon: HiOutlinePlus, tone: "text-amber-600", bg: "bg-amber-50" },
                { href: "/admin/pulse/new", label: "Nova pesquisa Pulse", desc: "Diagnóstico psicossocial", Icon: HiOutlinePlus, tone: "text-violet-600", bg: "bg-violet-50" },
                { href: "/admin/esocial", label: "Upload eSocial", desc: "XML / ZIP / CSV", Icon: HiOutlineUpload, tone: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${s.bg} ${s.tone}`}>
                    <s.Icon className="text-base" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{s.label}</p>
                    <p className="truncate text-xs text-gray-500">{s.desc}</p>
                  </div>
                  <HiOutlineArrowSmRight className="text-base text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-700" />
                </Link>
              ))}
            </div>
          </section>

          {/* CTA / Status do produto */}
          <div className="relative overflow-hidden rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" }}>
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/20 px-2 py-0.5">
                <HiOutlineLightningBolt className="text-xs text-amber-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Briefing v3</span>
              </div>
              <h3 className="mt-3 text-sm font-bold">Sistema 100% implementado</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Stress Test oficial · Camada temporal eSocial · Painel Custo Previsível · Narrativa local (sem IA).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// Components
// ============================================================

function HeroKpi({
  label,
  value,
  hint,
  Icon,
  href,
  loading,
  accent,
}: {
  label: string;
  value: number | undefined;
  hint?: string;
  Icon: React.ComponentType<{ className?: string }>;
  href?: string;
  loading?: boolean;
  accent?: "emerald" | "amber" | "red";
}) {
  const accentColor =
    accent === "emerald" ? "text-emerald-300"
    : accent === "amber" ? "text-amber-300"
    : accent === "red" ? "text-red-300"
    : "text-slate-400";

  const inner = (
    <div className="group flex h-full flex-col bg-slate-900/40 p-5 backdrop-blur transition-colors hover:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <Icon className="text-lg text-slate-400" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
      </div>
      <div className="mt-4 flex-1">
        {loading ? (
          <div className="h-9 w-20 animate-pulse rounded bg-white/10" />
        ) : (
          <p className="font-mono text-[36px] font-bold leading-none tabular-nums text-white" style={{ letterSpacing: "-0.03em" }}>
            {value ?? "—"}
          </p>
        )}
        {hint && <p className={`mt-2 text-xs ${accentColor}`}>{hint}</p>}
      </div>
      {href && (
        <p className="mt-3 inline-flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-amber-300">
          Detalhes <HiOutlineArrowSmRight className="text-sm transition-transform group-hover:translate-x-0.5" />
        </p>
      )}
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

function Panel({
  title,
  subtitle,
  badge,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {badge && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              {badge}
            </span>
          )}
        </div>
        {subtitle && !action && <p className="text-xs text-slate-500">{subtitle}</p>}
        {action}
      </header>
      {children}
    </section>
  );
}

function HealthRow({
  Icon,
  label,
  value,
  hint,
  loading,
  tone,
  bg,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  hint?: string;
  loading?: boolean;
  tone: string;
  bg: string;
}) {
  return (
    <li className="flex items-center gap-3 bg-white px-5 py-3">
      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${bg} ${tone}`}>
        <Icon className="text-base" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
      {loading ? (
        <div className="h-5 w-8 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="font-mono text-base font-bold tabular-nums text-slate-900">{value ?? "—"}</p>
      )}
    </li>
  );
}

function ActivitySkeleton() {
  return (
    <ul className="divide-y divide-slate-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="flex items-center gap-3 px-5 py-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-1">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada.";
  if (h < 12) return "Bom dia.";
  if (h < 18) return "Boa tarde.";
  return "Boa noite.";
}
