"use client";

import { useState, useEffect } from "react";
const LGPD_KEY = "b4-lgpd-consent";

export default function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(LGPD_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on initial load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(LGPD_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(LGPD_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies e privacidade"
      className="hero-enter fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white p-4 shadow-2xl sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:rounded-2xl sm:border"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-bold text-secondary">
            Privacidade e Cookies
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-gray">
            Este site utiliza cookies para melhorar sua experiência.
            Ao continuar, você concorda com nossa{" "}
            {/* TODO: Substituir # pelo link real da política de privacidade */}
            <a href="#" className="underline text-primary hover:text-primary-dark">
              política de privacidade
            </a>{" "}
            conforme a LGPD (Lei nº 13.709/2018).
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={accept}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Aceitar cookies
          </button>
          <button
            onClick={decline}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-secondary transition-colors hover:bg-gray-50"
          >
            Apenas essenciais
          </button>
        </div>
      </div>
    </div>
  );
}
