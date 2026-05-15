/**
 * Motor de narrativa LOCAL (sem IA externa).
 *
 * Gera textos blindados para PPTX baseado em padrões do score.
 * - Tom institucional, sem culpa individual
 * - Sem valores monetários exatos — apenas FAIXAS
 * - Disclaimer obrigatório
 * - Output determinístico (mesma entrada → mesma saída)
 *
 * Substitui a integração Anthropic — funciona 100% local, sem custo,
 * sem API key, sem latência externa.
 *
 * A lógica é uma árvore de decisão sobre os indicadores principais:
 *  Score total · Semáforo · Engavetamento · Coerência Q18A/Q18B · Faixa
 *
 * Os textos foram redigidos a 4 mãos com base no briefing v3 (tom blindado).
 */

import type { ScoreResult } from "../stress-test/scoring";
import type { AggregateResult } from "../pulse/db";

// ============================================================
// STRESS TEST
// ============================================================

export interface StressNarrativeResult {
  executiveSummary: string;
  topRecommendations: string[];
  technicalNarrative: string;
  disclaimer: string;
}

export function generateStressNarrativeLocal(input: {
  companyName: string;
  result: ScoreResult;
}): StressNarrativeResult {
  const r = input.result;
  const company = input.companyName;

  // ============ EXECUTIVE SUMMARY ============
  // Combina: status geral + ponto principal da composição
  const semaforoTone =
    r.semaforo === "VERDE"
      ? `A análise indica conformidade sólida do programa NR-1 da ${company}, com score ${r.total}/100`
      : r.semaforo === "AMARELO"
      ? `A análise da ${company} indica atenção: existem lacunas relevantes no programa NR-1 (score ${r.total}/100)`
      : `A análise da ${company} aponta exposição crítica à fiscalização NR-1 (score ${r.total}/100)`;

  const engavetamentoTone =
    r.engavetamento.classification === "Baixo"
      ? `Os indicadores de evidência e rastreabilidade estão bem estabelecidos (engavetamento ${r.engavetamento.score}/${r.engavetamento.max} — baixo)`
      : r.engavetamento.classification === "Médio"
      ? `Há sinais de evidências parciais — o risco de engavetamento está em nível médio (${r.engavetamento.score}/${r.engavetamento.max})`
      : `O risco de engavetamento é alto (${r.engavetamento.score}/${r.engavetamento.max}): a empresa pode ter formalizações sem evidência documental sustentada`;

  const faixaTone =
    r.faixa === "BAIXA"
      ? "A exposição regulatória se mantém em faixa BAIXA"
      : r.faixa === "MODERADA"
      ? "A exposição regulatória está em faixa MODERADA e demanda ação estruturada"
      : "A exposição regulatória está em faixa ELEVADA, exigindo plano de ação imediato";

  const executiveSummary =
    `${semaforoTone}. ${engavetamentoTone}. ${faixaTone}. ` +
    `O resultado deve orientar revisão do PGR, integração com PCMSO e plano de ação documentado, com responsáveis e prazos formalizados.`;

  // ============ TOP RECOMMENDATIONS (3 ações) ============
  // Combinatória inteligente baseada nos sub-scores
  const recommendations: string[] = [];

  // Rec 1 — sempre baseada no semáforo
  if (r.semaforo === "VERMELHO") {
    recommendations.push(
      "Priorizar revisão estrutural do PGR contemplando riscos psicossociais e plano de ação documentado com responsáveis e prazos."
    );
  } else if (r.semaforo === "AMARELO") {
    recommendations.push(
      "Fortalecer o plano de ação do PGR nas áreas críticas e implementar ritual mensal de governança com ata."
    );
  } else {
    recommendations.push(
      "Manter a maturidade do programa NR-1 e ampliar evidências de eficácia dos controles em vigor."
    );
  }

  // Rec 2 — baseada no engavetamento
  if (r.engavetamento.classification === "Alto") {
    recommendations.push(
      "Construir base de evidências (atas, checklists, registros de capacitação, listas de presença) acessível a SST/RH/Jurídico em repositório único versionado."
    );
  } else if (r.engavetamento.classification === "Médio") {
    recommendations.push(
      "Padronizar template interno de evidências para reduzir dependência de terceiros e manter rastreabilidade documental."
    );
  } else {
    recommendations.push(
      "Auditar trimestralmente a aderência das evidências e atualizar o resumo executivo para a liderança."
    );
  }

  // Rec 3 — baseada na coerência Q18A×Q18B (psicossocial)
  switch (r.coerencia.code) {
    case "CONVERGENTE_E_INTEGRADO":
      recommendations.push(
        "Manter a integração entre avaliação psicossocial e AET/AEP, ampliando o uso dos resultados no PGR."
      );
      break;
    case "MEDE_MAS_NAO_TRADUZ_EM_OPERACAO":
      recommendations.push(
        "Implementar AET/AEP estruturada para traduzir os achados psicossociais em mudanças operacionais concretas."
      );
      break;
    case "ENTENDE_OPERACAO_MAS_NAO_MEDE":
      recommendations.push(
        "Adotar metodologia estruturada de avaliação psicossocial (survey/instrumento validado) com integração ao PGR."
      );
      break;
    case "AUSENCIA_ESTRUTURAL":
      recommendations.push(
        "Estabelecer simultaneamente a metodologia psicossocial estruturada e a leitura AET/AEP — base fundamental para defensabilidade NR-1."
      );
      break;
    case "EXISTE_MAS_NAO_RASTREAVEL":
      recommendations.push(
        "Consolidar e documentar as iniciativas psicossociais existentes para garantir rastreabilidade e integração no PGR."
      );
      break;
  }

  // ============ TECHNICAL NARRATIVE ============
  const categoryAnalysis = analyzeCategoriesLocal(r.byCategory);
  const weakSpotsAnalysis =
    r.weakSpots.length > 0
      ? `Foram identificados ${r.weakSpots.length} ponto(s) crítico(s) na auditoria, com destaque para: ${r.weakSpots
          .slice(0, 3)
          .map((w) => w.id)
          .join(", ")}.`
      : "Não há pontos críticos relevantes identificados na auditoria.";

  const technicalNarrative =
    `${categoryAnalysis} ${weakSpotsAnalysis} ` +
    `A composição Q18A×Q18B aponta o cenário "${r.coerencia.label}" (${r.coerencia.description}). ` +
    `A exposição regulatória foi calculada com base nas 8 perguntas-chave de evidência e integração (Q01, Q04, Q06, Q10, Q21, Q22, Q23, Q25), ` +
    `resultando em ${r.faixaScore}% de aderência e classificação ${r.faixa}. ` +
    `Recomenda-se revisar prioritariamente os controles citados no plano de ação e garantir evidência de eficácia documentada.`;

  const disclaimer =
    r.disclaimer ??
    "Estimativa preliminar baseada em auditoria de 25 perguntas — depende de enquadramento e fiscalização. Recomenda-se validação técnica in loco para confirmar exposição e medidas de controle.";

  return {
    executiveSummary,
    topRecommendations: recommendations,
    technicalNarrative,
    disclaimer,
  };
}

