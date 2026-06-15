/**
 * Catálogo de releases do painel B4.
 *
 * Cada vez que você fizer uma atualização visível pro usuário, adiciona uma
 * entrada NO TOPO desta lista. O ReleaseModal mostra automaticamente todas
 * as releases que o usuário ainda não viu (lookup por localStorage).
 *
 * Convenção:
 *   - id: string única (ex: "2026-05-14-v3-visual")
 *   - date: ISO YYYY-MM-DD
 *   - title: 1 linha curta
 *   - tone: "feature" | "improvement" | "fix" | "release"
 *   - highlights: 3-5 bullets curtos do que mudou (foco no usuário, não código)
 *   - details opcional: tópicos detalhados
 */

export type ReleaseTone = "feature" | "improvement" | "fix" | "release";

export interface ReleaseEntry {
  id: string;
  date: string;
  title: string;
  tone: ReleaseTone;
  intro?: string;
  highlights: string[];
  details?: Array<{ heading: string; items: string[] }>;
}

export const RELEASES: ReleaseEntry[] = [
  {
    id: "2026-05-14-visual-pro",
    date: "2026-05-14",
    title: "Painel repaginado · visual profissional com profundidade",
    tone: "release",
    intro:
      "Reformulamos a interface do painel inteira para destacar cada parte da operação, sem poluição. Cada módulo agora tem identidade visual própria e a hierarquia de informações ficou clara.",
    highlights: [
      "Sidebar dark navy com logo destacada · separa visualmente da área de trabalho",
      "Dashboard com hero em gradient, KPIs grandes e seções coloridas por contexto",
      "PageHeader padronizado com faixa de cor única por módulo",
      "Alert bar automático quando há eventos críticos do eSocial",
      "Empty states com ilustrações SVG e ações sugeridas",
    ],
    details: [
      {
        heading: "Cores de identidade por módulo",
        items: [
          "Empresas → navy (espinha dorsal do CRM)",
          "Leads → emerald (entrada)",
          "Pulse NR-1 → violet (clima psicossocial)",
          "Stress Test → amber (auditoria)",
          "eSocial Analytics → rose (passivos)",
        ],
      },
      {
        heading: "Componentes novos",
        items: [
          "ReleaseModal · esta janela que você está vendo agora",
          "EmptyState com 6 ilustrações SVG inline",
          "PageHeader com breadcrumbs + accent bar + slot de metadata",
          "Avatar com cor determinística por nome",
        ],
      },
    ],
  },
  {
    id: "2026-05-14-briefing-v3",
    date: "2026-05-14",
    title: "Briefing v3 · 7 blocos entregues",
    tone: "feature",
    intro:
      "Implementação completa do briefing oficial v3 do cliente. Tudo o que estava na especificação agora roda em produção.",
    highlights: [
      "Stress Test: 25 perguntas oficiais com scoring alinhado (engavetamento Q01/12-16/21/25, 5 rótulos de coerência)",
      "eSocial: camada temporal com 5 tabelas (exposure_timeline, medical_events, leave_intervals, cat_events)",
      "Cruzamentos S-2240×S-2220 e S-2210×S-2230 agora respeitam vigência por data",
      "Painel Custo Previsível em FAIXAS (Previdenciário/Trabalhista/Operacional)",
      "Pulse: índice global 1-5 ponderado + drivers (top 5 perguntas críticas)",
    ],
    details: [
      {
        heading: "Mais entregas dessa rodada",
        items: [
          "Perfis ADMIN/SST/RH/JURIDICO com ACL na sidebar",
          "2º PPTX 'dashboard estilo sistema' além do executivo",
          "Narrativa de relatório gerada localmente (sem dependência de API externa)",
          "Card de integridade SST 0-100 no painel de Custo Previsível",
        ],
      },
    ],
  },
  {
    id: "2026-05-13-companies-unified",
    date: "2026-05-13",
    title: "CNPJ como chave única em todos os pontos de entrada",
    tone: "feature",
    intro:
      "Independente de onde a empresa entra no sistema (formulário do site, wizard de Stress, criação de Pulse, upload do eSocial), o CNPJ resolve sempre para o mesmo registro.",
    highlights: [
      "Formulário do site: CNPJ obrigatório com máscara + validação dos dígitos verificadores",
      "Em qualquer módulo do admin, você pode buscar empresa existente OU cadastrar por CNPJ",
      "Detecção automática de duplicatas por nome (fuzzy match com pg_trgm)",
      "Tela consolidada da empresa: leads + auditorias + pesquisas + alertas eSocial",
      "Mesclagem de duplicatas com re-confirmação de senha",
    ],
  },
  {
    id: "2026-05-13-three-modules",
    date: "2026-05-13",
    title: "3 módulos SaaS NR-1 disponíveis",
    tone: "release",
    intro:
      "Os três produtos pedidos pelo cliente saíram do papel e estão funcionais.",
    highlights: [
      "Stress Test público: cliente preenche pelo link único stress.b4gestao.com.br/[token]",
      "Pulse anônimo: funcionários respondem em pulse.b4gestao.com.br/[token] com threshold de anonimato",
      "eSocial Analytics: upload XML/CSV/ZIP até 10MB com parser estruturado",
      "Geração de relatórios PPTX em dois formatos (Executivo + Dashboard)",
      "Editor visual de perguntas do Pulse com 7 dimensões NR-1",
    ],
  },
];

/** Versão mais recente · para comparação com localStorage. */
export const CURRENT_RELEASE_ID = RELEASES[0]?.id ?? "";

const STORAGE_KEY = "b4_admin_lastSeenRelease";

export function getLastSeenReleaseId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function markReleaseAsSeen(id: string = CURRENT_RELEASE_ID) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Releases que o usuário ainda não viu. */
export function getUnseenReleases(): ReleaseEntry[] {
  const lastSeen = getLastSeenReleaseId();
  if (!lastSeen) return RELEASES; // primeira vez · mostra todas
  const idx = RELEASES.findIndex((r) => r.id === lastSeen);
  if (idx === -1) return RELEASES; // id desconhecido (release apagado?) · mostra todas
  return RELEASES.slice(0, idx); // tudo mais novo que o último visto
}
