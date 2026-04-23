"use client";

import { useState } from "react";
import Image from "next/image";
import { HiChevronDown } from "react-icons/hi";
import { FaWhatsapp, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import FadeIn from "@/components/FadeIn";
import { CONTACT } from "@/lib/constants";

const faqs = [
  {
    question: "O que muda com a NR-01 em relação aos riscos psicossociais?",
    answer:
      "A NR-01 agora exige que toda empresa mapeie e trate riscos psicossociais no PGR/GRO. Estresse, assédio, sobrecarga, clima organizacional... tudo isso passou a ter o mesmo peso dos riscos físicos e químicos. Quem não fez, está vulnerável à fiscalização.",
  },
  {
    question: "Minha empresa é pequena. Preciso me preocupar com a NR-01?",
    answer:
      "Sim. A regra se aplica a qualquer empresa com pelo menos 1 funcionário registrado. A partir de 15 colaboradores, a complexidade aumenta e uma gestão estruturada faz diferença. A B4 atende empresas de todos os portes.",
  },
  {
    question: "Qual a diferença entre a B4 e plataformas automatizadas de SST?",
    answer:
      "Plataformas geram documentos padronizados automaticamente. A B4 tem uma equipe experiente que analisa a situação de verdade, entende o contexto e monta um plano que funciona na prática.",
  },
  {
    question: "Em quanto tempo vocês entregam o PGR e PCMSO?",
    answer:
      "O PGR é entregue de forma rápida, sem pular etapas. O PCMSO fica pronto em 1 dia após a conclusão do PGR. Trabalhamos com agilidade, sem comprometer a qualidade técnica.",
  },
  {
    question: "Vocês atendem em todo o Brasil?",
    answer:
      "Sim. Temos cobertura nacional com clínicas credenciadas em todo o território brasileiro. Realizamos PGR, PCMSO, AEP e AET conforme NR-17. Para São Paulo e Grande São Paulo, também realizamos exames in-company diretamente na sua empresa.",
  },
  {
    question: "O que está incluso na gestão de riscos psicossociais da B4?",
    answer:
      "Seguimos 5 etapas: avaliação por área, GHE e função, integração ao PGR com classificação de severidade, plano de ação prático com responsáveis e prazos, capacitação de líderes e monitoramento contínuo. Tudo com metodologias reconhecidas e documentação.",
  },
  {
    question: "Vocês oferecem suporte psicológico para colaboradores?",
    answer:
      "Sim. Oferecemos teleconsultas com psicólogos, SOS Psicológico 24/7 para urgências, brigadas de saúde mental e capacitação de líderes. Tudo acompanhado de relatórios com indicadores de engajamento e redução de custos.",
  },
  {
    question: "Quanto custa contratar a B4?",
    answer:
      "Trabalhamos com propostas sob medida. Fale com um especialista.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-white py-12 lg:py-20">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-0 h-96 w-[600px] rounded-full bg-primary/[0.03] blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] items-start">
          {/* Left — Header + CTA */}
          <FadeIn direction="left" className="lg:sticky lg:top-28">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Tire suas dúvidas
            </span>
            <h2 className="mt-4 text-2xl font-bold text-secondary sm:text-3xl lg:text-4xl">
              Perguntas Frequentes
            </h2>
            <p className="mt-3 text-gray leading-relaxed">
              Tudo que você precisa saber sobre a NR-01, nossos serviços e como
              podemos ajudar sua empresa.
            </p>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary-dark to-primary p-6 shadow-lg">
              <p className="text-lg font-medium text-white">
                Ainda tem dúvidas?
              </p>
              <p className="mt-1 text-sm text-white/70">
                Fale direto com um especialista. Sem compromisso.
              </p>
              <a
                href="#avaliacao"
                className="mt-4 flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-accent-dark hover:shadow-lg"
              >
                <FaWhatsapp className="text-lg" aria-hidden="true" />
                Falar com especialista
              </a>
              <div className="mt-4 flex gap-3">
                <a
                  href={CONTACT.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-white/10 hover:border-white/40"
                  aria-label="Instagram da B4 Gestão"
                >
                  <FaInstagram className="text-base" aria-hidden="true" />
                  Instagram
                </a>
                <a
                  href={CONTACT.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-white/10 hover:border-white/40"
                  aria-label="LinkedIn da B4 Gestão"
                >
                  <FaLinkedinIn className="text-base" aria-hidden="true" />
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Image */}
            <div className="relative mt-8 overflow-hidden rounded-2xl hidden lg:block aspect-[3/2]">
              <Image
                src="/images/team-meeting.jpg"
                alt="Equipe B4 em reunião estratégica"
                fill
                sizes="50vw"
                className="object-cover object-center rounded-2xl"
                quality={80}
              />
            </div>
          </FadeIn>

          {/* Right — Accordion */}
          <FadeIn direction="right">
            <div className="space-y-3" role="region" aria-label="Perguntas frequentes">
              {faqs.map((faq, i) => {
                const isOpen = openIndex === i;
                const headingId = `faq-heading-${i}`;
                const panelId = `faq-panel-${i}`;

                return (
                  <div
                    key={i}
                    className={`rounded-xl border overflow-hidden transition-colors ${
                      isOpen
                        ? "border-primary/30 bg-white shadow-md"
                        : "border-gray-100 bg-white/80"
                    }`}
                  >
                    <h3>
                      <button
                        id={headingId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        className="flex w-full items-center justify-between px-6 py-5 text-left"
                      >
                        <span className="pr-4 text-sm font-semibold text-secondary lg:text-base">
                          {faq.question}
                        </span>
                        <HiChevronDown
                          className={`flex-shrink-0 text-lg text-primary transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </h3>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headingId}
                      className="accordion-panel"
                      data-open={isOpen}
                    >
                      <div>
                        <div className="px-6 pb-5 text-sm leading-relaxed text-gray">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