function analyzeCategoriesLocal(byCategory: ScoreResult["byCategory"]): string {
  const sorted = Object.entries(byCategory).sort((a, b) => a[1].pct - b[1].pct);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];

  const catLabel = (k: string) =>
    k === "evidencia"
      ? "Evidência documental"
      : k === "psicossocial"
      ? "Psicossocial"
      : k === "estrutura"
      ? "Estrutura/governança"
      : k === "fiscalizacao"
      ? "Exposição à fiscalização"
      : k;

  if (worst[1].pct === best[1].pct) {
    return `O desempenho está equilibrado entre as 4 categorias (${worst[1].pct}% em média).`;
  }
  return (
    `Na análise por categoria, "${catLabel(best[0])}" apresenta o melhor desempenho (${best[1].pct}%), ` +
    `enquanto "${catLabel(worst[0])}" é a categoria mais crítica (${worst[1].pct}%) e demanda atenção prioritária.`
  );
}

// ============================================================
// PULSE
// ============================================================

export interface PulseNarrativeResult {
  executiveSummary: string;
  driversAnalysis: string;
  topRecommendations: string[];
  cta: string;
  disclaimer: string;
}

export function generatePulseNarrativeLocal(input: {
  companyName: string;
  campaignTitle: string;
  aggregate: AggregateResult;
}): PulseNarrativeResult {
  const ag = input.aggregate;
  const company = input.companyName;

  const idx = ag.globalIndex ?? 0;
  const idxQuality =
    idx >= 4.0
      ? "saudável"
      : idx >= 3.0
      ? "moderado"
      : idx >= 2.0
      ? "crítico"
      : "muito crítico";

  const visibleAreas = ag.heatmap.filter((h) => !h.blocked).length;
  const totalAreas = ag.heatmap.length;
  const blockedAreas = totalAreas - visibleAreas;

  const executiveSummary =
    `O Pulse NR-1 da ${company} coletou ${ag.totalResponses} resposta(s) em ${totalAreas} área(s), ` +
    `resultando em índice global ${idx.toFixed(1)}/5.0 — clima ${idxQuality}. ` +
    (blockedAreas > 0
      ? `${blockedAreas} área(s) ficou(aram) abaixo do threshold de anonimato (n=${ag.threshold}) e não estão visíveis no agregado. `
      : `Todas as áreas atingiram o threshold de anonimato (n=${ag.threshold}). `) +
    `O resultado deve embasar plano de ação documentado dentro do PGR/GRO, com responsáveis e prazos.`;

  // Drivers analysis
  const drivers = ag.drivers ?? [];
  const driversAnalysis =
    drivers.length === 0
      ? "Não há dados suficientes para identificar drivers críticos nesta pesquisa."
      : `As ${drivers.length} perguntas com pior média (drivers) revelam padrão consistente nas dimensões ${
          [...new Set(drivers.map((d) => d.dimension))].join(", ")
        }. ` +
        `O driver mais crítico (${drivers[0].avgScore.toFixed(1)}/5.0) refere-se a: "${drivers[0].text}". ` +
        "Recomenda-se ação estrutural — não apenas comunicação — nas dimensões com pior performance.";

  // Recommendations baseado nas dimensões críticas
  const critical = Object.values(ag.byDimension).filter((d) => d.pct < 50);
  const recommendations: string[] = [];

  if (critical.length > 0) {
    recommendations.push(
      `Construir plano de ação direcionado às ${critical.length} dimensão(ões) crítica(s) identificadas: ${critical
        .map((c) => c.label)
        .join(", ")}.`
    );
  } else {
    recommendations.push(
      "Manter a leitura periódica do clima psicossocial e ampliar o repertório de ações preventivas."
    );
  }

  if (ag.quickWins.length > 0) {
    recommendations.push(
      "Executar os quick wins de 30 dias identificados nas dimensões com pct < 60, monitorando indicadores de eficácia."
    );
  }

  if (idx < 3.0) {
    recommendations.push(
      "Engajar liderança em workshop de devolutiva e estabelecer ritual mensal com ata para acompanhar evolução do clima."
    );
  } else {
    recommendations.push(
      "Compartilhar o resultado com liderança e área operacional, mantendo a cadência de medição (repesquisa em 6 meses)."
    );
  }

  const cta =
    idx < 3.0
      ? "A B4 recomenda diagnóstico aprofundado e plano de ação assistido com nossa equipe técnica — fale com um especialista."
      : "Mantenha a maturidade do programa com nosso acompanhamento mensal — agende uma conversa com especialista B4.";

  const disclaimer =
    "Diagnóstico baseado em pesquisa amostral com escala Likert 1-5. Áreas com n abaixo do threshold de anonimato são ocultadas. " +
    "Recomenda-se validação dos achados com AET/AEP da atividade real.";

  return {
    executiveSummary,
    driversAnalysis,
    topRecommendations: recommendations,
    cta,
    disclaimer,
  };
}

