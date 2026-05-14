/**
 * Stress Test NR-1 — banco de 25 perguntas (v1).
 *
 * NOTA: Os textos abaixo são uma primeira versão baseada no framework NR-1
 * psicossocial. Devem ser substituídos pelos textos exatos do briefing oficial
 * do cliente assim que disponíveis.
 *
 * Pesos por alternativa: A=4, B=2, C=2, D=0, E=0 → máx 100 pts (25×4).
 *
 * Categorização de cada pergunta para sub-scores:
 *   - "evidencia"   → mede se a empresa só faz papel (Risco de Engavetamento)
 *   - "psicossocial" → relacionada a saúde mental, clima, assédio
 *   - "estrutura"  → governança, comitês, processos formais
 *   - "fiscalizacao" → exposição direta à fiscalização e eSocial
 */

export type Alternative = "A" | "B" | "C" | "D" | "E";
export type Category = "evidencia" | "psicossocial" | "estrutura" | "fiscalizacao";

export interface Question {
  id: string; // Q1..Q25
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

/** Sub-score "Risco de Engavetamento": perguntas de evidência (máx 32 pts). */
export const ENGAVETAMENTO_QUESTION_IDS = [
  "Q4", "Q9", "Q14", "Q18A", "Q18B", "Q21", "Q23", "Q25",
];

/** Coerência psicossocial: cruzamento Q18A × Q18B. */
export const COERENCIA_PAIR = { a: "Q18A", b: "Q18B" };

export const QUESTIONS: Question[] = [
  {
    id: "Q1",
    text: "A empresa já elaborou ou atualizou o PGR contemplando riscos psicossociais conforme NR-01?",
    category: "estrutura",
    alternatives: {
      A: "Sim, atualizado nos últimos 12 meses com plano de ação ativo",
      B: "Sim, mas precisa de atualização",
      C: "Está em elaboração agora",
      D: "Existe, mas sem riscos psicossociais contemplados",
      E: "Não existe ou está desatualizado há mais de 2 anos",
    },
  },
  {
    id: "Q2",
    text: "Existe processo formal de identificação e avaliação de riscos psicossociais?",
    category: "estrutura",
    alternatives: {
      A: "Sim, com metodologia validada e aplicação periódica",
      B: "Sim, mas aplicação esporádica",
      C: "Em implantação",
      D: "Apenas conversas informais com lideranças",
      E: "Nenhum processo",
    },
  },
  {
    id: "Q3",
    text: "Há canal formal e confidencial para denúncia de assédio moral e sexual?",
    category: "psicossocial",
    alternatives: {
      A: "Sim, com comitê independente e acompanhamento de casos",
      B: "Sim, mas pouco divulgado",
      C: "Em implantação",
      D: "Apenas e-mail/ouvidoria geral",
      E: "Nenhum canal formal",
    },
  },
  {
    id: "Q4",
    text: "As lideranças foram capacitadas em fatores psicossociais e NR-01 no último ano?",
    category: "evidencia",
    alternatives: {
      A: "Sim, capacitação formal com certificação para 100% dos líderes",
      B: "Sim, parcial (50-99% dos líderes)",
      C: "Treinamento em andamento",
      D: "Apenas comunicados/e-mails",
      E: "Nenhuma capacitação",
    },
  },
  {
    id: "Q5",
    text: "A empresa monitora indicadores de afastamento por CID F (saúde mental)?",
    category: "fiscalizacao",
    alternatives: {
      A: "Sim, com dashboard mensal e ações corretivas",
      B: "Sim, mas sem ações estruturadas",
      C: "Coleta começou recentemente",
      D: "Acompanha só quando recebe alerta do INSS",
      E: "Não monitora",
    },
  },
  {
    id: "Q6",
    text: "Existe oferta de suporte psicológico para colaboradores (teleconsulta, SOS, etc.)?",
    category: "psicossocial",
    alternatives: {
      A: "Sim, com acesso 24/7 e dados de utilização monitorados",
      B: "Sim, em horário comercial",
      C: "Em implantação",
      D: "Apenas benefício de plano de saúde tradicional",
      E: "Nenhum suporte",
    },
  },
  {
    id: "Q7",
    text: "Como é tratada a sobrecarga de trabalho identificada em diagnósticos ou pesquisas?",
    category: "psicossocial",
    alternatives: {
      A: "Plano de ação documentado com responsáveis e prazos",
      B: "Discussão com lideranças, sem plano formal",
      C: "Sob avaliação",
      D: "Reconhece o problema, mas sem ação",
      E: "Não há diagnóstico ou ação",
    },
  },
  {
    id: "Q8",
    text: "A empresa possui PCMSO atualizado e integrado ao PGR?",
    category: "estrutura",
    alternatives: {
      A: "Sim, integrado e revisado anualmente",
      B: "Sim, mas integração parcial",
      C: "Em revisão",
      D: "Existe, mas desatualizado",
      E: "Inexistente",
    },
  },
  {
    id: "Q9",
    text: "Existem evidências documentais (atas, relatórios, planos) dos riscos psicossociais avaliados?",
    category: "evidencia",
    alternatives: {
      A: "Sim, registros completos e acessíveis para auditoria",
      B: "Parciais (alguns registros)",
      C: "Em organização",
      D: "Existem, mas dispersos",
      E: "Nenhum registro",
    },
  },
  {
    id: "Q10",
    text: "Como é a comunicação dos riscos psicossociais para os trabalhadores?",
    category: "estrutura",
    alternatives: {
      A: "Comunicação contínua, multicanal e mensurada",
      B: "Comunicação pontual em eventos",
      C: "Em planejamento",
      D: "Apenas no DDS/integração",
      E: "Não há comunicação",
    },
  },
  {
    id: "Q11",
    text: "Existe protocolo de retorno ao trabalho após afastamento por motivo de saúde mental?",
    category: "psicossocial",
    alternatives: {
      A: "Sim, multidisciplinar com acompanhamento por 90+ dias",
      B: "Sim, mas só com médico do trabalho",
      C: "Em construção",
      D: "Trata caso a caso, sem protocolo",
      E: "Nenhum protocolo",
    },
  },
  {
    id: "Q12",
    text: "Como a empresa lida com transmissão dos eventos psicossociais no eSocial?",
    category: "fiscalizacao",
    alternatives: {
      A: "Envio em dia, com revisão técnica antes do envio",
      B: "Envio em dia, sem revisão",
      C: "Atrasos esporádicos",
      D: "Frequentes atrasos ou erros",
      E: "Eventos não enviados",
    },
  },
  {
    id: "Q13",
    text: "Existe orçamento específico para ações de saúde mental e bem-estar?",
    category: "estrutura",
    alternatives: {
      A: "Sim, orçamento anual aprovado e rastreado",
      B: "Verba pontual aprovada caso a caso",
      C: "Em discussão para próximo ano",
      D: "Sem orçamento, apenas iniciativas voluntárias",
      E: "Nenhum investimento",
    },
  },
  {
    id: "Q14",
    text: "Há registro de plano de ação para os riscos psicossociais classificados como críticos?",
    category: "evidencia",
    alternatives: {
      A: "Sim, com responsáveis, prazos e indicadores de eficácia",
      B: "Sim, mas sem indicadores claros",
      C: "Em elaboração",
      D: "Lista de intenções, sem responsáveis",
      E: "Nenhum plano",
    },
  },
  {
    id: "Q15",
    text: "Como é feito o engajamento da alta liderança nas pautas psicossociais?",
    category: "psicossocial",
    alternatives: {
      A: "Comitê executivo com agenda mensal e KPIs",
      B: "Reuniões trimestrais",
      C: "Reuniões esporádicas",
      D: "Delegado ao RH/SST sem envolvimento direto",
      E: "Sem engajamento da liderança",
    },
  },
  {
    id: "Q16",
    text: "Há pesquisa de clima ou diagnóstico psicossocial aplicado em 12 meses?",
    category: "estrutura",
    alternatives: {
      A: "Sim, com retorno aos colaboradores e ações implementadas",
      B: "Sim, mas sem retorno formal",
      C: "Programada para próximos meses",
      D: "Realizada há mais de 24 meses",
      E: "Nunca realizada",
    },
  },
  {
    id: "Q17",
    text: "Como a empresa atua sobre fatores de risco identificados (assédio, sobrecarga, jornada)?",
    category: "psicossocial",
    alternatives: {
      A: "Plano estruturado com KPIs e revisão trimestral",
      B: "Ações pontuais sem plano consolidado",
      C: "Em discussão",
      D: "Apenas se chega denúncia",
      E: "Nenhuma ação",
    },
  },
  {
    id: "Q18A",
    text: "A empresa AFIRMA que as condições psicossociais estão bem geridas?",
    category: "evidencia",
    alternatives: {
      A: "Sim, com forte convicção",
      B: "Sim, parcialmente",
      C: "Neutro / não sabe",
      D: "Reconhece lacunas importantes",
      E: "Reconhece que está mal",
    },
  },
  {
    id: "Q18B",
    text: "A empresa CONSEGUE COMPROVAR documentalmente o que afirma na Q18A?",
    category: "evidencia",
    alternatives: {
      A: "Sim, evidências completas para auditoria",
      B: "Sim, parciais",
      C: "Em organização",
      D: "Evidências dispersas",
      E: "Nenhuma evidência",
    },
  },
  {
    id: "Q19",
    text: "Existe programa de prevenção e tratamento de burnout?",
    category: "psicossocial",
    alternatives: {
      A: "Sim, com protocolo formal e equipe dedicada",
      B: "Sim, mas informal",
      C: "Em implantação",
      D: "Reativo, só após casos",
      E: "Nenhum programa",
    },
  },
  {
    id: "Q20",
    text: "Como a empresa controla jornada de trabalho e horas extras?",
    category: "fiscalizacao",
    alternatives: {
      A: "Controle eletrônico com alertas automáticos de sobrecarga",
      B: "Controle eletrônico sem alertas",
      C: "Controle manual",
      D: "Controle parcial",
      E: "Sem controle",
    },
  },
  {
    id: "Q21",
    text: "Há registros de capacitação dos colaboradores sobre fatores psicossociais?",
    category: "evidencia",
    alternatives: {
      A: "Sim, com listas de presença e avaliação de eficácia",
      B: "Sim, apenas listas de presença",
      C: "Em aplicação",
      D: "Apenas comunicados",
      E: "Sem capacitação",
    },
  },
  {
    id: "Q22",
    text: "Como a empresa monitora a aplicação de medidas de controle dos riscos psicossociais?",
    category: "estrutura",
    alternatives: {
      A: "Auditoria interna periódica com KPIs",
      B: "Verificação semestral pelo RH/SST",
      C: "Em implantação",
      D: "Apenas quando há denúncia",
      E: "Não monitora",
    },
  },
  {
    id: "Q23",
    text: "Há rastreabilidade entre risco psicossocial identificado → medida → evidência → resultado?",
    category: "evidencia",
    alternatives: {
      A: "Sim, cadeia completa documentada para 100% dos riscos críticos",
      B: "Sim, parcial",
      C: "Em construção",
      D: "Documentação fragmentada",
      E: "Sem rastreabilidade",
    },
  },
  {
    id: "Q24",
    text: "Como a empresa lida com CATs relacionadas a fatores psicossociais?",
    category: "fiscalizacao",
    alternatives: {
      A: "Emissão imediata, análise de nexo causal e ação preventiva",
      B: "Emite, mas sem análise estruturada",
      C: "Caso a caso",
      D: "Hesita em emitir",
      E: "Não emite ou desconhece",
    },
  },
  {
    id: "Q25",
    text: "Existe responsável formal nomeado pela gestão dos riscos psicossociais (com carta de designação)?",
    category: "evidencia",
    alternatives: {
      A: "Sim, com carta formal e atribuições claras",
      B: "Sim, mas sem documento formal",
      C: "Em definição",
      D: "Atribuição informal",
      E: "Sem responsável",
    },
  },
];

// Q18 é composta de Q18A + Q18B (cruzamento de coerência). Total: 26 itens, 25 lógicas.
if (QUESTIONS.length < 25 || QUESTIONS.length > 27) {
  throw new Error(`Stress Test deve ter entre 25 e 27 itens, tem ${QUESTIONS.length}`);
}
