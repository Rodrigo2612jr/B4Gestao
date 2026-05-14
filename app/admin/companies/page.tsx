"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlineSearch,
  HiOutlineOfficeBuilding,
  HiOutlineExclamation,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
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
      <CompaniesInner />
    </AdminShell>
  );
}

function CompaniesInner() {
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

  // Debounce de busca
  useEffect(() => {
    const t = setTimeout(() => {
      fetchCompanies(query);
    }, 300);
    return () => clearTimeout(t);
  }, [query, fetchCompanies]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome (tolera typo/acento)..."
          className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Resultado */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Carregando...
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <HiOutlineOfficeBuilding className="mx-auto text-4xl text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {query ? "Nenhuma empresa encontrada com esse nome." : "Nenhuma empresa cadastrada ainda."}
          </p>
          {!query && (
            <p className="mt-1 text-xs text-gray-400">
              Empresas são criadas automaticamente quando alguém preenche o formulário com CNPJ.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            {companies.length} {companies.length === 1 ? "empresa encontrada" : "empresas encontradas"}
            {query && companies.some((c) => c.score !== undefined) && " (ordenado por similaridade)"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/admin/companies/${c.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HiOutlineOfficeBuilding className="text-xl" />
                  </div>
                  {c.score !== undefined && c.score < 1 && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                      {Math.round(c.score * 100)}% match
                    </span>
                  )}
                </div>
                <h3 className="mt-3 truncate text-sm font-semibold text-secondary group-hover:text-primary">
                  {c.name}
                </h3>
                <p className="mt-1 font-mono text-xs text-gray-500">{c.cnpj_formatted}</p>
                {(c.city || c.state) && (
                  <p className="mt-1 text-xs text-gray-400">
                    {[c.city, c.state].filter(Boolean).join(" · ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Dica */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900">
        <HiOutlineExclamation className="mt-0.5 flex-shrink-0 text-base" />
        <p>
          A busca tolera diferenças de acento, espaço e digitação. Empresas com mesmo CNPJ são unificadas automaticamente.
          Quando dois cadastros parecerem ser a mesma empresa, você pode mesclá-los na tela de detalhes.
        </p>
      </div>
    </div>
  );
}
