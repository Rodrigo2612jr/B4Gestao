"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineOfficeBuilding,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineDocumentReport,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineClipboardCopy,
  HiOutlineLink,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import { useToast } from "../../_components/ToastProvider";

interface Submission {
  id: string;
  funcionarios: string;
  necessidade: string;
  regiao: string;
  empresa: string;
  cnpj: string | null;
  nome: string;
  telefone: string;
  criado_em: string;
}

interface Company {
  id: string;
  cnpj: string;
  cnpj_formatted: string;
  name: string;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
}

interface Suggestion {
  id: string;
  name: string;
  cnpj_formatted: string;
  score: number;
}

interface Aggregate {
  company: Company;
  submissions: Submission[];
  counts: { leads: number; pulse: number; stress: number; esocial: number };
  suggestions: Suggestion[];
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell title="Detalhes da empresa">
      <CompanyDetailInner companyId={id} />
    </AdminShell>
  );
}

function CompanyDetailInner({ companyId }: { companyId: string }) {
  const [data, setData] = useState<Aggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [mergeOpen, setMergeOpen] = useState<{ targetId: string; targetName: string } | null>(null);
  const [mergePassword, setMergePassword] = useState("");
  const [mergeError, setMergeError] = useState("");
  const [mergeBusy, setMergeBusy] = useState(false);
  const { push } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) {
        if (res.status === 404) {
          push("Empresa não encontrada", "error");
          return;
        }
        throw new Error();
      }
      const d = await res.json();
      setData(d);
    } catch {
      push("Erro ao carregar empresa", "error");
    } finally {
      setLoading(false);
    }
  }, [companyId, push]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMerge = async () => {
    if (!mergeOpen) return;
    setMergeBusy(true);
    setMergeError("");
    try {
      const res = await fetch("/api/companies/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // sourceId = a empresa que vai sumir (a "duplicata" sugerida)
          // targetId = a empresa atual (canônica)
          sourceId: mergeOpen.targetId,
          targetId: companyId,
          password: mergePassword,
        }),
      });
      if (res.ok) {
        push("Empresas mescladas");
        setMergeOpen(null);
        setMergePassword("");
        fetchData();
      } else {
        const d = await res.json().catch(() => ({}));
        setMergeError(d.error || "Erro ao mesclar");
      }
    } catch {
      setMergeError("Erro de conexão");
    } finally {
      setMergeBusy(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">Carregando...</div>;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm text-gray-500">Empresa não encontrada.</p>
        <Link href="/admin/companies" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          ← Voltar para lista
        </Link>
      </div>
    );
  }

  const { company, submissions, counts, suggestions } = data;
  const buckets = [
    { key: "leads", label: "Leads do site", count: counts.leads, Icon: HiOutlineClipboardList, href: "#leads", active: true },
    { key: "pulse", label: "Pulse NR-1", count: counts.pulse, Icon: HiOutlineChartBar, href: "/admin/pulse", active: true },
    { key: "stress", label: "Stress Test", count: counts.stress, Icon: HiOutlineExclamationCircle, href: "/admin/stress-test", active: true },
    { key: "esocial", label: "eSocial alertas", count: counts.esocial, Icon: HiOutlineDocumentReport, href: "/admin/esocial", active: true },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/companies"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
      >
        <HiOutlineArrowLeft /> Voltar para empresas
      </Link>

      {/* Header da empresa */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineOfficeBuilding className="text-3xl" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-secondary">{company.name}</h2>
            <p className="mt-1 font-mono text-sm text-gray-500">{company.cnpj_formatted}</p>
            {(company.city || company.state) && (
              <p className="mt-1 text-sm text-gray-500">
                {[company.city, company.state].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
        <StressInviteRow companyId={company.id} />
      </div>

      {/* Sugestões de mesclagem */}
      {suggestions.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-4">
          <p className="text-sm font-semibold text-yellow-900">⚠ Possíveis duplicatas detectadas</p>
          <p className="mt-1 text-xs text-yellow-800">
            As empresas abaixo têm nomes parecidos. Se forem a mesma empresa, mescle.
          </p>
          <div className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="font-mono text-xs text-gray-500">{s.cnpj_formatted} · {Math.round(s.score * 100)}% similar</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/companies/${s.id}`}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => setMergeOpen({ targetId: s.id, targetName: s.name })}
                    className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600"
                  >
                    Mesclar aqui
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buckets de módulos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {buckets.map((b) => (
          <Link
            key={b.key}
            href={b.href}
            className="rounded-xl border border-primary/30 bg-white p-4 shadow-sm transition-all hover:border-primary/60 hover:shadow-md"
          >
            <b.Icon className="text-2xl text-primary" />
            <p className="mt-3 text-2xl font-bold text-secondary">{b.count}</p>
            <p className="text-xs text-gray-500">{b.label}</p>
          </Link>
        ))}
      </div>

      {/* Link Custo Previsível */}
      <Link
        href={`/admin/esocial/custo-previsivel/${company.id}`}
        className="block rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 transition-all hover:border-primary hover:bg-primary/10"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">💰 Painel Custo Previsível (FAIXAS)</p>
            <p className="text-xs text-gray-600">Previdenciário · Trabalhista · Operacional · Integridade SST</p>
          </div>
          <span className="text-sm font-medium text-primary">Abrir →</span>
        </div>
      </Link>

      {/* Submissions */}
      <div id="leads" className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-secondary">
            Leads do formulário ({submissions.length})
          </h3>
        </div>
        {submissions.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">Nenhum lead registrado ainda.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((s) => (
              <div key={s.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <HiOutlineUser className="text-base text-gray-400" />
                    {s.nome}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlinePhone /> {s.telefone}
                    </span>
                    <span>{s.funcionarios}</span>
                    <span>{s.regiao}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{s.necessidade}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(s.criado_em).toLocaleString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merge dialog */}
      {mergeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-secondary">Mesclar empresas</h3>
            <p className="mt-2 text-sm text-gray-600">
              Você vai mesclar <strong>{mergeOpen.targetName}</strong> em <strong>{company.name}</strong>.
              Todos os leads e dados da empresa antiga passarão a aparecer aqui. Essa ação não pode ser desfeita facilmente.
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              Confirme sua senha para prosseguir
            </label>
            <input
              type="password"
              value={mergePassword}
              onChange={(e) => setMergePassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            {mergeError && <p className="mt-2 text-xs text-red-600">{mergeError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setMergeOpen(null); setMergePassword(""); setMergeError(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleMerge}
                disabled={!mergePassword || mergeBusy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {mergeBusy ? "Mesclando..." : "Mesclar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StressInviteRow({ companyId }: { companyId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/stress-test/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Erro");
      const isProd = window.location.host.includes("b4gestao.com.br");
      const url = isProd
        ? `https://stress.b4gestao.com.br/${d.token}`
        : `${window.location.origin}/stress/${d.token}`;
      setLink(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
      <button
        onClick={generate}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        <HiOutlineLink /> {busy ? "Gerando..." : "Gerar link Stress Test (cliente preenche)"}
      </button>
      {link && (
        <div className="flex flex-1 min-w-[200px] items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
          <input readOnly value={link} className="flex-1 min-w-0 bg-transparent font-mono text-xs outline-none" />
          <button
            onClick={() => { navigator.clipboard.writeText(link); }}
            className="rounded p-1 text-gray-500 hover:bg-white hover:text-primary"
            title="Copiar link"
          >
            <HiOutlineClipboardCopy />
          </button>
        </div>
      )}
    </div>
  );
}
