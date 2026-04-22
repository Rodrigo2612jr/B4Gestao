"use client";

import { useEffect, useState } from "react";
import { HiOutlineExclamation, HiOutlineLockClosed } from "react-icons/hi";

interface Props {
  open: boolean;
  leadName: string;
  onClose: () => void;
  onConfirm: (senha: string) => Promise<{ ok: boolean; error?: string }>;
}

export default function DeleteDialog({ open, leadName, onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open) {
      setSenha("");
      setErro("");
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const res = await onConfirm(senha);
    if (!res.ok) {
      setErro(res.error || "Erro ao excluir");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <HiOutlineExclamation className="text-2xl" />
          </div>
          <div className="flex-1">
            <h2 id="delete-title" className="text-lg font-bold text-gray-900">
              Excluir lead?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Você está prestes a excluir o lead de{" "}
              <strong className="text-gray-900">{leadName}</strong>. Essa ação é
              permanente e não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="delete-senha"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Confirme com a senha de admin
          </label>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="delete-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              placeholder="Digite a senha"
            />
          </div>
          {erro && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {erro}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !senha}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Excluindo..." : "Excluir definitivamente"}
          </button>
        </div>
      </form>
    </div>
  );
}
