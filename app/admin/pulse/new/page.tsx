"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineX, HiOutlinePlus, HiOutlineCheck, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import CompanyPickerOrCreate, { type SelectableCompany as Company } from "../../_components/CompanyPickerOrCreate";
import { useToast } from "../../_components/ToastProvider";
import { DEFAULT_TEMPLATE, DIMENSION_LABELS, type PulseQuestion, type Dimension } from "@/lib/pulse/templates";

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
  const [questions, setQuestions] = useState<PulseQuestion[]>(DEFAULT_TEMPLATE);
  const [showEditor, setShowEditor] = useState(false);
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
    if (questions.length < 3) return push("Adicione ao menos 3 perguntas", "error");
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
          questions,
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

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Questionário</label>
            <button onClick={() => setShowEditor(true)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              <HiOutlinePencil /> Editar perguntas
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">{questions.length} perguntas · escala Likert 1-5 · {new Set(questions.map((q) => q.dimension)).size} dimensões</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from(new Set(questions.map((q) => q.dimension))).map((d) => (
              <span key={d} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                {DIMENSION_LABELS[d as Dimension] ?? d}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? "Criando..." : <><HiOutlineCheck /> Criar pesquisa</>}
        </button>
      </div>

      {showEditor && (
        <QuestionEditor
          questions={questions}
          onSave={(qs) => { setQuestions(qs); setShowEditor(false); push("Perguntas atualizadas"); }}
          onClose={() => setShowEditor(false)}
          onResetTemplate={() => { setQuestions(DEFAULT_TEMPLATE); push("Template restaurado"); }}
        />
      )}
    </div>
  );
}

function QuestionEditor({
  questions: initial,
  onSave,
  onClose,
  onResetTemplate,
}: {
  questions: PulseQuestion[];
  onSave: (qs: PulseQuestion[]) => void;
  onClose: () => void;
  onResetTemplate: () => void;
}) {
  const [qs, setQs] = useState<PulseQuestion[]>(initial);

  const addNew = () => {
    const nextId = `P${qs.length + 1}`;
    setQs([...qs, { id: nextId, text: "", dimension: "saude" as Dimension }]);
  };

  const update = (idx: number, patch: Partial<PulseQuestion>) => {
    setQs(qs.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };

  const remove = (idx: number) => setQs(qs.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= qs.length) return;
    const copy = [...qs];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    setQs(copy);
  };

  const validate = (): string | null => {
    if (qs.length < 3) return "Mínimo de 3 perguntas";
    if (qs.length > 60) return "Máximo de 60 perguntas";
    const ids = new Set<string>();
    for (const q of qs) {
      if (!q.text.trim() || q.text.length < 3) return `Pergunta ${q.id}: texto muito curto`;
      if (ids.has(q.id)) return `ID duplicado: ${q.id}`;
      ids.add(q.id);
    }
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) return alert(err);
    onSave(qs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
          <h3 className="text-lg font-bold text-secondary">Editor de perguntas Pulse</h3>
          <div className="flex gap-2">
            <button onClick={onResetTemplate} className="text-xs font-medium text-gray-600 hover:text-primary">
              Restaurar template padrão
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><HiOutlineX className="text-xl" /></button>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {qs.map((q, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded border border-gray-200 px-1 text-xs disabled:opacity-30">↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === qs.length - 1} className="rounded border border-gray-200 px-1 text-xs disabled:opacity-30">↓</button>
                </div>
                <div className="grid flex-1 gap-2">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <input
                      value={q.id}
                      onChange={(e) => update(idx, { id: e.target.value })}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 font-mono text-xs"
                      placeholder="P1"
                    />
                    <input
                      value={q.text}
                      onChange={(e) => update(idx, { text: e.target.value })}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                      placeholder="Texto da pergunta"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={q.dimension}
                      onChange={(e) => update(idx, { dimension: e.target.value as Dimension })}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                    >
                      {Object.entries(DIMENSION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!q.reverse}
                        onChange={(e) => update(idx, { reverse: e.target.checked })}
                      />
                      Pontuação invertida (5 = pior)
                    </label>
                    <button onClick={() => remove(idx)} className="ml-auto text-red-600 hover:text-red-700" title="Remover">
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addNew} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary">
            <HiOutlinePlus /> Adicionar pergunta
          </button>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white p-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">Salvar</button>
        </div>
      </div>
    </div>
  );
}

