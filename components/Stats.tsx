"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import AnimatedCounter from "./AnimatedCounter";
import { HiOutlinePlay } from "react-icons/hi";
import {
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { COMPANY } from "@/lib/constants";

// TODO: Quando o cliente enviar o vídeo, substituir null pela URL do YouTube
const VIDEO_URL: string | null = null;
const THUMBNAIL_SRC = "/images/office-hero.png";

const stats = [
  {
    icon: HiOutlineUserGroup,
    value: COMPANY.teamExperienceYears,
    suffix: "+",
    label: "anos de experiência",
    detail: "Engenheiros, Psicólogos e Médicos",
  },
  {
    icon: HiOutlineClock,
    value: COMPANY.pgrDeliveryDays,
    suffix: " dias",
    label: "entrega de PGR e PCMSO",
    detail: "Rápido, sem pular etapas",
  },
  {
    icon: HiOutlineGlobeAlt,
    value: 27,
    suffix: " UFs",
    label: "cobertura nacional",
    detail: "Clínicas em todo o Brasil",
  },
  {
    icon: HiOutlineShieldCheck,
    value: 100,
    suffix: "%",
    label: "conformidade NR-01",
    detail: "eSocial SST sempre em dia",
  },
];

export default function Stats() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="relative -mt-1 overflow-hidden bg-gradient-to-br from-primary to-primary-dark py-16 lg:py-20" aria-label="Números da B4 Gestão">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2038.59l2.83-2.83%201.41%201.41L1.41%2040H0v-1.41zM0%201.4l2.83%202.83%201.41-1.41L1.41%200H0v1.41zM38.59%2040l-2.83-2.83%201.41-1.41L40%2038.59V40h-1.41zM40%201.41l-2.83%202.83-1.41-1.41L38.59%200H40v1.41zM20%2018.6l2.83-2.83%201.41%201.41L21.41%2020l2.83%202.83-1.41%201.41L20%2021.41l-2.83%202.83-1.41-1.41L18.59%2020l-2.83-2.83%201.41-1.41L20%2018.59z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] items-center">
          {/* Left: Video */}
          <FadeIn direction="left">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {playing && VIDEO_URL ? (
                <div className="aspect-video">
                  <iframe
                    src={`${VIDEO_URL}?autoplay=1&rel=0`}
                    title="Apresentação B4 Gestão Ocupacional"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <button
                  onClick={() => VIDEO_URL && setPlaying(true)}
                  className={`relative aspect-video w-full overflow-hidden ${VIDEO_URL ? "cursor-pointer group" : "cursor-default"}`}
                  aria-label={VIDEO_URL ? "Reproduzir vídeo institucional" : "Vídeo institucional da B4 Gestão"}
                >
                  <Image
                    src={THUMBNAIL_SRC}
                    alt="B4 Gestão Ocupacional"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    quality={85}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-secondary/20 to-transparent" />

                  {VIDEO_URL && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl transition-all group-hover:scale-110 group-hover:bg-white group-active:scale-95">
                        <HiOutlinePlay className="ml-1 text-3xl text-primary" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary/90 to-transparent p-4 pt-8">
                    <p className="text-sm font-semibold text-white">
                      {VIDEO_URL ? "Clique para assistir" : "Conheça a B4 Gestão Ocupacional"}
                    </p>
                    <p className="mt-0.5 text-xs text-white/70">
                      SST com profundidade técnica e resultado prático
                    </p>
                  </div>
                </button>
              )}
            </div>
          </FadeIn>

          {/* Right: 4 stat blocks */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-5 text-center shadow-sm transition-shadow hover:shadow-xl hover:bg-white/15"
              >
                <div className="absolute -inset-1 rounded-2xl bg-white/5 opacity-0 blur-xl transition-opacity group-hover:opacity-100" aria-hidden="true" />
                <div className="relative z-10">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white transition-all group-hover:bg-white group-hover:text-primary group-hover:shadow-lg">
                    <stat.icon className="text-2xl" aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-extrabold text-white lg:text-3xl">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
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
