"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineLogout, HiOutlineKey, HiOutlineChevronDown, HiOutlineLockClosed, HiOutlineMail, HiOutlineShieldCheck } from "react-icons/hi";
import ToastProvider, { useToast } from "../../admin/_components/ToastProvider";
import ChangePasswordDialog from "../../admin/_components/ChangePasswordDialog";
import Avatar from "../../admin/_components/Avatar";

const DISPLAY = "var(--font-admin-display), system-ui, sans-serif";
const LOGIN_BG =
  "radial-gradient(900px 500px at 85% -10%, rgba(59,125,216,0.28), transparent 55%), radial-gradient(700px 480px at 0% 110%, rgba(126,217,87,0.14), transparent 55%), linear-gradient(160deg,#0a1f3d 0%,#0b2447 55%,#0c2c57 100%)";

const ALLOWED = ["TECNICO", "SUPERVISOR", "ADMIN"];
const ROLE_LABEL: Record<string, string> = {
  TECNICO: "Técnico",
  SUPERVISOR: "Supervisor",
  ADMIN: "Administrador",
};

type CachedUser = { name: string; email: string; role: string; mustChangePassword: boolean };
let cachedUser: CachedUser | null = null;

export default function AepShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <ToastProvider>
      <Inner title={title}>{children}</Inner>
    </ToastProvider>
  );
}

