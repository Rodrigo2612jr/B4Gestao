"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "blue" | "amber" | "emerald" | "violet" | "rose" | "sky";

const TONES: Record<Tone, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600" },
};

interface Props {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  loading?: boolean;
  /** Card de destaque (gradiente azul B4, texto branco). */
  featured?: boolean;
  tone?: Tone;
  href?: string;
}

/**
 * KPI tile padrão do painel (estilo profissional, identidade B4).
 * Use `featured` para o card de destaque (azul B4) · um por grupo.
 */
export default function KpiTile({ label, value, icon, hint, loading, featured, tone = "blue", href }: Props) {
  const inner = featured ? (
    <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-md shadow-primary/20">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-white/80">
          {icon && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg">{icon}</span>}
          <span className="text-xs font-medium">{label}</span>
        </div>
        {loading ? (
          <div className="mt-4 h-9 w-16 animate-pulse rounded bg-white/20" />
        ) : (
          <p className="mt-3 text-4xl font-bold tabular-nums">{value}</p>
        )}
        {hint && !loading && <p className="mt-1 text-xs text-white/70">{hint}</p>}
      </div>
    </div>
  ) : (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2">
        {icon && <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${TONES[tone].bg} ${TONES[tone].text}`}>{icon}</span>}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-12 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-3 text-4xl font-bold tabular-nums text-secondary">{value}</p>
      )}
      {hint && !loading && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}
