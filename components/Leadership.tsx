import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import {
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { CONTACT, COMPANY, WHATSAPP_URL } from "@/lib/constants";

const credentials = [
  {
    icon: HiOutlineAcademicCap,
    text: "Especialista em Saúde e Segurança do Trabalho",
  },
  {
    icon: HiOutlineBriefcase,
    text: `${COMPANY.teamExperienceYears}+ anos de experiência em gestão ocupacional`,
  },
  {
    icon: HiOutlineShieldCheck,
    text: "Referência em nexo causal e riscos psicossociais",
  },
];

export default function Leadership() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-light via-white to-primary/[0.04] py-20 lg:py-28">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 -z-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-10 left-10 -z-0 h-48 w-48 rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[400px_1fr]">
          {/* Photo */}
          <FadeIn direction="left" className="relative mx-auto max-w-sm lg:mx-0">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              {/* TODO: Substituir por foto real da Liege Alves quando disponível */}
              <Image
                src="/images/consultant-leader.png"
                alt="Liege Alves - Fundadora da B4 Gestão Ocupacional"
                width={800}
                height={1000}
                className="h-auto w-full object-cover"
                quality={85}
              />
            </div>
            {/* Decorative accent */}
            <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-3xl bg-primary/10" />
            {/* Extra decorative element */}
            <div className="absolute -top-3 -left-3 -z-10 h-24 w-24 rounded-2xl bg-accent/20" />
          </FadeIn>

          {/* Content */}
          <FadeIn direction="right">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Quem lidera a B4
            </span>
            <h2 className="mt-4 text-3xl font-bold text-secondary lg:text-4xl">
              Liege Alves
            </h2>
            <p className="mt-1 text-lg font-medium text-primary">
              Fundadora e Diretora Técnica
            </p>

            <p className="mt-6 text-lg leading-relaxed text-gray">
              Liege trabalha com SST há mais de duas décadas. Criou a B4
              porque cansou de ver empresas recebendo{" "}
              <strong className="text-dark">
                documento para gaveta
              </strong>.
              Aqui, cada projeto é feito pensando na realidade de quem contrata.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray">
              Com forte bagagem previdenciária, ela garante que os projetos
              da B4 tenham a profundidade que assuntos delicados exigem.
            </p>

            <div className="mt-8 space-y-3">
              {credentials.map((cred) => (
                <div key={cred.text} className="flex items-center gap-3 rounded-lg bg-white/80 border border-gray-100 p-3 shadow-sm">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <cred.icon className="text-lg" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-dark">{cred.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={CONTACT.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-secondary shadow-sm transition-all hover:border-primary hover:text-primary"
              >
                <FaLinkedinIn className="text-lg" aria-hidden="true" />
                Conectar no LinkedIn
              </a>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg"
              >
                <FaWhatsapp className="text-lg" aria-hidden="true" />
                Falar com a equipe
              </a>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
