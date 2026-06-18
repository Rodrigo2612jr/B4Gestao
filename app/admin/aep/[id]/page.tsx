"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineOfficeBuilding,
  HiOutlineClipboardCheck,
  HiOutlineChat,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
} from "react-icons/hi";
import AdminShell from "../../_components/AdminShell";
import StatusBadge from "../../../aep/_components/StatusBadge";
import { useToast } from "../../_components/ToastProvider";
import { timeAgo } from "../../_lib/time";
import {
  AEP_CHECKLIST,
  countChecklistAnswered,
  totalChecklistQuestions,
  type ChecklistAnswers,
  type ChecklistAnswer,
} from "@/lib/aep/checklist";
import { riskLabel, type AepStatus } from "@/lib/aep/scoring";
import type { AepFull, AepChatMessage } from "@/lib/aep/db";

type FnData = AepFull["sectors"][number]["functions"][number];
const DISPLAY = "var(--font-admin-display), system-ui, sans-serif";
const TOTAL_Q = totalChecklistQuestions();

export default function AdminAepDetailPage() {
  return (
    <AdminShell title="AEP — Avaliação">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AepFull | null>(null);
  const [chat, setChat] = useState<AepChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { push } = useToast();

  const load = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/aep/${id}`, { cache: "no-store" }),
        fetch(`/api/aep/${id}/chat`, { cache: "no-store" }),
      ]);
      if (!r1.ok) {
        const d = await r1.json().catch(() => ({}));
        throw new Error(d.error || "Erro ao carregar");
      }
      setData(await r1.json());
      setChat(r2.ok ? await r2.json() : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-b4-surface-2" />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error || "Não encontrada"}</div>
        <Link href="/admin/aep" className="text-sm text-b4-navy hover:underline">← Voltar para a lista</Link>
      </div>
    );
  }

  const functions = data.sectors.flatMap((s) => s.functions);
  const totalRisks = functions.reduce((a, f) => a + f.risks.length, 0);
  const totalPhotos = functions.reduce((a, f) => a + f.photos.length, 0);
  const checklistDone = functions.length
    ? functions.every((f) => countChecklistAnswered(f.checklist) >= TOTAL_Q)
    : false;
  const maxRisk = functions.reduce((m, f) => Math.max(m, ...f.risks.map((r) => r.n ?? 0), 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/aep" className="inline-flex items-center gap-1 text-xs font-medium text-b4-ink-2 hover:text-b4-navy">
        <HiOutlineArrowLeft /> AEP
      </Link>

      {/* Cabeçalho */}
      <div className="b4-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-b4-ink" style={{ fontFamily: DISPLAY, letterSpacing: "-0.02em" }}>{data.title}</h1>
              <StatusBadge status={data.status as AepStatus} />
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-b4-ink-2">
              <HiOutlineOfficeBuilding className="text-b4-ink-3" /> {data.company_name} · {data.company_cnpj} {data.unidade ? `· ${data.unidade}` : ""}
            </p>
          </div>
          {data.company_id && (
            <Link href={`/admin/companies/${data.company_id}`} className="rounded-lg border border-b4-line bg-b4-surface px-3 py-1.5 text-xs font-medium text-b4-ink-2 transition-colors hover:bg-b4-surface-2">
              Ver ficha da empresa →
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ReadRow label="Técnico (avaliador)" value={data.avaliador_name} />
          <ReadRow label="Supervisor" value={data.supervisor_name} />
          <ReadRow label="Data da avaliação" value={data.data_avaliacao} />
          <ReadRow label="Cargo do avaliador" value={data.avaliador_cargo} />
          <ReadRow label="Base normativa" value={data.norma_base} />
        </div>

        {data.status === "reprovado" && data.rejection_reason && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <b>Reprovado.</b> Motivo: {data.rejection_reason}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryTile label="Setores" value={data.sectors.length} />
        <SummaryTile label="Funções" value={functions.length} />
        <SummaryTile label="Riscos" value={totalRisks} />
        <SummaryTile label="Fotos" value={totalPhotos} />
        <SummaryTile
          label="Maior nível de risco"
          value={maxRisk ? `${maxRisk} · ${riskLabel(maxRisk)}` : "—"}
          tone={maxRisk >= 4 ? "danger" : maxRisk >= 3 ? "warn" : "ok"}
        />
      </div>

      {!checklistDone && functions.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <HiOutlineExclamation className="text-lg" /> Há funções com o checklist ainda incompleto.
        </div>
      )}

      {/* Setores e funções */}
      <div className="space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-b4-ink-3">Setores e funções avaliadas</h2>
        {data.sectors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-b4-line-strong bg-b4-surface p-8 text-center text-sm text-b4-ink-2">
            Nenhum setor/função preenchido ainda.
          </div>
        )}
        {data.sectors.map((s) => (
          <div key={s.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-b4-navy/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-b4-navy">Setor</span>
              <h3 className="text-sm font-bold text-b4-ink">{s.nome}</h3>
              <span className="text-xs text-b4-ink-3">({s.functions.length} função{s.functions.length === 1 ? "" : "ões"})</span>
            </div>
            {s.functions.length === 0 ? (
              <p className="px-1 text-xs text-b4-ink-3">Sem funções neste setor.</p>
            ) : (
              s.functions.map((fn) => <FunctionObserve key={fn.id} fn={fn} />)
            )}
          </div>
        ))}
      </div>

      {/* Conversa do chat */}
      <ChatLog chat={chat} />
    </div>
  );
}

function ReadRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-b4-ink-3">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-b4-ink">{value || "—"}</p>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" | "danger" }) {
  const color = tone === "danger" ? "text-rose-600" : tone === "warn" ? "text-amber-600" : "text-b4-ink";
  return (
    <div className="b4-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-b4-ink-3">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${color}`} style={{ fontFamily: DISPLAY }}>{value}</p>
    </div>
  );
}

