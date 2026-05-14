"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineExclamation, HiOutlineDocumentReport } from "react-icons/hi";
import AdminShell from "../../../_components/AdminShell";
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

const SEVERITY_STYLE: Record<string, string> = {
  info: "border-blue-200 bg-blue-50",
  warn: "border-yellow-200 bg-yellow-50",
  critical: "border-red-300 bg-red-50",
};
const SEVERITY_TAG: Record<string, string> = {
  info: "bg-blue-200 text-blue-900",
  warn: "bg-yellow-200 text-yellow-900",
  critical: "bg-red-200 text-red-900",
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

  if (loading) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Carregando...</div>;
  if (!upload) return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Não encontrado.</div>;

  return (
    <div className="space-y-6">
      <Link href="/admin/esocial" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary">
        <HiOutlineArrowLeft /> Voltar
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineDocumentReport className="text-2xl" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-secondary">{upload.filename}</h2>
            <p className="text-xs text-gray-500">
              {(upload.sizeBytes / 1024).toFixed(1)} KB · {new Date(upload.createdAt).toLocaleString("pt-BR")}
            </p>
            {upload.error && <p className="mt-2 text-sm text-red-600">{upload.error}</p>}
          </div>
        </div>

        {upload.meta?.byType && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(upload.meta.byType).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{k}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Alertas detectados ({alerts.length})
        </h3>
        {alerts.length === 0 ? (
          <p className="mt-3 rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            Nenhum alerta gerado neste upload.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className={`rounded-xl border p-4 ${SEVERITY_STYLE[a.severity]}`}>
                <div className="flex items-start gap-3">
                  <HiOutlineExclamation className={`mt-0.5 flex-shrink-0 text-xl ${
                    a.severity === "critical" ? "text-red-600" : a.severity === "warn" ? "text-yellow-600" : "text-blue-600"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.alertCode && (
                        <span className="rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                          {a.alertCode}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_TAG[a.severity]}`}>
                        {a.severity}
                      </span>
                      {a.custoFaixa && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${FAIXA_TAG[a.custoFaixa] ?? "bg-gray-200 text-gray-700"}`}>
                          Custo {a.custoFaixa}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{a.description}</p>
                    {a.recommendedAction && (
                      <div className="mt-2 rounded-lg bg-white p-2 border border-gray-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ação recomendada</p>
                        <p className="mt-0.5 text-sm text-gray-800">{a.recommendedAction}</p>
                      </div>
                    )}
                    {(a.periodStart || a.relatedEvents) && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                        {a.periodStart && (
                          <span>📅 {a.periodStart}{a.periodEnd ? ` → ${a.periodEnd}` : ""}</span>
                        )}
                        {a.relatedEvents && Object.entries(a.relatedEvents).map(([k, ids]) => (
                          <span key={k} className="rounded bg-gray-100 px-2 py-0.5 font-mono">
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
