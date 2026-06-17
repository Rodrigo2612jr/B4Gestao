"use client";

import Image from "next/image";
import { useState } from "react";
import { HiOutlineLockClosed, HiOutlineMail, HiOutlineShieldCheck } from "react-icons/hi";

interface Props {
  onSuccess: (mustChangePassword: boolean) => Promise<void>;
}

const DISPLAY = "var(--font-admin-display), system-ui, sans-serif";

const BG =
  "radial-gradient(900px 500px at 85% -10%, rgba(59,125,216,0.28), transparent 55%), radial-gradient(700px 480px at 0% 110%, rgba(126,217,87,0.14), transparent 55%), linear-gradient(160deg,#0a1f3d 0%,#0b2447 55%,#0c2c57 100%)";

export default function LoginCard({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, senha }),
      });
      if (res.ok) {
        const data = await res.json();
        setSenha("");
        setEmail("");
        await onSuccess(Boolean(data.user?.mustChangePassword));
      } else if (res.status === 429) {
        setErro("Muitas tentativas. Tente novamente em 15 minutos.");
      } else {
        setErro("Email ou senha incorretos");
      }
    } catch {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root relative flex min-h-screen items-center justify-center px-4 py-10" style={{ background: BG }}>
      {/* textura sutil de grade */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative w-full max-w-[400px]">
        {/* selo da marca acima do card */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 shadow-xl shadow-black/30 ring-1 ring-white/30">
            <Image
              src="/images/logo-dark-v3.png"
              alt="B4 Gestão Ocupacional"
              width={80}
              height={80}
              className="h-11 w-11 object-contain"
              priority
            />
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
            Gestão Ocupacional
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="relative overflow-hidden rounded-2xl border border-white/15 bg-white p-8 shadow-2xl shadow-black/40"
        >
          {/* acento superior navy → verde */}
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0e427b] via-[#3b7dd8] to-emerald-400" />

          <h1 className="text-center text-[22px] font-bold text-b4-ink" style={{ fontFamily: DISPLAY, letterSpacing: "-0.02em" }}>
            Painel B4 Gestão
          </h1>
          <p className="mt-1 text-center text-sm text-b4-ink-2">
            Console interno de gestão ocupacional
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-b4-ink-2">
                E-mail
              </label>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-b4-ink-3" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-[var(--b4-line-strong)] bg-[var(--b4-surface-2)] py-3 pl-10 pr-4 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-[var(--b4-navy)] focus:bg-white focus:ring-4 focus:ring-[var(--b4-navy)]/12"
                  placeholder="seu@email.com"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="mb-1.5 block text-xs font-semibold text-b4-ink-2">
                Senha
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-b4-ink-3" />
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-[var(--b4-line-strong)] bg-[var(--b4-surface-2)] py-3 pl-10 pr-4 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-[var(--b4-navy)] focus:bg-white focus:ring-4 focus:ring-[var(--b4-navy)]/12"
                  placeholder="Digite a senha"
                />
              </div>
            </div>
          </div>

          {erro && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !senha}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0e427b] to-[#0a1f3d] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0e427b]/25 transition-all hover:shadow-xl hover:shadow-[#0e427b]/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-b4-ink-3">
            <HiOutlineShieldCheck className="text-sm text-emerald-500" />
            Acesso restrito · todas as ações são registradas
          </p>
        </form>
      </div>
    </div>
  );
}