// ============================================================
// eSOCIAL
// ============================================================

export interface ESocialNarrativeResult {
  executiveSummary: string;
  costSummary: string;
  topRecommendations: string[];
  cta: string;
  disclaimer: string;
}

export function generateESocialNarrativeLocal(input: {
  companyName: string;
  integrityScore: number;
  totalAlertsActive: number;
  criticalAlerts: number;
  bands: Array<{ category: string; faixa: string; rangeLow: number; rangeHigh: number; label: string }>;
}): ESocialNarrativeResult {
  const company = input.companyName;

  const integrityTone =
    input.integrityScore >= 80
      ? `Os dados SST da ${company} estão em boa integridade (${input.integrityScore}/100)`
      : input.integrityScore >= 50
      ? `A integridade dos dados SST da ${company} está em nível moderado (${input.integrityScore}/100), com lacunas a corrigir`
      : `A integridade dos dados SST da ${company} está crítica (${input.integrityScore}/100), demandando ação imediata`;

  const criticalTone =
    input.criticalAlerts > 0
      ? `Foram identificados ${input.criticalAlerts} alerta(s) crítico(s) entre os ${input.totalAlertsActive} ativo(s).`
      : input.totalAlertsActive > 0
      ? `Os ${input.totalAlertsActive} alerta(s) ativo(s) não são críticos, mas merecem atenção.`
      : "Não há alertas críticos abertos no momento.";

  const executiveSummary =
    `${integrityTone}. ${criticalTone} ` +
    "A análise cruza eventos S-2240, S-2220, S-2210 e S-2230 considerando a vigência temporal de cada vínculo e exposição.";

  // Cost summary — sem valores absolutos
  const elevadaBands = input.bands.filter((b) => b.faixa === "ELEVADA");
  const moderadaBands = input.bands.filter((b) => b.faixa === "MODERADA");
  const baixaBands = input.bands.filter((b) => b.faixa === "BAIXA");

  let costSummary = "A exposição financeira foi convertida em faixas: ";
  const parts: string[] = [];
  if (elevadaBands.length > 0) {
    parts.push(`ELEVADA em ${elevadaBands.map((b) => b.category).join(", ")}`);
  }
  if (moderadaBands.length > 0) {
    parts.push(`MODERADA em ${moderadaBands.map((b) => b.category).join(", ")}`);
  }
  if (baixaBands.length > 0) {
    parts.push(`BAIXA em ${baixaBands.map((b) => b.category).join(", ")}`);
  }
  costSummary +=
    parts.join("; ") +
    ". As faixas baseiam-se em premissas parametrizáveis (salário, fator, meses) e devem ser validadas tecnicamente in loco.";

  // Recommendations
  const recommendations: string[] = [];

  if (input.criticalAlerts > 0) {
    recommendations.push(
      `Tratar prioritariamente os ${input.criticalAlerts} alerta(s) crítico(s) — eles concentram a maior exposição regulatória.`
    );
  }

  if (elevadaBands.length > 0) {
    recommendations.push(
      `Estruturar plano de ação para reduzir exposição nas categorias com faixa ELEVADA (${elevadaBands
        .map((b) => b.category)
        .join(", ")}).`
    );
  }

  if (input.integrityScore < 80) {
    recommendations.push(
      "Auditar e corrigir o fluxo de envio do eSocial — qualidade do envio impacta diretamente a defensabilidade na fiscalização."
    );
  } else {
    recommendations.push(
      "Manter o rigor do envio e ampliar a integração de dados (folha + SST + clínica) para análises mais profundas."
    );
  }

  const cta =
    input.criticalAlerts > 0 || elevadaBands.length > 0
      ? "Diagnóstico aprofundado dos programas legais (PGR/NR-17/PCMSO) + validação in loco com a equipe técnica da B4. Acompanhamento mensal recomendado."
      : "Acompanhamento mensal pra manter o GRO vivo e antecipar oportunidades de redução de custo previsível. Fale com a B4.";

  const disclaimer =
    "Análise heurística baseada em eventos eSocial declarados. Custo Previsível em FAIXAS (não valor exato) — depende de premissas e enquadramento previdenciário. " +
    "Validação técnica in loco é recomendada antes de qualquer decisão.";

  return {
    executiveSummary,
    costSummary,
    topRecommendations: recommendations,
    cta,
    disclaimer,
  };
}
