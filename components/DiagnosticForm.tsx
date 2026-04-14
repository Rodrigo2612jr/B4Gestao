"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { CONTACT, EMPLOYEE_RANGES, SERVICE_NEEDS } from "@/lib/constants";

const schema = z.object({
  funcionarios: z.string().min(1, "Selecione o porte"),
  necessidade: z.string().min(1, "Selecione a necessidade"),
  regiao: z.string().min(1, "Selecione a região"),
  empresa: z.string().min(2, "Informe o nome da empresa"),
  cnpj: z.string().optional(),
  nome: z.string().min(2, "Informe seu nome"),
  telefone: z.string().min(10, "Informe um telefone válido"),
});

type FormData = z.infer<typeof schema>;

export default function DiagnosticForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    const msg = `Olá! Gostaria de um diagnóstico gratuito de SST.\n\nEmpresa: ${data.empresa}${data.cnpj ? `\nCNPJ: ${data.cnpj}` : ""}\nRegião: ${data.regiao}\nNome: ${data.nome}\nTelefone: ${data.telefone}\nPorte: ${data.funcionarios}\nNecessidade: ${data.necessidade}`;
    const url = `https://wa.me/${CONTACT.whatsapp.number}?text=${encodeURIComponent(msg)}`;
    const opened = window.open(url, "_blank");
    if (!opened) {
      // Popup bloqueado - redirecionar na mesma janela
      window.location.href = url;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="diagnostico" className="bg-white py-12 lg:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div role="status" aria-live="polite" className="hero-enter hero-delay-0 rounded-2xl bg-primary/5 p-12 shadow-lg border border-primary/10">
            <HiOutlineCheckCircle className="mx-auto text-6xl text-primary" aria-hidden="true" />
            <h3 className="mt-4 text-2xl font-bold text-secondary">
              Diagnóstico Enviado!
            </h3>
            <p className="mt-2 text-gray">
              Pronto! Seus dados foram enviados via WhatsApp.
              Um especialista da B4 vai analisar sua situação e
              retornar em até 24 horas com recomendações práticas.
            </p>
            <a
              href="#inicio"
              className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="diagnostico" className="bg-white py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {/* Left info */}
          <FadeIn direction="left">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              100% Gratuito
            </span>
            <h2 className="mt-4 text-2xl font-bold text-secondary sm:text-3xl lg:text-4xl">
              Saiba onde você está{" "}
              <span className="text-primary">vulnerável</span> antes da fiscalização
            </h2>
            <p className="mt-4 text-lg text-gray leading-relaxed">
              Preencha o formulário e receba uma análise personalizada.
              Sem custo, sem contrato, sem cobrança. Se não fizer
              sentido, sem problemas.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Panorama da situação frente à NR-01",
                "Os riscos mais críticos da operação, priorizados",
                "Recomendações práticas para aplicar imediatamente",
                "Conversa direta com especialista, não com chatbot",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <HiOutlineCheckCircle className="text-sm" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-dark">{item}</span>
                </div>
              ))}
            </div>

            {/* Urgency */}
            <div className="mt-8 rounded-xl border-l-4 border-primary bg-primary/5 p-4">
              <p className="text-sm font-medium text-secondary">
                A NR-01 já exige gestão de riscos psicossociais.
                Empresas que se adequam agora evitam multas
                e ficam à frente da fiscalização.
              </p>
            </div>

            {/* Image */}
            <div className="relative mt-8 overflow-hidden rounded-2xl hidden lg:block aspect-[3/2]">
              <Image
                src="/images/consultation.jpg"
                alt="Consulta especializada em saúde e segurança do trabalho"
                fill
                sizes="50vw"
                className="object-cover object-center rounded-2xl"
                quality={80}
              />
            </div>
          </FadeIn>

          {/* Form */}
          <FadeIn direction="right" animation="slide-up">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-2xl bg-gradient-to-br from-primary-dark to-primary p-8 shadow-xl"
              noValidate
              aria-labelledby="form-heading"
            >
              <h3 id="form-heading" className="text-lg font-bold text-white">
                Solicite seu diagnóstico gratuito
              </h3>
              <p className="text-xs text-white/70 mt-1 mb-6">Leva menos de 1 minuto. Resposta em até 24h.</p>

              <div className="space-y-4">
                {/* Campos fáceis primeiro (dropdowns) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Funcionários */}
                  <div>
                    <label
                      htmlFor="funcionarios"
                      className="mb-1.5 block text-sm font-medium text-white"
                    >
                      Nº de Funcionários <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="funcionarios"
                      {...register("funcionarios")}
                      aria-required="true"
                      aria-invalid={!!errors.funcionarios}
                      aria-describedby={errors.funcionarios ? "func-error" : undefined}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-white/40"
                    >
                      <option value="" className="text-dark">Selecione...</option>
                      {EMPLOYEE_RANGES.map((range) => (
                        <option key={range} value={range} className="text-dark">
                          {range}
                        </option>
                      ))}
                    </select>
                    {errors.funcionarios && (
                      <p id="func-error" className="mt-1 text-xs text-red-500" role="alert">
                        {errors.funcionarios.message}
                      </p>
                    )}
                  </div>

                  {/* Necessidade */}
                  <div>
                    <label
                      htmlFor="necessidade"
                      className="mb-1.5 block text-sm font-medium text-white"
                    >
                      O que mais preocupa hoje? <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="necessidade"
                      {...register("necessidade")}
                      aria-required="true"
                      aria-invalid={!!errors.necessidade}
                      aria-describedby={errors.necessidade ? "need-error" : undefined}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-white/40"
                    >
                      <option value="" className="text-dark">Selecione...</option>
                      {SERVICE_NEEDS.map((need) => (
                        <option key={need} value={need} className="text-dark">
                          {need}
                        </option>
                      ))}
                    </select>
                    {errors.necessidade && (
                      <p id="need-error" className="mt-1 text-xs text-red-500" role="alert">
                        {errors.necessidade.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Região */}
                <div>
                  <label
                    htmlFor="regiao"
                    className="mb-1.5 block text-sm font-medium text-white"
                  >
                    Região <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="regiao"
                    {...register("regiao")}
                    aria-required="true"
                    aria-invalid={!!errors.regiao}
                    aria-describedby={errors.regiao ? "regiao-error" : undefined}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-white/40"
                  >
                    <option value="" className="text-dark">Selecione...</option>
                    <option value="São Paulo Capital" className="text-dark">São Paulo Capital</option>
                    <option value="São Paulo Interior" className="text-dark">São Paulo Interior</option>
                    <option value="Rio de Janeiro" className="text-dark">Rio de Janeiro</option>
                    <option value="Minas Gerais" className="text-dark">Minas Gerais</option>
                    <option value="Sul (PR, SC, RS)" className="text-dark">Sul (PR, SC, RS)</option>
                    <option value="Nordeste" className="text-dark">Nordeste</option>
                    <option value="Centro-Oeste" className="text-dark">Centro-Oeste</option>
                    <option value="Norte" className="text-dark">Norte</option>
                    <option value="Outro" className="text-dark">Outro</option>
                  </select>
                  {errors.regiao && (
                    <p id="regiao-error" className="mt-1 text-xs text-red-500" role="alert">
                      {errors.regiao.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Empresa */}
                  <div>
                    <label
                      htmlFor="empresa"
                      className="mb-1.5 block text-sm font-medium text-white"
                    >
                      Nome da Empresa <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="empresa"
                      {...register("empresa")}
                      aria-required="true"
                      aria-invalid={!!errors.empresa}
                      aria-describedby={errors.empresa ? "empresa-error" : undefined}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-white/40"
                      placeholder="Ex: Empresa XYZ Ltda"
                    />
                    {errors.empresa && (
                      <p id="empresa-error" className="mt-1 text-xs text-red-500" role="alert">
                        {errors.empresa.message}
                      </p>
                    )}
                  </div>

                  {/* CNPJ (opcional) */}
                  <div>
                    <label
                      htmlFor="cnpj"
                      className="mb-1.5 block text-sm font-medium text-white"
                    >
                      CNPJ <span className="text-xs text-white/50">(opcional)</span>
                    </label>
                    <input
                      id="cnpj"
                      {...register("cnpj")}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-white/40"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                {/* Nome */}
                <div>
                  <label
                    htmlFor="nome"
                    className="mb-1.5 block text-sm font-medium text-white"
                  >
                    Seu Nome <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="nome"
                    {...register("nome")}
                    aria-required="true"
                    aria-invalid={!!errors.nome}
                    aria-describedby={errors.nome ? "nome-error" : undefined}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-white/40"
                    placeholder="Ex: Maria Silva"
                  />
                  {errors.nome && (
                    <p id="nome-error" className="mt-1 text-xs text-red-500" role="alert">
                      {errors.nome.message}
                    </p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label
                    htmlFor="telefone"
                    className="mb-1.5 block text-sm font-medium text-white"
                  >
                    WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="telefone"
                    {...register("telefone")}
                    type="tel"
                    aria-required="true"
                    aria-invalid={!!errors.telefone}
                    aria-describedby={errors.telefone ? "telefone-error" : undefined}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-white/40"
                    placeholder="(11) 99999-9999"
                  />
                  <p className="mt-1 text-xs text-white/50">Usado apenas para contato. Sem spam.</p>
                  {errors.telefone && (
                    <p id="telefone-error" className="mt-1 text-xs text-red-500" role="alert">
                      {errors.telefone.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-6 py-4 text-base font-bold text-secondary shadow-lg transition-all hover:bg-accent-dark hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaWhatsapp className="text-xl" aria-hidden="true" />
                {isSubmitting ? "Enviando..." : "Quero meu diagnóstico gratuito"}
              </button>
              <p className="mt-3 text-center text-xs text-white/60">
                Enviado direto via WhatsApp. Sem spam. Atendimento por profissionais reais.
              </p>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
