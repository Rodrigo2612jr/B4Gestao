/**
 * eSocial parser — v3 (camada temporal + alertas oficiais).
 *
 * Agora popula 4 tabelas temporais (exposure_timeline, medical_events,
 * leave_intervals, cat_events) e gera alertas no schema OFICIAL do briefing v3:
 *
 *   { alert_id, type (MISSING_MONITORING etc), severity, worker_key_hash,
 *     period_start/end, related_events.S2240_ids[] etc, explain, recommended_action }
 *
 * Tipos de alerta oficiais:
 *   MISSING_MONITORING                  — exposição sem ASO compatível
 *   POTENTIAL_OVERTESTING               — ASO sem exposição
 *   CAT_MISSING_FOR_WORK_RELATED_LEAVE  — afastamento work-related sem CAT
 *   CARCINOGEN_LINACH_EXPOSURE          — agente da LINACH detectado
 *   AE_QUALIFIED_EXPOSURE               — aposentadoria especial qualitativa
 *   AE_LIMIT_EXCEEDED                   — limite excedido (quando há medidas)
 *   NOISE_PREVID_METHODOLOGY_GAP        — ruído sem método previdenciário (NHO-01/q=3)
 *   MENTAL_HEALTH_PATTERN               — padrão CIDs F/Z + burnout cruzado com CAT
 */

import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { insertAlert, type AlertKind, type AlertSeverity } from "./db";
import {
  insertExposure,
  insertMedicalEvent,
  insertLeave,
  insertCat,
} from "./temporal";
import { lookupLinach } from "./linach";

export interface ParsedSummary {
  eventsTotal: number;
  byType: Record<string, number>;
  alertsCreated: number;
  workersDetected: number;
}

export interface ProcessInput {
  uploadId: string;
  companyId: string;
  content: string;
  filename: string;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

// Helpers
function workerKeyHash(employerId: string, cpf?: string, matricula?: string): string {
  return crypto.createHash("sha256")
    .update(`${employerId}|${cpf ?? ""}|${matricula ?? ""}`)
    .digest("hex");
}

function findInTree(obj: unknown, predicate: (key: string, value: unknown) => boolean): unknown {
  if (!obj || typeof obj !== "object") return null;
  const rec = obj as Record<string, unknown>;
  for (const [k, v] of Object.entries(rec)) {
    if (predicate(k, v)) return v;
    if (typeof v === "object") {
      const found = findInTree(v, predicate);
      if (found !== null && found !== undefined) return found;
    }
  }
  return null;
}

function findAllInTree(obj: unknown, predicate: (key: string, value: unknown) => boolean): unknown[] {
  const out: unknown[] = [];
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    const rec = v as Record<string, unknown>;
    for (const [k, val] of Object.entries(rec)) {
      if (predicate(k, val)) out.push(val);
      if (typeof val === "object") walk(val);
    }
  };
  walk(obj);
  return out;
}

function strField(obj: unknown, keyRe: RegExp): string | undefined {
  const v = findInTree(obj, (k, v) => keyRe.test(k) && typeof v === "string");
  return typeof v === "string" ? v : undefined;
}

function detectEventType(obj: unknown): string | null {
  const found = findInTree(obj, (k) => /^evt(CAT|MonitSaude|AfastTemp|ExpRisco|DesligTSV|Deslig|TSVInicio)/i.test(k));
  if (!found) return null;
  const search = (o: unknown): string | null => {
    if (!o || typeof o !== "object") return null;
    for (const k of Object.keys(o as Record<string, unknown>)) {
      if (/evtCAT/i.test(k)) return "S2210";
      if (/evtMonitSaude/i.test(k)) return "S2220";
      if (/evtAfastTemp/i.test(k)) return "S2230";
      if (/evtExpRisco/i.test(k)) return "S2240";
      if (/evtDeslig\b/i.test(k)) return "S2299";
      if (/evtTSV|DesligTSV/i.test(k)) return "S2300";
      const rec = (o as Record<string, unknown>)[k];
      const inner = search(rec);
      if (inner) return inner;
    }
    return null;
  };
  return search(obj);
}

function splitXmls(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed.startsWith("<")) return [];
  const parts = trimmed.split(/(?=<\?xml)/i).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [trimmed];
}

interface ParsedEvent {
  type: string;
  obj: Record<string, unknown>;
  workerKeyHash: string;
  cpf?: string;
  matricula?: string;
  date?: string;
  employerId: string;
  sourceEventId?: string;
  receipt?: string;
  layoutVersion?: string;
}

