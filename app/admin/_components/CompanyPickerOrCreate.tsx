"use client";

import { useState, useEffect } from "react";
import {
  HiOutlineSearch,
  HiOutlineOfficeBuilding,
  HiOutlinePlus,
  HiOutlineCheckCircle,
} from "react-icons/hi";

export interface SelectableCompany {
  id: string;
  name: string;
  cnpj_formatted: string;
}

interface Props {
  selected: SelectableCompany | null;
  onSelect: (c: SelectableCompany | null) => void;
  /** Texto opcional do título da seção. */
  title?: string;
}

function maskCnpj(v: string) {
  const c = (v || "").replace(/\D+/g, "").slice(0, 14);
  if (c.length <= 2) return c;
  if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
  if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
  if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

export default function CompanyPickerOrCreate({ selected, onSelect, title = "Empresa" }: Props) {
  const [mode, setMode] = useState<"search" | "create">("search");

  if (selected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-secondary">{title}</h2>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <HiOutlineCheckCircle className="text-2xl text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="truncate font-medium text-secondary">{selected.name}</div>
              <div className="font-mono text-xs text-gray-500">{selected.cnpj_formatted}</div>
            </div>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="text-xs font-medium text-gray-500 hover:text-red-600 flex-shrink-0 ml-3"
          >
            Trocar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-secondary">{title}</h2>

      {/* Tabs */}
      <div className="mt-3 inline-flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setMode("search")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "search" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <HiOutlineSearch /> Buscar existente
        </button>
        <button
          onClick={() => setMode("create")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "create" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <HiOutlinePlus /> Cadastrar por CNPJ
        </button>
      </div>

      <div className="mt-4">
        {mode === "search" ? (
          <SearchMode onSelect={onSelect} />
        ) : (
          <CreateMode onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}

function SearchMode({ onSelect }: { onSelect: (c: SelectableCompany) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectableCompany[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = query.length >= 2 ? `/api/companies?q=${encodeURIComponent(query)}` : "/api/companies";
        const res = await fetch(url);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar empresa por nome (tolera typo/acento)..."
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </div>
      <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {loading ? (
          <p className="p-3 text-xs text-gray-500">Buscando...</p>
        ) : results.length === 0 ? (
          <p className="p-3 text-xs text-gray-500">Nenhuma empresa encontrada. Use a aba "Cadastrar por CNPJ" para adicionar.</p>
        ) : (
          results.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <HiOutlineOfficeBuilding className="text-xl text-primary flex-shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">{c.name}</div>
                <div className="font-mono text-xs text-gray-500">{c.cnpj_formatted}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function CreateMode({ onSelect }: { onSelect: (c: SelectableCompany) => void }) {
  const [cnpj, setCnpj] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<{ created: boolean; suggestions: Array<{ name: string; cnpj_formatted: string }> } | null>(null);

  const submit = async () => {
    setError("");
    setInfo(null);
    if (!cnpj.trim()) return setError("Informe o CNPJ");
    if (name.trim().length < 2) return setError("Informe o nome da empresa");

    setBusy(true);
    try {
      const res = await fetch("/api/companies/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj, name }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Erro ao cadastrar");
        return;
      }
      setInfo({ created: d.created, suggestions: d.suggestions });
      // Auto-seleciona após 600ms (dá tempo de ler que era duplicata)
      setTimeout(() => onSelect(d.company), d.suggestions?.length ? 1500 : 400);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
        Se o CNPJ já existir no sistema, vamos vincular automaticamente à empresa cadastrada.
        Se não, criamos um novo cadastro agora.
      </p>
      <div>
        <label className="text-xs font-medium text-gray-700">CNPJ *</label>
        <input
          value={cnpj}
          onChange={(e) => setCnpj(maskCnpj(e.target.value))}
          inputMode="numeric"
          maxLength={18}
          placeholder="00.000.000/0000-00"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700">Nome da empresa *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Empresa XYZ Ltda"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {info && (
        <div className={`rounded-lg p-3 text-xs ${info.created ? "bg-emerald-50 text-emerald-900" : "bg-blue-50 text-blue-900"}`}>
          {info.created
            ? "✓ Empresa cadastrada agora."
            : "✓ CNPJ já existia no sistema · vinculado ao cadastro existente."}
          {info.suggestions?.length > 0 && (
            <p className="mt-1 text-yellow-700">
              ⚠ {info.suggestions.length} possível duplicata por nome detectada. Verifique depois na tela da empresa.
            </p>
          )}
        </div>
      )}
      <button
        onClick={submit}
        disabled={busy || !cnpj || !name}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {busy ? "Verificando..." : "Cadastrar / vincular empresa"}
      </button>
    </div>
  );
}
