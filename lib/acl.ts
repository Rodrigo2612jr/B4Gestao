/**
 * Access Control List por perfil (Briefing v3 §3).
 *
 * 4 perfis:
 *  - ADMIN     — tudo
 *  - SST       — leads + pulse + stress + esocial completo
 *  - RH        — pulse + stress (sem eSocial)
 *  - JURIDICO  — companies (read) + alertas críticos eSocial
 */

import type { AdminRole } from "./db";

export type Module = "companies" | "leads" | "pulse" | "stress" | "esocial" | "users";

const ROLE_PERMISSIONS: Record<AdminRole, Module[]> = {
  ADMIN: ["companies", "leads", "pulse", "stress", "esocial", "users"],
  SST: ["companies", "leads", "pulse", "stress", "esocial"],
  RH: ["companies", "pulse", "stress"],
  JURIDICO: ["companies", "esocial"],
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
    default: return "Sem perfil";
  }
}
