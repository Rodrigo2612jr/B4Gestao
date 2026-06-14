"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HiOutlineChatAlt2 } from "react-icons/hi";

interface ChatMsg {
  id: string;
  author_name: string | null;
  author_role: string | null;
  body: string;
  kind: string;
  created_at: string;
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function AepChat({
  assessmentId,
  myActorRole,
  pollMs = 4000,
}: {
  assessmentId: string;
  myActorRole: "TECNICO" | "SUPERVISOR" | "ADMIN";
  pollMs?: number;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const after = lastIdRef.current ? `?after=${lastIdRef.current}` : "";
      const res = await fetch(`/api/aep/${assessmentId}/chat${after}`);
      if (!res.ok) return;
      const incoming = (await res.json()) as ChatMsg[];
      if (incoming.length > 0) {
        lastIdRef.current = incoming[incoming.length - 1].id;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const fresh = incoming.filter((m) => !seen.has(m.id));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
        scrollToBottom();
      }
    } catch {
      /* silencioso */
    }
  }, [assessmentId, scrollToBottom]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, pollMs);
    return () => clearInterval(t);
  }, [poll, pollMs]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/aep/${assessmentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setText("");
        await poll();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <HiOutlineChatAlt2 className="text-lg text-primary" />
        <h3 className="text-sm font-semibold text-secondary">Conversa técnico ↔ supervisor</h3>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4" style={{ minHeight: 200, maxHeight: 460 }}>
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">Nenhuma mensagem ainda. Use o chat para alinhar a avaliação.</p>
        ) : (
          messages.map((m) => {
            if (m.kind === "status" || m.kind === "rejection") {
              return (
                <div key={m.id} className="my-2 text-center">
                  <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-medium ${m.kind === "rejection" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {m.body}
                  </span>
                  <div className="mt-0.5 text-[10px] text-gray-400">{m.author_name} · {fmtTime(m.created_at)}</div>
                </div>
              );
            }
            const mine = m.author_role === myActorRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-gray-100 text-gray-800"}`}>
                  {!mine && (
                    <div className="mb-0.5 text-[11px] font-semibold opacity-70">
                      {m.author_name} · {m.author_role === "SUPERVISOR" ? "Supervisor" : m.author_role === "TECNICO" ? "Técnico" : "Admin"}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <div className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>{fmtTime(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-gray-100 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Escreva uma mensagem…"
          className="max-h-28 flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
