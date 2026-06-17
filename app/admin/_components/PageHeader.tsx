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
  /** Mantido por compatibilidade · não altera mais o visual. */
  accent?: "primary" | "amber" | "violet" | "emerald" | "rose";
}

const DISPLAY = "var(--font-admin-display), system-ui, sans-serif";

export default function PageHeader({ title, subtitle, breadcrumbs, actions, meta }: Props) {
  return (
    <div className="mb-7">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-b4-ink-3" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <HiOutlineChevronRight className="text-b4-ink-3/60" />}
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-b4-ink">
                  {b.label}
                </Link>
              ) : (
                <span className="text-b4-ink-2">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1
              className="truncate text-2xl font-bold text-b4-ink sm:text-[26px]"
              style={{ fontFamily: DISPLAY, letterSpacing: "-0.03em" }}
            >
              {title}
            </h1>
            {meta}
          </div>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-b4-ink-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
