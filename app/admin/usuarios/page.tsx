"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineUserAdd,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineUsers,
} from "react-icons/hi";
import AdminShell from "../_components/AdminShell";
import PageHeader from "../_components/PageHeader";
import { useToast } from "../_components/ToastProvider";

const ROLES = ["ADMIN", "SST", "RH", "JURIDICO", "TECNICO", "SUPERVISOR"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  SST: "SST",
  RH: "RH",
  JURIDICO: "Jurídico",
  TECNICO: "Técnico (AEP)",
  SUPERVISOR: "Supervisor (AEP)",
};

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  must_change_password: boolean;
  access_expires_at: string | null;
  locked_until: string | null;
  last_login: string | null;
  created_at: string;
}

export default function UsuariosPage() {
  return (
    <AdminShell title="Equipe & Acessos">
      <Inner />
    </AdminShell>
  );
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

function Inner() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { push } = useToast();

  // form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("TECNICO");
  const [validDays, setValidDays] = useState<string>("90");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      push("Erro ao carregar usuários (apenas administradores têm acesso)", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setInviteLink(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          validDays: validDays ? parseInt(validDays, 10) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInviteLink(data.inviteUrl);
        push("Usuário criado. Copie o link de ativação e envie ao colaborador.", "success");
        setName("");
        setEmail("");
        setRole("TECNICO");
        setShowForm(false);
        load();
      } else {
        push(data.error || "Erro ao criar usuário", "error");
      }
    } catch {
      push("Erro de conexão", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const patch = async (body: Record<string, unknown>, okMsg: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.inviteUrl) setInviteLink(data.inviteUrl);
        push(okMsg, "success");
        load();
      } else {
        push(data.error || "Erro", "error");
      }
    } catch {
      push("Erro de conexão", "error");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Equipe & Acessos"
        subtitle="Crie acessos por papel, gere links de ativação (senha temporária) e revogue acessos a qualquer momento."
        breadcrumbs={[{ label: "Painel B4", href: "/admin" }, { label: "Equipe" }]}
        actions={
          <button
            onClick={() => { setShowForm((v) => !v); setInviteLink(null); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark"
          >
            <HiOutlineUserAdd className="text-base" /> Novo acesso
          </button>
        }
      />

      {inviteLink && <InviteBox url={inviteLink} onClose={() => setInviteLink(null)} />}

      {showForm && (
        <form onSubmit={createUser} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Criar acesso</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            O sistema gera um <strong>link de ativação de uso único</strong> — o colaborador define a própria senha. Você nunca digita nem vê a senha dele.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Papel</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Validade do acesso (dias)</label>
              <input type="number" min={1} max={3650} value={validDays} onChange={(e) => setValidDays(e.target.value)}
                placeholder="vazio = sem expiração"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              <p className="mt-1 text-[11px] text-gray-400">Recomendado para técnicos de campo (ex.: 90). Deixe vazio para acesso permanente (equipe interna).</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
              {submitting ? "Criando…" : "Criar e gerar link"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">
          <HiOutlineUsers className="text-gray-400" /> Usuários ({users.length})
        </div>
        {loading ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">Nenhum usuário ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-2.5 font-semibold">Usuário</th>
                  <th className="px-3 py-2.5 font-semibold">Papel</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Validade</th>
                  <th className="px-3 py-2.5 font-semibold">Último acesso</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const expired = u.access_expires_at && new Date(u.access_expires_at) < new Date();
                  return (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">{ROLE_LABEL[u.role] ?? u.role}</span>
                      </td>
                      <td className="px-3 py-3">
                        {!u.is_active ? (
                          <Badge tone="gray">Desativado</Badge>
                        ) : expired ? (
                          <Badge tone="red">Expirado</Badge>
                        ) : u.must_change_password ? (
                          <Badge tone="amber">Pendente ativação</Badge>
                        ) : (
                          <Badge tone="emerald">Ativo</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{fmtDate(u.access_expires_at)}</td>
                      <td className="px-3 py-3 text-gray-600">{fmtDate(u.last_login)}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <RowBtn onClick={() => patch({ userId: u.id, action: "regenerate_invite" }, "Novo link de ativação gerado")}>Gerar link</RowBtn>
                          {u.is_active ? (
                            <RowBtn tone="red" onClick={() => patch({ userId: u.id, action: "deactivate" }, "Acesso desativado")}>Desativar</RowBtn>
                          ) : (
                            <RowBtn tone="emerald" onClick={() => patch({ userId: u.id, action: "reactivate" }, "Acesso reativado")}>Reativar</RowBtn>
                          )}
                          <RowBtn onClick={() => patch({ userId: u.id, action: "set_expiry", expiresAt: new Date(Date.now() + 90 * 864e5).toISOString() }, "Validade renovada (+90 dias)")}>+90d</RowBtn>
                          <RowBtn onClick={() => patch({ userId: u.id, action: "set_expiry", expiresAt: null }, "Expiração removida")}>Sem exp.</RowBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "amber" | "red" | "gray"; children: React.ReactNode }) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${map[tone]}`}>{children}</span>;
}

function RowBtn({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: "red" | "emerald" }) {
  const cls =
    tone === "red"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : tone === "emerald"
      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      : "border-gray-200 text-gray-600 hover:bg-gray-50";
  return (
    <button onClick={onClick} className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${cls}`}>
      {children}
    </button>
  );
}

function InviteBox({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Link de ativação gerado</h3>
          <p className="mt-0.5 text-xs text-gray-600">
            Envie este link ao colaborador (WhatsApp/pessoalmente). É de <strong>uso único</strong> e expira. Ao abrir, ele define a própria senha.
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-700">fechar</button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input readOnly value={url} className="w-full truncate rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700" />
        <button onClick={copy} className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark">
          {copied ? <><HiOutlineCheck /> Copiado</> : <><HiOutlineClipboardCopy /> Copiar</>}
        </button>
      </div>
    </div>
  );
}
