"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HiOutlinePlus, HiOutlineChartBar } from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
import EmptyState from "../_components/EmptyState";
import { useToast } from "../_components/ToastProvider";
import { timeAgo } from "../_lib/time";

interface Item {
  id: string;
  title: string;
  token: string;
  areas: string[];
  threshold: number;
  status: "open" | "closed";
  createdAt: string;
}

export default function PulseListPage() {
  return (
    <AdminShell title="Pulse NR-1">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pulse");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      push("Erro ao carregar campanhas", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const open = items.filter((i) => i.status === "open").length;
  const closed = items.filter((i) => i.status === "closed").length;

  return (
    <div>
      <PageHeader
        title="Pulse NR-1"
        subtitle="Pesquisas anônimas de clima psicossocial. Escala Likert 1-5 com threshold de anonimato configurável."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "Pulse" }]}
        accent="violet"
        actions={
          <Link
            href="/admin/pulse/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary/90"
          >
            <HiOutlinePlus className="text-base" /> Nova pesquisa
          </Link>
        }
      />

      {/* Mini stats */}
      {!loading && items.length > 0 && (
        <section className="mb-5 grid grid-cols-3 divide-x divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <StatTile label="Total" value={items.length} />
          <StatTile label="Abertas" value={open} dot="bg-emerald-500" />
          <StatTile label="Encerradas" value={closed} dot="bg-gray-400" />
        </section>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState variant="no-campaigns" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/admin/pulse/${c.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <HiOutlineChartBar className="text-xl" />
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                  c.status === "open"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.status === "open" ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {c.status === "open" ? "Aberta" : "Encerrada"}
                </span>
              </div>

              <h3 className="mt-4 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-secondary">
                {c.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-1">
                {c.areas.slice(0, 4).map((a) => (
                  <span key={a} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {a}
                  </span>
                ))}
                {c.areas.length > 4 && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    +{c.areas.length - 4}
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                <span>n ≥ {c.threshold}</span>
                <span>{timeAgo(c.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-1.5">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      </div>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}