function Inner({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "in" | "out" | "denied">(cachedUser ? "in" : "loading");
  const [userName, setUserName] = useState(cachedUser?.name ?? "");
  const [userEmail, setUserEmail] = useState(cachedUser?.email ?? "");
  const [userRole, setUserRole] = useState(cachedUser?.role ?? "");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [forced, setForced] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { push } = useToast();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (!res.ok) { cachedUser = null; setState("out"); return; }
      const data = await res.json();
      const role = data.user?.role ?? "";
      if (!ALLOWED.includes(role)) { setUserRole(role); setState("denied"); return; }
      cachedUser = {
        name: data.user?.name ?? "",
        email: data.user?.email ?? "",
        role,
        mustChangePassword: !!data.user?.mustChangePassword,
      };
      setUserName(cachedUser.name);
      setUserEmail(cachedUser.email);
      setUserRole(role);
      if (data.user?.mustChangePassword) { setForced(true); setShowChangePwd(true); }
      setState("in");
    } catch {
      if (!cachedUser) setState("out");
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const logout = async () => {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    cachedUser = null;
    setState("out");
  };

  if (state === "loading") {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-b4-line-strong border-t-b4-navy" />
      </div>
    );
  }

  if (state === "out") return <AepLogin onSuccess={checkAuth} />;

  if (state === "denied") {
    return (
      <div className="admin-root flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="b4-card max-w-sm p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500"><HiOutlineLockClosed /></div>
          <h1 className="mt-4 text-lg font-bold text-b4-ink" style={{ fontFamily: DISPLAY }}>Acesso restrito</h1>
          <p className="mt-2 text-sm text-b4-ink-2">Este portal é exclusivo para técnicos e supervisores do AEP. Seu perfil ({ROLE_LABEL[userRole] ?? (userRole || "sem perfil")}) não tem acesso.</p>
          <button onClick={logout} className="mt-5 rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-b4-line bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 lg:px-8">
          <Link href="/aep" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-900/30 ring-1 ring-white/20">
              <Image src="/images/logo-white-v3.png" alt="B4" width={32} height={32} className="h-6 w-6 object-contain" priority />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-b4-ink" style={{ fontFamily: DISPLAY }}>B4 · AEP</div>
              <div className="hidden text-[10px] uppercase tracking-[0.16em] text-b4-ink-3 sm:block">Avaliação Ergonômica</div>
            </div>
          </Link>

          {title && <span className="ml-2 hidden truncate text-sm font-medium text-b4-ink-2 lg:inline">{title}</span>}

          <div className="relative ml-auto">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Conta"
              aria-expanded={menuOpen}
              className="flex h-11 items-center gap-2 rounded-xl border border-b4-line bg-b4-surface pl-1.5 pr-2.5 transition-colors hover:bg-b4-surface-2 active:scale-95"
            >
              <Avatar name={userName || userEmail || "?"} size="sm" />
              <span className="hidden text-xs font-medium text-b4-ink-2 sm:inline">{userName}</span>
              <span className="hidden rounded-md bg-b4-navy/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-b4-navy sm:inline">{ROLE_LABEL[userRole] ?? userRole}</span>
              <HiOutlineChevronDown className="text-base text-b4-ink-3" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-b4-line bg-white shadow-[var(--b4-shadow-lg)]">
                  <div className="border-b border-b4-line p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={userName || userEmail || "?"} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-b4-ink">{userName}</p>
                        <p className="truncate text-xs text-b4-ink-3">{userEmail}</p>
                      </div>
                    </div>
                    <span className="mt-2 inline-block rounded-md bg-b4-navy/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-b4-navy">{ROLE_LABEL[userRole] ?? userRole}</span>
                  </div>
                  <button onClick={() => { setMenuOpen(false); setForced(false); setShowChangePwd(true); }} className="flex w-full items-center gap-2.5 px-4 py-3.5 text-sm text-b4-ink-2 hover:bg-b4-surface-2 active:bg-b4-surface-2">
                    <HiOutlineKey className="text-base text-b4-ink-3" /> Alterar senha
                  </button>
                  <button onClick={logout} className="flex w-full items-center gap-2.5 border-t border-b4-line px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100">
                    <HiOutlineLogout className="text-base" /> Sair / trocar de conta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8 lg:py-8">
          <div key={pathname} className="admin-page-enter">{children}</div>
        </div>
      </main>

      <ChangePasswordDialog
        open={showChangePwd}
        forced={forced}
        onClose={() => setShowChangePwd(false)}
        onSuccess={() => { setShowChangePwd(false); setForced(false); push("Senha alterada com sucesso"); }}
      />
    </div>
  );
}

function AepLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "Credenciais inválidas"); return; }
      await onSuccess();
    } catch {
      setError("Erro ao entrar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-root relative flex min-h-screen items-center justify-center px-4 py-10" style={{ background: LOGIN_BG }}>
      <div className="relative w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-black/30 ring-1 ring-white/25">
            <Image src="/images/logo-white-v3.png" alt="B4" width={40} height={40} className="h-9 w-9 object-contain" priority />
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Avaliação Ergonômica</p>
        </div>

        <form onSubmit={submit} className="relative overflow-hidden rounded-2xl border border-white/15 bg-white p-8 shadow-2xl shadow-black/40">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0e427b] via-[#3b7dd8] to-emerald-400" />
          <h1 className="text-center text-[22px] font-bold text-b4-ink" style={{ fontFamily: DISPLAY, letterSpacing: "-0.02em" }}>Portal AEP</h1>
          <p className="mt-1 text-center text-sm text-b4-ink-2">Avaliação Ergonômica Preliminar · B4 Gestão</p>

          <div className="mt-7 space-y-4">
            <div>
              <label htmlFor="aep-email" className="mb-1.5 block text-xs font-semibold text-b4-ink-2">E-mail</label>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-b4-ink-3" />
                <input id="aep-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username"
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-b4-line-strong bg-b4-surface-2 py-3 pl-10 pr-4 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:bg-white focus:ring-4 focus:ring-b4-navy/12" />
              </div>
            </div>
            <div>
              <label htmlFor="aep-senha" className="mb-1.5 block text-xs font-semibold text-b4-ink-2">Senha</label>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-b4-ink-3" />
                <input id="aep-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password"
                  placeholder="Digite a senha"
                  className="w-full rounded-xl border border-b4-line-strong bg-b4-surface-2 py-3 pl-10 pr-4 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:bg-white focus:ring-4 focus:ring-b4-navy/12" />
              </div>
            </div>
          </div>

          {error && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy}
            className="mt-6 w-full rounded-xl bg-gradient-to-br from-[#0e427b] to-[#0a1f3d] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0e427b]/25 transition-all hover:brightness-110 disabled:opacity-60">
            {busy ? "Entrando…" : "Entrar"}
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
