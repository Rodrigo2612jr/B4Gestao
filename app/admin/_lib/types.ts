export interface Submission {
  id: string;
  funcionarios: string;
  necessidade: string;
  regiao: string;
  empresa: string;
  cnpj?: string;
  nome: string;
  telefone: string;
  criadoEm: string;
}

export type SortKey = "criadoEm" | "empresa" | "necessidade" | "funcionarios";
export type SortDir = "asc" | "desc";

export interface Filters {
  busca: string;
  necessidade: string[];
  porte: string[];
  regiao: string[];
  dateRange: "all" | "today" | "7d" | "30d";
  sort: { key: SortKey; dir: SortDir };
}

export const INITIAL_FILTERS: Filters = {
  busca: "",
  necessidade: [],
  porte: [],
  regiao: [],
  dateRange: "all",
  sort: { key: "criadoEm", dir: "desc" },
};
