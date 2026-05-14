/**
 * Gerador de PPTX do Stress Test NR-1.
 *
 * Slides:
 *   1. Capa (B4 + empresa + data)
 *   2. Resultado executivo (score + semáforo + faixa)
 *   3. Sub-scores (engavetamento + coerência)
 *   4. Score por categoria (gráfico de barras)
 *   5. Pontos críticos a priorizar (weak spots)
 *   6. Próximos passos
 */

import pptxgen from "pptxgenjs";
import type { ScoreResult } from "../stress-test/scoring";

const B4_PRIMARY = "0E427B";
const B4_DARK = "0A2540";
const B4_LIGHT = "F4F6F9";
const COLOR_VERDE = "10B981";
const COLOR_AMARELO = "F59E0B";
const COLOR_VERMELHO = "EF4444";

function semaforoColor(s: string) {
  return s === "VERDE" ? COLOR_VERDE : s === "AMARELO" ? COLOR_AMARELO : COLOR_VERMELHO;
}

export interface StressReportInput {
  companyName: string;
  cnpj: string;
  respondentName: string;
  respondentRole: string | null;
  createdAt: string;
  result: ScoreResult;
  /** Texto blindado opcional gerado por IA (se disponível). */
  narrative?: {
    executiveSummary: string;
    topRecommendations: string[];
    technicalNarrative: string;
    disclaimer: string;
  } | null;
}

