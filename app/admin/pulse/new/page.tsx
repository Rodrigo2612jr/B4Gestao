"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineX, HiOutlinePlus, HiOutlineCheck, HiOutlinePencil, HiOutlineTrash, HiOutlineChevronRight } from "react-icons/hi";
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
  const [title, setTitle] = useState("Pulse NR-1 · diagnóstico psicossocial");
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
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-b4-ink-3" aria-label="Breadcrumb">
        <a href="/admin" className="transition-colors hover:text-b4-ink">Painel B4</a>
        <HiOutlineChevronRight className="text-b4-ink-3/60" />
        <a href="/admin/pulse" className="transition-colors hover:text-b4-ink">Pulse</a>
        <HiOutlineChevronRight className="text-b4-ink-3/60" />
        <span className="text-b4-ink-2">Nova pesquisa</span>
      </nav>

      <div>
        <span className="b4-eyebrow">Pulse NR-1</span>
        <h2
          className="mt-2 text-2xl font-bold text-b4-ink"
          style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.025em" }}
        >
          Nova pesquisa Pulse
        </h2>
        <p className="mt-1 text-sm text-b4-ink-2">Configure e lance uma nova campanha de clima psicossocial NR-1.</p>
      </div>

      {/* Empresa */}
      <CompanyPickerOrCreate selected={company} onSelect={setCompany} />

      {/* Configuracoes principais */}
      <div className="b4-card p-6 space-y-5">
        <h3 className="text-sm font-bold text-b4-ink border-b border-b4-line pb-3">Configurações da pesquisa</h3>

        <div>
          <label className="block text-sm font-medium text-b4-ink-2">Título da pesquisa</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-b4-line px-3 py-2.5 text-sm text-b4-ink outline-none transition focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-b4-ink-2">Áreas / departamentos</label>
          <p className="mt-0.5 text-xs text-b4-ink-3">Cada respondente seleciona sua área. Só aparecem agregados acima do threshold.</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {areas.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 rounded-xl bg-b4-navy/10 px-3 py-1 text-xs font-medium text-b4-navy">
                {a}
                <button onClick={() => setAreas(areas.filter((x) => x !== a))} className="hover:text-red-600" aria-label={`Remover ${a}`}>
                  <HiOutlineX />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <input
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArea(); } }}
              placeholder="Ex: Produção"
              className="flex-1 rounded-xl border border-b4-line px-3 py-2.5 text-sm text-b4-ink outline-none transition placeholder:text-b4-ink-3 focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
            />
            <button
              onClick={addArea}
              className="rounded-xl border border-b4-line bg-b4-surface px-3 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2"
              aria-label="Adicionar área"
            >
              <HiOutlinePlus />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-b4-ink-2">Threshold de anonimato</label>
          <p className="mt-0.5 text-xs text-b4-ink-3">Mínimo de respostas por área para liberar visualização. Recomendado: 8 (mínimo) a 15 (ideal).</p>
          <input
            type="number"
            min={3}
            max={50}
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 8)}
            className="mt-1.5 w-32 rounded-xl border border-b4-line px-3 py-2.5 text-sm text-b4-ink outline-none transition focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-b4-ink-2">Questionário</label>
            <button
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-b4-navy hover:underline"
            >
              <HiOutlinePencil /> Editar perguntas
            </button>
          </div>
          <p className="mt-1 text-xs text-b4-ink-3">
            {questions.length} perguntas · escala Likert 1-5 · {new Set(questions.map((q) => q.dimension)).size} dimensões
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(new Set(questions.map((q) => q.dimension))).map((d) => (
              <span key={d} className="rounded-xl bg-b4-navy/10 px-2.5 py-0.5 text-[10px] font-medium text-b4-navy">
                {DIMENSION_LABELS[d as Dimension] ?? d}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-b4-navy px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-b4-navy-deep disabled:opacity-60"
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
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-b4-surface shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-b4-line bg-b4-surface px-5 py-4">
          <h3 className="text-lg font-bold text-b4-ink" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>Editor de perguntas Pulse</h3>
          <div className="flex items-center gap-3">
            <button onClick={onResetTemplate} className="text-xs font-medium text-b4-ink-2 hover:text-b4-navy">
              Restaurar template padrão
            </button>
            <button onClick={onClose} className="text-b4-ink-3 hover:text-b4-ink" aria-label="Fechar">
              <HiOutlineX className="text-xl" />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {qs.map((q, idx) => (
            <div key={idx} className="rounded-2xl border border-b4-line bg-b4-surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-xl border border-b4-line px-1.5 py-0.5 text-xs text-b4-ink-2 disabled:opacity-30 hover:border-b4-navy/40 hover:text-b4-navy"
                  >↑</button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === qs.length - 1}
                    className="rounded-xl border border-b4-line px-1.5 py-0.5 text-xs text-b4-ink-2 disabled:opacity-30 hover:border-b4-navy/40 hover:text-b4-navy"
                  >↓</button>
                </div>
                <div className="grid flex-1 gap-2">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <input
                      value={q.id}
                      onChange={(e) => update(idx, { id: e.target.value })}
                      className="rounded-xl border border-b4-line px-2 py-1.5 font-mono text-xs text-b4-ink outline-none focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
                      placeholder="P1"
                    />
                    <input
                      value={q.text}
                      onChange={(e) => update(idx, { text: e.target.value })}
                      className="rounded-xl border border-b4-line px-2 py-1.5 text-sm text-b4-ink outline-none focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
                      placeholder="Texto da pergunta"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={q.dimension}
                      onChange={(e) => update(idx, { dimension: e.target.value as Dimension })}
                      className="rounded-xl border border-b4-line px-2 py-1.5 text-xs text-b4-ink outline-none focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
                    >
                      {Object.entries(DIMENSION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-b4-ink-2">
                      <input
                        type="checkbox"
                        checked={!!q.reverse}
                        onChange={(e) => update(idx, { reverse: e.target.checked })}
                      />
                      Pontuação invertida (5 = pior)
                    </label>
                    <button
                      onClick={() => remove(idx)}
                      className="ml-auto text-red-500 hover:text-red-700"
                      title="Remover"
                      aria-label="Remover pergunta"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addNew}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-b4-line py-3 text-sm font-medium text-b4-ink-2 transition hover:border-b4-navy/40 hover:text-b4-navy"
          >
            <HiOutlinePlus /> Adicionar pergunta
          </button>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-b4-line bg-b4-surface px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2"
          >Cancelar</button>
          <button
            onClick={save}
            className="rounded-xl bg-b4-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-b4-navy-deep"
          >Salvar</button>
        </div>
      </div>
    </div>
  );
}
