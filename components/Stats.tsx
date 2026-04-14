"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import AnimatedCounter from "./AnimatedCounter";
import {
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { COMPANY } from "@/lib/constants";

const stats = [
  {
    icon: HiOutlineShieldCheck,
    value: 100,
    suffix: "%",
    label: "Conformidade ASO",
    detail: "Exames sempre em dia",
  },
  {
    icon: HiOutlineLightningBolt,
    value: null,
    suffix: "",
    label: "Entrega rápida",
    detail: "Mesmo com exames complementares",
  },
  {
    icon: HiOutlineClock,
    value: 1,
    suffix: " dia",
    label: "Entrega do PCMSO",
    detail: "Após conclusão do PGR",
  },
  {
    icon: HiOutlineDocumentText,
    value: 100,
    suffix: "%",
    label: "Conformidade PGR",
    detail: "Rápido, sem pular etapas",
  },
  {
    icon: HiOutlineUserGroup,
    value: COMPANY.teamExperienceYears,
    suffix: "+",
    label: "anos de experiência",
    detail: "Engenheiros, Psicólogos e Médicos",
  },
  {
    icon: HiOutlineGlobeAlt,
    value: 27,
    suffix: " UFs",
    label: "cobertura nacional",
    detail: "Clínicas em todo o Brasil",
  },
];

export default function Stats() {
  return (
    <section className="relative -mt-1 overflow-hidden bg-white py-12 lg:py-16" aria-label="Números da B4 Gestão">

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] items-center">
          {/* Left: Image */}
          <FadeIn direction="left">
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src="/images/office-hero.jpg"
                  alt="B4 Gestão Ocupacional"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-secondary/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary/90 to-transparent p-4 pt-8">
                  <p className="text-sm font-semibold text-white">
                    Conheça a B4 Gestão Ocupacional
                  </p>
                  <p className="mt-0.5 text-xs text-white/70">
                    SST com profundidade técnica e resultado prático
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Right: 6 stat blocks */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-dark to-primary p-5 text-center shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="relative z-10">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white transition-all group-hover:bg-white group-hover:text-primary group-hover:shadow-lg">
                    <stat.icon className="text-2xl" aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-extrabold text-white lg:text-3xl">
                    {stat.value !== null && (
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white">{stat.label}</p>
                  <p className="mt-0.5 text-xs text-white/70">{stat.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
