"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineClipboardCopy,
  HiOutlineLockClosed,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import KpiTile from "../../_components/KpiTile";
import { useToast } from "../../_components/ToastProvider";

interface Data {
  campaign: {
    id: string;
    companyId: string;
    title: string;
    token: string;
    areas: string[];
    threshold: number;
    status: "open" | "closed";
    createdAt: string;
  };
  aggregate: {
    totalResponses: number;
    threshold: number;
    globalIndex: number;
    globalLabel: string;
    byDimension: Record<string, { score: number; pct: number; count: number; label: string }>;
    quickWins: Array<{ dimension: string; label: string; pct: number; reason: string }>;
    drivers: Array<{ questionId: string; text: string; avgScore: number; dimension: string }>;
    heatmap: Array<{
      area: string;
      blocked: boolean;
      count: number;
      cells: Array<{ dimension: string; label: string; pct: number | null }>;
    }>;
  };
}

export default function PulseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell title="Resultados da pesquisa">
      <Inner id={id} />
    </AdminShell>
  );
}

function Inner({ id }: { id: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pulse/${id}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      push("Erro ao carregar", "error");
    } finally {
      setLoading(false);
    }
  }, [id, push]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async () => {
    if (!data) return;
    const next = data.campaign.status === "open" ? "closed" : "open";
    const res = await fetch(`/api/pulse/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) { push(next === "open" ? "Pesquisa reaberta" : "Pesquisa encerrada"); load(); }
  };

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="b4-card h-28 animate-pulse bg-b4-surface-2" />
      ))}
    </div>
  );
  if (!data) return (
    <div className="b4-card p-12 text-center text-sm text-b4-ink-2">
      Pesquisa não encontrada.
    </div>
  );

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/pulse/${data.campaign.token}` : "";

  return (
    <div className="space-y-6">
      {/* Navegacao e acoes */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/pulse" className="inline-flex items-center gap-1.5 text-sm font-medium text-b4-ink-2 hover:text-b4-navy">
          <HiOutlineArrowLeft /> Voltar para Pulse
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/pulse/${id}/report`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-b4-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-b4-navy-deep"
          >
            <HiOutlineDownload /> PPTX Executivo
          </a>
          <a
            href={`/api/pulse/${id}/report?variant=dashboard`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2"
          >
            <HiOutlineDownload /> PPTX Dashboard
          </a>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2"
          >
            <HiOutlineRefresh /> Atualizar
          </button>
          <button
            onClick={toggleStatus}
            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
              data.campaign.status === "open"
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {data.campaign.status === "open" ? "Encerrar pesquisa" : "Reabrir pesquisa"}
          </button>
        </div>
      </div>

      {/* Header da campanha */}
      <div className="b4-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-bold text-b4-ink"
              style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.025em" }}
            >
              {data.campaign.title}
            </h2>
            <p className="mt-1 text-sm text-b4-ink-2">
              {data.campaign.areas.length} áreas · threshold {data.campaign.threshold}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold ${
            data.campaign.status === "open"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-b4-surface-2 text-b4-ink-2"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${data.campaign.status === "open" ? "bg-emerald-500" : "bg-b4-ink-3"}`} />
            {data.campaign.status === "open" ? "Aberta" : "Encerrada"}
          </span>
        </div>

        {/* Link publico */}
        <div className="mt-5 rounded-xl border border-b4-line bg-b4-surface-2 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-b4-ink-3">Link público para respondentes</p>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              readOnly
              value={publicUrl}
              className="flex-1 rounded-xl border border-b4-line bg-b4-surface px-3 py-1.5 font-mono text-xs text-b4-ink outline-none"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(publicUrl); push("Link copiado"); }}
              className="rounded-xl border border-b4-line bg-b4-surface px-3 py-1.5 text-xs font-medium text-b4-ink-2 hover:bg-b4-surface-2"
              title="Copiar link"
              aria-label="Copiar link público"
            >
              <HiOutlineClipboardCopy />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiTile
          label="Respostas coletadas"
          value={data.aggregate.totalResponses}
          icon={<HiOutlineChartBar />}
          featured
        />
        <KpiTile
          label="Índice global (1-5)"
          value={data.aggregate.globalIndex.toFixed(1)}
          hint={data.aggregate.globalLabel}
          icon={<HiOutlineCheckCircle />}
          tone={data.aggregate.globalIndex >= 4.0 ? "emerald" : data.aggregate.globalIndex >= 3.0 ? "amber" : "rose"}
        />
        <KpiTile
          label="Áreas monitoradas"
          value={data.campaign.areas.length}
          icon={<HiOutlineClock />}
          tone="sky"
        />
      </div>

      {/* Quick wins */}
      {data.aggregate.quickWins.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="border-b border-amber-100 px-5 py-4">
            <h3 className="text-sm font-bold text-amber-900">Quick wins recomendados (30 dias)</h3>
            <p className="mt-0.5 text-xs text-amber-700/70">Dimensoes com maior potencial de melhoria imediata.</p>
          </div>
          <ul className="divide-y divide-amber-100/60 p-2">
            {data.aggregate.quickWins.map((w) => (
              <li key={w.dimension} className="flex items-center justify-between gap-3 rounded-xl bg-b4-surface p-3.5 my-1 mx-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-b4-ink">{w.label}</p>
                  <p className="text-xs text-b4-ink-2">{w.reason}</p>
                </div>
                <span className={`flex-shrink-0 rounded-xl px-2.5 py-0.5 text-xs font-mono font-bold ${
                  w.pct < 40 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
                }`}>
                  {w.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Drivers */}
      {data.aggregate.drivers && data.aggregate.drivers.length > 0 && (
        <div className="b4-card overflow-hidden">
          <div className="border-b border-b4-line px-5 py-4">
            <h3 className="text-sm font-bold text-b4-ink">Drivers · perguntas que mais puxam o score pra baixo</h3>
            <p className="mt-0.5 text-xs text-b4-ink-2">Top 5 com menor média de concordância (1-5).</p>
          </div>
          <ul className="divide-y divide-b4-line p-4 space-y-2">
            {data.aggregate.drivers.map((d) => (
              <li key={d.questionId} className="flex items-center gap-3 rounded-xl bg-b4-surface-2 p-3.5">
                <span className={`flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                  d.avgScore < 2.5 ? "bg-red-500 text-white" :
                  d.avgScore < 3.5 ? "bg-amber-400 text-white" :
                  "bg-emerald-500 text-white"
                }`}>
                  {d.avgScore.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-b4-ink">{d.text}</p>
                  <p className="text-xs text-b4-ink-3">Dimensão: {d.dimension}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score por dimensao */}
      <div className="b4-card overflow-hidden">
        <div className="border-b border-b4-line px-5 py-4">
          <h3 className="text-sm font-bold text-b4-ink">Score por dimensão (global)</h3>
        </div>
        <div className="space-y-4 p-5">
          {Object.entries(data.aggregate.byDimension).map(([k, v]) => (
            <div key={k}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-b4-ink-2">{v.label}</span>
                <span className="font-mono text-xs text-b4-ink-3">{v.score.toFixed(1)} · {v.pct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-b4-surface-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    v.pct >= 75 ? "bg-emerald-500" : v.pct >= 50 ? "bg-amber-400" : "bg-red-500"
                  }`}
                  style={{ width: `${v.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="b4-card overflow-hidden">
        <div className="border-b border-b4-line px-5 py-4">
          <h3 className="text-sm font-bold text-b4-ink">Heatmap por área x dimensão</h3>
          <p className="mt-0.5 text-xs text-b4-ink-2">
            Áreas com menos de {data.aggregate.threshold} respostas ficam bloqueadas (anonimato).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-b4-line text-left text-[11px] uppercase tracking-wider text-b4-ink-3">
                <th className="px-5 py-3 font-semibold">Área</th>
                <th className="px-5 py-3 font-semibold">N</th>
                {data.aggregate.heatmap[0]?.cells.map((c) => (
                  <th key={c.dimension} className="px-2 py-3 text-center font-semibold" title={c.label}>
                    {abbreviate(c.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.aggregate.heatmap.map((row) => (
                <tr key={row.area} className="border-b border-b4-line last:border-0 hover:bg-b4-surface-2">
                  <td className="px-5 py-3 text-sm font-semibold text-b4-ink">{row.area}</td>
                  <td className="px-5 py-3 text-xs text-b4-ink-3">{row.count}</td>
                  {row.cells.map((c) => (
                    <td key={c.dimension} className="px-2 py-2 text-center">
                      {c.pct === null ? (
                        <span
                          className="inline-flex h-8 w-12 items-center justify-center rounded-xl text-b4-ink-3"
                          title="Anonimato"
                        >
                          <HiOutlineLockClosed />
                        </span>
                      ) : (
                        <span
                          className={`inline-flex h-8 w-12 items-center justify-center rounded-xl text-xs font-bold ${cellColor(c.pct)}`}
                          title={`${c.label}: ${c.pct}%`}
                        >
                          {c.pct}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cellColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500 text-white";
  if (pct >= 65) return "bg-emerald-200 text-emerald-900";
  if (pct >= 50) return "bg-amber-200 text-amber-900";
  if (pct >= 35) return "bg-orange-300 text-orange-900";
  return "bg-red-500 text-white";
}

function abbreviate(s: string) {
  return s.length > 12 ? s.slice(0, 10) + "…" : s;
}
