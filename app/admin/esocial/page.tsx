"use client";

import AdminShell from "../_components/AdminShell";
import { HiOutlineDocumentReport } from "react-icons/hi";

export default function ESocialPage() {
  return (
    <AdminShell title="eSocial Analytics">
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <HiOutlineDocumentReport className="mx-auto text-5xl text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-secondary">eSocial & SST Analytics</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Ingestão de XML/ZIP/CSV do eSocial, cruzamentos S-2240×S-2220 e S-2210×S-2230, alertas LINACH, FAE, ruído e saúde mental. Custo Previsível em faixas.
        </p>
        <p className="mt-6 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-700">
          Em construção
        </p>
      </div>
    </AdminShell>
  );
}
