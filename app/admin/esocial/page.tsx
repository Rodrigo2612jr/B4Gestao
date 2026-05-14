"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlineUpload,
  HiOutlineDocumentReport,
  HiOutlineExclamation,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
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

const SEVERITY_BG = {
  info: "bg-blue-100 text-blue-800",
  warn: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
};

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {uploads.length} {uploads.length === 1 ? "upload" : "uploads"}
        </p>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <HiOutlineUpload /> Novo upload eSocial
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500">Carregando...</div>
      ) : uploads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <HiOutlineDocumentReport className="mx-auto text-5xl text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Nenhum upload do eSocial ainda.</p>
          <p className="mt-1 text-xs text-gray-400">
            Aceita XML, CSV e ZIP (até 10MB). O parser v1 detecta padrões — versão completa em desenvolvimento.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <HiOutlineUpload /> Fazer primeiro upload
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Arquivo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Eventos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Alertas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {uploads.map((u) => (
                <tr
                  key={u.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => window.location.href = `/admin/esocial/uploads/${u.id}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{u.filename}</div>
                    <div className="text-xs text-gray-500">{(u.sizeBytes / 1024).toFixed(1)} KB</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.status === "done" ? "bg-emerald-100 text-emerald-700"
                      : u.status === "error" ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{u.eventsCount}</td>
                  <td className="px-4 py-3">
                    {u.alertsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        <HiOutlineExclamation /> {u.alertsCount}
                      </span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); load(); }} />}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl my-8">
        <h3 className="text-lg font-bold text-secondary">Novo upload do eSocial</h3>
        <div className="mt-4 space-y-4">
          <CompanyPickerOrCreate selected={company} onSelect={setCompany} title="Empresa do eSocial" />
          <div>
            <label className="text-xs font-medium text-gray-700">Arquivo (XML/CSV/ZIP, máx 10MB)</label>
            <input
              type="file"
              accept=".xml,.csv,.zip,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={!company || !file || busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            {busy ? "Processando..." : "Enviar e processar"}
          </button>
        </div>
      </div>
    </div>
  );
}
