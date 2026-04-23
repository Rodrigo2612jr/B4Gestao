"use client";

import { useState } from "react";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { HiChevronDown } from "react-icons/hi";

const services = [
  {
    id: "legal",
    title: "Gestão Legal e Técnica",
    shortDesc: "PGR, PCMSO, laudos técnicos e eSocial",
    image: "/images/team-strategy.jpg",
    imageFit: "cover",
    imageBg: "bg-transparent",
    features: [
      "PGR: entrega rápida sem pular etapas, alinhado com a NR-01",
      "PCMSO: entrega em 1 dia após a conclusão do PGR",
      "PCMSO com rede de clínicas em todo o Brasil",
      "AEP e AET conforme NR-17",
      "Laudos técnicos com respaldo pericial, preparados para sustentação judicial",
      "eSocial SST (S-2210, S-2220, S-2240) sem atraso",
      "Exames in-company em SP e Grande SP",
    ],
  },
  {
    id: "ocupacional",
    title: "Gestão Ocupacional e Operacional",
    shortDesc: "Terceiros, clínicas e operação do SESMT",
    image: "/images/team-meeting.jpg",
    imageFit: "cover",
    imageBg: "bg-transparent",
    features: [
      "Controle centralizado de terceiros com rastreabilidade",
      "Clínicas credenciadas em todos os estados",
      "Agendamento e coordenação de exames ocupacionais",
      "Gestão do SESMT, da rotina ao planejamento",
      "Redução de custos com processos bem organizados",
    ],
  },
  {
    id: "psicossociais",
    title: "Riscos Psicossociais (NR-01)",
    shortDesc: "Consultoria e gestão com metodologia em 5 passos",
    image: "/images/reports-review.jpg",
    imageFit: "cover",
    imageBg: "bg-transparent",
    features: [
      "Atuação por área, função e GHE com metodologias reconhecidas",
      "Integração ao PGR/GRO com matriz de probabilidade x severidade",
      "Plano de ação prático, priorizado e com responsáveis definidos",
      "Responsabilidade técnica de Engenheiro de Segurança e Psicólogo",
      "Consultoria feita por especialistas, não por software",
    ],
  },
  {
    id: "saude-mental",
    title: "Saúde Mental Corporativa",
    shortDesc: "SOS 24h, teleconsultas e brigadas de saúde",
    image: "/images/consultation.jpg",
    imageFit: "cover",
    imageBg: "bg-transparent",
    features: [
      "SOS Psicológico 24/7 para situações de urgência",
      "Teleconsultas com psicólogos sob demanda",
      "Brigadas de saúde mental e capacitação de líderes",
      "Apoio na construção de políticas de bem-estar",
      "Relatórios com dados reais de impacto em engajamento e retenção",
    ],
  },
  {
    id: "afastamentos",
    title: "Gestão de Afastamentos",
    shortDesc: "CID F, nexo causal, FAP e retorno ao trabalho",
    image: "/images/handshake.jpg",
    imageFit: "cover",
    imageBg: "bg-transparent",
    features: [
      "Gerenciamento de afastamentos por transtornos mentais (CID F)",
      "Determinação técnica se o afastamento é laboral ou não",
      "Plano de retorno ao trabalho estruturado e eficaz",
      "Mensuração do impacto do presenteísmo e absenteísmo",
      "Impacto direto na folha e no FAP da empresa",
    ],
  },
];

export default function Services() {
  const [openId, setOpenId] = useState<string | null>("legal");

  return (
    <section id="servicos" className="relative overflow-hidden bg-white py-12 lg:py-20">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -z-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 -z-0 h-72 w-72 rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Soluções Completas
          </span>
          <h2 className="mt-4 text-2xl font-bold text-secondary sm:text-3xl lg:text-4xl">
            SST de ponta a ponta.{" "}
            <span className="text-primary">Soluções completas</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray">
            Cobrimos tudo. Você não precisa coordenar nada.
          </p>
        </FadeIn>

        {/* Accordion services */}
        <div className="mt-10 space-y-3">
          {services.map((service, i) => {
            const isOpen = openId === service.id;

            return (
              <FadeIn key={service.id} delay={i * 0.05}>
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-primary/30 bg-white shadow-xl"
                    : "border-gray-100 bg-white/80 shadow-sm hover:shadow-md"
                }`}>
                  {/* Accordion header */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : service.id)}
                    className="flex w-full items-center justify-between p-5 sm:p-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                        isOpen ? "bg-primary text-white" : "bg-primary/10 text-primary"
                      }`}>
                        <span className="text-lg font-bold">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-secondary">{service.title}</h3>
                        <p className="text-sm text-gray">{service.shortDesc}</p>
                      </div>
                    </div>
                    <HiChevronDown
                      className={`flex-shrink-0 text-2xl text-primary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Accordion content with image */}
                  <div
                    className="accordion-panel"
                    data-open={isOpen}
                  >
                    <div>
                      <div className="grid gap-6 px-5 pb-6 sm:px-6 lg:grid-cols-[1fr_350px]">
                        {/* Features */}
                        <div>
                          <ul className="space-y-3">
                            {service.features.map((feature, j) => (
                              <li
                                key={feature}
                                className="flex items-start gap-3"
                                style={isOpen ? { animation: "tabFadeIn 0.35s ease-out forwards", animationDelay: `${j * 0.08}s`, opacity: 0 } : undefined}
                              >
                                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                                <span className="text-dark leading-relaxed">
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>

                          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <a
                              href="#avaliacao"
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Pedir proposta personalizada
                            </a>
                            <a
                              href="#avaliacao"
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-secondary transition-all hover:border-primary hover:text-primary"
                            >
                              Falar com especialista
                            </a>
                          </div>
                        </div>

                        {/* Image */}
                        <div className={`relative hidden lg:block overflow-hidden rounded-2xl aspect-[3/2] ${service.imageBg}`}>
                          <Image
                            src={service.image}
                            alt={service.title}
                            fill
                            sizes="350px"
                            className={`${service.imageFit === "contain" ? "object-contain p-2" : "object-cover"} object-center rounded-2xl`}
                            quality={80}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
