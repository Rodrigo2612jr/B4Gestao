"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  HiOutlineSearch,
  HiOutlineOfficeBuilding,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
  HiOutlineChevronRight,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import KpiTile from "../_components/KpiTile";
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
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

  const kpis = useMemo(() => {
    const total = companies.length;
    const comCidade = companies.filter((c) => c.city).length;
    const semCidade = companies.filter((c) => !c.city).length;
    return { total, comCidade, semCidade };
  }, [companies]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="text-2xl font-bold text-secondary"
            style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.025em" }}
          >
            Empresas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Espinha dorsal do CRM · identificadas e unificadas por CNPJ.
          </p>
        </div>
      </div>

      {/* KPIs · somente quando dados reais existem */}
      {!loading && companies.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiTile
            label="Total de empresas"
            value={kpis.total}
            icon={<HiOutlineOfficeBuilding />}
            featured
            loading={loading}
          />
          <KpiTile
            label="Com localidade"
            value={kpis.comCidade}
            icon={<HiOutlineOfficeBuilding />}
            tone="emerald"
            loading={loading}
          />
          <KpiTile
            label="Sem localidade"
            value={kpis.semCidade}
            icon={<HiOutlineOfficeBuilding />}
            tone="amber"
            loading={loading}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome (tolera typo/acento) ou parte do CNPJ..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            Limpar
          </button>
        )}
      </div>

      {hasFuzzy && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <HiOutlineSparkles /> Busca fuzzy ativa · resultados ordenados por similaridade
        </div>
      )}

      {/* Tabela / Grid */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-px">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50" />
            ))}
          </div>
        </div>
      ) : companies.length === 0 ? (
        query ? (
          <EmptyState variant="no-results" onClear={() => setQuery("")} />
        ) : (
          <EmptyState variant="no-companies" />
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-900">Todas as empresas</h3>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
              {companies.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 font-semibold">Empresa</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">CNPJ</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Localidade</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Atualizada</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr
                  key={c.id}
                  className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-primary/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {initials(c.name)}
                      </span>
                      <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {c.name}
                      </span>
                      {c.score !== undefined && c.score < 1 && (
                        <span className="rounded-xl bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {Math.round(c.score * 100)}% match
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3.5 font-mono text-xs text-gray-500 md:table-cell">
                    {c.cnpj_formatted}
                  </td>
                  <td className="hidden px-5 py-3.5 text-xs text-gray-500 lg:table-cell">
                    {c.city || c.state
                      ? [c.city, c.state].filter(Boolean).join(" · ")
                      : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="hidden px-5 py-3.5 text-xs text-gray-500 lg:table-cell">
                    {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/companies/${c.id}`}>
                      <HiOutlineChevronRight className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info card */}
      {!loading && companies.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900">
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
