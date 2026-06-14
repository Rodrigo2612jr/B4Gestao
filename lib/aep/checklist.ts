/**
 * Checklist FO-SST.013 — "Diretrizes ergonômicas para a otimização das cargas
 * de trabalho sobre o sistema musculoesquelético" (NR-17 e ABNT ISO 20646:2017).
 *
 * Extraído do formulário oficial da B4. Cada item é respondido SIM / NÃO / N/A.
 * Alguns itens têm subopções (faixas de tempo) ou campos (frequência/peso).
 *
 * IDs são ESTÁVEIS — não renomear, pois as respostas são gravadas por id no
 * JSONB `aep_assessments.checklist`.
 */

export interface ChecklistOption {
  id: string;
  label: string;
}

export interface ChecklistField {
  id: string;
  label: string;
  placeholder?: string;
}

export interface ChecklistQuestion {
  id: string;
  label: string;
  /** Subopções de seleção (aparecem ao marcar SIM). multi=true → várias. */
  options?: ChecklistOption[];
  multi?: boolean;
  /** Campos de texto livre (ex.: frequência / peso). */
  fields?: ChecklistField[];
}

export interface ChecklistCategory {
  id: string;
  label: string;
  questions: ChecklistQuestion[];
}

export const AEP_CHECKLIST: ChecklistCategory[] = [
  {
    id: "biomecanicos",
    label: "Biomecânicos",
    questions: [
      { id: "bio_forca", label: "Exigência de uso frequente de força, pressão, preensão, flexão, extensão ou torção dos segmentos corporais?" },
      { id: "bio_posturas_incomodas", label: "Exigência de posturas incômodas ou pouco confortáveis por longos períodos (acima de 2 horas)?" },
      { id: "bio_sentado", label: "Postura sentada por longos períodos (acima de 2 horas contínuas)?" },
      { id: "bio_em_pe", label: "Postura de pé por longos períodos (acima de 2 horas contínuas)?" },
      { id: "bio_deslocamento", label: "Constante deslocamento a pé durante a jornada de trabalho (acima de 2 horas contínuas)?" },
      { id: "bio_esforco_intenso", label: "Trabalho com esforço físico intenso?" },
      {
        id: "bio_levantamento",
        label: "Levantamento e transporte manual de cargas ou volumes?",
        fields: [
          { id: "frequencia", label: "Frequência", placeholder: "ex.: 10x/h" },
          { id: "peso", label: "Peso (kg)", placeholder: "ex.: 15" },
        ],
      },
      { id: "bio_puxar_empurrar", label: "Frequente ação de puxar/empurrar cargas ou volumes (acima de 1000kg e 700kg para declive)?" },
      {
        id: "bio_repetitivos",
        label: "Frequente execução de movimentos repetitivos (acima de 40 ações técnicas por minuto)?",
        options: [
          { id: "lt1h", label: "Menor que 1h/dia ou 5h/semana" },
          { id: "1a2h", label: "De 1h a 2h por dia" },
          { id: "gt2h", label: "Maior que 2 horas" },
        ],
      },
      {
        id: "bio_ferramentas_pesadas",
        label: "Manuseio de ferramentas e/ou objetos pesados por períodos prolongados?",
        multi: true,
        options: [
          { id: "pinca", label: ">1kg em pinça acima de 2h por dia" },
          { id: "palmar", label: ">3kg em preensão palmar acima de 2h por dia" },
        ],
      },
      { id: "bio_flexoes_coluna", label: "Exigência de flexões de coluna vertebral frequentes?" },
      { id: "bio_pedais", label: "Uso frequente de pedais?" },
      { id: "bio_elevacao_mmss", label: "Exigência de elevação frequente de membros superiores?" },
      { id: "bio_elevacao_mmss_1h", label: "Exigência de elevação frequente de membros superiores (mais de 1h/dia)?" },
      { id: "bio_alavancas", label: "Uso frequente de alavancas?" },
      { id: "bio_pega_pobre", label: "Manuseio ou movimentação de cargas sem pega ou com “pega pobre”?" },
      { id: "bio_vibracao_corpo", label: "Exposição a vibração de corpo inteiro (por tempo prolongado)?" },
      { id: "bio_vibracao_local", label: "Exposição a vibração localizada (por tempo prolongado)?" },
    ],
  },
  {
    id: "mobiliarios",
    label: "Mobiliários e Equipamentos",
    questions: [
      { id: "mob_alcance", label: "Trabalho com necessidade de alcançar objetos, documentos, controles ou qualquer ponto além das zonas de alcance ideais para as características antropométricas do trabalhador? (Alcance ótimo: 35–45cm; máximo: 55–65cm)" },
      { id: "mob_falta_equip", label: "Falta de outros equipamentos (suporte de notebook, teclado, mouse, mousepad, apoio de pé)?" },
      { id: "mob_nao_planejado", label: "Posto de trabalho não planejado/adaptado para a posição sentada?" },
      { id: "mob_sem_regulagem", label: "Equipamentos e/ou máquinas sem meios de regulagem de ajuste ou sem condições de uso?" },
      { id: "mob_antropometria", label: "Equipamentos ou mobiliários não adaptados à antropometria do trabalhador?" },
      { id: "mob_sem_espaco", label: "Mobiliário ou equipamento sem espaço para movimentação dos segmentos corporais?" },
      { id: "mob_mobiliario_sem_regulagem", label: "Mobiliários sem meios de regulagem de ajuste?" },
      { id: "mob_improvisado", label: "Posto de trabalho improvisado?" },
      { id: "mob_compressao", label: "Compressão de partes do corpo por superfícies rígidas ou com quinas?" },
      { id: "mob_escadas", label: "Uso frequente de escadas?" },
      { id: "mob_assento", label: "Assento inadequado?" },
      { id: "mob_encosto", label: "Encosto do assento inadequado ou ausente?" },
    ],
  },
  {
    id: "psicossociais",
    label: "Psicossociais / Cognitivos",
    questions: [
      { id: "psi_multitarefa", label: "Exigência de realização de múltiplas tarefas, com alta demanda cognitiva?" },
      { id: "psi_ritmo_intenso", label: "Necessidade de manter ritmos intensos de trabalho?" },
      { id: "psi_variacao_turnos", label: "Trabalho com necessidade de variação de turnos?" },
      {
        id: "psi_monotonia",
        label: "Monotonia?",
        options: [
          { id: "2_3", label: "Mesmas ações técnicas 2/3 do tempo de ciclo (51–80%)" },
          { id: "gt80", label: "Mesmas ações técnicas quase o tempo todo do ciclo (>80%)" },
        ],
      },
      { id: "psi_estresse", label: "Excesso de situações de estresse?" },
      { id: "psi_sobrecarga_mental", label: "Situações de sobrecarga de trabalho mental?" },
      { id: "psi_concentracao", label: "Exigência de alto nível de concentração, atenção e memória?" },
      { id: "psi_dificil_comunicacao", label: "Trabalho em condições de difícil comunicação?" },
      { id: "psi_conflitos", label: "Excesso de conflitos hierárquicos no trabalho?" },
      { id: "psi_insatisfacao", label: "Insatisfação no trabalho?" },
      { id: "psi_demandas_divergentes", label: "Trabalho com demandas divergentes (ordens divergentes, metas incompatíveis, qualidade x quantidade, etc.)?" },
      { id: "psi_autonomia", label: "Falta de autonomia no trabalho?" },
      { id: "psi_demandas_emocionais", label: "Excesso de demandas emocionais/afetivas no trabalho?" },
      { id: "psi_assedio", label: "Assédio de qualquer natureza no trabalho?" },
    ],
  },
  {
    id: "ambientais",
    label: "Ambientais",
    questions: [
      { id: "amb_ilum_diurna", label: "Condições de trabalho com iluminação diurna inadequada?" },
      { id: "amb_ilum_noturna", label: "Condições de trabalho com iluminação noturna inadequada?" },
      { id: "amb_piso", label: "Piso escorregadio e/ou irregular?" },
      { id: "amb_reflexos", label: "Presença de reflexos em telas, painéis, vidros, monitores ou qualquer superfície que cause desconforto ou prejudique a visualização?" },
      { id: "amb_ruido", label: "Condições de trabalho com níveis de pressão sonora fora dos parâmetros de conforto?" },
      { id: "amb_temperatura", label: "Condições de trabalho com índice de temperatura efetiva fora dos parâmetros de conforto? (18 a 25 °C para ambientes climatizados)" },
    ],
  },
  {
    id: "organizacionais",
    label: "Organizacionais",
    questions: [
      { id: "org_sem_pausas", label: "Trabalho realizado sem pausas pré-definidas para descanso?" },
      { id: "org_noturno", label: "Trabalho noturno?" },
      { id: "org_desequilibrio", label: "Desequilíbrio entre tempo de trabalho e tempo de repouso?" },
      { id: "org_producao", label: "Trabalho remunerado por produção?" },
      { id: "org_ritmo_equipamento", label: "Ritmo do trabalho imposto por um equipamento?" },
      { id: "org_metas", label: "Trabalho com utilização rigorosa de metas de produção?" },
      { id: "org_capacitacao", label: "Insuficiência de capacitação para execução da tarefa?" },
    ],
  },
];

export type ChecklistResposta = "SIM" | "NAO" | "NA";

export interface ChecklistAnswer {
  resp?: ChecklistResposta | null;
  /** seleção única (option.id) */
  opt?: string | null;
  /** seleção múltipla (option.id[]) */
  opts?: string[];
  /** campos livres (fieldId -> valor) */
  fields?: Record<string, string>;
}

export type ChecklistAnswers = Record<string, ChecklistAnswer>;

/** Total de perguntas do checklist. */
export function totalChecklistQuestions(): number {
  return AEP_CHECKLIST.reduce((acc, c) => acc + c.questions.length, 0);
}

/** Quantas perguntas têm resposta (SIM/NÃO/NA) preenchida. */
export function countChecklistAnswered(answers: ChecklistAnswers | null | undefined): number {
  if (!answers) return 0;
  let n = 0;
  for (const cat of AEP_CHECKLIST) {
    for (const q of cat.questions) {
      const a = answers[q.id];
      if (a && a.resp) n += 1;
    }
  }
  return n;
}

/** Checklist completo = todas as perguntas respondidas. */
export function isChecklistComplete(answers: ChecklistAnswers | null | undefined): boolean {
  return countChecklistAnswered(answers) >= totalChecklistQuestions();
}
