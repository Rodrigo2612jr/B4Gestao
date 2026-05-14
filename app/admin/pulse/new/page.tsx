"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineX, HiOutlinePlus, HiOutlineCheck } from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import CompanyPickerOrCreate, { type SelectableCompany as Company } from "../../_components/CompanyPickerOrCreate";
import { useToast } from "../../_components/ToastProvider";

export default function NewCampaignPage() {
  return (
    <AdminShell title="Nova pesquisa Pulse">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const router = useRouter();
  const { push } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [title, setTitle] = useState("Pulse NR-1 — diagnóstico psicossocial");
  const [areas, setAreas] = useState<string[]>(["Administrativo", "Operações", "Comercial"]);
  const [areaInput, setAreaInput] = useState("");
  const [threshold, setThreshold] = useState(8);
  const [busy, setBusy] = useState(false);

  const addArea = () => {
    const v = areaInput.trim();
    if (!v) return;
    if (areas.includes(v)) return;
    setAreas([...areas, v]);
    setAreaInput("");
  };

  const submit = async () => {
    if (!company) return push("Selecione uma empresa", "error");
    if (areas.length === 0) return push("Adicione ao menos 1 área", "error");
    setBusy(true);
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          title,
          areas,
          anonymityThreshold: threshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      push("Pesquisa criada!");
      router.push(`/admin/pulse/${data.id}`);
    } catch (err) {
      push(err instanceof Error ? err.message : "Erro", "error");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <CompanyPickerOrCreate selected={company} onSelect={setCompany} />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Título da pesquisa</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Áreas / departamentos</label>
          <p className="text-xs text-gray-500">Cada respondente seleciona sua área. Só aparecem agregados acima do threshold.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {areas.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {a}
                <button onClick={() => setAreas(areas.filter((x) => x !== a))} className="hover:text-red-600">
                  <HiOutlineX />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArea(); } }}
              placeholder="Ex: Produção"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={addArea} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <HiOutlinePlus />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Threshold de anonimato</label>
          <p className="text-xs text-gray-500">Mínimo de respostas por área para liberar visualização. Recomendado: 8 (mínimo) a 15 (ideal).</p>
          <input
            type="number"
            min={3}
            max={50}
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 8)}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
          Será usado o template padrão de <strong>15 perguntas em escala Likert 1-5</strong> cobrindo 7 dimensões NR-1 (demandas, controle, apoio, relacionamentos, papel, mudança, saúde).
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? "Criando..." : <><HiOutlineCheck /> Criar pesquisa</>}
        </button>
      </div>
    </div>
  );
}

