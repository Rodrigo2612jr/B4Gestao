"use client";

import { useEffect } from "react";
import {
  HiOutlineX,
  HiOutlineClipboardCopy,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineIdentification,
  HiOutlineTrash,
} from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import type { Submission } from "../_lib/types";
import { formatDate, formatTime, formatRelative, formatPhone, phoneToWhatsApp } from "../_lib/format";
import NecessidadeBadge from "./NecessidadeBadge";
import { useToast } from "./ToastProvider";

interface Props {
  lead: Submission | null;
  onClose: () => void;
  onDelete?: (lead: Submission) => void;
}

export default function LeadDrawer({ lead, onClose, onDelete }: Props) {
  const { push } = useToast();

  useEffect(() => {
    if (!lead) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lead, onClose]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      push(`${label} copiado`);
    } catch {
      push("Erro ao copiar", "error");
    }
  };

  const copyAll = () => {
    if (!lead) return;
    const text = [
      `Empresa: ${lead.empresa}`,
      lead.cnpj ? `CNPJ: ${lead.cnpj}` : null,
      `Nome: ${lead.nome}`,
      `Telefone: ${lead.telefone}`,
      `Região: ${lead.regiao}`,
      `Porte: ${lead.funcionarios}`,
      `Necessidade: ${lead.necessidade}`,
      `Recebido em: ${formatDate(lead.criadoEm)} ${formatTime(lead.criadoEm)}`,
    ]
      .filter(Boolean)
      .join("\n");
    copy(text, "Dados");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          lead ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white shadow-2xl transition-transform sm:w-[480px] ${
          lead ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {lead && (
          <>
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Lead recebido {formatRelative(lead.criadoEm)}
                </p>
                <h2 id="drawer-title" className="mt-1 truncate text-xl font-bold text-gray-900">
                  {lead.empresa}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar"
              >
                <HiOutlineX className="text-xl" />
              </button>
            </header>

            <div className="space-y-6 p-6">
              {/* Badge */}
              <div>
                <NecessidadeBadge necessidade={lead.necessidade} size="md" />
              </div>

              {/* Quick actions */}
              <div className="flex flex-col gap-2">
                <a
                  href={phoneToWhatsApp(lead.telefone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md"
                >
                  <FaWhatsapp className="text-lg" />
                  Abrir WhatsApp
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copy(lead.telefone, "Telefone")}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <HiOutlineClipboardCopy />
                    Telefone
                  </button>
                  <button
                    onClick={copyAll}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <HiOutlineClipboardCopy />
                    Tudo
                  </button>
                </div>
              </div>

              {/* Fields */}
              <dl className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <Field
                  icon={<HiOutlineOfficeBuilding />}
                  label="Empresa"
                  value={lead.empresa}
                />
                {lead.cnpj && (
                  <Field
                    icon={<HiOutlineIdentification />}
                    label="CNPJ"
                    value={lead.cnpj}
                  />
                )}
                <Field icon={<HiOutlineUser />} label="Nome" value={lead.nome} />
                <Field
                  icon={<HiOutlinePhone />}
                  label="Telefone"
                  value={formatPhone(lead.telefone)}
                />
                <Field
                  icon={<HiOutlineLocationMarker />}
                  label="Região"
                  value={lead.regiao}
                />
                <Field
                  icon={<HiOutlineUsers />}
                  label="Porte"
                  value={lead.funcionarios}
                />
                <Field
                  icon={<HiOutlineCalendar />}
                  label="Recebido"
                  value={`${formatDate(lead.criadoEm)} às ${formatTime(lead.criadoEm)}`}
                />
              </dl>

              {/* Danger zone */}
              {onDelete && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-700">
                    Zona de perigo
                  </p>
                  <p className="mb-3 text-xs text-red-600/80">
                    Excluir este lead é permanente. A senha será solicitada para confirmar.
                  </p>
                  <button
                    onClick={() => onDelete(lead)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white hover:border-red-600"
                  >
                    <HiOutlineTrash className="text-base" />
                    Excluir lead
                  </button>
                </div>
              )}

              {/* ID footer */}
              <p className="text-center text-xs text-gray-400">ID: {lead.id}</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-medium text-gray-900 break-words">{value}</dd>
      </div>
    </div>
  );
}
