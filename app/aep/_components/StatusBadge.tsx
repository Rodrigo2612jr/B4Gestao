"use client";

import { AEP_STATUS_LABEL, AEP_STATUS_COLOR, type AepStatus } from "@/lib/aep/scoring";

const CLASSES: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  blue: "bg-blue-100 text-blue-700 ring-blue-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  red: "bg-red-100 text-red-700 ring-red-200",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

export default function StatusBadge({ status }: { status: AepStatus | string }) {
  const color = AEP_STATUS_COLOR[status as AepStatus] ?? "gray";
  const label = AEP_STATUS_LABEL[status as AepStatus] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${CLASSES[color] ?? CLASSES.gray}`}>
      {label}
    </span>
  );
}
