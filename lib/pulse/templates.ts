/**
 * Pulse NR-1 — biblioteca de perguntas-padrão.
 *
 * Cada pergunta usa escala Likert 1-5 (1=Discordo totalmente, 5=Concordo totalmente).
 * Dimensões mapeadas conforme literatura NR-1 psicossocial.
 */

export type Dimension =
  | "demandas"
  | "controle"
  | "apoio"
  | "relacionamentos"
  | "papel"
  | "mudanca"
  | "saude";

export interface PulseQuestion {
  id: string;
  text: string;
  dimension: Dimension;
  /** true = pontuação invertida (5 = pior) */
  reverse?: boolean;
}

export const DIMENSION_LABELS: Record<Dimension, string> = {
  demandas: "Demandas de trabalho",
  controle: "Controle/autonomia",
  apoio: "Apoio da liderança e pares",
  relacionamentos: "Relacionamentos no trabalho",
  papel: "Clareza de papel",
  mudanca: "Gestão de mudanças",
  saude: "Saúde e bem-estar",
};

export const DEFAULT_TEMPLATE: PulseQuestion[] = [
  { id: "P1", text: "Tenho prazos realistas para concluir meu trabalho", dimension: "demandas" },
  { id: "P2", text: "Frequentemente sinto que tenho mais trabalho do que consigo realizar", dimension: "demandas", reverse: true },
  { id: "P3", text: "Posso decidir como executar minhas tarefas", dimension: "controle" },
  { id: "P4", text: "Tenho voz em decisões que afetam meu trabalho", dimension: "controle" },
  { id: "P5", text: "Minha liderança me apoia quando preciso", dimension: "apoio" },
  { id: "P6", text: "Recebo feedback útil sobre meu desempenho", dimension: "apoio" },
  { id: "P7", text: "Sou tratado com respeito pelos colegas", dimension: "relacionamentos" },
  { id: "P8", text: "Já testemunhei ou sofri assédio neste trabalho", dimension: "relacionamentos", reverse: true },
  { id: "P9", text: "Sei exatamente o que se espera do meu papel", dimension: "papel" },
  { id: "P10", text: "Os objetivos da minha área são claros para mim", dimension: "papel" },
  { id: "P11", text: "As mudanças na empresa são bem comunicadas", dimension: "mudanca" },
  { id: "P12", text: "Sinto que minha saúde mental é levada a sério aqui", dimension: "saude" },
  { id: "P13", text: "Consigo desligar do trabalho fora do expediente", dimension: "saude" },
  { id: "P14", text: "Confio que problemas reportados serão tratados", dimension: "apoio" },
  { id: "P15", text: "Recomendaria esta empresa como bom lugar para trabalhar", dimension: "saude" },
];
