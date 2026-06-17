"use client";

import { useEffect, useState } from "react";
import { HiOutlineKey, HiOutlineX } from "react-icons/hi";

interface Props {
  open: boolean;
  forced?: boolean; // if true, cannot be closed without changing
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordDialog({ open, forced, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setErro("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (next !== confirm) {
      setErro("A confirmação não confere");
      return;
    }
    if (next.length < 12) {
      setErro("A nova senha deve ter no mínimo 12 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setErro(data.error || "Erro ao alterar senha");
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={forced ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-b4-line bg-b4-surface p-6 shadow-2xl animate-fade-in-up"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-b4-navy/10 text-b4-navy">
            <HiOutlineKey className="text-2xl" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-b4-ink">
                {forced ? "Defina sua senha" : "Alterar senha"}
              </h2>
              {!forced && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded p-1 text-b4-ink-3 hover:bg-b4-surface-2 hover:text-b4-ink-2"
                  aria-label="Fechar"
                >
                  <HiOutlineX />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-b4-ink-2">
              {forced
                ? "É o seu primeiro acesso. Defina uma senha segura (mínimo 12 caracteres)."
                : "Troque sua senha por uma nova (mínimo 12 caracteres)."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-b4-ink-2">
              Senha atual
            </label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-2 focus:ring-b4-navy/20"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-b4-ink-2">
              Nova senha
            </label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
              minLength={12}
              className="w-full rounded-lg border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-2 focus:ring-b4-navy/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-b4-ink-2">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={12}
              className="w-full rounded-lg border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-2 focus:ring-b4-navy/20"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {!forced && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !current || !next || !confirm}
            className="rounded-lg bg-b4-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-b4-navy-deep disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Alterar senha"}
          </button>
        </div>
      </form>
    </div>
  );
}
