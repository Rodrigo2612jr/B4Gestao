"use client";

import { useEffect } from "react";

/** Registra o service worker do Portal AEP (escopo /aep) — torna o portal instalável. */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/aep/sw.js", { scope: "/aep" }).catch(() => {});
    }
  }, []);
  return null;
}
