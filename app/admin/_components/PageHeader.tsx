"use client";

import Link from "next/link";
import { HiOutlineChevronRight } from "react-icons/hi";
import { ReactNode } from "react";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  meta?: ReactNode;
  /** Cor de acento para a faixa lateral esquerda. */
  accent?: "primary" | "amber" | "violet" | "emerald" | "rose";
}

const ACCENT_COLOR: Record<NonNullable<Props["accent"]>, string> = {
  primary: "bg-secondary",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

export default function PageHeader({ title, subtitle, breadcrumbs, actions, meta, accent = "primary" }: Props) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Faixa de cor no topo */}
      <div className={`h-1 ${ACCENT_COLOR[accent]}`} />

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1 text-xs text-slate-400" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <HiOutlineChevronRight className="text-slate-300" />}
                {b.href ? (
                  <Link href={b.href} className="transition-colors hover:text-slate-700">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-600">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1
                className="truncate text-2xl font-bold text-slate-900 sm:text-[26px]"
                style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.025em" }}
              >
                {title}
              </h1>
              {meta}
            </div>
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
