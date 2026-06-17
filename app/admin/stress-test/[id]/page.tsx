"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineDownload,
  HiOutlineChevronDown,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import { useToast } from "../../_components/ToastProvider";
import type { ScoreResult } from "@/lib/stress-test/scoring";
import { QUESTIONS } from "@/lib/stress-test/questions";

interface AuditDetail {
  id: string;
  companyId: string | null;
  respondentName: string;
  respondentRole: string | null;
  answers: Record<string, "A" | "B" | "C" | "D" | "E">;
  result: ScoreResult;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

/* Semaforo · cores semanticas mantidas */
const SEMAFORO_GRADIENT: Record<string, string> = {
  VERDE:    "from-emerald-500 to-emerald-600",
  AMARELO:  "from-amber-400 to-amber-500",
  VERMELHO: "from-red-500 to-red-600",
};
const SEMAFORO_PILL: Record<string, string> = {
  VERDE:    "bg-emerald-50 text-emerald-800 border-emerald-200",
  AMARELO:  "bg-amber-50 text-amber-800 border-amber-200",
  VERMELHO: "bg-red-50 text-red-800 border-red-200",
};
const SEMAFORO_DOT: Record<string, string> = {
  VERDE:    "bg-emerald-500",
  AMARELO:  "bg-amber-400",
  VERMELHO: "bg-red-500",
};

export default function StressTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell title="Resultado da auditoria">
      <Inner id={id} />
    </AdminShell>
  );
}

