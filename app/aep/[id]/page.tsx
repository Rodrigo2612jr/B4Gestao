"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePhotograph,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineAnnotation,
  HiOutlineChevronRight,
  HiOutlineClipboardList,
  HiOutlineExclamation,
} from "react-icons/hi";
import AepShell from "../_components/AepShell";
import { useToast } from "../../admin/_components/ToastProvider";
import AepChat from "../_components/AepChat";
import StatusBadge from "../_components/StatusBadge";
import {
  AEP_CHECKLIST,
  countChecklistAnswered,
  totalChecklistQuestions,
  type ChecklistAnswers,
  type ChecklistAnswer,
  type ChecklistResposta,
} from "@/lib/aep/checklist";
import { calcRiskLevel, riskLabel, type AepStatus } from "@/lib/aep/scoring";
import type { AepFull } from "@/lib/aep/db";

interface Viewer {
  role: string;
  actorRole: "TECNICO" | "SUPERVISOR" | "ADMIN";
  isAvaliador: boolean;
  isSupervisor: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canDecide: boolean;
}
type FullData = AepFull & { viewer: Viewer };
type FnData = FullData["sectors"][number]["functions"][number];

type Step = "geral" | "estrutura" | "checklist";
const STEPS: { id: Step; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "estrutura", label: "Setores e funções" },
  { id: "checklist", label: "Checklist por função" },
];

type Sub = "dados" | "checklist" | "riscos";
const SUBS: { id: Sub; label: string }[] = [
  { id: "dados", label: "Dados da função" },
  { id: "checklist", label: "Checklist FO-SST.013" },
  { id: "riscos", label: "Inventário de riscos" },
];

const RISK_FACTORS = ["Ambiental", "Biomecânicos", "Mobiliário e equipamentos", "Psicossociais / Cognitivos"];
const DISPLAY = "var(--font-admin-display), system-ui, sans-serif";
const TOTAL_Q = totalChecklistQuestions();

export default function AepAssessmentPage() {
  return (
    <AepShell title="Avaliação Ergonômica Preliminar">
      <Inner />
    </AepShell>
  );
}

function isRecent(iso: string | null, ms = 20000): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < ms;
}

/** Acha a função e o nome do setor pelo id, dentro do data carregado. */
function findFn(data: FullData | null, fnId: string | null): { fn: FnData; sectorName: string } | null {
  if (!data || !fnId) return null;
  for (const s of data.sectors) {
    const fn = s.functions.find((f) => f.id === fnId);
    if (fn) return { fn, sectorName: s.nome };
  }
  return null;
}

