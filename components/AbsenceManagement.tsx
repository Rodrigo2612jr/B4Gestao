import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import {
  HiOutlineExclamationCircle,
  HiOutlineDocumentSearch,
  HiOutlineRefresh,
  HiOutlineTrendingDown,
} from "react-icons/hi";
import { WHATSAPP_URL } from "@/lib/constants";

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
    <section className="relative overflow-hidden bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Content */}
          <FadeIn direction="left">
            <span className="inline-block rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              Gestão Avançada
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white lg:text-4xl">
              Gestão de{" "}
              <span className="text-primary-light">Afastamentos</span>
            </h2>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Você sabe quanto custa cada dia de afastamento? Sabe quais
              são laborais e quais não são? Sabe como isso afeta o FAP?
              A B4 te ajuda a entender esses números e agir em cima deles.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl">
              <Image
                src="/images/reports-review.jpg"
                alt="Análise de relatórios de afastamento"
                width={600}
                height={400}
                className="w-full h-auto object-cover rounded-2xl"
                quality={80}
              />
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg"
            >
              Reduzir custos com afastamentos
            </a>
            <p className="mt-2 text-xs text-white/90">Sem compromisso. Atendimento direto com especialista.</p>
          </FadeIn>

          {/* Cards */}
          <FadeIn direction="right" className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((cap, i) => (
              <FadeIn
                key={cap.title}
                delay={i * 0.1}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:shadow-lg hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary-light group-hover:bg-primary group-hover:text-white transition-colors">
                  <cap.icon className="text-xl" aria-hidden="true" />
                </div>
                <h4 className="font-semibold text-white text-sm">
                  {cap.title}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-white/90">
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
