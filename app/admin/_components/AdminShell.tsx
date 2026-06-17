"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HiOutlineLogout,
  HiOutlineExternalLink,
  HiOutlineKey,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineClipboardList,
  HiOutlineOfficeBuilding,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineDocumentReport,
  HiOutlineHome,
  HiOutlineChevronDown,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineUsers,
} from "react-icons/hi";
import LoginCard from "./LoginCard";
import ChangePasswordDialog from "./ChangePasswordDialog";
import ToastProvider, { useToast } from "./ToastProvider";
import Avatar from "./Avatar";
import ReleaseModal from "./ReleaseModal";
import { getUnseenReleases } from "../_lib/releases";

const DISPLAY = "var(--font-admin-display), system-ui, sans-serif";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  module: "dashboard" | "companies" | "leads" | "pulse" | "stress" | "esocial" | "users" | "aep";
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Geral",
    items: [
      { href: "/admin", label: "Visão geral", Icon: HiOutlineHome, module: "dashboard" },
      { href: "/admin/companies", label: "Empresas", Icon: HiOutlineOfficeBuilding, module: "companies" },
      { href: "/admin/leads", label: "Leads do site", Icon: HiOutlineClipboardList, module: "leads" },
    ],
  },
  {
    label: "Diagnósticos NR-1",
    items: [
      { href: "/admin/pulse", label: "Pulse", Icon: HiOutlineChartBar, module: "pulse" },
      { href: "/admin/stress-test", label: "Stress Test", Icon: HiOutlineExclamationCircle, module: "stress" },
    ],
  },
  {
    label: "eSocial",
    items: [
      { href: "/admin/esocial", label: "Analytics", Icon: HiOutlineDocumentReport, module: "esocial" },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/admin/usuarios", label: "Equipe & Acessos", Icon: HiOutlineUsers, module: "users" },
    ],
  },
];

// AEP vive no portal próprio (aep.b4gestao.com.br). Técnico/Supervisor não acessam o painel.
const ROLE_PERMS: Record<string, string[]> = {
  ADMIN: ["dashboard", "companies", "leads", "pulse", "stress", "esocial", "users"],
  SST: ["dashboard", "companies", "leads", "pulse", "stress", "esocial"],
  RH: ["dashboard", "companies", "pulse", "stress"],
  JURIDICO: ["dashboard", "companies", "esocial"],
  TECNICO: [],
  SUPERVISOR: [],
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SST: "SST",
  RH: "RH",
  JURIDICO: "Jurídico",
  TECNICO: "Técnico (AEP)",
  SUPERVISOR: "Supervisor (AEP)",
};

// Fundo da sidebar — navy da marca com profundidade.
const SIDEBAR_BG =
  "radial-gradient(120% 80% at 100% 0%, rgba(59,125,216,0.22) 0%, transparent 50%), linear-gradient(180deg,#0a1f3d 0%,#0b2447 55%,#0c2c57 100%)";

type CachedUser = { name: string; email: string; role: string; mustChangePassword: boolean };
// Cache em memória entre navegações — evita o "flash de carregando" e re-checagem visível.
let cachedUser: CachedUser | null = null;

export default function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <ToastProvider>
      <AdminShellInner title={title}>{children}</AdminShellInner>
    </ToastProvider>
  );
}