function Inner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { push } = useToast();

  const [data, setData] = useState<FullData | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("geral");
  const [fnView, setFnView] = useState<string | null>(null); // função aberta (id)
  const [fnSub, setFnSub] = useState<Sub>("dados"); // sub-aba dentro da função
  const [showWaiting, setShowWaiting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  const statusRef = useRef<string>("");
  const updatedRef = useRef<string>("");
  const canEditRef = useRef<boolean>(false);
  const isAvaliadorRef = useRef(false);
  const [presence, setPresence] = useState<{ tecnico: boolean; supervisor: boolean }>({ tecnico: false, supervisor: false });

  // Supervisão ao vivo: cursor do técnico (passo + função + sub-aba + pergunta) + modo "seguir"
  const [tecnicoCursor, setTecnicoCursor] = useState<{ step: string; fn: string | null; sub: string | null; focus: string | null } | null>(null);
  const [following, setFollowing] = useState(true);
  const cursorRef = useRef<{ step: string; fn: string | null; sub: string | null; focus: string | null }>({ step: "geral", fn: null, sub: null, focus: null });
  const lastScrollRef = useRef<string | null>(null);

  const reportFocus = useCallback((qid: string) => {
    cursorRef.current = { ...cursorRef.current, focus: qid };
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/aep/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erro ao carregar");
      }
      const full = (await res.json()) as FullData;
      setData(full);
      statusRef.current = full.status;
      updatedRef.current = full.updated_at;
      canEditRef.current = full.viewer.canEdit;
      isAvaliadorRef.current = full.viewer.isAvaliador;
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Mantém o cursor sincronizado com onde o usuário está (p/ o heartbeat do técnico)
  useEffect(() => { cursorRef.current = { ...cursorRef.current, step, focus: null }; }, [step]);
  useEffect(() => { cursorRef.current = { ...cursorRef.current, fn: fnView, focus: null }; }, [fnView]);
  useEffect(() => { cursorRef.current = { ...cursorRef.current, sub: fnSub, focus: null }; }, [fnSub]);

  // Polling: heartbeat + estado leve + reload de conteúdo p/ observadores
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const hb: RequestInit = isAvaliadorRef.current
          ? { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cursorRef.current) }
          : { method: "POST", cache: "no-store" };
        await fetch(`/api/aep/${id}/heartbeat`, hb);
        const res = await fetch(`/api/aep/${id}/state`, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const s = await res.json();
        setPresence({ tecnico: isRecent(s.tecnico_seen_at), supervisor: isRecent(s.supervisor_seen_at) });
        if (!isAvaliadorRef.current) setTecnicoCursor(s.tecnico_cursor ?? null);
        const statusChanged = s.status !== statusRef.current;
        const contentChanged = s.updated_at !== updatedRef.current;
        // "Observador" = quem não é o técnico-avaliador (supervisor/admin) OU o técnico já
        // travado (pós-envio). O avaliador editando NÃO recarrega; guarda 'typing' evita
        // recarregar por cima de quem está digitando.
        const activeEl = document.activeElement;
        const typing = !!activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT");
        const watcher = !isAvaliadorRef.current || !canEditRef.current;
        if (statusChanged || (contentChanged && watcher && !typing)) {
          await load();
        }
      } catch {
        /* silencioso */
      }
    };
    const t = setInterval(tick, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [id, load]);

  // Supervisor seguindo: navega p/ passo + função + sub-aba do técnico
  useEffect(() => {
    if (isAvaliadorRef.current || !following || !tecnicoCursor) return;
    if (tecnicoCursor.step && tecnicoCursor.step !== step) setStep(tecnicoCursor.step as Step);
    if ((tecnicoCursor.fn ?? null) !== fnView) setFnView(tecnicoCursor.fn ?? null);
    if (tecnicoCursor.sub && tecnicoCursor.sub !== fnSub) setFnSub(tecnicoCursor.sub as Sub);
  }, [tecnicoCursor, following, step, fnView, fnSub]);

  // Supervisor seguindo: rola até a pergunta onde o técnico está (só quando muda de pergunta)
  useEffect(() => {
    if (isAvaliadorRef.current || !following) { lastScrollRef.current = null; return; }
    const focus = tecnicoCursor?.focus ?? null;
    if (!focus || focus === lastScrollRef.current) return;
    const el = document.getElementById(`aepq-${focus}`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); lastScrollRef.current = focus; }
  }, [tecnicoCursor?.focus, following, fnView, fnSub]);

  const patchHeader = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/aep/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        push(d.error || "Erro ao salvar", "error");
      } else {
        updatedRef.current = new Date().toISOString();
      }
    },
    [id, push]
  );

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/aep/${id}/submit`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        if (d.missing) push(`Faltam itens: ${d.missing.join(" ")}`, "error");
        else push(d.error || "Erro ao concluir", "error");
        return;
      }
      await load();
      setShowWaiting(true);
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/aep/${id}/approve`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) push(d.error || "Erro", "error");
      else {
        push("Avaliação aprovada!");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  // Navegação de abas: troca de passo, sai da função aberta e pausa o "seguir" (se observador)
  const goStep = (s: Step) => {
    setStep(s);
    setFnView(null);
    if (!isAvaliadorRef.current) setFollowing(false);
  };
  const openFn = (fnId: string, sub: Sub = "dados") => {
    setFnView(fnId);
    setFnSub(sub);
    if (!isAvaliadorRef.current) setFollowing(false);
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-b4-surface-2" />;
  }
  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error || "Não encontrado"}</div>
        <button onClick={() => router.push("/aep")} className="text-sm text-b4-navy hover:underline">← Voltar para a lista</button>
      </div>
    );
  }

  const canEdit = data.viewer.canEdit;
  const status = data.status as AepStatus;
  const watching = !data.viewer.isAvaliador;
  const cursorFn = findFn(data, tecnicoCursor?.fn ?? null);

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button onClick={() => router.push("/aep")} className="mb-1 flex items-center gap-1 text-xs text-b4-ink-2 hover:text-b4-navy">
            <HiOutlineArrowLeft /> AEP
          </button>
          <h2 className="text-xl font-bold text-b4-ink" style={{ fontFamily: DISPLAY, letterSpacing: "-0.02em" }}>{data.title}</h2>
          <p className="text-sm text-b4-ink-2">
            {data.company_name} · {data.company_cnpj} {data.unidade ? `· ${data.unidade}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-b4-ink-2">
            <StatusBadge status={status} />
            <span>Técnico: <b className="text-b4-ink">{data.avaliador_name ?? "-"}</b></span>
            {presence.tecnico && <span className="inline-flex items-center gap-1 text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />preenchendo</span>}
            <span className="text-b4-ink-3">·</span>
            <span>Supervisor: <b className="text-b4-ink">{data.supervisor_name ?? "-"}</b></span>
            {presence.supervisor && <span className="inline-flex items-center gap-1 text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />online</span>}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col items-end gap-2">
          {data.viewer.canSubmit && (
            <button
              onClick={submit}
              disabled={busy}
              className="flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-[var(--b4-shadow-xs)] transition-colors hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
            >
              <HiOutlineCheck /> Concluir e enviar p/ aprovação
            </button>
          )}
          {data.viewer.canDecide && (
            <div className="flex gap-2">
              <button onClick={approve} disabled={busy} className="flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-95 disabled:opacity-60">
                <HiOutlineCheckCircle /> Aprovar
              </button>
              <button onClick={() => setShowReject(true)} disabled={busy} className="flex h-11 items-center gap-1.5 rounded-xl border border-rose-300 bg-b4-surface px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 active:scale-95 disabled:opacity-60">
                <HiOutlineXCircle /> Reprovar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banners de estado */}
      {status === "aguardando_aprovacao" && data.viewer.isAvaliador && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <HiOutlineClock className="text-lg" /> Avaliação enviada. Aguardando aprovação do supervisor · edição bloqueada até a resposta.
        </div>
      )}
      {status === "reprovado" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <b>Reprovado pelo supervisor.</b> {data.rejection_reason ? `Motivo: ${data.rejection_reason}` : "Veja o chat para os ajustes."}{" "}
          {canEdit && "Ajuste os pontos e conclua novamente."}
        </div>
      )}
      {status === "aprovado" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <HiOutlineCheckCircle className="text-lg" /> Avaliação aprovada e concluída.
        </div>
      )}

      {/* Supervisão ao vivo: barra de acompanhamento do técnico */}
      {watching && (presence.tecnico || tecnicoCursor) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-b4-navy/20 bg-b4-navy/5 px-4 py-2.5 text-sm">
          <span className="inline-flex flex-wrap items-center gap-2 text-b4-navy">
            <span className="relative flex h-2.5 w-2.5">
              {presence.tecnico && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${presence.tecnico ? "bg-emerald-500" : "bg-b4-ink-3"}`} />
            </span>
            {presence.tecnico ? (
              <span><b className="text-b4-ink">{data.avaliador_name}</b> está preenchendo ao vivo</span>
            ) : (
              <span>Última posição de <b className="text-b4-ink">{data.avaliador_name}</b></span>
            )}
            {tecnicoCursor?.step && (
              <span className="text-b4-ink-3">· {STEPS.find((x) => x.id === tecnicoCursor.step)?.label ?? tecnicoCursor.step}</span>
            )}
            {cursorFn && (
              <span className="text-b4-ink-3">· {cursorFn.sectorName} / {cursorFn.fn.funcao_paradigma}{tecnicoCursor?.sub ? ` · ${SUBS.find((x) => x.id === tecnicoCursor.sub)?.label ?? tecnicoCursor.sub}` : ""}</span>
            )}
          </span>
          <button
            onClick={() => setFollowing((f) => !f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 ${following ? "bg-b4-navy text-white" : "border border-b4-line text-b4-ink-2 hover:bg-b4-surface-2"}`}
          >
            {following ? "Seguindo o técnico ✓" : "Seguir o técnico"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Coluna principal */}
        <div className="space-y-5">
          {/* Tabs de passo */}
          <div className="flex flex-wrap gap-1 rounded-xl border border-b4-line bg-b4-surface p-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => goStep(s.id)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors active:scale-95 ${
                  step === s.id ? "bg-b4-navy text-white shadow-[var(--b4-shadow-xs)]" : "text-b4-ink-2 hover:bg-b4-surface-2"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div key={version}>
            {step === "geral" && <GeralStep data={data} readOnly={!canEdit} onPatch={patchHeader} />}

            {step === "estrutura" && (
              fnView && findFn(data, fnView) ? (
                <FunctionDetail
                  fnId={fnView}
                  data={data}
                  readOnly={!canEdit}
                  sub={fnSub}
                  setSub={setFnSub}
                  onBack={() => setFnView(null)}
                  reload={load}
                  push={push}
                  isAvaliador={data.viewer.isAvaliador}
                  onFocusItem={data.viewer.isAvaliador ? reportFocus : undefined}
                  liveFocus={watching ? (tecnicoCursor?.focus ?? null) : null}
                  liveName={data.avaliador_name}
                />
              ) : (
                <SectorList data={data} readOnly={!canEdit} reload={load} push={push} onOpenFn={openFn} />
              )
            )}

            {step === "checklist" && (
              fnView && findFn(data, fnView) ? (
                <FunctionDetail
                  fnId={fnView}
                  data={data}
                  readOnly={!canEdit}
                  sub={fnSub}
                  setSub={setFnSub}
                  onBack={() => setFnView(null)}
                  reload={load}
                  push={push}
                  isAvaliador={data.viewer.isAvaliador}
                  onFocusItem={data.viewer.isAvaliador ? reportFocus : undefined}
                  liveFocus={watching ? (tecnicoCursor?.focus ?? null) : null}
                  liveName={data.avaliador_name}
                />
              ) : (
                <FunctionPicker data={data} onPick={(fid) => openFn(fid, "checklist")} />
              )
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AepChat assessmentId={id} myActorRole={data.viewer.actorRole} />
        </div>
      </div>

      {/* Modal aguardando aprovação */}
      {showWaiting && (
        <Modal onClose={() => setShowWaiting(false)}>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <HiOutlineClock className="text-2xl text-amber-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-b4-ink" style={{ fontFamily: DISPLAY }}>Aguardando aprovação do supervisor</h3>
            <p className="mt-1 text-sm text-b4-ink-2">
              O supervisor {data.supervisor_name ?? ""} foi notificado e vai revisar a avaliação. Você pode acompanhar pelo chat.
              Se houver ajustes, eles aparecerão aqui e a edição será reaberta.
            </p>
            <button onClick={() => setShowWaiting(false)} className="mt-5 h-11 rounded-xl bg-b4-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-b4-navy-deep active:scale-95">
              Ver conversa
            </button>
          </div>
        </Modal>
      )}

      {/* Modal reprovar */}
      {showReject && (
        <RejectModal
          onClose={() => setShowReject(false)}
          onConfirm={async (reason) => {
            setBusy(true);
            try {
              const res = await fetch(`/api/aep/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
              });
              const d = await res.json();
              if (!res.ok) {
                push(d.error || "Erro", "error");
              } else {
                push("Avaliação reprovada · técnico notificado.");
                setShowReject(false);
                await load();
              }
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// STEP: GERAL
// ============================================================
function GeralStep({ data, readOnly, onPatch }: { data: FullData; readOnly: boolean; onPatch: (b: Record<string, unknown>) => void }) {
  return (
    <div className="b4-card space-y-4 p-6">
      <h3 className="text-lg font-semibold text-b4-ink" style={{ fontFamily: DISPLAY }}>Dados gerais</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReadField label="Empresa" value={data.company_name} />
        <ReadField label="CNPJ" value={data.company_cnpj} />
        <Field label="Unidade" defaultValue={data.unidade} readOnly={readOnly} onSave={(v) => onPatch({ unidade: v })} />
        <Field label="Data da avaliação" type="date" defaultValue={data.data_avaliacao} readOnly={readOnly} onSave={(v) => onPatch({ dataAvaliacao: v || null })} />
        <Field label="Avaliador (técnico)" value={data.avaliador_name} readOnly />
        <Field label="Cargo do avaliador" defaultValue={data.avaliador_cargo} readOnly={readOnly} onSave={(v) => onPatch({ avaliadorCargo: v })} />
      </div>
      <ReadField label="Base normativa" value={data.norma_base} />
      <p className="rounded-lg bg-b4-navy/5 px-3 py-2 text-xs text-b4-ink-2">
        💡 O checklist e o inventário de riscos são preenchidos <b>por função</b>, dentro de cada setor — vá para a aba <b>“Setores e funções”</b> e abra uma função.
      </p>
    </div>
  );
}

