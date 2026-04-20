"use client";

import Image from "next/image";
import { useState } from "react";
import { HiOutlineLockClosed } from "react-icons/hi";

interface Props {
  onSuccess: () => Promise<void>;
}

export default function LoginCard({ onSuccess }: Props) {
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (res.ok) {
        setSenha("");
        await onSuccess();
      } else if (res.status === 429) {
        setErro("Muitas tentativas. Tente novamente em 15 minutos.");
      } else {
        setErro("Senha incorreta");
      }
    } catch {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center gradient-mesh px-4">
      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl"
      >
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/images/logo-dark-v3.png"
            alt="B4 Gestão Ocupacional"
            width={80}
            height={80}
            className="h-16 w-16 object-contain"
            priority
          />
        </div>

        <h1 className="text-center text-2xl font-bold text-secondary" style={{ fontFamily: "var(--font-display), system-ui" }}>
          Painel Admin
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          B4 Gestão Ocupacional
        </p>

        <div className="mt-8">
          <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-gray-700">
            Senha de acesso
          </label>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Digite a senha"
              autoFocus
            />
          </div>
        </div>

        {erro && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !senha}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-6 text-center text-xs text-gray-400">
          Acesso restrito. Todas as ações são registradas.
        </p>
      </form>
    </div>
  );
}
