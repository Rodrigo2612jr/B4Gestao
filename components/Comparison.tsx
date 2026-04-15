"use client";

import FadeIn from "@/components/FadeIn";
import TiltCard from "@/components/TiltCard";
import { HiX, HiCheck } from "react-icons/hi";
import { WHATSAPP_URL } from "@/lib/constants";

const dontDo = [
  "Plataformas que geram documentos genéricos automaticamente",
  "Metodologias rasas, sem respaldo técnico",
  "Diagnósticos que ignoram o contexto da operação",
  "Planos bonitos que nunca saem do papel",
  "Compliance apenas para constar",
  "Atendimento por chatbot, sem ninguém de verdade",
];

const doItems = [
  "Diagnóstico feito por especialistas com décadas de experiência",
  "Metodologias internacionais. Não inventamos a roda",
  "Entendemos o contexto da operação antes de montar qualquer plano",
  "Cada ação tem dono, prazo e indicador",
  "Documentação que sustenta auditoria e fiscalização",
  "Atendimento direto com profissionais experientes",
];

export default function Comparison() {
  return (
    <section className="relative overflow-hidden bg-white py-12 lg:py-20">
      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <FadeIn className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Por que a B4
          </span>
          <h2 className="mt-4 text-2xl font-bold text-secondary sm:text-3xl lg:text-4xl">
            O que muda quando você{" "}
            <span className="text-primary">contrata a B4</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray">
            Veja a diferença entre o que o mercado costuma entregar
            e o que a B4 faz.
          </p>
        </FadeIn>

        {/* Asymmetric grid - B4 side slightly larger */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Don't - subtle tilt */}
          <FadeIn direction="left">
            <div className="group rounded-2xl border border-red-100 bg-red-50/60 p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 lg:rotate-[-0.5deg] lg:hover:rotate-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
                  <HiX className="text-xl" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-red-700">
                  Abordagem genérica do mercado
                </h3>
              </div>
              <ul className="space-y-4">
                {dontDo.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                      <HiX className="text-sm" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-dark leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          {/* Do - elevated with TiltCard */}
          <FadeIn direction="right">
            <TiltCard className="rounded-2xl">
              <div className="rounded-2xl bg-gradient-to-br from-primary-dark to-primary p-8 shadow-2xl lg:rotate-[0.5deg] lg:hover:rotate-0 transition-transform">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                    <HiCheck className="text-xl" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    A entrega da B4 Gestão
                  </h3>
                </div>
                <ul className="space-y-4">
                  {doItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                        <HiCheck className="text-sm" aria-hidden="true" />
                      </div>
                      <span className="text-sm text-white/90 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-accent-dark hover:shadow-lg"
                >
                  Quero essa entrega para minha empresa
                </a>
                <p className="mt-2 text-xs text-white/70">Resposta em até 24h.</p>
              </div>
            </TiltCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
