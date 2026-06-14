import { NextRequest, NextResponse } from "next/server";
import { getUsersByRole, type AdminRole } from "@/lib/db";
import { requireAep } from "@/lib/aep/guard";

export const runtime = "nodejs";

const ALLOWED: AdminRole[] = ["SUPERVISOR", "TECNICO"];

export async function GET(request: NextRequest) {
  const auth = await requireAep(request);
  if (!auth.ok) return auth.res;

  const url = new URL(request.url);
  const role = (url.searchParams.get("role") || "SUPERVISOR").toUpperCase() as AdminRole;
  if (!ALLOWED.includes(role)) {
    return NextResponse.json({ error: "Perfil inválido" }, { status: 400 });
  }

  const users = await getUsersByRole(role);
  return NextResponse.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
}
