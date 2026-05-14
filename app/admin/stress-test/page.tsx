"use client";

import AdminShell from "../_components/AdminShell";
import { HiOutlineExclamationCircle } from "react-icons/hi";

export default function StressTestPage() {
  return (
    <AdminShell title="Stress Test NR-1">
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <HiOutlineExclamationCircle className="mx-auto text-5xl text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-secondary">Stress Test NR-1</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Auditoria de 25 perguntas com scoring A/B/C/D/E, semáforo (Verde/Amarelo/Vermelho), Risco de Engavetamento e FAIXA de exposição regulatória.
        </p>
        <p className="mt-6 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-700">
          Em construção
        </p>
      </div>
    </AdminShell>
  );
}
