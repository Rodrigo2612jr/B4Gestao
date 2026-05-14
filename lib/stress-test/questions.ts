/**
 * Stress Test NR-1 — questionário oficial v3 (briefing 11/05/2026).
 *
 * 25 perguntas + Q18 dividida em Q18A/Q18B (26 itens totais, 25 lógicas).
 * Pesos: A=4, B=2, C=2, D=0, E=0 (máx 4×26 = 104, normalizado para 0-100).
 *
 * Padrão de alternativas:
 *   A. Sim, plenamente — formal, com evidências e rastreabilidade
 *   B. Sim, parcialmente — existe mas com lacunas
 *   C. Em construção — em implantação ou prevista
 *   D. Apenas iniciativas isoladas/informais
 *   E. Não atende — inexistente ou inadequado
 */

export type Alternative = "A" | "B" | "C" | "D" | "E";
export type Category = "evidencia" | "psicossocial" | "estrutura" | "fiscalizacao";

export interface Question {
  id: string;
  text: string;
  category: Category;
  alternatives: Record<Alternative, string>;
}

export const ALTERNATIVE_WEIGHTS: Record<Alternative, number> = {
  A: 4,
  B: 2,
  C: 2,
  D: 0,
  E: 0,
};

/**
 * Risco de Engavetamento — perguntas núcleo (oficiais v3).
 * 8 perguntas × 4 = máximo 32.
 *   Baixo  24-32
 *   Médio  14-23
 *   Alto    0-13
 */
export const ENGAVETAMENTO_QUESTION_IDS = [
  "Q01", "Q12", "Q13", "Q14", "Q15", "Q16", "Q21", "Q25",
];

/**
 * Exposição regulatória — perguntas-chave de evidência/integração.
 * Score 0-100 heurístico para BAIXA/MODERADA/ELEVADA.
 */
export const EXPOSICAO_QUESTION_IDS = [
  "Q01", "Q04", "Q06", "Q10", "Q21", "Q22", "Q23", "Q25",
];

/** Coerência Psicossocial — cruzamento Q18A × Q18B. */
export const COERENCIA_PAIR = { a: "Q18A", b: "Q18B" };

// Alternativas padrão (DRY)
const altPadrao = (a: string, b: string, c: string, d: string, e: string) => ({ A: a, B: b, C: c, D: d, E: e });

const ALT_GENERICO = altPadrao(
  "Sim, plenamente — formal, com evidências e rastreabilidade",
  "Sim, parcialmente — existe mas com lacunas",
  "Em construção — em implantação ou previsto",
  "Apenas iniciativas isoladas/informais",
  "Não atende — inexistente ou inadequado",
);

export const QUESTIONS: Question[] = [
  {
    id: "Q01",
    text: "Existe repositório controlado e acessível (SST, RH e Jurídico) com versões e evidências do PGR/PCMSO?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q02",
    text: "O PGR entregue contém Inventário de riscos + Plano de ação com responsáveis e prazos definidos?",
    category: "estrutura",
    alternatives: altPadrao(
      "Sim, inventário e plano de ação completos com responsáveis e prazos",
      "Sim, mas com lacunas em responsáveis ou prazos",
      "Em construção",
      "Apenas inventário, sem plano de ação estruturado",
      "Não atende",
    ),
  },
  {
    id: "Q03",
    text: "O inventário de riscos é detalhado por área/setor/função/GHE (não genérico)?",
    category: "estrutura",
    alternatives: altPadrao(
      "Sim, detalhado por área/setor/função/GHE",
      "Sim, parcialmente detalhado",
      "Em construção",
      "Genérico, sem segmentação",
      "Não há inventário",
    ),
  },
  {
    id: "Q04",
    text: "A avaliação é defensável tecnicamente (fonte geradora, expostos, tempo/frequência, severidade, critério)?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q05",
    text: "O plano de ação é coerente com a redução real de risco (não apenas formal)?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q06",
    text: "Os controles citados no PGR existem na prática e são localizáveis (APR, EPC, EPI, procedimentos)?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q07",
    text: "APRs e procedimentos têm conteúdo suficiente (passos críticos, barreiras, responsáveis)?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q08",
    text: "Existe critério e registro de seleção de EPC/EPI (CA, aplicabilidade, treinamento, troca)?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q09",
    text: "Há evidência de eficácia dos controles (checklists, inspeções, manutenções)?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q10",
    text: "A redução de risco declarada é sustentada por evidência do controle implementado?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q11",
    text: "A avaliação evita subestimação por padrão (não classifica tudo como 'baixo')?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q12",
    text: "Existe dono formal do GRO/PGR, substituto designado e papéis claros (matriz RACI)?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q13",
    text: "Há ritual mensal/trimestral com ata para acompanhamento de status e bloqueios?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q14",
    text: "O status do plano de ação é atualizado regularmente (andamento, concluído, atrasado)?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q15",
    text: "A empresa tem template/processo próprio de evidências, sem depender do terceiro?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q16",
    text: "Existe resumo executivo periódico para a liderança (1 slide/página)?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q17",
    text: "As ações psicossociais estão dentro do plano do PGR, com responsável, prazo e KPI?",
    category: "psicossocial",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q18A",
    text: "Existe metodologia estruturada (survey/instrumento validado) para avaliação psicossocial, com resultados utilizados no PGR?",
    category: "psicossocial",
    alternatives: altPadrao(
      "Sim, metodologia estruturada com resultados aplicados no PGR",
      "Sim, mas com uso parcial no PGR",
      "Em implantação",
      "Apenas iniciativas pontuais",
      "Não há metodologia",
    ),
  },
  {
    id: "Q18B",
    text: "Existe AET/AEP (análise da atividade real e organização do trabalho) e os achados são usados para orientar riscos e ações?",
    category: "psicossocial",
    alternatives: altPadrao(
      "Sim, AET/AEP estruturada com achados orientando o PGR",
      "Sim, mas uso parcial",
      "Em construção",
      "Apenas iniciativas pontuais",
      "Não realiza",
    ),
  },
  {
    id: "Q19",
    text: "Existe critério objetivo para classificar uma área como crítica?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q20",
    text: "Há medidas estruturais nas áreas críticas (mudança de processo, escala, gestão, recursos)?",
    category: "psicossocial",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q21",
    text: "Existe processo formal de integração PGR → PCMSO em revisões e mudanças?",
    category: "estrutura",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q22",
    text: "Os ASO/exames são checados por função/GHE, cobrindo os riscos que exigem monitoramento?",
    category: "fiscalizacao",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q23",
    text: "Existe critério para evitar overtesting (exame sem necessidade) e justificar exames adicionais?",
    category: "fiscalizacao",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q24",
    text: "Existe protocolo de retorno ao trabalho (incluindo saúde mental quando aplicável)?",
    category: "psicossocial",
    alternatives: ALT_GENERICO,
  },
  {
    id: "Q25",
    text: "O PGR é retroalimentado por eventos reais (afastamentos longos/repetidos, burnout, CATs)?",
    category: "evidencia",
    alternatives: ALT_GENERICO,
  },
];

if (QUESTIONS.length < 25 || QUESTIONS.length > 27) {
  throw new Error(`Stress Test deve ter entre 25 e 27 itens, tem ${QUESTIONS.length}`);
}
