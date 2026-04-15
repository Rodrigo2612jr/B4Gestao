"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import { WHATSAPP_URL } from "@/lib/constants";
import { FaWhatsapp, FaStar } from "react-icons/fa";

const testimonials = [
  {
    role: "Diretor de RH",
    sector: "Setor Industrial",
    text: "Tínhamos o PGR na gaveta e zero gestão de riscos psicossociais. A B4 montou tudo em menos de 30 dias e hoje a gente sabe exatamente onde estão os pontos críticos.",
    rating: 5,
    initials: "RH",
  },
  {
    role: "Gerente de SESMT",
    sector: "Setor Logístico",
    text: "O diferencial é o atendimento. Não é um software que cospe um documento. É gente que entende do assunto e fala a nossa língua.",
    rating: 5,
    initials: "GS",
  },
  {
    role: "CEO",
    sector: "Setor de Tecnologia",
    text: "Depois que a B4 assumiu a gestão dos afastamentos por CID F, nosso custo com absenteísmo caiu significativamente. O retorno ao trabalho ficou mais estruturado.",
    rating: 5,
    initials: "CE",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="relative overflow-hidden bg-secondary py-12 lg:py-20">
      {/* Noise texture */}
      <div className="noise-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
            Resultados reais
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            O que nossos clientes{" "}
            <span className="text-accent">dizem</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            Resultados concretos de empresas que confiaram na B4
            para cuidar da saúde e segurança do trabalho.
          </p>
        </FadeIn>

        {/* Testimonials - horizontal scroll on mobile, grid on desktop */}
        <div className="mt-10 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 scrollbar-hide">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="group flex-shrink-0 w-[85vw] snap-center md:w-auto rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:bg-white/[0.08]"
            >
              {/* Stars with micro-animation */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <motion.span
                    key={j}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: i * 0.15 + j * 0.05 + 0.3 }}
                  >
                    <FaStar className="text-accent text-sm" aria-hidden="true" />
                  </motion.span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm leading-relaxed text-white/90">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/10 shadow-lg transition-transform group-hover:scale-110">
                  <span className="text-sm font-bold text-white">{t.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.role}</p>
                  <p className="text-xs text-white/50">{t.sector}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <FadeIn className="mt-6 text-center">
          <p className="text-xs text-white/40">
            * Nomes preservados a pedido dos clientes. Segmento e cargo reais.
          </p>
        </FadeIn>

        {/* CTA */}
        <FadeIn className="mt-12 text-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-secondary shadow-lg transition-all hover:bg-accent-dark hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaWhatsapp className="text-xl" aria-hidden="true" />
            Quero esses resultados na minha empresa
          </a>
          <p className="mt-3 text-sm text-white/50">Sem compromisso. Conversa direta com quem entende.</p>
        </FadeIn>
      </div>
    </section>
  );
}
