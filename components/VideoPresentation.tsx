"use client";

import { useState } from "react";
import Image from "next/image";
import { HiOutlinePlay } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import FadeIn from "@/components/FadeIn";
import { WHATSAPP_URL } from "@/lib/constants";

// TODO: Quando o cliente enviar o vídeo, substituir null pela URL do YouTube
// Exemplo: "https://www.youtube.com/embed/XXXXX"
const VIDEO_URL: string | null = null;

// TODO: Substituir por thumbnail real do vídeo ou imagem institucional
// Ideal: 1280x720px, equipe em ação ou escritório
const THUMBNAIL_SRC = "/images/reports-review.jpg";

export default function VideoPresentation() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="apresentacao" className="relative overflow-hidden bg-secondary py-20 lg:py-28">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          {/* Left — Text */}
          <FadeIn direction="left">
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-light">
              Conheça a B4
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-white lg:text-4xl">
              Veja como a B4 trabalha{" "}
              <span className="text-primary-light">na prática</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/85">
              Não é teoria. Mostramos como nossa equipe conduz cada etapa
              do diagnóstico ao plano de ação, para que a sua empresa
              tenha SST que funciona de verdade.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Equipe multidisciplinar com décadas de experiência",
                "Metodologia própria, testada em centenas de projetos",
                "Resultados mensuráveis desde o primeiro mês",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <div className="h-2 w-2 rounded-full bg-primary-light" />
                  </div>
                  <span className="text-sm text-white/85">{item}</span>
                </div>
              ))}
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaWhatsapp className="text-lg" aria-hidden="true" />
              Falar com a equipe
            </a>
          </FadeIn>

          {/* Right — Video / Thumbnail */}
          <FadeIn direction="right" delay={0.15}>
            <div className="relative">
              {/* Decorative glow */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />

              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
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
                    aria-label={VIDEO_URL ? "Reproduzir vídeo de apresentação da B4 Gestão" : "Vídeo institucional da B4 Gestão"}
                  >
                    {/* Thumbnail image */}
                    <Image
                      src={THUMBNAIL_SRC}
                      alt="B4 Gestão Ocupacional - Equipe em ação"
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      quality={85}
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-secondary/20 to-transparent" />

                    {/* Play button — only if video URL exists */}
                    {VIDEO_URL && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 shadow-2xl shadow-primary/30 transition-all group-hover:scale-110 group-hover:bg-primary group-active:scale-95">
                          <HiOutlinePlay className="ml-1 text-4xl text-white" />
                        </div>
                      </div>
                    )}

                    {/* Bottom info bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary/90 to-transparent p-6 pt-12">
                      <p className="text-lg font-semibold text-white">
                        B4 Gestão Ocupacional
                      </p>
                      <p className="mt-1 text-sm text-white/80">
                        {VIDEO_URL
                          ? "Clique para assistir"
                          : "SST com profundidade técnica e resultado prático"}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
