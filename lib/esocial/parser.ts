/**
 * eSocial parser — v1 (heurístico).
 *
 * Versão inicial: detecta eventos por padrões em texto/XML. Para a versão
 * completa, integrar parser XML robusto (ex: fast-xml-parser) e validar
 * schemas dos eventos S-2210, S-2220, S-2230, S-2240, S-2299, S-2300, etc.
 *
 * Esta versão extrai um sumário e gera alertas baseados em padrões textuais.
 * É um esqueleto pronto para receber o parser oficial.
 */

import crypto from "node:crypto";
import { insertAlert, type AlertKind, type AlertSeverity } from "./db";

export interface ParsedSummary {
  eventsTotal: number;
  byType: Record<string, number>;
  alertsCreated: number;
}

export interface ProcessInput {
  uploadId: string;
  companyId: string;
  /** Conteúdo textual concatenado dos arquivos (XML, CSV, ZIP extraído). */
  content: string;
  filename: string;
  employerId?: string;
}

const EVENT_PATTERNS = {
  S2210: /S-?2210/gi, // CAT
  S2220: /S-?2220/gi, // ASO/Monitoramento Saúde
  S2230: /S-?2230/gi, // Afastamento
  S2240: /S-?2240/gi, // Condições ambientais
  S2299: /S-?2299/gi, // Desligamento
  S2300: /S-?2300/gi, // Trabalhador sem vínculo
};

const PSICOSSOCIAL_KEYWORDS = ["F32", "F33", "F41", "F43", "Z73", "burnout", "ansiedade", "depressão"];
const NOISE_KEYWORDS = ["ruído", "ruido", "dB(A)", "decibel"];
const CARCINOGEN_KEYWORDS = ["LINACH", "amianto", "benzeno", "cádmio", "níquel", "cromo VI"];

function workerKeyHash(employerId: string, cpf?: string, matricula?: string): string {
  const raw = `${employerId}|${cpf ?? ""}|${matricula ?? ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Processa um upload de eSocial (versão v1 heurística).
 * Gera alertas baseados em padrões e contagem de eventos.
 */
export async function processESocial(input: ProcessInput): Promise<ParsedSummary> {
  const text = input.content;
  const byType: Record<string, number> = {};
  let total = 0;
  for (const [k, re] of Object.entries(EVENT_PATTERNS)) {
    const m = text.match(re);
    const c = m ? m.length : 0;
    byType[k] = c;
    total += c;
  }

  let alertsCreated = 0;

  // Regra heurística: tem S-2240 mas pouco/nenhum S-2220 → gap ASO
  if ((byType.S2240 ?? 0) > 0 && (byType.S2220 ?? 0) < byType.S2240 / 2) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "exposure_without_aso" satisfies AlertKind,
      severity: "warn" as AlertSeverity,
      title: "Exposição declarada sem ASO correspondente suficiente",
      description: `Foram identificados ${byType.S2240} eventos S-2240 (exposição) mas apenas ${byType.S2220 ?? 0} eventos S-2220 (ASO). Cruzamento sugere gap de PCMSO.`,
      evidence: { S2240: byType.S2240, S2220: byType.S2220 ?? 0 },
      custoFaixa: "MODERATE",
    });
    alertsCreated++;
  }

  // Regra heurística: S-2210 (CAT) sem S-2230 (afastamento) próximo
  if ((byType.S2210 ?? 0) > 0 && (byType.S2230 ?? 0) < byType.S2210 / 2) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "cat_without_leave",
      severity: "warn",
      title: "CAT sem afastamento registrado",
      description: `Foram identificadas ${byType.S2210} CATs (S-2210) mas apenas ${byType.S2230 ?? 0} afastamentos (S-2230). Verificar nexo causal.`,
      evidence: { S2210: byType.S2210, S2230: byType.S2230 ?? 0 },
      custoFaixa: "MODERATE",
    });
    alertsCreated++;
  }

  // Pattern: cancerígenos LINACH
  for (const kw of CARCINOGEN_KEYWORDS) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      await insertAlert({
        uploadId: input.uploadId,
        companyId: input.companyId,
        kind: "linach_carcinogen",
        severity: "critical",
        title: `Agente cancerígeno detectado: ${kw}`,
        description: `O termo "${kw}" foi identificado nos dados. Substâncias da LINACH exigem monitoramento especial e podem gerar direito a aposentadoria especial.`,
        evidence: { keyword: kw },
        custoFaixa: "HIGH",
      });
      alertsCreated++;
      break; // 1 alerta agregado por upload
    }
  }

  // Pattern: ruído sem método declarado
  const hasNoise = NOISE_KEYWORDS.some((k) => text.toLowerCase().includes(k.toLowerCase()));
  const hasMethod = /método|metodo|NHO|NR-?15/i.test(text);
  if (hasNoise && !hasMethod) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "noise_method_gap",
      severity: "warn",
      title: "Ruído declarado sem método de medição",
      description: "Foi identificada exposição a ruído mas não há referência ao método de medição (NHO-01, NR-15). Documentação insuficiente.",
      evidence: { hasNoise: true, hasMethod: false },
      custoFaixa: "MODERATE",
    });
    alertsCreated++;
  }

  // Pattern: saúde mental
  const psicoMatches = PSICOSSOCIAL_KEYWORDS.filter((k) => text.toLowerCase().includes(k.toLowerCase()));
  if (psicoMatches.length >= 2) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "mental_health_pattern",
      severity: "critical",
      title: "Padrão de saúde mental detectado",
      description: `Foram identificados múltiplos indicadores psicossociais (${psicoMatches.join(", ")}). Recomenda-se avaliação aprofundada e ação NR-1.`,
      evidence: { keywords: psicoMatches },
      custoFaixa: "HIGH",
    });
    alertsCreated++;
  }

  // Worker key hash demo (não persistido aqui — apenas exemplo se houver CPFs)
  if (input.employerId) {
    workerKeyHash(input.employerId);
  }

  return { eventsTotal: total, byType, alertsCreated };
}