function Inner({ id }: { id: string }) {
  const [data, setData] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stress-test/${id}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      push("Erro ao carregar auditoria", "error");
    } finally {
      setLoading(false);
    }
  }, [id, push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/stress-test/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: pwd }),
      });
      if (res.ok) {
        push("Auditoria excluída");
        window.location.href = "/admin/stress-test";
      } else {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Erro");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <div className="b4-card overflow-hidden p-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-b4-navy/20 border-t-b4-navy" />
        <p className="mt-4 text-sm text-b4-ink-2">Carregando auditoria...</p>
      </div>
    );

  if (!data)
    return (
      <div className="b4-card overflow-hidden p-12 text-center">
        <p className="text-sm text-b4-ink-2">Auditoria não encontrada.</p>
      </div>
    );

  const r = data.result;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/stress-test"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-b4-ink-2 transition-colors hover:text-b4-navy"
        >
          <HiOutlineArrowLeft /> Stress Test NR-1
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/stress-test/${id}/report`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-b4-navy px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-b4-navy/20 hover:bg-b4-navy-deep"
          >
            <HiOutlineDownload /> PPTX Executivo
          </a>
          <a
            href={`/api/stress-test/${id}/report?variant=dashboard`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-b4-line bg-b4-surface px-3.5 py-2 text-xs font-medium text-b4-ink-2 hover:bg-b4-surface-2"
          >
            <HiOutlineDownload /> PPTX Dashboard
          </a>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <HiOutlineTrash /> Excluir
          </button>
        </div>
      </div>

      {/* Card principal: Score + Semáforo */}
      <div className="b4-card overflow-hidden">
        <div className={`bg-gradient-to-r ${SEMAFORO_GRADIENT[r.semaforo]} p-6`}>
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold text-white shadow-inner" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>
              {r.total}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Semáforo NR-1</p>
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.02em" }}
              >
                {r.semaforoLabel}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Score {r.total}/100 · Faixa de exposição:{" "}
                <strong className="text-white">{r.faixaLabel}</strong>
              </p>
            </div>
          </div>
        </div>
        {/* Metadados do respondente dentro do card principal */}
        <div className="flex flex-wrap items-center gap-4 border-t border-b4-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-b4-navy/10 text-b4-navy">
              <HiOutlineUser className="text-base" />
            </span>
            <div>
              <p className="text-sm font-semibold text-b4-ink">{data.respondentName}</p>
              {data.respondentRole && (
                <p className="text-xs text-b4-ink-2">{data.respondentRole}</p>
              )}
            </div>
          </div>
          <div className="ml-auto text-right text-xs text-b4-ink-2">
            <p>Realizado em {new Date(data.createdAt).toLocaleString("pt-BR")}</p>
            {data.createdBy && <p className="mt-0.5">por {data.createdBy}</p>}
          </div>
        </div>
      </div>

      {/* Sub-scores grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Engavetamento */}
        <div className="b4-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-b4-ink-3">
            Risco de Engavetamento
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-bold tabular-nums text-b4-ink" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>{r.engavetamento.score}</span>
            <span className="pb-1 text-sm text-b4-ink-3">/ {r.engavetamento.max}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-b4-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-b4-navy to-b4-navy-deep"
              style={{ width: `${(r.engavetamento.score / r.engavetamento.max) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-semibold text-b4-ink">
            Classificação:{" "}
            <span className="font-normal text-b4-ink-2">{r.engavetamento.classification}</span>
          </p>
          <p className="mt-1 text-sm text-b4-ink-2">{r.engavetamento.label}</p>
          <p className="mt-2 text-xs text-b4-ink-3">
            Perguntas núcleo: Q01, Q12-Q16, Q21, Q25. Faixas: Baixo 24-32 / Médio 14-23 / Alto 0-13.
          </p>
        </div>

        {/* Coerência psicossocial */}
        <div className="b4-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-b4-ink-3">
            Coerência psicossocial
          </p>
          <p className="mt-3 text-2xl font-bold text-b4-ink" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>{r.coerencia.label}</p>
          <p className="mt-2 text-sm text-b4-ink-2">{r.coerencia.description}</p>
          <p className="mt-3 text-xs text-b4-ink-3">
            Cruzamento Q18A (afirmação) × Q18B (evidência).
          </p>
        </div>
      </div>

      {/* Por categoria */}
      <div className="b4-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-b4-ink-3">Por categoria</p>
        <div className="mt-4 space-y-4">
          {Object.entries(r.byCategory).map(([cat, b]) => {
            const barColor =
              b.pct >= 75 ? "from-emerald-400 to-emerald-500" :
              b.pct >= 50 ? "from-amber-400 to-amber-500"   :
              "from-red-400 to-red-500";
            return (
              <div key={cat}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-b4-ink-2">{categoryLabel(cat)}</span>
                  <span className="font-mono text-xs text-b4-ink-2">
                    {b.score}/{b.max} · {b.pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-b4-surface-2">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pontos críticos */}
      {r.weakSpots.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Pontos críticos a priorizar
          </p>
          <p className="mt-1 text-xs text-amber-700/80">
            Perguntas onde a resposta foi C, D ou E (peso ≤ 2):
          </p>
          <ul className="mt-3 space-y-2">
            {r.weakSpots.map((w) => (
              <li key={w.id} className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                  {w.chosen}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-b4-ink">
                    {w.id} · {w.text}
                  </p>
                  <p className="mt-0.5 text-xs text-b4-ink-2">Peso: {w.weight}/4</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Respostas completas · collapsible */}
      <details className="b4-card group overflow-hidden">
        <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-b4-ink-2 hover:bg-b4-surface-2">
          <span>Ver todas as 25 respostas</span>
          <HiOutlineChevronDown className="text-b4-ink-3 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-b4-line px-5 pb-5 pt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {QUESTIONS.map((q) => {
              const a = data.answers[q.id];
              return (
                <div key={q.id} className="flex items-start gap-2.5 rounded-xl bg-b4-surface-2 p-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-b4-line-strong text-xs font-bold text-b4-ink-2">
                    {q.id.replace("Q", "")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs text-b4-ink-2">{q.text}</p>
                    <p className="mt-1 font-mono text-xs font-bold text-b4-navy">{a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <p className="text-sm font-semibold text-amber-900">Disclaimer técnico</p>
        <p className="mt-1 text-sm text-amber-800">
          {r.disclaimer ?? "Estimativa preliminar · depende de enquadramento e fiscalização. Recomenda-se validação técnica in loco."}
        </p>
      </div>

      {/* Notas */}
      {data.notes && (
        <div className="b4-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-b4-ink-3">Notas</p>
          <p className="mt-2 text-sm text-b4-ink-2">{data.notes}</p>
        </div>
      )}

      {/* Modal exclusão */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-b4-surface p-6 shadow-xl">
            <h3
              className="text-lg font-bold text-b4-ink"
              style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}
            >
              Excluir auditoria
            </h3>
            <p className="mt-2 text-sm text-b4-ink-2">
              Esta ação remove a auditoria permanentemente. Confirme sua senha para continuar:
            </p>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="mt-3 w-full rounded-xl border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
              autoFocus
            />
            {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setDeleteOpen(false); setPwd(""); setErr(""); }}
                className="rounded-xl border border-b4-line px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={!pwd || busy}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function categoryLabel(cat: string): string {
  switch (cat) {
    case "evidencia":     return "Evidência documental";
    case "psicossocial":  return "Psicossocial";
    case "estrutura":     return "Estrutura/governança";
    case "fiscalizacao":  return "Exposição à fiscalização";
    default:              return cat;
  }
}
