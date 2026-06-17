"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlineShieldExclamation,
  HiOutlineAdjustments,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import AdminShell from "../../../_components/AdminShell";
import KpiTile from "../../../_components/KpiTile";

type Faixa = "BAIXA" | "MODERADA" | "ELEVADA";

interface CostBand {
  category: string;
  label: string;
  faixa: Faixa;
  rangeLow: number;
  rangeHigh: number;
  assumptions: string[];
  driverCount: number;
}

interface Result {
  bands: CostBand[];
  integrityScore: number;
  integrityLabel: string;
  totalAlertsActive: number;
  criticalAlerts: number;
  disclaimer: string;
  config: {
    defaultSalary: number;
    faeAliquot: number;
    monthsLookback: number;
  };
}

// Cores semanticas de faixa de custo · mantidas intencionalmente
const FAIXA_BG: Record<Faixa, string> = {
  BAIXA: "bg-emerald-50 border-emerald-200",
  MODERADA: "bg-yellow-50 border-yellow-200",
  ELEVADA: "bg-red-50 border-red-200",
};
const FAIXA_TAG: Record<Faixa, string> = {
  BAIXA: "bg-emerald-100 text-emerald-800",
  MODERADA: "bg-yellow-100 text-yellow-800",
  ELEVADA: "bg-red-100 text-red-800",
};
const FAIXA_LABEL_COLOR: Record<Faixa, string> = {
  BAIXA: "text-emerald-900",
  MODERADA: "text-yellow-900",
  ELEVADA: "text-red-900",
};

export default function CostPanelPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return (
    <AdminShell title="Custo Previsivel (FAIXAS)">
      <Inner companyId={companyId} />
    </AdminShell>
  );
}

