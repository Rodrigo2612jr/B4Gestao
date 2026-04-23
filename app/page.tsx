import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import ClientLogos from "@/components/ClientLogos";
import Services from "@/components/Services";

const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"));

// Lazy-loaded below-the-fold sections
const Methodology = dynamic(() => import("@/components/Methodology"), {
  loading: () => <div className="min-h-[400px]" />,
});
const CtaBanner = dynamic(() => import("@/components/CtaBanner"), {
  loading: () => <div className="min-h-[300px]" />,
});
const About = dynamic(() => import("@/components/About"), {
  loading: () => <div className="min-h-[400px]" />,
});
const Comparison = dynamic(() => import("@/components/Comparison"), {
  loading: () => <div className="min-h-[400px]" />,
});
const AbsenceManagement = dynamic(
  () => import("@/components/AbsenceManagement"),
  { loading: () => <div className="min-h-[400px]" /> }
);
const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  loading: () => <div className="min-h-[300px]" />,
});
const DiagnosticForm = dynamic(() => import("@/components/DiagnosticForm"), {
  loading: () => <div className="min-h-[400px]" />,
});
const FAQ = dynamic(() => import("@/components/FAQ"), {
  loading: () => <div className="min-h-[400px]" />,
});
const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => <div className="min-h-[200px]" />,
});
const WhatsAppFloat = dynamic(() => import("@/components/WhatsAppFloat"));
const LgpdBanner = dynamic(() => import("@/components/LgpdBanner"));

