"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import { WHATSAPP_URL } from "@/lib/constants";
import { FaWhatsapp, FaStar } from "react-icons/fa";

const testimonials = [
  {
    name: "Ricardo Mendes",
    role: "Diretor de RH, Indústria",
    text: "Tínhamos o PGR na gaveta e zero gestão de riscos psicossociais. A B4 montou tudo em menos de 30 dias e hoje a gente sabe exatamente onde estão os pontos críticos.",
    rating: 5,
    photo: "/images/avatars/ricardo.jpg",
  },
  {
    name: "Fernanda Costa",
    role: "Gerente de SESMT, Logística",
    text: "O diferencial é o atendimento. Não é um software que cospe um documento. É gente que entende do assunto e fala a nossa língua.",
    rating: 5,
    photo: "/images/avatars/fernanda.jpg",
  },
  {
    name: "Lucas Ferreira",
    role: "CEO, Tecnologia",
    text: "Depois que a B4 assumiu a gestão dos afastamentos por CID F, nosso custo com absenteísmo caiu significativamente. O retorno ao trabalho ficou mais estruturado.",
    rating: 5,
    photo: "/images/avatars/lucas.jpg",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="relative overflow-hidden bg-secondary py-20 lg:py-28">
      {/* Shape divider top */}
      <div className="shape-divider-top">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            className="fill-light"
          />
        </svg>
      </div>

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-light">
            Resultados reais
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white lg:text-4xl">
            O que nossos clientes{" "}
            <span className="text-primary-light">dizem</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Resultados concretos de empresas que confiaram na B4
            para cuidar da saúde e segurança do trabalho.
          </p>
        </FadeIn>

        {/* Testimonials grid with staggered animation */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 transition-all hover:bg-white/10 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl"
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
              <p className="text-sm leading-relaxed text-white/85">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                <Image
                  src={t.photo}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover object-center shadow-lg transition-transform group-hover:scale-110"
                  quality={85}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/60">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <FadeIn className="mt-6 text-center">
          <p className="text-xs text-white/50">
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
          <p className="mt-3 text-sm text-white/80">Sem compromisso. Conversa direta com quem entende.</p>
        </FadeIn>
      </div>
    </section>
  );
}
