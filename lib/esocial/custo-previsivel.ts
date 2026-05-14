/**
 * Painel de Custo Previsível em FAIXAS (Briefing v3 §6.4).
 *
 * Converte inconsistências eSocial em exposição financeira ESTIMADA em FAIXAS:
 *   - Previdenciário (FAE / Aposentadoria Especial):
 *       salário_base × n_expostos × fator × meses_ativos
 *   - Trabalhista (NR-15 Anexo 1 — ruído, ampliável):
 *       framework parametrizável
 *   - Operacional (absenteísmo):
 *       custo médio dia × dias de afastamento (S-2230)
 *
 * Resultado sempre em FAIXA (BAIXA/MODERADA/ELEVADA) com premissas visíveis.
 * Disclaimer obrigatório.
 */

import { sql, initDb } from "../db";

export interface CostConfig {
  defaultSalary: number; // R$ — usado quando não há base de folha
  faeAliquot: number;   // % adicional (ex: 0.03 para 3%)
  faeFactor: number;    // multiplicador 6/9/12 (NR-13/15)
  monthsLookback: number; // meses pra projeção (default 12)
  noiseExposureCostPerWorker: number; // R$/mês adicional NR-15
  absenteismCostPerDay: number; // R$ custo médio por dia perdido
}

export const DEFAULT_COST_CONFIG: CostConfig = {
  defaultSalary: 3500,
  faeAliquot: 0.03,
  faeFactor: 9, // 9% pra agente nocivo de baixa categoria
  monthsLookback: 12,
  noiseExposureCostPerWorker: 200,
  absenteismCostPerDay: 350,
};

export type Faixa = "BAIXA" | "MODERADA" | "ELEVADA";

export interface CostBand {
  category: "previdenciario" | "trabalhista" | "operacional";
  label: string;
  faixa: Faixa;
  rangeLow: number;
  rangeHigh: number;
  assumptions: string[];
  driverCount: number; // quantos eventos/trabalhadores motivaram
}

export interface CostPanelResult {
  companyId: string;
  bands: CostBand[];
  integrityScore: number; // 0-100
  integrityLabel: string;
  totalAlertsActive: number;
  criticalAlerts: number;
  disclaimer: string;
}

export const COST_DISCLAIMER =
  "Estimativas em FAIXAS — não substituem laudo técnico/contábil. Os valores baseiam-se em premissas parametrizáveis (salário, fator, meses) e dependem de validação in loco e enquadramento previdenciário.";

// ============================================================
// Cálculo principal
// ============================================================

