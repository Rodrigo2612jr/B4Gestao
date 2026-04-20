import type { Submission } from "./types";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  // Prevent CSV formula injection (Excel/Sheets)
  const prefixed = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${prefixed.replace(/"/g, '""')}"`;
}

export function exportCSV(rows: Submission[]) {
  const headers = [
    "Data",
    "Empresa",
    "CNPJ",
    "Nome",
    "Telefone",
    "Regiao",
    "Funcionarios",
    "Necessidade",
  ];
  const data = rows.map((s) => [
    new Date(s.criadoEm).toLocaleString("pt-BR"),
    s.empresa,
    s.cnpj ?? "",
    s.nome,
    s.telefone,
    s.regiao,
    s.funcionarios,
    s.necessidade,
  ]);
  const csv = [headers, ...data].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-b4-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
