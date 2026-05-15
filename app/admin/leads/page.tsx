"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { HiOutlineRefresh, HiOutlineDownload } from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
import StatsGrid from "../_components/StatsGrid";
import FilterBar from "../_components/FilterBar";
import LeadsTable from "../_components/LeadsTable";
import LeadsCardList from "../_components/LeadsCardList";
import LeadDrawer from "../_components/LeadDrawer";
import DeleteDialog from "../_components/DeleteDialog";
import EmptyState from "../_components/EmptyState";
import { StatsSkeleton, TableSkeleton } from "../_components/TableSkeleton";
import { useToast } from "../_components/ToastProvider";
import { applyFilters } from "../_lib/filters";
import { exportCSV } from "../_lib/csv";
import { INITIAL_FILTERS } from "../_lib/types";
import type { Submission, Filters } from "../_lib/types";

export default function LeadsPage() {
  return (
    <AdminShell title="Leads do site">
      <LeadsInner />
    </AdminShell>
  );
}

function LeadsInner() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const { push } = useToast();

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubmissions(data);
    } catch {
      push("Erro ao carregar leads", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filtered = useMemo(() => applyFilters(submissions, filters), [submissions, filters]);

  const handleExport = () => {
    exportCSV(filtered);
    push(`${filtered.length} lead${filtered.length !== 1 ? "s" : ""} exportado${filtered.length !== 1 ? "s" : ""}`);
  };

  const handleRefresh = () => {
    fetchSubmissions();
    push("Atualizado", "info");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        (document.querySelector("[data-search-input]") as HTMLInputElement)?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div>
      <PageHeader
        title="Leads do site"
        subtitle="Submissões do formulário público. Cada lead já vem com CNPJ obrigatório e vinculação automática à empresa."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "Leads do site" }]}
        accent="emerald"
        meta={
          !loading && submissions.length > 0 ? (
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700">
              {submissions.length}
            </span>
          ) : undefined
        }
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <HiOutlineRefresh className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-secondary px-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary/90 disabled:opacity-50"
            >
              <HiOutlineDownload />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        }
      />
      <div className="space-y-6">

      {loading && submissions.length === 0 ? (
        <StatsSkeleton />
      ) : (
        <StatsGrid submissions={submissions} />
      )}

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        submissions={submissions}
        resultCount={filtered.length}
        totalCount={submissions.length}
      />

      {loading && submissions.length === 0 ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          variant={submissions.length === 0 ? "no-leads" : "no-results"}
          onClear={() => setFilters(INITIAL_FILTERS)}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <LeadsTable
              rows={filtered}
              filters={filters}
              setFilters={setFilters}
              onRowClick={setSelected}
            />
          </div>
          <div className="md:hidden">
            <LeadsCardList rows={filtered} onRowClick={setSelected} />
          </div>
        </>
      )}

      <p className="pt-4 text-center text-xs text-gray-400">
        Atalho: pressione <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-xs">/</kbd> para buscar, <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-xs">Esc</kbd> para fechar
      </p>

      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        onDelete={(lead) => setDeleteTarget(lead)}
      />
      <DeleteDialog
        open={!!deleteTarget}
        leadName={deleteTarget?.empresa ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (senha) => {
          if (!deleteTarget) return { ok: false, error: "Nenhum lead selecionado" };
          try {
            const res = await fetch(`/api/submissions/${deleteTarget.id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ senha }),
            });
            if (res.ok) {
              push("Lead excluído");
              setDeleteTarget(null);
              setSelected(null);
              setSubmissions((s) => s.filter((x) => x.id !== deleteTarget.id));
              return { ok: true };
            }
            const data = await res.json().catch(() => ({}));
            return { ok: false, error: data.error || "Erro ao excluir" };
          } catch {
            return { ok: false, error: "Erro de conexão" };
          }
        }}
      />
      </div>
    </div>
  );
}
