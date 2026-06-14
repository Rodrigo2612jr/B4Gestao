/**
 * Access Control List por perfil (Briefing v3 §3 + Módulo D AEP).
 *
 * Perfis:
 *  - ADMIN      — tudo
 *  - SST        — leads + pulse + stress + esocial + aep
 *  - RH         — pulse + stress (sem eSocial)
 *  - JURIDICO   — companies (read) + alertas críticos eSocial
 *  - TECNICO    — AEP (preenche avaliações ergonômicas em campo)
 *  - SUPERVISOR — AEP (revisa e aprova avaliações)
 */

import type { AdminRole } from "./db";

export type Module = "companies" | "leads" | "pulse" | "stress" | "esocial" | "users" | "aep";

const ROLE_PERMISSIONS: Record<AdminRole, Module[]> = {
  ADMIN: ["companies", "leads", "pulse", "stress", "esocial", "users", "aep"],
  SST: ["companies", "leads", "pulse", "stress", "esocial", "aep"],
  RH: ["companies", "pulse", "stress"],
  JURIDICO: ["companies", "esocial"],
  TECNICO: ["companies", "aep"],
  SUPERVISOR: ["companies", "aep"],
};

export function canAccess(role: AdminRole | undefined, module: Module): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(module);
}

export function listAccessibleModules(role: AdminRole | undefined): Module[] {
  return role ? ROLE_PERMISSIONS[role] ?? [] : [];
}

export function roleLabel(role: AdminRole | undefined): string {
  switch (role) {
    case "ADMIN": return "Administrador";
    case "SST": return "SST";
    case "RH": return "RH";
    case "JURIDICO": return "Jurídico";
    case "TECNICO": return "Técnico (AEP)";
    case "SUPERVISOR": return "Supervisor (AEP)";
    default: return "Sem perfil";
  }
}
