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

const DISPLAY = "var(--font-admin-display), system-ui, sans-serif";

interface Props {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  loading?: boolean;
  /** Card de destaque (painel navy B4, texto branco). */
  featured?: boolean;
  tone?: Tone;
  href?: string;
}

/**
 * KPI tile padrão do painel (identidade B4). Use `featured` para o card navy de destaque.
 */
export default function KpiTile({ label, value, icon, hint, loading, featured, tone = "blue", href }: Props) {
  const inner = featured ? (
    <div className="b4-feature h-full p-5">
      <div className="relative">
        <div className="flex items-center gap-2 text-white/85">
          {icon && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg ring-1 ring-white/15">{icon}</span>}
          <span className="text-xs font-medium">{label}</span>
        </div>
        {loading ? (
          <div className="mt-4 h-9 w-16 animate-pulse rounded bg-white/20" />
        ) : (
          <p className="mt-3 text-4xl font-bold tabular-nums" style={{ fontFamily: DISPLAY }}>{value}</p>
        )}
        {hint && !loading && <p className="mt-1 text-xs text-white/70">{hint}</p>}
      </div>
    </div>
  ) : (
    <div className="b4-card b4-card-hover h-full p-5">
      <div className="flex items-center gap-2">
        {icon && <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${TONES[tone].bg} ${TONES[tone].text}`}>{icon}</span>}
        <span className="text-xs font-medium text-b4-ink-2">{label}</span>
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-12 animate-pulse rounded bg-b4-surface-2" />
      ) : (
        <p className="mt-3 text-4xl font-bold tabular-nums text-b4-ink" style={{ fontFamily: DISPLAY }}>{value}</p>
      )}
      {hint && !loading && <p className="mt-1 text-xs text-b4-ink-3">{hint}</p>}
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}
