"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HiOutlineUpload,
  HiOutlineDocumentReport,
  HiOutlineExclamation,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
import EmptyState from "../_components/EmptyState";
import KpiTile from "../_components/KpiTile";
import CompanyPickerOrCreate, { type SelectableCompany } from "../_components/CompanyPickerOrCreate";
import { useToast } from "../_components/ToastProvider";

interface Upload {
  id: string;
  companyId: string;
  filename: string;
  sizeBytes: number;
  status: "pending" | "processing" | "done" | "error";
  eventsCount: number;
  alertsCount: number;
  createdAt: string;
  error: string | null;
}
type Company = SelectableCompany;

export default function ESocialPage() {
  return (
    <AdminShell title="eSocial Analytics">
      <Inner />
    </AdminShell>
  );
}

function Inner() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/esocial/uploads");
      if (res.ok) setUploads(await res.json());
    } catch {
      push("Erro ao carregar", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => {
    const total = uploads.length;
    const processados = uploads.filter((u) => u.status === "done").length;
    const comAlertas = uploads.filter((u) => u.alertsCount > 0).length;
    const totalAlertas = uploads.reduce((sum, u) => sum + u.alertsCount, 0);
    return { total, processados, comAlertas, totalAlertas };
  }, [uploads]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <PageHeader
        title="eSocial Analytics"
        subtitle="Ingestão de XML/ZIP/CSV do eSocial com cruzamento temporal (S-2240×S-2220, S-2210×S-2230) e detecção de passivos."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "eSocial Analytics" }]}
        actions={
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark"
          >
            <HiOutlineUpload /> Novo upload
          </button>
        }
      />

      {/* KPIs · apenas quando há dados reais */}
      {!loading && uploads.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile
            label="Total de uploads"
            value={kpis.total}
            icon={<HiOutlineDocumentReport />}
            loading={loading}
            featured
          />
          <KpiTile
            label="Processados"
            value={kpis.processados}
            icon={<HiOutlineCheckCircle />}
            loading={loading}
            tone="emerald"
          />
          <KpiTile
            label="Uploads com alertas"
            value={kpis.comAlertas}
            icon={<HiOutlineClock />}
            loading={loading}
            tone="amber"
          />
          <KpiTile
            label="Total de alertas"
            value={kpis.totalAlertas}
            icon={<HiOutlineExclamation />}
            loading={loading}
            tone="rose"
          />
        </div>
      )}

      {/* Lista de uploads */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-px">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50" />
            ))}
          </div>
        </div>
      ) : uploads.length === 0 ? (
        <EmptyState variant="no-uploads" action={{ label: "Fazer primeiro upload", onClick: () => setShowUpload(true) }} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-900">Uploads processados</h3>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{uploads.length}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 font-semibold">Arquivo</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Eventos</th>
                <th className="px-5 py-3 font-semibold">Alertas</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Data</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr
                  key={u.id}
                  className="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-primary/[0.03]"
                  onClick={() => window.location.href = `/admin/esocial/uploads/${u.id}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <HiOutlineDocumentReport className="text-base" />
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{u.filename}</p>
                        <p className="text-xs text-gray-400">{(u.sizeBytes / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.status === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : u.status === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {u.status === "done" ? "Processado" : u.status === "error" ? "Erro" : u.status === "processing" ? "Processando" : "Pendente"}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-gray-600 md:table-cell">{u.eventsCount}</td>
                  <td className="px-5 py-3.5">
                    {u.alertsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        <HiOutlineExclamation className="text-sm" /> {u.alertsCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 text-xs text-gray-400 lg:table-cell">
                    {new Date(u.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <HiOutlineChevronRight className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          onDone={() => { setShowUpload(false); load(); }}
        />
      )}
    </div>
  );
}

function UploadDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { push } = useToast();

  const submit = async () => {
    if (!company || !file) return setErr("Empresa e arquivo são obrigatórios");
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("companyId", company.id);
      const res = await fetch("/api/esocial/uploads", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Erro");
      push(`${d.result.alertsCreated} alerta(s) gerado(s)`);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-secondary" style={{ fontFamily: "var(--font-display), system-ui", letterSpacing: "-0.02em" }}>
          Novo upload do eSocial
        </h3>
        <div className="mt-5 space-y-4">
          <CompanyPickerOrCreate selected={company} onSelect={setCompany} title="Empresa do eSocial" />
          <div>
            <label className="text-xs font-medium text-gray-700">Arquivo (XML/CSV/ZIP, máx 10MB)</label>
            <input
              type="file"
              accept=".xml,.csv,.zip,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />
          </div>
          {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{err}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!company || !file || busy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {busy ? "Processando..." : "Enviar e processar"}
          </button>
        </div>
      </div>
    </div>
  );
}
