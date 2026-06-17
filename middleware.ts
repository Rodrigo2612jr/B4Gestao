import { NextResponse, type NextRequest } from "next/server";

/**
 * Rewrites por subdomínio + noindex das áreas internas e de token.
 *
 * Subdomínios:
 *   pulse.b4gestao.com.br/[token]   →  /pulse/[token]   (público · por respondente)
 *   stress.b4gestao.com.br/[token]  →  /stress/[token]  (público · por respondente)
 *   painel. / admin.b4gestao.com.br →  /admin/*          (interno)
 *   aep.b4gestao.com.br/*           →  /aep/*            (interno · técnico/supervisor)
 *
 * SEO: somente o site institucional (apex/www) deve ser indexado. Todas as áreas
 * funcionais — painel, AEP e as páginas de token (pulse/stress) — recebem
 * X-Robots-Tag: noindex, inclusive quando acessadas via subdomínio (após o rewrite),
 * já que aí o caminho público não casa com o robots.txt do apex.
 *
 * A Content-Security-Policy e os demais headers de segurança ficam no next.config.ts
 * (estáticos, válidos para todo o app). Tentamos CSP com nonce/strict-dynamic aqui, mas
 * o Next não injeta nonce nos scripts de páginas pré-renderizadas → painel em branco.
 */

const ROOT_DOMAIN = "b4gestao.com.br";
const NOINDEX = "noindex, nofollow, noarchive";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const isProd = host.endsWith(ROOT_DOMAIN);

  // Calcula o caminho efetivo (após eventual rewrite de subdomínio).
  // IMPORTANTE: rotas de API (/api/*) são canônicas em qualquer host e NÃO podem ser
  // reescritas — senão, em painel./aep./pulse./stress., `/api/...` viraria `/admin/api/...`
  // (ou `/pulse/api/...`) → 404, quebrando login e todas as chamadas de API do subdomínio.
  const isApi = url.pathname.startsWith("/api");
  let rewritePath: string | null = null;
  if (isProd && !isApi) {
    const sub = host.replace(`.${ROOT_DOMAIN}`, "");

    if (sub === "pulse" && !url.pathname.startsWith("/pulse")) {
      rewritePath = `/pulse${url.pathname}`;
    } else if (sub === "stress" && !url.pathname.startsWith("/stress")) {
      rewritePath = `/stress${url.pathname}`;
    } else if ((sub === "painel" || sub === "admin") && !url.pathname.startsWith("/admin")) {
      rewritePath = `/admin${url.pathname === "/" ? "" : url.pathname}`;
    } else if (sub === "aep" && !url.pathname.startsWith("/aep")) {
      rewritePath = `/aep${url.pathname === "/" ? "" : url.pathname}`;
    }
  }

  let res: NextResponse;
  if (rewritePath) {
    const newUrl = url.clone();
    newUrl.pathname = rewritePath;
    res = NextResponse.rewrite(newUrl);
  } else {
    res = NextResponse.next();
  }

  // Áreas funcionais (interno + token) nunca indexáveis. Usa o caminho efetivo,
  // cobrindo tanto o acesso direto (apex/path) quanto via subdomínio (rewrite).
  const effectivePath = rewritePath ?? url.pathname;
  const isFunctional =
    effectivePath.startsWith("/admin") ||
    effectivePath.startsWith("/aep") ||
    effectivePath.startsWith("/pulse") ||
    effectivePath.startsWith("/stress");
  if (isFunctional) {
    res.headers.set("X-Robots-Tag", NOINDEX);
  }

  return res;
}

export const config = {
  // Aplica em tudo exceto assets estáticos / api / next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|images|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$).*)"],
};