// ============================================================
// Schema JSON-LD completo
// ============================================================
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // Organization
    {
      "@type": "Organization",
      "@id": "https://b4gestao.com/#organization",
      name: "B4 Gestão Ocupacional",
      url: "https://b4gestao.com",
      description:
        "Consultoria em Saúde e Segurança do Trabalho para empresas que precisam de resultado, não de papel bonito.",
      telephone: "+5511945023304",
      email: "liege.alves@b4gestao.com",
      foundingDate: "2021",
      areaServed: {
        "@type": "Country",
        name: "BR",
      },
      sameAs: [
        "https://www.instagram.com/b4gestao",
        "https://www.linkedin.com/company/b4-gestao-ocupacional",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+5511945023304",
        contactType: "sales",
        availableLanguage: "Portuguese",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
          opens: "08:00",
          closes: "18:00",
        },
      },
    },

    // LocalBusiness
    {
      "@type": "LocalBusiness",
      "@id": "https://b4gestao.com/#localbusiness",
      name: "B4 Gestão Ocupacional",
      description:
        "Consultoria especializada em SST: PGR, PCMSO, Riscos Psicossociais, Saúde Mental Corporativa e Gestão de Afastados.",
      telephone: "+5511945023304",
      email: "liege.alves@b4gestao.com",
      url: "https://b4gestao.com",
      areaServed: "BR",
      openingHours: "Mo-Fr 08:00-18:00",
      priceRange: "$$",
    },

    // Services
    {
      "@type": "Service",
      name: "PGR: Programa de Gerenciamento de Riscos",
      provider: { "@id": "https://b4gestao.com/#organization" },
      description:
        "Elaboração do PGR estruturado e alinhado à NR-01, com entrega em até 7 dias úteis.",
      areaServed: "BR",
    },
    {
      "@type": "Service",
      name: "PCMSO: Programa de Controle Médico de Saúde Ocupacional",
      provider: { "@id": "https://b4gestao.com/#organization" },
      description:
        "PCMSO com gestão centralizada de clínicas credenciadas em todo o Brasil.",
      areaServed: "BR",
    },
    {
      "@type": "Service",
      name: "Gestão de Riscos Psicossociais (NR-01)",
      provider: { "@id": "https://b4gestao.com/#organization" },
      description:
        "Consultoria e gestão de riscos psicossociais conforme NR-01, com metodologia em 5 passos e equipe multidisciplinar.",
      areaServed: "BR",
    },
    {
      "@type": "Service",
      name: "Saúde Mental Corporativa",
      provider: { "@id": "https://b4gestao.com/#organization" },
      description:
        "SOS Psicológico 24/7, teleconsultas com psicólogos, brigadas de saúde mental e capacitação de lideranças.",
      areaServed: "BR",
    },
    {
      "@type": "Service",
      name: "Gestão de Afastamentos",
      provider: { "@id": "https://b4gestao.com/#organization" },
      description:
        "Gestão especializada de afastamentos por CID F, determinação técnica de nexo causal e protocolos de retorno ao trabalho.",
      areaServed: "BR",
    },

    // FAQ — todas as 7 perguntas
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "O que muda com a NR-01 em relação aos riscos psicossociais?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A NR-01 agora exige que todas as empresas identifiquem, avaliem, priorizem e tratem os riscos psicossociais dentro do PGR/GRO. Fatores como estresse, assédio, sobrecarga e clima organizacional devem ser gerenciados com a mesma seriedade dos riscos físicos.",
          },
        },
        {
          "@type": "Question",
          name: "Minha empresa é pequena. Preciso me preocupar com a NR-01?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sim. A obrigação se aplica a toda empresa com pelo menos 1 funcionário CLT. A B4 atende empresas de todos os portes com soluções personalizadas.",
          },
        },
        {
          "@type": "Question",
          name: "Qual a diferença da B4 para plataformas automatizadas de SST?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Plataformas automatizadas entregam resultados genéricos. A B4 possui equipe multidisciplinar com 20+ anos que entrega avaliações interpretadas e planos de ação contextualizados. Nenhuma plataforma automatizada faz isso.",
          },
        },
        {
          "@type": "Question",
          name: "Em quanto tempo vocês entregam o PGR e PCMSO?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Entregamos PGR e PCMSO em até 7 dias úteis, com rigor técnico e qualidade.",
          },
        },
        {
          "@type": "Question",
          name: "Vocês atendem em todo o Brasil?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sim. Temos cobertura nacional com clínicas credenciadas em todo o território brasileiro. Em SP e Grande SP também realizamos exames in-company.",
          },
        },
        {
          "@type": "Question",
          name: "O que está incluso na gestão de riscos psicossociais da B4?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nossa metodologia em 5 passos inclui: entendimento profissional por área/função/GHE, integração ao PGR/GRO com classificação de severidade, plano de ação personalizado, treinamento de lideranças e monitoramento contínuo com indicadores.",
          },
        },
        {
          "@type": "Question",
          name: "Vocês oferecem suporte psicológico para colaboradores?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sim. Oferecemos teleconsultas com psicólogos, SOS Psicológico 24/7, brigadas de saúde mental e capacitação de lideranças, com dados comprovando impacto em engajamento e retenção.",
          },
        },
        {
          "@type": "Question",
          name: "Quanto custa contratar a B4?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Cada projeto é dimensionado de acordo com o porte, segmento e necessidades da empresa. Trabalhamos com propostas personalizadas. Fale com um especialista e receba uma proposta sob medida. Sem compromisso.",
          },
        },
      ],
    },

    // WebPage
    {
      "@type": "WebPage",
      name: "B4 Gestão Ocupacional | Saúde e Segurança do Trabalho",
      url: "https://b4gestao.com",
      description:
        "Consultoria especializada em SST com soluções estratégicas para PGR, PCMSO, riscos psicossociais e saúde mental corporativa.",
      inLanguage: "pt-BR",
      isPartOf: {
        "@type": "WebSite",
        name: "B4 Gestão Ocupacional",
        url: "https://b4gestao.com",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Stats />
        <ClientLogos />
        <Services />
        <Methodology />
        <CtaBanner />
        <About />
        <Comparison />
        <AbsenceManagement />
        <Testimonials />
        <DiagnosticForm />
        <FAQ />
      </main>
      <Footer />
      <WhatsAppFloat />
      <LgpdBanner />
    </>
  );
}