function AdminShellInner({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "in" | "out">(cachedUser ? "in" : "loading");
  const [userName, setUserName] = useState(cachedUser?.name ?? "");
  const [userEmail, setUserEmail] = useState(cachedUser?.email ?? "");
  const [userRole, setUserRole] = useState<string>(cachedUser?.role ?? "ADMIN");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [forcedChangePwd, setForcedChangePwd] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showReleasesForce, setShowReleasesForce] = useState<"auto" | "history">("auto");
  const [unseenCount, setUnseenCount] = useState(0);
  const { push } = useToast();

  useEffect(() => {
    if (authState === "in") {
      setUnseenCount(getUnseenReleases().length);
    }
  }, [authState]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (!res.ok) { cachedUser = null; setAuthState("out"); return; }
      const data = await res.json();
      cachedUser = {
        name: data.user?.name ?? "",
        email: data.user?.email ?? "",
        role: data.user?.role ?? "ADMIN",
        mustChangePassword: !!data.user?.mustChangePassword,
      };
      setUserName(cachedUser.name);
      setUserEmail(cachedUser.email);
      setUserRole(cachedUser.role);
      if (data.user?.mustChangePassword) {
        setForcedChangePwd(true);
        setShowChangePwd(true);
      }
      setAuthState("in");
    } catch {
      // Blip de rede: mantém a sessão otimista se já validamos antes.
      if (!cachedUser) setAuthState("out");
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleLogout = async () => {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    cachedUser = null;
    setAuthState("out");
    router.push("/admin");
  };

  if (authState === "loading") {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--b4-line-strong)] border-t-[var(--b4-navy)]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-b4-ink-3">Carregando painel</p>
        </div>
      </div>
    );
  }

  if (authState === "out") {
    return (
      <LoginCard
        onSuccess={async (mustChange) => {
          if (mustChange) { setForcedChangePwd(true); setShowChangePwd(true); }
          await checkAuth();
        }}
      />
    );
  }

  // Técnico/Supervisor não acessam o painel — pertencem ao Portal AEP.
  if (authState === "in" && (userRole === "TECNICO" || userRole === "SUPERVISOR")) {
    return (
      <div className="admin-root flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="b4-card max-w-sm p-8">
          <h1 className="text-lg font-bold" style={{ fontFamily: DISPLAY }}>Este painel é para administradores</h1>
          <p className="mt-2 text-sm text-b4-ink-2">Seu acesso ({ROLE_LABEL[userRole] ?? userRole}) é no Portal AEP de campo.</p>
          <a href="/aep" className="mt-5 inline-flex rounded-xl bg-[var(--b4-navy)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--b4-navy-deep)]">Ir para o Portal AEP</a>
          <div><button onClick={handleLogout} className="mt-3 text-xs text-b4-ink-3 hover:text-red-600">Sair</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root flex min-h-screen">
      {/* Sidebar · desktop */}
      <aside className="relative hidden w-[264px] flex-shrink-0 lg:flex lg:flex-col" style={{ background: SIDEBAR_BG }}>
        <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/10" />
        <SidebarContent
          pathname={pathname}
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          onLogout={handleLogout}
          onChangePassword={() => { setForcedChangePwd(false); setShowChangePwd(true); }}
          onNavigate={() => setSidebarOpen(false)}
          onSearch={() => router.push("/admin/companies")}
        />
      </aside>

      {/* Sidebar · mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-[#0a1f3d]/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col shadow-2xl lg:hidden" style={{ background: SIDEBAR_BG }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/60 hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <HiOutlineX className="text-xl" />
            </button>
            <SidebarContent
              pathname={pathname}
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
              onLogout={handleLogout}
              onChangePassword={() => { setForcedChangePwd(false); setShowChangePwd(true); }}
              onNavigate={() => setSidebarOpen(false)}
              onSearch={() => { setSidebarOpen(false); router.push("/admin/companies"); }}
            />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[var(--b4-line)] bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="-ml-2 rounded-lg p-2 text-b4-ink-2 hover:bg-black/5 lg:hidden"
              aria-label="Abrir menu"
            >
              <HiOutlineMenu className="text-xl" />
            </button>

            {/* Breadcrumb / título */}
            <div className="min-w-0">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-b4-ink-3 sm:block">B4 Gestão · Painel</p>
              <h1 className="truncate text-[17px] font-bold text-b4-ink" style={{ fontFamily: DISPLAY }}>
                {title}
              </h1>
            </div>

            {/* Search global */}
            <div className="ml-auto hidden lg:block">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-b4-ink-3" />
                <input
                  type="text"
                  placeholder="Buscar empresa, lead, auditoria…"
                  className="h-10 w-80 rounded-xl border border-[var(--b4-line)] bg-[var(--b4-surface-2)] pl-9 pr-12 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-[var(--b4-navy)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--b4-navy)]/10"
                  onFocus={() => router.push("/admin/companies")}
                  readOnly
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[var(--b4-line)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-b4-ink-3">⌘K</kbd>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5 lg:ml-3">
              {/* Sino de novidades */}
              <button
                onClick={() => setShowReleasesForce("history")}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--b4-line)] bg-white text-b4-ink-2 transition-colors hover:bg-[var(--b4-surface-2)] hover:text-b4-ink"
                title="Novidades do painel"
                aria-label="Ver novidades"
              >
                <HiOutlineSparkles className="text-lg" />
                {unseenCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--b4-accent)] px-1 text-[9px] font-bold text-white">
                    {unseenCount}
                  </span>
                )}
              </button>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-10 items-center gap-1.5 rounded-xl border border-[var(--b4-line)] bg-white px-3 text-xs font-medium text-b4-ink-2 transition-colors hover:bg-[var(--b4-surface-2)] md:flex"
              >
                <HiOutlineExternalLink className="text-base" />
                <span>Site</span>
              </a>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-10 items-center gap-2 rounded-xl border border-[var(--b4-line)] bg-white pl-1 pr-2 transition-colors hover:bg-[var(--b4-surface-2)]"
                >
                  <Avatar name={userName || userEmail || "?"} size="sm" />
                  <HiOutlineChevronDown className="text-sm text-b4-ink-3" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1.5 w-64 origin-top-right overflow-hidden rounded-2xl border border-[var(--b4-line)] bg-white shadow-[var(--b4-shadow-lg)]">
                      <div className="border-b border-[var(--b4-line)] p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={userName || userEmail || "?"} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-b4-ink">{userName}</p>
                            <p className="truncate text-xs text-b4-ink-3">{userEmail}</p>
                          </div>
                        </div>
                        <span className="mt-2 inline-block rounded-md bg-[var(--b4-navy)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-b4-navy">
                          {ROLE_LABEL[userRole] ?? userRole}
                        </span>
                      </div>
                      <button
                        onClick={() => { setProfileOpen(false); setForcedChangePwd(false); setShowChangePwd(true); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-b4-ink-2 transition-colors hover:bg-[var(--b4-surface-2)]"
                      >
                        <HiOutlineKey className="text-base text-b4-ink-3" /> Alterar senha
                      </button>
                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-b4-ink-2 transition-colors hover:bg-[var(--b4-surface-2)] md:hidden"
                      >
                        <HiOutlineExternalLink className="text-base text-b4-ink-3" /> Ver site
                      </a>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 border-t border-[var(--b4-line)] px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <HiOutlineLogout className="text-base" /> Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1480px] px-4 py-6 lg:px-8 lg:py-9">
            <div key={pathname} className="admin-page-enter">{children}</div>
          </div>
        </main>
      </div>

      <ChangePasswordDialog
        open={showChangePwd}
        forced={forcedChangePwd}
        onClose={() => setShowChangePwd(false)}
        onSuccess={() => {
          setShowChangePwd(false);
          setForcedChangePwd(false);
          push("Senha alterada com sucesso");
        }}
      />

      {/* Release notes modal · abre automaticamente se houver releases não vistas */}
      {!forcedChangePwd && userName && (
        <ReleaseModal
          userName={userName}
          showAll={showReleasesForce === "history"}
          onClose={() => {
            setShowReleasesForce("auto");
            setUnseenCount(0);
          }}
        />
      )}
    </div>
  );
}

