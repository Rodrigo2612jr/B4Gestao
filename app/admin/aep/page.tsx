"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePlus, HiOutlineClipboardCheck, HiOutlineChevronRight } from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import StatusBadge from "./_components/StatusBadge";
import type { AepStatus } from "@/lib/aep/scoring";

interface Row {
  id: string;
  company_name: string | null;
  title: string;
  status: AepStatus;
  avaliador_name: string | null;
  supervisor_name: string | null;
  updated_at: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export default function AepListPage() {
  return (
    <AdminShell title="AEP — Avaliações Ergonômicas">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/aep");
      if (!res.ok) throw new Error("Erro ao carregar");
      setRows(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-secondary">Avaliações Ergonômicas Preliminares</h2>
          <p className="text-sm text-gray-500">FO-SST.013 — NR-17 / ABNT ISO 20646:2017</p>
        </div>
        <button
          onClick={() => router.push("/admin/aep/new")}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <HiOutlinePlus /> Nova AEP
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <HiOutlineClipboardCheck className="mx-auto text-4xl text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">Nenhuma avaliação ainda</p>
          <p className="mt-1 text-xs text-gray-500">Crie a primeira AEP para uma empresa atendida.</p>
          <button
            onClick={() => router.push("/admin/aep/new")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <HiOutlinePlus /> Nova AEP
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Avaliação</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Técnico</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Supervisor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Atualizado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/admin/aep/${r.id}`)}
                  className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-primary/5"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{r.company_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.title}</td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{r.avaliador_name ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{r.supervisor_name ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="hidden px-4 py-3 text-xs text-gray-500 lg:table-cell">{fmtDate(r.updated_at)}</td>
                  <td className="px-4 py-3 text-right text-gray-400"><HiOutlineChevronRight /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