// ============================================================
// SETORES + CARDS DE FUNÇÃO
// ============================================================
function fnProgress(fn: FnData) {
  const done = countChecklistAnswered(fn.checklist);
  return { done, total: TOTAL_Q, risks: fn.risks.length, photos: fn.photos.length, complete: done >= TOTAL_Q };
}

function SectorList({
  data,
  readOnly,
  reload,
  push,
  onOpenFn,
}: {
  data: FullData;
  readOnly: boolean;
  reload: () => Promise<void>;
  push: (m: string, t?: "success" | "error" | "info") => void;
  onOpenFn: (fnId: string, sub?: Sub) => void;
}) {
  const [newSector, setNewSector] = useState("");

  const addSector = async () => {
    if (newSector.trim().length < 1) return;
    const res = await fetch(`/api/aep/${data.id}/sectors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: newSector.trim() }),
    });
    if (res.ok) { setNewSector(""); await reload(); }
    else push("Erro ao adicionar setor", "error");
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="b4-card flex gap-2 p-4">
          <input
            value={newSector}
            onChange={(e) => setNewSector(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSector()}
            placeholder="Nome do setor (ex: Administrativo, Produção, Almoxarifado)"
            className="flex-1 rounded-xl border border-b4-line-strong bg-b4-surface px-3 py-3 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/12"
          />
          <button onClick={addSector} className="flex h-11 flex-shrink-0 items-center gap-1.5 rounded-xl bg-b4-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-b4-navy-deep active:scale-95">
            <HiOutlinePlus /> Add setor
          </button>
        </div>
      )}

      {data.sectors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-b4-line-strong bg-b4-surface p-10 text-center text-sm text-b4-ink-2">
          Nenhum setor ainda. {!readOnly && "Adicione o primeiro setor acima."}
        </div>
      ) : (
        data.sectors.map((sector) => (
          <SectorBlock key={sector.id} sector={sector} assessmentId={data.id} readOnly={readOnly} reload={reload} push={push} onOpenFn={onOpenFn} />
        ))
      )}
    </div>
  );
}

function SectorBlock({
  sector,
  assessmentId,
  readOnly,
  reload,
  push,
  onOpenFn,
}: {
  sector: FullData["sectors"][number];
  assessmentId: string;
  readOnly: boolean;
  reload: () => Promise<void>;
  push: (m: string, t?: "success" | "error" | "info") => void;
  onOpenFn: (fnId: string, sub?: Sub) => void;
}) {
  const addFunction = async () => {
    const res = await fetch(`/api/aep/${assessmentId}/functions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectorId: sector.id, funcaoParadigma: "Nova função" }),
    });
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      await reload();
      if (d.id) onOpenFn(d.id, "dados");
    } else push("Erro ao adicionar função", "error");
  };
  const removeSector = async () => {
    if (!confirm(`Remover o setor "${sector.nome}" e todas as suas funções?`)) return;
    const res = await fetch(`/api/aep/sectors/${sector.id}`, { method: "DELETE" });
    if (res.ok) await reload();
  };

  return (
    <div className="b4-card">
      <div className="flex items-center justify-between border-b border-b4-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-b4-navy/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-b4-navy">Setor</span>
          <h4 className="text-sm font-bold text-b4-ink">{sector.nome}</h4>
          <span className="text-xs text-b4-ink-3">({sector.functions.length} função{sector.functions.length === 1 ? "" : "ões"})</span>
        </div>
        {!readOnly && (
          <button onClick={removeSector} className="text-b4-ink-3 transition-colors hover:text-rose-500" title="Remover setor">
            <HiOutlineTrash />
          </button>
        )}
      </div>

      <div className="space-y-2.5 p-4">
        {sector.functions.length === 0 && (
          <p className="px-1 py-2 text-xs text-b4-ink-3">Nenhuma função neste setor ainda.</p>
        )}
        {sector.functions.map((fn) => {
          const p = fnProgress(fn);
          return (
            <button
              key={fn.id}
              onClick={() => onOpenFn(fn.id, "dados")}
              className="group flex w-full items-center gap-3 rounded-xl border border-b4-line bg-b4-surface-2 p-3.5 text-left transition-all hover:border-b4-navy hover:bg-b4-surface hover:shadow-[var(--b4-shadow-xs)] active:scale-[0.99]"
            >
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${p.complete ? "bg-emerald-100 text-emerald-600" : "bg-b4-navy/10 text-b4-navy"}`}>
                {p.complete ? <HiOutlineCheckCircle className="text-lg" /> : <HiOutlineClipboardList className="text-lg" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-b4-ink">{fn.funcao_paradigma}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-b4-ink-3">
                  {fn.ghe && <span>GHE: {fn.ghe}</span>}
                  <span className={p.complete ? "text-emerald-600" : ""}>checklist {p.done}/{p.total}</span>
                  <span>{p.risks} risco{p.risks === 1 ? "" : "s"}</span>
                  {p.photos > 0 && <span>{p.photos} foto{p.photos === 1 ? "" : "s"}</span>}
                </div>
              </div>
              <HiOutlineChevronRight className="flex-shrink-0 text-b4-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-b4-navy" />
            </button>
          );
        })}
        {!readOnly && (
          <button onClick={addFunction} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-b4-line-strong py-3 text-sm font-medium text-b4-ink-2 transition-colors hover:border-b4-navy hover:text-b4-navy active:scale-[0.99]">
            <HiOutlinePlus /> Add função neste setor
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SELETOR DE FUNÇÃO (aba Checklist)
// ============================================================
function FunctionPicker({ data, onPick }: { data: FullData; onPick: (fnId: string) => void }) {
  const [sectorId, setSectorId] = useState<string>(data.sectors[0]?.id ?? "");
  const sector = data.sectors.find((s) => s.id === sectorId);

  if (data.sectors.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-b4-line-strong bg-b4-surface p-10 text-center text-sm text-b4-ink-2">
        Crie setores e funções primeiro (aba “Setores e funções”) para preencher o checklist de cada função.
      </div>
    );
  }

  return (
    <div className="b4-card space-y-4 p-6">
      <div>
        <h3 className="text-lg font-semibold text-b4-ink" style={{ fontFamily: DISPLAY }}>Checklist por função</h3>
        <p className="mt-1 text-sm text-b4-ink-2">Escolha o <b>setor</b> e a <b>função</b> para preencher o checklist FO-SST.013 daquela função.</p>
      </div>
      <div>
        <label className="text-xs font-medium text-b4-ink-2">Setor</label>
        <select
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-b4-line-strong bg-b4-surface px-3 py-3 text-sm text-b4-ink outline-none transition-all focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/12"
        >
          {data.sectors.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-b4-ink-2">Função</label>
        {sector && sector.functions.length > 0 ? (
          <div className="mt-1.5 space-y-2">
            {sector.functions.map((fn) => {
              const p = fnProgress(fn);
              return (
                <button
                  key={fn.id}
                  onClick={() => onPick(fn.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-b4-line bg-b4-surface-2 p-3.5 text-left transition-all hover:border-b4-navy hover:bg-b4-surface active:scale-[0.99]"
                >
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${p.complete ? "bg-emerald-100 text-emerald-600" : "bg-b4-navy/10 text-b4-navy"}`}>
                    {p.complete ? <HiOutlineCheckCircle className="text-lg" /> : <HiOutlineClipboardList className="text-lg" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-b4-ink">{fn.funcao_paradigma}</p>
                    <p className={`text-[11px] ${p.complete ? "text-emerald-600" : "text-b4-ink-3"}`}>checklist {p.done}/{p.total}</p>
                  </div>
                  <HiOutlineChevronRight className="flex-shrink-0 text-b4-ink-3 group-hover:text-b4-navy" />
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-1.5 rounded-xl border border-dashed border-b4-line-strong bg-b4-surface p-6 text-center text-xs text-b4-ink-3">
            Este setor não tem funções. Adicione na aba “Setores e funções”.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DETALHE DA FUNÇÃO (dados + checklist + riscos)
// ============================================================
function FunctionDetail({
  fnId,
  data,
  readOnly,
  sub,
  setSub,
  onBack,
  reload,
  push,
  isAvaliador,
  onFocusItem,
  liveFocus,
  liveName,
}: {
  fnId: string;
  data: FullData;
  readOnly: boolean;
  sub: Sub;
  setSub: (s: Sub) => void;
  onBack: () => void;
  reload: () => Promise<void>;
  push: (m: string, t?: "success" | "error" | "info") => void;
  isAvaliador: boolean;
  onFocusItem?: (qid: string) => void;
  liveFocus?: string | null;
  liveName?: string | null;
}) {
  const found = findFn(data, fnId);
  if (!found) return null;
  const { fn, sectorName } = found;
  const p = fnProgress(fn);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-b4-ink-2 hover:text-b4-navy">
          <HiOutlineArrowLeft /> Voltar aos setores
        </button>
      </div>

      <div className="b4-feature p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">{sectorName}</div>
        <h3 className="mt-0.5 text-lg font-bold" style={{ fontFamily: DISPLAY }}>{fn.funcao_paradigma}</h3>
        <p className="mt-0.5 text-xs text-white/70">{fn.ghe ? `GHE: ${fn.ghe} · ` : ""}checklist {p.done}/{p.total} · {p.risks} risco{p.risks === 1 ? "" : "s"} · {p.photos} foto{p.photos === 1 ? "" : "s"}</p>
      </div>

      {/* Sub-abas da função */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-b4-line bg-b4-surface p-1">
        {SUBS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors active:scale-95 ${
              sub === s.id ? "bg-b4-navy text-white shadow-[var(--b4-shadow-xs)]" : "text-b4-ink-2 hover:bg-b4-surface-2"
            }`}
          >
            {s.label}
            {s.id === "checklist" && p.complete && <HiOutlineCheckCircle className="text-emerald-400" />}
          </button>
        ))}
      </div>

      {sub === "dados" && <FunctionDados fn={fn} assessmentId={data.id} readOnly={readOnly} reload={reload} push={push} />}
      {sub === "checklist" && (
        <ChecklistBlock
          key={fn.id}
          fnId={fn.id}
          initial={fn.checklist}
          readOnly={readOnly}
          push={push}
          onFocusItem={onFocusItem}
          liveFocus={liveFocus}
          liveName={liveName}
        />
      )}
      {sub === "riscos" && <FunctionRiscos fn={fn} sectorName={sectorName} assessmentId={data.id} readOnly={readOnly} reload={reload} push={push} />}
    </div>
  );
}

// ============================================================
// DADOS DA FUNÇÃO (campos descritivos + fotos)
// ============================================================
function FunctionDados({
  fn,
  assessmentId,
  readOnly,
  reload,
  push,
}: {
  fn: FnData;
  assessmentId: string;
  readOnly: boolean;
  reload: () => Promise<void>;
  push: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const save = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/aep/functions/${fn.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) push("Erro ao salvar função", "error");
  };
  const removeFn = async () => {
    if (!confirm("Remover esta função?")) return;
    const res = await fetch(`/api/aep/functions/${fn.id}`, { method: "DELETE" });
    if (res.ok) await reload();
  };

  return (
    <div className="b4-card space-y-3 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Função (paradigma)" defaultValue={fn.funcao_paradigma} readOnly={readOnly} onSave={(v) => save({ funcaoParadigma: v })} />
        <Field label="GHE (Grupo Homogêneo)" defaultValue={fn.ghe} readOnly={readOnly} onSave={(v) => save({ ghe: v })} />
      </div>

      <PhotoUploader fn={fn} assessmentId={assessmentId} readOnly={readOnly} reload={reload} push={push} />

      <Field label="Posto de trabalho" defaultValue={fn.posto_trabalho} readOnly={readOnly} onSave={(v) => save({ postoTrabalho: v })} />
      <Field label="Descrição do ambiente de trabalho" hint="Descreva o local físico onde a função é exercida: layout e dimensões do posto, piso e circulação, iluminação, ruído, temperatura/ventilação e o mobiliário/equipamentos presentes — destacando o que impacta a postura e o conforto do trabalhador." textarea rows={3} defaultValue={fn.descricao_ambiente} readOnly={readOnly} onSave={(v) => save({ descricaoAmbiente: v })} />
      <Field label="Descrição da atividade" hint="O que o trabalhador faz na prática: principais tarefas, ferramentas e cargas manuseadas, repetitividade e ritmo/exigências da função." textarea rows={3} defaultValue={fn.descricao_atividade} readOnly={readOnly} onSave={(v) => save({ descricaoAtividade: v })} />
      <Field label="Característica do modo operatório" hint="Como a tarefa é executada: posturas adotadas (em pé/sentado), movimentos repetitivos, força aplicada, alcances e pausas durante a jornada." textarea rows={3} defaultValue={fn.modo_operatorio} readOnly={readOnly} onSave={(v) => save({ modoOperatorio: v })} />
      <Field label="Mobiliário e equipamentos" textarea rows={3} defaultValue={fn.mobiliario_equipamentos} readOnly={readOnly} onSave={(v) => save({ mobiliarioEquipamentos: v })} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Conforto acústico" defaultValue={fn.conforto_acustico} readOnly={readOnly} onSave={(v) => save({ confortoAcustico: v })} />
        <Field label="Temperatura" defaultValue={fn.temperatura} readOnly={readOnly} onSave={(v) => save({ temperatura: v })} />
        <Field label="Iluminação" defaultValue={fn.iluminacao} readOnly={readOnly} onSave={(v) => save({ iluminacao: v })} />
      </div>

      {!readOnly && (
        <div className="pt-1">
          <button onClick={removeFn} className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600">
            <HiOutlineTrash /> Remover esta função
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoUploader({
  fn,
  assessmentId,
  readOnly,
  reload,
  push,
}: {
  fn: FnData;
  assessmentId: string;
  readOnly: boolean;
  reload: () => Promise<void>;
  push: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("functionId", fn.id);
      const res = await fetch(`/api/aep/${assessmentId}/photos`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) push(d.error || "Erro no upload", "error");
      else await reload();
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = async (photoId: string) => {
    const res = await fetch(`/api/aep/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) await reload();
  };

  return (
    <div>
      <label className="text-xs font-medium text-b4-ink-2">Fotos do posto de trabalho (até 4)</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {fn.photos.map((p) => (
          <div key={p.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-b4-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? "foto"} className="h-full w-full object-cover" />
            {!readOnly && (
              <button
                onClick={() => removePhoto(p.id)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Remover foto"
              >
                <HiOutlineTrash className="text-xs" />
              </button>
            )}
          </div>
        ))}
        {!readOnly && fn.photos.length < 4 && (
          <label className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-b4-line-strong text-b4-ink-3 transition-colors hover:border-b4-navy hover:text-b4-navy ${uploading ? "opacity-50" : ""}`}>
            <HiOutlinePhotograph className="text-xl" />
            <span className="text-[10px]">{uploading ? "Enviando…" : "Add foto"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {readOnly && fn.photos.length === 0 && <span className="text-xs text-b4-ink-3">Sem fotos.</span>}
      </div>
    </div>
  );
}

// ============================================================
// CHECKLIST (por função)
// ============================================================
const CAT_COLORS: Record<string, { band: string; text: string }> = {
  mobiliarios: { band: "bg-blue-50", text: "text-blue-700" },
  biomecanicos: { band: "bg-indigo-50", text: "text-indigo-700" },
  organizacionais: { band: "bg-amber-50", text: "text-amber-700" },
  ambientais: { band: "bg-cyan-50", text: "text-cyan-700" },
  psicossociais: { band: "bg-violet-50", text: "text-violet-700" },
};

function ChecklistBlock({
  fnId,
  initial,
  readOnly,
  push,
  onFocusItem,
  liveFocus,
  liveName,
}: {
  fnId: string;
  initial: ChecklistAnswers;
  readOnly: boolean;
  push: (m: string, t?: "success" | "error" | "info") => void;
  onFocusItem?: (qid: string) => void;
  liveFocus?: string | null;
  liveName?: string | null;
}) {
  const [answers, setAnswers] = useState<ChecklistAnswers>(initial || {});
  const [notesOpen, setNotesOpen] = useState<Set<string>>(
    () => new Set(Object.entries(initial || {}).filter(([, v]) => (v as ChecklistAnswer)?.nota).map(([k]) => k))
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveChecklist = useCallback(
    async (next: ChecklistAnswers) => {
      const res = await fetch(`/api/aep/functions/${fnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: next }),
      });
      if (!res.ok) push("Erro ao salvar checklist", "error");
    },
    [fnId, push]
  );

  const queueSave = useCallback(
    (next: ChecklistAnswers) => {
      if (readOnly) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveChecklist(next), 600);
    },
    [saveChecklist, readOnly]
  );

  const setResp = (qid: string, resp: ChecklistResposta) => {
    setAnswers((prev) => {
      const cur = prev[qid] || {};
      const next = { ...prev, [qid]: { ...cur, resp: cur.resp === resp ? null : resp } };
      queueSave(next);
      return next;
    });
  };
  const setOpt = (qid: string, optId: string, multi: boolean) => {
    setAnswers((prev) => {
      const cur = prev[qid] || {};
      let next: ChecklistAnswers;
      if (multi) {
        const opts = new Set(cur.opts || []);
        if (opts.has(optId)) opts.delete(optId);
        else opts.add(optId);
        next = { ...prev, [qid]: { ...cur, opts: Array.from(opts) } };
      } else {
        next = { ...prev, [qid]: { ...cur, opt: cur.opt === optId ? null : optId } };
      }
      queueSave(next);
      return next;
    });
  };
  const setFieldVal = (qid: string, fieldId: string, val: string) => {
    setAnswers((prev) => {
      const cur = prev[qid] || {};
      const next = { ...prev, [qid]: { ...cur, fields: { ...(cur.fields || {}), [fieldId]: val } } };
      queueSave(next);
      return next;
    });
  };
  const setNota = (qid: string, val: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: { ...(prev[qid] || {}), nota: val } };
      queueSave(next);
      return next;
    });
  };
  const toggleNote = (qid: string) => {
    setNotesOpen((prev) => {
      const n = new Set(prev);
      if (n.has(qid)) n.delete(qid); else n.add(qid);
      return n;
    });
  };

  const answered = AEP_CHECKLIST.reduce((a, c) => a + c.questions.filter((q) => answers[q.id]?.resp).length, 0);
  const pct = TOTAL_Q ? Math.round((answered / TOTAL_Q) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="b4-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-b4-ink">Progresso do checklist</span>
          <span className="tabular-nums text-b4-ink-2">{answered}/{TOTAL_Q} · {pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-b4-surface-2">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-b4-ink-3">Marque SIM, NÃO ou N/A em cada item desta função. Toque em “observação” para detalhar quando precisar.</p>
      </div>

      {AEP_CHECKLIST.map((cat) => {
        const c = CAT_COLORS[cat.id] ?? CAT_COLORS.mobiliarios;
        const catAns = cat.questions.filter((q) => answers[q.id]?.resp).length;
        return (
          <div key={cat.id} className="b4-card overflow-hidden">
            <div className={`flex items-center justify-between gap-2 ${c.band} px-5 py-3`}>
              <h4 className={`text-sm font-bold uppercase tracking-wide ${c.text}`}>{cat.label}</h4>
              <span className={`rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums ${c.text}`}>{catAns}/{cat.questions.length}</span>
            </div>
            <div className="divide-y divide-b4-line">
              {cat.questions.map((q) => {
                const a = answers[q.id] || {};
                const accent =
                  a.resp === "SIM" ? "border-l-rose-400 bg-rose-50/40"
                  : a.resp === "NAO" ? "border-l-emerald-400 bg-emerald-50/40"
                  : a.resp === "NA" ? "border-l-b4-line-strong bg-b4-surface-2"
                  : "border-l-transparent";
                const noteOpen = notesOpen.has(q.id);
                const isLive = liveFocus === q.id;
                return (
                  <div
                    key={q.id}
                    id={`aepq-${q.id}`}
                    onFocusCapture={() => onFocusItem?.(q.id)}
                    onClickCapture={() => onFocusItem?.(q.id)}
                    className={`relative border-l-[3px] px-4 py-3.5 transition-colors ${accent} ${isLive ? "rounded-lg ring-2 ring-b4-navy ring-offset-2" : ""}`}
                  >
                    {isLive && (
                      <span className="pointer-events-none absolute -top-2.5 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-b4-navy px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        👁 {liveName ?? "Técnico"} está aqui
                      </span>
                    )}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <p className="text-sm leading-snug text-b4-ink sm:flex-1">{q.label}</p>
                      <div className="inline-flex flex-shrink-0 overflow-hidden rounded-lg border border-b4-line bg-b4-surface-2">
                        {(["SIM", "NAO", "NA"] as ChecklistResposta[]).map((r) => {
                          const sel = a.resp === r;
                          const on = r === "SIM" ? "bg-rose-500 text-white" : r === "NAO" ? "bg-emerald-600 text-white" : "bg-b4-ink-2 text-white";
                          return (
                            <button
                              key={r}
                              type="button"
                              disabled={readOnly}
                              onClick={() => setResp(q.id, r)}
                              className={`min-w-[44px] px-3 py-2 text-xs font-bold transition-colors ${sel ? on : "text-b4-ink-2 hover:bg-b4-surface"} ${readOnly ? "cursor-default" : ""}`}
                            >
                              {r === "NAO" ? "NÃO" : r === "NA" ? "N/A" : "SIM"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {a.resp === "SIM" && q.options && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {q.options.map((o) => {
                          const sel = q.multi ? (a.opts || []).includes(o.id) : a.opt === o.id;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              disabled={readOnly}
                              onClick={() => setOpt(q.id, o.id, !!q.multi)}
                              className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${sel ? "border-b4-navy bg-b4-navy/10 font-medium text-b4-navy" : "border-b4-line text-b4-ink-2 hover:bg-b4-surface-2"}`}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {a.resp === "SIM" && q.fields && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {q.fields.map((f) => (
                          <input
                            key={f.id}
                            disabled={readOnly}
                            defaultValue={a.fields?.[f.id] ?? ""}
                            onBlur={(e) => setFieldVal(q.id, f.id, e.target.value)}
                            placeholder={f.label}
                            className="w-36 rounded-lg border border-b4-line bg-b4-surface px-2.5 py-2 text-xs text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/10"
                          />
                        ))}
                      </div>
                    )}

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => toggleNote(q.id)}
                        className={`mt-2 inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${a.nota || noteOpen ? "text-b4-navy" : "text-b4-ink-3 hover:text-b4-navy"}`}
                      >
                        <HiOutlineAnnotation className="text-sm" />
                        {a.nota ? "Editar observação" : noteOpen ? "Fechar observação" : "Adicionar observação"}
                      </button>
                    )}
                    {(noteOpen || a.nota) && (
                      readOnly ? (
                        a.nota ? <p className="mt-1.5 rounded-lg bg-b4-surface-2 px-3 py-2 text-xs text-b4-ink-2"><span className="font-semibold text-b4-ink-3">Obs.: </span>{a.nota}</p> : null
                      ) : (
                        <textarea
                          defaultValue={a.nota ?? ""}
                          onBlur={(e) => setNota(q.id, e.target.value)}
                          rows={2}
                          placeholder="Observação do avaliador para este item…"
                          className="mt-1.5 w-full rounded-lg border border-b4-line bg-b4-surface px-3 py-2 text-xs text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/10"
                        />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// RISCOS (por função)
// ============================================================
function FunctionRiscos({
  fn,
  sectorName,
  assessmentId,
  readOnly,
  reload,
  push,
}: {
  fn: FnData;
  sectorName: string;
  assessmentId: string;
  readOnly: boolean;
  reload: () => Promise<void>;
  push: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const addRisk = async () => {
    const res = await fetch(`/api/aep/${assessmentId}/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ functionId: fn.id }),
    });
    if (res.ok) await reload();
    else push("Erro ao adicionar risco", "error");
  };

  return (
    <div className="space-y-4">
      <div className="b4-card p-4 text-xs text-b4-ink-2">
        Inventário de perigos e riscos desta função. <b className="text-b4-ink">P</b> = probabilidade, <b className="text-b4-ink">S</b> = severidade (1-5), <b className="text-b4-ink">N</b> = nível (calculado).
      </div>

      {!readOnly && (
        <button onClick={addRisk} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-b4-line-strong py-3 text-sm font-medium text-b4-ink-2 transition-colors hover:border-b4-navy hover:text-b4-navy active:scale-[0.99]">
          <HiOutlinePlus /> Add linha de risco
        </button>
      )}

      {fn.risks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-b4-line-strong bg-b4-surface p-8 text-center text-sm text-b4-ink-2">
          <HiOutlineExclamation className="mx-auto mb-1 text-xl text-b4-ink-3" />
          Nenhum risco lançado para esta função ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {fn.risks.map((r) => (
            <RiskRow key={r.id} risk={{ ...r, fnName: fn.funcao_paradigma, sectorName }} readOnly={readOnly} reload={reload} push={push} />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskRow({
  risk,
  readOnly,
  reload,
  push,
}: {
  risk: { id: string; fnName?: string; sectorName?: string; fator_risco: string | null; fonte_geradora: string | null; possiveis_danos: string | null; controles_existentes: string | null; p: number | null; s: number | null; n: number | null };
  readOnly: boolean;
  reload: () => Promise<void>;
  push: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [p, setP] = useState<number | null>(risk.p);
  const [s, setS] = useState<number | null>(risk.s);
  const n = calcRiskLevel(p, s);

  const save = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/aep/risks/${risk.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) push("Erro ao salvar risco", "error");
  };
  const remove = async () => {
    if (!confirm("Remover esta linha de risco?")) return;
    const res = await fetch(`/api/aep/risks/${risk.id}`, { method: "DELETE" });
    if (res.ok) await reload();
  };

  const nColor = n == null ? "bg-b4-surface-2 text-b4-ink-2" : n >= 5 ? "bg-rose-100 text-rose-700" : n === 4 ? "bg-orange-100 text-orange-700" : n === 3 ? "bg-amber-100 text-amber-800" : n === 2 ? "bg-lime-100 text-lime-700" : "bg-emerald-100 text-emerald-700";

  return (
    <div className="b4-card p-4">
      {!readOnly && (
        <div className="mb-2 flex items-center justify-end">
          <button onClick={remove} className="text-b4-ink-3 transition-colors hover:text-rose-500"><HiOutlineTrash /></button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Fator de risco" defaultValue={risk.fator_risco} readOnly={readOnly} list={RISK_FACTORS} onSave={(v) => save({ fatorRisco: v })} />
        <Field label="Fonte geradora / circunstância" defaultValue={risk.fonte_geradora} readOnly={readOnly} onSave={(v) => save({ fonteGeradora: v })} />
        <Field label="Possíveis danos" textarea rows={2} defaultValue={risk.possiveis_danos} readOnly={readOnly} onSave={(v) => save({ possiveisDanos: v })} />
        <Field label="Controles existentes" textarea rows={2} defaultValue={risk.controles_existentes} readOnly={readOnly} onSave={(v) => save({ controlesExistentes: v })} />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <ScoreSelect label="P" value={p} readOnly={readOnly} onChange={(v) => { setP(v); save({ p: v, s }); }} />
        <ScoreSelect label="S" value={s} readOnly={readOnly} onChange={(v) => { setS(v); save({ p, s: v }); }} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-b4-ink-2">Nível</span>
          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${nColor}`}>{n ?? "-"} {n ? `· ${riskLabel(n)}` : ""}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreSelect({ label, value, readOnly, onChange }: { label: string; value: number | null; readOnly: boolean; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-b4-ink-2">{label}</span>
      <select
        value={value ?? ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="rounded-lg border border-b4-line-strong bg-b4-surface px-2 py-1.5 text-xs text-b4-ink outline-none transition-all focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/10 disabled:bg-b4-surface-2"
      >
        <option value="">-</option>
        {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}

// ============================================================
// HELPERS DE UI
// ============================================================
function ReadField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <label className="text-xs font-medium text-b4-ink-2">{label}</label>
      <p className="mt-1 text-sm font-medium text-b4-ink">{value || "-"}</p>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  value,
  onSave,
  readOnly,
  textarea,
  rows = 2,
  type = "text",
  list,
  hint,
}: {
  label: string;
  defaultValue?: string | null;
  value?: string | null;
  onSave?: (v: string) => void;
  readOnly?: boolean;
  textarea?: boolean;
  rows?: number;
  type?: string;
  list?: string[];
  hint?: string;
}) {
  if (readOnly || !onSave) {
    return <ReadField label={label} value={value ?? defaultValue ?? null} />;
  }
  const listId = list ? `dl-${label.replace(/\s+/g, "")}` : undefined;
  return (
    <div>
      <label className="text-xs font-medium text-b4-ink-2">{label}</label>
      {hint && <p className="mb-1.5 mt-0.5 rounded-md bg-b4-navy/5 px-2 py-1 text-[11px] leading-snug text-b4-ink-2">💡 {hint}</p>}
      {textarea ? (
        <textarea
          defaultValue={defaultValue ?? ""}
          rows={rows}
          onBlur={(e) => onSave(e.target.value)}
          className="mt-1 w-full rounded-xl border border-b4-line-strong bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/12"
        />
      ) : (
        <>
          <input
            type={type}
            list={listId}
            defaultValue={defaultValue ?? ""}
            onBlur={(e) => onSave(e.target.value)}
            className="mt-1 w-full rounded-xl border border-b4-line-strong bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/12"
          />
          {list && (
            <datalist id={listId}>
              {list.map((o) => <option key={o} value={o} />)}
            </datalist>
          )}
        </>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-b4-navy-deep/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-b4-surface p-6 shadow-[var(--b4-shadow-lg)]">{children}</div>
    </div>
  );
}

function RejectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold text-b4-ink" style={{ fontFamily: DISPLAY }}>Reprovar avaliação</h3>
      <p className="mt-1 text-sm text-b4-ink-2">Descreva o que precisa ser ajustado. O técnico verá no chat e a edição será reaberta.</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        autoFocus
        placeholder="Ex: Faltou descrever o modo operatório do setor Produção; revisar P/S do risco de postura…"
        className="mt-3 w-full rounded-xl border border-b4-line-strong bg-b4-surface px-3 py-2.5 text-sm text-b4-ink outline-none transition-all placeholder:text-b4-ink-3 focus:border-b4-navy focus:ring-4 focus:ring-b4-navy/12"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-b4-line bg-b4-surface px-4 text-sm font-medium text-b4-ink-2 transition-colors hover:bg-b4-surface-2 active:scale-95">Cancelar</button>
        <button
          onClick={() => reason.trim().length >= 3 && onConfirm(reason.trim())}
          disabled={reason.trim().length < 3}
          className="h-11 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 active:scale-95 disabled:opacity-50"
        >
          Reprovar e notificar
        </button>
      </div>
    </Modal>
  );
}
