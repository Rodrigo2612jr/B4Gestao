"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlinePlus,
  HiOutlineClipboardCheck,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePencilAlt,
} from "react-icons/hi";
import AepShell from "./_components/AepShell";
import StatusBadge from "./_components/StatusBadge";
import type { AepStatus } from "@/lib/aep/scoring";

interface Row {
  id: string;
  company_name: string | null;
  title: string;
  status: AepStatus;
  avaliador_name: string | null;
  supervisor_name: string | null;
  updated_at: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

function initials(name: string | null): string {
  if (!name) return "-";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "-";
}

export default function AepListPage() {
  return (
    <AepShell title="AEP · Avaliações Ergonômicas">
      <Inner />
    </AepShell>
  );
}

function Inner() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/aep");
      if (!res.ok) throw new Error("Erro ao carregar");
      setRows(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const emPreench = rows.filter((r) => r.status === "em_preenchimento" || r.status === "rascunho").length;
    const aguardando = rows.filter((r) => r.status === "aguardando_aprovacao").length;
    const aprovadas = rows.filter((r) => r.status === "aprovado").length;
    return { total, emPreench, aguardando, aprovadas };
  }, [rows]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-secondary" style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.025em" }}>
            Avaliações Ergonômicas Preliminares
          </h2>
          <p className="mt-1 text-sm text-gray-500">FO-SST.013 · NR-17 / ABNT ISO 20646:2017</p>
        </div>
        <button
          onClick={() => router.push("/aep/new")}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark"
        >
          <HiOutlinePlus className="text-base" /> Nova AEP
        </button>
      </div>

      {/* KPIs (contagens reais) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FeaturedKpi label="Total de avaliações" value={kpis.total} loading={loading} icon={<HiOutlineClipboardCheck />} />
        <Kpi label="Em preenchimento" value={kpis.emPreench} loading={loading} icon={<HiOutlinePencilAlt />} tone="blue" />
        <Kpi label="Aguardando aprovação" value={kpis.aguardando} loading={loading} icon={<HiOutlineClock />} tone="amber" />
        <Kpi label="Aprovadas" value={kpis.aprovadas} loading={loading} icon={<HiOutlineCheckCircle />} tone="emerald" />
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">Todas as avaliações</h3>
          {!loading && rows.length > 0 && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{rows.length}</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-px">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : error ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HiOutlineClipboardCheck className="text-2xl" />
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-800">Nenhuma avaliação ainda</p>
            <p className="mt-1 text-xs text-gray-500">Crie a primeira AEP para uma empresa atendida.</p>
            <button
              onClick={() => router.push("/aep/new")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <HiOutlinePlus /> Nova AEP
            </button>
          </div>
        ) : (
          <><table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 font-semibold">Empresa</th>
                <th className="px-5 py-3 font-semibold">Avaliação</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Técnico</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Supervisor</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Atualizado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/aep/${r.id}`)}
                  className="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-primary/[0.03]"
                >
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{r.company_name ?? "-"}</td>
                  <td className="px-5 py-3.5 text-gray-600">{r.title}</td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <Person name={r.avaliador_name} />
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <Person name={r.supervisor_name} />
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="hidden px-5 py-3.5 text-xs text-gray-500 lg:table-cell">{fmtDate(r.updated_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <HiOutlineChevronRight className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: cards (sem rolagem lateral, status inteiro visível) */}
          <div className="divide-y divide-gray-100 md:hidden">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/aep/${r.id}`)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors active:bg-primary/[0.05]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{r.company_name ?? "-"}</p>
                  <p className="truncate text-xs text-gray-500">{r.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-[11px] text-gray-400">{fmtDate(r.updated_at)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <span><span className="font-medium text-gray-400">Téc:</span> {r.avaliador_name ?? "-"}</span>
                    <span><span className="font-medium text-gray-400">Sup:</span> {r.supervisor_name ?? "-"}</span>
                  </div>
                </div>
                <HiOutlineChevronRight className="mt-1 flex-shrink-0 text-gray-300" />
              </button>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

function Person({ name }: { name: string | null }) {
  if (!name) return <span className="text-gray-400">-</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        {initials(name)}
      </span>
      <span className="text-gray-700">{name}</span>
    </span>
  );
}

function FeaturedKpi({ label, value, loading, icon }: { label: string; value: number; loading: boolean; icon: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-md shadow-primary/20">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-white/80">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg">{icon}</span>
          <span className="text-xs font-medium">{label}</span>
        </div>
        {loading ? (
          <div className="mt-4 h-9 w-16 animate-pulse rounded bg-white/20" />
        ) : (
          <p className="mt-3 text-4xl font-bold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}

const TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
};

function Kpi({ label, value, loading, icon, tone }: { label: string; value: number; loading: boolean; icon: React.ReactNode; tone: string }) {
  const t = TONES[tone] ?? TONES.blue;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${t.bg} ${t.text}`}>{icon}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-12 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-3 text-4xl font-bold tabular-nums text-secondary">{value}</p>
      )}
    </div>
  );
}
