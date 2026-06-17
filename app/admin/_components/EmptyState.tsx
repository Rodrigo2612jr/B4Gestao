"use client";

import Link from "next/link";
import { ReactNode } from "react";

export type EmptyVariant =
  | "no-leads"
  | "no-results"
  | "no-companies"
  | "no-audits"
  | "no-campaigns"
  | "no-uploads"
  | "generic";

interface Props {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondary?: { label: string; href?: string; onClick?: () => void };
  onClear?: () => void;
}

export default function EmptyState({
  variant = "generic",
  title,
  description,
  action,
  secondary,
  onClear,
}: Props) {
  const meta = MetaByVariant[variant];
  const finalTitle = title ?? meta.title;
  const finalDesc = description ?? meta.description;
  const finalAction =
    action ??
    (onClear ? { label: "Limpar filtros", onClick: onClear } : meta.action);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-b4-line-strong bg-b4-surface px-6 py-16 text-center">
      <div className="mb-6">{meta.illustration}</div>
      <h3 className="text-base font-semibold text-b4-ink">{finalTitle}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-b4-ink-2">{finalDesc}</p>
      {(finalAction || secondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {finalAction && <ActionButton {...finalAction} primary />}
          {secondary && <ActionButton {...secondary} />}
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, href, onClick, primary }: { label: string; href?: string; onClick?: () => void; primary?: boolean }) {
  const cls = primary
    ? "inline-flex items-center gap-1.5 rounded-xl bg-b4-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-b4-navy-deep"
    : "inline-flex items-center gap-1.5 rounded-xl border border-b4-line bg-b4-surface px-4 py-2 text-sm font-medium text-b4-ink-2 transition-colors hover:bg-b4-surface-2";
  if (href) return <Link href={href} className={cls}>{label}</Link>;
  return <button onClick={onClick} className={cls}>{label}</button>;
}

const Stroke = "#94a3b8";
const Accent = "#0e427b";
const Light = "#e2e8f0";

function IllNoResults() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="56" cy="52" r="22" stroke={Stroke} strokeWidth="2.5" />
      <line x1="73" y1="69" x2="92" y2="88" stroke={Accent} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="50" y1="52" x2="62" y2="52" stroke={Light} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="45" y1="46" x2="67" y2="46" stroke={Light} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="58" x2="64" y2="58" stroke={Light} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function IllNoLeads() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="22" y="32" width="76" height="56" rx="6" stroke={Stroke} strokeWidth="2.5" />
      <line x1="22" y1="46" x2="98" y2="46" stroke={Stroke} strokeWidth="2.5" />
      <circle cx="32" cy="39" r="1.8" fill={Stroke} />
      <circle cx="38" cy="39" r="1.8" fill={Stroke} />
      <line x1="34" y1="58" x2="68" y2="58" stroke={Light} strokeWidth="3" strokeLinecap="round" />
      <line x1="34" y1="68" x2="76" y2="68" stroke={Light} strokeWidth="3" strokeLinecap="round" />
      <line x1="34" y1="78" x2="58" y2="78" stroke={Light} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function IllNoCompanies() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="32" y="36" width="56" height="56" rx="4" stroke={Stroke} strokeWidth="2.5" />
      <rect x="42" y="48" width="8" height="10" fill={Light} />
      <rect x="58" y="48" width="8" height="10" fill={Light} />
      <rect x="74" y="48" width="8" height="10" fill={Light} />
      <rect x="42" y="64" width="8" height="10" fill={Light} />
      <rect x="58" y="64" width="8" height="10" fill={Accent} opacity="0.3" />
      <rect x="74" y="64" width="8" height="10" fill={Light} />
      <rect x="54" y="80" width="12" height="12" fill={Stroke} opacity="0.2" />
      <path d="M 32 36 L 60 22 L 88 36" stroke={Stroke} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}
function IllNoAudits() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="28" y="22" width="64" height="80" rx="5" stroke={Stroke} strokeWidth="2.5" />
      <line x1="38" y1="38" x2="76" y2="38" stroke={Light} strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="48" x2="82" y2="48" stroke={Light} strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="58" x2="68" y2="58" stroke={Light} strokeWidth="3" strokeLinecap="round" />
      <circle cx="80" cy="84" r="14" fill="#fff" stroke={Accent} strokeWidth="2.5" />
      <text x="80" y="89" fontSize="14" fontWeight="bold" fill={Accent} textAnchor="middle">25</text>
    </svg>
  );
}
function IllNoCampaigns() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <line x1="22" y1="92" x2="98" y2="92" stroke={Stroke} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="28" y="68" width="12" height="24" fill={Light} />
      <rect x="46" y="52" width="12" height="40" fill={Light} />
      <rect x="64" y="40" width="12" height="52" fill={Accent} opacity="0.5" />
      <rect x="82" y="56" width="12" height="36" fill={Light} />
    </svg>
  );
}
function IllNoUploads() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <path d="M28 78 L28 88 Q28 92 32 92 L88 92 Q92 92 92 88 L92 78" stroke={Stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <line x1="60" y1="32" x2="60" y2="74" stroke={Accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M46 46 L60 32 L74 46" stroke={Accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IllGeneric() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="36" stroke={Stroke} strokeWidth="2.5" strokeDasharray="4 4" />
      <circle cx="60" cy="60" r="6" fill={Accent} opacity="0.5" />
    </svg>
  );
}

const MetaByVariant: Record<EmptyVariant, {
  illustration: ReactNode;
  title: string;
  description: string;
  action?: { label: string; href?: string };
}> = {
  "no-leads": {
    illustration: <IllNoLeads />,
    title: "Nenhum lead recebido ainda",
    description: "Quando alguém preencher o formulário do site, ele aparece aqui automaticamente.",
    action: { label: "Ver o site público", href: "/" },
  },
  "no-results": {
    illustration: <IllNoResults />,
    title: "Nada encontrado com esses filtros",
    description: "Tente termos diferentes ou limpe os filtros para ver todos os registros.",
  },
  "no-companies": {
    illustration: <IllNoCompanies />,
    title: "Nenhuma empresa cadastrada",
    description: "Empresas são criadas automaticamente quando alguém preenche o formulário com CNPJ no site, ou ao cadastrar manualmente em qualquer módulo.",
  },
  "no-audits": {
    illustration: <IllNoAudits />,
    title: "Nenhuma auditoria realizada",
    description: "O Stress Test é uma auditoria de 25 perguntas que mede a exposição regulatória NR-1 da empresa.",
    action: { label: "Criar primeira auditoria", href: "/admin/stress-test/new" },
  },
  "no-campaigns": {
    illustration: <IllNoCampaigns />,
    title: "Nenhuma pesquisa Pulse criada",
    description: "Pulse NR-1 é uma pesquisa anônima por amostragem que mede o clima psicossocial da empresa.",
    action: { label: "Criar primeira pesquisa", href: "/admin/pulse/new" },
  },
  "no-uploads": {
    illustration: <IllNoUploads />,
    title: "Nenhum arquivo eSocial processado",
    description: "Faça upload de XML/ZIP/CSV do eSocial. O sistema cruza eventos, identifica passivos e calcula o Custo Previsível em faixas.",
  },
  "generic": {
    illustration: <IllGeneric />,
    title: "Nada por aqui ainda",
    description: "Quando houver dados, eles aparecem nesta página.",
  },
};
