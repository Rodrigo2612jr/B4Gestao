import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  checkRateLimit,
  getClientIp,
  verifySessionToken,
} from "@/lib/auth";

export const runtime = "nodejs";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

interface Submission {
  id: string;
  funcionarios: string;
  necessidade: string;
  regiao: string;
  empresa: string;
  cnpj?: string;
  nome: string;
  telefone: string;
  criadoEm: string;
}

// Server-side validation schema with strict size limits
const submissionSchema = z.object({
  funcionarios: z.string().min(1).max(100),
  necessidade: z.string().min(1).max(200),
  regiao: z.string().min(1).max(100),
  empresa: z.string().min(2).max(200),
  cnpj: z.string().max(20).optional(),
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
});

function readSubmissions(): Submission[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[submissions] read error:", err);
    return [];
  }
}

function writeSubmissions(submissions: Submission[]) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf-8");
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests may not send Origin
  try {
    const url = new URL(origin);
    const host = url.host;
    if (host === "localhost:3000" || host === "127.0.0.1:3000") return true;
    if (host.endsWith("b4gestao.com.br")) return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

// POST — salvar nova submissão (público, protegido com origin + rate limit + validação)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Origin check (CSRF protection)
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ ok: false, error: "Origem não autorizada" }, { status: 403 });
  }

  // Rate limit: 5 submissions per minute per IP
  const rl = checkRateLimit(`submit:${ip}`, {
    max: 5,
    windowMs: 60 * 1000,
    blockMs: 5 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisições. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const submission: Submission = {
      id: crypto.randomUUID(),
      ...parsed.data,
      criadoEm: new Date().toISOString(),
    };

    const submissions = readSubmissions();
    submissions.unshift(submission);
    writeSubmissions(submissions);

    return NextResponse.json({ ok: true, id: submission.id });
  } catch (err) {
    console.error("[submissions] save error:", err);
    return NextResponse.json({ ok: false, error: "Erro ao salvar" }, { status: 500 });
  }
}

// GET — listar submissões (protegido por session cookie httpOnly)
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Audit log
  console.log(
    `[audit] admin access ip=${ip} at=${new Date().toISOString()} ua=${
      request.headers.get("user-agent") ?? "unknown"
    }`
  );

  const submissions = readSubmissions();
  return NextResponse.json(submissions);
}
