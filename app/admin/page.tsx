"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineLogout,
  HiOutlineExternalLink,
} from "react-icons/hi";
import LoginCard from "./_components/LoginCard";
import StatsGrid from "./_components/StatsGrid";
import FilterBar from "./_components/FilterBar";
import LeadsTable from "./_components/LeadsTable";
import LeadsCardList from "./_components/LeadsCardList";
import LeadDrawer from "./_components/LeadDrawer";
import DeleteDialog from "./_components/DeleteDialog";
import EmptyState from "./_components/EmptyState";
import { StatsSkeleton, TableSkeleton } from "./_components/TableSkeleton";
import ToastProvider, { useToast } from "./_components/ToastProvider";
import { applyFilters } from "./_lib/filters";
import { exportCSV } from "./_lib/csv";
import { INITIAL_FILTERS } from "./_lib/types";
import type { Submission, Filters } from "./_lib/types";

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminInner />
    </ToastProvider>
  );
}

function AdminInner() {
  const [autenticado, setAutenticado] = useState(false);
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
      if (!res.ok) {
        if (res.status === 401) {
          setAutenticado(false);
          setSubmissions([]);
          return;
        }
        throw new Error();
      }
      const data = await res.json();
      setSubmissions(data);
      setAutenticado(true);
    } catch {
      push("Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setAutenticado(false);
    setSubmissions([]);
  };

  const filtered = useMemo(() => applyFilters(submissions, filters), [submissions, filters]);

  const handleExport = () => {
    exportCSV(filtered);
    push(`${filtered.length} lead${filtered.length !== 1 ? "s" : ""} exportado${filtered.length !== 1 ? "s" : ""}`);
  };

  const handleRefresh = () => {
    fetchSubmissions();
    push("Atualizado", "info");
  };

  // Hotkeys: "/" focus search, "Esc" close drawer
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

  if (!autenticado && !loading) {
    return <LoginCard onSuccess={fetchSubmissions} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/images/logo-dark-v3.png"
              alt="B4"
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0 object-contain"
              priority
            />
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            <div className="min-w-0">
              <h1
                className="text-base font-bold text-secondary sm:text-lg"
                style={{ fontFamily: "var(--font-display), system-ui" }}
              >
                Painel de Leads
              </h1>
              <p className="text-xs text-gray-500">
                {submissions.length} {submissions.length === 1 ? "recebido" : "recebidos"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 sm:h-10 sm:px-4 sm:text-sm"
              aria-label="Ver site"
            >
              <HiOutlineExternalLink />
              <span className="hidden sm:inline">Ver site</span>
            </a>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
              aria-label="Atualizar"
            >
              <HiOutlineRefresh className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-dark disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
            >
              <HiOutlineDownload />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:h-10 sm:px-4 sm:text-sm"
              title="Sair"
            >
              <HiOutlineLogout />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        {/* Stats */}
        {loading && submissions.length === 0 ? (
          <StatsSkeleton />
        ) : (
          <StatsGrid submissions={submissions} />
        )}

        {/* Filters */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          submissions={submissions}
          resultCount={filtered.length}
          totalCount={submissions.length}
        />

        {/* Table / Empty state */}
        {loading && submissions.length === 0 ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={submissions.length === 0 ? "no-leads" : "no-results"}
            onClear={() => setFilters(INITIAL_FILTERS)}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <LeadsTable
                rows={filtered}
                filters={filters}
                setFilters={setFilters}
                onRowClick={setSelected}
              />
            </div>
            {/* Mobile cards */}
            <div className="md:hidden">
              <LeadsCardList rows={filtered} onRowClick={setSelected} />
            </div>
          </>
        )}

        <p className="pt-4 text-center text-xs text-gray-400">
          Atalho: pressione <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-xs">/</kbd> para buscar, <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-xs">Esc</kbd> para fechar
        </p>
      </main>

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
  );
}
