import { NextResponse, type NextRequest } from "next/server";

/**
 * Rewrites por subdomínio + headers de segurança.
 *
 * Subdomínios públicos (clientes):
 *   pulse.b4gestao.com.br/[token]   →  /pulse/[token]
 *   stress.b4gestao.com.br/[token]  →  /stress/[token]
 *   admin.b4gestao.com.br/*         →  /admin/*
 *
 * Sem subdomínio (b4gestao.com.br) continua o site institucional.
 */

const ROOT_DOMAIN = "b4gestao.com.br";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];

  // Não rewrite em localhost / preview (Vercel preview tem subdomínio dinâmico)
  const isProd = host.endsWith(ROOT_DOMAIN);

  if (isProd) {
    const sub = host.replace(`.${ROOT_DOMAIN}`, "");

    // pulse.b4gestao.com.br/{token} → /pulse/{token}
    if (sub === "pulse" && !url.pathname.startsWith("/pulse")) {
      const newUrl = url.clone();
      newUrl.pathname = `/pulse${url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }

    // stress.b4gestao.com.br/{token} → /stress/{token}
    if (sub === "stress" && !url.pathname.startsWith("/stress")) {
      const newUrl = url.clone();
      newUrl.pathname = `/stress${url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }

    // painel.b4gestao.com.br/* (e admin. legado) → /admin/*
    if ((sub === "painel" || sub === "admin") && !url.pathname.startsWith("/admin")) {
      const newUrl = url.clone();
      newUrl.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }

    // aep.b4gestao.com.br/* → /aep/*  (portal do técnico/supervisor)
    if (sub === "aep" && !url.pathname.startsWith("/aep")) {
      const newUrl = url.clone();
      newUrl.pathname = `/aep${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(newUrl);
    }
  }

  const res = NextResponse.next();

  // Áreas internas não podem ser indexadas
  if (req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/aep")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return res;
}

export const config = {
  // Aplica em tudo exceto assets estáticos / api / next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|images|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$).*)"],
};
