"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  HiOutlinePlus,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiOutlineChevronRight,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import KpiTile from "../_components/KpiTile";
import EmptyState from "../_components/EmptyState";
import { useToast } from "../_components/ToastProvider";
import { timeAgo } from "../_lib/time";

interface StressItem {
  id: string;
  companyId: string | null;
  respondentName: string;
  respondentRole: string | null;
  scoreTotal: number;
  semaforo: "VERDE" | "AMARELO" | "VERMELHO";
  engavetamento: number;
  coerencia: string;
  faixa: string;
  createdAt: string;
}

const SEMAFORO_STYLE: Record<string, { dot: string; text: string; bg: string }> = {
  VERDE:    { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  AMARELO:  { dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50"   },
  VERMELHO: { dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50"     },
};

const FAIXA_STYLE: Record<string, string> = {
  BAIXA:    "text-emerald-700 bg-emerald-50",
  MODERADA: "text-amber-700 bg-amber-50",
  ELEVADA:  "text-red-700 bg-red-50",
  LOW:      "text-emerald-700 bg-emerald-50",
  MODERATE: "text-amber-700 bg-amber-50",
  HIGH:     "text-red-700 bg-red-50",
};

export default function StressTestListPage() {
  return (
    <AdminShell title="Stress Test NR-1">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [items, setItems] = useState<StressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterSemaforo, setFilterSemaforo] = useState<"all" | "VERDE" | "AMARELO" | "VERMELHO">("all");
  const { push } = useToast();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stress-test");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      push("Erro ao carregar auditorias", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterSemaforo !== "all" && i.semaforo !== filterSemaforo) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!i.respondentName.toLowerCase().includes(q) && !(i.respondentRole?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [items, query, filterSemaforo]);

  const counts = useMemo(() => ({
    total:    items.length,
    verde:    items.filter((i) => i.semaforo === "VERDE").length,
    amarelo:  items.filter((i) => i.semaforo === "AMARELO").length,
    vermelho: items.filter((i) => i.semaforo === "VERMELHO").length,
  }), [items]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="b4-eyebrow">Conformidade NR-1</span>
          <h2
            className="mt-2 text-[26px] font-bold text-b4-ink"
            style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.03em" }}
          >
            Stress Test NR-1
          </h2>
          <p className="mt-1 text-sm text-b4-ink-2">
            Auditoria de evidências da gestão NR-1 · 25 perguntas. Score 0-100 com semáforo regulatório.
          </p>
        </div>
        <Link
          href="/admin/stress-test/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-b4-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-b4-navy/20 transition-colors hover:bg-b4-navy-deep"
        >
          <HiOutlinePlus className="text-base" /> Nova auditoria
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Total de auditorias"
          value={counts.total}
          icon={<HiOutlineClipboardList />}
          loading={loading}
          featured
        />
        <KpiTile
          label="Conformes (Verde)"
          value={counts.verde}
          icon={<HiOutlineCheckCircle />}
          loading={loading}
          tone="emerald"
        />
        <KpiTile
          label="Atenção (Amarelo)"
          value={counts.amarelo}
          icon={<HiOutlineExclamation />}
          loading={loading}
          tone="amber"
        />
        <KpiTile
          label="Críticos (Vermelho)"
          value={counts.vermelho}
          icon={<HiOutlineXCircle />}
          loading={loading}
          tone="rose"
        />
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(["all", "VERDE", "AMARELO", "VERMELHO"] as const).map((v) => {
            const active = filterSemaforo === v;
            const dotColor =
              v === "VERDE" ? "bg-emerald-500" :
              v === "AMARELO" ? "bg-amber-500" :
              v === "VERMELHO" ? "bg-red-500" : undefined;
            return (
              <button
                key={v}
                onClick={() => setFilterSemaforo(v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-b4-navy bg-b4-navy text-white"
                    : "border-b4-line bg-b4-surface text-b4-ink-2 hover:bg-b4-surface-2"
                }`}
              >
                {dotColor && (
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : dotColor}`} />
                )}
                {v === "all" ? "Todos" : v}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 min-w-48">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-b4-ink-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou cargo..."
            className="h-9 w-full rounded-xl border border-b4-line bg-b4-surface pl-9 pr-3 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        items.length === 0 ? (
          <EmptyState variant="no-audits" />
        ) : (
          <EmptyState variant="no-results" onClear={() => { setQuery(""); setFilterSemaforo("all"); }} />
        )
      ) : (
        <div className="b4-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-b4-line px-5 py-4">
            <h3 className="text-sm font-bold text-b4-ink">Auditorias registradas</h3>
            <span className="rounded-md bg-b4-surface-2 px-2 py-0.5 text-xs font-semibold text-b4-ink-2">
              {filtered.length}/{items.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-b4-line text-left text-[11px] uppercase tracking-wider text-b4-ink-3">
                  <th className="px-5 py-3 font-semibold">Respondente</th>
                  <th className="px-5 py-3 font-semibold text-right">Score</th>
                  <th className="px-5 py-3 font-semibold">Semáforo</th>
                  <th className="hidden px-5 py-3 font-semibold text-right md:table-cell">Engavetamento</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Coerência</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">Faixa</th>
                  <th className="hidden px-5 py-3 font-semibold text-right lg:table-cell">Quando</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const sem = SEMAFORO_STYLE[it.semaforo];
                  return (
                    <tr
                      key={it.id}
                      className="group cursor-pointer border-b border-b4-line transition-colors last:border-0 hover:bg-b4-surface-2"
                      onClick={() => (window.location.href = `/admin/stress-test/${it.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-b4-navy/10 text-[10px] font-bold text-b4-navy">
                            <HiOutlineUser className="text-sm" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-b4-ink">{it.respondentName}</div>
                            {it.respondentRole && (
                              <div className="truncate text-xs text-b4-ink-2">{it.respondentRole}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-mono text-base font-bold tabular-nums text-b4-ink" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>{it.scoreTotal}</span>
                        <span className="text-xs text-b4-ink-3">/100</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-0.5 text-[11px] font-semibold ${sem.bg} ${sem.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${sem.dot}`} />
                          {it.semaforo}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-right md:table-cell">
                        <span className="font-mono text-sm font-semibold tabular-nums text-b4-ink-2">{it.engavetamento}</span>
                        <span className="text-xs text-b4-ink-3">/32</span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-xs text-b4-ink-2 lg:table-cell">
                        <span title={it.coerencia} className="line-clamp-1">{prettyCoherence(it.coerencia)}</span>
                      </td>
                      <td className="hidden px-5 py-3.5 md:table-cell">
                        <span
                          className={`inline-block rounded-xl px-2.5 py-0.5 text-[11px] font-semibold ${FAIXA_STYLE[it.faixa] ?? "bg-b4-surface-2 text-b4-ink-2"}`}
                        >
                          {it.faixa}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-right text-xs text-b4-ink-2 lg:table-cell">
                        <span title={new Date(it.createdAt).toLocaleString("pt-BR")}>{timeAgo(it.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <HiOutlineChevronRight className="text-b4-ink-3 transition-all group-hover:translate-x-0.5 group-hover:text-b4-navy" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="b4-card overflow-hidden">
      <div className="space-y-px">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-7 w-7 animate-pulse rounded-full bg-b4-surface-2" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-1/3 animate-pulse rounded bg-b4-surface-2" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-b4-surface-2" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-xl bg-b4-surface-2" />
            <div className="h-6 w-20 animate-pulse rounded-xl bg-b4-surface-2" />
            <div className="h-6 w-16 animate-pulse rounded-xl bg-b4-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function prettyCoherence(code: string): string {
  const map: Record<string, string> = {
    CONVERGENTE_E_INTEGRADO:          "Convergente e integrado",
    MEDE_MAS_NAO_TRADUZ_EM_OPERACAO:  "Mede, mas não traduz",
    ENTENDE_OPERACAO_MAS_NAO_MEDE:    "Entende, mas não mede",
    AUSENCIA_ESTRUTURAL:              "Ausência estrutural",
    EXISTE_MAS_NAO_RASTREAVEL:        "Existe, mas não rastreável",
  };
  return map[code] ?? code;
}
