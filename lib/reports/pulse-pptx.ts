/**
 * Gerador de PPTX do Pulse NR-1.
 *
 * Slides:
 *   1. Capa
 *   2. Resumo executivo (total respostas, áreas, quick wins)
 *   3. Score por dimensão (bar chart)
 *   4. Heatmap (table)
 *   5. Quick wins detalhados (30 dias)
 *   6. Próximos passos
 */

import pptxgen from "pptxgenjs";
import type { AggregateResult } from "../pulse/db";

const B4_PRIMARY = "0E427B";
const B4_DARK = "0A2540";
const B4_LIGHT = "F4F6F9";

export interface PulseReportInput {
  companyName: string;
  cnpj: string;
  campaignTitle: string;
  createdAt: string;
  aggregate: AggregateResult;
  narrative?: {
    executiveSummary: string;
    driversAnalysis: string;
    topRecommendations: string[];
    cta: string;
    disclaimer: string;
  } | null;
}

function cellHexFromPct(pct: number | null): string {
  if (pct === null) return "E5E7EB";
  if (pct >= 80) return "10B981";
  if (pct >= 65) return "A7F3D0";
  if (pct >= 50) return "FCD34D";
  if (pct >= 35) return "FB923C";
  return "EF4444";
}

export async function generatePulsePptx(input: PulseReportInput): Promise<Buffer> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  const { aggregate } = input;

  // ============ SLIDE 1 — CAPA ============
  const s1 = pres.addSlide();
  s1.background = { color: B4_DARK };
  s1.addText("B4 GESTÃO OCUPACIONAL", { x: 0.5, y: 0.5, w: 12, h: 0.5, fontSize: 14, color: "FFFFFF", bold: true, fontFace: "Calibri" });
  s1.addText("Pulse NR-1", { x: 0.5, y: 2.5, w: 12, h: 1.2, fontSize: 48, color: "FFFFFF", bold: true, fontFace: "Calibri" });
  s1.addText(input.campaignTitle, { x: 0.5, y: 3.7, w: 12, h: 0.6, fontSize: 18, color: "FFFFFF", fontFace: "Calibri" });
  s1.addText(input.companyName, { x: 0.5, y: 5.2, w: 12, h: 0.6, fontSize: 24, color: "FFFFFF", bold: true, fontFace: "Calibri" });
  s1.addText(`CNPJ ${input.cnpj}`, { x: 0.5, y: 5.8, w: 12, h: 0.4, fontSize: 14, color: "FFFFFF", fontFace: "Calibri" });
  s1.addText(new Date(input.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), {
    x: 0.5, y: 6.6, w: 12, h: 0.4, fontSize: 12, color: "FFFFFF", fontFace: "Calibri",
  });

  // ============ SLIDE 2 — RESUMO EXECUTIVO ============
  const s2 = pres.addSlide();
  s2.background = { color: "FFFFFF" };
  s2.addText("Resumo executivo", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
  s2.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });

  const dimensions = Object.values(aggregate.byDimension);
  const avgPct = dimensions.length > 0
    ? Math.round(dimensions.reduce((sum, d) => sum + d.pct, 0) / dimensions.length)
    : 0;
  const criticalDims = dimensions.filter((d) => d.pct < 50).length;
  const visibleAreas = aggregate.heatmap.filter((a) => !a.blocked).length;

  const cards = [
    { label: "Respostas coletadas", value: String(aggregate.totalResponses) },
    { label: "Índice global (1-5)", value: aggregate.globalIndex ? aggregate.globalIndex.toFixed(1) : "—" },
    { label: "Dimensões críticas", value: String(criticalDims) },
    { label: "Áreas com agregado visível", value: `${visibleAreas} / ${aggregate.heatmap.length}` },
  ];
  cards.forEach((c, idx) => {
    const x = 0.5 + idx * 3.1;
    s2.addShape(pres.ShapeType.rect, { x, y: 1.5, w: 3, h: 2, fill: { color: B4_LIGHT }, line: { color: "E5E7EB", width: 1 } });
    s2.addText(c.label, { x: x + 0.2, y: 1.7, w: 2.6, h: 0.4, fontSize: 11, color: "888888", bold: true, fontFace: "Calibri" });
    s2.addText(c.value, { x: x + 0.2, y: 2.1, w: 2.6, h: 1.1, fontSize: 36, color: B4_DARK, bold: true, fontFace: "Calibri" });
  });

  if (aggregate.quickWins.length > 0) {
    s2.addText("Top 3 quick wins (ação em 30 dias)", { x: 0.5, y: 4, w: 12, h: 0.4, fontSize: 16, color: B4_DARK, bold: true, fontFace: "Calibri" });
    aggregate.quickWins.slice(0, 3).forEach((w, idx) => {
      const y = 4.5 + idx * 0.6;
      s2.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 12, h: 0.5, fill: { color: idx % 2 === 0 ? B4_LIGHT : "FFFFFF" }, line: { type: "none" } });
      s2.addText(w.label, { x: 0.7, y, w: 8, h: 0.5, fontSize: 13, color: B4_DARK, valign: "middle", fontFace: "Calibri" });
      s2.addText(`${w.pct}%`, { x: 8.5, y, w: 1, h: 0.5, fontSize: 13, color: "EF4444", bold: true, valign: "middle", align: "center", fontFace: "Calibri" });
      s2.addText(w.reason, { x: 9.5, y, w: 3, h: 0.5, fontSize: 10, color: "666666", italic: true, valign: "middle", fontFace: "Calibri" });
    });
  }

  // ============ SLIDE 3 — POR DIMENSÃO ============
  const s3 = pres.addSlide();
  s3.background = { color: "FFFFFF" };
  s3.addText("Score por dimensão psicossocial", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
  s3.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });

  const chartData = [{
    name: "Score (%)",
    labels: Object.values(aggregate.byDimension).map((v) => v.label),
    values: Object.values(aggregate.byDimension).map((v) => v.pct),
  }];
  s3.addChart(pres.ChartType.bar, chartData, {
    x: 0.5, y: 1.5, w: 12, h: 5.5,
    barDir: "bar",
    chartColors: [B4_PRIMARY],
    catAxisLabelFontSize: 12,
    valAxisLabelFontSize: 11,
    valAxisMaxVal: 100, valAxisMinVal: 0,
    showValue: true,
    dataLabelFontSize: 11,
    dataLabelColor: "FFFFFF",
    dataLabelPosition: "inEnd",
  });

  // ============ SLIDE 4 — HEATMAP ============
  const s4 = pres.addSlide();
  s4.background = { color: "FFFFFF" };
  s4.addText("Heatmap por área × dimensão", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
  s4.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });
  s4.addText(`Áreas com menos de ${aggregate.threshold} respostas ficam bloqueadas (anonimato).`, {
    x: 0.5, y: 1.1, w: 12, h: 0.3, fontSize: 11, color: "666666", italic: true, fontFace: "Calibri",
  });

  // Cabeçalho da tabela
  const dimLabels = aggregate.heatmap[0]?.cells.map((c) => abbrev(c.label)) ?? [];
  const headerRow = ["Área", "N", ...dimLabels];

  // pptxgen addTable
  const tableRows: pptxgen.TableRow[] = [];
  tableRows.push(headerRow.map((h) => ({
    text: h, options: { bold: true, color: "FFFFFF", fill: { color: B4_PRIMARY }, align: "center", fontSize: 11, fontFace: "Calibri" }
  })));
  for (const row of aggregate.heatmap) {
    const cells: pptxgen.TableCell[] = [
      { text: row.area, options: { bold: true, fontSize: 11, color: B4_DARK, fontFace: "Calibri" } },
      { text: String(row.count), options: { align: "center", fontSize: 11, color: "666666", fontFace: "Calibri" } },
    ];
    for (const c of row.cells) {
      cells.push({
        text: c.pct === null ? "🔒" : String(c.pct),
        options: {
          align: "center", fontSize: 12, bold: true,
          color: c.pct === null ? "9CA3AF" : (c.pct >= 65 ? "064E3B" : "FFFFFF"),
          fill: { color: cellHexFromPct(c.pct) },
          fontFace: "Calibri",
        }
      });
    }
    tableRows.push(cells);
  }
  s4.addTable(tableRows, {
    x: 0.5, y: 1.6, w: 12, h: 5,
    border: { type: "solid", color: "FFFFFF", pt: 1 },
    autoPage: false,
  });

  // ============ SLIDE 5 — QUICK WINS DETALHADOS ============
  if (aggregate.quickWins.length > 0) {
    const s5 = pres.addSlide();
    s5.background = { color: "FFFFFF" };
    s5.addText("Plano 30 dias — Quick wins", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
    s5.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });

    aggregate.quickWins.forEach((w, idx) => {
      const y = 1.5 + idx * 1.0;
      s5.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 12, h: 0.9, fill: { color: B4_LIGHT }, line: { color: "E5E7EB", width: 1 } });
      s5.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 0.15, h: 0.9, fill: { color: w.pct < 40 ? "EF4444" : "F59E0B" }, line: { type: "none" } });
      s5.addText(w.label, { x: 0.9, y: y + 0.1, w: 10, h: 0.4, fontSize: 16, color: B4_DARK, bold: true, fontFace: "Calibri" });
      s5.addText(w.reason, { x: 0.9, y: y + 0.5, w: 10, h: 0.4, fontSize: 12, color: "666666", fontFace: "Calibri" });
      s5.addText(`${w.pct}%`, { x: 11, y, w: 1.5, h: 0.9, fontSize: 24, color: w.pct < 40 ? "EF4444" : "F59E0B", bold: true, valign: "middle", align: "center", fontFace: "Calibri" });
    });
  }

  // ============ SLIDE NARRATIVA EXECUTIVA (local) ============
  if (input.narrative) {
    const sN = pres.addSlide();
    sN.background = { color: "FFFFFF" };
    sN.addText("Análise executiva", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: B4_DARK, bold: true, fontFace: "Calibri" });
    sN.addShape(pres.ShapeType.line, { x: 0.5, y: 0.95, w: 1.5, h: 0, line: { color: B4_PRIMARY, width: 4 } });

    sN.addText("RESUMO EXECUTIVO", { x: 0.5, y: 1.3, w: 12, h: 0.3, fontSize: 11, color: "888888", bold: true, fontFace: "Calibri" });
    sN.addText(input.narrative.executiveSummary, { x: 0.5, y: 1.65, w: 12, h: 1.4, fontSize: 13, color: B4_DARK, fontFace: "Calibri", valign: "top" });

    sN.addText("ANÁLISE DE DRIVERS", { x: 0.5, y: 3.2, w: 12, h: 0.3, fontSize: 11, color: "888888", bold: true, fontFace: "Calibri" });
    sN.addText(input.narrative.driversAnalysis, { x: 0.5, y: 3.55, w: 12, h: 1.3, fontSize: 12, color: B4_DARK, fontFace: "Calibri", valign: "top" });

    sN.addText("RECOMENDAÇÕES PRIORITÁRIAS", { x: 0.5, y: 5.0, w: 12, h: 0.3, fontSize: 11, color: "888888", bold: true, fontFace: "Calibri" });
    input.narrative.topRecommendations.slice(0, 3).forEach((rec, idx) => {
      const y = 5.4 + idx * 0.45;
      sN.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 0.15, h: 0.35, fill: { color: B4_PRIMARY }, line: { type: "none" } });
      sN.addText(rec, { x: 0.8, y, w: 11.7, h: 0.35, fontSize: 11, color: B4_DARK, valign: "middle", fontFace: "Calibri" });
    });
  }

  // ============ SLIDE 6 — PRÓXIMOS PASSOS ============
  const s6 = pres.addSlide();
  s6.background = { color: B4_DARK };
  s6.addText("Próximos passos com a B4", { x: 0.5, y: 0.5, w: 12, h: 0.7, fontSize: 32, color: "FFFFFF", bold: true, fontFace: "Calibri" });
  const steps = [
    "1. Workshop de devolutiva com lideranças (interpretação dos dados)",
    "2. Plano de ação detalhado por dimensão crítica",
    "3. Capacitação de gestores nos fatores psicossociais",
    "4. Implementação de canais de escuta e ações estruturais",
    "5. Repesquisa em 6 meses para medir progresso",
  ];
  steps.forEach((s, idx) => {
    s6.addText(s, { x: 0.8, y: 1.8 + idx * 0.7, w: 11, h: 0.5, fontSize: 17, color: "FFFFFF", fontFace: "Calibri" });
  });
  s6.addText("contato@b4gestao.com   ·   b4gestao.com.br   ·   (11) 9 4502-3304", {
    x: 0.5, y: 6.8, w: 12, h: 0.4, fontSize: 11, color: "FFFFFF", align: "center", fontFace: "Calibri",
  });

  const out = await pres.write({ outputType: "nodebuffer" });
  return out as Buffer;
}

function abbrev(s: string) { return s.length > 10 ? s.slice(0, 9) + "…" : s; }
