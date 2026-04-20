import type { NextConfig } from "next";

const securityHeaders = [
  // Previne clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Previne MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla o Referrer
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  // Permissões do navegador
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Força HTTPS
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content Security Policy (XSS defence in depth)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://wa.me https://api.whatsapp.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Corrige warning de múltiplos lockfiles
  turbopack: {
    root: ".",
  },
  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cache longo para assets estáticos
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Compressão
  compress: true,

  // Otimização de imagens
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [75, 80, 85, 90],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 ano
  },

  // Trailing slash para consistência
  trailingSlash: false,

  // Powered by header removido (segurança)
  poweredByHeader: false,

  // Esconde o indicador do Next.js no dev mode
  devIndicators: false,
};

export default nextConfig;
