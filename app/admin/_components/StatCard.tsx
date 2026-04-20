import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: "primary" | "accent" | "amber" | "purple";
}

const ACCENTS = {
  primary: "bg-blue-50 text-blue-700",
  accent: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  purple: "bg-purple-50 text-purple-700",
};

export default function StatCard({ icon, label, value, accent = "primary" }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${ACCENTS[accent]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-bold text-gray-900 sm:text-3xl">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
