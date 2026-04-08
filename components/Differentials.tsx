import FadeIn from "@/components/FadeIn";
import {
  HiOutlineClock,
  HiOutlineBadgeCheck,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { COMPANY } from "@/lib/constants";

const differentials = [
  {
    icon: HiOutlineUserGroup,
    title: "Equipe",
    highlight: "Multidisciplinar",
    desc: `Uma equipe que já passou por auditoria, perícia e processo. Décadas de mercado não se compram.`,
    gradient: "from-primary/10 to-primary-light/5",
  },
  {
    icon: HiOutlineClock,
    title: "Entrega em",
    highlight: `${COMPANY.pgrDeliveryDays} Dias`,
    desc: "PGR e PCMSO prontos em até 7 dias úteis. Rápido sim, mas sem pular etapas.",
    gradient: "from-accent/10 to-accent/5",
  },
  {
    icon: HiOutlineBadgeCheck,
    title: "Conformidade",
    highlight: "Real",
    desc: "Sem diagnóstico genérico. Analisamos o que acontece na sua operação antes de propor qualquer solução.",
    gradient: "from-primary/10 to-secondary/5",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Segurança",
    highlight: "Jurídica",
    desc: "Nexo causal, FAP, defesa administrativa. Nossa equipe domina esses temas há décadas.",
    gradient: "from-secondary/10 to-primary/5",
  },
];

export default function Differentials() {
  return (
    <section id="diferenciais" className="bg-light py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Diferenciais
          </span>
          <h2 className="mt-4 text-3xl font-bold text-secondary lg:text-4xl">
            Por que empresas escolhem a{" "}
            <span className="text-primary">B4 Gestão</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray">
            SST não se resolve com software. Exige profissionais experientes
            que conhecem a legislação e entendem a sua realidade.
          </p>
        </FadeIn>

        {/* Cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {differentials.map((diff, i) => (
            <FadeIn key={diff.title} delay={i * 0.1} animation="slide-up" className={`group rounded-2xl bg-gradient-to-br ${diff.gradient} border border-gray-100 p-6 transition-all hover:-translate-y-2 hover:shadow-xl`}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:shadow-lg">
                <diff.icon className="text-2xl" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-secondary">
                {diff.title}{" "}
                <span className="text-primary">{diff.highlight}</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray">
                {diff.desc}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