export async function generateStressTestPptx(input: StressReportInput): Promise<Buffer> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5

  // ============ SLIDE 1 — CAPA ============
  const s1 = pres.addSlide();
  s1.background = { color: B4_DARK };
  s1.addText("B4 GESTÃO OCUPACIONAL", {
    x: 0.5, y: 0.5, w: 12, h: 0.5,
    fontSize: 14, color: "FFFFFF", bold: true,
    fontFace: "Calibri", align: "left",
  });
  s1.addText("Stress Test NR-1", {
    x: 0.5, y: 2.5, w: 12, h: 1.2,
    fontSize: 48, color: "FFFFFF", bold: true,
    fontFace: "Calibri", align: "left",
  });
  s1.addText("Diagnóstico de exposição regulatória psicossocial", {
    x: 0.5, y: 3.7, w: 12, h: 0.5,
    fontSize: 20, color: "FFFFFF",
    fontFace: "Calibri", align: "left",
  });
  s1.addText(input.companyName, {
    x: 0.5, y: 5.2, w: 12, h: 0.6,
    fontSize: 24, color: "FFFFFF", bold: true,
    fontFace: "Calibri",
  });
  s1.addText(`CNPJ ${input.cnpj}`, {
    x: 0.5, y: 5.8, w: 12, h: 0.4,
    fontSize: 14, color: "FFFFFF",
    fontFace: "Calibri",
  });
  s1.addText(new Date(input.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), {
    x: 0.5, y: 6.6, w: 12, h: 0.4,
    fontSize: 12, color: "FFFFFF",
    fontFace: "Calibri",
  });

  // ============ SLIDE 2 — RESULTADO EXECUTIVO ============
  const s2 = pres.addSlide();
  s2.background = { color: "FFFFFF" };
  s2.addText("Resultado Executivo", {
    x: 0.5, y: 0.3, w: 12, h: 0.6,
    fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri",
  });
  s2.addShape(pres.ShapeType.line, {
    x: 0.5, y: 0.95, w: 1.5, h: 0,
    line: { color: B4_PRIMARY, width: 4 },
  });

  // Círculo grande com score
  const semColor = semaforoColor(input.result.semaforo);
  s2.addShape(pres.ShapeType.ellipse, {
    x: 0.8, y: 1.8, w: 3.5, h: 3.5,
    fill: { color: semColor },
    line: { color: semColor, width: 0 },
  });
  s2.addText(String(input.result.total), {
    x: 0.8, y: 2.6, w: 3.5, h: 2,
    fontSize: 80, color: "FFFFFF", bold: true, align: "center", valign: "middle",
    fontFace: "Calibri",
  });
  s2.addText("/100", {
    x: 0.8, y: 4.3, w: 3.5, h: 0.5,
    fontSize: 20, color: "FFFFFF", align: "center",
    fontFace: "Calibri",
  });

  // Lateral direita: semáforo + faixa
  s2.addText("SEMÁFORO NR-1", { x: 5, y: 2, w: 8, h: 0.4, fontSize: 12, color: "888888", bold: true, fontFace: "Calibri" });
  s2.addText(input.result.semaforo, { x: 5, y: 2.4, w: 8, h: 0.7, fontSize: 36, color: semColor, bold: true, fontFace: "Calibri" });
  s2.addText(input.result.semaforoLabel, { x: 5, y: 3.2, w: 8, h: 0.5, fontSize: 16, color: B4_DARK, fontFace: "Calibri" });

  s2.addText("EXPOSIÇÃO REGULATÓRIA", { x: 5, y: 4.2, w: 8, h: 0.4, fontSize: 12, color: "888888", bold: true, fontFace: "Calibri" });
  const faixaColor =
    input.result.faixa === "BAIXA" ? COLOR_VERDE
    : input.result.faixa === "MODERADA" ? COLOR_AMARELO
    : COLOR_VERMELHO;
  s2.addText(input.result.faixa, { x: 5, y: 4.6, w: 2.5, h: 0.5, fontSize: 22, color: faixaColor, bold: true, fontFace: "Calibri" });
  s2.addText(input.result.faixaLabel, { x: 7.5, y: 4.65, w: 5.5, h: 0.5, fontSize: 14, color: B4_DARK, fontFace: "Calibri" });

  // Respondente
  s2.addText(`Respondente: ${input.respondentName}${input.respondentRole ? ` · ${input.respondentRole}` : ""}`, {
    x: 0.5, y: 6.8, w: 12, h: 0.3,
    fontSize: 11, color: "888888", italic: true, fontFace: "Calibri",
  });

  // ============ SLIDE 3 — SUB-SCORES ============
  const s3 = pres.addSlide();
  s3.background = { color: "FFFFFF" };
  s3.addText("Sub-scores estratégicos", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
  s3.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });

  // Card 1: Engavetamento
  s3.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.5, w: 6, h: 4, fill: { color: B4_LIGHT }, line: { color: "E5E7EB", width: 1 } });
  s3.addText("RISCO DE ENGAVETAMENTO", { x: 0.8, y: 1.8, w: 5.4, h: 0.4, fontSize: 12, color: "888888", bold: true, fontFace: "Calibri" });
  s3.addText(`${input.result.engavetamento.score} / ${input.result.engavetamento.max}`, {
    x: 0.8, y: 2.2, w: 5.4, h: 0.9, fontSize: 40, color: B4_DARK, bold: true, fontFace: "Calibri",
  });
  s3.addText(`Classificação: ${input.result.engavetamento.classification}`, {
    x: 0.8, y: 3.1, w: 5.4, h: 0.4, fontSize: 16, color: B4_PRIMARY, bold: true, fontFace: "Calibri",
  });
  s3.addText(input.result.engavetamento.label, { x: 0.8, y: 3.5, w: 5.4, h: 0.6, fontSize: 13, color: B4_DARK, fontFace: "Calibri" });
  s3.addText("Faixas: Baixo 24-32 / Médio 14-23 / Alto 0-13.", {
    x: 0.8, y: 4.2, w: 5.4, h: 0.8, fontSize: 11, color: "666666", italic: true, fontFace: "Calibri",
  });

  // Card 2: Coerência psicossocial
  s3.addShape(pres.ShapeType.rect, { x: 6.8, y: 1.5, w: 6, h: 4, fill: { color: B4_LIGHT }, line: { color: "E5E7EB", width: 1 } });
  s3.addText("COERÊNCIA PSICOSSOCIAL", { x: 7.1, y: 1.8, w: 5.4, h: 0.4, fontSize: 12, color: "888888", bold: true, fontFace: "Calibri" });
  s3.addText(input.result.coerencia.label, { x: 7.1, y: 2.2, w: 5.4, h: 0.9, fontSize: 26, color: B4_DARK, bold: true, fontFace: "Calibri" });
  s3.addText(input.result.coerencia.description, { x: 7.1, y: 3.3, w: 5.4, h: 1.2, fontSize: 12, color: B4_DARK, fontFace: "Calibri" });
  s3.addText("Cruzamento Q18A (afirmação) × Q18B (evidência).", {
    x: 7.1, y: 4.7, w: 5.4, h: 0.5, fontSize: 11, color: "666666", italic: true, fontFace: "Calibri",
  });

  // ============ SLIDE 4 — POR CATEGORIA (chart) ============
  const s4 = pres.addSlide();
  s4.background = { color: "FFFFFF" };
  s4.addText("Desempenho por categoria", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
  s4.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });

  const categoryLabels: Record<string, string> = {
    evidencia: "Evidência documental",
    psicossocial: "Psicossocial",
    estrutura: "Estrutura/governança",
    fiscalizacao: "Exposição à fiscalização",
  };
  const chartData = [{
    name: "Score (%)",
    labels: Object.keys(input.result.byCategory).map((k) => categoryLabels[k] ?? k),
    values: Object.values(input.result.byCategory).map((v) => v.pct),
  }];
  s4.addChart(pres.ChartType.bar, chartData, {
    x: 0.5, y: 1.5, w: 12, h: 5,
    barDir: "bar",
    chartColors: [B4_PRIMARY],
    catAxisLabelFontSize: 13,
    valAxisLabelFontSize: 11,
    valAxisMaxVal: 100, valAxisMinVal: 0,
    showValue: true,
    dataLabelFontSize: 12,
    dataLabelColor: "FFFFFF",
    dataLabelPosition: "inEnd",
  });

  // ============ SLIDE 5 — PONTOS CRÍTICOS ============
  if (input.result.weakSpots.length > 0) {
    const s5 = pres.addSlide();
    s5.background = { color: "FFFFFF" };
    s5.addText("Pontos críticos a priorizar", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
    s5.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });
    s5.addText(`As ${Math.min(input.result.weakSpots.length, 8)} respostas mais baixas (peso ≤ 2) que mais impactam a exposição:`, {
      x: 0.5, y: 1.2, w: 12, h: 0.4, fontSize: 14, color: "555555", italic: true, fontFace: "Calibri",
    });

    const items = input.result.weakSpots.slice(0, 8);
    items.forEach((w, idx) => {
      const y = 1.8 + idx * 0.65;
      s5.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 12, h: 0.55, fill: { color: idx % 2 === 0 ? B4_LIGHT : "FFFFFF" }, line: { type: "none" } });
      s5.addText(w.id, { x: 0.7, y, w: 0.8, h: 0.55, fontSize: 14, color: B4_PRIMARY, bold: true, valign: "middle", fontFace: "Calibri" });
      s5.addText(w.text, { x: 1.5, y, w: 9.5, h: 0.55, fontSize: 12, color: B4_DARK, valign: "middle", fontFace: "Calibri" });
      s5.addText(`Resposta: ${w.chosen}`, { x: 11, y, w: 1.5, h: 0.55, fontSize: 12, color: COLOR_VERMELHO, bold: true, valign: "middle", align: "right", fontFace: "Calibri" });
    });
  }

  // ============ SLIDE AI NARRATIVE (opcional) ============
  if (input.narrative) {
    const sAI = pres.addSlide();
    sAI.background = { color: "FFFFFF" };
    sAI.addText("Análise executiva", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
    sAI.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });

    sAI.addText("RESUMO EXECUTIVO", { x: 0.5, y: 1.3, w: 12, h: 0.4, fontSize: 12, color: "888888", bold: true, fontFace: "Calibri" });
    sAI.addText(input.narrative.executiveSummary, { x: 0.5, y: 1.7, w: 12, h: 1.6, fontSize: 14, color: B4_DARK, fontFace: "Calibri", valign: "top" });

    sAI.addText("RECOMENDAÇÕES PRIORITÁRIAS", { x: 0.5, y: 3.5, w: 12, h: 0.4, fontSize: 12, color: "888888", bold: true, fontFace: "Calibri" });
    input.narrative.topRecommendations.slice(0, 3).forEach((rec, idx) => {
      const y = 3.9 + idx * 0.5;
      sAI.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 0.15, h: 0.4, fill: { color: B4_PRIMARY }, line: { type: "none" } });
      sAI.addText(rec, { x: 0.8, y, w: 11.7, h: 0.4, fontSize: 12, color: B4_DARK, valign: "middle", fontFace: "Calibri" });
    });

    sAI.addText("ANÁLISE TÉCNICA", { x: 0.5, y: 5.5, w: 12, h: 0.4, fontSize: 12, color: "888888", bold: true, fontFace: "Calibri" });
    sAI.addText(input.narrative.technicalNarrative, { x: 0.5, y: 5.9, w: 12, h: 1.5, fontSize: 11, color: "555555", italic: true, valign: "top", fontFace: "Calibri" });
  }

  // ============ SLIDE 6 — PRÓXIMOS PASSOS ============
  const s6 = pres.addSlide();
  s6.background = { color: B4_DARK };
  s6.addText("Próximos passos com a B4", { x: 0.5, y: 0.5, w: 12, h: 0.7, fontSize: 32, color: "FFFFFF", bold: true, fontFace: "Calibri" });

  const steps = [
    "1. Apresentação do diagnóstico completo com especialista B4",
    "2. Construção do PGR/GRO contemplando riscos psicossociais NR-1",
    "3. Plano de ação documentado com responsáveis e prazos",
    "4. Capacitação de lideranças e implantação dos controles",
    "5. Monitoramento contínuo com indicadores e revisão trimestral",
  ];
  steps.forEach((s, idx) => {
    s6.addText(s, {
      x: 0.8, y: 1.8 + idx * 0.7, w: 11, h: 0.5, fontSize: 17, color: "FFFFFF", fontFace: "Calibri",
    });
  });

  // Disclaimer obrigatório
  s6.addShape(pres.ShapeType.rect, { x: 0.5, y: 6.0, w: 12, h: 0.6, fill: { color: "F59E0B" }, line: { type: "none" } });
  s6.addText(
    "⚠ Disclaimer: estimativa preliminar — depende de enquadramento e fiscalização. Recomenda-se validação técnica in loco.",
    { x: 0.7, y: 6.05, w: 11.6, h: 0.5, fontSize: 11, color: "FFFFFF", bold: true, valign: "middle", fontFace: "Calibri" }
  );
  s6.addText("contato@b4gestao.com   ·   b4gestao.com.br   ·   (11) 9 4502-3304", {
    x: 0.5, y: 6.9, w: 12, h: 0.4, fontSize: 11, color: "FFFFFF", align: "center", fontFace: "Calibri",
  });

  const out = await pres.write({ outputType: "nodebuffer" });
  return out as Buffer;
}
