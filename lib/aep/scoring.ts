/**
 * Cálculo do nível de risco do inventário do AEP e máquina de estados.
 *
 * NÍVEL DO RISCO (N): derivado de Probabilidade (P) e Severidade (S), ambos 1-5.
 * Fórmula provisória N = arredonda((P+S)/2) para cima · reproduz exatamente os
 * exemplos do documento oficial da B4 (ex.: P3/S3→3, P3/S1→2, P2/S2→2, P5/S1→3).
 *
 * TODO(B4): substituir pela matriz de risco oficial da B4 quando recebida
 * (decisão pendente · Rodrigo vai fornecer a tabela normativa).
 */

export function calcRiskLevel(p: number | null | undefined, s: number | null | undefined): number | null {
  if (p == null || s == null) return null;
  if (!Number.isFinite(p) || !Number.isFinite(s)) return null;
  const pc = Math.min(5, Math.max(1, Math.round(p)));
  const sc = Math.min(5, Math.max(1, Math.round(s)));
  return Math.min(5, Math.max(1, Math.ceil((pc + sc) / 2)));
}

export function riskLabel(n: number | null | undefined): string {
  switch (n) {
    case 1: return "Trivial";
    case 2: return "Tolerável";
    case 3: return "Moderado";
    case 4: return "Substancial";
    case 5: return "Intolerável";
    default: return "-";
  }
}

/** Cor (token Tailwind) por nível, para badges. */
export function riskColor(n: number | null | undefined): string {
  switch (n) {
    case 1: return "emerald";
    case 2: return "lime";
    case 3: return "amber";
    case 4: return "orange";
    case 5: return "red";
    default: return "gray";
  }
}

// ============================================================
// MÁQUINA DE ESTADOS DA AVALIAÇÃO
// ============================================================

export type AepStatus =
  | "rascunho"
  | "em_preenchimento"
  | "aguardando_aprovacao"
  | "reprovado"
  | "aprovado"
  | "cancelado";

export const AEP_STATUS_LABEL: Record<AepStatus, string> = {
  rascunho: "Rascunho",
  em_preenchimento: "Em preenchimento",
  aguardando_aprovacao: "Aguardando aprovação",
  reprovado: "Reprovado",
  aprovado: "Aprovado",
  cancelado: "Cancelado",
};

export const AEP_STATUS_COLOR: Record<AepStatus, string> = {
  rascunho: "gray",
  em_preenchimento: "blue",
  aguardando_aprovacao: "amber",
  reprovado: "red",
  aprovado: "emerald",
  cancelado: "gray",
};

/** Transições permitidas e quem dispara. */
export const AEP_TRANSITIONS: Record<AepStatus, AepStatus[]> = {
  rascunho: ["em_preenchimento", "cancelado"],
  em_preenchimento: ["aguardando_aprovacao", "cancelado"],
  aguardando_aprovacao: ["aprovado", "reprovado"],
  reprovado: ["aguardando_aprovacao", "em_preenchimento", "cancelado"],
  aprovado: [],
  cancelado: [],
};

export function canTransition(from: AepStatus, to: AepStatus): boolean {
  return (AEP_TRANSITIONS[from] ?? []).includes(to);
}

/** Conteúdo é editável pelo técnico nestes estados (trava após enviar). */
export function isEditable(status: AepStatus): boolean {
  return status === "rascunho" || status === "em_preenchimento" || status === "reprovado";
}

/**
 * Conteúdo editável pelo SUPERVISOR — mais amplo que o do técnico: inclui
 * "aguardando_aprovacao" (o supervisor corrige o trabalho do técnico antes de decidir).
 * Só os estados terminais (aprovado/cancelado) ficam travados.
 */
export function isEditableForSupervisor(status: AepStatus): boolean {
  return status !== "aprovado" && status !== "cancelado";
}
