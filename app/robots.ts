import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas funcionais nunca indexáveis (defesa em profundidade junto do X-Robots-Tag).
      disallow: ["/admin", "/admin/", "/aep", "/aep/", "/pulse", "/stress", "/api/"],
    },
    sitemap: "https://b4gestao.com.br/sitemap.xml",
    host: "https://b4gestao.com.br",
  };
}
