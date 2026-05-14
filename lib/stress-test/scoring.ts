/**
 * Stress Test NR-1 — engine de scoring.
 *
 * - Score total: soma dos pesos das alternativas escolhidas (máx 100)
 * - Semáforo: Verde 80-100 / Amarelo 55-79 / Vermelho 0-54
 * - Risco de Engavetamento: 0-32 (subset de 8 perguntas de evidência)
 * - Coerência Psicossocial: cruza Q18A × Q18B
 * - FAIXA de exposição regulatória: LOW / MODERATE / HIGH
 */

import {
  QUESTIONS,
  ALTERNATIVE_WEIGHTS,
  ENGAVETAMENTO_QUESTION_IDS,
  COERENCIA_PAIR,
  type Alternative,
  type Category,
} from "./questions";

export type Semaforo = "VERDE" | "AMARELO" | "VERMELHO";
export type Faixa = "LOW" | "MODERATE" | "HIGH";

export type Answers = Record<string, Alternative>; // { Q1: "A", Q2: "B", ... }

export interface ScoreResult {
  total: number; // 0-100
  semaforo: Semaforo;
  semaforoLabel: string;
  engavetamento: { score: number; max: number; label: string }; // 0-32
  coerencia: { label: string; description: string };
  faixa: Faixa;
  faixaLabel: string;
  byCategory: Record<Category, { score: number; max: number; pct: number }>;
  weakSpots: Array<{ id: string; text: string; chosen: Alternative; weight: number }>;
}

export function validateAnswers(answers: Answers): { ok: boolean; missing: string[] } {
  const missing = QUESTIONS.filter((q) => !answers[q.id]).map((q) => q.id);
  return { ok: missing.length === 0, missing };
}

export function calculateScore(answers: Answers): ScoreResult {
  let rawTotal = 0;
  let engavetamento = 0;
  const rawMax = QUESTIONS.length * 4;

  const byCategory: Record<Category, { score: number; max: number; pct: number }> = {
    evidencia: { score: 0, max: 0, pct: 0 },
    psicossocial: { score: 0, max: 0, pct: 0 },
    estrutura: { score: 0, max: 0, pct: 0 },
    fiscalizacao: { score: 0, max: 0, pct: 0 },
  };

  const weakSpots: ScoreResult["weakSpots"] = [];

  for (const q of QUESTIONS) {
    const chosen = answers[q.id];
    if (!chosen) continue;
    const w = ALTERNATIVE_WEIGHTS[chosen];
    rawTotal += w;
    byCategory[q.category].score += w;
    byCategory[q.category].max += 4;

    if (ENGAVETAMENTO_QUESTION_IDS.includes(q.id)) {
      engavetamento += w;
    }

    if (w <= 2) {
      weakSpots.push({ id: q.id, text: q.text, chosen, weight: w });
    }
  }

  for (const k of Object.keys(byCategory) as Category[]) {
    const b = byCategory[k];
    b.pct = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0;
  }

  // Ordena weak spots pelos piores primeiro
  weakSpots.sort((a, b) => a.weight - b.weight);

  // Normaliza para 0-100
  const total = rawMax > 0 ? Math.round((rawTotal / rawMax) * 100) : 0;

  // Semáforo
  let semaforo: Semaforo;
  let semaforoLabel: string;
  if (total >= 80) {
    semaforo = "VERDE";
    semaforoLabel = "Conformidade sólida";
  } else if (total >= 55) {
    semaforo = "AMARELO";
    semaforoLabel = "Atenção — lacunas relevantes";
  } else {
    semaforo = "VERMELHO";
    semaforoLabel = "Exposição crítica à fiscalização";
  }

  // Engavetamento (máx 32 = 8 perguntas × 4)
  const engavetamentoMax = ENGAVETAMENTO_QUESTION_IDS.length * 4;
  let engLabel: string;
  const engPct = engavetamentoMax > 0 ? engavetamento / engavetamentoMax : 0;
  if (engPct >= 0.75) engLabel = "Baixo risco — boa evidência documental";
  else if (engPct >= 0.5) engLabel = "Médio risco — evidências parciais";
  else engLabel = "Alto risco de engavetamento — falta de evidência";

  // Coerência Psicossocial (Q18A × Q18B)
  const a = answers[COERENCIA_PAIR.a];
  const b = answers[COERENCIA_PAIR.b];
  const coerencia = labelCoerencia(a, b);

  // FAIXA regulatória
  let faixa: Faixa;
  let faixaLabel: string;
  if (semaforo === "VERMELHO" || engPct < 0.4) {
    faixa = "HIGH";
    faixaLabel = "Alta exposição regulatória";
  } else if (semaforo === "AMARELO" || engPct < 0.7) {
    faixa = "MODERATE";
    faixaLabel = "Exposição moderada";
  } else {
    faixa = "LOW";
    faixaLabel = "Baixa exposição";
  }

  return {
    total,
    semaforo,
    semaforoLabel,
    engavetamento: { score: engavetamento, max: engavetamentoMax, label: engLabel },
    coerencia,
    faixa,
    faixaLabel,
    byCategory,
    weakSpots: weakSpots.slice(0, 10),
  };
}

function labelCoerencia(
  a: Alternative | undefined,
  b: Alternative | undefined
): { label: string; description: string } {
  if (!a || !b) {
    return { label: "Incompleto", description: "Respostas Q18A/Q18B ausentes" };
  }
  const wA = ALTERNATIVE_WEIGHTS[a]; // afirmação
  const wB = ALTERNATIVE_WEIGHTS[b]; // evidência

  // Afirma alto mas não comprova → discurso vazio
  if (wA >= 4 && wB <= 2) {
    return {
      label: "Discurso sem lastro",
      description: "Empresa afirma estar bem, mas não consegue comprovar documentalmente.",
    };
  }
  // Afirma alto e comprova → coerente
  if (wA >= 4 && wB >= 4) {
    return {
      label: "Coerência alta",
      description: "Afirmação alinhada com evidências documentais robustas.",
    };
  }
  // Afirma baixo mas tem evidência → autocrítica saudável
  if (wA <= 2 && wB >= 4) {
    return {
      label: "Autocrítica produtiva",
      description: "Empresa reconhece lacunas e tem base documental para corrigir.",
    };
  }
  // Afirma baixo e não comprova → exposição assumida
  if (wA <= 2 && wB <= 2) {
    return {
      label: "Exposição reconhecida",
      description: "Empresa reconhece estar mal e ainda não construiu evidências.",
    };
  }
  return {
    label: "Intermediária",
    description: "Discurso e evidências em meio-termo.",
  };
}
