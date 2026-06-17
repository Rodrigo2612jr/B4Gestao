"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HiOutlinePlus, HiOutlineChartBar } from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
import EmptyState from "../_components/EmptyState";
import KpiTile from "../_components/KpiTile";
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
    <div className="space-y-7">
      <PageHeader
        title="Pulse NR-1"
        subtitle="Pesquisas anônimas de clima psicossocial. Escala Likert 1-5 com threshold de anonimato configurável."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "Pulse" }]}
        actions={
          <Link
            href="/admin/pulse/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-b4-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-b4-navy-deep"
          >
            <HiOutlinePlus className="text-base" /> Nova pesquisa
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiTile
          label="Total de pesquisas"
          value={items.length}
          loading={loading}
          icon={<HiOutlineChartBar />}
          featured
        />
        <KpiTile
          label="Abertas"
          value={open}
          loading={loading}
          icon={<HiOutlineChartBar />}
          tone="emerald"
        />
        <KpiTile
          label="Encerradas"
          value={closed}
          loading={loading}
          icon={<HiOutlineChartBar />}
          tone="violet"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="b4-card h-44 animate-pulse bg-b4-surface-2" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState variant="no-campaigns" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/admin/pulse/${c.id}`}
              className="b4-card b4-card-hover group relative flex flex-col overflow-hidden p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-b4-navy/10 text-b4-navy">
                  <HiOutlineChartBar className="text-xl" />
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-0.5 text-[10px] font-semibold ${
                  c.status === "open"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-b4-surface-2 text-b4-ink-2"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.status === "open" ? "bg-emerald-500" : "bg-b4-ink-3"}`} />
                  {c.status === "open" ? "Aberta" : "Encerrada"}
                </span>
              </div>

              <h3 className="mt-4 line-clamp-2 text-sm font-semibold text-b4-ink group-hover:text-b4-navy">
                {c.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-1">
                {c.areas.slice(0, 4).map((a) => (
                  <span key={a} className="rounded-xl bg-b4-surface-2 px-2 py-0.5 text-[10px] font-medium text-b4-ink-2">
                    {a}
                  </span>
                ))}
                {c.areas.length > 4 && (
                  <span className="rounded-xl bg-b4-surface-2 px-2 py-0.5 text-[10px] font-medium text-b4-ink-3">
                    +{c.areas.length - 4}
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-b4-line pt-3 text-[11px] text-b4-ink-3">
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
