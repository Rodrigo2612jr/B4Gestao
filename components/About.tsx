"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import TextReveal from "@/components/TextReveal";
import {
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineClock,
} from "react-icons/hi";
import { COMPANY } from "@/lib/constants";

const highlights = [
  {
    icon: HiOutlineAcademicCap,
    text: "Engenheiros de Segurança, Psicólogos e Médicos do Trabalho com mais de 20 anos de experiência",
  },
  {
    icon: HiOutlineLightningBolt,
    text: "PGR — entrega rápida sem pular etapas",
  },
  {
    icon: HiOutlineClock,
    text: "PCMSO — entrega em 1 dia após a conclusão do PGR",
  },
  {
    icon: HiOutlineCheckCircle,
    text: "Clínicas credenciadas em todo o Brasil com exames in-company em SP",
  },
  {
    icon: HiOutlineShieldCheck,
    text: "Bagagem previdenciária para orientar em nexo causal, FAP e afastamentos",
  },
];

export default function About() {
  return (
    <section id="quem-somos" className="bg-white py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-8 lg:gap-12 lg:grid-cols-2">
          {/* Left — Image */}
          <FadeIn direction="left" className="relative">
            <div className="relative overflow-hidden rounded-3xl aspect-[3/2] bg-primary/5">
              <Image
                src="/images/about-team.png"
                alt="Equipe multidisciplinar da B4 Gestão em reunião estratégica"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center rounded-3xl"
                quality={90}
              />
              {/* Overlay card */}
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-primary-dark/90 backdrop-blur-sm p-5 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-light">
                      {COMPANY.teamExperienceYears}+
                    </div>
                    <div className="mt-1 text-xs text-white/90">
                      Anos de experiência
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      Nacional
                    </div>
                    <div className="mt-1 text-xs text-white/90">
                      Cobertura completa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Right — Text */}
          <FadeIn direction="right" delay={0.1}>
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Quem Somos
            </span>
            <TextReveal className="mt-4 text-2xl font-bold text-secondary sm:text-3xl lg:text-4xl">
              Consultoria especializada em Saúde e Segurança do Trabalho
            </TextReveal>
            <p className="mt-6 text-lg leading-relaxed text-gray">
              A B4 nasceu da frustração com plataformas de SST que entregam
              documentos genéricos e deixam a empresa na mão. Aqui, cada
              projeto é pensado para a realidade da sua operação, com
              profissionais que entendem do assunto de verdade.
            </p>

            {/* Highlighted callout */}
            <div className="mt-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary p-5">
              <p className="text-base font-medium text-secondary leading-relaxed">
                Nossa equipe tem{" "}
                <span className="bg-primary/10 px-1.5 py-0.5 rounded font-bold text-primary">
                  bagagem previdenciária de verdade
                </span>.
                Na hora de decidir sobre nexo causal, FAP ou afastamento,
                você sabe exatamente o que pode e o que não pode fazer.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {highlights.map((item) => (
                <motion.div key={item.text} whileHover={{ x: 4 }} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <item.icon className="text-lg" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-dark leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>

          </FadeIn>
        </div>
      </div>
    </section>
  );
}
