/**
 * Stress Test NR-1 — engine de scoring (alinhado ao Briefing v3).
 *
 * - Score total: normalizado 0-100 (soma dos pesos ÷ máximo × 100)
 * - Semáforo: Verde 80-100 / Amarelo 55-79 / Vermelho 0-54
 * - Risco de Engavetamento (8 perguntas núcleo): 0-32
 *     Baixo 24-32 | Médio 14-23 | Alto 0-13
 * - Coerência Psicossocial: 5 rótulos oficiais (Q18A × Q18B)
 * - Exposição regulatória: BAIXA / MODERADA / ELEVADA
 *     calculada com 8 perguntas-chave de evidência/integração
 *
 * Disclaimer obrigatório: estimativa preliminar; depende de
 * enquadramento/fiscalização; recomendada validação técnica in loco.
 */

import {
  QUESTIONS,
  ALTERNATIVE_WEIGHTS,
  ENGAVETAMENTO_QUESTION_IDS,
  EXPOSICAO_QUESTION_IDS,
  COERENCIA_PAIR,
  type Alternative,
  type Category,
} from "./questions";

export type Semaforo = "VERDE" | "AMARELO" | "VERMELHO";
export type Faixa = "BAIXA" | "MODERADA" | "ELEVADA";

export type CoerenciaLabel =
  | "CONVERGENTE_E_INTEGRADO"
  | "MEDE_MAS_NAO_TRADUZ_EM_OPERACAO"
  | "ENTENDE_OPERACAO_MAS_NAO_MEDE"
  | "AUSENCIA_ESTRUTURAL"
  | "EXISTE_MAS_NAO_RASTREAVEL";

export type Answers = Record<string, Alternative>;

export interface ScoreResult {
  total: number; // 0-100 normalizado
  rawTotal: number; // soma de pesos
  rawMax: number; // máximo possível (104)
  semaforo: Semaforo;
  semaforoLabel: string;
  engavetamento: {
    score: number; // 0-32
    max: number; // 32
    classification: "Baixo" | "Médio" | "Alto";
    label: string;
  };
  coerencia: {
    code: CoerenciaLabel;
    label: string;
    description: string;
    q18a: Alternative | null;
    q18b: Alternative | null;
  };
  faixa: Faixa;
  faixaLabel: string;
  faixaScore: number; // 0-100 (heurístico interno)
  byCategory: Record<Category, { score: number; max: number; pct: number }>;
  weakSpots: Array<{
    id: string;
    text: string;
    chosen: Alternative;
    weight: number;
  }>;
  disclaimer: string;
}

export const DISCLAIMER_OFICIAL =
  "Estimativa preliminar — depende de enquadramento e fiscalização. Recomenda-se validação técnica in loco para confirmar exposição e medidas de controle.";

export function validateAnswers(answers: Answers): { ok: boolean; missing: string[] } {
  const missing = QUESTIONS.filter((q) => !answers[q.id]).map((q) => q.id);
  return { ok: missing.length === 0, missing };
}

export function calculateScore(answers: Answers): ScoreResult {
  let rawTotal = 0;
  let engavetamento = 0;
  let faixaSum = 0;
  let faixaMax = 0;
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
    if (EXPOSICAO_QUESTION_IDS.includes(q.id)) {
      faixaSum += w;
      faixaMax += 4;
    }

    if (w <= 2) {
      weakSpots.push({ id: q.id, text: q.text, chosen, weight: w });
    }
  }

  for (const k of Object.keys(byCategory) as Category[]) {
    const b = byCategory[k];
    b.pct = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0;
  }

  weakSpots.sort((a, b) => a.weight - b.weight);

  // Score total normalizado 0-100
  const total = rawMax > 0 ? Math.round((rawTotal / rawMax) * 100) : 0;

  // Semáforo (Verde 80-100 / Amarelo 55-79 / Vermelho 0-54)
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

  // Engavetamento (8Q × 4 = 32)
  const engavetamentoMax = ENGAVETAMENTO_QUESTION_IDS.length * 4;
  let engClass: "Baixo" | "Médio" | "Alto";
  let engLabel: string;
  if (engavetamento >= 24) {
    engClass = "Baixo";
    engLabel = "Baixo risco de engavetamento — boa evidência documental e rastreabilidade";
  } else if (engavetamento >= 14) {
    engClass = "Médio";
    engLabel = "Médio risco — evidências parciais, lacunas relevantes";
  } else {
    engClass = "Alto";
    engLabel = "Alto risco de engavetamento — documentação insuficiente, alta exposição";
  }

  // Coerência Psicossocial (Q18A × Q18B)
  const aAlt = answers[COERENCIA_PAIR.a] ?? null;
  const bAlt = answers[COERENCIA_PAIR.b] ?? null;
  const coerencia = labelCoerencia(aAlt, bAlt);

  // Exposição regulatória (BAIXA / MODERADA / ELEVADA)
  const faixaScore = faixaMax > 0 ? Math.round((faixaSum / faixaMax) * 100) : 0;
  let faixa: Faixa;
  let faixaLabel: string;
  if (faixaScore >= 70) {
    faixa = "BAIXA";
    faixaLabel = "BAIXA exposição regulatória";
  } else if (faixaScore >= 40) {
    faixa = "MODERADA";
    faixaLabel = "MODERADA exposição regulatória";
  } else {
    faixa = "ELEVADA";
    faixaLabel = "ELEVADA exposição regulatória";
  }

  return {
    total,
    rawTotal,
    rawMax,
    semaforo,
    semaforoLabel,
    engavetamento: {
      score: engavetamento,
      max: engavetamentoMax,
      classification: engClass,
      label: engLabel,
    },
    coerencia,
    faixa,
    faixaLabel,
    faixaScore,
    byCategory,
    weakSpots: weakSpots.slice(0, 10),
    disclaimer: DISCLAIMER_OFICIAL,
  };
}

