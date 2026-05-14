import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { listCompanies, fuzzyFindCompanies } from "@/lib/companies";

export const runtime = "nodejs";

// GET — lista de companies (auth)
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  try {
    if (q && q.trim().length >= 2) {
      // Busca fuzzy por nome
      const matches = await fuzzyFindCompanies(q, 0.2, 30);
      return NextResponse.json(matches.map((m) => ({ ...m.company, score: m.score })));
    }
    const companies = await listCompanies();
    return NextResponse.json(companies);
  } catch (err) {
    console.error("[companies] list error:", err);
    return NextResponse.json({ error: "Erro ao listar empresas" }, { status: 500 });
  }
}
