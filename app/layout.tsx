import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://b4gestao.com"),
  icons: {
    icon: "/images/logo-icon.png",
    apple: "/images/logo-icon.png",
  },
  other: {
    "theme-color": "#0e427b",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
  title: {
    default:
      "B4 Gestão Ocupacional | Saúde e Segurança do Trabalho com Inteligência Estratégica",
    template: "%s | B4 Gestão Ocupacional",
  },
  description:
    "Consultoria especializada em SST: PGR, PCMSO, Riscos Psicossociais (NR-01), Saúde Mental Corporativa e Gestão de Afastados. Equipe multidisciplinar com 20+ anos de experiência. Atendimento nacional. PGR em até 7 dias.",
  keywords: [
    "saúde e segurança do trabalho",
    "SST",
    "PGR",
    "PCMSO",
    "NR-01",
    "riscos psicossociais",
    "gestão ocupacional",
    "saúde mental corporativa",
    "gestão de afastados",
    "eSocial SST",
    "B4 Gestão",
    "consultoria SST",
  ],
  authors: [{ name: "B4 Gestão Ocupacional" }],
  creator: "B4 Gestão Ocupacional",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://b4gestao.com",
  },
  openGraph: {
    title:
      "B4 Gestão Ocupacional | SST com Inteligência Estratégica",
    description:
      "Rigor técnico, segurança jurídica e inteligência estratégica. Consultoria em SST: PGR em até 7 dias, riscos psicossociais (NR-01), saúde mental corporativa. Cobertura nacional.",
    type: "website",
    locale: "pt_BR",
    url: "https://b4gestao.com",
    siteName: "B4 Gestão Ocupacional",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "B4 Gestão Ocupacional | Saúde e Segurança do Trabalho com Inteligência Estratégica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "B4 Gestão Ocupacional | SST com Inteligência Estratégica",
    description:
      "Consultoria especializada em SST: PGR, PCMSO, Riscos Psicossociais (NR-01), Saúde Mental Corporativa. Equipe com 20+ anos. Cobertura nacional.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" translate="no" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
