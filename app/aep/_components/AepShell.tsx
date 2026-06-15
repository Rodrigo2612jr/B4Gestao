"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineLogout, HiOutlineKey, HiOutlineChevronDown, HiOutlineLockClosed, HiOutlineMail } from "react-icons/hi";
import ToastProvider, { useToast } from "../../admin/_components/ToastProvider";
import ChangePasswordDialog from "../../admin/_components/ChangePasswordDialog";
import Avatar from "../../admin/_components/Avatar";

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
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
      </div>
    );
  }

  if (state === "out") return <AepLogin onSuccess={checkAuth} />;

  if (state === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7f9] px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500"><HiOutlineLockClosed /></div>
        <h1 className="text-lg font-bold text-secondary">Acesso restrito</h1>
        <p className="max-w-sm text-sm text-gray-500">Este portal é exclusivo para técnicos e supervisores do AEP. Seu perfil ({ROLE_LABEL[userRole] ?? (userRole || "sem perfil")}) não tem acesso.</p>
        <button onClick={logout} className="mt-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Sair</button>
      </div>
    );
  }

  return (
    <div className="admin-root flex min-h-screen flex-col bg-[#f6f7f9]">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 lg:px-8">
          <Link href="/aep" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-md shadow-primary/20">
              <Image src="/images/logo-white-v3.png" alt="B4" width={32} height={32} className="h-6 w-6 object-contain" priority />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-secondary" style={{ fontFamily: "var(--font-display), system-ui" }}>B4 · AEP</div>
              <div className="hidden text-[10px] uppercase tracking-[0.15em] text-gray-400 sm:block">Avaliação Ergonômica</div>
            </div>
          </Link>

          {title && <span className="ml-2 hidden truncate text-sm font-medium text-gray-500 lg:inline">{title}</span>}

          <div className="relative ml-auto">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Conta"
              aria-expanded={menuOpen}
              className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white pl-1.5 pr-2.5 transition-colors hover:bg-gray-50 active:scale-95"
            >
              <Avatar name={userName || userEmail || "?"} size="sm" />
              <span className="hidden text-xs font-medium text-gray-600 sm:inline">{userName}</span>
              <span className="hidden rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary sm:inline">{ROLE_LABEL[userRole] ?? userRole}</span>
              <HiOutlineChevronDown className="text-base text-gray-400" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5">
                  <div className="border-b border-gray-100 p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={userName || userEmail || "?"} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="truncate text-xs text-gray-500">{userEmail}</p>
                      </div>
                    </div>
                    <span className="mt-2 inline-block rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{ROLE_LABEL[userRole] ?? userRole}</span>
                  </div>
                  <button onClick={() => { setMenuOpen(false); setForced(false); setShowChangePwd(true); }} className="flex w-full items-center gap-2.5 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                    <HiOutlineKey className="text-base text-gray-400" /> Alterar senha
                  </button>
                  <button onClick={logout} className="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100">
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
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4" style={{ background: "linear-gradient(160deg,#f6f7f9 0%,#eef2f7 100%)" }}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-md shadow-primary/20">
            <Image src="/images/logo-white-v3.png" alt="B4" width={40} height={40} className="h-8 w-8 object-contain" priority />
          </div>
          <h1 className="mt-4 text-xl font-bold text-secondary" style={{ fontFamily: "var(--font-display), system-ui" }}>Portal AEP</h1>
          <p className="text-sm text-gray-500">Avaliação Ergonômica Preliminar · B4 Gestão</p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="aep-email" className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative mt-1">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400" />
              <input id="aep-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
            </div>
          </div>
          <div>
            <label htmlFor="aep-senha" className="text-sm font-medium text-gray-700">Senha</label>
            <div className="relative mt-1">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400" />
              <input id="aep-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required
                placeholder="Digite a senha"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark disabled:opacity-60">
            {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-400">Acesso restrito a técnicos e supervisores. Todas as ações são registradas.</p>
      </div>
    </div>
  );
}
