"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HiOutlineClipboardCheck, HiOutlineOfficeBuilding, HiOutlineChevronRight, HiOutlineSearch } from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
import EmptyState from "../_components/EmptyState";
import KpiTile from "../_components/KpiTile";
import StatusBadge from "../../aep/_components/StatusBadge";
import { useToast } from "../_components/ToastProvider";
import { timeAgo } from "../_lib/time";
import type { AepStatus } from "@/lib/aep/scoring";

interface Item {
  id: string;
  company_id: string;
  company_name: string | null;
  title: string;
  status: AepStatus;
  avaliador_name: string | null;
  supervisor_name: string | null;
  updated_at: string;
  created_at: string;
}

export default function AdminAepListPage() {
  return (
    <AdminShell title="AEP — Avaliações Ergonômicas">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aep", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      push("Erro ao carregar avaliações", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const emPreench = items.filter((i) => i.status === "rascunho" || i.status === "em_preenchimento" || i.status === "reprovado").length;
  const aguardando = items.filter((i) => i.status === "aguardando_aprovacao").length;
  const aprovadas = items.filter((i) => i.status === "aprovado").length;

  const filtered = q.trim()
    ? items.filter((i) =>
        [i.title, i.company_name, i.avaliador_name, i.supervisor_name]
          .filter(Boolean)
          .some((t) => (t as string).toLowerCase().includes(q.toLowerCase()))
      )
    : items;

  return (
    <div className="space-y-7">
      <PageHeader
        title="AEP — Avaliações Ergonômicas"
        subtitle="Acompanhamento de todas as Avaliações Ergonômicas Preliminares (FO-SST.013) preenchidas pela equipe de campo. Visualização completa para auditoria."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "AEP" }]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Total de avaliações" value={items.length} loading={loading} />
        <KpiTile label="Em preenchimento" value={emPreench} loading={loading} />
        <KpiTile label="Aguardando aprovação" value={aguardando} loading={loading} />
        <KpiTile label="Aprovadas" value={aprovadas} loading={loading} />
      </div>

      <div className="relative max-w-md">
        <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-b4-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por empresa, título, técnico…"
          className="w-full rounded-xl border border-b4-line-strong bg-b4-surface py-2.5 pl-10 pr-4 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/12"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-b4-surface-2" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          variant={q ? "no-results" : "generic"}
          title={q ? "Nenhuma avaliação encontrada" : "Nenhuma avaliação ainda"}
          description={q ? "Tente outro termo de busca." : "As avaliações ergonômicas preenchidas no Portal AEP aparecem aqui para revisão."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => (
            <Link
              key={i.id}
              href={`/admin/aep/${i.id}`}
              className="b4-card b4-card-hover flex items-center gap-4 p-4"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-b4-navy/10 text-b4-navy">
                <HiOutlineClipboardCheck className="text-xl" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-b4-ink">{i.title}</p>
                  <StatusBadge status={i.status} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-b4-ink-2">
                  <span className="inline-flex items-center gap-1"><HiOutlineOfficeBuilding className="text-b4-ink-3" /> {i.company_name ?? "—"}</span>
                  <span className="text-b4-ink-3">·</span>
                  <span>Téc: <b className="text-b4-ink">{i.avaliador_name ?? "—"}</b></span>
                  <span className="text-b4-ink-3">·</span>
                  <span>Sup: <b className="text-b4-ink">{i.supervisor_name ?? "—"}</b></span>
                  <span className="text-b4-ink-3">·</span>
                  <span>atualizado {timeAgo(i.updated_at)}</span>
                </div>
              </div>
              <HiOutlineChevronRight className="flex-shrink-0 text-b4-ink-3" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