/**
 * Coerência Psicossocial — rótulos oficiais do briefing v3.
 *
 * Q18A = avaliação psicossocial estruturada (survey/instrumento)
 * Q18B = AET/AEP (atividade real e organização do trabalho)
 *
 * Mapa:
 *   A (forte) + A (forte) → CONVERGENTE_E_INTEGRADO
 *   A         + D/E       → MEDE_MAS_NAO_TRADUZ_EM_OPERACAO
 *   D/E       + A         → ENTENDE_OPERACAO_MAS_NAO_MEDE
 *   D/E       + D/E       → AUSENCIA_ESTRUTURAL
 *   B/C       + B/C       → EXISTE_MAS_NAO_RASTREAVEL
 *   demais combinações intermediárias → EXISTE_MAS_NAO_RASTREAVEL
 */
function labelCoerencia(
  aAlt: Alternative | null,
  bAlt: Alternative | null
): ScoreResult["coerencia"] {
  if (!aAlt || !bAlt) {
    return {
      code: "AUSENCIA_ESTRUTURAL",
      label: "Ausência estrutural",
      description: "Respostas Q18A/Q18B ausentes — não foi possível avaliar coerência.",
      q18a: aAlt,
      q18b: bAlt,
    };
  }

  const isStrong = (a: Alternative) => a === "A";
  const isAbsent = (a: Alternative) => a === "D" || a === "E";

  let code: CoerenciaLabel;
  let label: string;
  let description: string;

  if (isStrong(aAlt) && isStrong(bAlt)) {
    code = "CONVERGENTE_E_INTEGRADO";
    label = "Convergente e integrado";
    description =
      "Avaliação psicossocial estruturada e AET/AEP coerentes — visão integrada entre métrica e operação real.";
  } else if (isStrong(aAlt) && isAbsent(bAlt)) {
    code = "MEDE_MAS_NAO_TRADUZ_EM_OPERACAO";
    label = "Mede, mas não traduz em operação";
    description =
      "Avalia o psicossocial por survey/instrumento, mas falta AET/AEP — os achados não orientam mudança na operação.";
  } else if (isAbsent(aAlt) && isStrong(bAlt)) {
    code = "ENTENDE_OPERACAO_MAS_NAO_MEDE";
    label = "Entende a operação, mas não mede";
    description =
      "Tem leitura da atividade real (AET/AEP) mas falta avaliação psicossocial estruturada — sem instrumento defensável.";
  } else if (isAbsent(aAlt) && isAbsent(bAlt)) {
    code = "AUSENCIA_ESTRUTURAL";
    label = "Ausência estrutural";
    description =
      "Sem metodologia estruturada nem AET/AEP — psicossocial fora do PGR de forma defensável.";
  } else {
    code = "EXISTE_MAS_NAO_RASTREAVEL";
    label = "Existe, mas não rastreável";
    description =
      "Há iniciativas pontuais nos dois eixos, mas sem evidência consolidada de integração no PGR.";
  }

  return { code, label, description, q18a: aAlt, q18b: bAlt };
}
