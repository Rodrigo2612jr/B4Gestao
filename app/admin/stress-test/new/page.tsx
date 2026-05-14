"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineSearch,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import { useToast } from "../../_components/ToastProvider";
import { QUESTIONS, type Alternative } from "@/lib/stress-test/questions";

const QUESTIONS_PER_PAGE = 5;
const TOTAL_PAGES = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE);

interface Company {
  id: string;
  name: string;
  cnpj_formatted: string;
}

export default function StressTestNewPage() {
  return (
    <AdminShell title="Nova auditoria — Stress Test">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const router = useRouter();
  const { push } = useToast();
  const [step, setStep] = useState<"company" | "respondent" | number>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [respondentName, setRespondentName] = useState("");
  const [respondentRole, setRespondentRole] = useState("");
  const [answers, setAnswers] = useState<Record<string, Alternative>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / QUESTIONS.length) * 100);

  const next = () => {
    if (step === "company") {
      if (!company) return push("Selecione uma empresa", "error");
      setStep("respondent");
    } else if (step === "respondent") {
      if (respondentName.trim().length < 2) return push("Informe o nome do respondente", "error");
      setStep(0);
    } else if (typeof step === "number") {
      if (step < TOTAL_PAGES - 1) setStep(step + 1);
      else submit();
    }
  };

  const prev = () => {
    if (typeof step === "number") {
      if (step === 0) setStep("respondent");
      else setStep(step - 1);
    } else if (step === "respondent") {
      setStep("company");
    }
  };

  const submit = async () => {
    if (answered < QUESTIONS.length) {
      const missing = QUESTIONS.filter((q) => !answers[q.id]).map((q) => q.id);
      push(`Faltam ${missing.length} respostas: ${missing.slice(0, 3).join(", ")}...`, "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company?.id ?? null,
          respondentName,
          respondentRole: respondentRole || undefined,
          answers,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      push("Auditoria salva!");
      router.push(`/admin/stress-test/${data.id}`);
    } catch (err) {
      push(err instanceof Error ? err.message : "Erro ao salvar", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress bar */}
      {typeof step === "number" && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Página {step + 1} de {TOTAL_PAGES}</span>
            <span>{answered}/{QUESTIONS.length} respondidas ({progress}%)</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {step === "company" && (
        <CompanyStep selected={company} onSelect={setCompany} />
      )}

      {step === "respondent" && (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary">Identificação do respondente</h2>
          <div>
            <label className="text-sm font-medium text-gray-700">Nome completo *</label>
            <input
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Maria Silva"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Cargo / função</label>
            <input
              value={respondentRole}
              onChange={(e) => setRespondentRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Gerente de RH"
            />
          </div>
        </div>
      )}

      {typeof step === "number" && (
        <QuestionPage page={step} answers={answers} setAnswers={setAnswers} />
      )}

      {/* Notas no último passo */}
      {typeof step === "number" && step === TOTAL_PAGES - 1 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-gray-700">Notas adicionais (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Contexto, observações, próximos passos..."
          />
        </div>
      )}

      {/* Nav */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        {step !== "company" ? (
          <button
            onClick={prev}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            <HiOutlineArrowLeft /> Voltar
          </button>
        ) : <div />}
        <button
          onClick={next}
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
        >
          {typeof step === "number" && step === TOTAL_PAGES - 1
            ? <>{submitting ? "Calculando..." : "Finalizar e calcular"} <HiOutlineCheck /></>
            : <>Continuar <HiOutlineArrowRight /></>}
        </button>
      </div>
    </div>
  );
}

function CompanyStep({ selected, onSelect }: { selected: Company | null; onSelect: (c: Company) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = query.length >= 2 ? `/api/companies?q=${encodeURIComponent(query)}` : "/api/companies";
        const res = await fetch(url);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-secondary">Selecione a empresa auditada</h2>
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div>
            <div className="font-medium text-secondary">{selected.name}</div>
            <div className="font-mono text-xs text-gray-500">{selected.cnpj_formatted}</div>
          </div>
          <button onClick={() => onSelect(null as unknown as Company)} className="text-xs font-medium text-gray-500 hover:text-red-600">
            Trocar
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresa por nome..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {loading ? (
              <p className="p-3 text-xs text-gray-500">Buscando...</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-xs text-gray-500">Nenhuma empresa encontrada.</p>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="block w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="text-sm font-medium text-gray-900">{c.name}</div>
                  <div className="font-mono text-xs text-gray-500">{c.cnpj_formatted}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function QuestionPage({
  page,
  answers,
  setAnswers,
}: {
  page: number;
  answers: Record<string, Alternative>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, Alternative>>>;
}) {
  const start = page * QUESTIONS_PER_PAGE;
  const slice = useMemo(() => QUESTIONS.slice(start, start + QUESTIONS_PER_PAGE), [start]);

  return (
    <div className="space-y-4">
      {slice.map((q) => (
        <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {q.id.replace("Q", "")}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{q.text}</p>
              <div className="mt-3 space-y-2">
                {(["A", "B", "C", "D", "E"] as const).map((alt) => {
                  const selected = answers[q.id] === alt;
                  return (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: alt }))}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        selected ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {alt}
                      </span>
                      <span className={selected ? "text-gray-900" : "text-gray-700"}>{q.alternatives[alt]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
