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
  HiOutlineClipboardCheck,
  HiOutlineLink,
  HiOutlineChevronRight,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import KpiTile from "../../_components/KpiTile";
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
  counts: { leads: number; pulse: number; stress: number; esocial: number; aep: number };
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
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
    return (
      <div className="space-y-7">
        <div className="h-5 w-32 animate-pulse rounded-xl bg-b4-surface-2" />
        <div className="h-36 animate-pulse rounded-2xl border border-b4-line bg-b4-surface shadow-sm" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-b4-line bg-b4-surface shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="b4-card p-12 text-center">
        <p className="text-sm text-b4-ink-2">Empresa não encontrada.</p>
        <Link href="/admin/companies" className="mt-3 inline-block text-sm font-medium text-b4-navy hover:underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const { company, submissions, counts, suggestions } = data;

  const buckets = [
    { key: "leads", label: "Leads do site", count: counts.leads, Icon: HiOutlineClipboardList, href: "#leads", tone: "blue" as const },
    { key: "pulse", label: "Pulse NR-1", count: counts.pulse, Icon: HiOutlineChartBar, href: "/admin/pulse", tone: "emerald" as const },
    { key: "stress", label: "Stress Test", count: counts.stress, Icon: HiOutlineExclamationCircle, href: "/admin/stress-test", tone: "violet" as const },
    { key: "esocial", label: "eSocial alertas", count: counts.esocial, Icon: HiOutlineDocumentReport, href: "/admin/esocial", tone: "rose" as const },
    { key: "aep", label: "AEP (Ergonomia)", count: counts.aep, Icon: HiOutlineClipboardCheck, href: "/admin/aep", tone: "amber" as const },
  ];

  return (
    <div className="space-y-7">
      {/* Back link */}
      <Link
        href="/admin/companies"
        className="inline-flex items-center gap-1.5 text-sm text-b4-ink-2 transition-colors hover:text-b4-navy"
      >
        <HiOutlineArrowLeft /> Voltar para empresas
      </Link>

      {/* Header da empresa */}
      <div>
        <span className="b4-eyebrow">CRM · Empresa</span>
        <div className="b4-card mt-2 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-b4-navy/10 text-b4-navy">
              <HiOutlineOfficeBuilding className="text-3xl" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="truncate text-xl font-bold text-b4-ink"
                style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.02em" }}
              >
                {company.name}
              </h2>
              <p className="mt-0.5 font-mono text-sm text-b4-ink-2">{company.cnpj_formatted}</p>
              {(company.city || company.state) && (
                <p className="mt-0.5 text-sm text-b4-ink-3">
                  {[company.city, company.state].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <span className="b4-chip hidden shrink-0 text-b4-ink-2 sm:inline-flex">
              Desde {fmtDate(company.created_at)}
            </span>
          </div>
          <StressInviteRow companyId={company.id} />
        </div>
      </div>

      {/* KPIs dos módulos */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {buckets.map((b, i) =>
          i === 0 ? (
            <KpiTile
              key={b.key}
              label={b.label}
              value={b.count}
              icon={<b.Icon />}
              featured
              href={b.href}
            />
          ) : (
            <KpiTile
              key={b.key}
              label={b.label}
              value={b.count}
              icon={<b.Icon />}
              tone={b.tone}
              href={b.href}
            />
          )
        )}
      </div>

      {/* Link Custo Previsível · painel navy de destaque */}
      <Link
        href={`/admin/esocial/custo-previsivel/${company.id}`}
        className="b4-feature group flex items-center justify-between p-5 transition-all"
      >
        <div className="relative">
          <span className="b4-eyebrow text-white/70">Painel financeiro</span>
          <p className="mt-1.5 text-sm font-semibold text-white" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>Painel Custo Previsível (FAIXAS)</p>
          <p className="mt-0.5 text-xs text-white/70">Previdenciário · Trabalhista · Operacional · Integridade SST</p>
        </div>
        <HiOutlineChevronRight className="relative text-white/60 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
      </Link>

      {/* Sugestoes de mesclagem */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">Possíveis duplicatas detectadas</p>
          <p className="mt-1 text-xs text-amber-800">
            As empresas abaixo têm nomes parecidos. Se forem a mesma empresa, mescle.
          </p>
          <div className="mt-4 space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-b4-surface p-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-b4-ink">{s.name}</p>
                  <p className="font-mono text-xs text-b4-ink-2">
                    {s.cnpj_formatted} · {Math.round(s.score * 100)}% similar
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/companies/${s.id}`}
                    className="rounded-xl border border-b4-line bg-b4-surface px-3 py-1.5 text-xs font-medium text-b4-ink-2 hover:bg-b4-surface-2"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => setMergeOpen({ targetId: s.id, targetName: s.name })}
                    className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Mesclar aqui
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions / Leads */}
      <div id="leads" className="b4-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-b4-line px-5 py-4">
          <h3 className="text-sm font-bold text-b4-ink">Leads do formulário</h3>
          {submissions.length > 0 && (
            <span className="rounded-md bg-b4-surface-2 px-2 py-0.5 text-xs font-semibold text-b4-ink-2">
              {submissions.length}
            </span>
          )}
        </div>
        {submissions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-b4-navy/10 text-b4-navy">
              <HiOutlineClipboardList className="text-2xl" />
            </div>
            <p className="mt-4 text-sm font-semibold text-b4-ink">Nenhum lead registrado ainda</p>
            <p className="mt-1 text-xs text-b4-ink-2">Leads enviados pelo formulário do site aparecerão aqui.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-b4-line text-left text-[11px] uppercase tracking-wider text-b4-ink-3">
                <th className="px-5 py-3 font-semibold">Contato</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Telefone</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Funcionários</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Região</th>
                <th className="px-5 py-3 font-semibold">Necessidade</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Data</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-b4-line transition-colors last:border-0 hover:bg-b4-surface-2"
                >
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-b4-navy/10 text-[10px] font-bold text-b4-navy">
                        {initials(s.nome)}
                      </span>
                      <span className="font-semibold text-b4-ink">{s.nome}</span>
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-b4-ink-2 md:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlinePhone className="text-b4-ink-3" /> {s.telefone}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-b4-ink-2 md:table-cell">{s.funcionarios}</td>
                  <td className="hidden px-5 py-3.5 text-b4-ink-2 lg:table-cell">{s.regiao}</td>
                  <td className="px-5 py-3.5 text-xs text-b4-ink-2">{s.necessidade}</td>
                  <td className="hidden px-5 py-3.5 text-xs text-b4-ink-3 lg:table-cell">
                    {new Date(s.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Merge dialog */}
      {mergeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-b4-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-b4-ink" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>Mesclar empresas</h3>
            <p className="mt-2 text-sm text-b4-ink-2">
              Você vai mesclar <strong className="text-b4-ink">{mergeOpen.targetName}</strong> em <strong className="text-b4-ink">{company.name}</strong>.
              Todos os leads e dados da empresa antiga passarão a aparecer aqui. Essa ação não pode ser desfeita facilmente.
            </p>
            <label className="mt-4 block text-sm font-medium text-b4-ink-2">
              Confirme sua senha para prosseguir
            </label>
            <input
              type="password"
              value={mergePassword}
              onChange={(e) => setMergePassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-b4-line bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none focus:border-b4-navy/40 focus:ring-4 focus:ring-b4-navy/10"
              autoFocus
            />
            {mergeError && <p className="mt-2 text-xs text-rose-600">{mergeError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setMergeOpen(null); setMergePassword(""); setMergeError(""); }}
                className="rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 hover:bg-b4-surface-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleMerge}
                disabled={!mergePassword || mergeBusy}
                className="rounded-xl bg-b4-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-b4-navy-deep disabled:opacity-50"
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
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-b4-line pt-4">
      <button
        onClick={generate}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl bg-b4-navy px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-b4-navy-deep disabled:opacity-60"
      >
        <HiOutlineLink /> {busy ? "Gerando..." : "Gerar link Stress Test (cliente preenche)"}
      </button>
      {link && (
        <div className="flex flex-1 min-w-[200px] items-center gap-1 rounded-xl border border-b4-line bg-b4-surface-2 px-3 py-2">
          <input readOnly value={link} className="flex-1 min-w-0 bg-transparent font-mono text-xs text-b4-ink outline-none" />
          <button
            onClick={() => { navigator.clipboard.writeText(link); }}
            className="rounded-xl p-1 text-b4-ink-2 hover:bg-b4-surface hover:text-b4-navy"
            title="Copiar link"
          >
            <HiOutlineClipboardCopy />
          </button>
        </div>
      )}
    </div>
  );
}
