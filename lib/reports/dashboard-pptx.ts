/**
 * PPTX "Dashboard estilo sistema/IA" (Briefing v3).
 *
 * Visual mais carregado, parece print de SaaS. Para Stress Test, Pulse e eSocial.
 * Cores, gráficos densos, KPIs grandes.
 */

import pptxgen from "pptxgenjs";
import type { ScoreResult } from "../stress-test/scoring";
import type { AggregateResult } from "../pulse/db";

const PRIMARY = "0E427B";
const DARK = "0A2540";
const ACCENT = "F59E0B";
const BG_DARK = "0F172A"; // slate-900
const BG_CARD = "1E293B"; // slate-800
const TEXT_LIGHT = "F1F5F9";
const TEXT_MUTED = "94A3B8";
const VERDE = "10B981";
const AMARELO = "F59E0B";
const VERMELHO = "EF4444";

// ============================================================
// STRESS TEST — Dashboard
// ============================================================
export interface StressDashboardInput {
  companyName: string;
  cnpj: string;
  respondentName: string;
  createdAt: string;
  result: ScoreResult;
}

export async function generateStressDashboardPptx(input: StressDashboardInput): Promise<Buffer> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  const r = input.result;
  const sem = r.semaforo === "VERDE" ? VERDE : r.semaforo === "AMARELO" ? AMARELO : VERMELHO;

  // SLIDE 1 — Dashboard executivo
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  // Topbar
  s.addText("B4 ANALYTICS · STRESS TEST NR-1", { x: 0.3, y: 0.2, w: 8, h: 0.4, fontSize: 12, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(new Date(input.createdAt).toLocaleDateString("pt-BR"), { x: 11, y: 0.2, w: 2, h: 0.4, fontSize: 11, color: TEXT_MUTED, align: "right", fontFace: "Calibri" });

  // Company title
  s.addText(input.companyName, { x: 0.3, y: 0.6, w: 13, h: 0.5, fontSize: 22, color: TEXT_LIGHT, bold: true, fontFace: "Calibri" });
  s.addText(`CNPJ ${input.cnpj}  ·  Respondente: ${input.respondentName}`, { x: 0.3, y: 1.05, w: 13, h: 0.3, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri" });

  // Big KPI score
  s.addShape(pres.ShapeType.rect, { x: 0.3, y: 1.5, w: 4.5, h: 3.5, fill: { color: BG_CARD }, line: { color: sem, width: 2 } });
  s.addText("SCORE TOTAL", { x: 0.5, y: 1.7, w: 4.1, h: 0.3, fontSize: 11, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(String(r.total), { x: 0.5, y: 2.1, w: 4.1, h: 1.6, fontSize: 96, color: sem, bold: true, align: "center", fontFace: "Calibri" });
  s.addText("/ 100", { x: 0.5, y: 3.7, w: 4.1, h: 0.4, fontSize: 16, color: TEXT_MUTED, align: "center", fontFace: "Calibri" });
  s.addText(r.semaforoLabel, { x: 0.5, y: 4.3, w: 4.1, h: 0.4, fontSize: 14, color: TEXT_LIGHT, bold: true, align: "center", fontFace: "Calibri" });

  // Coluna sub-KPIs
  const subKPIs = [
    { label: "ENGAVETAMENTO", value: `${r.engavetamento.score}/${r.engavetamento.max}`, sub: r.engavetamento.classification, color: r.engavetamento.classification === "Baixo" ? VERDE : r.engavetamento.classification === "Médio" ? AMARELO : VERMELHO },
    { label: "EXPOSIÇÃO REGULATÓRIA", value: r.faixa, sub: `${r.faixaScore}% conformidade`, color: r.faixa === "BAIXA" ? VERDE : r.faixa === "MODERADA" ? AMARELO : VERMELHO },
    { label: "COERÊNCIA Q18A×Q18B", value: r.coerencia.label, sub: `${r.coerencia.q18a ?? "-"} × ${r.coerencia.q18b ?? "-"}`, color: PRIMARY },
  ];
  subKPIs.forEach((kpi, i) => {
    const x = 5.0 + i * 2.85;
    s.addShape(pres.ShapeType.rect, { x, y: 1.5, w: 2.7, h: 3.5, fill: { color: BG_CARD }, line: { color: BG_CARD, width: 0 } });
    s.addText(kpi.label, { x: x + 0.2, y: 1.7, w: 2.3, h: 0.4, fontSize: 9, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
    const valueFontSize = kpi.value.length > 6 ? 13 : 22;
    s.addText(kpi.value, { x: x + 0.2, y: 2.2, w: 2.3, h: 1.3, fontSize: valueFontSize, color: kpi.color, bold: true, valign: "middle", fontFace: "Calibri" });
    s.addText(kpi.sub, { x: x + 0.2, y: 3.7, w: 2.3, h: 1, fontSize: 10, color: TEXT_LIGHT, valign: "top", fontFace: "Calibri" });
  });

  // KPI: Total perguntas críticas
  const x4 = 13.55; // mais à direita
  if (x4 < 13.3) {
    // bound check — usa kpi simplificado
  }

  // Linha do meio: gráfico de categoria
  s.addShape(pres.ShapeType.rect, { x: 0.3, y: 5.3, w: 7.5, h: 1.9, fill: { color: BG_CARD }, line: { color: BG_CARD, width: 0 } });
  s.addText("DESEMPENHO POR CATEGORIA", { x: 0.5, y: 5.4, w: 7, h: 0.3, fontSize: 10, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });

  const catData = Object.entries(r.byCategory).map(([k, v]) => ({
    label: catLabel(k),
    pct: v.pct,
  }));
  catData.forEach((c, i) => {
    const y = 5.8 + i * 0.32;
    s.addText(c.label, { x: 0.5, y, w: 2, h: 0.3, fontSize: 10, color: TEXT_LIGHT, fontFace: "Calibri" });
    // barra de fundo
    s.addShape(pres.ShapeType.rect, { x: 2.6, y: y + 0.08, w: 4.5, h: 0.18, fill: { color: "374151" }, line: { type: "none" } });
    // barra de score
    const w = (c.pct / 100) * 4.5;
    s.addShape(pres.ShapeType.rect, { x: 2.6, y: y + 0.08, w, h: 0.18, fill: { color: c.pct >= 75 ? VERDE : c.pct >= 50 ? AMARELO : VERMELHO }, line: { type: "none" } });
    s.addText(`${c.pct}%`, { x: 7.2, y, w: 0.5, h: 0.3, fontSize: 10, color: TEXT_LIGHT, bold: true, fontFace: "Calibri" });
  });

  // Pontos críticos
  s.addShape(pres.ShapeType.rect, { x: 8.0, y: 5.3, w: 5.0, h: 1.9, fill: { color: BG_CARD }, line: { color: BG_CARD, width: 0 } });
  s.addText("TOP 5 PONTOS CRÍTICOS", { x: 8.2, y: 5.4, w: 4.7, h: 0.3, fontSize: 10, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  r.weakSpots.slice(0, 5).forEach((w, i) => {
    const y = 5.8 + i * 0.27;
    s.addText(`${w.id}`, { x: 8.2, y, w: 0.6, h: 0.25, fontSize: 9, color: VERMELHO, bold: true, fontFace: "Calibri" });
    s.addText(w.text.slice(0, 70) + (w.text.length > 70 ? "…" : ""), { x: 8.8, y, w: 3.7, h: 0.25, fontSize: 9, color: TEXT_LIGHT, fontFace: "Calibri" });
    s.addText(w.chosen, { x: 12.6, y, w: 0.3, h: 0.25, fontSize: 9, color: VERMELHO, bold: true, fontFace: "Calibri" });
  });

  // Disclaimer rodapé
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.3, w: 13.33, h: 0.2, fill: { color: ACCENT }, line: { type: "none" } });
  s.addText(r.disclaimer ?? "Estimativa preliminar — validação técnica in loco recomendada.", { x: 0.3, y: 7.3, w: 13, h: 0.2, fontSize: 9, color: "FFFFFF", bold: true, valign: "middle", fontFace: "Calibri" });

  const out = await pres.write({ outputType: "nodebuffer" });
  return out as Buffer;
}

function catLabel(c: string) {
  return c === "evidencia" ? "Evidência" : c === "psicossocial" ? "Psicossocial" : c === "estrutura" ? "Estrutura" : c === "fiscalizacao" ? "Fiscalização" : c;
}

// ============================================================
// PULSE — Dashboard
// ============================================================
export interface PulseDashboardInput {
  companyName: string;
  cnpj: string;
  campaignTitle: string;
  createdAt: string;
  aggregate: AggregateResult;
}

export async function generatePulseDashboardPptx(input: PulseDashboardInput): Promise<Buffer> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  const ag = input.aggregate;

  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText("B4 ANALYTICS · PULSE NR-1", { x: 0.3, y: 0.2, w: 8, h: 0.4, fontSize: 12, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(new Date(input.createdAt).toLocaleDateString("pt-BR"), { x: 11, y: 0.2, w: 2, h: 0.4, fontSize: 11, color: TEXT_MUTED, align: "right", fontFace: "Calibri" });

  s.addText(input.companyName, { x: 0.3, y: 0.6, w: 13, h: 0.5, fontSize: 22, color: TEXT_LIGHT, bold: true, fontFace: "Calibri" });
  s.addText(input.campaignTitle, { x: 0.3, y: 1.05, w: 13, h: 0.3, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri" });

  // Big KPI: Índice global
  const idx = ag.globalIndex ?? 0;
  const idxColor = idx >= 4 ? VERDE : idx >= 3 ? AMARELO : VERMELHO;
  s.addShape(pres.ShapeType.rect, { x: 0.3, y: 1.5, w: 4.5, h: 3.5, fill: { color: BG_CARD }, line: { color: idxColor, width: 2 } });
  s.addText("ÍNDICE GLOBAL", { x: 0.5, y: 1.7, w: 4.1, h: 0.3, fontSize: 11, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(idx.toFixed(1), { x: 0.5, y: 2.1, w: 4.1, h: 1.6, fontSize: 96, color: idxColor, bold: true, align: "center", fontFace: "Calibri" });
  s.addText("/ 5.0", { x: 0.5, y: 3.7, w: 4.1, h: 0.4, fontSize: 16, color: TEXT_MUTED, align: "center", fontFace: "Calibri" });
  s.addText(ag.globalLabel ?? "", { x: 0.5, y: 4.3, w: 4.1, h: 0.4, fontSize: 13, color: TEXT_LIGHT, bold: true, align: "center", fontFace: "Calibri" });

  // KPI: Respostas
  s.addShape(pres.ShapeType.rect, { x: 5.0, y: 1.5, w: 2.7, h: 1.65, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("RESPOSTAS", { x: 5.2, y: 1.7, w: 2.3, h: 0.3, fontSize: 9, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(String(ag.totalResponses), { x: 5.2, y: 2.1, w: 2.3, h: 0.9, fontSize: 48, color: PRIMARY, bold: true, valign: "middle", fontFace: "Calibri" });

  // KPI: Threshold
  s.addShape(pres.ShapeType.rect, { x: 7.85, y: 1.5, w: 2.7, h: 1.65, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("THRESHOLD", { x: 8.05, y: 1.7, w: 2.3, h: 0.3, fontSize: 9, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(`n ≥ ${ag.threshold}`, { x: 8.05, y: 2.1, w: 2.3, h: 0.9, fontSize: 32, color: TEXT_LIGHT, bold: true, valign: "middle", fontFace: "Calibri" });

  // KPI: Áreas visíveis
  const visible = ag.heatmap.filter((h) => !h.blocked).length;
  s.addShape(pres.ShapeType.rect, { x: 10.7, y: 1.5, w: 2.6, h: 1.65, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("ÁREAS VISÍVEIS", { x: 10.9, y: 1.7, w: 2.2, h: 0.3, fontSize: 9, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(`${visible}/${ag.heatmap.length}`, { x: 10.9, y: 2.1, w: 2.2, h: 0.9, fontSize: 36, color: visible === ag.heatmap.length ? VERDE : AMARELO, bold: true, valign: "middle", fontFace: "Calibri" });

  // Dimensões — gráfico
  s.addShape(pres.ShapeType.rect, { x: 5.0, y: 3.25, w: 8.3, h: 1.75, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("SCORE POR DIMENSÃO", { x: 5.2, y: 3.35, w: 8, h: 0.3, fontSize: 10, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  Object.entries(ag.byDimension).slice(0, 4).forEach(([, v], i) => {
    const y = 3.7 + i * 0.3;
    s.addText(v.label, { x: 5.2, y, w: 2.5, h: 0.28, fontSize: 10, color: TEXT_LIGHT, fontFace: "Calibri" });
    s.addShape(pres.ShapeType.rect, { x: 7.8, y: y + 0.07, w: 4.5, h: 0.15, fill: { color: "374151" }, line: { type: "none" } });
    const w = (v.pct / 100) * 4.5;
    s.addShape(pres.ShapeType.rect, { x: 7.8, y: y + 0.07, w, h: 0.15, fill: { color: v.pct >= 75 ? VERDE : v.pct >= 50 ? AMARELO : VERMELHO }, line: { type: "none" } });
    s.addText(`${v.pct}%`, { x: 12.4, y, w: 0.7, h: 0.28, fontSize: 10, color: TEXT_LIGHT, bold: true, fontFace: "Calibri" });
  });

  // Drivers
  s.addShape(pres.ShapeType.rect, { x: 0.3, y: 5.3, w: 7.5, h: 1.9, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("DRIVERS — TOP 5 CRÍTICOS", { x: 0.5, y: 5.4, w: 7, h: 0.3, fontSize: 10, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  (ag.drivers ?? []).slice(0, 5).forEach((d, i) => {
    const y = 5.8 + i * 0.27;
    const color = d.avgScore < 2.5 ? VERMELHO : d.avgScore < 3.5 ? AMARELO : VERDE;
    s.addText(d.avgScore.toFixed(1), { x: 0.5, y, w: 0.6, h: 0.25, fontSize: 11, color, bold: true, fontFace: "Calibri" });
    s.addText(d.text.slice(0, 75) + (d.text.length > 75 ? "…" : ""), { x: 1.2, y, w: 6.4, h: 0.25, fontSize: 9, color: TEXT_LIGHT, fontFace: "Calibri" });
  });

  // Quick wins
  s.addShape(pres.ShapeType.rect, { x: 8.0, y: 5.3, w: 5.0, h: 1.9, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("QUICK WINS — 30 DIAS", { x: 8.2, y: 5.4, w: 4.7, h: 0.3, fontSize: 10, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  ag.quickWins.slice(0, 5).forEach((q, i) => {
    const y = 5.8 + i * 0.27;
    s.addText(`▸`, { x: 8.2, y, w: 0.3, h: 0.25, fontSize: 11, color: ACCENT, fontFace: "Calibri" });
    s.addText(q.label, { x: 8.5, y, w: 4, h: 0.25, fontSize: 9, color: TEXT_LIGHT, fontFace: "Calibri" });
    s.addText(`${q.pct}%`, { x: 12.6, y, w: 0.4, h: 0.25, fontSize: 9, color: VERMELHO, bold: true, fontFace: "Calibri" });
  });

  // Footer
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.3, w: 13.33, h: 0.2, fill: { color: PRIMARY }, line: { type: "none" } });
  s.addText("Pulse NR-1 · Diagnóstico psicossocial — B4 Gestão Ocupacional", { x: 0.3, y: 7.3, w: 13, h: 0.2, fontSize: 9, color: "FFFFFF", bold: true, valign: "middle", fontFace: "Calibri" });

  const out = await pres.write({ outputType: "nodebuffer" });
  return out as Buffer;
}

// ============================================================
// ESOCIAL — Dashboard
// ============================================================
export interface ESocialDashboardInput {
  companyName: string;
  cnpj: string;
  alertsByCode: Record<string, { count: number; severity: string; faixa: string | null }>;
  integrityScore: number;
  integrityLabel: string;
  totalAlertsActive: number;
  criticalAlerts: number;
  bands: Array<{
    category: string;
    label: string;
    faixa: string;
    rangeLow: number;
    rangeHigh: number;
  }>;
  disclaimer: string;
}

export async function generateESocialDashboardPptx(input: ESocialDashboardInput): Promise<Buffer> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText("B4 ANALYTICS · eSOCIAL + SST", { x: 0.3, y: 0.2, w: 8, h: 0.4, fontSize: 12, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(input.companyName, { x: 0.3, y: 0.6, w: 13, h: 0.5, fontSize: 22, color: TEXT_LIGHT, bold: true, fontFace: "Calibri" });
  s.addText(`CNPJ ${input.cnpj}`, { x: 0.3, y: 1.05, w: 13, h: 0.3, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri" });

  // Big KPI: Integridade
  const intColor = input.integrityScore >= 80 ? VERDE : input.integrityScore >= 50 ? AMARELO : VERMELHO;
  s.addShape(pres.ShapeType.rect, { x: 0.3, y: 1.5, w: 4.5, h: 3.5, fill: { color: BG_CARD }, line: { color: intColor, width: 2 } });
  s.addText("INTEGRIDADE SST", { x: 0.5, y: 1.7, w: 4.1, h: 0.3, fontSize: 11, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(String(input.integrityScore), { x: 0.5, y: 2.1, w: 4.1, h: 1.6, fontSize: 96, color: intColor, bold: true, align: "center", fontFace: "Calibri" });
  s.addText("/ 100", { x: 0.5, y: 3.7, w: 4.1, h: 0.4, fontSize: 16, color: TEXT_MUTED, align: "center", fontFace: "Calibri" });
  s.addText(input.integrityLabel, { x: 0.5, y: 4.3, w: 4.1, h: 0.4, fontSize: 13, color: TEXT_LIGHT, bold: true, align: "center", fontFace: "Calibri" });

  // KPIs alertas
  s.addShape(pres.ShapeType.rect, { x: 5.0, y: 1.5, w: 4, h: 1.65, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("ALERTAS ATIVOS", { x: 5.2, y: 1.7, w: 3.6, h: 0.3, fontSize: 9, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(String(input.totalAlertsActive), { x: 5.2, y: 2.1, w: 3.6, h: 0.9, fontSize: 48, color: PRIMARY, bold: true, valign: "middle", fontFace: "Calibri" });

  s.addShape(pres.ShapeType.rect, { x: 9.1, y: 1.5, w: 4.2, h: 1.65, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("CRÍTICOS", { x: 9.3, y: 1.7, w: 3.8, h: 0.3, fontSize: 9, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  s.addText(String(input.criticalAlerts), { x: 9.3, y: 2.1, w: 3.8, h: 0.9, fontSize: 48, color: VERMELHO, bold: true, valign: "middle", fontFace: "Calibri" });

  // Custo Previsível
  s.addShape(pres.ShapeType.rect, { x: 5.0, y: 3.25, w: 8.3, h: 1.75, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("CUSTO PREVISÍVEL — FAIXAS", { x: 5.2, y: 3.35, w: 8, h: 0.3, fontSize: 10, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  input.bands.slice(0, 3).forEach((b, i) => {
    const y = 3.7 + i * 0.4;
    const c = b.faixa === "BAIXA" ? VERDE : b.faixa === "MODERADA" ? AMARELO : VERMELHO;
    s.addText(b.label.slice(0, 30), { x: 5.2, y, w: 3.5, h: 0.35, fontSize: 10, color: TEXT_LIGHT, fontFace: "Calibri" });
    s.addText(b.faixa, { x: 8.7, y, w: 1.2, h: 0.35, fontSize: 11, color: c, bold: true, fontFace: "Calibri" });
    s.addText(`R$ ${b.rangeLow.toLocaleString("pt-BR")} - ${b.rangeHigh.toLocaleString("pt-BR")}`, { x: 9.9, y, w: 3.4, h: 0.35, fontSize: 10, color: TEXT_LIGHT, fontFace: "Calibri" });
  });

  // Alertas por código
  s.addShape(pres.ShapeType.rect, { x: 0.3, y: 5.3, w: 13.0, h: 1.9, fill: { color: BG_CARD }, line: { type: "none" } });
  s.addText("ALERTAS POR TIPO", { x: 0.5, y: 5.4, w: 12, h: 0.3, fontSize: 10, color: TEXT_MUTED, bold: true, fontFace: "Calibri" });
  Object.entries(input.alertsByCode).slice(0, 5).forEach(([code, info], i) => {
    const y = 5.8 + i * 0.27;
    const sevC = info.severity === "critical" ? VERMELHO : info.severity === "warn" ? AMARELO : "60A5FA";
    s.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 0.15, h: 0.22, fill: { color: sevC }, line: { type: "none" } });
    s.addText(code, { x: 0.8, y, w: 4, h: 0.25, fontSize: 9, color: TEXT_LIGHT, bold: true, fontFace: "Calibri" });
    s.addText(`${info.count} ocorrência(s)`, { x: 5, y, w: 3, h: 0.25, fontSize: 9, color: TEXT_MUTED, fontFace: "Calibri" });
    if (info.faixa) s.addText(`Custo ${info.faixa}`, { x: 8, y, w: 4, h: 0.25, fontSize: 9, color: info.faixa === "ELEVADA" ? VERMELHO : info.faixa === "MODERADA" ? AMARELO : VERDE, bold: true, fontFace: "Calibri" });
  });

  // Disclaimer
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.3, w: 13.33, h: 0.2, fill: { color: ACCENT }, line: { type: "none" } });
  s.addText(input.disclaimer, { x: 0.3, y: 7.3, w: 13, h: 0.2, fontSize: 9, color: "FFFFFF", bold: true, valign: "middle", fontFace: "Calibri" });

  const out = await pres.write({ outputType: "nodebuffer" });
  return out as Buffer;
}
