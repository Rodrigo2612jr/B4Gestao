"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { HiX, HiChevronLeft, HiChevronRight } from "react-icons/hi";

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
    image: "/images/sectors/tecnologia-v2.jpg",
    desc: "Ergonomia em escritório, riscos psicossociais e saúde mental.",
    examples: "Startups, software houses, empresas de TI",
  },
  {
    name: "Varejo",
    image: "/images/sectors/varejo.jpg",
    desc: "Alta rotatividade, jornadas variadas, ergonomia e riscos operacionais.",
    examples: "Redes de lojas, supermercados, e-commerce, franquias",
  },
  {
    name: "Agropecuário",
    image: "/images/sectors/agropecuario-v3.jpg",
    desc: "NR-31, exposição a agrotóxicos, ergonomia rural e segurança em máquinas agrícolas.",
    examples: "Fazendas, cooperativas, agroindústrias, frigoríficos",
  },
];

export default function ClientLogos() {
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const closeModal = useCallback(() => setActiveModal(null), []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("button")?.offsetWidth ?? 300;
    el.scrollBy({ left: dir === "left" ? -cardWidth - 16 : cardWidth + 16, behavior: "smooth" });
  };

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
    <section className="bg-secondary py-12 lg:py-20" aria-label="Segmentos atendidos">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <FadeIn className="text-center mb-10">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-light">
            Segmentos
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Setores onde a B4{" "}
            <span className="text-primary-light">já atuou</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Cada setor tem suas particularidades. A B4 entende as NRs
            específicas e os riscos reais de cada operação.
          </p>
        </FadeIn>

        {/* Carousel container */}
        <div className="relative">
          {/* Arrow left */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-secondary shadow-lg transition-all hover:bg-white hover:scale-110 lg:-left-5"
              aria-label="Anterior"
            >
              <HiChevronLeft className="text-xl" />
            </button>
          )}

          {/* Arrow right */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-secondary shadow-lg transition-all hover:bg-white hover:scale-110 lg:-right-5"
              aria-label="Próximo"
            >
              <HiChevronRight className="text-xl" />
            </button>
          )}

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:gap-5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {segments.map((seg, i) => (
              <FadeIn key={seg.name} delay={i * 0.06} animation="slide-up" className="flex-shrink-0 snap-start">
                <button
                  onClick={() => setActiveModal(i)}
                  className="group relative block w-[260px] overflow-hidden rounded-2xl aspect-[4/3] text-left sm:w-[300px] lg:w-[320px]"
                  aria-label={`Ver detalhes do setor ${seg.name}`}
                >
                  {/* Background image */}
                  <Image
                    src={seg.image}
                    alt={seg.name}
                    fill
                    sizes="320px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                    quality={80}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/40 to-transparent transition-all group-hover:from-primary/80 group-hover:via-primary/30" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
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
              </FadeIn>
            ))}
          </div>

          {/* Scroll indicators */}
          <div className="mt-4 flex justify-center gap-1.5">
            {segments.map((seg, i) => (
              <button
                key={seg.name}
                onClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  const card = el.children[i] as HTMLElement;
                  card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className="h-1.5 w-6 rounded-full bg-white/20 transition-all hover:bg-primary-light"
                aria-label={`Ir para ${seg.name}`}
              />
            ))}
          </div>
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
