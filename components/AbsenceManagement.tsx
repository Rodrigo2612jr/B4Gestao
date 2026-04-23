import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import {
  HiOutlineExclamationCircle,
  HiOutlineDocumentSearch,
  HiOutlineRefresh,
  HiOutlineTrendingDown,
} from "react-icons/hi";
const capabilities = [
  {
    icon: HiOutlineExclamationCircle,
    title: "Gestão de CID F",
    desc: "Gerenciamento de afastamentos por transtornos mentais e comportamentais, que são os que mais crescem no Brasil.",
  },
  {
    icon: HiOutlineDocumentSearch,
    title: "Análise de Nexo Causal",
    desc: "Determinação técnica se o afastamento é laboral ou não, com laudos bem fundamentados.",
  },
  {
    icon: HiOutlineRefresh,
    title: "Protocolos de Retorno",
    desc: "Plano de retorno ao trabalho estruturado, sem devolver o colaborador sem preparo.",
  },
  {
    icon: HiOutlineTrendingDown,
    title: "Redução de Custos",
    desc: "Mensuramos o impacto do presenteísmo e do absenteísmo na folha de pagamento e no FAP da empresa.",
  },
];

export default function AbsenceManagement() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/[0.04] via-white to-primary/[0.06] py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-center">
          {/* Content */}
          <FadeIn direction="left">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Gestão Avançada
            </span>
            <h2 className="mt-4 text-2xl font-bold text-secondary sm:text-3xl lg:text-4xl">
              Gestão de{" "}
              <span className="text-primary">Afastamentos</span>
            </h2>
            <p className="mt-4 text-lg text-gray leading-relaxed">
              Você sabe quanto custa cada dia de afastamento? Sabe quais
              são laborais e quais não são? Sabe como isso afeta o FAP?
              A B4 te ajuda a entender esses números e agir em cima deles.
            </p>

            <div className="relative mt-6 overflow-hidden rounded-2xl aspect-[3/2]">
              <Image
                src="/images/reports-review.jpg"
                alt="Análise de relatórios de afastamento"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center rounded-2xl"
                quality={80}
              />
            </div>

            <a
              href="#avaliacao"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg"
            >
              Reduzir custos com afastamentos
            </a>
            <p className="mt-2 text-xs text-gray">Sem compromisso. Atendimento direto com especialista.</p>
          </FadeIn>

          {/* Cards */}
          <FadeIn direction="right" className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((cap, i) => (
              <FadeIn
                key={cap.title}
                delay={i * 0.1}
                className="group rounded-xl bg-primary-dark p-5 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-primary-light group-hover:bg-accent group-hover:text-secondary transition-colors">
                  <cap.icon className="text-xl" aria-hidden="true" />
                </div>
                <h4 className="font-semibold text-white text-sm">
                  {cap.title}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-white/80">
                  {cap.desc}
                </p>
              </FadeIn>
            ))}
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
