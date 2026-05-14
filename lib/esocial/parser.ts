/**
 * eSocial parser — v2 (XML estruturado).
 *
 * Suporta:
 *  - XML único de evento
 *  - Múltiplos XMLs concatenados (split por <?xml)
 *  - CSV/TXT fallback heurístico (compatibilidade com v1)
 *
 * Eventos reconhecidos:
 *  - S-2210 (CAT)
 *  - S-2220 (ASO / Monitoramento Saúde)
 *  - S-2230 (Afastamento Temporário)
 *  - S-2240 (Condições ambientais — exposições)
 *  - S-2299 (Desligamento)
 *  - S-2300 (Trabalhador sem vínculo)
 *
 * Para cada evento extraímos campos-chave + worker_key_hash anônimo.
 * Cruzamentos geram alertas estruturados (não mais por regex).
 *
 * Nota: schemas oficiais eSocial são vastos. Esta v2 cobre os campos
 * essenciais. Pode ser refinada incrementalmente.
 */

import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { insertAlert, type AlertKind, type AlertSeverity } from "./db";

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

interface EventBase {
  type: string;
  cpf?: string;
  matricula?: string;
  date?: string;
  employerId?: string;
  raw: Record<string, unknown>;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

// LINACH (Lista Nacional de Agentes Cancerígenos) — subset principal
const LINACH_AGENTS = [
  "amianto", "asbestos", "benzeno", "cádmio", "cadmio", "níquel", "niquel",
  "cromo vi", "cromo hexavalente", "arsênio", "arsenio", "berílio", "berilio",
  "formaldeído", "formaldeido", "sílica", "silica cristalina", "tricloroetileno",
  "tetracloroetileno", "benzopireno", "policlorinados",
];

const PSICOSSOCIAL_CIDS = [
  "F32", "F33", "F40", "F41", "F43", "F45", "F48", "Z73",
];

function workerKeyHash(employerId: string, cpf?: string, matricula?: string): string {
  const raw = `${employerId}|${cpf ?? ""}|${matricula ?? ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Tenta extrair o tipo do evento eSocial a partir do objeto parseado. */
function detectEventType(obj: Record<string, unknown>): string | null {
  // Procura recursivamente por chaves começando com "evt"
  const search = (o: unknown): string | null => {
    if (!o || typeof o !== "object") return null;
    const rec = o as Record<string, unknown>;
    for (const k of Object.keys(rec)) {
      if (/^evt(CAT|MonitSaude|AfastTemp|ExpRisco|DesligTSV|Deslig|TSVInicio)/i.test(k)) {
        // Mapeia para código S-XXXX
        if (/evtCAT/i.test(k)) return "S2210";
        if (/evtMonitSaude/i.test(k)) return "S2220";
        if (/evtAfastTemp/i.test(k)) return "S2230";
        if (/evtExpRisco/i.test(k)) return "S2240";
        if (/evtDeslig\b/i.test(k)) return "S2299";
        if (/evtTSV|DesligTSV/i.test(k)) return "S2300";
      }
      // Recursão
      const found = search(rec[k]);
      if (found) return found;
    }
    return null;
  };
  return search(obj);
}

/** Extrai CPF, matrícula e data de qualquer estrutura aninhada. */
function extractWorkerFields(obj: unknown): { cpf?: string; matricula?: string; date?: string; employerId?: string } {
  const out: { cpf?: string; matricula?: string; date?: string; employerId?: string } = {};
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    const rec = v as Record<string, unknown>;
    for (const [k, val] of Object.entries(rec)) {
      if (typeof val === "string") {
        if (/^(cpfTrab|cpf)$/i.test(k) && /^\d{11}$/.test(val.replace(/\D/g, ""))) out.cpf ??= val.replace(/\D/g, "");
        else if (/matricula/i.test(k)) out.matricula ??= val;
        else if (/^(nrInsc|nrInscEmp)$/i.test(k)) out.employerId ??= val;
        else if (/^(dtAcid|dtIniAfast|dtAso|dtIniCondicao|dtDeslig|dtCAT)$/i.test(k)) out.date ??= val;
      } else {
        walk(val);
      }
    }
  };
  walk(obj);
  return out;
}

/** Extrai CIDs (saúde mental) de qualquer estrutura. */
function extractCIDs(obj: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    const rec = v as Record<string, unknown>;
    for (const [k, val] of Object.entries(rec)) {
      if (typeof val === "string" && /codCID|cid/i.test(k)) {
        const m = val.match(/[A-Z]\d{2}/);
        if (m) out.push(m[0]);
      } else {
        walk(val);
      }
    }
  };
  walk(obj);
  return out;
}

/** Extrai agentes nocivos (S-2240) */
function extractAgents(obj: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    const rec = v as Record<string, unknown>;
    for (const [k, val] of Object.entries(rec)) {
      if (typeof val === "string" && /(dscAgNoc|codAgNoc|descAgente)/i.test(k)) {
        out.push(val);
      } else {
        walk(val);
      }
    }
  };
  walk(obj);
  return out;
}

/** Divide um conteúdo possivelmente concatenado em XMLs individuais. */
function splitXmls(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed.startsWith("<")) return []; // não é XML
  // Quebra por <?xml mas mantém o delimitador no início
  const parts = trimmed.split(/(?=<\?xml)/i).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [trimmed];
}

/** Parser de XML único → array de EventBase (alguns XMLs têm múltiplos eventos). */
function parseOneXml(xml: string): EventBase[] {
  try {
    const obj = xmlParser.parse(xml) as Record<string, unknown>;
    const type = detectEventType(obj);
    if (!type) return [];
    const fields = extractWorkerFields(obj);
    return [{ type, ...fields, raw: obj }];
  } catch {
    return [];
  }
}

/** Heurística textual de fallback (CSV/TXT). Igual à v1. */
function parseTextHeuristic(text: string): EventBase[] {
  const types = ["S2210", "S2220", "S2230", "S2240", "S2299", "S2300"];
  const events: EventBase[] = [];
  for (const t of types) {
    const re = new RegExp(`S-?${t.slice(1)}`, "gi");
    const matches = text.match(re);
    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        events.push({ type: t, raw: { source: "heuristic" } });
      }
    }
  }
  return events;
}

export async function processESocial(input: ProcessInput): Promise<ParsedSummary> {
  const text = input.content;

  // Tenta XML primeiro
  let events: EventBase[] = [];
  const xmls = splitXmls(text);
  if (xmls.length > 0) {
    for (const x of xmls) {
      events = events.concat(parseOneXml(x));
    }
  }

  // Fallback textual se nada veio do XML
  if (events.length === 0) {
    events = parseTextHeuristic(text);
  }

  // Conta por tipo
  const byType: Record<string, number> = {};
  for (const e of events) {
    byType[e.type] = (byType[e.type] ?? 0) + 1;
  }

  // Workers únicos
  const workerHashes = new Set<string>();
  for (const e of events) {
    if (e.cpf || e.matricula) {
      workerHashes.add(workerKeyHash(e.employerId ?? "unknown", e.cpf, e.matricula));
    }
  }

  let alertsCreated = 0;

  // ============ ALERTAS POR CRUZAMENTO ============

  // 1. Exposição (S-2240) por worker sem ASO (S-2220) correspondente
  const expByWorker: Record<string, EventBase[]> = {};
  const asoByWorker: Record<string, EventBase[]> = {};
  for (const e of events) {
    if (!e.cpf && !e.matricula) continue;
    const key = workerKeyHash(e.employerId ?? "x", e.cpf, e.matricula);
    if (e.type === "S2240") (expByWorker[key] ??= []).push(e);
    if (e.type === "S2220") (asoByWorker[key] ??= []).push(e);
  }
  const gapWorkers = Object.keys(expByWorker).filter((k) => !asoByWorker[k]);
  if (gapWorkers.length > 0) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "exposure_without_aso" as AlertKind,
      severity: "warn" as AlertSeverity,
      title: `${gapWorkers.length} trabalhador(es) com exposição declarada mas sem ASO`,
      description: `Cruzamento S-2240 × S-2220 identificou ${gapWorkers.length} trabalhador(es) com exposição a riscos sem ASO (PCMSO) correspondente. Configuração típica de passivo trabalhista.`,
      evidence: { workers: gapWorkers.length, totalExp: Object.keys(expByWorker).length },
      custoFaixa: gapWorkers.length > 10 ? "HIGH" : "MODERATE",
    });
    alertsCreated++;
  }

  // 2. CAT (S-2210) sem afastamento (S-2230) por worker
  const catByWorker: Record<string, EventBase[]> = {};
  const afastByWorker: Record<string, EventBase[]> = {};
  for (const e of events) {
    if (!e.cpf && !e.matricula) continue;
    const key = workerKeyHash(e.employerId ?? "x", e.cpf, e.matricula);
    if (e.type === "S2210") (catByWorker[key] ??= []).push(e);
    if (e.type === "S2230") (afastByWorker[key] ??= []).push(e);
  }
  const catGap = Object.keys(catByWorker).filter((k) => !afastByWorker[k]);
  if (catGap.length > 0) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "cat_without_leave",
      severity: "warn",
      title: `${catGap.length} CAT(s) sem afastamento registrado`,
      description: `Trabalhadores com CAT emitida (S-2210) mas sem afastamento (S-2230). Pode indicar omissão de nexo causal ou subnotificação de afastamentos por acidente/doença ocupacional.`,
      evidence: { catWithoutAfast: catGap.length },
      custoFaixa: "MODERATE",
    });
    alertsCreated++;
  }

  // 3. LINACH — cancerígenos
  const allAgents = events.flatMap((e) => extractAgents(e.raw));
  const linachMatch = new Set<string>();
  for (const agent of allAgents) {
    const low = agent.toLowerCase();
    for (const lin of LINACH_AGENTS) {
      if (low.includes(lin)) linachMatch.add(lin);
    }
  }
  // Fallback textual (caso XML não tenha vindo)
  if (linachMatch.size === 0) {
    const low = text.toLowerCase();
    for (const lin of LINACH_AGENTS) {
      if (low.includes(lin)) linachMatch.add(lin);
    }
  }
  if (linachMatch.size > 0) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "linach_carcinogen",
      severity: "critical",
      title: `Agente(s) LINACH detectado(s): ${Array.from(linachMatch).slice(0, 3).join(", ")}`,
      description: `Foram identificados ${linachMatch.size} agente(s) da Lista Nacional de Agentes Cancerígenos (LINACH). Trabalhadores expostos podem ter direito a aposentadoria especial e exigem monitoramento intensivo. Verifique se há programa de prevenção específico documentado.`,
      evidence: { agents: Array.from(linachMatch) },
      custoFaixa: "HIGH",
    });
    alertsCreated++;
  }

  // 4. Ruído sem método declarado (S-2240)
  const noiseEvents = events.filter((e) => {
    const r = JSON.stringify(e.raw).toLowerCase();
    return /ru[íi]do|db\(a\)/.test(r);
  });
  if (noiseEvents.length > 0) {
    const hasMethod = noiseEvents.some((e) => {
      const r = JSON.stringify(e.raw).toLowerCase();
      return /m[ée]todo|nho|nr-?15/.test(r);
    });
    if (!hasMethod) {
      await insertAlert({
        uploadId: input.uploadId,
        companyId: input.companyId,
        kind: "noise_method_gap",
        severity: "warn",
        title: "Ruído declarado sem método de medição (NHO-01)",
        description: `${noiseEvents.length} evento(s) com exposição a ruído mas sem referência ao método de medição (NHO-01 / NR-15). Documentação insuficiente para auditoria.`,
        evidence: { noiseEvents: noiseEvents.length },
        custoFaixa: "MODERATE",
      });
      alertsCreated++;
    }
  }

  // 5. Saúde mental
  const allCids = events.flatMap((e) => extractCIDs(e.raw));
  const psicoCids = allCids.filter((c) => PSICOSSOCIAL_CIDS.some((p) => c.startsWith(p)));
  // Fallback textual
  let textCids: string[] = [];
  if (psicoCids.length === 0) {
    const low = text.toUpperCase();
    for (const p of PSICOSSOCIAL_CIDS) {
      const re = new RegExp(`\\b${p}[0-9]?\\b`, "g");
      const m = low.match(re);
      if (m) textCids.push(...m);
    }
  }
  const combined = psicoCids.length > 0 ? psicoCids : textCids;
  if (combined.length >= 2) {
    await insertAlert({
      uploadId: input.uploadId,
      companyId: input.companyId,
      kind: "mental_health_pattern",
      severity: "critical",
      title: `Padrão de saúde mental — ${combined.length} CID(s) F/Z detectado(s)`,
      description: `Foram identificados ${combined.length} registros de CIDs psicossociais (${[...new Set(combined)].slice(0, 5).join(", ")}). Recomenda-se avaliação aprofundada NR-1 e plano de ação direcionado a fatores psicossociais.`,
      evidence: { cids: [...new Set(combined)] },
      custoFaixa: "HIGH",
    });
    alertsCreated++;
  }

  return {
    eventsTotal: events.length,
    byType,
    alertsCreated,
    workersDetected: workerHashes.size,
  };
}
