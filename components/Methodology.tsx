import { FaWhatsapp } from "react-icons/fa";
import FadeIn from "@/components/FadeIn";
import TextReveal from "@/components/TextReveal";
import { WHATSAPP_URL } from "@/lib/constants";
import {
  HiOutlineSearchCircle,
  HiOutlineDocumentReport,
  HiOutlineClipboardList,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
} from "react-icons/hi";

const steps = [
  {
    step: 1,
    icon: HiOutlineSearchCircle,
    title: "Diagnóstico Profissional",
    desc: "Mapeamento dos fatores psicossociais por área, função e GHE usando metodologias reconhecidas. Nada de questionário genérico.",
  },
  {
    step: 2,
    icon: HiOutlineDocumentReport,
    title: "Integração ao PGR/GRO",
    desc: "Classificação de probabilidade x severidade conforme NR-01, integrada ao seu programa de gerenciamento. Tudo rastreável.",
  },
  {
    step: 3,
    icon: HiOutlineClipboardList,
    title: "Plano de Ação que Sai do Papel",
    desc: "Ações práticas e priorizadas por impacto e viabilidade. Cada ação tem responsável, prazo e indicador de acompanhamento.",
  },
  {
    step: 4,
    icon: HiOutlineAcademicCap,
    title: "Capacitação de Lideranças",
    desc: "Treinamento prático para líderes: como identificar sinais, reorganizar o trabalho e agir antes que o problema cresça.",
  },
  {
    step: 5,
    icon: HiOutlineChartBar,
    title: "Monitoramento Contínuo",
    desc: "Indicadores, revisões periódicas e documentação em dia. Se a fiscalização bater, você está preparado.",
  },
];

export default function Methodology() {
  return (
    <section id="nr01" className="relative overflow-hidden bg-secondary py-12 lg:py-20">
      {/* Shape divider top */}
      <div className="shape-divider-top">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            className="fill-white"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <FadeIn animation="blur" className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
            </span>
            NR-01 em vigor | Adeque-se antes da fiscalização
          </span>
          <TextReveal className="mt-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Metodologia em 5 Passos para Riscos Psicossociais
          </TextReveal>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Cada etapa passa pela mão de engenheiros e psicólogos
            com experiência real.{" "}
            <strong className="text-white/90">
              Nada automatizado.
            </strong>
          </p>
        </FadeIn>

        {/* Timeline */}
        <div className="relative mt-10 lg:mt-14">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 hidden w-0.5 bg-primary/30 lg:left-1/2 lg:block" />

          <div className="space-y-6 lg:space-y-10">
            {steps.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.1} className={`relative flex flex-col lg:flex-row lg:items-center ${
                  i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}>
                {/* Content card */}
                <div
                  className={`ml-16 lg:ml-0 lg:w-[calc(50%-40px)] ${
                    i % 2 === 0 ? "lg:pr-8 lg:text-right" : "lg:pl-8"
                  }`}
                >
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-primary/30">
                    <div
                      className={`flex items-center gap-3 ${
                        i % 2 === 0
                          ? "lg:flex-row-reverse lg:justify-start"
                          : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary-light">
                        <step.icon className="text-xl" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/90">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="absolute left-4 top-6 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg shadow-primary/30 lg:static lg:mx-auto lg:h-10 lg:w-10 lg:text-sm">
                  {step.step}
                </div>

                {/* Spacer */}
                <div className="hidden lg:block lg:w-[calc(50%-40px)]" />
              </FadeIn>
            ))}
          </div>
        </div>

        {/* CTA */}
        <FadeIn className="mt-10 text-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-base font-bold text-secondary shadow-lg transition-all hover:bg-accent-dark hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaWhatsapp className="text-xl" aria-hidden="true" />
            Quero adequar minha empresa
          </a>
          <p className="mt-3 text-sm text-white/90">
            Fale direto com quem vai conduzir o projeto.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
