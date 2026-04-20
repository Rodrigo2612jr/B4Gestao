"use client";

import { useRef } from "react";
import { HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import type { Submission, Filters } from "../_lib/types";
import { INITIAL_FILTERS } from "../_lib/types";
import { distinctValues } from "../_lib/filters";

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  submissions: Submission[];
  resultCount: number;
  totalCount: number;
}

export default function FilterBar({
  filters,
  setFilters,
  submissions,
  resultCount,
  totalCount,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  const necessidades = distinctValues(submissions, "necessidade");
  const portes = distinctValues(submissions, "funcionarios");
  const regioes = distinctValues(submissions, "regiao");

  const toggle = (group: "necessidade" | "porte" | "regiao", value: string) => {
    const cur = filters[group];
    setFilters({
      ...filters,
      [group]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    });
  };

  const activeCount =
    filters.necessidade.length +
    filters.porte.length +
    filters.regiao.length +
    (filters.dateRange !== "all" ? 1 : 0) +
    (filters.busca ? 1 : 0);

  // Register "/" hotkey via ref
  if (typeof window !== "undefined") {
    // noop — handled globally in layout
  }

  return (
    <div className="space-y-3">
      {/* Search + date range + clear */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={filters.busca}
            onChange={(e) => setFilters({ ...filters, busca: e.target.value })}
            placeholder="Buscar por empresa, nome, telefone, região, CNPJ..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            data-search-input
          />
          {filters.busca && (
            <button
              onClick={() => setFilters({ ...filters, busca: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Limpar busca"
            >
              <HiOutlineX className="text-base" />
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {(["all", "today", "7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilters({ ...filters, dateRange: r })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.dateRange === r
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {r === "all" ? "Todos" : r === "today" ? "Hoje" : r === "7d" ? "7 dias" : "30 dias"}
            </button>
          ))}
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            <HiOutlineX className="text-sm" />
            Limpar ({activeCount})
          </button>
        )}
      </div>

      {/* Filter chips */}
      {(necessidades.length > 0 || portes.length > 0 || regioes.length > 0) && (
        <div className="space-y-2">
          {necessidades.length > 0 && (
            <ChipGroup
              label="Necessidade"
              values={necessidades}
              active={filters.necessidade}
              onToggle={(v) => toggle("necessidade", v)}
            />
          )}
          {portes.length > 0 && (
            <ChipGroup
              label="Porte"
              values={portes}
              active={filters.porte}
              onToggle={(v) => toggle("porte", v)}
            />
          )}
          {regioes.length > 0 && (
            <ChipGroup
              label="Região"
              values={regioes}
              active={filters.regiao}
              onToggle={(v) => toggle("regiao", v)}
            />
          )}
        </div>
      )}

      {/* Count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {resultCount === totalCount
            ? `${totalCount} lead${totalCount !== 1 ? "s" : ""}`
            : `${resultCount} de ${totalCount} lead${totalCount !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  values,
  active,
  onToggle,
}: {
  label: string;
  values: string[];
  active: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}:
      </span>
      {values.map((v) => {
        const isActive = active.includes(v);
        return (
          <button
            key={v}
            onClick={() => onToggle(v)}
            role="switch"
            aria-checked={isActive}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}
