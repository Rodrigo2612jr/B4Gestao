"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineExclamation,
  HiOutlineDocumentReport,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";
import AdminShell from "../../../_components/AdminShell";
import KpiTile from "../../../_components/KpiTile";
import { useToast } from "../../../_components/ToastProvider";

interface Alert {
  id: string;
  kind: string;
  severity: "info" | "warn" | "critical";
  title: string;
  description: string;
  custoFaixa: string | null;
  resolved: boolean;
  createdAt: string;
  alertCode?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  relatedEvents?: Record<string, string[]> | null;
  recommendedAction?: string | null;
}
interface Upload {
  id: string;
  filename: string;
  sizeBytes: number;
  status: string;
  eventsCount: number;
  alertsCount: number;
  meta: { byType?: Record<string, number> } | null;
  error: string | null;
  createdAt: string;
}

// Cores semanticas mantidas: severidade e faixa de custo
const SEVERITY_STYLE: Record<string, string> = {
  info: "border-blue-200 bg-blue-50",
  warn: "border-yellow-200 bg-yellow-50",
  critical: "border-red-300 bg-red-50",
};
const SEVERITY_TAG: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  warn: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
};
const SEVERITY_ICON: Record<string, string> = {
  info: "text-blue-500",
  warn: "text-yellow-500",
  critical: "text-red-600",
};
const FAIXA_TAG: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-800",
  MODERATE: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

export default function UploadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell title="Upload eSocial">
      <Inner id={id} />
    </AdminShell>
  );
}

function Inner({ id }: { id: string }) {
  const [upload, setUpload] = useState<Upload | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/esocial/uploads/${id}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setUpload(d.upload);
      setAlerts(d.alerts);
    } catch {
      push("Erro ao carregar", "error");
    } finally {
      setLoading(false);
    }
  }, [id, push]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="b4-card overflow-hidden">
        <div className="space-y-px">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-b4-surface-2" />)}
        </div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="b4-card p-12 text-center text-sm text-b4-ink-2">
        Upload nao encontrado.
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warnCount = alerts.filter((a) => a.severity === "warn").length;

  return (
    <div className="space-y-7">
      {/* Breadcrumb / voltar */}
      <Link
        href="/admin/esocial"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-b4-ink-2 transition-colors hover:text-b4-navy"
      >
        <HiOutlineArrowLeft className="text-base" /> Voltar para uploads
      </Link>

      {/* Card de identidade do arquivo */}
      <div className="b4-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-b4-navy/10 text-b4-navy">
            <HiOutlineDocumentReport className="text-2xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="truncate text-xl font-bold text-b4-ink"
                style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif", letterSpacing: "-0.02em" }}
              >
                {upload.filename}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                upload.status === "done"
                  ? "bg-emerald-100 text-emerald-700"
                  : upload.status === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {upload.status === "done" ? "Processado" : upload.status === "error" ? "Erro" : upload.status === "processing" ? "Processando" : "Pendente"}
              </span>
            </div>
            <p className="mt-1 text-xs text-b4-ink-2">
              {(upload.sizeBytes / 1024).toFixed(1)} KB &middot; {new Date(upload.createdAt).toLocaleString("pt-BR")}
            </p>
            {upload.error && (
              <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {upload.error}
              </p>
            )}
          </div>
        </div>

        {/* Eventos por tipo */}
        {upload.meta?.byType && Object.keys(upload.meta.byType).length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(upload.meta.byType).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-b4-line bg-b4-surface-2 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-b4-ink-3">{k}</p>
                <p className="mt-1 text-2xl font-bold text-b4-ink" style={{ fontFamily: "var(--font-admin-display), system-ui, sans-serif" }}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPIs dos alertas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Total de alertas"
          value={alerts.length}
          icon={<HiOutlineExclamation />}
          loading={loading}
          featured
        />
        <KpiTile
          label="Criticos"
          value={criticalCount}
          icon={<HiOutlineExclamation />}
          loading={loading}
          tone="rose"
        />
        <KpiTile
          label="Atencao"
          value={warnCount}
          icon={<HiOutlineClock />}
          loading={loading}
          tone="amber"
        />
        <KpiTile
          label="Eventos processados"
          value={upload.eventsCount}
          icon={<HiOutlineCheckCircle />}
          loading={loading}
          tone="emerald"
        />
      </div>

      {/* Lista de alertas */}
      <div className="b4-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-b4-line px-5 py-4">
          <h3 className="text-sm font-bold text-b4-ink">Alertas detectados</h3>
          {alerts.length > 0 && (
            <span className="rounded-md bg-b4-surface-2 px-2 py-0.5 text-xs font-semibold text-b4-ink-2">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <HiOutlineCheckCircle className="text-2xl" />
            </div>
            <p className="mt-4 text-sm font-semibold text-b4-ink">Nenhum alerta gerado</p>
            <p className="mt-1 text-xs text-b4-ink-2">O processamento nao identificou irregularidades neste upload.</p>
          </div>
        ) : (
          <div className="divide-y divide-b4-line">
            {alerts.map((a) => (
              <div key={a.id} className={`p-5 ${SEVERITY_STYLE[a.severity]} border-l-4 ${
                a.severity === "critical" ? "border-l-red-500" : a.severity === "warn" ? "border-l-yellow-400" : "border-l-blue-400"
              }`}>
                <div className="flex items-start gap-3">
                  <HiOutlineExclamation className={`mt-0.5 flex-shrink-0 text-xl ${SEVERITY_ICON[a.severity]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.alertCode && (
                        <span className="rounded bg-b4-navy px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                          {a.alertCode}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold text-b4-ink">{a.title}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_TAG[a.severity]}`}>
                        {a.severity === "critical" ? "Critico" : a.severity === "warn" ? "Atencao" : "Info"}
                      </span>
                      {a.custoFaixa && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${FAIXA_TAG[a.custoFaixa] ?? "bg-b4-surface-2 text-b4-ink-2"}`}>
                          Custo {a.custoFaixa}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-b4-ink-2">{a.description}</p>
                    {a.recommendedAction && (
                      <div className="mt-3 rounded-xl border border-b4-line bg-b4-surface p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-b4-ink-3">Acao recomendada</p>
                        <p className="mt-0.5 text-sm text-b4-ink">{a.recommendedAction}</p>
                      </div>
                    )}
                    {(a.periodStart || a.relatedEvents) && (
                      <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-b4-ink-2">
                        {a.periodStart && (
                          <span className="rounded-lg bg-white/80 px-2 py-0.5 font-mono">
                            {a.periodStart}{a.periodEnd ? ` -> ${a.periodEnd}` : ""}
                          </span>
                        )}
                        {a.relatedEvents && Object.entries(a.relatedEvents).map(([k, ids]) => (
                          <span key={k} className="rounded-lg bg-white/80 px-2 py-0.5 font-mono">
                            {k}: {Array.isArray(ids) ? ids.length : 0}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
