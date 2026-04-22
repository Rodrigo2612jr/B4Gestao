// ============================================================
// B4 Gestão Ocupacional — Constantes centralizadas
// ============================================================

// Dados da empresa
export const COMPANY = {
  name: "B4 Gestão Ocupacional",
  shortName: "B4 Gestão",
  tagline: "Consultoria de SST que resolve de verdade",
  description:
    "Consultoria em SST para empresas que buscam conformidade de verdade, não documento para gaveta.",
  yearsFounded: 2021,
  teamExperienceYears: 20,
  pgrDeliveryDays: 7,
  url: "https://b4gestao.com",
} as const;

// Contato
export const CONTACT = {
  whatsapp: {
    number: "5511945023304",
    display: "(11) 94502-3304",
    defaultMessage:
      "Olá, gostaria de saber mais sobre os serviços da B4 Gestão Ocupacional.",
  },
  email: "liege.alves@b4gestao.com",
  hours: "Seg a Sex | 08h às 18h",
  instagram: "https://www.instagram.com/b4gestao",
  linkedin: "https://www.linkedin.com/company/b4-gestao-ocupacional",
} as const;

// URL do WhatsApp montada
export function getWhatsAppUrl(message?: string): string {
  const msg = message ?? CONTACT.whatsapp.defaultMessage;
  return `https://wa.me/${CONTACT.whatsapp.number}?text=${encodeURIComponent(msg)}`;
}

export const WHATSAPP_URL = getWhatsAppUrl();

// NR-01
export const NR01 = {
  deadline: new Date("2026-05-26T00:00:00-03:00"),
  deadlineDisplay: "26/05/2026",
  label: "NR-01 | Riscos Psicossociais",
} as const;

// Navegação
export const NAV_LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Quem Somos", href: "#quem-somos" },
  { label: "Serviços", href: "#servicos" },
  { label: "NR-01", href: "#nr01" },
  { label: "Falar com Especialista", href: "#avaliacao" },
  { label: "Contato", href: "#contato" },
] as const;

// Faixas de funcionários
export const EMPLOYEE_RANGES = [
  "1 a 14 funcionários",
  "15 a 50 funcionários",
  "51 a 200 funcionários",
  "201 a 500 funcionários",
  "500+ funcionários",
] as const;

// Necessidades do formulário
export const SERVICE_NEEDS = [
  "PGR / PCMSO",
  "Riscos Psicossociais (NR-01)",
  "Saúde Mental Corporativa",
  "Gestão de Afastados",
  "eSocial SST",
  "Consultoria Completa",
  "Outros",
] as const;
