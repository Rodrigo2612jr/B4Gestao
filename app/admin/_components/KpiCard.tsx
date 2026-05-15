"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { HiOutlineArrowSmRight } from "react-icons/hi";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  icon?: ReactNode;
  href?: string;
  /** Cor de destaque (default: primary). */
  accent?: "primary" | "emerald" | "amber" | "red" | "violet";
  loading?: boolean;
}

const ACCENT: Record<NonNullable<Props["accent"]>, { bg: string; text: string; ring: string; chip: string }> = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    ring: "hover:ring-primary/30",
    chip: "bg-primary/10 text-primary",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "hover:ring-emerald-300",
    chip: "bg-emerald-50 text-emerald-700",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    ring: "hover:ring-amber-300",
    chip: "bg-amber-50 text-amber-700",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    ring: "hover:ring-red-300",
    chip: "bg-red-50 text-red-700",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    ring: "hover:ring-violet-300",
    chip: "bg-violet-50 text-violet-700",
  },
};

/**
 * Card de KPI premium — usado no dashboard.
 *
 *  ┌─────────────────────────────────────┐
 *  │ [icon]               24            │
 *  │ Empresas             ↑ +3 esta sem │
 *  │ + 2 esta semana                  → │
 *  └─────────────────────────────────────┘
 */
export default function KpiCard({
  label,
  value,
  hint,
  trend,
  icon,
  href,
  accent = "primary",
  loading,
}: Props) {
  const a = ACCENT[accent];

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        {icon && (
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${a.bg} ${a.text} text-xl`}>
            {icon}
          </div>
        )}
        {trend && !loading && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
            {trend.positive ? "↑" : "·"} {trend.value}
          </span>
        )}
      </div>
      <div className="mt-3 flex-1">
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="text-3xl font-bold text-secondary">{value}</p>
        )}
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        {hint && !loading && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
      {href && !loading && (
        <p className={`mt-3 inline-flex items-center gap-0.5 text-xs font-medium ${a.text}`}>
          Ver detalhes <HiOutlineArrowSmRight />
        </p>
      )}
    </div>
  );

  const cls = `group block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all ${href ? `hover:shadow-md hover:ring-2 ${a.ring} cursor-pointer` : ""}`;

  if (href) return <Link href={href} className={cls}>{body}</Link>;
  return <div className={cls}>{body}</div>;
}
