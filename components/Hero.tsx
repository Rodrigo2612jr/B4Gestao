"use client";

import { useRef } from "react";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineShieldCheck, HiOutlineClock, HiOutlineGlobeAlt, HiOutlineUserGroup } from "react-icons/hi";
import { motion, useScroll, useTransform } from "framer-motion";
import { WHATSAPP_URL } from "@/lib/constants";

const trustBadges = [
  { icon: HiOutlineUserGroup, text: "Equipe multidisciplinar" },
  { icon: HiOutlineClock, text: "PGR em até 7 dias" },
  { icon: HiOutlineGlobeAlt, text: "Cobertura nacional" },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background image with parallax */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image
          src="/images/office-hero.png"
          alt="Escritório moderno com profissionais de SST"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
          quality={85}
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/90 via-secondary/80 to-secondary/90" />

      {/* Floating animated elements - hidden on mobile for performance */}
      <motion.div
        className="hidden md:flex absolute top-[20%] left-[10%] h-10 w-10 items-center justify-center rounded-xl bg-accent/10 backdrop-blur-sm border border-accent/20"
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <HiOutlineShieldCheck className="text-lg text-accent" />
      </motion.div>
      <motion.div
        className="hidden md:flex absolute top-[30%] right-[12%] h-8 w-8 items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20"
        animate={{ y: [0, -20, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        aria-hidden="true"
      >
        <HiOutlineClock className="text-sm text-primary-light" />
      </motion.div>
      <motion.div
        className="hidden md:flex absolute top-[45%] right-[8%] h-7 w-7 items-center justify-center rounded-full bg-accent/10 backdrop-blur-sm border border-accent/10"
        animate={{ y: [0, -18, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        aria-hidden="true"
      >
        <HiOutlineGlobeAlt className="text-xs text-accent/70" />
      </motion.div>
      {/* Small floating dots - desktop only */}
      <motion.div className="hidden md:block absolute top-[15%] right-[30%] h-2 w-2 rounded-full bg-accent/30" animate={{ y: [0, -25, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }} aria-hidden="true" />
      <motion.div className="hidden md:block absolute bottom-[35%] right-[25%] h-1.5 w-1.5 rounded-full bg-primary-light/40" animate={{ y: [0, -20, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.2 }} aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-32 lg:px-8 text-center">
        {/* Urgency badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
          </span>
          NR-01 em vigor | Sua empresa precisa se adequar
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-[3.8rem]"
        >
          NR-01 exige gestão de
          <br />
          <span className="bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
            riscos psicossociais.
          </span>
          <br />
          Sua empresa está pronta?
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl"
        >
          Sua operação tem riscos que você ainda não mapeou. A B4 vai
          além do checklist. Entregamos{" "}
          <strong className="text-white">SST que funciona</strong> na prática.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center"
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-accent px-10 py-4 text-lg font-bold text-secondary shadow-lg shadow-accent/25 transition-all hover:bg-accent-dark hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaWhatsapp className="text-2xl transition-transform group-hover:scale-110" aria-hidden="true" />
            Falar com especialista
          </a>
          <p className="mt-3 text-sm text-white/70">
            Atendimento direto. Sem chatbot. Sem compromisso.
          </p>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-wrap justify-center gap-6"
        >
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.text}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white/80 transition-colors hover:border-accent/30"
            >
              <badge.icon className="text-accent" aria-hidden="true" />
              <span>{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Shape divider */}
      <div className="shape-divider">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" className="fill-white" opacity=".25" />
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" className="fill-white" opacity=".5" />
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-white" />
        </svg>
      </div>
    </section>
  );
}
