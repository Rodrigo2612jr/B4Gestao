"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import TiltCard from "@/components/TiltCard";
import { HiX } from "react-icons/hi";

const segments = [
  {
    name: "Indústria",
    image: "/images/sectors/industria.jpg",
    desc: "Linhas de produção, NRs específicas, CIPA e gestão de riscos industriais.",
    examples: "Metalurgia, automotivo, alimentos, químico, têxtil",
  },
  {
    name: "Logística",
    image: "/images/sectors/logistica.jpg",
    desc: "Armazéns, frotas, ergonomia e segurança em operações de transporte.",
    examples: "Transportadoras, centros de distribuição, operadores logísticos",
  },
  {
    name: "Construção Civil",
    image: "/images/sectors/construcao.jpg",
    desc: "NR-18, trabalho em altura, espaço confinado e gestão de terceiros.",
    examples: "Construtoras, incorporadoras, obras industriais",
  },
  {
    name: "Saúde",
    image: "/images/sectors/saude.jpg",
    desc: "Riscos biológicos, jornadas extensas, saúde mental de profissionais.",
    examples: "Hospitais, clínicas, laboratórios, farmácias",
  },
  {
    name: "Tecnologia",
    image: "/images/sectors/tecnologia.jpg",
    desc: "Ergonomia em escritório, riscos psicossociais e saúde mental.",
    examples: "Startups, software houses, empresas de TI",
  },
  {
    name: "Varejo",
    image: "/images/sectors/varejo.jpg",
    desc: "Alta rotatividade, jornadas variadas, ergonomia e riscos operacionais.",
    examples: "Redes de lojas, supermercados, e-commerce, franquias",
  },
];

export default function ClientLogos() {
  const [activeModal, setActiveModal] = useState<number | null>(null);

  const closeModal = useCallback(() => setActiveModal(null), []);

  // Close modal on Escape
  useEffect(() => {
    if (activeModal === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activeModal, closeModal]);

  return (
    <section className="bg-secondary py-20 lg:py-28" aria-label="Segmentos atendidos">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <FadeIn className="text-center mb-14">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-light">
            Segmentos
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white lg:text-4xl">
            Setores onde a B4{" "}
            <span className="text-primary-light">já atuou</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Cada setor tem suas particularidades. A B4 entende as NRs
            específicas e os riscos reais de cada operação.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 lg:gap-6">
          {segments.map((seg, i) => (
            <FadeIn key={seg.name} delay={i * 0.08} animation="slide-up">
              <TiltCard>
              <button
                onClick={() => setActiveModal(i)}
                className="group relative block w-full overflow-hidden rounded-2xl aspect-[4/3] text-left"
                aria-label={`Ver detalhes do setor ${seg.name}`}
              >
                {/* Background image */}
                <Image
                  src={seg.image}
                  alt={seg.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  quality={75}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/40 to-transparent transition-all group-hover:from-primary/80 group-hover:via-primary/30" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    {seg.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/70 line-clamp-2 sm:text-sm">
                    {seg.desc}
                  </p>
                  <span className="mt-3 inline-flex items-center text-xs font-medium text-primary-light opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                    Ver detalhes →
                  </span>
                </div>
              </button>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Modal */}
      {activeModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do setor ${segments[activeModal].name}`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-[fadeInUp_0.3s_ease-out]">
            {/* Image header */}
            <div className="relative h-48 sm:h-56">
              <Image
                src={segments[activeModal].image}
                alt={segments[activeModal].name}
                fill
                sizes="500px"
                className="object-cover object-center"
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <h3 className="text-2xl font-bold text-white">
                  {segments[activeModal].name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
                aria-label="Fechar"
              >
                <HiX className="text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-dark leading-relaxed">
                {segments[activeModal].desc}
              </p>
              <div className="mt-4 rounded-xl bg-light p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  Exemplos de empresas atendidas
                </p>
                <p className="text-sm text-gray">
                  {segments[activeModal].examples}
                </p>
              </div>
              <a
                href="#diagnostico"
                onClick={() => setActiveModal(null)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
              >
                Solicitar diagnóstico para este setor
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
