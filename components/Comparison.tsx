"use client";

import FadeIn from "@/components/FadeIn";
import { motion } from "framer-motion";
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
  "Documentação que aguenta auditoria e fiscalização",
  "Atendimento direto com profissionais experientes",
];

export default function Comparison() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-light via-white to-primary/[0.03] py-20 lg:py-28">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-0 -z-0 h-80 w-80 rounded-full bg-red-50 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-20 right-0 -z-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <FadeIn className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Por que a B4
          </span>
          <h2 className="mt-4 text-3xl font-bold text-secondary lg:text-4xl">
            O que muda quando você{" "}
            <span className="text-primary">contrata a B4</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray">
            Veja a diferença entre o que o mercado costuma entregar
            e o que a B4 faz.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Don't */}
          <FadeIn direction="left" className="group rounded-2xl border border-red-100 bg-white/80 backdrop-blur-sm p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
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
          </FadeIn>

          {/* Do */}
          <FadeIn direction="right" className="group rounded-2xl border border-primary/20 bg-white/80 backdrop-blur-sm p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <HiCheck className="text-xl" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-primary-dark">
                A entrega da B4 Gestão
              </h3>
            </div>
            <ul className="space-y-4">
              {doItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <HiCheck className="text-sm" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-dark leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg"
            >
              Quero essa entrega para minha empresa
            </a>
            <p className="mt-2 text-xs text-gray">Resposta em até 2h úteis.</p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
