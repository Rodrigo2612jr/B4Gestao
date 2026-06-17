"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import CompanyPickerOrCreate, { type SelectableCompany as Company } from "../../_components/CompanyPickerOrCreate";
import { useToast } from "../../_components/ToastProvider";
import { QUESTIONS, type Alternative } from "@/lib/stress-test/questions";

const QUESTIONS_PER_PAGE = 5;
const TOTAL_PAGES = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE);

export default function StressTestNewPage() {
  return (
    <AdminShell title="Nova auditoria · Stress Test">
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

  /* Step label helper */
  const stepLabel =
    step === "company"    ? "Empresa"      :
    step === "respondent" ? "Respondente"  :
    typeof step === "number" ? `Perguntas ${step * QUESTIONS_PER_PAGE + 1}-${Math.min((step + 1) * QUESTIONS_PER_PAGE, QUESTIONS.length)}` :
    "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Wizard header */}
      <div>
        <span className="b4-eyebrow">Conformidade NR-1</span>
        <h2
          className="mt-2 text-[26px] font-bold text-b4-ink"
          style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.03em" }}
        >
          Nova auditoria · Stress Test NR-1
        </h2>
        <p className="mt-1 text-sm text-b4-ink-2">Etapa atual: {stepLabel}</p>
      </div>

      {/* Progress bar (somente na fase de perguntas) */}
      {typeof step === "number" && (
        <div className="b4-card p-4">
          <div className="flex items-center justify-between text-xs text-b4-ink-2">
            <span className="font-medium text-b4-ink-2">
              Página {step + 1} de {TOTAL_PAGES}
            </span>
            <span className={answered === QUESTIONS.length ? "font-semibold text-emerald-600" : ""}>
              {answered}/{QUESTIONS.length} respondidas ({progress}%)
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-b4-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-b4-navy to-b4-navy-deep transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step: empresa */}
      {step === "company" && (
        <CompanyPickerOrCreate selected={company} onSelect={setCompany} title="Empresa auditada" />
      )}

      {/* Step: respondente */}
      {step === "respondent" && (
        <div className="b4-card space-y-5 p-6">
          <h3 className="text-base font-bold text-b4-ink">Identificação do respondente</h3>
          <div>
            <label className="text-sm font-medium text-b4-ink-2">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
              placeholder="Ex: Maria Silva"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-b4-ink-2">Cargo / função</label>
            <input
              value={respondentRole}
              onChange={(e) => setRespondentRole(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
              placeholder="Ex: Gerente de RH"
            />
          </div>
        </div>
      )}

      {/* Step: perguntas */}
      {typeof step === "number" && (
        <QuestionPage page={step} answers={answers} setAnswers={setAnswers} />
      )}

      {/* Notas no último passo */}
      {typeof step === "number" && step === TOTAL_PAGES - 1 && (
        <div className="b4-card p-6">
          <label className="text-sm font-medium text-b4-ink-2">Notas adicionais (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
            placeholder="Contexto, observações, próximos passos..."
          />
        </div>
      )}

      {/* Nav sticky */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-b4-line bg-b4-surface/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        {step !== "company" ? (
          <button
            onClick={prev}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2 disabled:opacity-60"
          >
            <HiOutlineArrowLeft /> Voltar
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={next}
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-xl bg-b4-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-b4-navy/20 hover:bg-b4-navy-deep disabled:opacity-60"
        >
          {typeof step === "number" && step === TOTAL_PAGES - 1 ? (
            <>{submitting ? "Calculando..." : "Finalizar e calcular"} <HiOutlineCheck /></>
          ) : (
            <>Continuar <HiOutlineArrowRight /></>
          )}
        </button>
      </div>
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
      {slice.map((q) => {
        const isAnswered = Boolean(answers[q.id]);
        return (
          <div
            key={q.id}
            className={`b4-card p-5 transition-colors ${
              isAnswered ? "border-b4-navy/30" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isAnswered ? "bg-b4-navy text-white" : "bg-b4-navy/10 text-b4-navy"
                }`}
              >
                {q.id.replace("Q", "")}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-b4-ink">{q.text}</p>
                <div className="mt-3 space-y-2">
                  {(["A", "B", "C", "D", "E"] as const).map((alt) => {
                    const selected = answers[q.id] === alt;
                    return (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: alt }))}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                          selected
                            ? "border-b4-navy bg-b4-navy/5 ring-1 ring-b4-navy/30"
                            : "border-b4-line hover:border-b4-line-strong hover:bg-b4-surface-2"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            selected ? "bg-b4-navy text-white" : "bg-b4-surface-2 text-b4-ink-2"
                          }`}
                        >
                          {alt}
                        </span>
                        <span className={selected ? "text-b4-ink" : "text-b4-ink-2"}>
                          {q.alternatives[alt]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
