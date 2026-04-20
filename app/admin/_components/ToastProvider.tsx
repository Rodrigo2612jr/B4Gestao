"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineInformationCircle } from "react-icons/hi";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  push: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let idCounter = 0;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType = "success") => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon =
            t.type === "success"
              ? HiOutlineCheckCircle
              : t.type === "error"
              ? HiOutlineExclamation
              : HiOutlineInformationCircle;
          const accent =
            t.type === "success"
              ? "border-l-green-500 text-green-600"
              : t.type === "error"
              ? "border-l-red-500 text-red-600"
              : "border-l-blue-500 text-blue-600";
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-gray-200 border-l-4 bg-white px-4 py-3 shadow-lg animate-fade-in-up ${accent}`}
              style={{ minWidth: 260, maxWidth: 400 }}
            >
              <Icon className="mt-0.5 text-xl flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-gray-800">{t.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
