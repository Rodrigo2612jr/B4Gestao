"use client";

import { HiOutlineInbox, HiOutlineSearch } from "react-icons/hi";

interface Props {
  variant: "no-leads" | "no-results";
  onClear?: () => void;
}

export default function EmptyState({ variant, onClear }: Props) {
  const Icon = variant === "no-leads" ? HiOutlineInbox : HiOutlineSearch;
  const title =
    variant === "no-leads"
      ? "Nenhum lead recebido ainda"
      : "Nenhum resultado";
  const desc =
    variant === "no-leads"
      ? "Quando alguém preencher o formulário de contato, aparecerá aqui."
      : "Tente ajustar os filtros ou a busca.";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
        <Icon className="text-3xl" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
      {variant === "no-results" && onClear && (
        <button
          onClick={onClear}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
