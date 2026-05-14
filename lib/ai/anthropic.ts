/**
 * Cliente Anthropic — textos blindados para relatórios (Briefing v3 §5.6, §6.6).
 *
 * Usa prompts SYSTEM oficiais do briefing:
 *  - Tom institucional, sem culpa individual
 *  - Sem dados pessoais
 *  - Sem valores monetários exatos — apenas FAIXAS
 *  - Disclaimer obrigatório
 *
 * Falha silenciosamente — se a IA estiver indisponível ou ANTHROPIC_API_KEY
 * não configurada, retorna null e o caller usa o fallback template.
 */

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message: string };
}

async function callAnthropic(system: string, user: string): Promise<string | null> {
  if (!API_KEY) {
    console.warn("[ai] ANTHROPIC_API_KEY não configurada — usando fallback");
    return null;
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      console.warn(`[ai] Anthropic ${res.status}`);
      return null;
    }
    const data = (await res.json()) as AnthropicResponse;
    if (data.error) {
      console.warn("[ai]", data.error.message);
      return null;
    }
    return data.content?.find((c) => c.type === "text")?.text ?? null;
  } catch (err) {
    console.warn("[ai] erro:", err);
    return null;
  }
}

// ============================================================
// PROMPTS OFICIAIS (briefing v3)
// ============================================================

const STRESS_SYSTEM = `Você é um redator técnico-executivo de SST (Brasil). Tom institucional. NÃO culpe indivíduos. NÃO inclua dados pessoais.
NÃO calcule multa em valor; apenas faixa (BAIXA/MODERADA/ELEVADA) e disclaimer.
Foco em sistema, processo, governança e evidência.
Linguagem blindada — sempre defensável tecnicamente.`;

const ESOCIAL_SYSTEM = `Você é um redator técnico-executivo (CFO/RH-friendly). Tom institucional. NÃO inclua dados pessoais.
Não prometer valores exatos; apresentar faixas e premissas.
Foco em governança, processo, evidência e ação acionável.`;

// ============================================================
// API — Stress Test
// ============================================================

export interface StressNarrativeResult {
  executiveSummary: string;
  topRecommendations: string[];
  technicalNarrative: string;
  disclaimer: string;
}

export async function generateStressNarrative(input: {
  companyName: string;
  scoreTotal: number;
  semaforo: string;
  semaforoLabel: string;
  engavetamento: { classification: string; score: number; max: number };
  faixa: string;
  coerencia: { label: string; description: string };
  weakSpots: Array<{ id: string; text: string; chosen: string }>;
}): Promise<StressNarrativeResult | null> {
  const userPrompt = `Com base no resultado do Stress Test NR-1 da empresa "${input.companyName}":

- Score total: ${input.scoreTotal}/100 (${input.semaforo} — ${input.semaforoLabel})
- Risco de Engavetamento: ${input.engavetamento.score}/${input.engavetamento.max} — classificação ${input.engavetamento.classification}
- Exposição regulatória: ${input.faixa}
- Coerência Psicossocial: ${input.coerencia.label} — ${input.coerencia.description}
- Pontos críticos: ${input.weakSpots.slice(0, 5).map((w) => `${w.id} (resposta ${w.chosen})`).join(", ")}

Gere SAÍDA em JSON estrito com os campos:
{
  "executiveSummary": "parágrafo de 3-4 linhas em tom executivo institucional",
  "topRecommendations": ["ação 1 acionável", "ação 2", "ação 3"],
  "technicalNarrative": "parágrafo técnico de 4-6 linhas com foco em sistema/processo/evidência",
  "disclaimer": "frase curta lembrando que é estimativa preliminar e que validação in loco é recomendada"
}

Responda APENAS com o JSON, sem markdown, sem prefixo, sem explicação.`;

  const out = await callAnthropic(STRESS_SYSTEM, userPrompt);
  if (!out) return null;

  try {
    // Tenta extrair JSON mesmo se vier com markdown
    const jsonMatch = out.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as StressNarrativeResult;
    return parsed;
  } catch (err) {
    console.warn("[ai] falha ao parsear JSON stress:", err);
    return null;
  }
}

// ============================================================
// API — eSocial / Custo Previsível
// ============================================================

export interface ESocialNarrativeResult {
  executiveSummary: string;
  costSummary: string;
  topRecommendations: string[];
  cta: string;
  disclaimer: string;
}

export async function generateESocialNarrative(input: {
  companyName: string;
  integrityScore: number;
  totalAlertsActive: number;
  criticalAlerts: number;
  bands: Array<{ category: string; faixa: string; rangeLow: number; rangeHigh: number }>;
}): Promise<ESocialNarrativeResult | null> {
  const userPrompt = `Empresa "${input.companyName}" — análise eSocial + SST Analytics:

- Integridade dos dados SST: ${input.integrityScore}/100
- Alertas ativos: ${input.totalAlertsActive} (${input.criticalAlerts} críticos)
- Custo Previsível em FAIXAS:
${input.bands.map((b) => `  • ${b.category}: ${b.faixa} (R$ ${b.rangeLow.toLocaleString("pt-BR")} - R$ ${b.rangeHigh.toLocaleString("pt-BR")})`).join("\n")}

Gere SAÍDA em JSON estrito:
{
  "executiveSummary": "3-4 linhas, tom executivo CFO/RH-friendly",
  "costSummary": "1 parágrafo focado na exposição financeira em FAIXAS — sem prometer valor exato",
  "topRecommendations": ["ação 1", "ação 2", "ação 3"],
  "cta": "frase única convidando para diagnóstico aprofundado + acompanhamento mensal B4",
  "disclaimer": "frase sobre FAIXAS, validação in loco, premissas parametrizáveis"
}

Responda APENAS com o JSON.`;

  const out = await callAnthropic(ESOCIAL_SYSTEM, userPrompt);
  if (!out) return null;

  try {
    const jsonMatch = out.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as ESocialNarrativeResult;
  } catch {
    return null;
  }
}
