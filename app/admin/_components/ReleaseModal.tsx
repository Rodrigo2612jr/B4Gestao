"use client";

import { useState, useEffect } from "react";
import {
  HiOutlineX,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineLightningBolt,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
} from "react-icons/hi";
import type { ReleaseEntry, ReleaseTone } from "../_lib/releases";
import { getUnseenReleases, markReleaseAsSeen, RELEASES, CURRENT_RELEASE_ID } from "../_lib/releases";

interface Props {
  userName: string;
  /** Quando true, força a abertura (ex: usuário clicou no sino). */
  forceOpen?: boolean;
  onClose?: () => void;
  /** Quando true, mostra TODAS as releases (modo histórico). */
  showAll?: boolean;
}

const TONE_META: Record<ReleaseTone, { label: string; bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  feature: { label: "Funcionalidade", bg: "bg-violet-100", text: "text-violet-700", Icon: HiOutlineSparkles },
  improvement: { label: "Melhoria", bg: "bg-sky-100", text: "text-sky-700", Icon: HiOutlineLightningBolt },
  fix: { label: "Correção", bg: "bg-amber-100", text: "text-amber-700", Icon: HiOutlineRefresh },
  release: { label: "Release", bg: "bg-emerald-100", text: "text-emerald-700", Icon: HiOutlineBadgeCheck },
};

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "tudo bem";
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ReleaseModal({ userName, forceOpen, onClose, showAll }: Props) {
  const [open, setOpen] = useState(false);
  const [releases, setReleases] = useState<ReleaseEntry[]>([]);

  useEffect(() => {
    if (showAll) {
      setReleases(RELEASES);
      setOpen(true);
      return;
    }
    if (forceOpen) {
      setReleases(RELEASES);
      setOpen(true);
      return;
    }
    const unseen = getUnseenReleases();
    if (unseen.length > 0) {
      setReleases(unseen);
      // Pequeno delay para não aparecer instantâneo
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, [forceOpen, showAll]);

  const close = () => {
    setOpen(false);
    if (!showAll && !forceOpen) {
      markReleaseAsSeen(CURRENT_RELEASE_ID);
    }
    onClose?.();
  };

  if (!open || releases.length === 0) return null;

  const newest = releases[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient header */}
        <div
          className="relative px-6 py-6 text-white sm:px-8 sm:py-7"
          style={{ background: "linear-gradient(135deg, #0A1F3D 0%, #143A6B 50%, #0E427B 100%)" }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-sky-400/15 blur-2xl" />

          <button
            onClick={close}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <HiOutlineX className="text-xl" />
          </button>

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5">
              <HiOutlineSparkles className="text-xs text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300">
                {showAll ? "Histórico de releases" : "Nova atualização"}
              </span>
            </div>
            <h2
              className="mt-2.5 text-2xl font-bold sm:text-[26px]"
              style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.025em" }}
            >
              Oi {firstName(userName)}, tudo bem?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {showAll
                ? "Aqui está o histórico completo de atualizações do painel."
                : releases.length === 1
                ? "Tem uma novidade no painel que vale a sua atenção:"
                : `Você tem ${releases.length} atualizações novas desde a última visita.`}
            </p>
          </div>
        </div>

        {/* Body — lista de releases */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
          <ol className="space-y-7">
            {releases.map((r, idx) => {
              const tone = TONE_META[r.tone];
              const isLatest = idx === 0 && !showAll;
              return (
                <li key={r.id} className="relative">
                  {/* Linha conectora */}
                  {idx < releases.length - 1 && (
                    <span className="absolute left-[18px] top-9 h-[calc(100%+1.75rem)] w-px bg-slate-200" />
                  )}

                  <div className="flex gap-4">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.text}`}>
                      <tone.Icon className="text-base" />
                    </div>

                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md ${tone.bg} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.text}`}>
                          {tone.label}
                        </span>
                        <span className="text-[11px] text-slate-500">{formatDate(r.date)}</span>
                        {isLatest && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            ★ Última
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-base font-bold text-slate-900" style={{ letterSpacing: "-0.01em" }}>
                        {r.title}
                      </h3>
                      {r.intro && (
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.intro}</p>
                      )}

                      {/* Highlights */}
                      <ul className="mt-3 space-y-1.5">
                        {r.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                            <HiOutlineCheck className="mt-0.5 flex-shrink-0 text-emerald-500" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Detalhes opcionais */}
                      {r.details && r.details.length > 0 && (
                        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm">
                          <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700">
                            Ver detalhes técnicos
                          </summary>
                          <div className="mt-3 space-y-3">
                            {r.details.map((d, di) => (
                              <div key={di}>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{d.heading}</p>
                                <ul className="mt-1 space-y-1">
                                  {d.items.map((it, ii) => (
                                    <li key={ii} className="flex items-start gap-2 text-xs text-slate-600">
                                      <span className="text-slate-400">•</span>
                                      <span>{it}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-6 py-3.5 sm:px-8">
          <p className="text-xs text-slate-500">
            {showAll
              ? "Você pode reabrir esta janela a qualquer momento pelo sino no topo."
              : "Releases passadas ficam disponíveis no sino do topo da página."}
          </p>
          <button
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-secondary/90"
          >
            {showAll ? "Fechar" : "Marcar como lido"} <HiOutlineArrowRight className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