// ============================================================
// FUNÇÃO (read-only)
// ============================================================
function FunctionObserve({ fn }: { fn: FnData }) {
  const done = countChecklistAnswered(fn.checklist);
  const complete = done >= TOTAL_Q;

  return (
    <div className="b4-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-b4-line bg-b4-surface-2 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${complete ? "bg-emerald-100 text-emerald-600" : "bg-b4-navy/10 text-b4-navy"}`}>
            <HiOutlineClipboardCheck className="text-base" />
          </span>
          <div>
            <p className="text-sm font-bold text-b4-ink">{fn.funcao_paradigma}</p>
            {fn.ghe && <p className="text-[11px] text-b4-ink-3">GHE: {fn.ghe}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>checklist {done}/{TOTAL_Q}</span>
          <span className="rounded-full bg-b4-surface px-2 py-0.5 font-semibold text-b4-ink-2 ring-1 ring-b4-line">{fn.risks.length} risco{fn.risks.length === 1 ? "" : "s"}</span>
          <span className="rounded-full bg-b4-surface px-2 py-0.5 font-semibold text-b4-ink-2 ring-1 ring-b4-line">{fn.photos.length} foto{fn.photos.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Dados */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadRow label="Posto de trabalho" value={fn.posto_trabalho} />
          <ReadRow label="Conforto acústico" value={fn.conforto_acustico} />
          <ReadRow label="Temperatura" value={fn.temperatura} />
          <ReadRow label="Iluminação" value={fn.iluminacao} />
        </div>
        <ReadBlock label="Descrição do ambiente" value={fn.descricao_ambiente} />
        <ReadBlock label="Descrição da atividade" value={fn.descricao_atividade} />
        <ReadBlock label="Modo operatório" value={fn.modo_operatorio} />
        <ReadBlock label="Mobiliário e equipamentos" value={fn.mobiliario_equipamentos} />

        {/* Fotos */}
        {fn.photos.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-b4-ink-3">Fotos do posto</p>
            <div className="flex flex-wrap gap-2">
              {fn.photos.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="block h-24 w-24 overflow-hidden rounded-lg border border-b4-line transition-transform hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption ?? "foto"} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        <ChecklistObserve answers={fn.checklist || {}} />

        {/* Riscos */}
        {fn.risks.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-b4-ink-3">Inventário de riscos</p>
            <div className="space-y-2">
              {fn.risks.map((r) => {
                const nColor = r.n == null ? "bg-b4-surface-2 text-b4-ink-2" : r.n >= 5 ? "bg-rose-100 text-rose-700" : r.n === 4 ? "bg-orange-100 text-orange-700" : r.n === 3 ? "bg-amber-100 text-amber-800" : r.n === 2 ? "bg-lime-100 text-lime-700" : "bg-emerald-100 text-emerald-700";
                return (
                  <div key={r.id} className="rounded-xl border border-b4-line bg-b4-surface-2 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-b4-ink">{r.fator_risco || "Risco"}</span>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${nColor}`}>
                        P{r.p ?? "-"} · S{r.s ?? "-"} · N {r.n ?? "-"}{r.n ? ` · ${riskLabel(r.n)}` : ""}
                      </span>
                    </div>
                    {r.fonte_geradora && <p className="mt-1 text-xs text-b4-ink-2"><b>Fonte:</b> {r.fonte_geradora}</p>}
                    {r.possiveis_danos && <p className="mt-0.5 text-xs text-b4-ink-2"><b>Danos:</b> {r.possiveis_danos}</p>}
                    {r.controles_existentes && <p className="mt-0.5 text-xs text-b4-ink-2"><b>Controles:</b> {r.controles_existentes}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReadBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-b4-ink-3">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-b4-ink">{value}</p>
    </div>
  );
}

// ============================================================
// CHECKLIST (read-only): apontamentos (SIM) em destaque + todas as respostas
// ============================================================
function respBadge(resp: string | null | undefined) {
  if (resp === "SIM") return <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">SIM</span>;
  if (resp === "NAO") return <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">NÃO</span>;
  if (resp === "NA") return <span className="rounded bg-b4-ink-2 px-1.5 py-0.5 text-[10px] font-bold text-white">N/A</span>;
  return <span className="rounded bg-b4-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-b4-ink-3 ring-1 ring-b4-line">—</span>;
}

function ChecklistObserve({ answers }: { answers: ChecklistAnswers }) {
  const [showAll, setShowAll] = useState(false);
  const done = countChecklistAnswered(answers);

  // Apontamentos = perguntas respondidas SIM (os problemas encontrados)
  const findings: { label: string; a: ChecklistAnswer; opts: string[] }[] = [];
  for (const cat of AEP_CHECKLIST) {
    for (const q of cat.questions) {
      const a = answers[q.id];
      if (a?.resp === "SIM") {
        const optLabels: string[] = [];
        if (q.options) {
          const chosen = q.multi ? a.opts || [] : a.opt ? [a.opt] : [];
          for (const oid of chosen) {
            const o = q.options.find((x) => x.id === oid);
            if (o) optLabels.push(o.label);
          }
        }
        if (a.fields) for (const [k, v] of Object.entries(a.fields)) if (v) optLabels.push(`${k}: ${v}`);
        findings.push({ label: q.label, a, opts: optLabels });
      }
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-b4-ink-3">Checklist FO-SST.013</p>
        <span className="text-[11px] font-semibold text-b4-ink-2">{done}/{TOTAL_Q} respondidas · {findings.length} apontamento{findings.length === 1 ? "" : "s"}</span>
      </div>

      {findings.length > 0 ? (
        <div className="space-y-1.5">
          {findings.map((f, i) => (
            <div key={i} className="rounded-lg border-l-[3px] border-l-rose-400 bg-rose-50/50 px-3 py-2 text-sm text-b4-ink">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">{respBadge("SIM")}</span>
                <div>
                  <p className="leading-snug">{f.label}</p>
                  {f.opts.length > 0 && <p className="mt-0.5 text-xs text-b4-ink-2">{f.opts.join(" · ")}</p>}
                  {f.a.nota && <p className="mt-0.5 text-xs italic text-b4-ink-2">Obs.: {f.a.nota}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <HiOutlineCheckCircle /> Nenhum apontamento (nenhuma resposta “SIM”) nesta função.
        </p>
      )}

      <button
        onClick={() => setShowAll((v) => !v)}
        className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-b4-navy hover:underline"
      >
        <HiOutlineChevronDown className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
        {showAll ? "Ocultar respostas completas" : "Ver todas as respostas do checklist"}
      </button>

      {showAll && (
        <div className="mt-3 space-y-3">
          {AEP_CHECKLIST.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-b4-line">
              <p className="border-b border-b4-line bg-b4-surface-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-b4-ink-2">{cat.label}</p>
              <div className="divide-y divide-b4-line">
                {cat.questions.map((q) => {
                  const a = answers[q.id];
                  return (
                    <div key={q.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                      <span className="text-b4-ink-2">{q.label}</span>
                      <span className="flex-shrink-0">{respBadge(a?.resp)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CHAT (read-only) — conversa completa salva na avaliação
// ============================================================
const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  TECNICO: { label: "Técnico", cls: "bg-b4-navy/10 text-b4-navy" },
  SUPERVISOR: { label: "Supervisor", cls: "bg-violet-100 text-violet-700" },
  ADMIN: { label: "Admin", cls: "bg-emerald-100 text-emerald-700" },
};

function ChatLog({ chat }: { chat: AepChatMessage[] }) {
  return (
    <div>
      <h2 className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-b4-ink-3">
        <HiOutlineChat /> Conversa da avaliação ({chat.length})
      </h2>
      <div className="b4-card divide-y divide-b4-line">
        {chat.length === 0 ? (
          <p className="p-6 text-center text-sm text-b4-ink-2">Nenhuma mensagem nesta avaliação.</p>
        ) : (
          chat.map((m) => {
            if (m.kind === "status") {
              return (
                <div key={m.id} className="flex items-center gap-2 bg-b4-surface-2/60 px-5 py-2.5 text-xs text-b4-ink-2">
                  <HiOutlineCheckCircle className="flex-shrink-0 text-b4-ink-3" />
                  <span>{m.body}</span>
                  <span className="ml-auto whitespace-nowrap text-b4-ink-3">{timeAgo(m.created_at)}</span>
                </div>
              );
            }
            const role = ROLE_BADGE[m.author_role ?? ""] ?? { label: m.author_role ?? "—", cls: "bg-b4-surface-2 text-b4-ink-2" };
            return (
              <div key={m.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-b4-ink">{m.author_name ?? m.author_email ?? "—"}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${role.cls}`}>{role.label}</span>
                  <span className="ml-auto whitespace-nowrap text-xs text-b4-ink-3">{timeAgo(m.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-b4-ink">{m.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
