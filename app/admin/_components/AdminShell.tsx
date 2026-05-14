"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "react-icons/hi";
import LoginCard from "./LoginCard";
import ChangePasswordDialog from "./ChangePasswordDialog";
import ToastProvider, { useToast } from "./ToastProvider";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  module: "companies" | "leads" | "pulse" | "stress" | "esocial" | "users";
  badge?: string;
}

const NAV: NavItem[] = [
  { href: "/admin/companies", label: "Empresas", Icon: HiOutlineOfficeBuilding, module: "companies" },
  { href: "/admin/leads", label: "Leads do site", Icon: HiOutlineClipboardList, module: "leads" },
  { href: "/admin/pulse", label: "Pulse NR-1", Icon: HiOutlineChartBar, module: "pulse" },
  { href: "/admin/stress-test", label: "Stress Test", Icon: HiOutlineExclamationCircle, module: "stress" },
  { href: "/admin/esocial", label: "eSocial Analytics", Icon: HiOutlineDocumentReport, module: "esocial" },
];

const ROLE_PERMS: Record<string, string[]> = {
  ADMIN: ["companies", "leads", "pulse", "stress", "esocial", "users"],
  SST: ["companies", "leads", "pulse", "stress", "esocial"],
  RH: ["companies", "pulse", "stress"],
  JURIDICO: ["companies", "esocial"],
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
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string>("ADMIN");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [forcedChangePwd, setForcedChangePwd] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { push } = useToast();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (!res.ok) {
        setAuthState("out");
        return;
      }
      const data = await res.json();
      setUserName(data.user?.name ?? "");
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setAuthState("out");
  };

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
      </div>
    );
  }

  if (authState === "out") {
    return (
      <LoginCard
        onSuccess={async (mustChange) => {
          if (mustChange) {
            setForcedChangePwd(true);
            setShowChangePwd(true);
          }
          await checkAuth();
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} userRole={userRole} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Sidebar — mobile (drawer) */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl lg:hidden">
            <SidebarContent pathname={pathname} userRole={userRole} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                aria-label="Abrir menu"
              >
                <HiOutlineMenu className="text-xl" />
              </button>
              <h1
                className="truncate text-base font-bold text-secondary sm:text-lg"
                style={{ fontFamily: "var(--font-display), system-ui" }}
              >
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 sm:flex sm:h-10 sm:px-4 sm:text-sm"
              >
                <HiOutlineExternalLink />
                <span>Ver site</span>
              </a>
              <button
                onClick={() => {
                  setForcedChangePwd(false);
                  setShowChangePwd(true);
                }}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:h-10 sm:px-4 sm:text-sm"
                title="Alterar senha"
              >
                <HiOutlineKey />
                <span className="hidden sm:inline">Senha</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:h-10 sm:px-4 sm:text-sm"
                title="Sair"
              >
                <HiOutlineLogout />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
          {userName && (
            <div className="hidden border-t border-gray-100 px-6 py-1.5 text-xs text-gray-500 lg:block">
              Logado como <span className="font-medium text-gray-700">{userName}</span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
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
    </div>
  );
}

function SidebarContent({
  pathname,
  userRole,
  onNavigate,
}: {
  pathname: string;
  userRole: string;
  onNavigate: () => void;
}) {
  const allowedModules = ROLE_PERMS[userRole] ?? ROLE_PERMS["ADMIN"];
  const visibleNav = NAV.filter((item) => allowedModules.includes(item.module));

  return (
    <>
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <Image
          src="/images/logo-dark-v3.png"
          alt="B4"
          width={36}
          height={36}
          className="h-9 w-9 flex-shrink-0 object-contain"
          priority
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-secondary" style={{ fontFamily: "var(--font-display), system-ui" }}>
            B4 Admin
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">
            {userRole}
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visibleNav.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.Icon className={`text-lg flex-shrink-0 ${active ? "text-primary" : "text-gray-400"}`} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          <HiOutlineExternalLink className="text-base" />
          Ver site público
        </a>
      </div>
    </>
  );
}
