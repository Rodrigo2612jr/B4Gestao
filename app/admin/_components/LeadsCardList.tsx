"use client";

import type { Submission } from "../_lib/types";
import NecessidadeBadge from "./NecessidadeBadge";
import { formatDate, formatTime, phoneToWhatsApp } from "../_lib/format";

interface Props {
  rows: Submission[];
  onRowClick: (s: Submission) => void;
}

export default function LeadsCardList({ rows, onRowClick }: Props) {
  return (
    <div className="space-y-3">
      {rows.map((s) => (
        <button
          key={s.id}
          onClick={() => onRowClick(s)}
          className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">{s.empresa}</p>
              <p className="mt-0.5 text-xs text-gray-500">{s.nome}</p>
            </div>
            <NecessidadeBadge necessidade={s.necessidade} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={phoneToWhatsApp(s.telefone)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              {s.telefone}
            </a>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{formatDate(s.criadoEm)} {formatTime(s.criadoEm)}</span>
            <span>•</span>
            <span>{s.regiao}</span>
            <span>•</span>
            <span>{s.funcionarios}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
