"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineCheck } from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import CompanyPickerOrCreate, { type SelectableCompany as Company } from "../../_components/CompanyPickerOrCreate";
import { useToast } from "../../_components/ToastProvider";

interface UserOpt { id: string; name: string; email: string }

export default function AepNewPage() {
  return (
    <AdminShell title="Nova AEP">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const router = useRouter();
  const { push } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [title, setTitle] = useState("");
  const [unidade, setUnidade] = useState("");
  const [data, setData] = useState("");
  const [cargo, setCargo] = useState("");
  const [supervisors, setSupervisors] = useState<UserOpt[]>([]);
  const [supervisorId, setSupervisorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/aep/users?role=SUPERVISOR")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSupervisors)
      .catch(() => setSupervisors([]));
  }, []);

  const submit = async () => {
    if (!company) return push("Selecione a empresa avaliada", "error");
    if (title.trim().length < 2) return push("Informe um título para a avaliação", "error");
    setSubmitting(true);
    try {
      const res = await fetch("/api/aep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          title: title.trim(),
          unidade: unidade || null,
          dataAvaliacao: data || null,
          avaliadorCargo: cargo || null,
          supervisorUserId: supervisorId || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Erro ao criar");
      push("Avaliação criada!");
      router.push(`/admin/aep/${d.id}`);
    } catch (e) {
      push(e instanceof Error ? e.message : "Erro", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <CompanyPickerOrCreate selected={company} onSelect={setCompany} title="Empresa avaliada" />

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-secondary">Dados da avaliação</h2>
        <div>
          <label className="text-sm font-medium text-gray-700">Título da avaliação *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: AEP — Canteiro Obra Central / 2026"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Unidade</label>
            <input
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              placeholder="Ex: Matriz / Obra X"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Data da avaliação</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Cargo do avaliador</label>
            <input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Téc. Segurança do Trabalho"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Supervisor (aprovação)</label>
            <select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Selecione…</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {supervisors.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-600">Nenhum supervisor cadastrado ainda. Você pode definir depois.</p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">Você (técnico) será o avaliador desta AEP. O supervisor poderá acompanhar e aprovar.</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Criando..." : <>Criar e começar <HiOutlineCheck /></>}
        </button>
      </div>
    </div>
  );
}
