"use client";

import { AEP_STATUS_LABEL, AEP_STATUS_COLOR, type AepStatus } from "@/lib/aep/scoring";

const CLASSES: Record<string, string> = {
  gray: "bg-b4-surface-2 text-b4-ink-2 ring-b4-line-strong",
  blue: "bg-sky-100 text-sky-700 ring-sky-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  red: "bg-rose-100 text-rose-700 ring-rose-200",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

export default function StatusBadge({ status }: { status: AepStatus | string }) {
  const color = AEP_STATUS_COLOR[status as AepStatus] ?? "gray";
  const label = AEP_STATUS_LABEL[status as AepStatus] ?? status;
  return (
    <span className={`b4-chip font-semibold ring-1 ring-inset ${CLASSES[color] ?? CLASSES.gray}`}>
      {label}
    </span>
  );
}
