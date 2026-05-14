"use client";

import { useState, useEffect, use } from "react";
import { HiOutlineCheckCircle, HiOutlineShieldCheck } from "react-icons/hi";

interface Question { id: string; text: string; dimension: string; reverse?: boolean }
interface CampaignPublic { title: string; questions: Question[]; areas: string[] }

const LIKERT_LABELS = [
  "Discordo totalmente",
  "Discordo",
  "Neutro",
  "Concordo",
  "Concordo totalmente",
];

export default function PulseRespondPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [campaign, setCampaign] = useState<CampaignPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [area, setArea] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pulse/public/${token}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || "Pesquisa não encontrada");
          return;
        }
        setCampaign(await res.json());
      } catch {
        setError("Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async () => {
    if (!campaign) return;
    if (!area) return alert("Selecione sua área");
    const missing = campaign.questions.filter((q) => !answers[q.id]);
    if (missing.length > 0) return alert(`Faltam ${missing.length} respostas.`);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/pulse/public/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, answers }),
      });
      if (res.ok) setSubmitted(true);
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Erro ao enviar");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Carregando...</div>;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-secondary">{error}</p>
          <p className="mt-2 text-sm text-gray-500">Procure a área de RH/SST da sua empresa.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <HiOutlineCheckCircle className="mx-auto text-6xl text-emerald-500" />
          <h2 className="mt-4 text-xl font-bold text-secondary">Resposta registrada</h2>
          <p className="mt-2 text-sm text-gray-600">
            Obrigado! Sua resposta é <strong>anônima</strong> e agregada com a das demais pessoas da sua área.
          </p>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl space-y-5 px-4">
        <header className="rounded-2xl bg-gradient-to-br from-primary-dark to-primary p-6 text-white shadow-lg">
          <h1 className="text-xl font-bold">{campaign.title}</h1>
          <p className="mt-2 text-sm opacity-90 flex items-center gap-2">
            <HiOutlineShieldCheck /> Pesquisa anônima — leva 3 a 5 minutos.
          </p>
        </header>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-gray-700">Sua área *</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Selecione...</option>
            {campaign.areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <p className="mt-2 text-xs text-gray-500">Resultados só são divulgados quando há respostas suficientes na sua área.</p>
        </div>

        {campaign.questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-900">
              <span className="text-primary font-bold mr-2">{idx + 1}.</span>
              {q.text}
            </p>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => {
                const selected = answers[q.id] === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: v })}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                      selected
                        ? "border-primary bg-primary text-white shadow"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-bold">{v}</span>
                    <span className="hidden text-[10px] leading-tight sm:block">{LIKERT_LABELS[v - 1]}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-400 sm:hidden">
              <span>Discordo</span>
              <span>Concordo</span>
            </div>
          </div>
        ))}

        <button
          onClick={submit}
          disabled={submitting}
          className="sticky bottom-4 w-full rounded-xl bg-primary px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Enviar respostas"}
        </button>
      </div>
    </div>
  );
}
