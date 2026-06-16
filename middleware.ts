import { NextResponse, type NextRequest } from "next/server";

/**
 * Rewrites por subdomínio + noindex das áreas internas.
 *
 * Subdomínios:
 *   pulse.b4gestao.com.br/[token]   →  /pulse/[token]   (público)
 *   stress.b4gestao.com.br/[token]  →  /stress/[token]  (público)
 *   painel. / admin.b4gestao.com.br →  /admin/*          (interno)
 *   aep.b4gestao.com.br/*           →  /aep/*            (interno · técnico/supervisor)
 *
 * A Content-Security-Policy e os demais headers de segurança ficam no next.config.ts
 * (estáticos, válidos para todo o app). Tentamos CSP com nonce/strict-dynamic aqui, mas
 * o Next não injeta nonce nos scripts de páginas pré-renderizadas → painel em branco.
 */

const ROOT_DOMAIN = "b4gestao.com.br";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const isProd = host.endsWith(ROOT_DOMAIN);

  if (isProd) {
    const sub = host.replace(`.${ROOT_DOMAIN}`, "");

    if (sub === "pulse" && !url.pathname.startsWith("/pulse")) {
      const newUrl = url.clone();
      newUrl.pathname = `/pulse${url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }
    if (sub === "stress" && !url.pathname.startsWith("/stress")) {
      const newUrl = url.clone();
      newUrl.pathname = `/stress${url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }
    if ((sub === "painel" || sub === "admin") && !url.pathname.startsWith("/admin")) {
      const newUrl = url.clone();
      newUrl.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }
    if (sub === "aep" && !url.pathname.startsWith("/aep")) {
      const newUrl = url.clone();
      newUrl.pathname = `/aep${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }
  }

  const res = NextResponse.next();

  // Áreas internas não podem ser indexadas
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/aep")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return res;
}

export const config = {
  // Aplica em tudo exceto assets estáticos / api / next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|images|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$).*)"],
};
