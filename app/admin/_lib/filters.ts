import type { Submission, Filters } from "./types";
import { isToday, isWithinDays } from "./format";

export function applyFilters(subs: Submission[], f: Filters): Submission[] {
  let out = subs.slice();

  if (f.busca) {
    const term = f.busca.toLowerCase();
    out = out.filter(
      (s) =>
        s.empresa.toLowerCase().includes(term) ||
        s.nome.toLowerCase().includes(term) ||
        s.telefone.includes(term) ||
        s.regiao.toLowerCase().includes(term) ||
        s.necessidade.toLowerCase().includes(term) ||
        (s.cnpj ?? "").toLowerCase().includes(term)
    );
  }

  if (f.necessidade.length) {
    out = out.filter((s) => f.necessidade.includes(s.necessidade));
  }
  if (f.porte.length) {
    out = out.filter((s) => f.porte.includes(s.funcionarios));
  }
  if (f.regiao.length) {
    out = out.filter((s) => f.regiao.includes(s.regiao));
  }

  if (f.dateRange === "today") out = out.filter((s) => isToday(s.criadoEm));
  else if (f.dateRange === "7d") out = out.filter((s) => isWithinDays(s.criadoEm, 7));
  else if (f.dateRange === "30d") out = out.filter((s) => isWithinDays(s.criadoEm, 30));

  // Sort
  const dir = f.sort.dir === "asc" ? 1 : -1;
  out.sort((a, b) => {
    const ka = a[f.sort.key] ?? "";
    const kb = b[f.sort.key] ?? "";
    if (f.sort.key === "criadoEm") {
      return (new Date(ka).getTime() - new Date(kb).getTime()) * dir;
    }
    return String(ka).localeCompare(String(kb)) * dir;
  });

  return out;
}

export function distinctValues(subs: Submission[], key: keyof Submission): string[] {
  const set = new Set<string>();
  subs.forEach((s) => {
    const v = s[key];
    if (typeof v === "string" && v) set.add(v);
  });
  return Array.from(set).sort();
}

export function mode(values: string[]): string | null {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  let best = values[0];
  let bestCount = 0;
  counts.forEach((c, v) => {
    if (c > bestCount) {
      bestCount = c;
      best = v;
    }
  });
  return best;
}
