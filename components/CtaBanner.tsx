"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineShieldCheck, HiOutlineLightningBolt, HiOutlineClipboardCheck } from "react-icons/hi";
import { WHATSAPP_URL } from "@/lib/constants";

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-12 lg:py-16">
      {/* Background image */}
      <Image
        src="/images/handshake.jpg"
        alt="Parceria B4 Gestão"
        fill
        sizes="100vw"
        className="object-cover object-center"
        quality={80}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-primary/70 to-secondary/90" />

      {/* Floating micro-icons */}
      <motion.div
        className="hidden md:flex absolute top-[20%] left-[8%] h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm"
        animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <HiOutlineShieldCheck className="text-sm text-white/50" />
      </motion.div>
      <motion.div
        className="hidden md:flex absolute bottom-[25%] right-[10%] h-7 w-7 items-center justify-center rounded-full bg-accent/10 backdrop-blur-sm"
        animate={{ y: [0, -15, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        aria-hidden="true"
      >
        <HiOutlineLightningBolt className="text-xs text-accent/60" />
      </motion.div>
      <motion.div
        className="hidden md:block absolute top-[40%] right-[20%] h-2 w-2 rounded-full bg-accent/30"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center lg:px-8">
        <FadeIn>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Não espere a fiscalização para descobrir o que está faltando.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            Fale conosco e coloque a SST em dia antes que a fiscalização chegue.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-bold text-secondary shadow-xl transition-shadow hover:shadow-2xl"
            >
              <FaWhatsapp className="text-xl text-green-600" aria-hidden="true" />
              Falar com especialista agora
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href="#diagnostico"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Prefiro um diagnóstico gratuito primeiro
            </motion.a>
          </div>
          <p className="mt-4 text-sm text-white/90">
            Resposta em até 24h. Sem compromisso.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
