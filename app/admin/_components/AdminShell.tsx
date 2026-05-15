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
} from "react-icons/hi";
import LoginCard from "./LoginCard";
import ChangePasswordDialog from "./ChangePasswordDialog";
import ToastProvider, { useToast } from "./ToastProvider";
import Avatar from "./Avatar";
import ReleaseModal from "./ReleaseModal";
import { getUnseenReleases } from "../_lib/releases";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  module: "dashboard" | "companies" | "leads" | "pulse" | "stress" | "esocial" | "users";
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "GERAL",
    items: [
      { href: "/admin", label: "Visão geral", Icon: HiOutlineHome, module: "dashboard" },
      { href: "/admin/companies", label: "Empresas", Icon: HiOutlineOfficeBuilding, module: "companies" },
      { href: "/admin/leads", label: "Leads do site", Icon: HiOutlineClipboardList, module: "leads" },
    ],
  },
  {
    label: "DIAGNÓSTICOS NR-1",
    items: [
      { href: "/admin/pulse", label: "Pulse", Icon: HiOutlineChartBar, module: "pulse" },
      { href: "/admin/stress-test", label: "Stress Test", Icon: HiOutlineExclamationCircle, module: "stress" },
    ],
  },
  {
    label: "ESOCIAL",
    items: [
      { href: "/admin/esocial", label: "Analytics", Icon: HiOutlineDocumentReport, module: "esocial" },
    ],
  },
];

const ROLE_PERMS: Record<string, string[]> = {
  ADMIN: ["dashboard", "companies", "leads", "pulse", "stress", "esocial", "users"],
  SST: ["dashboard", "companies", "leads", "pulse", "stress", "esocial"],
  RH: ["dashboard", "companies", "pulse", "stress"],
  JURIDICO: ["dashboard", "companies", "esocial"],
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SST: "SST",
  RH: "RH",
  JURIDICO: "Jurídico",
};

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
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string>("ADMIN");
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
      if (!res.ok) { setAuthState("out"); return; }
      const data = await res.json();
      setUserName(data.user?.name ?? "");
      setUserEmail(data.user?.email ?? "");
      setUserRole(data.user?.role ?? "ADMIN");
      if (data.user?.mustChangePassword) {
        setForcedChangePwd(true);
        setShowChangePwd(true);
      }
      setAuthState("in");
    } catch {
      setAuthState("out");
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleLogout = async () => {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    setAuthState("out");
    router.push("/admin");
  };

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-secondary" />
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">Carregando painel</p>
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar — desktop (dark navy pra criar contraste) */}
      <aside className="hidden w-[256px] flex-shrink-0 lg:flex lg:flex-col" style={{ backgroundColor: "#0A1F3D" }}>
        <SidebarContent
          pathname={pathname}
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          onLogout={handleLogout}
          onChangePassword={() => { setForcedChangePwd(false); setShowChangePwd(true); }}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col shadow-2xl lg:hidden" style={{ backgroundColor: "#0A1F3D" }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
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
            />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="-ml-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Abrir menu"
            >
              <HiOutlineMenu className="text-xl" />
            </button>

            <h1 className="truncate text-[15px] font-semibold text-gray-900">
              {title}
            </h1>

            {/* Search global — placeholder por enquanto */}
            <div className="ml-auto hidden lg:block">
              <div className="relative">
                <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empresa, lead, auditoria..."
                  className="h-9 w-72 rounded-lg border border-gray-200 bg-gray-50/50 pl-8 pr-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-100"
                  onFocus={() => router.push("/admin/companies")}
                  readOnly
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-400">⌘K</kbd>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5 lg:ml-3">
              {/* Sino de novidades */}
              <button
                onClick={() => setShowReleasesForce("history")}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                title="Novidades do painel"
                aria-label="Ver novidades"
              >
                <HiOutlineSparkles className="text-lg" />
                {unseenCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {unseenCount}
                  </span>
                )}
              </button>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 md:flex"
              >
                <HiOutlineExternalLink className="text-base" />
                <span>Site</span>
              </a>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-9 items-center gap-2 rounded-lg pl-1 pr-2 transition-colors hover:bg-gray-100"
                >
                  <Avatar name={userName || userEmail || "?"} size="sm" />
                  <HiOutlineChevronDown className="text-sm text-gray-400" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1.5 w-64 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5">
                      <div className="border-b border-gray-100 p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={userName || userEmail || "?"} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                            <p className="truncate text-xs text-gray-500">{userEmail}</p>
                          </div>
                        </div>
                        <span className="mt-2 inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                          {ROLE_LABEL[userRole] ?? userRole}
                        </span>
                      </div>
                      <button
                        onClick={() => { setProfileOpen(false); setForcedChangePwd(false); setShowChangePwd(true); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <HiOutlineKey className="text-base text-gray-400" /> Alterar senha
                      </button>
                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 md:hidden"
                      >
                        <HiOutlineExternalLink className="text-base text-gray-400" /> Ver site
                      </a>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 border-t border-gray-100 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
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
          <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">{children}</div>
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

      {/* Release notes modal — abre automaticamente se houver releases não vistas */}
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
}: {
  pathname: string;
  userRole: string;
  userName: string;
  userEmail: string;
  onNavigate: () => void;
  onLogout: () => void;
  onChangePassword: () => void;
}) {
  const allowedModules = ROLE_PERMS[userRole] ?? ROLE_PERMS["ADMIN"];

  return (
    <>
      {/* Logo */}
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">
          <Image
            src="/images/logo-dark-v3.png"
            alt="B4"
            width={32}
            height={32}
            className="h-6 w-6 object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold text-white leading-tight" style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.01em" }}>
            B4 Gestão
          </div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
            Painel administrativo
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => allowedModules.includes(item.module));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = item.module === "dashboard"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                        active
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-amber-400" />
                      )}
                      <item.Icon className={`text-[18px] flex-shrink-0 ${active ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"}`} />
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
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={onChangePassword}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
        >
          <Avatar name={userName || userEmail || "?"} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{userName || "Usuário"}</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-slate-400">{ROLE_LABEL[userRole] ?? userRole}</p>
          </div>
          <HiOutlineKey className="flex-shrink-0 text-base text-slate-400" />
        </button>
      </div>
    </>
  );
}
