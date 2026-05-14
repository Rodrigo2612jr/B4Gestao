"use client";

import AdminShell from "../_components/AdminShell";
import { HiOutlineChartBar } from "react-icons/hi";

export default function PulsePage() {
  return (
    <AdminShell title="Pulse NR-1">
      <ModulePlaceholder
        Icon={HiOutlineChartBar}
        title="Diagnóstico Express NR-1 (Pulse)"
        description="Pesquisa amostral com escala Likert 1-5, scoring por área com threshold de anonimato e geração automática de PPTX/PDF."
      />
    </AdminShell>
  );
}

function ModulePlaceholder({
  Icon,
  title,
  description,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
      <Icon className="mx-auto text-5xl text-gray-300" />
      <h2 className="mt-4 text-xl font-bold text-secondary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
      <p className="mt-6 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-700">
        Em construção
      </p>
    </div>
  );
}
