"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlineShieldExclamation,
  HiOutlineAdjustments,
  HiOutlineExclamation,
} from "react-icons/hi";
import AdminShell from "../../../_components/AdminShell";

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

const FAIXA_BG: Record<Faixa, string> = {
  BAIXA: "bg-emerald-50 border-emerald-200 text-emerald-900",
  MODERADA: "bg-yellow-50 border-yellow-200 text-yellow-900",
  ELEVADA: "bg-red-50 border-red-200 text-red-900",
};
const FAIXA_TAG: Record<Faixa, string> = {
  BAIXA: "bg-emerald-500 text-white",
  MODERADA: "bg-yellow-500 text-white",
  ELEVADA: "bg-red-600 text-white",
};

export default function CostPanelPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return (
    <AdminShell title="Custo Previsível (FAIXAS)">
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

  if (loading || !data) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Carregando...</div>;

  const fmtRange = (low: number, high: number) =>
    `R$ ${low.toLocaleString("pt-BR")} — R$ ${high.toLocaleString("pt-BR")}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/admin/companies/${companyId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary">
          <HiOutlineArrowLeft /> Voltar para empresa
        </Link>
        <div className="flex gap-2">
          <a
            href={`/api/esocial/dashboard-pptx/${companyId}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white hover:bg-secondary/90"
          >
            📥 PPTX Dashboard
          </a>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <HiOutlineAdjustments /> Premissas
          </button>
        </div>
      </div>

      {/* Card integridade */}
      <div className={`rounded-2xl border-2 p-6 ${
        data.integrityScore >= 80 ? "border-emerald-200 bg-emerald-50" :
        data.integrityScore >= 50 ? "border-yellow-200 bg-yellow-50" :
        "border-red-200 bg-red-50"
      }`}>
        <div className="flex items-center gap-5">
          <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white ${
            data.integrityScore >= 80 ? "bg-emerald-500" :
            data.integrityScore >= 50 ? "bg-yellow-500" :
            "bg-red-500"
          }`}>
            {data.integrityScore}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Integridade de dados SST</p>
            <h2 className="text-2xl font-bold text-secondary">{data.integrityLabel}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {data.totalAlertsActive} alerta(s) ativo(s) · {data.criticalAlerts} crítico(s)
            </p>
          </div>
        </div>
      </div>

      {/* Premissas (config) */}
      {showConfig && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Premissas parametrizáveis</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Salário base (R$)</label>
              <input type="number" value={salary} onChange={(e) => setSalary(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Alíquota FAE (decimal)</label>
              <input type="number" step="0.01" value={aliquot} onChange={(e) => setAliquot(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Janela (meses)</label>
              <input type="number" value={months} onChange={(e) => setMonths(parseInt(e.target.value) || 12)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>
          <button
            onClick={() => load({ salary, aliquot, months })}
            className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Recalcular
          </button>
        </div>
      )}

      {/* Cards de faixa */}
      <div className="grid gap-4 lg:grid-cols-3">
        {data.bands.map((b) => (
          <div key={b.category} className={`rounded-xl border-2 p-5 ${FAIXA_BG[b.faixa]}`}>
            <div className="flex items-start justify-between">
              <HiOutlineCash className="text-3xl" />
              <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${FAIXA_TAG[b.faixa]}`}>
                {b.faixa}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold uppercase tracking-wider opacity-80">{b.label}</h3>
            <p className="mt-2 text-2xl font-bold text-secondary">{fmtRange(b.rangeLow, b.rangeHigh)}</p>
            <p className="mt-1 text-xs opacity-70">FAIXA estimada / projeção</p>

            <div className="mt-4 border-t border-current/20 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Premissas</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {b.assumptions.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm">
        <p className="font-semibold text-amber-900 flex items-center gap-2">
          <HiOutlineShieldExclamation /> Disclaimer técnico
        </p>
        <p className="mt-1 text-amber-800">{data.disclaimer}</p>
      </div>

      {/* CTA acompanhamento */}
      <div className="rounded-xl bg-gradient-to-br from-primary-dark to-primary p-6 text-white shadow-lg">
        <h3 className="text-lg font-bold">Próximos passos com a B4</h3>
        <p className="mt-2 text-sm opacity-90">
          Diagnóstico aprofundado dos programas legais (PGR/NR-17/PCMSO) + validação in loco.
          Acompanhamento mensal para manter o GRO vivo e reduzir o risco de engavetamento.
        </p>
        <a href="/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-gray-100">
          Falar com especialista B4
        </a>
      </div>
    </div>
  );
}
