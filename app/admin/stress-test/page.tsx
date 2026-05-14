"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlinePlus,
  HiOutlineExclamationCircle,
  HiOutlineUser,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import { useToast } from "../_components/ToastProvider";

interface StressItem {
  id: string;
  companyId: string | null;
  respondentName: string;
  respondentRole: string | null;
  scoreTotal: number;
  semaforo: "VERDE" | "AMARELO" | "VERMELHO";
  engavetamento: number;
  coerencia: string;
  faixa: string;
  createdAt: string;
}

const SEMAFORO_STYLES: Record<string, string> = {
  VERDE: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  AMARELO: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200",
  VERMELHO: "bg-red-100 text-red-800 ring-1 ring-red-200",
};

export default function StressTestListPage() {
  return (
    <AdminShell title="Stress Test NR-1">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [items, setItems] = useState<StressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stress-test");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      push("Erro ao carregar auditorias", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? "auditoria realizada" : "auditorias realizadas"}
        </p>
        <Link
          href="/admin/stress-test/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
        >
          <HiOutlinePlus />
          Nova auditoria
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <HiOutlineExclamationCircle className="mx-auto text-5xl text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Nenhuma auditoria realizada ainda.</p>
          <Link
            href="/admin/stress-test/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <HiOutlinePlus /> Criar primeira auditoria
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Respondente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Semáforo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Engavetamento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Faixa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((it) => (
                <tr
                  key={it.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => (window.location.href = `/admin/stress-test/${it.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HiOutlineUser className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{it.respondentName}</div>
                        {it.respondentRole && (
                          <div className="text-xs text-gray-500">{it.respondentRole}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">{it.scoreTotal}/100</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEMAFORO_STYLES[it.semaforo]}`}>
                      {it.semaforo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{it.engavetamento}/32</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wider text-gray-600">{it.faixa}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(it.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
