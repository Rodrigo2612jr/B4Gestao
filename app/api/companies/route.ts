import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/guard";
import { listCompanies, fuzzyFindCompanies } from "@/lib/companies";

export const runtime = "nodejs";

// GET — lista de companies (auth + módulo companies)
export async function GET(request: NextRequest) {
  const s = await requireModule(request, "companies");
  if (!s.ok) return s.res;

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
