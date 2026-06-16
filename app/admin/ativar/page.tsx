"use client";

import { useEffect, useState } from "react";
import { HiOutlineKey, HiOutlineCheckCircle, HiOutlineExclamationCircle } from "react-icons/hi";

type Phase = "loading" | "invalid" | "form" | "done";

export default function AtivarPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!t) {
      setPhase("invalid");
      return;
    }
    setToken(t);
    fetch(`/api/admin/activate?token=${encodeURIComponent(t)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok && d.valid) {
          setName(d.name ?? "");
          setEmail(d.email ?? "");
          setPhase("form");
        } else {
          setPhase("invalid");
        }
      })
      .catch(() => setPhase("invalid"));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (password !== confirm) {
      setErro("As senhas não conferem.");
      return;
    }
    if (password.length < 12) {
      setErro("A senha deve ter no mínimo 12 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPhase("done");
      } else {
        setErro(data.error || "Não foi possível ativar a conta.");
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            <p className="text-sm text-gray-500">Validando convite…</p>
          </div>
        )}

        {phase === "invalid" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <HiOutlineExclamationCircle className="text-2xl" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Convite inválido ou expirado</h1>
            <p className="max-w-xs text-sm text-gray-500">
              Esse link de ativação não é mais válido. Peça ao administrador da B4 para gerar um novo convite.
            </p>
            <a href="/admin" className="mt-2 text-sm font-semibold text-primary hover:underline">
              Ir para o login
            </a>
          </div>
        )}

        {phase === "form" && (
          <form onSubmit={submit}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <HiOutlineKey className="text-2xl" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900">Defina sua senha</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Bem-vindo(a){name ? `, ${name}` : ""}! Crie uma senha para acessar o sistema da B4.
                </p>
                {email && <p className="mt-1 text-xs text-gray-400">{email}</p>}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Confirmar senha</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-xs text-gray-400">
                Mínimo de 12 caracteres. Não use o seu e-mail nem senhas óbvias.
              </p>

              {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? "Ativando…" : "Ativar conta"}
            </button>
          </form>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <HiOutlineCheckCircle className="text-2xl" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Conta ativada!</h1>
            <p className="max-w-xs text-sm text-gray-500">
              Sua senha foi definida. Agora é só entrar com seu e-mail e a senha que você acabou de criar.
            </p>
            <a
              href="/admin"
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Entrar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
