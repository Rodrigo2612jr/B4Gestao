"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  HiOutlinePlus,
  HiOutlineUser,
  HiOutlineSearch,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
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
  VERDE: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  AMARELO: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  VERMELHO: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

const FAIXA_STYLE: Record<string, string> = {
  BAIXA: "text-emerald-700 bg-emerald-50",
  MODERADA: "text-amber-700 bg-amber-50",
  ELEVADA: "text-red-700 bg-red-50",
  // legados
  LOW: "text-emerald-700 bg-emerald-50",
  MODERATE: "text-amber-700 bg-amber-50",
  HIGH: "text-red-700 bg-red-50",
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

  // KPIs visíveis (acima da tabela)
  const counts = useMemo(() => {
    return {
      total: items.length,
      verde: items.filter((i) => i.semaforo === "VERDE").length,
      amarelo: items.filter((i) => i.semaforo === "AMARELO").length,
      vermelho: items.filter((i) => i.semaforo === "VERMELHO").length,
    };
  }, [items]);

  return (
    <div>
      <PageHeader
        title="Stress Test NR-1"
        subtitle="Auditoria de evidências da gestão NR-1 — 25 perguntas. Score 0-100 com semáforo regulatório."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "Stress Test" }]}
        accent="amber"
        actions={
          <Link
            href="/admin/stress-test/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary/90"
          >
            <HiOutlinePlus className="text-base" /> Nova auditoria
          </Link>
        }
      />

      {/* Mini-KPIs filtráveis */}
      <section className="mb-5 grid grid-cols-4 divide-x divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <FilterTile
          active={filterSemaforo === "all"}
          onClick={() => setFilterSemaforo("all")}
          label="Total"
          value={counts.total}
          loading={loading}
        />
        <FilterTile
          active={filterSemaforo === "VERDE"}
          onClick={() => setFilterSemaforo("VERDE")}
          label="VERDE"
          value={counts.verde}
          dot="bg-emerald-500"
          loading={loading}
        />
        <FilterTile
          active={filterSemaforo === "AMARELO"}
          onClick={() => setFilterSemaforo("AMARELO")}
          label="AMARELO"
          value={counts.amarelo}
          dot="bg-amber-500"
          loading={loading}
        />
        <FilterTile
          active={filterSemaforo === "VERMELHO"}
          onClick={() => setFilterSemaforo("VERMELHO")}
          label="VERMELHO"
          value={counts.vermelho}
          dot="bg-red-500"
          loading={loading}
        />
      </section>

      {/* Busca */}
      <div className="mb-4 relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou cargo do respondente..."
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
        />
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
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <Th>Respondente</Th>
                  <Th align="right">Score</Th>
                  <Th>Semáforo</Th>
                  <Th align="right">Engavetamento</Th>
                  <Th>Coerência psicossocial</Th>
                  <Th>Faixa</Th>
                  <Th align="right">Quando</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((it) => {
                  const sem = SEMAFORO_STYLE[it.semaforo];
                  return (
                    <tr
                      key={it.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50/60"
                      onClick={() => (window.location.href = `/admin/stress-test/${it.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                            <HiOutlineUser className="text-base" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-900">{it.respondentName}</div>
                            {it.respondentRole && <div className="truncate text-xs text-gray-500">{it.respondentRole}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-base font-bold tabular-nums text-gray-900">{it.scoreTotal}</span>
                        <span className="text-xs text-gray-400">/100</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${sem.bg} ${sem.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sem.dot}`} />
                          {it.semaforo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm font-semibold tabular-nums text-gray-700">{it.engavetamento}</span>
                        <span className="text-xs text-gray-400">/32</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        <span title={it.coerencia} className="line-clamp-1">{prettyCoherence(it.coerencia)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${FAIXA_STYLE[it.faixa] ?? "bg-gray-100 text-gray-700"}`}>
                          {it.faixa}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">
                        <span title={new Date(it.createdAt).toLocaleString("pt-BR")}>
                          {timeAgo(it.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-xs text-gray-500">
            Mostrando <strong className="text-gray-900">{filtered.length}</strong> de <strong className="text-gray-900">{items.length}</strong> auditoria(s)
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function FilterTile({ active, onClick, label, value, dot, loading }: {
  active: boolean;
  onClick: () => void;
  label: string;
  value: number;
  dot?: string;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 px-5 py-3 text-left transition-colors ${active ? "bg-gray-50" : "hover:bg-gray-50/50"}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
          <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${active ? "text-gray-900" : "text-gray-500"}`}>{label}</p>
        </div>
        {loading ? (
          <div className="mt-2 h-7 w-12 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-gray-900">{value}</p>
        )}
      </div>
      {active && <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">●</span>}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-7 w-7 animate-pulse rounded-full bg-gray-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-1/3 animate-pulse rounded bg-gray-100" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function prettyCoherence(code: string): string {
  const map: Record<string, string> = {
    CONVERGENTE_E_INTEGRADO: "Convergente e integrado",
    MEDE_MAS_NAO_TRADUZ_EM_OPERACAO: "Mede, mas não traduz",
    ENTENDE_OPERACAO_MAS_NAO_MEDE: "Entende, mas não mede",
    AUSENCIA_ESTRUTURAL: "Ausência estrutural",
    EXISTE_MAS_NAO_RASTREAVEL: "Existe, mas não rastreável",
  };
  return map[code] ?? code;
}
