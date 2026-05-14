/**
 * Mapeamento LINACH — Lista Nacional de Agentes Cancerígenos para Humanos.
 *
 * Cada agente tem:
 *  - codAgNoc: código da Tabela 24 do eSocial (quando aplicável)
 *  - name: nome canônico
 *  - aliases: variações de escrita / sinônimos
 *  - group: 1 (carcinogênico para humanos), 2A (provavelmente), 2B (possivelmente)
 *
 * Fonte: Portaria Interministerial MS/MTE 9/2014 (LINACH original) +
 * atualizações IARC. Versão inicial focada nos mais prevalentes no Brasil.
 *
 * NOTA: lista representativa, não exaustiva. Pode ser estendida via CSV
 * conforme briefing v3 menciona.
 */

export type LinachGroup = "1" | "2A" | "2B";

export interface LinachAgent {
  codAgNoc?: string;
  name: string;
  aliases: string[];
  group: LinachGroup;
}

export const LINACH_TABLE: LinachAgent[] = [
  // GRUPO 1 — Carcinogênicos para humanos (alta prioridade)
  { codAgNoc: "010407", name: "Amianto / Asbestos", aliases: ["amianto", "asbestos", "asbesto", "amosita", "crocidolita"], group: "1" },
  { codAgNoc: "010401", name: "Arsênio e compostos inorgânicos", aliases: ["arsenio", "arsênio", "arsenic"], group: "1" },
  { codAgNoc: "010210", name: "Benzeno", aliases: ["benzeno", "benzene"], group: "1" },
  { codAgNoc: "010403", name: "Berílio e compostos", aliases: ["berílio", "berilio", "beryllium"], group: "1" },
  { codAgNoc: "010408", name: "Cádmio e compostos", aliases: ["cádmio", "cadmio", "cadmium"], group: "1" },
  { codAgNoc: "010412", name: "Cromo VI / hexavalente", aliases: ["cromo vi", "cromo hexavalente", "chromium vi", "chromium hexavalent"], group: "1" },
  { codAgNoc: "010422", name: "Níquel — compostos", aliases: ["níquel", "niquel", "nickel"], group: "1" },
  { codAgNoc: "010225", name: "Cloreto de vinila", aliases: ["cloreto de vinila", "vinyl chloride", "vcm"], group: "1" },
  { codAgNoc: "010230", name: "Formaldeído", aliases: ["formaldeído", "formaldeido", "formol", "formalin"], group: "1" },
  { codAgNoc: "010111", name: "Sílica cristalina (quartzo)", aliases: ["sílica cristalina", "silica cristalina", "quartzo", "crystalline silica"], group: "1" },
  { codAgNoc: "010220", name: "Óxido de etileno", aliases: ["óxido de etileno", "oxido de etileno", "ethylene oxide"], group: "1" },
  { codAgNoc: "010235", name: "1,3-Butadieno", aliases: ["butadieno", "1,3-butadieno"], group: "1" },
  { codAgNoc: "010240", name: "Tricloroetileno", aliases: ["tricloroetileno", "trichloroethylene", "tce"], group: "1" },
  { codAgNoc: "010245", name: "Benzopireno", aliases: ["benzopireno", "benzo[a]pireno", "benzo a pireno"], group: "1" },
  { codAgNoc: "010250", name: "Bifenilas policloradas (PCBs)", aliases: ["pcb", "bifenilas policloradas", "policlorinados", "policlorados"], group: "1" },
  { codAgNoc: "010255", name: "Dioxinas", aliases: ["dioxina", "tcdd", "2,3,7,8-tcdd"], group: "1" },
  { codAgNoc: "010260", name: "Sílica amorfa fibrosa", aliases: ["sílica amorfa fibrosa"], group: "1" },
  { codAgNoc: "010265", name: "Fumos de soldagem", aliases: ["fumos de soldagem", "welding fumes"], group: "1" },

  // GRUPO 2A — Provavelmente carcinogênicos
  { codAgNoc: "020110", name: "Tetracloroetileno", aliases: ["tetracloroetileno", "perchloroethylene", "pce"], group: "2A" },
  { codAgNoc: "020115", name: "Dicloreto de etileno", aliases: ["dicloreto de etileno", "1,2-dicloroetano", "edc"], group: "2A" },
  { codAgNoc: "020120", name: "Chumbo inorgânico", aliases: ["chumbo inorgânico", "lead inorganic"], group: "2A" },
  { codAgNoc: "020125", name: "Estireno", aliases: ["estireno", "styrene"], group: "2A" },
  { codAgNoc: "020130", name: "Acrilonitrila", aliases: ["acrilonitrila", "acrylonitrile"], group: "2A" },

  // GRUPO 2B — Possivelmente carcinogênicos
  { codAgNoc: "030110", name: "Etilbenzeno", aliases: ["etilbenzeno", "ethylbenzene"], group: "2B" },
  { codAgNoc: "030115", name: "Naftaleno", aliases: ["naftaleno", "naphthalene"], group: "2B" },
  { codAgNoc: "030120", name: "Fenol", aliases: ["fenol", "phenol"], group: "2B" },
  { codAgNoc: "030125", name: "Diclorometano", aliases: ["diclorometano", "dichloromethane", "cloreto de metileno"], group: "2B" },
];

/**
 * Busca um agente LINACH por código (Tabela 24) ou por nome/alias.
 * Case-insensitive. Retorna o primeiro match.
 */
export function lookupLinach(query: string): LinachAgent | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  // Match por código exato
  for (const a of LINACH_TABLE) {
    if (a.codAgNoc && a.codAgNoc === query.trim()) return a;
  }
  // Match por alias
  for (const a of LINACH_TABLE) {
    if (a.name.toLowerCase() === q) return a;
    for (const al of a.aliases) {
      if (q.includes(al.toLowerCase())) return a;
    }
  }
  return null;
}

/** Conta hits por grupo. */
export function summarizeLinach(hits: LinachAgent[]): Record<LinachGroup, number> {
  const out: Record<LinachGroup, number> = { "1": 0, "2A": 0, "2B": 0 };
  for (const h of hits) out[h.group]++;
  return out;
}