function Inner({ companyId }: { companyId: string }) {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [salary, setSalary] = useState(3500);
  const [aliquot, setAliquot] = useState(0.03);
  const [months, setMonths] = useState(12);

  const load = useCallback(async (params?: { salary?: number; aliquot?: number; months?: number }) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params?.salary) qs.set("salary", String(params.salary));
      if (params?.aliquot !== undefined) qs.set("faeAliquot", String(params.aliquot));
      if (params?.months) qs.set("months", String(params.months));
      const res = await fetch(`/api/esocial/custo-previsivel/${companyId}?${qs.toString()}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
      setSalary(d.config.defaultSalary);
      setAliquot(d.config.faeAliquot);
      setMonths(d.config.monthsLookback);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <div className="b4-card overflow-hidden">
        <div className="space-y-px">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse bg-b4-surface-2" />)}
        </div>
      </div>
    );
  }

  const fmtRange = (low: number, high: number) =>
    `R$ ${low.toLocaleString("pt-BR")} · R$ ${high.toLocaleString("pt-BR")}`;

  const integrityBg =
    data.integrityScore >= 80
      ? "border-emerald-200 bg-emerald-50"
      : data.integrityScore >= 50
      ? "border-yellow-200 bg-yellow-50"
      : "border-red-200 bg-red-50";
  const integrityCircle =
    data.integrityScore >= 80
      ? "bg-emerald-500 text-white"
      : data.integrityScore >= 50
      ? "bg-yellow-500 text-white"
      : "bg-red-500 text-white";

  return (
    <div className="space-y-7">
      {/* Navegacao */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/companies/${companyId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-b4-ink-2 transition-colors hover:text-b4-navy"
        >
          <HiOutlineArrowLeft className="text-base" /> Voltar para empresa
        </Link>
        <div className="flex gap-2">
          <a
            href={`/api/esocial/dashboard-pptx/${companyId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-b4-navy px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-b4-navy/20 transition-colors hover:bg-b4-navy-deep"
          >
            PPTX Dashboard
          </a>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 transition-colors hover:bg-b4-surface-2"
          >
            <HiOutlineAdjustments /> Premissas
          </button>
        </div>
      </div>

      {/* Header da pagina */}
      <div>
        <span className="b4-eyebrow">Custo Previsivel</span>
        <h2
          className="mt-2 text-2xl font-bold text-b4-ink"
          style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.025em" }}
        >
          Custo Previsivel · Faixas de Exposicao
        </h2>
        <p className="mt-1 text-sm text-b4-ink-2">
          Projecao de passivos trabalhistas e previdenciarios baseada nos dados do eSocial.
        </p>
      </div>

      {/* KPIs resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Score de integridade"
          value={`${data.integrityScore}/100`}
          icon={<HiOutlineCheckCircle />}
          featured
        />
        <KpiTile
          label="Alertas ativos"
          value={data.totalAlertsActive}
          icon={<HiOutlineExclamation />}
          tone="amber"
        />
        <KpiTile
          label="Alertas criticos"
          value={data.criticalAlerts}
          icon={<HiOutlineExclamation />}
          tone="rose"
        />
        <KpiTile
          label="Faixas calculadas"
          value={data.bands.length}
          icon={<HiOutlineCash />}
          tone="blue"
        />
      </div>

      {/* Card de integridade SST · cores semanticas mantidas */}
      <div className={`rounded-2xl border-2 p-6 ${integrityBg}`}>
        <div className="flex items-center gap-5">
          <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-3xl font-bold ${integrityCircle}`}>
            {data.integrityScore}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-b4-ink-2 opacity-70">
              Integridade de dados SST
            </p>
            <h3
              className="text-2xl font-bold text-b4-ink"
              style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.02em" }}
            >
              {data.integrityLabel}
            </h3>
            <p className="mt-1 text-sm text-b4-ink-2">
              {data.totalAlertsActive} alerta(s) ativo(s) &middot; {data.criticalAlerts} critico(s)
            </p>
          </div>
        </div>
      </div>

      {/* Premissas parametrizaveis */}
      {showConfig && (
        <div className="b4-card p-6">
          <h3 className="mb-4 text-sm font-bold text-b4-ink">Premissas parametrizaveis</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-b4-ink-2">Salario base (R$)</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-b4-line px-3 py-2 text-sm text-b4-ink outline-none focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-b4-ink-2">Aliquota FAE (decimal)</label>
              <input
                type="number"
                step="0.01"
                value={aliquot}
                onChange={(e) => setAliquot(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-b4-line px-3 py-2 text-sm text-b4-ink outline-none focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-b4-ink-2">Janela (meses)</label>
              <input
                type="number"
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value) || 12)}
                className="mt-1 w-full rounded-xl border border-b4-line px-3 py-2 text-sm text-b4-ink outline-none focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
              />
            </div>
          </div>
          <button
            onClick={() => load({ salary, aliquot, months })}
            className="mt-4 rounded-xl bg-b4-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-b4-navy-deep"
          >
            Recalcular
          </button>
        </div>
      )}

      {/* Cards de faixa de custo · cores semanticas mantidas */}
      <div className="grid gap-4 lg:grid-cols-3">
        {data.bands.map((b) => (
          <div
            key={b.category}
            className={`rounded-2xl border-2 p-5 ${FAIXA_BG[b.faixa]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-b4-ink-2 shadow-sm">
                <HiOutlineCash className="text-xl" />
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${FAIXA_TAG[b.faixa]}`}>
                {b.faixa}
              </span>
            </div>
            <h3 className={`mt-3 text-sm font-semibold uppercase tracking-wider ${FAIXA_LABEL_COLOR[b.faixa]} opacity-80`}>
              {b.label}
            </h3>
            <p className="mt-2 text-xl font-bold text-b4-ink" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>{fmtRange(b.rangeLow, b.rangeHigh)}</p>
            <p className="mt-0.5 text-xs text-b4-ink-2">Faixa estimada / projecao</p>

            <div className="mt-4 border-t border-b4-line pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-b4-ink-3">Premissas</p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-b4-ink-2">
                {b.assumptions.map((a, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="mt-0.5 text-b4-ink-3">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer · cor amber mantida por ser semantica (aviso legal) */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <HiOutlineShieldExclamation className="text-lg" /> Disclaimer tecnico
        </p>
        <p className="mt-1.5 text-sm text-amber-800">{data.disclaimer}</p>
      </div>

      {/* CTA B4 */}
      <div className="b4-feature p-6">
        <div className="relative">
          <h3
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.02em" }}
          >
            Proximos passos com a B4
          </h3>
          <p className="mt-2 text-sm text-white/80">
            Diagnostico aprofundado dos programas legais (PGR/NR-17/PCMSO) + validacao in loco.
            Acompanhamento mensal para manter o GRO vivo e reduzir o risco de engavetamento.
          </p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-b4-navy shadow-sm hover:bg-b4-surface-2"
          >
            Falar com especialista B4
          </a>
        </div>
      </div>
    </div>
  );
}
