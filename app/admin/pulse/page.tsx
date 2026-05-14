"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HiOutlinePlus, HiOutlineChartBar } from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import { useToast } from "../_components/ToastProvider";

interface Item {
  id: string;
  title: string;
  token: string;
  areas: string[];
  threshold: number;
  status: "open" | "closed";
  createdAt: string;
}

export default function PulseListPage() {
  return (
    <AdminShell title="Pulse NR-1">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pulse");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      push("Erro ao carregar campanhas", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? "pesquisa" : "pesquisas"}
        </p>
        <Link href="/admin/pulse/new" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark">
          <HiOutlinePlus /> Nova pesquisa
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <HiOutlineChartBar className="mx-auto text-5xl text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Nenhuma pesquisa criada ainda.</p>
          <Link href="/admin/pulse/new" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            <HiOutlinePlus /> Criar primeira pesquisa
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link key={c.id} href={`/admin/pulse/${c.id}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="flex items-start justify-between">
                <HiOutlineChartBar className="text-2xl text-primary" />
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  c.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {c.status === "open" ? "Aberta" : "Encerrada"}
                </span>
              </div>
              <h3 className="mt-3 truncate text-sm font-semibold text-secondary">{c.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{c.areas.length} área(s) · threshold {c.threshold}</p>
              <p className="mt-3 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
