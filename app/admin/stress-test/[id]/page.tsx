"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineTrash, HiOutlineUser, HiOutlineDownload } from "react-icons/hi";
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

const SEMAFORO_COLOR: Record<string, string> = {
  VERDE: "bg-emerald-500",
  AMARELO: "bg-yellow-400",
  VERMELHO: "bg-red-500",
};
const SEMAFORO_BG: Record<string, string> = {
  VERDE: "bg-emerald-50 border-emerald-200 text-emerald-900",
  AMARELO: "bg-yellow-50 border-yellow-200 text-yellow-900",
  VERMELHO: "bg-red-50 border-red-200 text-red-900",
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

  if (loading) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Carregando...</div>;
  if (!data) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Não encontrado.</div>;

  const r = data.result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/stress-test" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary">
          <HiOutlineArrowLeft /> Voltar
        </Link>
        <div className="flex gap-2">
          <a
            href={`/api/stress-test/${id}/report`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            <HiOutlineDownload /> Baixar PPTX
          </a>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <HiOutlineTrash /> Excluir
          </button>
        </div>
      </div>

      {/* Big card: Score + Semáforo */}
      <div className={`rounded-2xl border-2 p-6 ${SEMAFORO_BG[r.semaforo]}`}>
        <div className="flex items-center gap-5">
          <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full ${SEMAFORO_COLOR[r.semaforo]} text-3xl font-bold text-white`}>
            {r.total}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Semáforo NR-1</p>
            <h2 className="text-2xl font-bold">{r.semaforoLabel}</h2>
            <p className="mt-1 text-sm opacity-80">Score {r.total}/100 · Faixa de exposição: <strong>{r.faixaLabel}</strong></p>
          </div>
        </div>
      </div>

      {/* Sub-scores grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Engavetamento */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Risco de Engavetamento</h3>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{r.engavetamento.score}</span>
            <span className="pb-1 text-sm text-gray-500">/ {r.engavetamento.max}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-primary" style={{ width: `${(r.engavetamento.score / r.engavetamento.max) * 100}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-900">Classificação: {r.engavetamento.classification}</p>
          <p className="mt-1 text-sm text-gray-700">{r.engavetamento.label}</p>
          <p className="mt-1 text-xs text-gray-500">Perguntas núcleo: Q01, Q12-Q16, Q21, Q25. Faixas: Baixo 24-32 / Médio 14-23 / Alto 0-13.</p>
        </div>

        {/* Coerência psicossocial */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Coerência psicossocial</h3>
          <p className="mt-3 text-2xl font-bold text-gray-900">{r.coerencia.label}</p>
          <p className="mt-2 text-sm text-gray-700">{r.coerencia.description}</p>
          <p className="mt-2 text-xs text-gray-500">Cruzamento Q18A (afirmação) × Q18B (evidência).</p>
        </div>
      </div>

      {/* Por categoria */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Por categoria</h3>
        <div className="mt-4 space-y-3">
          {Object.entries(r.byCategory).map(([cat, b]) => (
            <div key={cat}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-gray-700">{categoryLabel(cat)}</span>
                <span className="font-mono text-gray-500">{b.score}/{b.max} · {b.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div className={`h-full ${b.pct >= 75 ? "bg-emerald-500" : b.pct >= 50 ? "bg-yellow-400" : "bg-red-500"}`} style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak spots */}
      {r.weakSpots.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-yellow-900">Pontos críticos a priorizar</h3>
          <p className="mt-1 text-xs text-yellow-800">Perguntas onde a resposta foi C, D ou E (peso ≤ 2):</p>
          <ul className="mt-3 space-y-2">
            {r.weakSpots.map((w) => (
              <li key={w.id} className="flex items-start gap-3 rounded-lg bg-white p-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-200 text-xs font-bold text-yellow-900">
                  {w.chosen}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{w.id} — {w.text}</p>
                  <p className="text-xs text-gray-500">Peso: {w.weight}/4</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Respostas completas — collapsible */}
      <details className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-gray-500">
          Ver todas as 25 respostas
        </summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {QUESTIONS.map((q) => {
            const a = data.answers[q.id];
            return (
              <div key={q.id} className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                  {q.id.replace("Q", "")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 line-clamp-2">{q.text}</p>
                  <p className="text-xs font-mono font-semibold text-primary">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </details>

      {/* Disclaimer obrigatório */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm">
        <p className="font-semibold text-amber-900">⚠ Disclaimer técnico</p>
        <p className="mt-1 text-amber-800">{r.disclaimer ?? "Estimativa preliminar — depende de enquadramento e fiscalização. Recomenda-se validação técnica in loco."}</p>
      </div>

      {/* Metadados */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm shadow-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <HiOutlineUser className="text-gray-400" /> <strong>{data.respondentName}</strong>
          {data.respondentRole && <span className="text-gray-500">· {data.respondentRole}</span>}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Realizado em {new Date(data.createdAt).toLocaleString("pt-BR")}
          {data.createdBy && ` por ${data.createdBy}`}
        </p>
        {data.notes && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <strong className="text-xs uppercase tracking-wider text-gray-500">Notas:</strong>
            <p className="mt-1">{data.notes}</p>
          </div>
        )}
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-secondary">Excluir auditoria</h3>
            <p className="mt-2 text-sm text-gray-600">Esta ação remove a auditoria. Confirme sua senha:</p>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setDeleteOpen(false); setPwd(""); setErr(""); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} disabled={!pwd || busy} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
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
    case "evidencia": return "Evidência documental";
    case "psicossocial": return "Psicossocial";
    case "estrutura": return "Estrutura/governança";
    case "fiscalizacao": return "Exposição à fiscalização";
    default: return cat;
  }
}
