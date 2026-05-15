"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlineSearch,
  HiOutlineOfficeBuilding,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
import EmptyState from "../_components/EmptyState";
import { useToast } from "../_components/ToastProvider";

interface Company {
  id: string;
  cnpj: string;
  cnpj_formatted: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
  score?: number;
}

export default function CompaniesPage() {
  return (
    <AdminShell title="Empresas">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const fetchCompanies = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q && q.trim().length >= 2
        ? `/api/companies?q=${encodeURIComponent(q)}`
        : "/api/companies";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanies(data);
    } catch {
      push("Erro ao carregar empresas", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchCompanies(query);
    }, 300);
    return () => clearTimeout(t);
  }, [query, fetchCompanies]);

  const hasFuzzy = companies.some((c) => c.score !== undefined && c.score < 1);

  return (
    <div>
      <PageHeader
        title="Empresas"
        subtitle="Espinha dorsal do CRM — identificadas e unificadas por CNPJ. Tudo (leads, auditorias, pesquisas, alertas) é agregado por aqui."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "Empresas" }]}
        accent="primary"
        meta={
          !loading && companies.length > 0 ? (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
              {companies.length}
            </span>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome (tolera typo/acento) ou parte do CNPJ..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-200"
          >
            Limpar
          </button>
        )}
      </div>

      {hasFuzzy && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <HiOutlineSparkles /> Busca fuzzy ativa — resultados ordenados por similaridade
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white p-4" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        query ? (
          <EmptyState variant="no-results" onClear={() => setQuery("")} />
        ) : (
          <EmptyState variant="no-companies" />
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companies/${c.id}`}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              {/* Top color bar (gradient on hover) */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="flex items-start justify-between gap-2">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                  <HiOutlineOfficeBuilding className="text-2xl" />
                </div>
                {c.score !== undefined && c.score < 1 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {Math.round(c.score * 100)}% match
                  </span>
                )}
              </div>
              <h3 className="mt-3 truncate text-sm font-bold text-secondary group-hover:text-primary transition-colors">
                {c.name}
              </h3>
              <p className="mt-0.5 font-mono text-xs text-gray-500">{c.cnpj_formatted}</p>
              {(c.city || c.state) && (
                <p className="mt-1 truncate text-xs text-gray-400">
                  📍 {[c.city, c.state].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="mt-3 text-[10px] uppercase tracking-wider text-gray-400">
                Atualizada {new Date(c.updated_at).toLocaleDateString("pt-BR")}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Info card */}
      {!loading && companies.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900">
          <HiOutlineInformationCircle className="mt-0.5 flex-shrink-0 text-lg" />
          <p>
            <strong>Dica:</strong> a busca tolera diferenças de acento, espaço e digitação. Empresas com mesmo CNPJ
            são unificadas automaticamente. Quando dois cadastros parecerem ser a mesma empresa, você pode mesclá-los
            na tela de detalhes (com confirmação de senha).
          </p>
        </div>
      )}
    </div>
  );
}