export async function calculateCostPanel(
  companyId: string,
  config: CostConfig = DEFAULT_COST_CONFIG
): Promise<CostPanelResult> {
  if (!sql) {
    return {
      companyId,
      bands: [],
      integrityScore: 0,
      integrityLabel: "DB não configurado",
      totalAlertsActive: 0,
      criticalAlerts: 0,
      disclaimer: COST_DISCLAIMER,
    };
  }
  await initDb();

  // 1. Previdenciário (FAE / Aposentadoria Especial)
  // Quantidade de workers ÚNICOS com exposição declarada (S-2240) vigente nos últimos N meses
  const lookbackDate = new Date();
  lookbackDate.setMonth(lookbackDate.getMonth() - config.monthsLookback);
  const lookbackStr = lookbackDate.toISOString().slice(0, 10);

  const expWorkersRows = (await sql`
    SELECT COUNT(DISTINCT worker_key_hash)::int AS n
    FROM esocial_exposure_timeline
    WHERE company_id = ${companyId}
      AND (end_date IS NULL OR end_date >= ${lookbackStr}::date)
  `) as { n: number }[];
  const nExp = expWorkersRows[0]?.n ?? 0;

  const previdLow = Math.round(
    nExp * config.defaultSalary * config.faeAliquot * config.monthsLookback * 0.6
  );
  const previdHigh = Math.round(
    nExp * config.defaultSalary * config.faeAliquot * config.monthsLookback * 1.4
  );
  const previdFaixa: Faixa = previdHigh > 500000 ? "ELEVADA" : previdHigh > 100000 ? "MODERADA" : "BAIXA";

  // 2. Trabalhista — começa com ruído (NR-15 Anexo 1)
  const noiseAlertsRows = (await sql`
    SELECT COUNT(DISTINCT worker_key_hash)::int AS n
    FROM esocial_exposure_timeline
    WHERE company_id = ${companyId}
      AND (
        LOWER(COALESCE(descr_agente, '')) LIKE '%ru%do%'
        OR LOWER(COALESCE(descr_agente, '')) LIKE '%ruido%'
        OR cod_ag_noc IN ('010101', '010102', '010103')
      )
  `) as { n: number }[];
  const nNoise = noiseAlertsRows[0]?.n ?? 0;

  const trabLow = Math.round(nNoise * config.noiseExposureCostPerWorker * 12 * 0.5);
  const trabHigh = Math.round(nNoise * config.noiseExposureCostPerWorker * 12 * 1.5);
  const trabFaixa: Faixa = trabHigh > 100000 ? "ELEVADA" : trabHigh > 20000 ? "MODERADA" : "BAIXA";

  // 3. Operacional (absenteísmo via S-2230)
  const leaveDaysRows = (await sql`
    SELECT COALESCE(SUM(
      CASE
        WHEN leave_end IS NOT NULL THEN (leave_end - leave_start)
        ELSE LEAST(EXTRACT(EPOCH FROM (NOW() - leave_start::timestamp))/86400, 90)::int
      END
    ), 0)::int AS days
    FROM esocial_leave_intervals
    WHERE company_id = ${companyId}
      AND leave_start >= ${lookbackStr}::date
  `) as { days: number }[];
  const totalLeaveDays = leaveDaysRows[0]?.days ?? 0;

  const operLow = Math.round(totalLeaveDays * config.absenteismCostPerDay * 0.7);
  const operHigh = Math.round(totalLeaveDays * config.absenteismCostPerDay * 1.3);
  const operFaixa: Faixa = operHigh > 200000 ? "ELEVADA" : operHigh > 50000 ? "MODERADA" : "BAIXA";

  // 4. Card de integridade de dados SST (0-100)
  const alertsRows = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE resolved = FALSE)::int AS active,
      COUNT(*) FILTER (WHERE resolved = FALSE AND severity = 'critical')::int AS critical
    FROM esocial_alerts
    WHERE company_id = ${companyId}
  `) as { active: number; critical: number }[];
  const activeAlerts = alertsRows[0]?.active ?? 0;
  const criticalAlerts = alertsRows[0]?.critical ?? 0;

  // Integridade: 100 = perfeito (0 alertas). Penaliza fortemente críticos.
  const integrityScore = Math.max(
    0,
    Math.min(100, 100 - (activeAlerts * 3) - (criticalAlerts * 8))
  );
  const integrityLabel =
    integrityScore >= 80 ? "Boa integridade" :
    integrityScore >= 50 ? "Integridade moderada — atenção" :
    "Baixa integridade — ação urgente";

  return {
    companyId,
    bands: [
      {
        category: "previdenciario",
        label: "Previdenciário (FAE / Aposentadoria Especial)",
        faixa: previdFaixa,
        rangeLow: previdLow,
        rangeHigh: previdHigh,
        assumptions: [
          `${nExp} trabalhador(es) com exposição vigente`,
          `Salário base estimado: R$ ${config.defaultSalary.toLocaleString("pt-BR")}`,
          `Alíquota FAE: ${(config.faeAliquot * 100).toFixed(1)}%`,
          `Janela de ${config.monthsLookback} meses`,
        ],
        driverCount: nExp,
      },
      {
        category: "trabalhista",
        label: "Trabalhista (NR-15 — adicional de insalubridade ruído)",
        faixa: trabFaixa,
        rangeLow: trabLow,
        rangeHigh: trabHigh,
        assumptions: [
          `${nNoise} trabalhador(es) com exposição a ruído`,
          `Custo adicional ruído: R$ ${config.noiseExposureCostPerWorker}/mês por trabalhador`,
          `Projeção 12 meses`,
        ],
        driverCount: nNoise,
      },
      {
        category: "operacional",
        label: "Operacional (absenteísmo — afastamentos S-2230)",
        faixa: operFaixa,
        rangeLow: operLow,
        rangeHigh: operHigh,
        assumptions: [
          `${totalLeaveDays} dia(s) de afastamento nos últimos ${config.monthsLookback} meses`,
          `Custo médio por dia perdido: R$ ${config.absenteismCostPerDay}`,
        ],
        driverCount: totalLeaveDays,
      },
    ],
    integrityScore,
    integrityLabel,
    totalAlertsActive: activeAlerts,
    criticalAlerts,
    disclaimer: COST_DISCLAIMER,
  };
}