function parseOne(xml: string): ParsedEvent[] {
  try {
    const obj = xmlParser.parse(xml) as Record<string, unknown>;
    const type = detectEventType(obj);
    if (!type) return [];

    const cpf = strField(obj, /^(cpfTrab|cpf)$/i)?.replace(/\D/g, "");
    const matricula = strField(obj, /matricula/i);
    const employerId = strField(obj, /^(nrInsc|nrInscEmp)$/i) ?? "unknown";
    const dateField = strField(obj, /^(dtAcid|dtIniAfast|dtAso|dtIniCondicao|dtDeslig|dtCAT)$/i);
    const sourceEventId = strField(obj, /^(Id|id)$/);
    const receipt = strField(obj, /(nrRecibo|recibo)/i);
    const layoutVersion = strField(obj, /(versao|layout)/i);
    const wkh = workerKeyHash(employerId, cpf, matricula);

    return [{
      type, obj, workerKeyHash: wkh, cpf, matricula,
      date: dateField, employerId, sourceEventId, receipt, layoutVersion,
    }];
  } catch {
    return [];
  }
}

// Heurística textual (fallback CSV/TXT)
function parseTextHeuristic(text: string): ParsedEvent[] {
  const types = ["S2210", "S2220", "S2230", "S2240", "S2299", "S2300"];
  const events: ParsedEvent[] = [];
  for (const t of types) {
    const re = new RegExp(`S-?${t.slice(1)}`, "gi");
    const matches = text.match(re);
    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        events.push({
          type: t,
          obj: { source: "heuristic" },
          workerKeyHash: workerKeyHash("unknown", "heuristic", String(i)),
          employerId: "unknown",
        });
      }
    }
  }
  return events;
}

// CIDs psicossociais (briefing v3 — saúde mental)
const PSICOSSOCIAL_CIDS = ["F32", "F33", "F40", "F41", "F43", "F45", "F48", "Z73"];
const BURNOUT_KEYWORDS = ["burnout", "esgotamento profissional"];

// Ruído — método previdenciário válido (briefing menciona NHO-01/NEN/q=3)
function detectsValidNoiseMethod(obj: unknown): boolean {
  const dump = JSON.stringify(obj).toLowerCase();
  if (/q\s*=\s*5/.test(dump)) return false; // q=5 explicitamente errado
  if (/q\s*=\s*3/.test(dump)) return true;
  if (/nho-?01|nho 01|nen\b/.test(dump)) return true;
  return false;
}

function hasNoiseExposure(obj: unknown): boolean {
  return /ru[íi]do|db\(a\)/i.test(JSON.stringify(obj));
}

// ============================================================
// Helper de inserção de alerta no SCHEMA OFICIAL
// ============================================================
async function emitAlert(input: {
  uploadId: string;
  companyId: string;
  type: string; // MISSING_MONITORING etc
  severity: "high" | "medium" | "low";
  workerKeyHash?: string | null;
  title: string;
  description: string;
  recommendedAction: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  relatedEvents?: { S2240_ids?: string[]; S2220_ids?: string[]; S2230_ids?: string[]; S2210_ids?: string[] };
  custoFaixa?: "BAIXA" | "MODERADA" | "ELEVADA" | null;
}) {
  // Mapeia severity oficial pro nosso enum legado (info/warn/critical)
  const sevLegacy: AlertSeverity = input.severity === "high" ? "critical" : input.severity === "medium" ? "warn" : "info";
  const kindLegacy: AlertKind = (
    input.type === "MISSING_MONITORING" ? "exposure_without_aso" :
    input.type === "POTENTIAL_OVERTESTING" ? "aso_without_exposure" :
    input.type === "CAT_MISSING_FOR_WORK_RELATED_LEAVE" ? "cat_without_leave" :
    input.type === "CARCINOGEN_LINACH_EXPOSURE" ? "linach_carcinogen" :
    input.type === "NOISE_PREVID_METHODOLOGY_GAP" ? "noise_method_gap" :
    input.type === "MENTAL_HEALTH_PATTERN" ? "mental_health_pattern" :
    "other"
  );

  // Compatibilidade — chama o insertAlert legado e depois atualiza colunas v3
  await insertAlert({
    uploadId: input.uploadId,
    companyId: input.companyId,
    kind: kindLegacy,
    severity: sevLegacy,
    workerKeyHash: input.workerKeyHash ?? null,
    title: input.title,
    description: input.description,
    evidence: input.relatedEvents ?? null,
    custoFaixa: input.custoFaixa ?? null,
  });

  // Atualiza o último alerta inserido com campos v3 (alert_code, period_*, related_events, recommended_action)
  const { sql } = await import("../db");
  if (sql) {
    await sql`
      UPDATE esocial_alerts
      SET alert_code = ${input.type},
          period_start = ${input.periodStart ?? null}::date,
          period_end = ${input.periodEnd ?? null}::date,
          related_events = ${input.relatedEvents ? JSON.stringify(input.relatedEvents) : null}::jsonb,
          recommended_action = ${input.recommendedAction}
      WHERE id = (
        SELECT id FROM esocial_alerts WHERE upload_id = ${input.uploadId}
        ORDER BY created_at DESC LIMIT 1
      )
    `;
  }
}

