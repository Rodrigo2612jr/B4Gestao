import Image from "next/image";
import {
  FaWhatsapp,
  FaInstagram,
  FaLinkedinIn,
  FaEnvelope,
} from "react-icons/fa";
import { HiOutlineClock } from "react-icons/hi";
import { WHATSAPP_URL, CONTACT, COMPANY } from "@/lib/constants";

const footerLinks = [
  {
    title: "Serviços",
    links: [
      { label: "PGR e PCMSO", href: "#servicos" },
      { label: "Riscos Psicossociais", href: "#servicos" },
      { label: "Saúde Mental Corporativa", href: "#servicos" },
      { label: "Gestão de Afastados", href: "#servicos" },
      { label: "eSocial SST", href: "#servicos" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Quem Somos", href: "#quem-somos" },
      { label: "Diferenciais", href: "#diferenciais" },
      { label: "Metodologia NR-01", href: "#nr01" },
      { label: "Diagnóstico Gratuito", href: "#diagnostico" },
    ],
  },
];

const socialLinks = [
  {
    icon: FaInstagram,
    href: CONTACT.instagram,
    label: "Instagram da B4 Gestão",
  },
  {
    icon: FaLinkedinIn,
    href: CONTACT.linkedin,
    label: "LinkedIn da B4 Gestão",
  },
  {
    icon: FaWhatsapp,
    href: WHATSAPP_URL,
    label: "WhatsApp da B4 Gestão",
  },
];

export default function Footer() {
  return (
    <footer id="contato" className="bg-secondary text-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand with real logo */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-white.svg"
                alt="B4 Gestão Ocupacional"
                width={500}
                height={500}
                sizes="48px"
                className="h-12 w-12 object-contain"
                quality={85}
              />
              <span className="text-lg font-bold text-white">
                Gestão Ocupacional
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/90">
              {COMPANY.tagline}. Do PGR ao cuidado com saúde
              mental, tudo com respaldo técnico.
            </p>

            {/* Social */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/90 transition-all hover:bg-primary hover:text-white"
                >
                  <social.icon className="text-lg" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <nav key={group.title} aria-label={`Links de ${group.title}`}>
              <h4 className="font-semibold text-white">{group.title}</h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/90 transition-colors hover:text-primary-light"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white">Contato</h4>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-white/90 transition-colors hover:text-primary-light"
                >
                  <FaWhatsapp className="text-lg text-primary-light flex-shrink-0" aria-hidden="true" />
                  {CONTACT.whatsapp.display}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-3 text-sm text-white/90 transition-colors hover:text-primary-light"
                >
                  <FaEnvelope className="text-lg text-primary-light flex-shrink-0" aria-hidden="true" />
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/90">
                <HiOutlineClock className="text-lg text-primary-light flex-shrink-0" aria-hidden="true" />
                {CONTACT.hours}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-white/80">
              &copy; 2026 {COMPANY.name}. Todos os
              direitos reservados.
            </p>
            <p className="text-xs text-white/80">
              Consultoria em Saúde e Segurança do Trabalho
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
