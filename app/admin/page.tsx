"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineLogout,
} from "react-icons/hi";

interface Submission {
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

export default function AdminPage() {
  const [senha, setSenha] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) {
        if (res.status === 401) {
          setAutenticado(false);
          setSubmissions([]);
          return;
        }
        throw new Error("Erro ao buscar dados");
      }
      const data = await res.json();
      setSubmissions(data);
      setAutenticado(true);
    } catch {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, try to fetch - if cookie is valid, we're in
  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (res.ok) {
        setSenha(""); // Clear password from memory
        await fetchSubmissions();
      } else if (res.status === 429) {
        setErro("Muitas tentativas. Tente novamente em 15 minutos.");
      } else {
        setErro("Senha incorreta");
      }
    } catch {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setAutenticado(false);
    setSubmissions([]);
    setSenha("");
  };

  const filtered = submissions.filter((s) => {
    if (!busca) return true;
    const term = busca.toLowerCase();
    return (
      s.empresa.toLowerCase().includes(term) ||
      s.nome.toLowerCase().includes(term) ||
      s.telefone.includes(term) ||
      s.regiao.toLowerCase().includes(term) ||
      s.necessidade.toLowerCase().includes(term)
    );
  });

  // CSV-safe escape (prevents formula injection + quote breaking)
  const csvCell = (v: unknown) => {
    const s = String(v ?? "");
    const prefixed = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${prefixed.replace(/"/g, '""')}"`;
  };

  const exportCSV = () => {
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
    const rows = filtered.map((s) => [
      new Date(s.criadoEm).toLocaleString("pt-BR"),
      s.empresa,
      s.cnpj ?? "",
      s.nome,
      s.telefone,
      s.regiao,
      s.funcionarios,
      s.necessidade,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(csvCell).join(","))
      .join("\r\n");
    // BOM so Excel opens as UTF-8
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-b4-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tela de login
  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
        >
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <HiOutlineLockClosed className="text-2xl" />
            </div>
          </div>
          <h1 className="mb-1 text-center text-xl font-bold text-gray-900">
            Painel Admin
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            B4 Gestao Ocupacional
          </p>

          <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-gray-700">
            Senha de acesso
          </label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Digite a senha"
            autoFocus
          />

          {erro && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !senha}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  // Painel admin
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Painel de Leads</h1>
            <p className="text-sm text-gray-500">
              {submissions.length} {submissions.length === 1 ? "formulario recebido" : "formularios recebidos"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
            >
              <HiOutlineRefresh className={`text-base ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              <HiOutlineDownload className="text-base" />
              Exportar CSV
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              title="Sair"
            >
              <HiOutlineLogout className="text-base" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Busca */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por empresa, nome, telefone, regiao..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {busca && (
            <span className="text-sm text-gray-500">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Tabela */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <HiOutlineEye className="mx-auto text-4xl text-gray-300" />
            <p className="mt-3 text-gray-500">
              {submissions.length === 0
                ? "Nenhum formulario recebido ainda"
                : "Nenhum resultado para esta busca"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Data</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Empresa</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">CNPJ</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Nome</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Telefone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Regiao</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Porte</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Necessidade</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-50 transition-colors hover:bg-blue-50/50 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {new Date(s.criadoEm).toLocaleDateString("pt-BR")}{" "}
                        <span className="text-xs text-gray-400">
                          {new Date(s.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.empresa}</td>
                      <td className="px-4 py-3 text-gray-500">{s.cnpj || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{s.nome}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://wa.me/55${s.telefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {s.telefone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.regiao}</td>
                      <td className="px-4 py-3 text-gray-500">{s.funcionarios}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {s.necessidade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