// ============================================================
// PROCESS — orquestração principal
// ============================================================
export async function processESocial(input: ProcessInput): Promise<ParsedSummary> {
  const text = input.content;

  // 1. Parse de XMLs (fallback textual)
  let events: ParsedEvent[] = [];
  const xmls = splitXmls(text);
  if (xmls.length > 0) {
    for (const x of xmls) events = events.concat(parseOne(x));
  }
  if (events.length === 0) events = parseTextHeuristic(text);

  const byType: Record<string, number> = {};
  for (const e of events) byType[e.type] = (byType[e.type] ?? 0) + 1;

  // 2. Persistir em tabelas temporais
  const workerSet = new Set<string>();

  for (const e of events) {
    workerSet.add(e.workerKeyHash);
    try {
      if (e.type === "S2240" && e.date) {
        // Pode ter múltiplos agentes — extrai cada codAgNoc separadamente
        const agentos = findAllInTree(e.obj, (k) => /codAgNoc/i.test(k));
        const agentes = agentos.length > 0 ? agentos : [null];
        const descAgentes = findAllInTree(e.obj, (k) => /(dscAgNoc|descAgente)/i.test(k));
        for (let i = 0; i < agentes.length; i++) {
          const codAg = typeof agentes[i] === "string" ? (agentes[i] as string) : null;
          const descAg = typeof descAgentes[i] === "string" ? (descAgentes[i] as string) : null;
          await insertExposure({
            uploadId: input.uploadId,
            companyId: input.companyId,
            workerKeyHash: e.workerKeyHash,
            codAgNoc: codAg,
            descrAgente: descAg,
            startDate: e.date,
            sourceEventId: e.sourceEventId,
            receipt: e.receipt,
            layoutVersion: e.layoutVersion,
            raw: e.obj,
          });
        }
      } else if (e.type === "S2220" && e.date) {
        await insertMedicalEvent({
          uploadId: input.uploadId,
          companyId: input.companyId,
          workerKeyHash: e.workerKeyHash,
          asoDate: e.date,
          tpExameOcup: strField(e.obj, /tpExameOcup/i),
          sourceEventId: e.sourceEventId,
          receipt: e.receipt,
          layoutVersion: e.layoutVersion,
          raw: e.obj,
        });
      } else if (e.type === "S2230" && e.date) {
        const cid = strField(e.obj, /codCID|cid/i);
        const motivoStr = strField(e.obj, /(codMotAfast|motAfast)/i);
        const isWorkRelated = /^(03|01|14|15|17|26|27)$/.test(motivoStr ?? ""); // códigos típicos de acidente/doença trabalho
        await insertLeave({
          uploadId: input.uploadId,
          companyId: input.companyId,
          workerKeyHash: e.workerKeyHash,
          leaveStart: e.date,
          reasonCode: motivoStr,
          cid: cid?.match(/[A-Z]\d{2}/)?.[0],
          isWorkRelated,
          sourceEventId: e.sourceEventId,
          receipt: e.receipt,
          layoutVersion: e.layoutVersion,
          raw: e.obj,
        });
      } else if (e.type === "S2210" && e.date) {
        await insertCat({
          uploadId: input.uploadId,
          companyId: input.companyId,
          workerKeyHash: e.workerKeyHash,
          accidentDate: e.date,
          catType: strField(e.obj, /tpCat/i),
          cid: strField(e.obj, /codCID|cid/i)?.match(/[A-Z]\d{2}/)?.[0],
          sourceEventId: e.sourceEventId,
          receipt: e.receipt,
          layoutVersion: e.layoutVersion,
          raw: e.obj,
        });
      }
    } catch (err) {
      console.error("[parser v3] erro ao persistir evento:", err);
    }
  }

  // 3. Cruzamentos temporais (importa aqui pra evitar ciclo)
  const { crossExposureVsAso, crossLeaveVsCat } = await import("./temporal");
  const xExpAso = await crossExposureVsAso(input.uploadId);
  const xLeaveCat = await crossLeaveVsCat(input.uploadId);

  let alertsCreated = 0;

  // 3.1 MISSING_MONITORING
  if (xExpAso.missingMonitoring.length > 0) {
    await emitAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      type: "MISSING_MONITORING",
      severity: xExpAso.missingMonitoring.length >= 5 ? "high" : "medium",
      title: `${xExpAso.missingMonitoring.length} exposição(ões) sem ASO compatível na vigência`,
      description:
        `Foram identificadas ${xExpAso.missingMonitoring.length} situações em que há exposição declarada (S-2240) mas não há ASO/Monitoramento (S-2220) realizado dentro da vigência da exposição. Configuração típica de passivo trabalhista/previdenciário.`,
      recommendedAction:
        "Programar ASO ocupacional para os trabalhadores listados conforme PCMSO integrado ao PGR. Validar in loco.",
      relatedEvents: {
        S2240_ids: xExpAso.missingMonitoring.flatMap((m) => m.exposureIds),
      },
      custoFaixa: xExpAso.missingMonitoring.length >= 10 ? "ELEVADA" : "MODERADA",
    });
    alertsCreated++;
  }

  // 3.2 POTENTIAL_OVERTESTING
  if (xExpAso.potentialOvertesting.length > 0) {
    await emitAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      type: "POTENTIAL_OVERTESTING",
      severity: "low",
      title: `${xExpAso.potentialOvertesting.length} ASO(s) sem exposição vigente`,
      description:
        `ASOs realizados em datas em que o trabalhador não tinha exposição declarada (S-2240) vigente. Possível overtesting — verificar critério de monitoramento.`,
      recommendedAction:
        "Revisar PCMSO para alinhar protocolos de exame com o inventário de riscos do PGR.",
      relatedEvents: {
        S2220_ids: xExpAso.potentialOvertesting.map((p) => p.asoId),
      },
      custoFaixa: "BAIXA",
    });
    alertsCreated++;
  }

  // 3.3 CAT_MISSING_FOR_WORK_RELATED_LEAVE
  if (xLeaveCat.catMissing.length > 0) {
    await emitAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      type: "CAT_MISSING_FOR_WORK_RELATED_LEAVE",
      severity: "high",
      title: `${xLeaveCat.catMissing.length} afastamento(s) trabalho-relacionados sem CAT na janela`,
      description:
        `Afastamentos S-2230 com motivo trabalho-relacionado mas sem CAT (S-2210) emitida na janela de ±7 dias do início do afastamento. Risco de subnotificação e nexo causal.`,
      recommendedAction:
        "Emitir CAT retroativa para os casos identificados quando aplicável. Auditar fluxo interno de comunicação de acidentes.",
      relatedEvents: { S2230_ids: xLeaveCat.catMissing.map((c) => c.leaveId) },
      custoFaixa: "ELEVADA",
    });
    alertsCreated++;
  }

  // 4. Alertas baseados em conteúdo (não dependem de cruzamento temporal)

  // 4.1 LINACH
  const allAgents = findAllInTree(events.map((e) => e.obj), () => false); // não vamos pegar todos
  const linachHits = new Set<string>();
  const linachGroups = new Set<string>();
  const linachIds: string[] = [];
  for (const e of events) {
    if (e.type !== "S2240") continue;
    const codAgs = findAllInTree(e.obj, (k) => /codAgNoc/i.test(k)).filter((v) => typeof v === "string") as string[];
    for (const cod of codAgs) {
      const linach = lookupLinach(cod);
      if (linach) {
        linachHits.add(linach.name);
        linachGroups.add(linach.group);
        if (e.sourceEventId) linachIds.push(e.sourceEventId);
      }
    }
    // Fallback por nome
    const descs = findAllInTree(e.obj, (k) => /(dscAgNoc|descAgente)/i.test(k)).filter((v) => typeof v === "string") as string[];
    for (const desc of descs) {
      const linach = lookupLinach(desc);
      if (linach) {
        linachHits.add(linach.name);
        linachGroups.add(linach.group);
      }
    }
  }
  // Fallback textual
  if (linachHits.size === 0) {
    const low = text.toLowerCase();
    const seenAgents = new Set<string>();
    const knownNames = ["amianto", "asbestos", "benzeno", "cádmio", "cadmio", "níquel", "niquel", "cromo vi", "arsênio", "arsenio", "berílio", "berilio", "sílica", "silica"];
    for (const n of knownNames) {
      if (low.includes(n)) seenAgents.add(n);
    }
    if (seenAgents.size > 0) {
      const ranked = Array.from(seenAgents).map((n) => lookupLinach(n)).filter(Boolean);
      ranked.forEach((l) => { if (l) { linachHits.add(l.name); linachGroups.add(l.group); } });
    }
  }
  if (linachHits.size > 0) {
    await emitAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      type: "CARCINOGEN_LINACH_EXPOSURE",
      severity: "high",
      title: `Agente(s) LINACH detectado(s) — grupo(s) ${Array.from(linachGroups).sort().join(", ")}`,
      description:
        `Foram identificados ${linachHits.size} agente(s) da Lista Nacional de Agentes Cancerígenos (LINACH): ${Array.from(linachHits).slice(0, 5).join(", ")}. Trabalhadores expostos podem ter direito a aposentadoria especial e exigem monitoramento intensivo.`,
      recommendedAction:
        "Avaliar enquadramento de aposentadoria especial e programa de prevenção específico (NR-9 / NR-15). Validar in loco a real exposição.",
      relatedEvents: { S2240_ids: linachIds },
      custoFaixa: linachGroups.has("1") ? "ELEVADA" : "MODERADA",
    });
    alertsCreated++;
  }

  // 4.2 NOISE_PREVID_METHODOLOGY_GAP
  const noiseEvents = events.filter((e) => e.type === "S2240" && hasNoiseExposure(e.obj));
  if (noiseEvents.length > 0) {
    const valid = noiseEvents.some((e) => detectsValidNoiseMethod(e.obj));
    if (!valid) {
      await emitAlert({
        uploadId: input.uploadId,
        companyId: input.companyId,
        type: "NOISE_PREVID_METHODOLOGY_GAP",
        severity: "medium",
        title: "Ruído declarado sem método previdenciário (NHO-01/NEN/q=3)",
        description: `${noiseEvents.length} evento(s) com exposição a ruído sem referência ao método de medição válido para fins previdenciários. Indicador q=5 (Anexo NR-15) não é aceito para aposentadoria especial — usar NHO-01/NEN/q=3.`,
        recommendedAction: "Refazer laudo de ruído conforme NHO-01 (FUNDACENTRO) com q=3. Garantir registro do método no S-2240.",
        relatedEvents: { S2240_ids: noiseEvents.map((e) => e.sourceEventId).filter(Boolean) as string[] },
        custoFaixa: "MODERADA",
      });
      alertsCreated++;
    }
  }

  // 4.3 MENTAL_HEALTH_PATTERN — CIDs F + burnout cruzados com CAT
  const allCids: string[] = [];
  for (const e of events) {
    const cidStrings = findAllInTree(e.obj, (k) => /codCID|cid/i.test(k)).filter((v) => typeof v === "string") as string[];
    for (const c of cidStrings) {
      const m = c.match(/[A-Z]\d{2}/);
      if (m) allCids.push(m[0]);
    }
  }
  const psicoCids = allCids.filter((c) => PSICOSSOCIAL_CIDS.some((p) => c.startsWith(p)));
  // Fallback textual
  let textCids: string[] = [];
  if (psicoCids.length === 0) {
    const up = text.toUpperCase();
    for (const p of PSICOSSOCIAL_CIDS) {
      const m = up.match(new RegExp(`\\b${p}[0-9]?\\b`, "g"));
      if (m) textCids.push(...m);
    }
  }
  const hasBurnout = BURNOUT_KEYWORDS.some((k) => text.toLowerCase().includes(k));
  const cids = psicoCids.length > 0 ? psicoCids : textCids;
  if (cids.length >= 2 || (hasBurnout && cids.length >= 1)) {
    // Cruzamento com CAT
    const catIdsRelated = events.filter((e) => e.type === "S2210").map((e) => e.sourceEventId).filter(Boolean) as string[];
    await emitAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      type: "MENTAL_HEALTH_PATTERN",
      severity: "high",
      title: `Padrão de saúde mental — ${cids.length} CID(s) F/Z${hasBurnout ? " + burnout" : ""} detectado(s)`,
      description: `Identificados ${cids.length} registros de CIDs psicossociais (${[...new Set(cids)].slice(0, 5).join(", ")})${hasBurnout ? " + ocorrência de burnout" : ""}. Recomenda-se avaliação aprofundada NR-1 e plano de ação direcionado a fatores psicossociais.`,
      recommendedAction: "Aplicar diagnóstico NR-1 (módulo Pulse), revisar PGR para riscos psicossociais e estabelecer ações estruturais nas áreas críticas.",
      relatedEvents: { S2210_ids: catIdsRelated },
      custoFaixa: "ELEVADA",
    });
    alertsCreated++;
  }

  return {
    eventsTotal: events.length,
    byType,
    alertsCreated,
    workersDetected: workerSet.size,
  };
}
