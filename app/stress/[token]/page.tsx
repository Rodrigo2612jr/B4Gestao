"use client";

import { useState, useEffect, use } from "react";
import {
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
} from "react-icons/hi";

type Alternative = "A" | "B" | "C" | "D" | "E";
interface Question { id: string; text: string; category: string; alternatives: Record<Alternative, string> }
interface PublicCampaign { company: { name: string; cnpj_formatted: string } | null; questions: Question[] }

const QUESTIONS_PER_PAGE = 5;

const SEMAFORO_COLOR: Record<string, string> = {
  VERDE: "bg-emerald-500",
  AMARELO: "bg-yellow-400",
  VERMELHO: "bg-red-500",
};

export default function StressPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [step, setStep] = useState<"intro" | number | "done">("intro");
  const [respondentName, setRespondentName] = useState("");
  const [respondentRole, setRespondentRole] = useState("");
  const [answers, setAnswers] = useState<Record<string, Alternative>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ total: number; semaforo: string; semaforoLabel: string } | null>(null);
  const [showMissingHighlight, setShowMissingHighlight] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/stress-test/public/${token}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setErr(d.error || "Link inválido");
          return;
        }
        setData(await res.json());
      } catch {
        setErr("Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Carregando...</div>;

  if (err) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-secondary">{err}</p>
          <p className="mt-2 text-sm text-gray-500">Entre em contato com o especialista da B4 que enviou o link.</p>
        </div>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <HiOutlineCheckCircle className="mx-auto text-6xl text-emerald-500" />
          <h2 className="mt-4 text-xl font-bold text-secondary">Stress Test concluído!</h2>
          <p className="mt-3 text-sm text-gray-600">Seu resultado preliminar:</p>
          <div className={`mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full ${SEMAFORO_COLOR[result.semaforo]} text-3xl font-bold text-white`}>
            {result.total}
          </div>
          <p className="mt-3 text-base font-semibold text-secondary">{result.semaforoLabel}</p>
          <p className="mt-3 text-sm text-gray-500">
            Um especialista da B4 vai analisar o resultado completo e entrar em contato em até 1 dia útil para apresentar o plano de ação detalhado.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl space-y-5 p-4 py-8">
          <header className="rounded-2xl bg-gradient-to-br from-primary-dark to-primary p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">B4 Gestão Ocupacional</p>
            <h1 className="mt-2 text-2xl font-bold">Stress Test NR-1</h1>
            <p className="mt-2 text-sm opacity-90 flex items-center gap-2">
              <HiOutlineShieldCheck /> Diagnóstico de exposição regulatória psicossocial
            </p>
          </header>

          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            {data.company && (
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-gray-500">Avaliação para:</p>
                <p className="font-semibold text-secondary">{data.company.name}</p>
                <p className="font-mono text-xs text-gray-500">{data.company.cnpj_formatted}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-700">
                São <strong>25 perguntas</strong> sobre estrutura, evidência e prática de gestão NR-1 na empresa. Leva cerca de <strong>10 minutos</strong>.
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Ao final, você verá um score 0-100 com semáforo de exposição. O relatório completo é enviado ao especialista da B4 que está acompanhando.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Seu nome *</label>
              <input
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cargo</label>
              <input
                value={respondentRole}
                onChange={(e) => setRespondentRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Gerente de RH"
              />
            </div>
            <button
              onClick={() => {
                if (respondentName.trim().length < 2) return alert("Informe seu nome");
                setStep(0);
              }}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
            >
              Começar Stress Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pages
  const totalPages = Math.ceil(data.questions.length / QUESTIONS_PER_PAGE);
  const pageIdx = step as number;
  const start = pageIdx * QUESTIONS_PER_PAGE;
  const slice = data.questions.slice(start, start + QUESTIONS_PER_PAGE);
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / data.questions.length) * 100);

  // Quais perguntas DESTA página não foram respondidas
  const pageMissing = slice.filter((q) => !answers[q.id]).map((q) => q.id);
  const pageComplete = pageMissing.length === 0;

  const next = async () => {
    if (!pageComplete) {
      setShowMissingHighlight(true);
      // Scroll até a primeira pergunta não respondida
      const el = document.getElementById(`q-${pageMissing[0]}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowMissingHighlight(false);

    if (pageIdx < totalPages - 1) {
      setStep(pageIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Final — verifica global e submete
      const missing = data.questions.filter((q) => !answers[q.id]);
      if (missing.length > 0) {
        alert(`Ainda faltam ${missing.length} respostas em páginas anteriores`);
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch(`/api/stress-test/public/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ respondentName, respondentRole: respondentRole || undefined, answers }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Erro ao enviar");
        setResult({ total: d.result.total, semaforo: d.result.semaforo, semaforoLabel: d.result.semaforoLabel });
        setStep("done");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro ao salvar. Tente novamente.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-2xl p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Pg {pageIdx + 1} de {totalPages}</span>
            <span>{answered}/{data.questions.length} ({progress}%)</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {slice.map((q) => {
          const isMissing = !answers[q.id];
          const highlight = showMissingHighlight && isMissing;
          return (
          <div
            key={q.id}
            id={`q-${q.id}`}
            className={`rounded-2xl bg-white p-5 shadow-sm transition-all ${
              highlight ? "ring-2 ring-red-500 ring-offset-2" : ""
            }`}
          >
            {highlight && (
              <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                ⚠ Resposta obrigatória — selecione uma alternativa
              </p>
            )}
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {q.id.replace("Q", "")}
                <span className="text-red-500 ml-0.5">*</span>
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{q.text}</p>
                <div className="mt-3 space-y-2">
                  {(["A", "B", "C", "D", "E"] as Alternative[]).map((alt) => {
                    const selected = answers[q.id] === alt;
                    return (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: alt })}
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
          );
        })}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {pageIdx > 0 ? (
            <button onClick={() => { setShowMissingHighlight(false); setStep(pageIdx - 1); window.scrollTo({ top: 0 }); }} className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
              <HiOutlineArrowLeft /> Voltar
            </button>
          ) : <div />}
          <div className="flex flex-col items-end gap-1">
            {!pageComplete && (
              <span className="text-[11px] font-medium text-red-600">
                {pageMissing.length} resposta{pageMissing.length !== 1 ? "s" : ""} faltando nesta página
              </span>
            )}
            <button
              onClick={next}
              disabled={submitting}
              className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${
                pageComplete ? "bg-primary hover:bg-primary-dark" : "bg-gray-400 hover:bg-gray-500"
              }`}
            >
              {pageIdx === totalPages - 1
                ? (submitting ? "Calculando..." : <>Finalizar <HiOutlineCheckCircle /></>)
                : <>Continuar <HiOutlineArrowRight /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