function SidebarContent({
  pathname,
  userRole,
  userName,
  userEmail,
  onNavigate,
  onLogout,
  onChangePassword,
  onSearch,
}: {
  pathname: string;
  userRole: string;
  userName: string;
  userEmail: string;
  onNavigate: () => void;
  onLogout: () => void;
  onChangePassword: () => void;
  onSearch: () => void;
}) {
  const allowedModules = ROLE_PERMS[userRole] ?? ROLE_PERMS["ADMIN"];

  return (
    <>
      {/* Logo */}
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 px-5 py-[18px]">
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-900/40 ring-1 ring-white/20">
          <Image
            src="/images/logo-white-v3.png"
            alt="B4"
            width={32}
            height={32}
            className="h-6 w-6 object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-tight text-white" style={{ fontFamily: DISPLAY, letterSpacing: "-0.01em" }}>
            B4 Gestão
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300/70">
            Gestão Ocupacional
          </div>
        </div>
      </Link>

      <span className="mx-5 block h-px bg-white/10" />

      {/* Search */}
      <div className="px-3 pt-4">
        <button
          onClick={onSearch}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          <HiOutlineSearch className="text-base" />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="rounded border border-white/10 bg-white/10 px-1 py-0.5 text-[10px] font-medium text-white/55">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => allowedModules.includes(item.module));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {group.label}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active = item.module === "dashboard"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all ${
                        active
                          ? "bg-white/[0.10] text-white shadow-sm shadow-black/20"
                          : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-300 to-emerald-500" />
                      )}
                      <item.Icon className={`text-[18px] flex-shrink-0 transition-colors ${active ? "text-emerald-300" : "text-white/45 group-hover:text-white/85"}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Profile no rodapé */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={onChangePassword}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
        >
          <Avatar name={userName || userEmail || "?"} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{userName || "Usuário"}</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-emerald-300/60">{ROLE_LABEL[userRole] ?? userRole}</p>
          </div>
          <HiOutlineKey className="flex-shrink-0 text-base text-white/45" />
        </button>
        <button
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-red-500/15 hover:text-red-300"
        >
          <HiOutlineLogout className="text-base" /> Sair
        </button>
      </div>
    </>
  );
}
