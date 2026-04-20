"use client";

import { HiOutlineChevronRight, HiOutlineArrowUp, HiOutlineArrowDown } from "react-icons/hi";
import type { Submission, SortKey, Filters } from "../_lib/types";
import NecessidadeBadge from "./NecessidadeBadge";
import { formatDate, formatTime, phoneToWhatsApp } from "../_lib/format";

interface Props {
  rows: Submission[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  onRowClick: (s: Submission) => void;
}

const SORTABLE: { key: SortKey; label: string }[] = [
  { key: "criadoEm", label: "Data" },
  { key: "empresa", label: "Empresa" },
];

export default function LeadsTable({ rows, filters, setFilters, onRowClick }: Props) {
  const setSort = (key: SortKey) => {
    const cur = filters.sort;
    const dir = cur.key === key && cur.dir === "desc" ? "asc" : "desc";
    setFilters({ ...filters, sort: { key, dir } });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {SORTABLE.map(({ key, label }) => (
                <SortHeader
                  key={key}
                  active={filters.sort.key === key}
                  dir={filters.sort.dir}
                  onClick={() => setSort(key)}
                >
                  {label}
                </SortHeader>
              ))}
              <th className="px-4 py-3 text-left font-semibold text-gray-600">CNPJ</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Nome</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Telefone</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Região</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Porte</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Necessidade</th>
              <th className="w-8" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr
                key={s.id}
                onClick={() => onRowClick(s)}
                className={`group cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  <span className="font-medium text-gray-700">{formatDate(s.criadoEm)}</span>
                  <span className="ml-1 text-xs text-gray-400">{formatTime(s.criadoEm)}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.empresa}</td>
                <td className="px-4 py-3 text-gray-500">{s.cnpj || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{s.nome}</td>
                <td className="px-4 py-3">
                  <a
                    href={phoneToWhatsApp(s.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:underline"
                  >
                    {s.telefone}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.regiao}</td>
                <td className="px-4 py-3 text-gray-500">{s.funcionarios}</td>
                <td className="px-4 py-3">
                  <NecessidadeBadge necessidade={s.necessidade} />
                </td>
                <td className="px-2 py-3 text-right">
                  <HiOutlineChevronRight className="inline text-gray-300 transition-colors group-hover:text-gray-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  children,
  active,
  dir,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 text-left font-semibold text-gray-600">
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded px-1 -mx-1 transition-colors ${
          active ? "text-gray-900" : "hover:text-gray-800"
        }`}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        {children}
        {active && (dir === "asc" ? (
          <HiOutlineArrowUp className="text-xs" />
        ) : (
          <HiOutlineArrowDown className="text-xs" />
        ))}
      </button>
    </th>
  );
}
