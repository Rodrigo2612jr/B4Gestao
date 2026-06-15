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

export default function PageHeader({ title, subtitle, breadcrumbs, actions, meta }: Props) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-gray-400" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <HiOutlineChevronRight className="text-gray-300" />}
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-gray-700">
                  {b.label}
                </Link>
              ) : (
                <span className="text-gray-600">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1
              className="truncate text-2xl font-bold text-secondary sm:text-[26px]"
              style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.025em" }}
            >
              {title}
            </h1>
            {meta}
          </div>
          {subtitle && <p className="mt-1 text-sm leading-relaxed text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
