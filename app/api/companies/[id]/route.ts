import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/guard";
import { logAudit } from "@/lib/db";
import { getCompanyAggregate, fuzzyFindCompanies } from "@/lib/companies";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await requireModule(request, "companies");
  if (!s.ok) return s.res;

  const { id } = await params;
  const ip = s.ip;

  try {
    const aggregate = await getCompanyAggregate(id);
    if (!aggregate.company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Sugestões de possíveis duplicatas (mesmo nome)
    const suggestions = await fuzzyFindCompanies(aggregate.company.name, 0.5, 5);
    const filteredSuggestions = suggestions.filter((s) => s.company.id !== id);

    await logAudit(s.user.email, "view_company", id, ip);

    return NextResponse.json({
      ...aggregate,
      suggestions: filteredSuggestions.map((s) => ({
        ...s.company,
        score: s.score,
      })),
    });
  } catch (err) {
    console.error("[companies/:id] error:", err);
    return NextResponse.json({ error: "Erro ao buscar empresa" }, { status: 500 });
  }
}
