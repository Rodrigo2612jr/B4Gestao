"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineClipboardCopy,
  HiOutlineLockClosed,
  HiOutlineRefresh,
  HiOutlineDownload,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
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

  if (loading) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Carregando...</div>;
  if (!data) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Não encontrada.</div>;

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/pulse/${data.campaign.token}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/pulse" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary">
          <HiOutlineArrowLeft /> Voltar
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/pulse/${id}/report`}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            <HiOutlineDownload /> PPTX Executivo
          </a>
          <a
            href={`/api/pulse/${id}/report?variant=dashboard`}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white hover:bg-secondary/90"
          >
            <HiOutlineDownload /> PPTX Dashboard
          </a>
          <button onClick={load} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <HiOutlineRefresh /> Atualizar
          </button>
          <button onClick={toggleStatus} className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
            data.campaign.status === "open" ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          }`}>
            {data.campaign.status === "open" ? "Encerrar" : "Reabrir"}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-secondary">{data.campaign.title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {data.aggregate.totalResponses} resposta{data.aggregate.totalResponses !== 1 ? "s" : ""} · {data.campaign.areas.length} áreas · threshold {data.campaign.threshold}
        </p>

        {/* Índice global */}
        <div className={`mt-4 rounded-xl border-2 p-4 ${
          data.aggregate.globalIndex >= 4.0 ? "border-emerald-200 bg-emerald-50" :
          data.aggregate.globalIndex >= 3.0 ? "border-yellow-200 bg-yellow-50" :
          "border-red-200 bg-red-50"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ${
              data.aggregate.globalIndex >= 4.0 ? "bg-emerald-500" :
              data.aggregate.globalIndex >= 3.0 ? "bg-yellow-500" :
              "bg-red-500"
            }`}>
              {data.aggregate.globalIndex.toFixed(1)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Índice global Pulse (1-5)</p>
              <p className="text-lg font-bold text-secondary">{data.aggregate.globalLabel}</p>
              <p className="mt-0.5 text-xs text-gray-500">Média ponderada por n das áreas válidas</p>
            </div>
          </div>
        </div>

        {/* Public URL */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Link público para respondentes</p>
          <div className="mt-1 flex items-center gap-2">
            <input
              readOnly
              value={publicUrl}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-mono text-xs"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(publicUrl); push("Link copiado"); }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium hover:bg-gray-100"
              title="Copiar link"
            >
              <HiOutlineClipboardCopy />
            </button>
          </div>
        </div>
      </div>

      {/* Quick wins */}
      {data.aggregate.quickWins.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-yellow-900">Quick wins recomendados (30 dias)</h3>
          <ul className="mt-3 space-y-2">
            {data.aggregate.quickWins.map((w) => (
              <li key={w.dimension} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{w.label}</p>
                  <p className="text-xs text-gray-500">{w.reason}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                  w.pct < 40 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {w.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Drivers — top 5 perguntas mais críticas */}
      {data.aggregate.drivers && data.aggregate.drivers.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Drivers — perguntas que mais puxam o score pra baixo
          </h3>
          <p className="mt-1 text-xs text-gray-500">Top 5 com menor média de concordância (1-5).</p>
          <ul className="mt-3 space-y-2">
            {data.aggregate.drivers.map((d) => (
              <li key={d.questionId} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <span className={`flex h-10 w-12 flex-shrink-0 items-center justify-center rounded text-sm font-bold ${
                  d.avgScore < 2.5 ? "bg-red-500 text-white" :
                  d.avgScore < 3.5 ? "bg-yellow-500 text-white" :
                  "bg-emerald-500 text-white"
                }`}>
                  {d.avgScore.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{d.text}</p>
                  <p className="text-xs text-gray-500">Dimensão: {d.dimension}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* By dimension (global) */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Score por dimensão (global)</h3>
        <div className="mt-4 space-y-3">
          {Object.entries(data.aggregate.byDimension).map(([k, v]) => (
            <div key={k}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{v.label}</span>
                <span className="font-mono text-gray-500">{v.score.toFixed(1)} · {v.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div className={`h-full ${v.pct >= 75 ? "bg-emerald-500" : v.pct >= 50 ? "bg-yellow-400" : "bg-red-500"}`} style={{ width: `${v.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Heatmap por área × dimensão</h3>
          <p className="mt-1 text-xs text-gray-500">
            Áreas com menos de {data.aggregate.threshold} respostas ficam bloqueadas (anonimato).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Área</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">N</th>
                {data.aggregate.heatmap[0]?.cells.map((c) => (
                  <th key={c.dimension} className="px-2 py-2 text-center text-xs font-semibold text-gray-500" title={c.label}>
                    {abbreviate(c.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.aggregate.heatmap.map((row) => (
                <tr key={row.area}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-700">{row.area}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{row.count}</td>
                  {row.cells.map((c) => (
                    <td key={c.dimension} className="px-2 py-2 text-center">
                      {c.pct === null ? (
                        <span className="inline-flex h-8 w-12 items-center justify-center rounded text-gray-400" title="Anonimato">
                          <HiOutlineLockClosed />
                        </span>
                      ) : (
                        <span
                          className={`inline-flex h-8 w-12 items-center justify-center rounded text-xs font-bold ${cellColor(c.pct)}`}
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
  if (pct >= 50) return "bg-yellow-200 text-yellow-900";
  if (pct >= 35) return "bg-orange-300 text-orange-900";
  return "bg-red-500 text-white";
}

function abbreviate(s: string) {
  return s.length > 12 ? s.slice(0, 10) + "…" : s;
}
